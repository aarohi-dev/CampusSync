const pool = require('../config/db');

/**
 * User Model - Database operations for users
 */

class UserModel {
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT u.id, u.name, u.email, u.password, r.role_name as role, u.created_at
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
   */
  static async findById(id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT u.id, u.name, u.email, r.role_name as role, u.created_at
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
   */
  static async create(name, email, hashedPassword, roleId) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, roleId]
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
   */
  static async getAll(limit = 50, offset = 0) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT u.id, u.name, u.email, r.role_name as role, u.created_at
         FROM users u
         JOIN roles r ON u.role_id = r.id
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }
}

module.exports = UserModel;
