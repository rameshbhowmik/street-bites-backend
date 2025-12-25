// User Model
// সব ধরনের user এর জন্য model (Owner, Investor, Employee, Customer)

const { query } = require('../config/database');

class User {
  // =============================================
  // CREATE - নতুন user তৈরি করা
  // =============================================
  static async create(userData) {
    try {
      const { email, password_hash, phone, full_name, role, profile_picture, status } = userData;

      const sql = `
        INSERT INTO users (email, password_hash, phone, full_name, role, profile_picture, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        email,
        password_hash,
        phone,
        full_name,
        role || 'customer',
        profile_picture || null,
        status || 'active'
      ];

      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ User create error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY ID - ID দিয়ে user খোঁজা
  // =============================================
  static async findById(id) {
    try {
      const sql = `
        SELECT id, email, phone, full_name, role, profile_picture, status, created_at, updated_at
        FROM users
        WHERE id = $1
      `;

      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ User findById error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY EMAIL - Email দিয়ে user খোঁজা
  // =============================================
  static async findByEmail(email) {
    try {
      const sql = `
        SELECT *
        FROM users
        WHERE email = $1
      `;

      const result = await query(sql, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ User findByEmail error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY PHONE - Phone দিয়ে user খোঁজা
  // =============================================
  static async findByPhone(phone) {
    try {
      const sql = `
        SELECT *
        FROM users
        WHERE phone = $1
      `;

      const result = await query(sql, [phone]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ User findByPhone error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND ALL - সব users fetch করা
  // =============================================
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT id, email, phone, full_name, role, profile_picture, status, created_at, updated_at
        FROM users
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 1;

      // Role filter
      if (filters.role) {
        sql += ` AND role = $${paramCount}`;
        values.push(filters.role);
        paramCount++;
      }

      // Status filter
      if (filters.status) {
        sql += ` AND status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      // Search by name বা email
      if (filters.search) {
        sql += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        values.push(`%${filters.search}%`);
        paramCount++;
      }

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      sql += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      values.push(limit, offset);

      const result = await query(sql, values);
      return result.rows;
    } catch (error) {
      console.error('❌ User findAll error:', error.message);
      throw error;
    }
  }

  // =============================================
  // COUNT - মোট users সংখ্যা
  // =============================================
  static async count(filters = {}) {
    try {
      let sql = 'SELECT COUNT(*) FROM users WHERE 1=1';
      const values = [];
      let paramCount = 1;

      if (filters.role) {
        sql += ` AND role = $${paramCount}`;
        values.push(filters.role);
        paramCount++;
      }

      if (filters.status) {
        sql += ` AND status = $${paramCount}`;
        values.push(filters.status);
      }

      const result = await query(sql, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ User count error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE - User তথ্য update করা
  // =============================================
  static async update(id, updateData) {
    try {
      const allowedFields = ['email', 'phone', 'full_name', 'profile_picture', 'status'];
      const updates = [];
      const values = [];
      let paramCount = 1;

      // শুধুমাত্র allowed fields update করা
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = $${paramCount}`);
          values.push(updateData[field]);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        throw new Error('কোন update data প্রদান করা হয়নি');
      }

      values.push(id);

      const sql = `
        UPDATE users
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING id, email, phone, full_name, role, profile_picture, status, created_at, updated_at
      `;

      const result = await query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ User update error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE PASSWORD - Password update করা
  // =============================================
  static async updatePassword(id, newPasswordHash) {
    try {
      const sql = `
        UPDATE users
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email
      `;

      const result = await query(sql, [newPasswordHash, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ User updatePassword error:', error.message);
      throw error;
    }
  }

  // =============================================
  // DELETE - User মুছে ফেলা (Soft delete)
  // =============================================
  static async delete(id) {
    try {
      const sql = `
        UPDATE users
        SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `;

      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ User delete error:', error.message);
      throw error;
    }
  }

  // =============================================
  // HARD DELETE - সম্পূর্ণভাবে মুছে ফেলা
  // =============================================
  static async hardDelete(id) {
    try {
      const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ User hardDelete error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY ROLE - নির্দিষ্ট role এর users
  // =============================================
  static async findByRole(role, limit = 50, offset = 0) {
    try {
      const sql = `
        SELECT id, email, phone, full_name, role, profile_picture, status, created_at
        FROM users
        WHERE role = $1 AND status = 'active'
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await query(sql, [role, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('❌ User findByRole error:', error.message);
      throw error;
    }
  }

  // =============================================
  // CHECK IF EXISTS - Email বা phone exist করে কিনা
  // =============================================
  static async checkExists(email, phone, excludeId = null) {
    try {
      let sql = `
        SELECT id, email, phone
        FROM users
        WHERE (email = $1 OR phone = $2)
      `;

      const values = [email, phone];

      if (excludeId) {
        sql += ' AND id != $3';
        values.push(excludeId);
      }

      const result = await query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ User checkExists error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET STATISTICS - User statistics
  // =============================================
  static async getStatistics() {
    try {
      const sql = `
        SELECT 
          role,
          status,
          COUNT(*) as count
        FROM users
        GROUP BY role, status
        ORDER BY role, status
      `;

      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('❌ User getStatistics error:', error.message);
      throw error;
    }
  }
}

module.exports = User;