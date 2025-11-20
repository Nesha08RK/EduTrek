import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import quizRoutes from './routes/quizRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
// Serve uploaded files
const uploadsPath = path.join(path.resolve(), 'uploads');
app.use('/uploads', express.static(uploadsPath));
app.use(morgan('dev'));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/quiz', quizRoutes);

app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', service: 'edutrek-api' });
});

async function start() {
	try {
		const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edutrek';
		await mongoose.connect(uri, { dbName: 'EduTrek' });
		console.log('MongoDB connected');
		const io = new SocketIOServer(server, { cors: { origin: CORS_ORIGIN, credentials: true } });
		io.on('connection', (socket) => {
			console.log('socket connected', socket.id);
			socket.on('chat:message', (msg) => {
				io.emit('chat:message', { from: socket.id, text: msg });
			});
		});
		server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
	} catch (err) {
		console.error('Failed to start server', err);
		process.exit(1);
	}
}

start();
