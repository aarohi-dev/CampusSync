const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Admin Routes (all require admin authentication)
 */

// Protect all admin routes
router.use(authMiddleware, roleMiddleware(['ADMIN']));

// Get audit logs
router.get('/logs', adminController.getAuditLogs);

// Get dashboard statistics
router.get('/stats', adminController.getDashboardStats);

// Get all users
router.get('/users', adminController.getAllUsers);

// Get pending bookings
router.get('/bookings/pending', adminController.getPendingBookings);

// Get system overview
router.get('/overview', adminController.getSystemOverview);

module.exports = router;
