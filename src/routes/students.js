import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();

// List with optional search and sorting
router.get('/', async (req, res, next) => {
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

// Get one
router.get('/:id', async (req, res, next) => {
	try {
		const student = await Student.findById(req.params.id);
		if (!student) return res.status(404).json({ message: 'Student not found' });
		res.json(student);
	} catch (err) {
		next(err);
	}
});

// Create
router.post('/', async (req, res, next) => {
	try {
		const student = await Student.create(req.body);
		res.status(201).json(student);
	} catch (err) {
		next(err);
	}
});

// Update
router.put('/:id', async (req, res, next) => {
	try {
		const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});
		if (!student) return res.status(404).json({ message: 'Student not found' });
		res.json(student);
	} catch (err) {
		next(err);
	}
});

// Delete
router.delete('/:id', async (req, res, next) => {
	try {
		const student = await Student.findByIdAndDelete(req.params.id);
		if (!student) return res.status(404).json({ message: 'Student not found' });
		res.json({ message: 'Deleted' });
	} catch (err) {
		next(err);
	}
});

export default router;
