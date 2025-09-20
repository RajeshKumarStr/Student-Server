import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema(
	{
		enrollmentNumber: { type: String, required: true, trim: true, unique: true },
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, trim: true, lowercase: true, unique: true },
		dateOfBirth: { type: Date, required: true },
		course: { type: String, required: true, trim: true },
		year: { type: Number, required: true, min: 1, max: 5 },
		phone: { type: String, trim: true },
		address: { type: String, trim: true },
		parentName: { type: String, trim: true },
		parentPhone: { type: String, trim: true },
		status: { type: String, enum: ['active', 'inactive'], default: 'active' }
	},
	{ timestamps: true }
);

StudentSchema.index({ name: 'text', email: 'text', course: 'text', enrollmentNumber: 'text' });

export default mongoose.model('Student', StudentSchema);
