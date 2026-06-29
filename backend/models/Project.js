const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    desc: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
    },
    cat: {
      type: [String],
      required: [true, 'Category is required'],
      enum: ['web', 'mobile', 'uiux', 'ecommerce', 'ai', 'branding', 'marketing'],
      default: ['web'],
    },
    yr: {
      type: String,
      required: [true, 'Year is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
    // Stores an array of image file paths (relative to /uploads)
    images: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    problem: {
      type: String,
      trim: true,
    },
    features: [
      {
        title: { type: String, trim: true },
        desc: { type: String, trim: true }
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', ProjectSchema);
