// Product Model
// খাবার পণ্যের তথ্য পরিচালনা

const { query } = require('../config/database');

class Product {
  // =============================================
  // CREATE - নতুন product তৈরি করা
  // =============================================
  static async create(productData) {
    try {
      const {
        product_name,
        product_name_bengali,
        category,
        base_price,
        description,
        image_url,
        is_available
      } = productData;

      const sql = `
        INSERT INTO products (
          product_name, product_name_bengali, category, base_price,
          description, image_url, is_available
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        product_name,
        product_name_bengali || null,
        category,
        base_price,
        description || null,
        image_url || null,
        is_available !== undefined ? is_available : true
      ];

      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Product create error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND BY ID - ID দিয়ে product খোঁজা
  // =============================================
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM products WHERE id = $1';
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Product findById error:', error.message);
      throw error;
    }
  }

  // =============================================
  // FIND ALL - সব products fetch করা
  // =============================================
  static async findAll(filters = {}) {
    try {
      let sql = 'SELECT * FROM products WHERE 1=1';
      const values = [];
      let paramCount = 1;

      // Category filter
      if (filters.category) {
        sql += ` AND category = $${paramCount}`;
        values.push(filters.category);
        paramCount++;
      }

      // Availability filter
      if (filters.is_available !== undefined) {
        sql += ` AND is_available = $${paramCount}`;
        values.push(filters.is_available);
        paramCount++;
      }

      // Search by name
      if (filters.search) {
        sql += ` AND (product_name ILIKE $${paramCount} OR product_name_bengali ILIKE $${paramCount})`;
        values.push(`%${filters.search}%`);
        paramCount++;
      }

      // Price range filter
      if (filters.min_price) {
        sql += ` AND base_price >= $${paramCount}`;
        values.push(filters.min_price);
        paramCount++;
      }

      if (filters.max_price) {
        sql += ` AND base_price <= $${paramCount}`;
        values.push(filters.max_price);
        paramCount++;
      }

      sql += ` ORDER BY created_at DESC`;

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
      console.error('❌ Product findAll error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE - Product তথ্য update করা
  // =============================================
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'product_name', 'product_name_bengali', 'category', 'base_price',
        'description', 'image_url', 'is_available'
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
        UPDATE products
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Product update error:', error.message);
      throw error;
    }
  }

  // =============================================
  // DELETE - Product মুছে ফেলা
  // =============================================
  static async delete(id) {
    try {
      const sql = 'DELETE FROM products WHERE id = $1 RETURNING id';
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Product delete error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET BY CATEGORY - Category অনুযায়ী products
  // =============================================
  static async getByCategory(category) {
    try {
      const sql = `
        SELECT * FROM products
        WHERE category = $1 AND is_available = true
        ORDER BY product_name
      `;

      const result = await query(sql, [category]);
      return result.rows;
    } catch (error) {
      console.error('❌ Product getByCategory error:', error.message);
      throw error;
    }
  }

  // =============================================
  // SEARCH - Product search করা
  // =============================================
  static async search(searchTerm) {
    try {
      const sql = `
        SELECT * FROM products
        WHERE 
          product_name ILIKE $1 
          OR product_name_bengali ILIKE $1
          OR description ILIKE $1
        ORDER BY 
          CASE 
            WHEN product_name ILIKE $1 THEN 1
            WHEN product_name_bengali ILIKE $1 THEN 2
            ELSE 3
          END,
          product_name
      `;

      const result = await query(sql, [`%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      console.error('❌ Product search error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE AVAILABILITY - Availability toggle করা
  // =============================================
  static async updateAvailability(id, isAvailable) {
    try {
      const sql = `
        UPDATE products
        SET is_available = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await query(sql, [isAvailable, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Product updateAvailability error:', error.message);
      throw error;
    }
  }

  // =============================================
  // UPDATE PRICE - Price update করা
  // =============================================
  static async updatePrice(id, newPrice) {
    try {
      const sql = `
        UPDATE products
        SET base_price = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await query(sql, [newPrice, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Product updatePrice error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET AVAILABLE PRODUCTS - শুধুমাত্র available products
  // =============================================
  static async getAvailableProducts(limit = 50) {
    try {
      const sql = `
        SELECT * FROM products
        WHERE is_available = true
        ORDER BY category, product_name
        LIMIT $1
      `;

      const result = await query(sql, [limit]);
      return result.rows;
    } catch (error) {
      console.error('❌ Product getAvailableProducts error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET POPULAR PRODUCTS - জনপ্রিয় products
  // =============================================
  static async getPopularProducts(limit = 10) {
    try {
      const sql = `
        SELECT 
          p.*,
          COUNT(oi.id) as order_count,
          SUM(oi.quantity) as total_sold
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        WHERE p.is_available = true
        GROUP BY p.id
        ORDER BY order_count DESC, total_sold DESC
        LIMIT $1
      `;

      const result = await query(sql, [limit]);
      return result.rows;
    } catch (error) {
      console.error('❌ Product getPopularProducts error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET WITH INVENTORY - Inventory সহ product info
  // =============================================
  static async getWithInventory(productId, stallId = null) {
    try {
      let sql = `
        SELECT 
          p.*,
          COALESCE(SUM(ist.quantity), 0) as total_stock
        FROM products p
        LEFT JOIN inventory_stall ist ON p.id = ist.product_id
        WHERE p.id = $1
      `;

      const values = [productId];

      if (stallId) {
        sql += ' AND ist.stall_id = $2';
        values.push(stallId);
      }

      sql += ' GROUP BY p.id';

      const result = await query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Product getWithInventory error:', error.message);
      throw error;
    }
  }

  // =============================================
  // COUNT BY CATEGORY - Category wise count
  // =============================================
  static async countByCategory() {
    try {
      const sql = `
        SELECT 
          category,
          COUNT(*) as count,
          SUM(CASE WHEN is_available = true THEN 1 ELSE 0 END) as available_count
        FROM products
        GROUP BY category
        ORDER BY category
      `;

      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('❌ Product countByCategory error:', error.message);
      throw error;
    }
  }

  // =============================================
  // GET STATISTICS - Product statistics
  // =============================================
  static async getStatistics() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN is_available = true THEN 1 ELSE 0 END) as available_products,
          AVG(base_price) as avg_price,
          MIN(base_price) as min_price,
          MAX(base_price) as max_price
        FROM products
      `;

      const result = await query(sql);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Product getStatistics error:', error.message);
      throw error;
    }
  }
}

module.exports = Product;