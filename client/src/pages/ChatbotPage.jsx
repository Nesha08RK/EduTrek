import React from 'react';
import Chatbot from '../components/Chatbot';

export default function ChatbotPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 w-full">
      {/* Header */}
      <div className="w-full px-6 text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">AI Learning Assistant</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Get instant help with course navigation, payment questions, progress tracking, and more. 
          Our AI assistant is here to make your learning journey smoother!
        </p>
      </div>

      {/* 🔥 Full-width White Container for Chatbot */}
      <div className="w-full bg-white shadow-lg px-6 py-10">
        <Chatbot />
      </div>

      {/* FAQ Section */}
      <div className="mt-12 w-full px-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Frequently Asked Questions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-slate-900 mb-2">How do I enroll in a course?</h3>
            <p className="text-slate-600">Browse courses on the homepage, click on any course card, and press the "Enroll" button to get started.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-slate-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-slate-600">We accept Stripe, Razorpay, and PayPal. Choose your preferred method during checkout.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-slate-900 mb-2">How do I track my progress?</h3>
            <p className="text-slate-600">Visit your dashboard to see progress bars for each enrolled course and completion percentages.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-slate-900 mb-2">When do I get my certificate?</h3>
            <p className="text-slate-600">Certificates are automatically generated when you complete 100% of a course. Download them from your dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
