import React, { useEffect, useRef } from "react";

export default function AnimatedBackground() {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");

		let animationFrameId;
		let width = (canvas.width = window.innerWidth);
		let height = (canvas.height = window.innerHeight);

		const particles = Array.from({ length: 80 }, () => ({
			x: Math.random() * width,
			y: Math.random() * height,
			vx: (Math.random() - 0.5) * 0.7,
			vy: (Math.random() - 0.5) * 0.7,
			size: 1 + Math.random() * 2,
		}));

		function draw() {
			ctx.clearRect(0, 0, width, height);

			const g = ctx.createLinearGradient(0, 0, width, height);
			g.addColorStop(0, "#0f172a");
			g.addColorStop(1, "#020617");
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, width, height);

			ctx.fillStyle = "rgba(56,189,248,0.9)";
			for (const p of particles) {
				p.x += p.vx;
				p.y += p.vy;
				if (p.x < 0 || p.x > width) p.vx *= -1;
				if (p.y < 0 || p.y > height) p.vy *= -1;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				ctx.fill();
			}

			ctx.strokeStyle = "rgba(59,130,246,0.15)";
			for (let i = 0; i < particles.length; i++) {
				for (let j = i + 1; j < particles.length; j++) {
					const a = particles[i];
					const b = particles[j];
					const dx = a.x - b.x;
					const dy = a.y - b.y;
					const dist = Math.hypot(dx, dy);
					if (dist < 140) {
						ctx.globalAlpha = 1 - dist / 140;
						ctx.beginPath();
						ctx.moveTo(a.x, a.y);
						ctx.lineTo(b.x, b.y);
						ctx.stroke();
						ctx.globalAlpha = 1;
					}
				}
			}

			animationFrameId = requestAnimationFrame(draw);
		}

		function handleResize() {
			width = (canvas.width = window.innerWidth);
			height = (canvas.height = window.innerHeight);
		}

		draw();
		window.addEventListener("resize", handleResize);
		return () => {
			cancelAnimationFrame(animationFrameId);
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
}

