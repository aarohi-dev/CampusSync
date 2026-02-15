const pool = require('../config/db');

/**
 * Resource Model - Database operations for resources
 */

class ResourceModel {
  /**
   * Get all resources
   */
  static async getAll(filters = {}, limit = 50, offset = 0) {
    try {
      const connection = await pool.getConnection();

      let query = 'SELECT * FROM resources WHERE 1=1';
      const params = [];

      // Apply filters
      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await connection.query(query, params);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching resources: ${error.message}`);
    }
  }

  /**
   * Get resource by ID
   */
  static async getById(resourceId) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM resources WHERE id = ?',
        [resourceId]
      );
      connection.release();
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching resource: ${error.message}`);
    }
  }

  /**
   * Create new resource (admin only)
   */
  static async create(name, type, location, capacity) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        `INSERT INTO resources (name, type, location, capacity, is_active)
         VALUES (?, ?, ?, ?, TRUE)`,
        [name, type, location, capacity]
      );
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating resource: ${error.message}`);
    }
  }

  /**
   * Update resource (admin only)
   */
  static async update(resourceId, updateData) {
    try {
      const connection = await pool.getConnection();

      let query = 'UPDATE resources SET ';
      const params = [];
      const fields = [];

      if (updateData.name !== undefined) {
        fields.push('name = ?');
        params.push(updateData.name);
      }

      if (updateData.type !== undefined) {
        fields.push('type = ?');
        params.push(updateData.type);
      }

      if (updateData.location !== undefined) {
        fields.push('location = ?');
        params.push(updateData.location);
      }

      if (updateData.capacity !== undefined) {
        fields.push('capacity = ?');
        params.push(updateData.capacity);
      }

      if (updateData.is_active !== undefined) {
        fields.push('is_active = ?');
        params.push(updateData.is_active);
      }

      if (fields.length === 0) {
        connection.release();
        return false;
      }

      query += fields.join(', ') + ' WHERE id = ?';
      params.push(resourceId);

      const [result] = await connection.query(query, params);
      connection.release();

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating resource: ${error.message}`);
    }
  }

  /**
   * Delete resource (admin only)
   */
  static async delete(resourceId) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'DELETE FROM resources WHERE id = ?',
        [resourceId]
      );
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting resource: ${error.message}`);
    }
  }

  /**
   * Get resources by type
   */
  static async getByType(type) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM resources WHERE type = ? AND is_active = TRUE',
        [type]
      );
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching resources by type: ${error.message}`);
    }
  }

  /**
   * Get available resources count
   */
  static async getAvailableCount(resourceId, bookingDate, startTime, endTime) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT COUNT(*) as overlap_count FROM bookings
         WHERE resource_id = ? 
           AND booking_date = ? 
           AND status = 'APPROVED'
           AND (? < end_time AND ? > start_time)`,
        [resourceId, bookingDate, startTime, endTime]
      );
      connection.release();
      return rows[0].overlap_count === 0;
    } catch (error) {
      throw new Error(`Error checking availability: ${error.message}`);
    }
  }
}

module.exports = ResourceModel;
