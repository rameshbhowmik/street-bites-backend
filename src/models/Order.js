// backend/src/models/Order.js
const mongoose = require('mongoose');

/**
 * Order Schema - অর্ডার স্কিমা
 * বিক্রয় অর্ডার ম্যানেজমেন্টের জন্য সম্পূর্ণ স্কিমা
 */
const orderSchema = new mongoose.Schema({
  // ============================================
  // অর্ডার মৌলিক তথ্য (Order Basic Information)
  // ============================================
  
  orderNumber: {
    type: String,
    unique: true,
    required: [true, 'অর্ডার নম্বর প্রয়োজন'],
    // Format: ORD-YYYYMMDD-XXXX (e.g., ORD-20260112-0001)
  },

  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway', 'delivery'],
    required: [true, 'অর্ডার টাইপ নির্বাচন করুন'],
    default: 'takeaway'
  },

  // ============================================
  // কাস্টমার ইনফরমেশন (Customer Information)
  // ============================================
  
  customer: {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // Guest customer হলে null
    },
    customerName: {
      type: String,
      required: [true, 'কাস্টমার নাম প্রয়োজন'],
      trim: true
    },
    customerMobile: {
      type: String,
      required: [true, 'মোবাইল নম্বর প্রয়োজন'],
      validate: {
        validator: function(v) {
          // Indian mobile: 10 digits, starts with 6-9
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'সঠিক ইন্ডিয়ান মোবাইল নম্বর দিন (10 digits, 6-9 দিয়ে শুরু)'
      }
    },
    customerType: {
      type: String,
      enum: ['registered', 'guest'],
      default: 'guest'
    }
  },

  // ============================================
  // অর্ডার আইটেম (Order Items)
  // ============================================
  
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'কমপক্ষে ১টি প্রোডাক্ট অর্ডার করুন']
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    
    // কাস্টমাইজেশন (Customization)
    customization: {
      spiceLevel: {
        type: String,
        enum: ['none', 'low', 'medium', 'high', 'extra-hot'],
        default: 'medium'
      },
      extras: [{
        name: String,
        price: Number
      }],
      lessIngredients: [String],
      specialInstructions: String
    },
    
    itemSubtotal: {
      type: Number,
      required: true,
      min: 0
    }
  }],

  // ============================================
  // মূল্য বিবরণ (Pricing Details)
  // ============================================
  
  pricing: {
    itemsTotal: {
      type: Number,
      required: true,
      min: 0
    },
    
    tax: {
      taxType: {
        type: String,
        default: 'GST'
      },
      taxPercentage: {
        type: Number,
        default: 5,
        min: 0
      },
      taxAmount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    discount: {
      couponCode: String,
      discountType: {
        type: String,
        enum: ['percentage', 'fixed', 'none'],
        default: 'none'
      },
      discountValue: {
        type: Number,
        default: 0,
        min: 0
      },
      discountAmount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    
    finalAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },

  // ============================================
  // পেমেন্ট ইনফরমেশন (Payment Information)
  // ============================================
  
  payment: {
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'wallet', 'bank-transfer'],
      required: [true, 'পেমেন্ট মেথড নির্বাচন করুন']
    },
    
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    
    transactionId: {
      type: String,
      default: null
    },
    
    utrNumber: {
      type: String, // UTR for bank transfers
      default: null
    },
    
    paidAt: {
      type: Date,
      default: null
    },
    
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // ============================================
  // অর্ডার স্ট্যাটাস (Order Status)
  // ============================================
  
  orderStatus: {
    current: {
      type: String,
      enum: ['pending', 'accepted', 'processing', 'ready', 'out-for-delivery', 'delivered', 'completed', 'cancelled'],
      default: 'pending'
    },
    
    timeline: [{
      status: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      updatedBy: {
        userId: mongoose.Schema.Types.ObjectId,
        userName: String,
        userRole: String
      },
      notes: String
    }],
    
    acceptedAt: Date,
    preparationStartedAt: Date,
    readyAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,
    completedAt: Date
  },

  // ============================================
  // ডেলিভারি ইনফরমেশন (Delivery Information)
  // ============================================
  
  delivery: {
    deliveryType: {
      type: String,
      enum: ['self-pickup', 'home-delivery'],
      default: 'self-pickup'
    },
    
    deliveryAddress: {
      fullAddress: String,
      area: String,
      landmark: String,
      city: String,
      pinCode: {
        type: String,
        validate: {
          validator: function(v) {
            if (!v) return true; // Optional field
            return /^\d{6}$/.test(v);
          },
          message: 'পিনকোড ৬ সংখ্যার হতে হবে'
        }
      },
      geoLocation: {
        latitude: Number,
        longitude: Number
      }
    },
    
    assignedDeliveryPerson: {
      personId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      personName: String,
      personMobile: String,
      assignedAt: Date
    },
    
    deliveryStatus: {
      type: String,
      enum: ['not-assigned', 'assigned', 'picked-up', 'in-transit', 'reached', 'delivered'],
      default: 'not-assigned'
    },
    
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    
    deliveryNotes: String
  },

  // ============================================
  // স্টল ইনফরমেশন (Stall Information)
  // ============================================
  
  stall: {
    stallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stall',
      required: true
    },
    stallName: {
      type: String,
      required: true
    },
    stallLocation: {
      type: String,
      required: true
    }
  },

  // ============================================
  // ক্যান্সেলেশন ইনফরমেশন (Cancellation)
  // ============================================
  
  cancellation: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancelledAt: Date,
    cancelledBy: {
      type: String,
      enum: ['customer', 'admin', 'system'],
      default: null
    },
    cancellationReason: {
      type: String,
      enum: [
        'customer-request',
        'item-unavailable',
        'payment-failed',
        'delivery-issue',
        'wrong-order',
        'other'
      ]
    },
    cancellationRemarks: String,
    
    refund: {
      refundStatus: {
        type: String,
        enum: ['not-applicable', 'pending', 'processed', 'completed', 'failed'],
        default: 'not-applicable'
      },
      refundAmount: {
        type: Number,
        default: 0,
        min: 0
      },
      refundMethod: String,
      refundTransactionId: String,
      refundedAt: Date
    }
  },

  // ============================================
  // রিভিউ ও রেটিং (Review & Rating)
  // ============================================
  
  review: {
    isReviewed: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    reviewComment: String,
    reviewedAt: Date,
    
    // Individual ratings
    foodQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    deliverySpeed: {
      type: Number,
      min: 1,
      max: 5
    },
    packaging: {
      type: Number,
      min: 1,
      max: 5
    }
  },

  // ============================================
  // সাপোর্ট ও কমপ্লেইন (Support & Complaint)
  // ============================================
  
  support: {
    hasComplaint: {
      type: Boolean,
      default: false
    },
    ticketId: String,
    complaintCategory: {
      type: String,
      enum: ['food-quality', 'late-delivery', 'wrong-order', 'missing-items', 'behavior', 'other']
    },
    complaintDescription: String,
    complaintStatus: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved', 'closed'],
      default: 'pending'
    },
    complaintResolution: String,
    resolvedAt: Date
  },

  // ============================================
  // মেটা ইনফরমেশন (Meta Information)
  // ============================================
  
  metadata: {
    orderSource: {
      type: String,
      enum: ['pos', 'mobile-app', 'web-app', 'admin-panel', 'phone-call'],
      required: true,
      default: 'pos'
    },
    
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userName: String,
      userRole: String
    },
    
    deviceInfo: {
      deviceType: String,
      ipAddress: String,
      userAgent: String
    },
    
    isTestOrder: {
      type: Boolean,
      default: false
    }
  }

}, {
  timestamps: true, // createdAt, updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================
// Indexes - দ্রুত সার্চের জন্য
// ============================================

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'customer.customerMobile': 1 });
orderSchema.index({ 'customer.customerId': 1 });
orderSchema.index({ 'stall.stallId': 1 });
orderSchema.index({ 'orderStatus.current': 1 });
orderSchema.index({ 'payment.paymentStatus': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'delivery.deliveryStatus': 1 });

// ============================================
// Virtual Fields - ক্যালকুলেটেড ফিল্ড
// ============================================

// মোট আইটেম সংখ্যা
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// অর্ডার ডিউরেশন (created to delivered)
orderSchema.virtual('orderDuration').get(function() {
  if (this.orderStatus.deliveredAt) {
    const duration = this.orderStatus.deliveredAt - this.createdAt;
    const minutes = Math.floor(duration / (1000 * 60));
    return `${minutes} মিনিট`;
  }
  return null;
});

// অর্ডার স্ট্যাটাস বাংলায়
orderSchema.virtual('statusInBangla').get(function() {
  const statusMap = {
    'pending': 'অপেক্ষমাণ',
    'accepted': 'গৃহীত',
    'processing': 'প্রসেসিং',
    'ready': 'প্রস্তুত',
    'out-for-delivery': 'ডেলিভারির পথে',
    'delivered': 'ডেলিভার হয়েছে',
    'completed': 'সম্পন্ন',
    'cancelled': 'বাতিল'
  };
  return statusMap[this.orderStatus.current] || this.orderStatus.current;
});

// পেমেন্ট স্ট্যাটাস বাংলায়
orderSchema.virtual('paymentStatusInBangla').get(function() {
  const statusMap = {
    'pending': 'অপেক্ষমাণ',
    'paid': 'পরিশোধিত',
    'failed': 'ব্যর্থ',
    'refunded': 'ফেরত দেওয়া হয়েছে'
  };
  return statusMap[this.payment.paymentStatus] || this.payment.paymentStatus;
});

// ============================================
// Pre-save Middleware - সেভ করার আগে
// ============================================

orderSchema.pre('save', async function(next) {
  // Generate order number if not exists
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Order').countDocuments({
      createdAt: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    });
    this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate items total
  this.pricing.itemsTotal = this.items.reduce((sum, item) => sum + item.itemSubtotal, 0);
  
  // Calculate tax
  this.pricing.tax.taxAmount = (this.pricing.itemsTotal * this.pricing.tax.taxPercentage) / 100;
  
  // Calculate discount
  if (this.pricing.discount.discountType === 'percentage') {
    this.pricing.discount.discountAmount = (this.pricing.itemsTotal * this.pricing.discount.discountValue) / 100;
  } else if (this.pricing.discount.discountType === 'fixed') {
    this.pricing.discount.discountAmount = this.pricing.discount.discountValue;
  }
  
  // Calculate final amount
  this.pricing.finalAmount = 
    this.pricing.itemsTotal + 
    this.pricing.tax.taxAmount - 
    this.pricing.discount.discountAmount + 
    this.pricing.deliveryCharge;
  
  next();
});

// ============================================
// Static Methods - কমন queries
// ============================================

// আজকের সব অর্ডার
orderSchema.statics.findTodayOrders = function(stallId = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const query = {
    createdAt: { $gte: today }
  };
  
  if (stallId) {
    query['stall.stallId'] = stallId;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Pending orders
orderSchema.statics.findPendingOrders = function(stallId) {
  return this.find({
    'stall.stallId': stallId,
    'orderStatus.current': { $in: ['pending', 'accepted', 'processing'] }
  }).sort({ createdAt: 1 });
};

// কাস্টমার এর সব অর্ডার
orderSchema.statics.findByCustomer = function(customerId) {
  return this.find({
    'customer.customerId': customerId
  }).sort({ createdAt: -1 });
};

// ডেলিভারি পার্সন এর অর্ডার
orderSchema.statics.findByDeliveryPerson = function(personId) {
  return this.find({
    'delivery.assignedDeliveryPerson.personId': personId,
    'delivery.deliveryStatus': { $in: ['assigned', 'picked-up', 'in-transit'] }
  }).sort({ createdAt: 1 });
};

// ============================================
// Instance Methods - ডাটা ম্যানিপুলেশন
// ============================================

// অর্ডার স্ট্যাটাস আপডেট করুন
orderSchema.methods.updateOrderStatus = async function(newStatus, userId, userName, userRole, notes = '') {
  this.orderStatus.current = newStatus;
  
  // Timeline এ যোগ করুন
  this.orderStatus.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: { userId, userName, userRole },
    notes
  });
  
  // Specific timestamps আপডেট
  const now = new Date();
  switch(newStatus) {
    case 'accepted':
      this.orderStatus.acceptedAt = now;
      break;
    case 'processing':
      this.orderStatus.preparationStartedAt = now;
      break;
    case 'ready':
      this.orderStatus.readyAt = now;
      break;
    case 'out-for-delivery':
      this.orderStatus.outForDeliveryAt = now;
      this.delivery.deliveryStatus = 'in-transit';
      break;
    case 'delivered':
      this.orderStatus.deliveredAt = now;
      this.delivery.actualDeliveryTime = now;
      this.delivery.deliveryStatus = 'delivered';
      break;
    case 'completed':
      this.orderStatus.completedAt = now;
      break;
  }
  
  return await this.save();
};

// পেমেন্ট কনফার্ম করুন
orderSchema.methods.confirmPayment = async function(transactionId = null, utrNumber = null) {
  this.payment.paymentStatus = 'paid';
  this.payment.paidAt = new Date();
  this.payment.paidAmount = this.pricing.finalAmount;
  
  if (transactionId) {
    this.payment.transactionId = transactionId;
  }
  
  if (utrNumber) {
    this.payment.utrNumber = utrNumber;
  }
  
  return await this.save();
};

// ডেলিভারি পার্সন অ্যাসাইন করুন
orderSchema.methods.assignDeliveryPerson = async function(personId, personName, personMobile) {
  this.delivery.assignedDeliveryPerson = {
    personId,
    personName,
    personMobile,
    assignedAt: new Date()
  };
  this.delivery.deliveryStatus = 'assigned';
  
  return await this.save();
};

// অর্ডার ক্যান্সেল করুন
orderSchema.methods.cancelOrder = async function(cancelledBy, reason, remarks = '') {
  this.cancellation.isCancelled = true;
  this.cancellation.cancelledAt = new Date();
  this.cancellation.cancelledBy = cancelledBy;
  this.cancellation.cancellationReason = reason;
  this.cancellation.cancellationRemarks = remarks;
  this.orderStatus.current = 'cancelled';
  
  // যদি পেমেন্ট হয়ে থাকে, refund initiate করুন
  if (this.payment.paymentStatus === 'paid') {
    this.cancellation.refund.refundStatus = 'pending';
    this.cancellation.refund.refundAmount = this.pricing.finalAmount;
  }
  
  return await this.save();
};

// রিভিউ যোগ করুন
orderSchema.methods.addReview = async function(rating, comment, foodQuality, deliverySpeed, packaging) {
  this.review.isReviewed = true;
  this.review.rating = rating;
  this.review.reviewComment = comment;
  this.review.reviewedAt = new Date();
  this.review.foodQuality = foodQuality;
  this.review.deliverySpeed = deliverySpeed;
  this.review.packaging = packaging;
  
  return await this.save();
};

// কমপ্লেইন রেজিস্টার করুন
orderSchema.methods.registerComplaint = async function(category, description) {
  this.support.hasComplaint = true;
  this.support.ticketId = `TICKET-${Date.now()}`;
  this.support.complaintCategory = category;
  this.support.complaintDescription = description;
  this.support.complaintStatus = 'pending';
  
  return await this.save();
};

module.exports = mongoose.model('Order', orderSchema);