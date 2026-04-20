const pool = require('../config/db');

/**
 * User Model - Database operations for users
 * UPDATED FOR NORMALIZED SCHEMA (3NF)
 */

class UserModel {
  /**
   * Find user by email
   * NORMALIZED: Joins with roles table via FK
   */
  static async findByEmail(email) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT u.id, u.name, u.email, u.password, r.role_name as role, u.is_active, u.created_at
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.email = ?`,
        [email]
      );
      connection.release();
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   * NORMALIZED: Joins with roles table via FK
   */
  static async findById(id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT u.id, u.name, u.email, r.role_name as role, u.is_active, u.created_at
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [id]
      );
      connection.release();
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding user by id: ${error.message}`);
    }
  }

  /**
   * Create new user
   * NORMALIZED: Accepts role_id directly (FK to roles table)
   */
  static async create(name, email, password, roleId) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        `INSERT INTO users (name, email, password, role_id, is_active)
         VALUES (?, ?, ?, ?, TRUE)`,
        [name, email, password, roleId]
      );
      connection.release();
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Email already registered');
      }
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  /**
   * Get role ID by role name
   */
  static async getRoleIdByName(roleName) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        'SELECT id FROM roles WHERE role_name = ?',
        [roleName]
      );
      connection.release();
      return rows[0]?.id || null;
    } catch (error) {
      throw new Error(`Error getting role: ${error.message}`);
    }
  }

  /**
   * Get all users (admin only)
   * NORMALIZED: Joins with roles table
   */
  static async getAll(limit = 50, offset = 0) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT u.id, u.name, u.email, r.role_name as role, u.is_active, u.created_at
         FROM users u
         JOIN roles r ON u.role_id = r.id
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching all users: ${error.message}`);
    }
  }

  /**
   * Update user (partial)
   * NORMALIZED: Updates specific fields while maintaining referential integrity
   */
  static async update(id, updates) {
    try {
      const connection = await pool.getConnection();
      
      const allowedFields = ['name', 'email', 'is_active'];
      const fields = Object.keys(updates).filter(k => allowedFields.includes(k));
      
      if (fields.length === 0) {
        connection.release();
        throw new Error('No valid fields to update');
      }
      
      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = fields.map(f => updates[f]);
      values.push(id);
      
      const [result] = await connection.query(
        `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  /**
   * Get users by role
   * NORMALIZED: Query by role_id FK
   */
  static async getByRole(roleId, limit = 50, offset = 0) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT u.id, u.name, u.email, r.role_name as role, u.is_active, u.created_at
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.role_id = ?
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [roleId, limit, offset]
      );
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching users by role: ${error.message}`);
    }
  }

  /**
   * Deactivate user (soft delete)
   * NORMALIZED: Sets is_active flag instead of deletion
   */
  static async deactivate(id) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        `UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
      );
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deactivating user: ${error.message}`);
    }
  }
}

module.exports = UserModel;
