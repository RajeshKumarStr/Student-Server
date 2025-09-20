import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Staff from '../models/Staff.js';

const router = express.Router();

// Login
router.post('/login', async (req, res, next) => {
	try {
		const { username, password, role } = req.body;

		console.log('Login attempt:', { username, password, role });

		if (!username || !password || !role) {
			return res.status(400).json({ message: 'Username, password, and role are required.' });
		}

		// Find user by username and role
		const user = await User.findOne({ username, role, isActive: true }).populate('profileId');
		console.log('User found:', user ? 'Yes' : 'No');
		
		if (!user) {
			// Check if user exists but with different role
			const userExists = await User.findOne({ username, isActive: true });
			if (userExists) {
				console.log('User exists but with role:', userExists.role);
			}
			return res.status(401).json({ message: 'Invalid credentials.' });
		}

		// Verify password
		console.log('Comparing password:', password, 'with stored hash');
		const isMatch = await user.comparePassword(password);
		console.log('Password match:', isMatch);
		
		if (!isMatch) {
			return res.status(401).json({ message: 'Invalid credentials.' });
		}

		// Generate JWT token
		const token = jwt.sign(
			{ userId: user._id, role: user.role },
			process.env.JWT_SECRET || 'your-secret-key',
			{ expiresIn: '24h' }
		);

		res.json({
			token,
			user: {
				id: user._id,
				role: user.role,
				profile: user.profileId
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		next(error);
	}
});

// Register student (for initial setup)
router.post('/register-student', async (req, res, next) => {
	try {
		const { enrollmentNumber, name, email, dateOfBirth, course, year, phone, address, parentName, parentPhone } = req.body;

		// Check if student already exists
		const existingStudent = await Student.findOne({ enrollmentNumber });
		if (existingStudent) {
			return res.status(400).json({ message: 'Student already exists.' });
		}

		// Create student
		const student = await Student.create({
			enrollmentNumber,
			name,
			email,
			dateOfBirth,
			course,
			year,
			phone,
			address,
			parentName,
			parentPhone
		});

		// Create user account
		const user = await User.create({
			username: enrollmentNumber,
			password: dateOfBirth, // DOB as password
			role: 'student',
			profileId: student._id
		});

		res.status(201).json({ message: 'Student registered successfully.' });
	} catch (error) {
		next(error);
	}
});

// Register staff (for initial setup)
router.post('/register-staff', async (req, res, next) => {
	try {
		const { staffId, name, email, department, designation, phone, dateOfBirth } = req.body;

		// Check if staff already exists
		const existingStaff = await Staff.findOne({ staffId });
		if (existingStaff) {
			return res.status(400).json({ message: 'Staff already exists.' });
		}

		// Create staff
		const staff = await Staff.create({
			staffId,
			name,
			email,
			department,
			designation,
			phone,
			dateOfBirth
		});

		// Create user account
		const user = await User.create({
			username: staffId,
			password: dateOfBirth, // DOB as password
			role: 'staff',
			profileId: staff._id
		});

		res.status(201).json({ message: 'Staff registered successfully.' });
	} catch (error) {
		next(error);
	}
});

// Create super admin (for initial setup)
router.post('/create-superadmin', async (req, res, next) => {
	try {
		const { username, password, name, email } = req.body;

		// Check if super admin already exists
		const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
		if (existingSuperAdmin) {
			return res.status(400).json({ message: 'Super admin already exists.' });
		}

		// Create super admin user (no profile needed)
		const user = await User.create({
			username,
			password,
			role: 'superadmin',
			profileId: null // Super admin doesn't need a profile
		});

		res.status(201).json({ message: 'Super admin created successfully.' });
	} catch (error) {
		next(error);
	}
});

export default router;
