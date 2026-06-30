const mongoose = require('mongoose');

const teammateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required.'],
    trim: true
  },
  role: {
    type: String,
    required: [true, 'Role is required.'],
    trim: true
  },
  bio: {
    type: String,
    required: [true, 'Bio is required.'],
    trim: true
  },
  skills: {
    type: [String],
    default: []
  },
  socials: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    instagram: { type: String, default: '' },
    dribbble: { type: String, default: '' }
  },
  gradient: {
    type: String,
    default: 'linear-gradient(135deg, #2b7bff, #36d3ff)'
  },
  image: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Teammate', teammateSchema);
