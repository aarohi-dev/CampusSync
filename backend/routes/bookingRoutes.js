const express = require('express');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Booking Routes
 */

// Create booking (requires authentication)
router.post('/', authMiddleware, bookingController.createBooking);

// Get user's bookings
router.get('/user/:id', authMiddleware, bookingController.getUserBookings);

// Get current user's bookings
router.get('/my-bookings', authMiddleware, (req, res, next) => {
  req.params.id = req.user.id;
  next();
}, bookingController.getUserBookings);

// Get resource availability
router.get('/availability', bookingController.getResourceAvailability);

// Get all bookings (admin only)
router.get(
  '/admin/all',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  bookingController.getAllBookings
);

// Approve booking (admin only)
router.put(
  '/:id/approve',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  bookingController.approveBooking
);

// Reject booking (admin only)
router.put(
  '/:id/reject',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  bookingController.rejectBooking
);

// Cancel booking (user or admin)
router.delete(
  '/:id/cancel',
  authMiddleware,
  bookingController.cancelBooking
);

module.exports = router;
