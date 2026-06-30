const express = require('express');
const router = express.Router();
const multer = require('multer');
const Teammate = require('../models/Teammate');
const protect = require('../middleware/protect');

// --- Multer setup for profile picture uploads ---
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// GET /api/teammates
// Public: fetch all teammates sorted by order
router.get('/', async (req, res) => {
  try {
    const teammates = await Teammate.find().sort({ order: 1, createdAt: 1 });
    res.json(teammates);
  } catch (err) {
    console.error('Fetch teammates error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/teammates
// Admin only: create a new teammate
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { name, role, bio, skills, socials, gradient, order } = req.body;

    let imagePath = '';
    if (req.file) {
      imagePath = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    let parsedSocials = {};
    if (socials) {
      try {
        parsedSocials = typeof socials === 'string' ? JSON.parse(socials) : socials;
      } catch (e) {
        console.error("Error parsing socials:", e);
      }
    }

    const skillsArray = skills
      ? (Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean))
      : [];

    const teammate = await Teammate.create({
      name,
      role,
      bio,
      skills: skillsArray,
      socials: parsedSocials,
      gradient,
      image: imagePath,
      order: order ? Number(order) : 0
    });

    res.status(201).json(teammate);
  } catch (err) {
    console.error('Create teammate error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/teammates/reorder/bulk
// Admin only: bulk reorder teammates
router.put('/reorder/bulk', protect, async (req, res) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      return res.status(400).json({ message: 'Invalid data format.' });
    }
    const promises = orders.map(item =>
      Teammate.findByIdAndUpdate(item.id, { order: item.order })
    );
    await Promise.all(promises);
    res.json({ message: 'Teammates reordered successfully.' });
  } catch (err) {
    console.error('Bulk reorder teammates error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/teammates/:id
// Admin only: update a teammate
router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const teammate = await Teammate.findById(req.params.id);
    if (!teammate) {
      return res.status(404).json({ message: 'Teammate not found.' });
    }

    const { name, role, bio, skills, socials, gradient, order, removeImage } = req.body;

    if (req.file) {
      teammate.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else if (removeImage === 'true' || removeImage === true) {
      teammate.image = '';
    }

    if (name !== undefined) teammate.name = name;
    if (role !== undefined) teammate.role = role;
    if (bio !== undefined) teammate.bio = bio;
    if (skills !== undefined) {
      teammate.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (socials !== undefined) {
      try {
        teammate.socials = typeof socials === 'string' ? JSON.parse(socials) : socials;
      } catch (e) {
        console.error("Error parsing socials on update:", e);
      }
    }
    if (gradient !== undefined) teammate.gradient = gradient;
    if (order !== undefined) teammate.order = Number(order);

    await teammate.save();
    res.json(teammate);
  } catch (err) {
    console.error('Update teammate error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/teammates/:id
// Admin only: delete a teammate
router.delete('/:id', protect, async (req, res) => {
  try {
    const teammate = await Teammate.findById(req.params.id);
    if (!teammate) {
      return res.status(404).json({ message: 'Teammate not found.' });
    }

    await teammate.deleteOne();
    res.json({ message: 'Teammate deleted successfully.' });
  } catch (err) {
    console.error('Delete teammate error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
