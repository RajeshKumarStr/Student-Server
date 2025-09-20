import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
	student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
	staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
	date: { type: Date, required: true },
	status: { type: String, enum: ['present', 'absent', 'late'], required: true },
	remarks: { type: String, trim: true },
	subject: { type: String, required: true, trim: true }
}, { timestamps: true });

AttendanceSchema.index({ student: 1, date: 1 });
AttendanceSchema.index({ staff: 1, date: 1 });

export default mongoose.model('Attendance', AttendanceSchema);
