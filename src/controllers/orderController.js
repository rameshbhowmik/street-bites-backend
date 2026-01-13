// backend/src/controllers/orderController.js
const Order = require('../models/Order');
const Sales = require('../models/Sales');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

/**
 * Order Controller - অর্ডার কন্ট্রোলার
 * অর্ডার ম্যানেজমেন্টের সব API endpoints
 */

// ============================================
// নতুন অর্ডার তৈরি করুন
// POST /api/orders/create
// ============================================
exports.createOrder = async (req, res) => {
  try {
    const {
      orderType,
      customer,
      items,
      pricing,
      payment,
      delivery,
      stall,
      metadata
    } = req.body;

    // Validate items stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `প্রোডাক্ট পাওয়া যায়নি: ${item.productName}`
        });
      }

      if (product.availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.productName} এর পর্যাপ্ত স্টক নেই। উপলব্ধ: ${product.availableStock}`
        });
      }
    }

    // Create order
    const order = await Order.create({
      orderType,
      customer,
      items,
      pricing,
      payment,
      delivery,
      stall,
      metadata
    });

    // Deduct stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { availableStock: -item.quantity } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'অর্ডার সফলভাবে তৈরি হয়েছে',
      data: {
        order,
        orderNumber: order.orderNumber,
        totalAmount: order.pricing.finalAmount
      }
    });

  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'অর্ডার তৈরি করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// সব অর্ডার দেখুন (Pagination)
// GET /api/orders?page=1&limit=20&status=pending&stallId=xxx
// ============================================
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (req.query.status) {
      query['orderStatus.current'] = req.query.status;
    }
    
    if (req.query.stallId) {
      query['stall.stallId'] = req.query.stallId;
    }
    
    if (req.query.paymentStatus) {
      query['payment.paymentStatus'] = req.query.paymentStatus;
    }

    if (req.query.customerMobile) {
      query['customer.customerMobile'] = req.query.customerMobile;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer.customerId', 'name email')
      .populate('stall.stallId', 'stallName');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({
      success: false,
      message: 'অর্ডার লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// আজকের অর্ডার
// GET /api/orders/today?stallId=xxx
// ============================================
exports.getTodayOrders = async (req, res) => {
  try {
    const { stallId } = req.query;
    const orders = await Order.findTodayOrders(stallId);

    const summary = {
      totalOrders: orders.length,
      pending: orders.filter(o => o.orderStatus.current === 'pending').length,
      processing: orders.filter(o => o.orderStatus.current === 'processing').length,
      completed: orders.filter(o => o.orderStatus.current === 'completed').length,
      cancelled: orders.filter(o => o.orderStatus.current === 'cancelled').length,
      totalSales: orders.reduce((sum, o) => sum + o.pricing.finalAmount, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        orders,
        summary
      }
    });

  } catch (error) {
    console.error('Get Today Orders Error:', error);
    res.status(500).json({
      success: false,
      message: 'আজকের অর্ডার লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// Pending অর্ডার
// GET /api/orders/pending/:stallId
// ============================================
exports.getPendingOrders = async (req, res) => {
  try {
    const { stallId } = req.params;
    const orders = await Order.findPendingOrders(stallId);

    res.status(200).json({
      success: true,
      data: {
        orders,
        count: orders.length
      }
    });

  } catch (error) {
    console.error('Get Pending Orders Error:', error);
    res.status(500).json({
      success: false,
      message: 'Pending অর্ডার লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// একটি অর্ডার দেখুন
// GET /api/orders/:orderId
// ============================================
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('customer.customerId', 'name email phoneNumber')
      .populate('stall.stallId', 'stallName stallLocation')
      .populate('delivery.assignedDeliveryPerson.personId', 'name phoneNumber');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডার পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      data: { order }
    });

  } catch (error) {
    console.error('Get Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'অর্ডার লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// অর্ডার স্ট্যাটাস আপডেট করুন
// PUT /api/orders/:orderId/status
// ============================================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newStatus, notes } = req.body;
    const { userId, name: userName, role: userRole } = req.user;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডার পাওয়া যায়নি'
      });
    }

    await order.updateOrderStatus(newStatus, userId, userName, userRole, notes);

    // যদি delivered হয়, Sales record এ যোগ করুন
    if (newStatus === 'delivered' || newStatus === 'completed') {
      // Create transaction
      await Transaction.create({
        transactionType: 'sale',
        transactionCategory: 'product-sale',
        amount: order.pricing.finalAmount,
        
        relatedEntity: {
          entityType: 'order',
          entityId: order._id,
          entityModel: 'Order',
          entityReference: order.orderNumber
        },
        
        payment: {
          paymentMode: order.payment.paymentMethod,
          paymentStatus: order.payment.paymentStatus,
          paymentReference: order.payment.transactionId
        },
        
        paidBy: {
          partyType: 'customer',
          partyId: order.customer.customerId,
          partyName: order.customer.customerName,
          partyContact: order.customer.customerMobile
        },
        
        receivedBy: {
          partyType: 'stall',
          partyId: order.stall.stallId,
          partyName: order.stall.stallName
        },
        
        location: {
          stallId: order.stall.stallId,
          stallName: order.stall.stallName
        },
        
        transactionDescription: `Sale from order ${order.orderNumber}`,
        transactionDate: new Date(),
        
        recordedBy: {
          userId,
          userName,
          userRole
        }
      });

      // Update or create today's sales record
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let salesRecord = await Sales.findOne({
        salesDate: { $gte: today },
        'stall.stallId': order.stall.stallId
      });

      if (!salesRecord) {
        salesRecord = await Sales.create({
          salesDate: today,
          stall: {
            stallId: order.stall.stallId,
            stallName: order.stall.stallName,
            stallLocation: order.stall.stallLocation
          },
          employee: {
            employeeId: userId,
            employeeName: userName,
            shift: { shiftType: 'full-day' }
          },
          metadata: {
            createdBy: { userId, userName, userRole }
          }
        });
      }

      await salesRecord.addOrder(order);
    }

    res.status(200).json({
      success: true,
      message: `অর্ডার স্ট্যাটাস ${order.statusInBangla} এ পরিবর্তিত হয়েছে`,
      data: { order }
    });

  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'অর্ডার স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// পেমেন্ট কনফার্ম করুন
// PUT /api/orders/:orderId/confirm-payment
// ============================================
exports.confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { transactionId, utrNumber } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডার পাওয়া যায়নি'
      });
    }

    await order.confirmPayment(transactionId, utrNumber);

    res.status(200).json({
      success: true,
      message: 'পেমেন্ট সফলভাবে কনফার্ম হয়েছে',
      data: { order }
    });

  } catch (error) {
    console.error('Confirm Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'পেমেন্ট কনফার্ম করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// ডেলিভারি পার্সন অ্যাসাইন করুন
// PUT /api/orders/:orderId/assign-delivery
// ============================================
exports.assignDeliveryPerson = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { personId, personName, personMobile } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডার পাওয়া যায়নি'
      });
    }

    await order.assignDeliveryPerson(personId, personName, personMobile);

    res.status(200).json({
      success: true,
      message: 'ডেলিভারি পার্সন সফলভাবে অ্যাসাইন হয়েছে',
      data: { order }
    });

  } catch (error) {
    console.error('Assign Delivery Person Error:', error);
    res.status(500).json({
      success: false,
      message: 'ডেলিভারি পার্সন অ্যাসাইন করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// অর্ডার ক্যান্সেল করুন
// PUT /api/orders/:orderId/cancel
// ============================================
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancelledBy, reason, remarks } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডার পাওয়া যায়নি'
      });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { availableStock: item.quantity } }
      );
    }

    await order.cancelOrder(cancelledBy, reason, remarks);

    res.status(200).json({
      success: true,
      message: 'অর্ডার সফলভাবে ক্যান্সেল হয়েছে',
      data: { order }
    });

  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'অর্ডার ক্যান্সেল করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// রিভিউ যোগ করুন
// POST /api/orders/:orderId/review
// ============================================
exports.addReview = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment, foodQuality, deliverySpeed, packaging } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডার পাওয়া যায়নি'
      });
    }

    if (order.orderStatus.current !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'শুধুমাত্র সম্পন্ন অর্ডারে রিভিউ দেওয়া যায়'
      });
    }

    await order.addReview(rating, comment, foodQuality, deliverySpeed, packaging);

    res.status(200).json({
      success: true,
      message: 'রিভিউ সফলভাবে যোগ হয়েছে',
      data: { order }
    });

  } catch (error) {
    console.error('Add Review Error:', error);
    res.status(500).json({
      success: false,
      message: 'রিভিউ যোগ করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// কমপ্লেইন রেজিস্টার করুন
// POST /api/orders/:orderId/complaint
// ============================================
exports.registerComplaint = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { category, description } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডার পাওয়া যায়নি'
      });
    }

    await order.registerComplaint(category, description);

    res.status(200).json({
      success: true,
      message: 'কমপ্লেইন সফলভাবে রেজিস্টার হয়েছে',
      data: {
        order,
        ticketId: order.support.ticketId
      }
    });

  } catch (error) {
    console.error('Register Complaint Error:', error);
    res.status(500).json({
      success: false,
      message: 'কমপ্লেইন রেজিস্টার করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// কাস্টমার এর সব অর্ডার
// GET /api/orders/customer/:customerId
// ============================================
exports.getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;
    const orders = await Order.findByCustomer(customerId);

    res.status(200).json({
      success: true,
      data: {
        orders,
        totalOrders: orders.length
      }
    });

  } catch (error) {
    console.error('Get Customer Orders Error:', error);
    res.status(500).json({
      success: false,
      message: 'কাস্টমার অর্ডার লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// ডেলিভারি পার্সন এর অর্ডার
// GET /api/orders/delivery-person/:personId
// ============================================
exports.getDeliveryPersonOrders = async (req, res) => {
  try {
    const { personId } = req.params;
    const orders = await Order.findByDeliveryPerson(personId);

    res.status(200).json({
      success: true,
      data: {
        orders,
        totalOrders: orders.length
      }
    });

  } catch (error) {
    console.error('Get Delivery Person Orders Error:', error);
    res.status(500).json({
      success: false,
      message: 'ডেলিভারি পার্সন অর্ডার লোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

module.exports = exports;