import express from 'express';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Staff from '../models/Staff.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require super admin authentication
router.use(authenticate);
router.use(authorize(['superadmin']));

// Get all users (students and staff)
router.get('/users', async (req, res, next) => {
	try {
		const { role, isActive } = req.query;
		const filter = {};
		
		// Only filter by isActive if explicitly provided
		if (isActive !== undefined) {
			filter.isActive = isActive === 'true';
		}
		
		if (role) filter.role = role;

		console.log('Super admin fetching users with filter:', filter);

		const users = await User.find(filter)
			.populate('profileId')
			.select('-password')
			.sort({ createdAt: -1 });
		
		console.log(`Found ${users.length} users`);
		res.json(users);
	} catch (err) {
		console.error('Error fetching users:', err);
		next(err);
	}
});

// Get single user
router.get('/users/:id', async (req, res, next) => {
	try {
		const user = await User.findById(req.params.id)
			.populate('profileId')
			.select('-password');
		if (!user) return res.status(404).json({ message: 'User not found' });
		res.json(user);
	} catch (err) {
		next(err);
	}
});

// Create student
router.post('/students', async (req, res, next) => {
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

		res.status(201).json({ student, user: { id: user._id, role: user.role } });
	} catch (err) {
		next(err);
	}
});

// Create staff
router.post('/staff', async (req, res, next) => {
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

		res.status(201).json({ staff, user: { id: user._id, role: user.role } });
	} catch (err) {
		next(err);
	}
});

// Update student
router.put('/students/:id', async (req, res, next) => {
	try {
		const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});
		if (!student) return res.status(404).json({ message: 'Student not found' });

		// Update user if enrollment number changed
		if (req.body.enrollmentNumber) {
			await User.findOneAndUpdate(
				{ profileId: student._id, role: 'student' },
				{ username: req.body.enrollmentNumber }
			);
		}

		res.json(student);
	} catch (err) {
		next(err);
	}
});

// Update staff
router.put('/staff/:id', async (req, res, next) => {
	try {
		const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});
		if (!staff) return res.status(404).json({ message: 'Staff not found' });

		// Update user if staff ID changed
		if (req.body.staffId) {
			await User.findOneAndUpdate(
				{ profileId: staff._id, role: 'staff' },
				{ username: req.body.staffId }
			);
		}

		res.json(staff);
	} catch (err) {
		next(err);
	}
});

// Deactivate user (soft delete)
router.delete('/users/:id', async (req, res, next) => {
	try {
		const user = await User.findByIdAndUpdate(
			req.params.id,
			{ isActive: false },
			{ new: true }
		);
		if (!user) return res.status(404).json({ message: 'User not found' });
		res.json({ message: 'User deactivated successfully' });
	} catch (err) {
		next(err);
	}
});

// Reactivate user
router.patch('/users/:id/activate', async (req, res, next) => {
	try {
		const user = await User.findByIdAndUpdate(
			req.params.id,
			{ isActive: true },
			{ new: true }
		);
		if (!user) return res.status(404).json({ message: 'User not found' });
		res.json({ message: 'User activated successfully' });
	} catch (err) {
		next(err);
	}
});

// Reset user password (to DOB)
router.patch('/users/:id/reset-password', async (req, res, next) => {
	try {
		const user = await User.findById(req.params.id).populate('profileId');
		if (!user) return res.status(404).json({ message: 'User not found' });

		// Get DOB from profile
		const dob = user.profileId?.dateOfBirth;
		if (!dob) return res.status(400).json({ message: 'Date of birth not found' });

		// Update password to DOB
		user.password = dob;
		await user.save();

		res.json({ message: 'Password reset to date of birth' });
	} catch (err) {
		next(err);
	}
});

export default router;
