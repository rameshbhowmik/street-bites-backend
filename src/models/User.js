// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ========================
// USER SCHEMA - Street Bites
// ========================

const userSchema = new mongoose.Schema(
  {
    // ===== মৌলিক তথ্য (Basic Information) =====
    fullName: {
      type: String,
      required: [true, 'নাম প্রয়োজন'],
      trim: true,
      minlength: [2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'],
      maxlength: [100, 'নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারবে'],
    },

    email: {
      type: String,
      required: [true, 'ইমেইল প্রয়োজন'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          // ইমেইল validation regex
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'সঠিক ইমেইল প্রদান করুন',
      },
      index: true, // দ্রুত search এর জন্য
    },

    // ===== মোবাইল নম্বর (Indian Mobile Number) =====
    phone: {
      type: String,
      required: [true, 'মোবাইল নম্বর প্রয়োজন'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Indian mobile number validation
          // Format: +91XXXXXXXXXX বা 91XXXXXXXXXX বা XXXXXXXXXX (10 digits)
          // Valid prefixes: 6, 7, 8, 9
          const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
          return phoneRegex.test(v.replace(/\s+/g, '')); // whitespace remove করে check
        },
        message: 'সঠিক ভারতীয় মোবাইল নম্বর প্রদান করুন (যেমন: +919876543210)',
      },
      index: true,
    },

    phoneVerified: {
      type: Boolean,
      default: false, // OTP verify না হওয়া পর্যন্ত false
    },

    phoneOTP: {
      code: String,
      expiresAt: Date,
      attempts: {
        type: Number,
        default: 0,
      },
    },

    // ===== পাসওয়ার্ড (Password) =====
    password: {
      type: String,
      required: [true, 'পাসওয়ার্ড প্রয়োজন'],
      minlength: [8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'],
      select: false, // query তে default এ আসবে না
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailOTP: {
      code: String,
      expiresAt: Date,
      attempts: {
        type: Number,
        default: 0,
      },
    },

    // ===== Role & Permissions =====
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role', // Role collection এর সাথে relation
      required: [true, 'Role প্রয়োজন'],
      index: true,
    },

    // ===== প্রোফাইল ছবি (Profile Picture) =====
    profilePicture: {
      url: {
        type: String,
        default: 'https://res.cloudinary.com/default/image/upload/default-avatar.png',
      },
      publicId: String, // Cloudinary public ID (delete এর জন্য)
    },

    // ===== ঠিকানা (Address) =====
    address: {
      street: String,
      area: String,
      city: String,
      state: {
        type: String,
        default: 'West Bengal',
      },
      pincode: {
        type: String,
        validate: {
          validator: function (v) {
            // Indian pincode validation (6 digits)
            return !v || /^\d{6}$/.test(v);
          },
          message: 'সঠিক পিনকোড প্রদান করুন (৬ সংখ্যার)',
        },
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // ===== নিরাপত্তা (Security) =====
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
      select: false,
    },

    // Password reset
    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    passwordChangedAt: Date,

    // ===== Login History & Security =====
    lastLogin: {
      type: Date,
    },

    loginHistory: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        ipAddress: String,
        userAgent: String,
        device: String,
        location: String,
      },
    ],

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    accountLockedUntil: Date,

    // ===== Account Status =====
    isActive: {
      type: Boolean,
      default: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    blockedReason: String,

    // ===== Stall Assignment (Employee/Delivery Person এর জন্য) =====
    assignedStall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stall',
      index: true,
    },

    // ===== Notifications =====
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
    },

    // ===== Device Tokens (Push Notification এর জন্য) =====
    deviceTokens: [
      {
        token: String,
        platform: {
          type: String,
          enum: ['ios', 'android', 'web'],
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // createdAt এবং updatedAt automatically add হবে
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========================
// INDEXES - Performance এর জন্য
// ========================
userSchema.index({ email: 1, phone: 1 }); // Compound index
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ assignedStall: 1 });
userSchema.index({ createdAt: -1 }); // Recent users

// ========================
// MIDDLEWARE - Pre-save Hook
// ========================

// Password hash করা (save এর আগে)
userSchema.pre('save', async function (next) {
  // Password modify না হলে skip
  if (!this.isModified('password')) return next();

  try {
    // Password hash করা (10 rounds)
    this.password = await bcrypt.hash(this.password, 10);
    
    // Password change time track
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // 1 second আগে (JWT issue এর জন্য)
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Phone number normalize করা (save এর আগে)
userSchema.pre('save', function (next) {
  if (this.isModified('phone')) {
    // Whitespace এবং special characters remove
    let phone = this.phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // +91 যোগ করা যদি না থাকে
    if (!phone.startsWith('+91')) {
      if (phone.startsWith('91')) {
        phone = '+' + phone;
      } else if (phone.length === 10) {
        phone = '+91' + phone;
      }
    }
    
    this.phone = phone;
  }
  next();
});

// ========================
// INSTANCE METHODS
// ========================

// Password match করা
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Password change হয়েছে কিনা check (JWT issue এর পরে)
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// OTP generate করা
userSchema.methods.generateOTP = function (type = 'phone') {
  // 6 digit random OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 10 minutes validity
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  if (type === 'phone') {
    this.phoneOTP = {
      code: otp,
      expiresAt: expiresAt,
      attempts: 0,
    };
  } else if (type === 'email') {
    this.emailOTP = {
      code: otp,
      expiresAt: expiresAt,
      attempts: 0,
    };
  }
  
  return otp;
};

// OTP verify করা
userSchema.methods.verifyOTP = function (otp, type = 'phone') {
  const otpData = type === 'phone' ? this.phoneOTP : this.emailOTP;
  
  if (!otpData || !otpData.code) {
    return { success: false, message: 'OTP খুঁজে পাওয়া যায়নি' };
  }
  
  // Expiry check
  if (new Date() > otpData.expiresAt) {
    return { success: false, message: 'OTP মেয়াদ শেষ হয়ে গেছে' };
  }
  
  // Attempts check (max 5)
  if (otpData.attempts >= 5) {
    return { success: false, message: 'অনেকবার ভুল OTP দেওয়া হয়েছে, নতুন OTP request করুন' };
  }
  
  // Match check
  if (otpData.code !== otp) {
    otpData.attempts += 1;
    return { success: false, message: 'ভুল OTP' };
  }
  
  // Success
  if (type === 'phone') {
    this.phoneVerified = true;
    this.phoneOTP = undefined;
  } else {
    this.emailVerified = true;
    this.emailOTP = undefined;
  }
  
  return { success: true, message: 'OTP verified successfully' };
};

// Account lock check
userSchema.methods.isAccountLocked = function () {
  return this.accountLockedUntil && this.accountLockedUntil > Date.now();
};

// Login attempt track
userSchema.methods.trackLoginAttempt = function (success, ipAddress, userAgent) {
  if (success) {
    this.failedLoginAttempts = 0;
    this.lastLogin = Date.now();
    
    // Login history তে add
    this.loginHistory.unshift({
      timestamp: Date.now(),
      ipAddress,
      userAgent,
    });
    
    // শুধু last 10 login রাখা
    if (this.loginHistory.length > 10) {
      this.loginHistory = this.loginHistory.slice(0, 10);
    }
  } else {
    this.failedLoginAttempts += 1;
    
    // 5 বার ভুল হলে 15 minutes lock
    if (this.failedLoginAttempts >= 5) {
      this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
  }
};

// ========================
// VIRTUAL FIELDS
// ========================

// Full phone number with country code
userSchema.virtual('phoneFormatted').get(function () {
  if (this.phone) {
    const phone = this.phone.replace('+91', '');
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return '';
});

// Full address string
userSchema.virtual('fullAddress').get(function () {
  const parts = [];
  if (this.address?.street) parts.push(this.address.street);
  if (this.address?.area) parts.push(this.address.area);
  if (this.address?.city) parts.push(this.address.city);
  if (this.address?.pincode) parts.push(this.address.pincode);
  return parts.join(', ');
});

// ========================
// STATIC METHODS
// ========================

// Email দিয়ে user খুঁজে বের করা
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Phone দিয়ে user খুঁজে বের করা
userSchema.statics.findByPhone = function (phone) {
  // Normalize phone number
  phone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (!phone.startsWith('+91')) {
    if (phone.startsWith('91')) {
      phone = '+' + phone;
    } else if (phone.length === 10) {
      phone = '+91' + phone;
    }
  }
  return this.findOne({ phone });
};

// Active users only
userSchema.statics.findActive = function (conditions = {}) {
  return this.find({ ...conditions, isActive: true, isBlocked: false });
};

// ========================
// MODEL EXPORT
// ========================

const User = mongoose.model('User', userSchema);

module.exports = User;