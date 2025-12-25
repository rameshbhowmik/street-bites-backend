// Transaction Model
// লেনদেন সংক্রান্ত সব operations

const { query } = require('../config/database');

class Transaction {
  // =============================================
  // CREATE - নতুন transaction তৈরি করা
  // =============================================
  static async create(transactionData) {
    try {
      const {
        transaction_type,
        amount,
        reference_id,
        reference_type,
        description,
        payment_method,
        created_by,
        transaction_date
      } = transactionData;

      const sql = `
        INSERT INTO transactions (
          transaction_type, amount, reference_id, reference_type,
          description, payment_method, created_by, transaction_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        transaction_type,
        amount,
        reference_id || null,
        reference_type || null,
        description || null,
        payment_method,
        created_by,
        transaction_date || new Date()
      ];

      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Transaction create error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY ID - ID দিয়ে transaction খোঁজা
  // =============================================
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          t.*,
          u.full_name as created_by_name
        FROM transactions t
        JOIN users u ON t.created_by = u.id
        WHERE t.id = $1
      `;

      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Transaction findById error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND ALL - সব transactions fetch করা
  // =============================================
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT 
          t.*,
          u.full_name as created_by_name
        FROM transactions t
        JOIN users u ON t.created_by = u.id
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 1;

      // Transaction type filter
      if (filters.transaction_type) {
        sql += ` AND t.transaction_type = $${paramCount}`;
        values.push(filters.transaction_type);
        paramCount++;
      }

      // Payment method filter
      if (filters.payment_method) {
        sql += ` AND t.payment_method = $${paramCount}`;
        values.push(filters.payment_method);
        paramCount++;
      }

      // Date range filter
      if (filters.start_date) {
        sql += ` AND DATE(t.transaction_date) >= $${paramCount}`;
        values.push(filters.start_date);
        paramCount++;
      }

      if (filters.end_date) {
        sql += ` AND DATE(t.transaction_date) <= $${paramCount}`;
        values.push(filters.end_date);
        paramCount++;
      }

      // Created by filter
      if (filters.created_by) {
        sql += ` AND t.created_by = $${paramCount}`;
        values.push(filters.created_by);
        paramCount++;
      }

      sql += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;

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
      console.error('❌ Transaction findAll error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET BY TYPE - Transaction type অনুযায়ী
  // =============================================
  static async getByType(transactionType, limit = 50) {
    try {
      const sql = `
        SELECT 
          t.*,
          u.full_name as created_by_name
        FROM transactions t
        JOIN users u ON t.created_by = u.id
        WHERE t.transaction_type = $1
        ORDER BY t.transaction_date DESC
        LIMIT $2
      `;

      const result = await query(sql, [transactionType, limit]);
      return result.rows;
    } catch (error) {
      console.error('❌ Transaction getByType error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET TODAY'S TRANSACTIONS - আজকের transactions
  // =============================================
  static async getTodayTransactions(transactionType = null) {
    try {
      let sql = `
        SELECT 
          t.*,
          u.full_name as created_by_name
        FROM transactions t
        JOIN users u ON t.created_by = u.id
        WHERE DATE(t.transaction_date) = CURRENT_DATE
      `;

      const values = [];

      if (transactionType) {
        sql += ' AND t.transaction_type = $1';
        values.push(transactionType);
      }

      sql += ' ORDER BY t.created_at DESC';

      const result = await query(sql, values);
      return result.rows;
    } catch (error) {
      console.error('❌ Transaction getTodayTransactions error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET DAILY SUMMARY - দৈনিক সংক্ষিপ্ত হিসাব
  // =============================================
  static async getDailySummary(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const sql = `
        SELECT 
          transaction_type,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          payment_method,
          COUNT(DISTINCT created_by) as unique_users
        FROM transactions
        WHERE DATE(transaction_date) = $1
        GROUP BY transaction_type, payment_method
        ORDER BY transaction_type, payment_method
      `;

      const result = await query(sql, [targetDate]);
      return result.rows;
    } catch (error) {
      console.error('❌ Transaction getDailySummary error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET REVENUE - নির্দিষ্ট সময়ের revenue
  // =============================================
  static async getRevenue(startDate, endDate) {
    try {
      const sql = `
        SELECT 
          SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) as total_sales,
          SUM(CASE WHEN transaction_type IN ('expense', 'salary') THEN amount ELSE 0 END) as total_expenses,
          SUM(CASE 
            WHEN transaction_type = 'sale' THEN amount 
            WHEN transaction_type IN ('expense', 'salary') THEN -amount 
            ELSE 0 
          END) as net_profit,
          COUNT(CASE WHEN transaction_type = 'sale' THEN 1 END) as sale_count,
          COUNT(CASE WHEN transaction_type IN ('expense', 'salary') THEN 1 END) as expense_count
        FROM transactions
        WHERE DATE(transaction_date) BETWEEN $1 AND $2
      `;

      const result = await query(sql, [startDate, endDate]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Transaction getRevenue error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET BY REFERENCE - Reference অনুযায়ী
  // =============================================
  static async getByReference(referenceId, referenceType) {
    try {
      const sql = `
        SELECT 
          t.*,
          u.full_name as created_by_name
        FROM transactions t
        JOIN users u ON t.created_by = u.id
        WHERE t.reference_id = $1 AND t.reference_type = $2
        ORDER BY t.created_at DESC
      `;

      const result = await query(sql, [referenceId, referenceType]);
      return result.rows;
    } catch (error) {
      console.error('❌ Transaction getByReference error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET PAYMENT METHOD STATS - Payment method statistics
  // =============================================
  static async getPaymentMethodStats(startDate, endDate) {
    try {
      const sql = `
        SELECT 
          payment_method,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount
        FROM transactions
        WHERE DATE(transaction_date) BETWEEN $1 AND $2
        GROUP BY payment_method
        ORDER BY total_amount DESC
      `;

      const result = await query(sql, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('❌ Transaction getPaymentMethodStats error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET MONTHLY REPORT - মাসিক রিপোর্ট
  // =============================================
  static async getMonthlyReport(year, month) {
    try {
      const sql = `
        SELECT 
          DATE(transaction_date) as date,
          transaction_type,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM transactions
        WHERE 
          EXTRACT(YEAR FROM transaction_date) = $1
          AND EXTRACT(MONTH FROM transaction_date) = $2
        GROUP BY DATE(transaction_date), transaction_type
        ORDER BY date DESC, transaction_type
      `;

      const result = await query(sql, [year, month]);
      return result.rows;
    } catch (error) {
      console.error('❌ Transaction getMonthlyReport error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET STATISTICS - Transaction statistics
  // =============================================
  static async getStatistics(filters = {}) {
    try {
      let sql = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount,
          COUNT(DISTINCT payment_method) as payment_methods_used,
          COUNT(DISTINCT created_by) as unique_users
        FROM transactions
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 1;

      if (filters.start_date) {
        sql += ` AND DATE(transaction_date) >= $${paramCount}`;
        values.push(filters.start_date);
        paramCount++;
      }

      if (filters.end_date) {
        sql += ` AND DATE(transaction_date) <= $${paramCount}`;
        values.push(filters.end_date);
      }

      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Transaction getStatistics error:', error.message);
      throw error;
    }
  }

  // =============================================
  // DELETE - Transaction মুছে ফেলা
  // =============================================
  static async delete(id) {
    try {
      const sql = 'DELETE FROM transactions WHERE id = $1 RETURNING id';
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Transaction delete error:', error.message);
      throw error;
    }
  }
}

module.exports = Transaction;