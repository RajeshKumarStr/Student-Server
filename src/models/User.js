import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true, trim: true },
	password: { type: String, required: true },
	role: { type: String, enum: ['student', 'staff', 'superadmin'], required: true },
	profileId: { type: mongoose.Schema.Types.ObjectId, required: false }, // Reference to Student or Staff (optional for superadmin)
	isActive: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
	if (!this.isModified('password')) return next();
	this.password = await bcrypt.hash(this.password, 12);
	next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
