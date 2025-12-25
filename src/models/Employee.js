// Employee Model
// কর্মচারীদের তথ্য পরিচালনা

const { query } = require('../config/database');

class Employee {
  // =============================================
  // CREATE - নতুন employee তৈরি করা
  // =============================================
  static async create(employeeData) {
    try {
      const {
        user_id,
        employee_id,
        designation,
        salary,
        joining_date,
        assigned_stall_id,
        shift_timing,
        status
      } = employeeData;

      const sql = `
        INSERT INTO employees (
          user_id, employee_id, designation, salary, joining_date,
          assigned_stall_id, shift_timing, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        user_id,
        employee_id,
        designation,
        salary,
        joining_date || new Date(),
        assigned_stall_id || null,
        shift_timing || 'full_day',
        status || 'active'
      ];

      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Employee create error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY ID - ID দিয়ে employee খোঁজা
  // =============================================
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          e.*,
          u.full_name,
          u.email,
          u.phone,
          u.profile_picture,
          s.stall_name,
          s.stall_code
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN stalls s ON e.assigned_stall_id = s.id
        WHERE e.id = $1
      `;

      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Employee findById error:', error.message);
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
          e.*,
          u.full_name,
          u.email,
          u.phone,
          s.stall_name
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN stalls s ON e.assigned_stall_id = s.id
        WHERE e.user_id = $1
      `;

      const result = await query(sql, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Employee findByUserId error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY EMPLOYEE ID - Employee ID দিয়ে খোঁজা
  // =============================================
  static async findByEmployeeId(employeeId) {
    try {
      const sql = `
        SELECT 
          e.*,
          u.full_name,
          u.email,
          u.phone
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE e.employee_id = $1
      `;

      const result = await query(sql, [employeeId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Employee findByEmployeeId error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND ALL - সব employees fetch করা
  // =============================================
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT 
          e.*,
          u.full_name,
          u.email,
          u.phone,
          s.stall_name,
          s.stall_code
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN stalls s ON e.assigned_stall_id = s.id
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 1;

      // Stall filter
      if (filters.stall_id) {
        sql += ` AND e.assigned_stall_id = $${paramCount}`;
        values.push(filters.stall_id);
        paramCount++;
      }

      // Status filter
      if (filters.status) {
        sql += ` AND e.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      // Designation filter
      if (filters.designation) {
        sql += ` AND e.designation = $${paramCount}`;
        values.push(filters.designation);
        paramCount++;
      }

      // Search by name বা employee_id
      if (filters.search) {
        sql += ` AND (u.full_name ILIKE $${paramCount} OR e.employee_id ILIKE $${paramCount})`;
        values.push(`%${filters.search}%`);
        paramCount++;
      }

      sql += ` ORDER BY e.created_at DESC`;

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
      console.error('❌ Employee findAll error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE - Employee তথ্য update করা
  // =============================================
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'designation', 'salary', 'assigned_stall_id', 'shift_timing', 'status'
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
        UPDATE employees
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Employee update error:', error.message);
      throw error;
    }
  }

  // =============================================
  // DELETE - Employee মুছে ফেলা
  // =============================================
  static async delete(id) {
    try {
      const sql = 'DELETE FROM employees WHERE id = $1 RETURNING id';
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Employee delete error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET BY STALL - নির্দিষ্ট stall এর employees
  // =============================================
  static async getByStall(stallId) {
    try {
      const sql = `
        SELECT 
          e.*,
          u.full_name,
          u.email,
          u.phone,
          u.profile_picture
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE e.assigned_stall_id = $1 AND e.status = 'active'
        ORDER BY e.designation, u.full_name
      `;

      const result = await query(sql, [stallId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Employee getByStall error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE SALARY - Salary update করা
  // =============================================
  static async updateSalary(id, newSalary) {
    try {
      const sql = `
        UPDATE employees
        SET salary = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await query(sql, [newSalary, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Employee updateSalary error:', error.message);
      throw error;
    }
  }

  // =============================================
  // ASSIGN TO STALL - Stall এ assign করা
  // =============================================
  static async assignToStall(employeeId, stallId) {
    try {
      const sql = `
        UPDATE employees
        SET assigned_stall_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await query(sql, [stallId, employeeId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Employee assignToStall error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET EMPLOYEE ATTENDANCE - Employee এর attendance
  // =============================================
  static async getAttendance(employeeId, startDate, endDate) {
    try {
      const sql = `
        SELECT 
          a.*,
          s.stall_name
        FROM attendance a
        JOIN stalls s ON a.stall_id = s.id
        WHERE a.employee_id = $1
          AND a.attendance_date BETWEEN $2 AND $3
        ORDER BY a.attendance_date DESC
      `;

      const result = await query(sql, [employeeId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('❌ Employee getAttendance error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET ACTIVE COUNT - Active employees সংখ্যা
  // =============================================
  static async getActiveCount(stallId = null) {
    try {
      let sql = `
        SELECT COUNT(*) as count
        FROM employees
        WHERE status = 'active'
      `;

      const values = [];

      if (stallId) {
        sql += ' AND assigned_stall_id = $1';
        values.push(stallId);
      }

      const result = await query(sql, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Employee getActiveCount error:', error.message);
      throw error;
    }
  }

  // =============================================
  // CHECK EMPLOYEE ID EXISTS - Employee ID exist করে কিনা
  // =============================================
  static async checkEmployeeIdExists(employeeId, excludeId = null) {
    try {
      let sql = 'SELECT id FROM employees WHERE employee_id = $1';
      const values = [employeeId];

      if (excludeId) {
        sql += ' AND id != $2';
        values.push(excludeId);
      }

      const result = await query(sql, values);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Employee checkEmployeeIdExists error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET STATISTICS - Employee statistics
  // =============================================
  static async getStatistics() {
    try {
      const sql = `
        SELECT 
          status,
          COUNT(*) as count,
          AVG(salary) as avg_salary
        FROM employees
        GROUP BY status
      `;

      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('❌ Employee getStatistics error:', error.message);
      throw error;
    }
  }
}

module.exports = Employee;