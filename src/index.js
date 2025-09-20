import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import studentsRouter from './routes/students.js';
import authRouter from './routes/auth.js';
import staffRouter from './routes/staff.js';
import studentRouter from './routes/student.js';
import superadminRouter from './routes/superadmin.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));

// Health check
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/student', studentRouter);
app.use('/api/superadmin', superadminRouter);

// Not found and error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
	try {
		const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Student';
		await mongoose.connect(mongoUri, {
			serverSelectionTimeoutMS: 10000,
		});
		console.log('Connected to MongoDB');
		app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
	} catch (err) {
		console.error('Failed to start server:', err);
		process.exit(1);
	}
}

start();
