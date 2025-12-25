// Stall Model
// খাবারের দোকান/স্টল সংক্রান্ত সব operations

const { query } = require('../config/database');

class Stall {
  // =============================================
  // CREATE - নতুন stall তৈরি করা
  // =============================================
  static async create(stallData) {
    try {
      const {
        stall_name,
        stall_code,
        location,
        latitude,
        longitude,
        opening_time,
        closing_time,
        manager_id,
        status,
        qr_code
      } = stallData;

      const sql = `
        INSERT INTO stalls (
          stall_name, stall_code, location, latitude, longitude,
          opening_time, closing_time, manager_id, status, qr_code
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        stall_name,
        stall_code,
        location,
        latitude || null,
        longitude || null,
        opening_time || '09:00:00',
        closing_time || '22:00:00',
        manager_id || null,
        status || 'active',
        qr_code || null
      ];

      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Stall create error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY ID - ID দিয়ে stall খোঁজা
  // =============================================
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          s.*,
          u.full_name as manager_name,
          e.employee_id as manager_employee_id
        FROM stalls s
        LEFT JOIN employees e ON s.manager_id = e.id
        LEFT JOIN users u ON e.user_id = u.id
        WHERE s.id = $1
      `;

      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Stall findById error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY CODE - Stall code দিয়ে খোঁজা
  // =============================================
  static async findByCode(stall_code) {
    try {
      const sql = 'SELECT * FROM stalls WHERE stall_code = $1';
      const result = await query(sql, [stall_code]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Stall findByCode error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND ALL - সব stalls fetch করা
  // =============================================
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT 
          s.*,
          u.full_name as manager_name,
          COUNT(DISTINCT e.id) as total_employees
        FROM stalls s
        LEFT JOIN employees em ON s.manager_id = em.id
        LEFT JOIN users u ON em.user_id = u.id
        LEFT JOIN employees e ON s.id = e.assigned_stall_id AND e.status = 'active'
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 1;

      // Status filter
      if (filters.status) {
        sql += ` AND s.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      // Search by name বা code
      if (filters.search) {
        sql += ` AND (s.stall_name ILIKE $${paramCount} OR s.stall_code ILIKE $${paramCount})`;
        values.push(`%${filters.search}%`);
        paramCount++;
      }

      sql += ` GROUP BY s.id, u.full_name ORDER BY s.created_at DESC`;

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
      console.error('❌ Stall findAll error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE - Stall তথ্য update করা
  // =============================================
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'stall_name', 'location', 'latitude', 'longitude',
        'opening_time', 'closing_time', 'manager_id', 'status', 'qr_code'
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
        UPDATE stalls
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Stall update error:', error.message);
      throw error;
    }
  }

  // =============================================
  // DELETE - Stall মুছে ফেলা
  // =============================================
  static async delete(id) {
    try {
      const sql = 'DELETE FROM stalls WHERE id = $1 RETURNING id';
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Stall delete error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET ACTIVE STALLS - শুধুমাত্র active stalls
  // =============================================
  static async getActiveStalls() {
    try {
      const sql = `
        SELECT 
          s.id,
          s.stall_name,
          s.stall_code,
          s.location,
          s.opening_time,
          s.closing_time,
          u.full_name as manager_name
        FROM stalls s
        LEFT JOIN employees e ON s.manager_id = e.id
        LEFT JOIN users u ON e.user_id = u.id
        WHERE s.status = 'active'
        ORDER BY s.stall_name
      `;

      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('❌ Stall getActiveStalls error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET STALL WITH EMPLOYEES - Employee সহ stall info
  // =============================================
  static async getStallWithEmployees(stallId) {
    try {
      const sql = `
        SELECT 
          s.*,
          json_agg(
            json_build_object(
              'id', e.id,
              'employee_id', e.employee_id,
              'name', u.full_name,
              'designation', e.designation,
              'shift_timing', e.shift_timing,
              'status', e.status
            )
          ) FILTER (WHERE e.id IS NOT NULL) as employees
        FROM stalls s
        LEFT JOIN employees e ON s.id = e.assigned_stall_id
        LEFT JOIN users u ON e.user_id = u.id
        WHERE s.id = $1
        GROUP BY s.id
      `;

      const result = await query(sql, [stallId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Stall getStallWithEmployees error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND NEARBY - নিকটবর্তী stalls খোঁজা (GPS based)
  // =============================================
  static async findNearby(latitude, longitude, radiusKm = 5) {
    try {
      const sql = `
        SELECT 
          *,
          (
            6371 * acos(
              cos(radians($1)) * cos(radians(latitude)) *
              cos(radians(longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(latitude))
            )
          ) AS distance_km
        FROM stalls
        WHERE 
          status = 'active'
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
        HAVING distance_km < $3
        ORDER BY distance_km
      `;

      const result = await query(sql, [latitude, longitude, radiusKm]);
      return result.rows;
    } catch (error) {
      console.error('❌ Stall findNearby error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET STALL STATISTICS - Stall এর statistics
  // =============================================
  static async getStatistics(stallId) {
    try {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM employees WHERE assigned_stall_id = $1 AND status = 'active') as total_employees,
          (SELECT COUNT(*) FROM orders WHERE stall_id = $1 AND DATE(created_at) = CURRENT_DATE) as today_orders,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE stall_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'completed') as today_revenue,
          (SELECT COUNT(*) FROM reviews WHERE stall_id = $1) as total_reviews,
          (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE stall_id = $1) as average_rating
      `;

      const result = await query(sql, [stallId]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Stall getStatistics error:', error.message);
      throw error;
    }
  }

  // =============================================
  // CHECK IF CODE EXISTS - Code exist করে কিনা
  // =============================================
  static async checkCodeExists(stall_code, excludeId = null) {
    try {
      let sql = 'SELECT id FROM stalls WHERE stall_code = $1';
      const values = [stall_code];

      if (excludeId) {
        sql += ' AND id != $2';
        values.push(excludeId);
      }

      const result = await query(sql, values);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Stall checkCodeExists error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE STATUS - Status update করা
  // =============================================
  static async updateStatus(id, status) {
    try {
      const sql = `
        UPDATE stalls
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await query(sql, [status, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Stall updateStatus error:', error.message);
      throw error;
    }
  }
}

module.exports = Stall;