// Order Controller
// Order সংক্রান্ত সব operations

const { Order, Product } = require('../models');
const { query } = require('../config/database');

// =============================================
// CREATE ORDER - নতুন order তৈরি
// =============================================
const createOrder = async (req, res) => {
  try {
    const {
      stall_id,
      order_type,
      items, // [{ product_id, quantity, unit_price, customization }]
      payment_method,
      delivery_address
    } = req.body;

    const customer_id = req.user.id;

    // Input validation
    if (!stall_id || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Stall এবং order items প্রদান করুন'
      });
    }

    // Delivery address check (delivery order এর জন্য)
    if (order_type === 'delivery' && !delivery_address) {
      return res.status(400).json({
        success: false,
        message: 'Delivery order এর জন্য address প্রদান করুন'
      });
    }

    // Order number generate করা
    const orderNumber = await Order.generateOrderNumber();

    // Total amount calculate করা
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.unit_price;
    }

    // Order তৈরি করা
    const newOrder = await Order.create({
      order_number: orderNumber,
      customer_id,
      stall_id,
      order_type: order_type || 'pickup',
      total_amount: totalAmount,
      payment_method: payment_method || null,
      delivery_address: delivery_address || null,
      payment_status: 'pending',
      status: 'pending'
    });

    // Order items insert করা
    for (const item of items) {
      await query(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, customization, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        newOrder.id,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.customization ? JSON.stringify(item.customization) : null,
        item.quantity * item.unit_price
      ]);
    }

    // Complete order details fetch করা
    const completeOrder = await Order.getWithItems(newOrder.id);

    return res.status(201).json({
      success: true,
      message: 'Order সফলভাবে তৈরি হয়েছে',
      data: completeOrder
    });

  } catch (error) {
    console.error('❌ Create order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Order তৈরি করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET ORDER BY ID - Order details
// =============================================
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.getWithItems(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order পাওয়া যায়নি'
      });
    }

    // Authorization check - শুধুমাত্র নিজের order বা admin/owner দেখতে পারবে
    if (
      req.user.role !== 'owner' && 
      req.user.role !== 'employee' &&
      order.customer_id !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'আপনার এই order দেখার অনুমতি নেই'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order details fetch সফল',
      data: order
    });

  } catch (error) {
    console.error('❌ Get order by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Order details fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET CUSTOMER ORDERS - Customer এর সব orders
// =============================================
const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 20 } = req.query;

    // Authorization check
    if (req.user.role !== 'owner' && parseInt(customerId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'আপনার এই orders দেখার অনুমতি নেই'
      });
    }

    const orders = await Order.getCustomerOrders(customerId, parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Customer orders fetch সফল',
      data: {
        customer_id: customerId,
        count: orders.length,
        orders
      }
    });

  } catch (error) {
    console.error('❌ Get customer orders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Orders fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET MY ORDERS - নিজের orders
// =============================================
const getMyOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { limit = 20 } = req.query;

    const orders = await Order.getCustomerOrders(customerId, parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'আপনার orders fetch সফল',
      data: {
        count: orders.length,
        orders
      }
    });

  } catch (error) {
    console.error('❌ Get my orders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Orders fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET STALL ORDERS - Stall এর orders
// =============================================
const getStallOrders = async (req, res) => {
  try {
    const { stallId } = req.params;
    const { today, status, limit = 50 } = req.query;

    const filters = {
      today: today === 'true',
      status,
      limit: parseInt(limit)
    };

    const orders = await Order.getStallOrders(stallId, filters);

    return res.status(200).json({
      success: true,
      message: 'Stall orders fetch সফল',
      data: {
        stall_id: stallId,
        count: orders.length,
        orders
      }
    });

  } catch (error) {
    console.error('❌ Get stall orders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Orders fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// UPDATE ORDER STATUS - Order status update
// =============================================
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Status validation
    const validStatuses = [
      'pending', 'confirmed', 'preparing', 'ready', 
      'out_for_delivery', 'delivered', 'completed', 'cancelled', 'rejected'
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status ${validStatuses.join(', ')} এর মধ্যে হতে হবে`
      });
    }

    // Order update করা
    const updatedOrder = await Order.updateStatus(id, status);

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order পাওয়া যায়নি'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order status সফলভাবে update হয়েছে',
      data: updatedOrder
    });

  } catch (error) {
    console.error('❌ Update order status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Order status update করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// UPDATE PAYMENT STATUS - Payment status update
// =============================================
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, payment_method } = req.body;

    // Status validation
    const validStatuses = ['pending', 'paid', 'failed', 'refunded', 'partial'];

    if (!payment_status || !validStatuses.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: `Payment status ${validStatuses.join(', ')} এর মধ্যে হতে হবে`
      });
    }

    // Update করা
    const updatedOrder = await Order.updatePaymentStatus(
      id, 
      payment_status, 
      payment_method
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order পাওয়া যায়নি'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment status সফলভাবে update হয়েছে',
      data: updatedOrder
    });

  } catch (error) {
    console.error('❌ Update payment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment status update করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// CANCEL ORDER - Order cancel করা
// =============================================
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Order fetch করা
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order পাওয়া যায়নি'
      });
    }

    // Authorization check
    if (req.user.role !== 'owner' && order.customer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'আপনার এই order cancel করার অনুমতি নেই'
      });
    }

    // শুধুমাত্র pending বা confirmed orders cancel করা যাবে
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'এই order আর cancel করা যাবে না'
      });
    }

    // Order cancel করা
    const cancelledOrder = await Order.updateStatus(id, 'cancelled');

    return res.status(200).json({
      success: true,
      message: 'Order সফলভাবে cancel হয়েছে',
      data: cancelledOrder
    });

  } catch (error) {
    console.error('❌ Cancel order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Order cancel করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET TODAY'S STATS - আজকের statistics
// =============================================
const getTodayStats = async (req, res) => {
  try {
    const { stallId } = req.query;

    const stats = await Order.getTodayStats(stallId ? parseInt(stallId) : null);

    return res.status(200).json({
      success: true,
      message: "Today's statistics fetch সফল",
      data: stats
    });

  } catch (error) {
    console.error("❌ Get today's stats error:", error);
    return res.status(500).json({
      success: false,
      message: 'Statistics fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET ALL ORDERS - সব orders (Admin only)
// =============================================
const getAllOrders = async (req, res) => {
  try {
    const {
      stall_id,
      status,
      payment_status,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      stall_id: stall_id ? parseInt(stall_id) : undefined,
      status,
      payment_status,
      start_date,
      end_date,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const orders = await Order.findAll(filters);

    return res.status(200).json({
      success: true,
      message: 'Orders list fetch সফল',
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          limit: parseInt(limit),
          hasMore: orders.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get all orders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Orders fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getCustomerOrders,
  getMyOrders,
  getStallOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getTodayStats,
  getAllOrders
};