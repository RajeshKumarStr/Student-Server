import mongoose from 'mongoose';

const MarksSchema = new mongoose.Schema({
	student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
	staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
	subject: { type: String, required: true, trim: true },
	examType: { type: String, required: true, trim: true }, // midterm, final, assignment, etc.
	marksObtained: { type: Number, required: true, min: 0, max: 100 },
	totalMarks: { type: Number, required: true, min: 1 },
	grade: { type: String, trim: true },
	remarks: { type: String, trim: true },
	academicYear: { type: String, required: true, trim: true },
	semester: { type: String, required: true, trim: true }
}, { timestamps: true });

MarksSchema.index({ student: 1, subject: 1, examType: 1 });
MarksSchema.index({ staff: 1, academicYear: 1 });

export default mongoose.model('Marks', MarksSchema);
