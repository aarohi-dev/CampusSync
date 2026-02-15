const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Authentication Routes
 */

// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Get current user profile (requires authentication)
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
