import mongoose from 'mongoose';

const adminSessionSchema = new mongoose.Schema({
  tokenHash: { type: String, unique: true, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AdminSession = mongoose.models.AdminSession
  || mongoose.model('AdminSession', adminSessionSchema);

export default AdminSession;
