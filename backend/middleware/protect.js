const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../routes/auth');

/**
 * Middleware to protect admin routes.
 * Expects a Bearer token in the Authorization header.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = protect;
