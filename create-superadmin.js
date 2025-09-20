import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function createSuperAdmin() {
	try {
		// Connect to MongoDB
		const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Student';
		await mongoose.connect(mongoUri, {
			serverSelectionTimeoutMS: 5000,
		});
		console.log('Connected to MongoDB');

		// Check if super admin already exists
		const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
		if (existingSuperAdmin) {
			console.log('Super admin already exists:', existingSuperAdmin.username);
			process.exit(0);
		}

		// Create super admin
		const superAdmin = await User.create({
			username: 'admin',
			password: 'admin123', // Change this in production
			role: 'superadmin',
			profileId: null
		});

		console.log('Super admin created successfully!');
		console.log('Username: admin');
		console.log('Password: admin123');
		console.log('Please change the password after first login.');

		process.exit(0);
	} catch (error) {
		console.error('Error creating super admin:', error);
		console.log('Make sure MongoDB is running on your system.');
		process.exit(1);
	}
}

createSuperAdmin();
