const pool = require('../config/db');

/**
 * Audit Log Model - Database operations for audit logs
 * UPDATED FOR NORMALIZED SCHEMA (3NF)
 * - Uses action_type_id FK to audit_action_types table
 */

class AuditLogModel {
  /**
   * Create audit log entry
   * NORMALIZED: Uses action_type_id FK instead of action string
   */
  static async create(actionType, userId, resourceId = null, bookingId = null, details = null) {
    try {
      const connection = await pool.getConnection();
      
      // Get action type ID from action type name
      const [actionRows] = await connection.query(
        'SELECT id FROM audit_action_types WHERE action_type = ?',
        [actionType]
      );
      
      if (actionRows.length === 0) {
        connection.release();
        throw new Error(`Invalid action type: ${actionType}`);
      }
      
      const actionTypeId = actionRows[0].id;
      
      const [result] = await connection.query(
        `INSERT INTO audit_logs (action_type_id, user_id, resource_id, booking_id, action_details)
         VALUES (?, ?, ?, ?, ?)`,
        [actionTypeId, userId, resourceId, bookingId, details ? JSON.stringify(details) : null]
      );
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating audit log: ${error.message}`);
    }
  }

  /**
   * Get all audit logs (admin only)
   * NORMALIZED: Joins with audit_action_types table
   */
  static async getAll(filters = {}, limit = 100, offset = 0) {
    try {
      const connection = await pool.getConnection();

      let query = `SELECT al.id, al.resource_id, al.booking_id, al.action_details, al.timestamp,
                          u.name as user_name, u.email as user_email,
                          aat.action_type as action
                   FROM audit_logs al
                   JOIN users u ON al.user_id = u.id
                   JOIN audit_action_types aat ON al.action_type_id = aat.id
                   WHERE 1=1`;
      
      const params = [];

      // Apply filters using action type name
      if (filters.action) {
        query += ' AND aat.action_type = ?';
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
   * NORMALIZED: Joins with audit_action_types table
   */
  static async getById(logId) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT al.id, al.resource_id, al.booking_id, al.action_details, al.timestamp,
                u.name as user_name, aat.action_type as action
         FROM audit_logs al
         JOIN users u ON al.user_id = u.id
         JOIN audit_action_types aat ON al.action_type_id = aat.id
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
   * NORMALIZED: Joins with audit_action_types table
   */
  static async getByUserId(userId, limit = 50, offset = 0) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT al.id, al.resource_id, al.booking_id, al.action_details, al.timestamp,
                aat.action_type as action
         FROM audit_logs al
         JOIN audit_action_types aat ON al.action_type_id = aat.id
         WHERE al.user_id = ?
         ORDER BY al.timestamp DESC
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
