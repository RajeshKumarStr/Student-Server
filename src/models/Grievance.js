import mongoose from 'mongoose';

const GrievanceSchema = new mongoose.Schema({
	student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
	subject: { type: String, required: true, trim: true },
	description: { type: String, required: true, trim: true },
	category: { type: String, required: true, trim: true }, // academic, administrative, hostel, etc.
	priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
	status: { type: String, enum: ['pending', 'in_progress', 'resolved', 'rejected'], default: 'pending' },
	response: { type: String, trim: true },
	respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
	respondedAt: { type: Date }
}, { timestamps: true });

GrievanceSchema.index({ student: 1, status: 1 });
GrievanceSchema.index({ status: 1, priority: 1 });

export default mongoose.model('Grievance', GrievanceSchema);
