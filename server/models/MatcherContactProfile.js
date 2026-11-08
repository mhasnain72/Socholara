import mongoose from 'mongoose';

const matcherContactProfileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  highestDegree: { type: String, required: true, trim: true, maxlength: 100 },
  desiredCountry: { type: String, required: true, trim: true, maxlength: 100 }
}, { timestamps: true });

const MatcherContactProfile = mongoose.models.MatcherContactProfile
  || mongoose.model('MatcherContactProfile', matcherContactProfileSchema);

export default MatcherContactProfile;