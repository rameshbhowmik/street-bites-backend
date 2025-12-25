// Order Model
// অর্ডার সংক্রান্ত সব operations

const { query } = require('../config/database');

class Order {
  // =============================================
  // CREATE - নতুন order তৈরি করা
  // =============================================
  static async create(orderData) {
    try {
      const {
        order_number,
        customer_id,
        stall_id,
        order_type,
        total_amount,
        payment_status,
        payment_method,
        delivery_address,
        status
      } = orderData;

      const sql = `
        INSERT INTO orders (
          order_number, customer_id, stall_id, order_type, total_amount,
          payment_status, payment_method, delivery_address, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        order_number,
        customer_id,
        stall_id,
        order_type || 'pickup',
        total_amount,
        payment_status || 'pending',
        payment_method || null,
        delivery_address || null,
        status || 'pending'
      ];

      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Order create error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY ID - ID দিয়ে order খোঁজা
  // =============================================
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          o.*,
          u.full_name as customer_name,
          u.phone as customer_phone,
          s.stall_name,
          s.location as stall_location
        FROM orders o
        JOIN users u ON o.customer_id = u.id
        JOIN stalls s ON o.stall_id = s.id
        WHERE o.id = $1
      `;

      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Order findById error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY ORDER NUMBER - Order number দিয়ে খোঁজা
  // =============================================
  static async findByOrderNumber(orderNumber) {
    try {
      const sql = `
        SELECT 
          o.*,
          u.full_name as customer_name,
          u.phone as customer_phone,
          s.stall_name
        FROM orders o
        JOIN users u ON o.customer_id = u.id
        JOIN stalls s ON o.stall_id = s.id
        WHERE o.order_number = $1
      `;

      const result = await query(sql, [orderNumber]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Order findByOrderNumber error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND ALL - সব orders fetch করা
  // =============================================
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT 
          o.*,
          u.full_name as customer_name,
          s.stall_name
        FROM orders o
        JOIN users u ON o.customer_id = u.id
        JOIN stalls s ON o.stall_id = s.id
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 1;

      // Customer filter
      if (filters.customer_id) {
        sql += ` AND o.customer_id = $${paramCount}`;
        values.push(filters.customer_id);
        paramCount++;
      }

      // Stall filter
      if (filters.stall_id) {
        sql += ` AND o.stall_id = $${paramCount}`;
        values.push(filters.stall_id);
        paramCount++;
      }

      // Status filter
      if (filters.status) {
        sql += ` AND o.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      // Payment status filter
      if (filters.payment_status) {
        sql += ` AND o.payment_status = $${paramCount}`;
        values.push(filters.payment_status);
        paramCount++;
      }

      // Date range filter
      if (filters.start_date) {
        sql += ` AND DATE(o.created_at) >= $${paramCount}`;
        values.push(filters.start_date);
        paramCount++;
      }

      if (filters.end_date) {
        sql += ` AND DATE(o.created_at) <= $${paramCount}`;
        values.push(filters.end_date);
        paramCount++;
      }

      sql += ` ORDER BY o.created_at DESC`;

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
      console.error('❌ Order findAll error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE - Order তথ্য update করা
  // =============================================
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'status', 'payment_status', 'payment_method', 'delivery_address'
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
        UPDATE orders
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Order update error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE STATUS - Order status update করা
  // =============================================
  static async updateStatus(id, newStatus) {
    try {
      const sql = `
        UPDATE orders
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await query(sql, [newStatus, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Order updateStatus error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE PAYMENT STATUS - Payment status update করা
  // =============================================
  static async updatePaymentStatus(id, paymentStatus, paymentMethod = null) {
    try {
      const sql = `
        UPDATE orders
        SET 
          payment_status = $1,
          payment_method = COALESCE($2, payment_method),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;

      const result = await query(sql, [paymentStatus, paymentMethod, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Order updatePaymentStatus error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET WITH ITEMS - Order items সহ
  // =============================================
  static async getWithItems(orderId) {
    try {
      const sql = `
        SELECT 
          o.*,
          u.full_name as customer_name,
          u.phone as customer_phone,
          u.email as customer_email,
          s.stall_name,
          s.location as stall_location,
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal,
              'customization', oi.customization
            )
          ) as items
        FROM orders o
        JOIN users u ON o.customer_id = u.id
        JOIN stalls s ON o.stall_id = s.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.id = $1
        GROUP BY o.id, u.full_name, u.phone, u.email, s.stall_name, s.location
      `;

      const result = await query(sql, [orderId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Order getWithItems error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET CUSTOMER ORDERS - Customer এর orders
  // =============================================
  static async getCustomerOrders(customerId, limit = 20) {
    try {
      const sql = `
        SELECT 
          o.*,
          s.stall_name,
          COUNT(oi.id) as item_count
        FROM orders o
        JOIN stalls s ON o.stall_id = s.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = $1
        GROUP BY o.id, s.stall_name
        ORDER BY o.created_at DESC
        LIMIT $2
      `;

      const result = await query(sql, [customerId, limit]);
      return result.rows;
    } catch (error) {
      console.error('❌ Order getCustomerOrders error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET STALL ORDERS - Stall এর orders
  // =============================================
  static async getStallOrders(stallId, filters = {}) {
    try {
      let sql = `
        SELECT 
          o.*,
          u.full_name as customer_name,
          u.phone as customer_phone
        FROM orders o
        JOIN users u ON o.customer_id = u.id
        WHERE o.stall_id = $1
      `;

      const values = [stallId];
      let paramCount = 2;

      // Today's orders only
      if (filters.today) {
        sql += ` AND DATE(o.created_at) = CURRENT_DATE`;
      }

      // Status filter
      if (filters.status) {
        sql += ` AND o.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      sql += ` ORDER BY o.created_at DESC`;

      if (filters.limit) {
        sql += ` LIMIT $${paramCount}`;
        values.push(filters.limit);
      }

      const result = await query(sql, values);
      return result.rows;
    } catch (error) {
      console.error('❌ Order getStallOrders error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GENERATE ORDER NUMBER - Order number তৈরি করা
  // =============================================
  static async generateOrderNumber() {
    try {
      const prefix = 'ORD';
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      
      const sql = `
        SELECT COUNT(*) as count
        FROM orders
        WHERE DATE(created_at) = CURRENT_DATE
      `;

      const result = await query(sql);
      const count = parseInt(result.rows[0].count) + 1;
      const orderNumber = `${prefix}${date}${count.toString().padStart(4, '0')}`;

      return orderNumber;
    } catch (error) {
      console.error('❌ Order generateOrderNumber error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET TODAY'S STATS - আজকের statistics
  // =============================================
  static async getTodayStats(stallId = null) {
    try {
      let sql = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount END), 0) as avg_order_value
        FROM orders
        WHERE DATE(created_at) = CURRENT_DATE
      `;

      const values = [];

      if (stallId) {
        sql += ' AND stall_id = $1';
        values.push(stallId);
      }

      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Order getTodayStats error:', error.message);
      throw error;
    }
  }

  // =============================================
  // DELETE - Order মুছে ফেলা
  // =============================================
  static async delete(id) {
    try {
      const sql = 'DELETE FROM orders WHERE id = $1 RETURNING id';
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Order delete error:', error.message);
      throw error;
    }
  }
}

module.exports = Order;