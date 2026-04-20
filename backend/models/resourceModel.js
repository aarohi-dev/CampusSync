const pool = require('../config/db');

/**
 * Resource Model - Database operations for resources
 * UPDATED FOR NORMALIZED SCHEMA (3NF)
 * - Uses resource_type_id FK to resource_types table
 * - Uses location_id FK to locations table
 */

class ResourceModel {
  /**
   * Get all resources with normalized joins
   * NORMALIZED: Joins with resource_types and locations tables
   */
  static async getAll(filters = {}, limit = 50, offset = 0) {
    try {
      const connection = await pool.getConnection();

      let query = `SELECT 
                      r.id, r.name, r.capacity, r.is_active,
                      r.created_at, r.updated_at,
                      rt.type_name as type,
                      l.building_name, l.floor, l.room_number, l.description as location_description
                   FROM resources r
                   JOIN resource_types rt ON r.resource_type_id = rt.id
                   JOIN locations l ON r.location_id = l.id
                   WHERE 1=1`;
      const params = [];

      // Apply filters using normalized table names
      if (filters.type) {
        query += ' AND rt.type_name = ?';
        params.push(filters.type);
      }

      if (filters.is_active !== undefined) {
        query += ' AND r.is_active = ?';
        params.push(filters.is_active);
      }

      if (filters.building_name) {
        query += ' AND l.building_name = ?';
        params.push(filters.building_name);
      }

      query += ' ORDER BY r.id LIMIT ? OFFSET ?';
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
   * NORMALIZED: Joins with resource_types and locations tables
   */
  static async getById(resourceId) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT 
            r.id, r.name, r.capacity, r.is_active, r.created_at, r.updated_at,
            rt.type_name as type,
            l.building_name, l.floor, l.room_number, l.description as location_description
         FROM resources r
         JOIN resource_types rt ON r.resource_type_id = rt.id
         JOIN locations l ON r.location_id = l.id
         WHERE r.id = ?`,
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
   * NORMALIZED: Requires resource_type_id and location_id (FKs)
   */
  static async create(name, resourceTypeId, locationId, capacity) {
    try {
      const connection = await pool.getConnection();
      
      // Verify resource type exists
      const [typeCheck] = await connection.query(
        'SELECT id FROM resource_types WHERE id = ?',
        [resourceTypeId]
      );
      if (typeCheck.length === 0) {
        connection.release();
        throw new Error('Resource type not found');
      }
      
      // Verify location exists
      const [locCheck] = await connection.query(
        'SELECT id FROM locations WHERE id = ?',
        [locationId]
      );
      if (locCheck.length === 0) {
        connection.release();
        throw new Error('Location not found');
      }
      
      const [result] = await connection.query(
        `INSERT INTO resources (name, resource_type_id, location_id, capacity, is_active)
         VALUES (?, ?, ?, ?, TRUE)`,
        [name, resourceTypeId, locationId, capacity]
      );
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating resource: ${error.message}`);
    }
  }

  /**
   * Update resource (admin only)
   * NORMALIZED: Can update resource_type_id and location_id (FKs)
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

      if (updateData.resource_type_id !== undefined) {
        fields.push('resource_type_id = ?');
        params.push(updateData.resource_type_id);
      }

      if (updateData.location_id !== undefined) {
        fields.push('location_id = ?');
        params.push(updateData.location_id);
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

      fields.push('updated_at = CURRENT_TIMESTAMP');
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
   * Soft delete resource (admin only)
   * NORMALIZED: Sets is_active to FALSE instead of hard delete
   */
  static async deactivate(resourceId) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        `UPDATE resources SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [resourceId]
      );
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deactivating resource: ${error.message}`);
    }
  }

  /**
   * Get resources by type ID
   * NORMALIZED: Queries by resource_type_id FK
   */
  static async getByType(typeId) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT 
            r.id, r.name, r.capacity, r.is_active,
            rt.type_name as type,
            l.building_name, l.floor, l.room_number
         FROM resources r
         JOIN resource_types rt ON r.resource_type_id = rt.id
         JOIN locations l ON r.location_id = l.id
         WHERE r.resource_type_id = ? AND r.is_active = TRUE`,
        [typeId]
      );
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching resources by type: ${error.message}`);
    }
  }

  /**
   * Get available resources count
   * NORMALIZED: Uses status_id FK to booking_statuses (approved status id = 2)
   */
  static async getAvailableCount(resourceId, bookingDate, startTime, endTime) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT COUNT(*) as overlap_count FROM bookings
         WHERE resource_id = ? 
           AND booking_date = ? 
           AND status_id = 2
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
