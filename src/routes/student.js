import express from 'express';
import Attendance from '../models/Attendance.js';
import Marks from '../models/Marks.js';
import Grievance from '../models/Grievance.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require student authentication
router.use(authenticate);
router.use(authorize(['student']));

// Get student's attendance
router.get('/attendance', async (req, res, next) => {
	try {
		const { startDate, endDate, subject } = req.query;
		const filter = { student: req.user.profileId._id };
		
		if (startDate && endDate) {
			filter.date = {
				$gte: new Date(startDate),
				$lte: new Date(endDate)
			};
		}
		if (subject) filter.subject = subject;

		const attendance = await Attendance.find(filter)
			.populate('staff', 'name staffId')
			.sort({ date: -1 });
		res.json(attendance);
	} catch (err) {
		next(err);
	}
});

// Get attendance summary
router.get('/attendance/summary', async (req, res, next) => {
	try {
		const { subject, startDate, endDate } = req.query;
		const filter = { student: req.user.profileId._id };
		
		if (startDate && endDate) {
			filter.date = {
				$gte: new Date(startDate),
				$lte: new Date(endDate)
			};
		}
		if (subject) filter.subject = subject;

		const attendance = await Attendance.find(filter);
		const total = attendance.length;
		const present = attendance.filter(a => a.status === 'present').length;
		const absent = attendance.filter(a => a.status === 'absent').length;
		const late = attendance.filter(a => a.status === 'late').length;
		const percentage = total > 0 ? ((present + late) / total * 100).toFixed(2) : 0;

		res.json({
			total,
			present,
			absent,
			late,
			percentage: parseFloat(percentage)
		});
	} catch (err) {
		next(err);
	}
});

// Get student's marks
router.get('/marks', async (req, res, next) => {
	try {
		const { subject, academicYear, semester } = req.query;
		const filter = { student: req.user.profileId._id };
		if (subject) filter.subject = subject;
		if (academicYear) filter.academicYear = academicYear;
		if (semester) filter.semester = semester;

		const marks = await Marks.find(filter)
			.populate('staff', 'name staffId')
			.sort({ academicYear: -1, semester: -1, subject: 1 });
		res.json(marks);
	} catch (err) {
		next(err);
	}
});

// Get marks summary
router.get('/marks/summary', async (req, res, next) => {
	try {
		const { academicYear, semester } = req.query;
		const filter = { student: req.user.profileId._id };
		if (academicYear) filter.academicYear = academicYear;
		if (semester) filter.semester = semester;

		const marks = await Marks.find(filter);
		const totalSubjects = marks.length;
		const totalMarks = marks.reduce((sum, mark) => sum + mark.marksObtained, 0);
		const totalPossible = marks.reduce((sum, mark) => sum + mark.totalMarks, 0);
		const average = totalPossible > 0 ? (totalMarks / totalPossible * 100).toFixed(2) : 0;

		res.json({
			totalSubjects,
			totalMarks,
			totalPossible,
			average: parseFloat(average)
		});
	} catch (err) {
		next(err);
	}
});

// Create grievance
router.post('/grievances', async (req, res, next) => {
	try {
		const grievance = await Grievance.create({
			...req.body,
			student: req.user.profileId._id
		});
		res.status(201).json(grievance);
	} catch (err) {
		next(err);
	}
});

// Get student's grievances
router.get('/grievances', async (req, res, next) => {
	try {
		const { status, priority } = req.query;
		const filter = { student: req.user.profileId._id };
		if (status) filter.status = status;
		if (priority) filter.priority = priority;

		const grievances = await Grievance.find(filter)
			.populate('respondedBy', 'name staffId')
			.sort({ createdAt: -1 });
		res.json(grievances);
	} catch (err) {
		next(err);
	}
});

// Get single grievance
router.get('/grievances/:id', async (req, res, next) => {
	try {
		const grievance = await Grievance.findOne({
			_id: req.params.id,
			student: req.user.profileId._id
		}).populate('respondedBy', 'name staffId');
		
		if (!grievance) return res.status(404).json({ message: 'Grievance not found' });
		res.json(grievance);
	} catch (err) {
		next(err);
	}
});

export default router;
