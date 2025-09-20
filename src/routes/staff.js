import express from 'express';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Marks from '../models/Marks.js';
import Grievance from '../models/Grievance.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require staff authentication
router.use(authenticate);
router.use(authorize(['staff']));

// Get all students
router.get('/students', async (req, res, next) => {
	try {
		const { q = '', sortBy = 'createdAt', order = 'desc' } = req.query;
		const filter = q
			? { $text: { $search: q } }
			: {};
		const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
		const students = await Student.find(filter).sort(sort);
		res.json(students);
	} catch (err) {
		next(err);
	}
});

// Get single student
router.get('/students/:id', async (req, res, next) => {
	try {
		const student = await Student.findById(req.params.id);
		if (!student) return res.status(404).json({ message: 'Student not found' });
		res.json(student);
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

		// Create user account for authentication
		const user = await User.create({
			username: enrollmentNumber,
			password: dateOfBirth, // DOB as password
			role: 'student',
			profileId: student._id
		});

		res.status(201).json(student);
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

// Disable student (soft delete)
router.delete('/students/:id', async (req, res, next) => {
	try {
		const student = await Student.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
		if (!student) return res.status(404).json({ message: 'Student not found' });
		
		// Also deactivate the corresponding user account
		await User.findOneAndUpdate(
			{ profileId: student._id, role: 'student' },
			{ isActive: false }
		);
		
		res.json({ message: 'Student disabled successfully' });
	} catch (err) {
		next(err);
	}
});

// Mark attendance
router.post('/attendance', async (req, res, next) => {
	try {
		const { studentId, date, status, remarks, subject } = req.body;
		const attendance = await Attendance.create({
			student: studentId,
			staff: req.user.profileId._id,
			date,
			status,
			remarks,
			subject
		});
		res.status(201).json(attendance);
	} catch (err) {
		next(err);
	}
});

// Get attendance records
router.get('/attendance', async (req, res, next) => {
	try {
		const { studentId, date, subject } = req.query;
		const filter = {};
		if (studentId) filter.student = studentId;
		if (date) filter.date = new Date(date);
		if (subject) filter.subject = subject;
		filter.staff = req.user.profileId._id;

		const attendance = await Attendance.find(filter)
			.populate('student', 'name enrollmentNumber course year')
			.sort({ date: -1 });
		res.json(attendance);
	} catch (err) {
		next(err);
	}
});

// Add marks
router.post('/marks', async (req, res, next) => {
	try {
		const marks = await Marks.create({
			...req.body,
			student: req.body.studentId, // Map studentId to student field
			staff: req.user.profileId._id
		});
		res.status(201).json(marks);
	} catch (err) {
		next(err);
	}
});

// Get marks
router.get('/marks', async (req, res, next) => {
	try {
		const { studentId, subject, academicYear, semester } = req.query;
		const filter = { staff: req.user.profileId._id };
		if (studentId) filter.student = studentId;
		if (subject) filter.subject = subject;
		if (academicYear) filter.academicYear = academicYear;
		if (semester) filter.semester = semester;

		const marks = await Marks.find(filter)
			.populate('student', 'name enrollmentNumber course year')
			.sort({ academicYear: -1, semester: -1 });
		res.json(marks);
	} catch (err) {
		next(err);
	}
});

// Update marks
router.put('/marks/:id', async (req, res, next) => {
	try {
		const updateData = { ...req.body };
		if (req.body.studentId) {
			updateData.student = req.body.studentId; // Map studentId to student field
		}
		
		const marks = await Marks.findOneAndUpdate(
			{ _id: req.params.id, staff: req.user.profileId._id },
			updateData,
			{ new: true, runValidators: true }
		);
		if (!marks) return res.status(404).json({ message: 'Marks not found' });
		res.json(marks);
	} catch (err) {
		next(err);
	}
});

// Get grievances
router.get('/grievances', async (req, res, next) => {
	try {
		const { status, priority } = req.query;
		const filter = {};
		if (status) filter.status = status;
		if (priority) filter.priority = priority;

		const grievances = await Grievance.find(filter)
			.populate('student', 'name enrollmentNumber course year')
			.populate('respondedBy', 'name staffId')
			.sort({ createdAt: -1 });
		res.json(grievances);
	} catch (err) {
		next(err);
	}
});

// Respond to grievance
router.put('/grievances/:id/respond', async (req, res, next) => {
	try {
		const { response, status } = req.body;
		const grievance = await Grievance.findByIdAndUpdate(
			req.params.id,
			{
				response,
				status,
				respondedBy: req.user.profileId._id,
				respondedAt: new Date()
			},
			{ new: true }
		);
		if (!grievance) return res.status(404).json({ message: 'Grievance not found' });
		res.json(grievance);
	} catch (err) {
		next(err);
	}
});

export default router;
