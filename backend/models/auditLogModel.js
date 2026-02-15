const pool = require('../config/db');

/**
 * Audit Log Model - Database operations for audit logs
 */

class AuditLogModel {
  /**
   * Create audit log entry
   */
  static async create(action, userId, resourceId = null, bookingId = null, details = null) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        `INSERT INTO audit_logs (action, user_id, resource_id, booking_id, action_details)
         VALUES (?, ?, ?, ?, ?)`,
        [action, userId, resourceId, bookingId, details ? JSON.stringify(details) : null]
      );
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating audit log: ${error.message}`);
    }
  }

  /**
   * Get all audit logs (admin only)
   */
  static async getAll(filters = {}, limit = 100, offset = 0) {
    try {
      const connection = await pool.getConnection();

      let query = `SELECT al.*, u.name as user_name, u.email as user_email
                   FROM audit_logs al
                   JOIN users u ON al.user_id = u.id
                   WHERE 1=1`;
      
      const params = [];

      // Apply filters
      if (filters.action) {
        query += ' AND al.action = ?';
        params.push(filters.action);
      }

      if (filters.user_id) {
        query += ' AND al.user_id = ?';
        params.push(filters.user_id);
      }

      if (filters.start_date) {
        query += ' AND DATE(al.timestamp) >= ?';
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ' AND DATE(al.timestamp) <= ?';
        params.push(filters.end_date);
      }

      query += ' ORDER BY al.timestamp DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await connection.query(query, params);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching audit logs: ${error.message}`);
    }
  }

  /**
   * Get log by ID
   */
  static async getById(logId) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT al.*, u.name as user_name FROM audit_logs al
         JOIN users u ON al.user_id = u.id
         WHERE al.id = ?`,
        [logId]
      );
      connection.release();
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching audit log: ${error.message}`);
    }
  }

  /**
   * Get user's action logs
   */
  static async getByUserId(userId, limit = 50, offset = 0) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT * FROM audit_logs
         WHERE user_id = ?
         ORDER BY timestamp DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching user logs: ${error.message}`);
    }
  }
}

module.exports = AuditLogModel;
