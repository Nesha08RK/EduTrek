import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const canvasRef = useRef(null);

  const features = [
    { icon: '🎓', title: 'Learn Anything', description: 'Access thousands of courses across programming, design, business, and more.' },
    { icon: '🎮', title: 'Interactive Games', description: 'Enhance your learning with brain games and cognitive exercises.' },
    { icon: '🤖', title: 'AI Assistant', description: 'Get instant help with our intelligent chatbot for course navigation.' },
    { icon: '📊', title: 'Track Progress', description: 'Monitor your learning journey with detailed analytics and certificates.' }
  ];

  const courses = [
    { id: 1, title: 'React Fundamentals', instructor: 'John Doe', rating: 4.8, students: 1247, price: 49, image: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=React' },
    { id: 2, title: 'Advanced JavaScript', instructor: 'Jane Smith', rating: 4.9, students: 892, price: 59, image: 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=JavaScript' },
    { id: 3, title: 'UI/UX Design Masterclass', instructor: 'Mike Johnson', rating: 4.7, students: 1563, price: 79, image: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Design' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particlesArray = [];
    const numberOfParticles = 100;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }
      draw() {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.8)'; // Light blue color
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function init() {
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    }

    function connect() {
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 100) {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'; // Dark blue background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      connect();
      requestAnimationFrame(animate);
    }

    init();
    animate();

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    return () => {
      window.removeEventListener('resize', () => {});
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0"></canvas>
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center text-center px-6 pt-20">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
          Learn Anything, Anywhere
        </h1>
        <p className="mt-4 text-slate-300 text-lg mb-8 max-w-3xl">
          Join thousands of learners worldwide. Master new skills with our interactive courses,
          play brain games, and get help from our AI assistant.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link to="/courses" className="rounded-md bg-cyan-500 px-8 py-4 text-white font-semibold hover:bg-cyan-400 transition text-lg">
            Explore Courses
          </Link>
          <Link to="/games" className="rounded-md bg-slate-800 px-8 py-4 text-white font-semibold ring-1 ring-slate-700 hover:bg-slate-700 transition text-lg">
            Play Games
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-6xl">
          <div className="text-center"><div className="text-3xl font-bold text-white">10K+</div><div className="text-slate-300">Students</div></div>
          <div className="text-center"><div className="text-3xl font-bold text-white">500+</div><div className="text-slate-300">Courses</div></div>
          <div className="text-center"><div className="text-3xl font-bold text-white">50+</div><div className="text-slate-300">Instructors</div></div>
          <div className="text-center"><div className="text-3xl font-bold text-white">4.8</div><div className="text-slate-300">Rating</div></div>
        </div>
      </section>
      <section className="relative z-10 bg-white/90 py-20 w-full">
        <div className="w-full px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose EduTrek?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Our platform combines traditional learning with modern technology to create
              an engaging and effective educational experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:bg-slate-50 transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
     
      <section className="relative z-10 bg-cyan-500/90 py-20 w-full">
        <div className="w-full max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Learning?</h2>
          <p className="text-cyan-100 text-lg mb-8">Join thousands of learners and start your educational journey today</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/student-dashboard" className="bg-white text-cyan-500 px-8 py-4 rounded-lg font-semibold hover:bg-slate-100 transition">
              Get Started
            </Link>
            <Link to="/chatbot" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-cyan-500 transition">
              Ask AI Assistant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}