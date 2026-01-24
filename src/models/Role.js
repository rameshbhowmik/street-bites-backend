// backend/src/models/Role.js - FIXED VERSION

const mongoose = require('mongoose');

// ========================
// ROLE SCHEMA - Street Bites
// ========================

const roleSchema = new mongoose.Schema(
  {
    // ===== Role নাম =====
    name: {
      type: String,
      required: [true, 'Role নাম প্রয়োজন'],
      unique: true,
      trim: true,
      // 🔥 LOWERCASE stored in database for consistency
      lowercase: true,
      enum: {
        values: ['owner', 'investor', 'manager', 'employee', 'delivery_person', 'customer'],
        message: '{VALUE} সঠিক role নয়',
      },
    },

    // ===== Role Display Name (বাংলায়) =====
    displayName: {
      type: String,
      required: true,
    },

    // ===== Role বর্ণনা =====
    description: {
      type: String,
      required: true,
    },

    // ===== Permission Level (0-100) =====
    // 100 = সর্বোচ্চ (Owner), 0 = সবচেয়ে কম (Customer)
    level: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // ===== Permissions Object =====
    permissions: {
      // ===== User Management =====
      users: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        viewAll: { type: Boolean, default: false },
      },

      // ===== Role Management =====
      roles: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      // ===== Product Management =====
      products: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        manageStock: { type: Boolean, default: false },
        setPrice: { type: Boolean, default: false },
      },

      // ===== Category Management =====
      categories: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      // ===== Order Management =====
      orders: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        viewAll: { type: Boolean, default: false },
        assignDelivery: { type: Boolean, default: false },
        cancelOrder: { type: Boolean, default: false },
      },

      // ===== Stall Management =====
      stalls: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        viewAll: { type: Boolean, default: false },
        assignEmployees: { type: Boolean, default: false },
      },

      // ===== Inventory Management =====
      inventory: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        viewReports: { type: Boolean, default: false },
      },

      // ===== Financial Reports =====
      finance: {
        viewRevenue: { type: Boolean, default: false },
        viewExpenses: { type: Boolean, default: false },
        viewProfit: { type: Boolean, default: false },
        manageBudget: { type: Boolean, default: false },
        viewInvestorReports: { type: Boolean, default: false },
      },

      // ===== Analytics & Reports =====
      analytics: {
        viewSalesReports: { type: Boolean, default: false },
        viewCustomerReports: { type: Boolean, default: false },
        viewEmployeeReports: { type: Boolean, default: false },
        viewInventoryReports: { type: Boolean, default: false },
        exportData: { type: Boolean, default: false },
      },

      // ===== Notifications =====
      notifications: {
        send: { type: Boolean, default: false },
        sendBulk: { type: Boolean, default: false },
      },

      // ===== Settings =====
      settings: {
        updateSystemSettings: { type: Boolean, default: false },
        managePaymentMethods: { type: Boolean, default: false },
        manageDeliverySettings: { type: Boolean, default: false },
      },
    },

    // ===== Role Status =====
    isActive: {
      type: Boolean,
      default: true,
    },

    // ===== Custom Permissions (Optional) =====
    customPermissions: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========================
// INDEXES
// ========================
roleSchema.index({ name: 1 });
roleSchema.index({ level: -1 });

// ========================
// INSTANCE METHODS
// ========================

// Check specific permission
roleSchema.methods.hasPermission = function (module, action) {
  if (!this.permissions[module]) return false;
  return this.permissions[module][action] === true;
};

// Check if role has higher level than another
roleSchema.methods.isHigherThan = function (otherRole) {
  return this.level > otherRole.level;
};

// Get all granted permissions
roleSchema.methods.getGrantedPermissions = function () {
  const granted = [];
  Object.keys(this.permissions).forEach((module) => {
    Object.keys(this.permissions[module]).forEach((action) => {
      if (this.permissions[module][action] === true) {
        granted.push(`${module}.${action}`);
      }
    });
  });
  return granted;
};

// ========================
// STATIC METHODS
// ========================

// 🔥 IMPROVED: Find by role name (completely case-insensitive)
roleSchema.statics.findByName = function (name) {
  if (!name) return null;
  
  // Normalize: lowercase and trim
  const normalizedName = name.toLowerCase().trim();
  
  // Database-এ lowercase stored আছে, তাই direct match করবে
  return this.findOne({ name: normalizedName });
};

// Get all active roles
roleSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ level: -1 });
};

// Get roles by minimum level
roleSchema.statics.findByMinLevel = function (minLevel) {
  return this.find({ level: { $gte: minLevel }, isActive: true }).sort({ level: -1 });
};

// ========================
// PRE-SAVE MIDDLEWARE
// ========================

// 🔥 Ensure name is always lowercase before saving
roleSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase().trim();
  }
  next();
});

// ========================
// MODEL EXPORT
// ========================

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;