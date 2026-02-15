const pool = require('../config/db');

/**
 * Booking Model - Database operations for bookings
 */

class BookingModel {
  /**
   * Create a new booking
   * Includes overlap check via database trigger
   */
  static async create(userId, resourceId, bookingDate, startTime, endTime) {
    try {
      const connection = await pool.getConnection();
      
      // First, check for overlapping APPROVED bookings
      const [overlaps] = await connection.query(
        `SELECT COUNT(*) as count FROM bookings
         WHERE resource_id = ?
           AND booking_date = ?
           AND status = 'APPROVED'
           AND (
             (? < end_time AND ? > start_time)
           )`,
        [resourceId, bookingDate, startTime, endTime]
      );

      if (overlaps[0].count > 0) {
        connection.release();
        throw new Error('Resource is already booked for this time slot');
      }

      // Insert the booking
      const [result] = await connection.query(
        `INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status)
         VALUES (?, ?, ?, ?, ?, 'PENDING')`,
        [userId, resourceId, bookingDate, startTime, endTime]
      );

      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating booking: ${error.message}`);
    }
  }

  /**
   * Get booking by ID
   */
  static async getById(bookingId) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT b.*, u.name as user_name, u.email as user_email, 
                r.name as resource_name, r.type as resource_type
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         JOIN resources r ON b.resource_id = r.id
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
   */
  static async getByUserId(userId, limit = 50, offset = 0) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT b.*, r.name as resource_name, r.type as resource_type, r.location
         FROM bookings b
         JOIN resources r ON b.resource_id = r.id
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
   */
  static async getAll(filters = {}, limit = 50, offset = 0) {
    try {
      const connection = await pool.getConnection();
      
      let query = `SELECT b.*, u.name as user_name, u.email as user_email,
                          r.name as resource_name, r.type as resource_type
                   FROM bookings b
                   JOIN users u ON b.user_id = u.id
                   JOIN resources r ON b.resource_id = r.id
                   WHERE 1=1`;
      
      const params = [];

      // Apply filters
      if (filters.status) {
        query += ' AND b.status = ?';
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
   */
  static async updateStatus(bookingId, status, rejectionReason = null) {
    try {
      const connection = await pool.getConnection();
      
      let query = 'UPDATE bookings SET status = ?';
      const params = [status];

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
   * Delete booking
   */
  static async delete(bookingId) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'DELETE FROM bookings WHERE id = ?',
        [bookingId]
      );
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting booking: ${error.message}`);
    }
  }

  /**
   * Get resource availability for a date
   */
  static async getResourceAvailability(resourceId, bookingDate) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT start_time, end_time FROM bookings
         WHERE resource_id = ? AND booking_date = ? AND status = 'APPROVED'
         ORDER BY start_time`,
        [resourceId, bookingDate]
      );
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching availability: ${error.message}`);
    }
  }
}

module.exports = BookingModel;
