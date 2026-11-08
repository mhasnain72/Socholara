import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true, default: 'homepage' },
  data: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

export const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);
export default Banner;
