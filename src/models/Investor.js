// Investor Model
// বিনিয়োগকারীদের তথ্য পরিচালনা

const { query } = require('../config/database');

class Investor {
  // =============================================
  // CREATE - নতুন investor তৈরি করা
  // =============================================
  static async create(investorData) {
    try {
      const {
        user_id,
        investment_amount,
        ownership_percentage,
        investment_date,
        bank_details,
        status
      } = investorData;

      const sql = `
        INSERT INTO investors (
          user_id, investment_amount, ownership_percentage,
          investment_date, bank_details, status
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        user_id,
        investment_amount,
        ownership_percentage,
        investment_date || new Date(),
        bank_details || null,
        status || 'active'
      ];

      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Investor create error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY ID - ID দিয়ে investor খোঁজা
  // =============================================
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          i.*,
          u.full_name,
          u.email,
          u.phone
        FROM investors i
        JOIN users u ON i.user_id = u.id
        WHERE i.id = $1
      `;

      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Investor findById error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY USER ID - User ID দিয়ে খোঁজা
  // =============================================
  static async findByUserId(userId) {
    try {
      const sql = `
        SELECT 
          i.*,
          u.full_name,
          u.email,
          u.phone
        FROM investors i
        JOIN users u ON i.user_id = u.id
        WHERE i.user_id = $1
      `;

      const result = await query(sql, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Investor findByUserId error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND ALL - সব investors fetch করা
  // =============================================
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT 
          i.*,
          u.full_name,
          u.email,
          u.phone
        FROM investors i
        JOIN users u ON i.user_id = u.id
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 1;

      // Status filter
      if (filters.status) {
        sql += ` AND i.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      sql += ` ORDER BY i.investment_amount DESC, i.investment_date DESC`;

      // Pagination
      if (filters.limit) {
        sql += ` LIMIT $${paramCount}`;
        values.push(filters.limit);
        paramCount++;

        if (filters.offset) {
          sql += ` OFFSET $${paramCount}`;
          values.push(filters.offset);
        }
      }

      const result = await query(sql, values);
      return result.rows;
    } catch (error) {
      console.error('❌ Investor findAll error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE - Investor তথ্য update করা
  // =============================================
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'investment_amount', 'ownership_percentage', 'bank_details', 'status'
      ];

      const updates = [];
      const values = [];
      let paramCount = 1;

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
        UPDATE investors
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Investor update error:', error.message);
      throw error;
    }
  }

  // =============================================
  // DELETE - Investor মুছে ফেলা
  // =============================================
  static async delete(id) {
    try {
      const sql = 'DELETE FROM investors WHERE id = $1 RETURNING id';
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Investor delete error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET ACTIVE INVESTORS - Active investors শুধু
  // =============================================
  static async getActiveInvestors() {
    try {
      const sql = `
        SELECT 
          i.*,
          u.full_name,
          u.email,
          u.phone
        FROM investors i
        JOIN users u ON i.user_id = u.id
        WHERE i.status = 'active'
        ORDER BY i.ownership_percentage DESC
      `;

      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('❌ Investor getActiveInvestors error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET TOTAL INVESTMENT - মোট বিনিয়োগ
  // =============================================
  static async getTotalInvestment() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_investors,
          SUM(investment_amount) as total_investment,
          SUM(ownership_percentage) as total_ownership,
          AVG(investment_amount) as avg_investment
        FROM investors
        WHERE status = 'active'
      `;

      const result = await query(sql);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Investor getTotalInvestment error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET STATISTICS - Investor statistics
  // =============================================
  static async getStatistics() {
    try {
      const sql = `
        SELECT 
          status,
          COUNT(*) as count,
          SUM(investment_amount) as total_amount,
          SUM(ownership_percentage) as total_ownership
        FROM investors
        GROUP BY status
        ORDER BY status
      `;

      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('❌ Investor getStatistics error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE STATUS - Status update করা
  // =============================================
  static async updateStatus(id, status) {
    try {
      const sql = `
        UPDATE investors
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await query(sql, [status, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Investor updateStatus error:', error.message);
      throw error;
    }
  }
}

module.exports = Investor;