const pool = require('../config/db');

/**
 * Booking Model - Database operations for bookings
 * UPDATED FOR NORMALIZED SCHEMA (3NF)
 * - Uses status_id FK to booking_statuses table (status_id: 1=PENDING, 2=APPROVED, 3=REJECTED)
 */

class BookingModel {
  /**
   * Create a new booking with PENDING status
   * NORMALIZED: Uses status_id FK (1 = PENDING by default)
   * Includes overlap check via database trigger
   */
  static async create(userId, resourceId, bookingDate, startTime, endTime) {
    try {
      const connection = await pool.getConnection();
      
      // Get the ID for 'APPROVED' status
      const [statusRows] = await connection.query(
        "SELECT id FROM booking_statuses WHERE status_name = 'APPROVED'",
        []
      );
      const approvedStatusId = statusRows[0]?.id || 2;
      
      // First, check for overlapping APPROVED bookings
      const [overlaps] = await connection.query(
        `SELECT COUNT(*) as count FROM bookings
         WHERE resource_id = ?
           AND booking_date = ?
           AND status_id = ?
           AND (? < end_time AND ? > start_time)`,
        [resourceId, bookingDate, approvedStatusId, startTime, endTime]
      );

      if (overlaps[0].count > 0) {
        connection.release();
        throw new Error('Resource is already booked for this time slot');
      }

      // Get PENDING status ID
      const [pendingRows] = await connection.query(
        "SELECT id FROM booking_statuses WHERE status_name = 'PENDING'",
        []
      );
      const pendingStatusId = pendingRows[0]?.id || 1;

      // Insert the booking
      const [result] = await connection.query(
        `INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, resourceId, bookingDate, startTime, endTime, pendingStatusId]
      );

      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating booking: ${error.message}`);
    }
  }

  /**
   * Get booking by ID
   * NORMALIZED: Joins with booking_statuses and resource_types tables
   */
  static async getById(bookingId) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT b.id, b.user_id, b.resource_id, b.booking_date, 
                b.start_time, b.end_time, b.rejection_reason, b.created_at, b.updated_at,
                u.name as user_name, u.email as user_email, 
                r.name as resource_name, rt.type_name as resource_type,
                bs.status_name as status
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         JOIN resources r ON b.resource_id = r.id
         JOIN resource_types rt ON r.resource_type_id = rt.id
         JOIN booking_statuses bs ON b.status_id = bs.id
         WHERE b.id = ?`,
        [bookingId]
      );
      connection.release();
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching booking: ${error.message}`);
    }
  }

  /**
   * Get user's bookings
   * NORMALIZED: Joins with normalized tables
   */
  static async getByUserId(userId, limit = 50, offset = 0) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT b.id, b.user_id, b.resource_id, b.booking_date, 
                b.start_time, b.end_time, b.rejection_reason, b.created_at, b.updated_at,
                r.name as resource_name, rt.type_name as resource_type, 
                l.building_name, l.room_number,
                bs.status_name as status
         FROM bookings b
         JOIN resources r ON b.resource_id = r.id
         JOIN resource_types rt ON r.resource_type_id = rt.id
         JOIN locations l ON r.location_id = l.id
         JOIN booking_statuses bs ON b.status_id = bs.id
         WHERE b.user_id = ?
         ORDER BY b.booking_date DESC, b.start_time DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching user bookings: ${error.message}`);
    }
  }

  /**
   * Get all bookings (admin only)
   * NORMALIZED: Joins with booking_statuses table
   */
  static async getAll(filters = {}, limit = 50, offset = 0) {
    try {
      const connection = await pool.getConnection();
      
      let query = `SELECT b.id, b.user_id, b.resource_id, b.booking_date, 
                          b.start_time, b.end_time, b.rejection_reason, b.created_at, b.updated_at,
                          u.name as user_name, u.email as user_email,
                          r.name as resource_name, rt.type_name as resource_type,
                          bs.status_name as status
                   FROM bookings b
                   JOIN users u ON b.user_id = u.id
                   JOIN resources r ON b.resource_id = r.id
                   JOIN resource_types rt ON r.resource_type_id = rt.id
                   JOIN booking_statuses bs ON b.status_id = bs.id
                   WHERE 1=1`;
      
      const params = [];

      // Apply filters using status names
      if (filters.status) {
        query += ' AND bs.status_name = ?';
        params.push(filters.status);
      }

      if (filters.resource_id) {
        query += ' AND b.resource_id = ?';
        params.push(filters.resource_id);
      }

      if (filters.user_id) {
        query += ' AND b.user_id = ?';
        params.push(filters.user_id);
      }

      query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await connection.query(query, params);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching bookings: ${error.message}`);
    }
  }

  /**
   * Update booking status (approve/reject)
   * NORMALIZED: Updates using status_id FK
   */
  static async updateStatus(bookingId, statusName, rejectionReason = null) {
    try {
      const connection = await pool.getConnection();
      
      // Get status_id from status name
      const [statusRows] = await connection.query(
        'SELECT id FROM booking_statuses WHERE status_name = ?',
        [statusName]
      );
      
      if (statusRows.length === 0) {
        connection.release();
        throw new Error(`Invalid status: ${statusName}`);
      }
      
      const statusId = statusRows[0].id;
      
      let query = 'UPDATE bookings SET status_id = ?, updated_at = CURRENT_TIMESTAMP';
      const params = [statusId];

      if (rejectionReason) {
        query += ', rejection_reason = ?';
        params.push(rejectionReason);
      }

      query += ' WHERE id = ?';
      params.push(bookingId);

      const [result] = await connection.query(query, params);
      connection.release();

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating booking: ${error.message}`);
    }
  }

  /**
   * Soft delete booking (set status to CANCELLED or REJECTED)
   * NORMALIZED: Cancels booking instead of hard deletion
   */
  static async cancel(bookingId) {
    try {
      const connection = await pool.getConnection();
      
      // Get REJECTED status ID (or create CANCELLED status if needed)
      const [statusRows] = await connection.query(
        "SELECT id FROM booking_statuses WHERE status_name = 'REJECTED' LIMIT 1",
        []
      );
      
      const statusId = statusRows[0]?.id || 3;
      
      const [result] = await connection.query(
        `UPDATE bookings SET status_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [statusId, bookingId]
      );
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error cancelling booking: ${error.message}`);
    }
  }

  /**
   * Get resource availability for a date
   * NORMALIZED: Uses status_id FK to check APPROVED bookings (status_id = 2)
   */
  static async getResourceAvailability(resourceId, bookingDate) {
    try {
      const connection = await pool.getConnection();
      
      // Get APPROVED status ID
      const [statusRows] = await connection.query(
        "SELECT id FROM booking_statuses WHERE status_name = 'APPROVED'",
        []
      );
      const approvedStatusId = statusRows[0]?.id || 2;
      
      const [rows] = await connection.query(
        `SELECT start_time, end_time FROM bookings
         WHERE resource_id = ? AND booking_date = ? AND status_id = ?
         ORDER BY start_time`,
        [resourceId, bookingDate, approvedStatusId]
      );
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching availability: ${error.message}`);
    }
  }

  /**
   * Get bookings for date range
   * NORMALIZED: Supports filtering by status name
   */
  static async getByDateRange(startDate, endDate, statusName = null) {
    try {
      const connection = await pool.getConnection();
      
      let query = `SELECT b.*, bs.status_name as status
                   FROM bookings b
                   JOIN booking_statuses bs ON b.status_id = bs.id
                   WHERE b.booking_date >= ? AND b.booking_date <= ?`;
      const params = [startDate, endDate];

      if (statusName) {
        query += ' AND bs.status_name = ?';
        params.push(statusName);
      }

      const [rows] = await connection.query(query, params);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching bookings by date range: ${error.message}`);
    }
  }
}

module.exports = BookingModel;
