const BookingModel = require('../models/bookingModel');
const ResourceModel = require('../models/resourceModel');
const AuditLogModel = require('../models/auditLogModel');

/**
 * Booking Controller
 */

class BookingController {
  /**
   * Create a new booking
   */
  static async createBooking(req, res) {
    try {
      const { resourceId, bookingDate, startTime, endTime } = req.body;
      const userId = req.user.id;

      // Validation
      if (!resourceId || !bookingDate || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
      }

      // Validate resource exists
      const resource = await ResourceModel.getById(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      if (!resource.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Resource is not available',
        });
      }

      // Validate times
      if (startTime >= endTime) {
        return res.status(400).json({
          success: false,
          message: 'Start time must be before end time',
        });
      }

      // Validate date is not in the past
      const today = new Date().toISOString().split('T')[0];
      if (bookingDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book for past dates',
        });
      }

      // Create booking
      const bookingId = await BookingModel.create(
        userId,
        resourceId,
        bookingDate,
        startTime,
        endTime
      );

      // Log action
      await AuditLogModel.create('BOOKING_CREATED', userId, resourceId, bookingId, {
        resourceName: resource.name,
        date: bookingDate,
        startTime,
        endTime,
      });

      const booking = await BookingModel.getById(bookingId);

      return res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: booking,
      });
    } catch (error) {
      console.error('Booking creation error:', error);
      
      // Check if it's a conflict error
      if (error.message.includes('already booked')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error creating booking',
        error: error.message,
      });
    }
  }

  /**
   * Get user's bookings
   */
  static async getUserBookings(req, res) {
    try {
      const userId = req.params.id || req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const bookings = await BookingModel.getByUserId(userId, limit, offset);

      return res.status(200).json({
        success: true,
        data: bookings,
        pagination: {
          page,
          limit,
          total: bookings.length,
        },
      });
    } catch (error) {
      console.error('Fetch user bookings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching bookings',
        error: error.message,
      });
    }
  }

  /**
   * Get all bookings (admin only)
   */
  static async getAllBookings(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const filters = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.resource_id) filters.resource_id = req.query.resource_id;
      if (req.query.user_id) filters.user_id = req.query.user_id;

      const bookings = await BookingModel.getAll(filters, limit, offset);

      return res.status(200).json({
        success: true,
        data: bookings,
        pagination: {
          page,
          limit,
          total: bookings.length,
        },
      });
    } catch (error) {
      console.error('Fetch all bookings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching bookings',
        error: error.message,
      });
    }
  }

  /**
   * Approve a booking (admin only)
   */
  static async approveBooking(req, res) {
    try {
      const { id: bookingId } = req.params;
      const adminId = req.user.id;

      // Get booking details
      const booking = await BookingModel.getById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      if (booking.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: `Cannot approve a booking with status: ${booking.status}`,
        });
      }

      // Update status
      const updated = await BookingModel.updateStatus(bookingId, 'APPROVED');

      if (updated) {
        // Log action
        await AuditLogModel.create('BOOKING_APPROVED', adminId, booking.resource_id, bookingId, {
          user: booking.user_name,
          resource: booking.resource_name,
        });

        const updatedBooking = await BookingModel.getById(bookingId);

        return res.status(200).json({
          success: true,
          message: 'Booking approved successfully',
          data: updatedBooking,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Failed to approve booking',
      });
    } catch (error) {
      console.error('Approve booking error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error approving booking',
        error: error.message,
      });
    }
  }

  /**
   * Reject a booking (admin only)
   */
  static async rejectBooking(req, res) {
    try {
      const { id: bookingId } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      // Get booking details
      const booking = await BookingModel.getById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      if (booking.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: `Cannot reject a booking with status: ${booking.status}`,
        });
      }

      // Update status
      const updated = await BookingModel.updateStatus(bookingId, 'REJECTED', reason);

      if (updated) {
        // Log action
        await AuditLogModel.create('BOOKING_REJECTED', adminId, booking.resource_id, bookingId, {
          user: booking.user_name,
          resource: booking.resource_name,
          reason,
        });

        const updatedBooking = await BookingModel.getById(bookingId);

        return res.status(200).json({
          success: true,
          message: 'Booking rejected successfully',
          data: updatedBooking,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Failed to reject booking',
      });
    } catch (error) {
      console.error('Reject booking error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error rejecting booking',
        error: error.message,
      });
    }
  }

  /**
   * Get resource availability for a specific date
   */
  static async getResourceAvailability(req, res) {
    try {
      const { resourceId, date } = req.query;

      if (!resourceId || !date) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID and date are required',
        });
      }

      const resource = await ResourceModel.getById(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      const bookedSlots = await BookingModel.getResourceAvailability(resourceId, date);

      return res.status(200).json({
        success: true,
        data: {
          resource,
          date,
          bookedSlots,
        },
      });
    } catch (error) {
      console.error('Availability check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking availability',
        error: error.message,
      });
    }
  }

  /**
   * Cancel a booking (user can cancel only pending bookings)
   */
  static async cancelBooking(req, res) {
    try {
      const { id: bookingId } = req.params;
      const userId = req.user.id;

      const booking = await BookingModel.getById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      // Only user who made the booking or admin can cancel
      if (booking.user_id !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this booking',
        });
      }

      if (booking.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Can only cancel pending bookings',
        });
      }

      const deleted = await BookingModel.delete(bookingId);

      if (deleted) {
        // Log action
        await AuditLogModel.create('BOOKING_CANCELLED', userId, booking.resource_id, bookingId, {
          resource: booking.resource_name,
        });

        return res.status(200).json({
          success: true,
          message: 'Booking cancelled successfully',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Failed to cancel booking',
      });
    } catch (error) {
      console.error('Cancel booking error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error cancelling booking',
        error: error.message,
      });
    }
  }
}

module.exports = BookingController;
