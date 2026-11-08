import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Opportunity title is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Type is required (Scholarship or Internship)'],
    enum: ['Scholarship', 'Internship'],
    default: 'Scholarship',
  },
  provider: {
    type: String,
    required: [true, 'Provider / Organization name is required'],
    trim: true,
  },
  providerLogo: {
    type: String,
    default: '',
  },
  coverPhoto: {
    type: String,
    required: [true, 'Cover photo is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Computer Science & Tech',
      'Engineering & Robotics',
      'Business & Finance',
      'Medicine & Healthcare',
      'Arts & Humanities',
      'Sciences & Mathematics',
      'Social Sciences & Law',
      'General & Interdisciplinary'
    ],
    default: 'Computer Science & Tech',
  },
  awardAmount: {
    type: String,
    required: [true, 'Award amount or stipend is required'],
    default: 'Fully Funded',
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    default: 'Global',
  },
  workMode: {
    type: String,
    enum: ['Remote', 'On-site', 'Hybrid'],
    default: 'On-site',
  },
  degreeLevel: {
    type: String,
    enum: ['All Levels', 'Undergraduate', 'Postgraduate / Master', 'PhD / Doctoral', 'High School'],
    default: 'Undergraduate',
  },
  deadline: {
    type: Date,
    required: false,
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description preview is required'],
    maxlength: 280,
  },
  fullDescription: {
    type: String,
    required: [true, 'Full description is required'],
  },
  eligibility: {
    type: [String],
    default: [],
  },
  benefits: {
    type: [String],
    default: [],
  },
  requirements: {
    type: [String],
    default: [],
  },
  applicationUrl: {
    type: String,
    default: '',
  },
  contactEmail: {
    type: String,
    default: '',
  },
  tags: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['Active', 'Closing Soon', 'Closed', 'Draft'],
    default: 'Active',
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true
});

// Full-text search index
opportunitySchema.index({
  title: 'text',
  provider: 'text',
  shortDescription: 'text',
  category: 'text'
});

export const Opportunity = mongoose.models.Opportunity || mongoose.model('Opportunity', opportunitySchema);
export default Opportunity;
