import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
	staffId: { type: String, required: true, unique: true, trim: true },
	name: { type: String, required: true, trim: true },
	email: { type: String, required: true, trim: true, lowercase: true, unique: true },
	department: { type: String, required: true, trim: true },
	designation: { type: String, required: true, trim: true },
	phone: { type: String, trim: true },
	dateOfBirth: { type: Date, required: true },
	isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Staff', StaffSchema);
