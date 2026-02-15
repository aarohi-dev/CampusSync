const AuditLogModel = require('../models/auditLogModel');
const UserModel = require('../models/userModel');
const BookingModel = require('../models/bookingModel');
const ResourceModel = require('../models/resourceModel');

/**
 * Admin Controller - Admin-specific operations
 */

class AdminController {
  /**
   * Get all audit logs
   */
  static async getAuditLogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 50;
      const offset = (page - 1) * limit;

      const filters = {};
      if (req.query.action) filters.action = req.query.action;
      if (req.query.user_id) filters.user_id = req.query.user_id;
      if (req.query.start_date) filters.start_date = req.query.start_date;
      if (req.query.end_date) filters.end_date = req.query.end_date;

      const logs = await AuditLogModel.getAll(filters, limit, offset);

      return res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total: logs.length,
        },
      });
    } catch (error) {
      console.error('Fetch audit logs error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching audit logs',
        error: error.message,
      });
    }
  }

  /**
   * Get admin dashboard stats
   */
  static async getDashboardStats(req, res) {
    try {
      const connection = require('../config/db');

      // This would require aggregation queries
      // For now, return a placeholder
      const stats = {
        totalUsers: 0,
        totalResources: 0,
        totalBookings: 0,
        pendingBookings: 0,
        approvedBookings: 0,
        rejectedBookings: 0,
      };

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching statistics',
        error: error.message,
      });
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const users = await UserModel.getAll(limit, offset);

      return res.status(200).json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total: users.length,
        },
      });
    } catch (error) {
      console.error('Fetch users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message,
      });
    }
  }

  /**
   * Get pending bookings
   */
  static async getPendingBookings(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const bookings = await BookingModel.getAll(
        { status: 'PENDING' },
        limit,
        offset
      );

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
      console.error('Fetch pending bookings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching pending bookings',
        error: error.message,
      });
    }
  }

  /**
   * Get system overview
   */
  static async getSystemOverview(req, res) {
    try {
      // Get aggregated system data
      const overview = {
        timestamp: new Date(),
        system: {
          status: 'operational',
        },
      };

      return res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      console.error('System overview error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching system overview',
        error: error.message,
      });
    }
  }
}

module.exports = AdminController;
