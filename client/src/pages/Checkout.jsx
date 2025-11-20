import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';

export default function Checkout() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('stripe');
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/login', { state: { from: `/checkout/${id}` } });
            return;
        }
        
        fetchCourseDetails();
    }, [id, token]);

    const fetchCourseDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/courses/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCourse(data.course);
                setError(null);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to load course details');
            }
        } catch (error) {
            console.error('Error fetching course details:', error);
            setError('Network error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!course || !user) return;
        
        setProcessingPayment(true);
        try {
            // Create payment intent with selected payment method
            const paymentEndpoint = `${API_BASE}/api/payments/${paymentMethod}`;
            const response = await fetch(paymentEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: course.price,
                    courseId: course._id
                })
            });

            if (response.ok) {
                const paymentData = await response.json();
                
                // Simulate successful payment processing
                setTimeout(() => {
                    // After payment is processed, enroll in the course
                    enrollInCourse();
                }, 1500);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Payment processing failed');
                setProcessingPayment(false);
            }
        } catch (error) {
            console.error('Payment error:', error);
            setError('Payment processing failed. Please try again.');
            setProcessingPayment(false);
        }
    };

    const enrollInCourse = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/courses/${id}/enroll`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Show success message with toast notification
                const successMessage = document.createElement('div');
                successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out';
                successMessage.textContent = 'Payment successful! You are now enrolled in the course.';
                document.body.appendChild(successMessage);
                
                // Remove the message after 3 seconds and redirect
                setTimeout(() => {
                    document.body.removeChild(successMessage);
                    navigate('/student-dashboard');
                }, 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Enrollment failed after payment');
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            setError('Enrollment failed after payment. Please contact support.');
        } finally {
            setProcessingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading checkout...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                    <div className="text-red-500 text-center text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-center mb-4">Error</h2>
                    <p className="text-slate-600 text-center mb-6">{error}</p>
                    <div className="flex justify-center">
                        <button 
                            onClick={fetchCourseDetails}
                            className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                    <div className="text-yellow-500 text-center text-5xl mb-4">🔍</div>
                    <h2 className="text-2xl font-bold text-center mb-4">Course Not Found</h2>
                    <p className="text-slate-600 text-center mb-6">We couldn't find the course you're looking for.</p>
                    <div className="flex justify-center">
                        <Link 
                            to="/courses"
                            className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition"
                        >
                            Browse Courses
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-slate-900 mb-8 text-center">Checkout</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Order Summary */}
                    <div className="md:col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow mb-6">
                            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                            <div className="flex items-start mb-4">
                                <img 
                                    src={course.thumbnailUrl || `https://via.placeholder.com/80x80/3B82F6/FFFFFF?text=${encodeURIComponent(course.title.charAt(0))}`} 
                                    alt={course.title} 
                                    className="w-20 h-20 object-cover rounded mr-4" 
                                />
                                <div>
                                    <h3 className="font-medium">{course.title}</h3>
                                    <p className="text-sm text-slate-500">by {course.instructor?.name || 'Unknown Instructor'}</p>
                                </div>
                            </div>
                            <div className="border-t border-slate-200 pt-4 mt-4">
                                <div className="flex justify-between mb-2">
                                    <span>Course Price</span>
                                    <span>${course.price}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>${course.price}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                            <div className="space-y-3">
                                <label className="flex items-center p-4 border rounded cursor-pointer hover:bg-slate-50 transition">
                                    <input 
                                        type="radio" 
                                        name="payment" 
                                        value="stripe" 
                                        checked={paymentMethod === 'stripe'}
                                        onChange={() => setPaymentMethod('stripe')}
                                        className="mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">Credit/Debit Card</div>
                                        <div className="text-sm text-slate-500">Pay securely with your card</div>
                                    </div>
                                    <div className="text-slate-400">
                                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22 4H2C0.9 4 0 4.9 0 6V18C0 19.1 0.9 20 2 20H22C23.1 20 24 19.1 24 18V6C24 4.9 23.1 4 22 4ZM22 18H2V6H22V18Z" />
                                            <path d="M3 11H21V13H3V11Z" />
                                        </svg>
                                    </div>
                                </label>
                                
                                <label className="flex items-center p-4 border rounded cursor-pointer hover:bg-slate-50 transition">
                                    <input 
                                        type="radio" 
                                        name="payment" 
                                        value="paypal" 
                                        checked={paymentMethod === 'paypal'}
                                        onChange={() => setPaymentMethod('paypal')}
                                        className="mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">PayPal</div>
                                        <div className="text-sm text-slate-500">Pay with your PayPal account</div>
                                    </div>
                                    <div className="text-blue-500">
                                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7.076 21.337H2.47a0.641 0.641 0 0 1-0.633-0.74L4.944 3.384a0.641 0.641 0 0 1 0.632-0.543h6.012c2.658 0 4.53 0.587 5.552 1.74 0.9 1.016 1.227 2.345 0.977 3.968-0.015 0.096-0.033 0.19-0.056 0.283-0.359 1.417-1.096 2.587-2.194 3.471-1.106 0.892-2.542 1.425-4.258 1.586-0.115 0.01-0.231 0.016-0.346 0.023h-0.004c-0.119 0.006-0.237 0.011-0.356 0.011H6.576l-0.38 2.126c-0.105 0.583 0.325 1.126 0.919 1.126h4.38c0.616 0 1.142-0.435 1.262-1.039l0.052-0.196 0.998-6.241 0.064-0.35c0.12-0.603 0.646-1.038 1.262-1.038h0.792c2.632 0 4.7-1.049 5.3-4.087 0.256-1.296 0.124-2.377-0.552-3.137-0.675-0.76-1.87-1.165-3.451-1.165H9.053c-0.618 0-1.145 0.437-1.264 1.043L6.5 6.5" />
                                        </svg>
                                    </div>
                                </label>
                                
                                <label className="flex items-center p-4 border rounded cursor-pointer hover:bg-slate-50 transition">
                                    <input 
                                        type="radio" 
                                        name="payment" 
                                        value="razorpay" 
                                        checked={paymentMethod === 'razorpay'}
                                        onChange={() => setPaymentMethod('razorpay')}
                                        className="mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">Razorpay</div>
                                        <div className="text-sm text-slate-500">Pay using UPI, Netbanking, etc.</div>
                                    </div>
                                    <div className="text-blue-800">
                                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 6V21H4V6H8Z" />
                                            <path d="M14 6V21H10V6H14Z" />
                                            <path d="M15 3V21H19V3H15Z" />
                                        </svg>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* Payment Summary */}
                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow sticky top-24">
                            <h2 className="text-xl font-semibold mb-4">Summary</h2>
                            <div className="border-b border-slate-200 pb-4 mb-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-slate-600">Original Price</span>
                                    <span>${course.price}</span>
                                </div>
                            </div>
                            <div className="flex justify-between font-bold text-lg mb-6">
                                <span>Total</span>
                                <span>${course.price}</span>
                            </div>
                            <button
                                onClick={handlePayment}
                                disabled={processingPayment}
                                className="w-full bg-cyan-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {processingPayment ? 'Processing...' : 'Complete Payment'}
                            </button>
                            <p className="text-xs text-center text-slate-500 mt-4">
                                By completing your purchase you agree to our Terms of Service and Privacy Policy
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}