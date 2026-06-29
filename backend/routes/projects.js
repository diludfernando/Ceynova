const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Project = require('../models/Project');
const protect = require('../middleware/protect');

// --- Multer setup for image uploads ---
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// --- Routes ---

// GET /api/projects
// Public: fetch all projects (for the website frontend)
router.get('/', async (req, res) => {
  try {
    const { cat } = req.query;
    let filter = {};
    if (cat) {
      const catArray = cat.includes(',') ? cat.split(',') : [cat];
      filter = { cat: { $in: catArray } };
    }
    const projects = await Project.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/projects/:id
// Public: fetch a single project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    res.json(project);
  } catch (err) {
    console.error('Fetch project error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/projects
// Admin only: create a new project (with optional image uploads)
router.post('/', protect, upload.array('images', 10), async (req, res) => {
  try {
    const { title, desc, cat, yr, tags, featured, order, problem, features, imageOrder } = req.body;

    const newPaths = req.files && req.files.length > 0
      ? req.files.map((f) => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`)
      : [];

    let imagePaths = [];
    if (imageOrder) {
      const orderArray = Array.isArray(imageOrder) ? imageOrder : [imageOrder];
      let newIdx = 0;
      imagePaths = orderArray.map(item => {
        if (item.startsWith('NEW_')) {
          return newPaths[newIdx++] || '';
        }
        return item;
      }).filter(Boolean);
    } else {
      imagePaths = newPaths.length > 0
        ? newPaths
        : (req.body.images ? (Array.isArray(req.body.images) ? req.body.images : [req.body.images]) : (req.body.img ? [req.body.img] : []));
    }

    const tagsArray = tags
      ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()).filter(Boolean))
      : [];

    const catArray = cat
      ? (Array.isArray(cat) ? cat : [cat])
      : [];

    let featuresArray = [];
    if (features) {
      try {
        featuresArray = typeof features === 'string' ? JSON.parse(features) : features;
      } catch (e) {
        console.error("Error parsing features:", e);
      }
    }

    const project = await Project.create({
      title,
      desc,
      cat: catArray,
      yr,
      tags: tagsArray,
      images: imagePaths,
      featured: featured === 'true' || featured === true,
      order: order ? Number(order) : 0,
      problem,
      features: featuresArray,
    });

    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/projects/:id
// Admin only: update a project (optionally upload new images)
router.put('/:id', protect, upload.array('images', 10), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const { title, desc, cat, yr, tags, featured, order, keepImages, problem, features, imageOrder } = req.body;

    // Images the admin wants to keep from the existing set
    const toKeep = keepImages
      ? (Array.isArray(keepImages) ? keepImages : [keepImages])
      : [];

    // Remove any old images that are no longer in keepImages
    project.images.forEach((imgPath) => {
      if (!toKeep.includes(imgPath)) {
        if (imgPath.startsWith('/uploads/')) {
          const fullPath = path.join(__dirname, '..', imgPath);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
      }
    });

    const newPaths = req.files ? req.files.map((f) => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`) : [];
    
    if (imageOrder) {
      const orderArray = Array.isArray(imageOrder) ? imageOrder : [imageOrder];
      let newIdx = 0;
      project.images = orderArray.map(item => {
        if (item.startsWith('NEW_')) {
          return newPaths[newIdx++] || '';
        }
        return item;
      }).filter(Boolean);
    } else {
      project.images = [...toKeep, ...newPaths];
    }

    if (title !== undefined) project.title = title;
    if (desc !== undefined) project.desc = desc;
    if (cat !== undefined) {
      project.cat = Array.isArray(cat) ? cat : [cat];
    }
    if (yr !== undefined) project.yr = yr;
    if (tags !== undefined) {
      project.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    if (featured !== undefined) project.featured = featured === 'true' || featured === true;
    if (order !== undefined) project.order = Number(order);
    if (problem !== undefined) project.problem = problem;
    if (features !== undefined) {
      try {
        project.features = typeof features === 'string' ? JSON.parse(features) : features;
      } catch (e) {
        console.error("Error parsing features on update:", e);
      }
    }

    await project.save();
    res.json(project);
  } catch (err) {
    console.error('Update project error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/projects/:id
// Admin only: delete a project and its images
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Remove image files from disk
    project.images.forEach((imgPath) => {
      if (imgPath.startsWith('/uploads/')) {
        const fullPath = path.join(__dirname, '..', imgPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
    });

    await project.deleteOne();
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/projects/:id/images
// Admin only: remove specific images from a project
router.delete('/:id/images', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const { imagesToRemove } = req.body; // array of image paths like ["/uploads/file.jpg"]
    if (!Array.isArray(imagesToRemove)) {
      return res.status(400).json({ message: 'imagesToRemove must be an array.' });
    }

    imagesToRemove.forEach((imgPath) => {
      if (imgPath.startsWith('/uploads/')) {
        const fullPath = path.join(__dirname, '..', imgPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
    });

    project.images = project.images.filter((img) => !imagesToRemove.includes(img));
    await project.save();

    res.json(project);
  } catch (err) {
    console.error('Remove images error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
