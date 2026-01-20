// backend/src/models/LoginHistory.js
const mongoose = require('mongoose');

/**
 * Login History Schema - সব login attempts track করা
 * Features: Device tracking, IP tracking, Location tracking, Suspicious login detection
 */
const loginHistorySchema = new mongoose.Schema(
  {
    // ============ User Reference ============
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID প্রয়োজন'],
      index: true,
    },

    // ============ Login Status ============
    loginStatus: {
      type: String,
      enum: ['success', 'failed', 'blocked', 'suspicious'],
      required: true,
      index: true,
    },

    // Login attempt time
    attemptedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // ============ Device Information ============
    deviceInfo: {
      // Browser User Agent
      userAgent: {
        type: String,
        trim: true,
      },

      // Device Type (mobile, tablet, desktop)
      deviceType: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown',
      },

      // Browser Name
      browser: {
        type: String,
        trim: true,
      },

      // Operating System
      os: {
        type: String,
        trim: true,
      },

      // Device fingerprint (unique identifier)
      deviceFingerprint: {
        type: String,
        trim: true,
        index: true,
      },
    },

    // ============ Network Information ============
    networkInfo: {
      // IP Address
      ipAddress: {
        type: String,
        required: true,
        index: true,
      },

      // Location (from IP)
      location: {
        country: String,
        countryCode: String,
        region: String,
        city: String,
        latitude: Number,
        longitude: Number,
      },

      // ISP (Internet Service Provider)
      isp: String,
    },

    // ============ Failure Information ============
    failureReason: {
      type: String,
      enum: [
        'wrong_password',
        'invalid_email',
        'invalid_phone',
        'account_locked',
        'account_blocked',
        'unverified_account',
        'rate_limit_exceeded',
        'suspicious_activity',
        null,
      ],
      default: null,
    },

    // ============ Security Flags ============
    isSuspicious: {
      type: Boolean,
      default: false,
      index: true,
    },

    suspiciousReasons: [
      {
        type: String,
        enum: [
          'new_device',
          'new_location',
          'unusual_time',
          'multiple_failed_attempts',
          'blacklisted_ip',
          'tor_exit_node',
          'proxy_detected',
          'impossible_travel', // একই user বিভিন্ন দেশ থেকে খুব কম সময়ে login
        ],
      },
    ],

    // ============ Two-Factor Authentication ============
    twoFactorUsed: {
      type: Boolean,
      default: false,
    },

    twoFactorMethod: {
      type: String,
      enum: ['authenticator', 'sms', 'email', null],
      default: null,
    },

    // ============ Session Information ============
    sessionId: {
      type: String,
      trim: true,
    },

    // Session expiry time
    sessionExpiresAt: {
      type: Date,
    },

    // ============ Logout Information ============
    loggedOutAt: {
      type: Date,
      default: null,
    },

    logoutReason: {
      type: String,
      enum: ['user_logout', 'session_expired', 'forced_logout', 'security_logout', null],
      default: null,
    },

    // ============ Additional Notes ============
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ========================
// INDEXES
// ========================

// Compound indexes for faster queries
loginHistorySchema.index({ userId: 1, attemptedAt: -1 });
loginHistorySchema.index({ userId: 1, loginStatus: 1 });
loginHistorySchema.index({ 'networkInfo.ipAddress': 1, attemptedAt: -1 });
loginHistorySchema.index({ isSuspicious: 1, attemptedAt: -1 });
loginHistorySchema.index({ 'deviceInfo.deviceFingerprint': 1 });

// ========================
// VIRTUAL FIELDS
// ========================

// Session duration (if logged out)
loginHistorySchema.virtual('sessionDuration').get(function () {
  if (this.loggedOutAt && this.loginStatus === 'success') {
    return Math.floor((this.loggedOutAt - this.attemptedAt) / 1000 / 60); // minutes
  }
  return null;
});

// Is session active
loginHistorySchema.virtual('isSessionActive').get(function () {
  if (this.loginStatus !== 'success') return false;
  if (this.loggedOutAt) return false;
  if (this.sessionExpiresAt && this.sessionExpiresAt < new Date()) return false;
  return true;
});

// ========================
// STATIC METHODS
// ========================

/**
 * Get user's login history
 */
loginHistorySchema.statics.getUserHistory = function (userId, limit = 20) {
  return this.find({ userId })
    .sort({ attemptedAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get recent failed attempts
 */
loginHistorySchema.statics.getRecentFailedAttempts = function (userId, minutes = 15) {
  const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
  return this.countDocuments({
    userId,
    loginStatus: 'failed',
    attemptedAt: { $gte: cutoffTime },
  });
};

/**
 * Get suspicious logins
 */
loginHistorySchema.statics.getSuspiciousLogins = function (userId, days = 30) {
  const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({
    userId,
    isSuspicious: true,
    attemptedAt: { $gte: cutoffTime },
  })
    .sort({ attemptedAt: -1 })
    .lean();
};

/**
 * Check if device is trusted (has successful logins before)
 */
loginHistorySchema.statics.isDeviceTrusted = async function (userId, deviceFingerprint) {
  if (!deviceFingerprint) return false;

  const successfulLogin = await this.findOne({
    userId,
    'deviceInfo.deviceFingerprint': deviceFingerprint,
    loginStatus: 'success',
  });

  return !!successfulLogin;
};

/**
 * Check if IP is suspicious (many failed attempts)
 */
loginHistorySchema.statics.isIPSuspicious = async function (ipAddress, minutes = 60) {
  const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
  
  const failedCount = await this.countDocuments({
    'networkInfo.ipAddress': ipAddress,
    loginStatus: 'failed',
    attemptedAt: { $gte: cutoffTime },
  });

  return failedCount >= 10; // 10+ failed attempts in last hour
};

/**
 * Get active sessions for user
 */
loginHistorySchema.statics.getActiveSessions = function (userId) {
  return this.find({
    userId,
    loginStatus: 'success',
    loggedOutAt: null,
    sessionExpiresAt: { $gt: new Date() },
  })
    .sort({ attemptedAt: -1 })
    .lean();
};

/**
 * Terminate all sessions for user (force logout)
 */
loginHistorySchema.statics.terminateAllSessions = async function (userId, reason = 'forced_logout') {
  return this.updateMany(
    {
      userId,
      loginStatus: 'success',
      loggedOutAt: null,
    },
    {
      $set: {
        loggedOutAt: new Date(),
        logoutReason: reason,
      },
    }
  );
};

/**
 * Get login statistics for user
 */
loginHistorySchema.statics.getUserStats = async function (userId, days = 30) {
  const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        attemptedAt: { $gte: cutoffTime },
      },
    },
    {
      $group: {
        _id: '$loginStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  // Get unique devices and locations
  const uniqueDevices = await this.distinct('deviceInfo.deviceFingerprint', {
    userId: mongoose.Types.ObjectId(userId),
    attemptedAt: { $gte: cutoffTime },
  });

  const uniqueLocations = await this.distinct('networkInfo.location.city', {
    userId: mongoose.Types.ObjectId(userId),
    attemptedAt: { $gte: cutoffTime },
  });

  return {
    totalAttempts: stats.reduce((sum, s) => sum + s.count, 0),
    successfulLogins: stats.find((s) => s._id === 'success')?.count || 0,
    failedAttempts: stats.find((s) => s._id === 'failed')?.count || 0,
    suspiciousAttempts: stats.find((s) => s._id === 'suspicious')?.count || 0,
    uniqueDevices: uniqueDevices.length,
    uniqueLocations: uniqueLocations.filter(Boolean).length,
  };
};

// ========================
// INSTANCE METHODS
// ========================

/**
 * Mark login as suspicious
 */
loginHistorySchema.methods.markAsSuspicious = function (reasons = []) {
  this.isSuspicious = true;
  this.suspiciousReasons = reasons;
  return this.save();
};

/**
 * End session (logout)
 */
loginHistorySchema.methods.endSession = function (reason = 'user_logout') {
  this.loggedOutAt = new Date();
  this.logoutReason = reason;
  return this.save();
};

// ========================
// MIDDLEWARE
// ========================

// Auto-detect device type from user agent
loginHistorySchema.pre('save', function (next) {
  if (this.isNew && this.deviceInfo.userAgent) {
    const ua = this.deviceInfo.userAgent.toLowerCase();

    // Detect device type
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      this.deviceInfo.deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      this.deviceInfo.deviceType = 'tablet';
    } else {
      this.deviceInfo.deviceType = 'desktop';
    }

    // Detect browser
    if (ua.includes('chrome')) this.deviceInfo.browser = 'Chrome';
    else if (ua.includes('firefox')) this.deviceInfo.browser = 'Firefox';
    else if (ua.includes('safari')) this.deviceInfo.browser = 'Safari';
    else if (ua.includes('edge')) this.deviceInfo.browser = 'Edge';
    else this.deviceInfo.browser = 'Unknown';

    // Detect OS
    if (ua.includes('windows')) this.deviceInfo.os = 'Windows';
    else if (ua.includes('mac')) this.deviceInfo.os = 'MacOS';
    else if (ua.includes('linux')) this.deviceInfo.os = 'Linux';
    else if (ua.includes('android')) this.deviceInfo.os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone')) this.deviceInfo.os = 'iOS';
    else this.deviceInfo.os = 'Unknown';
  }

  next();
});

// Ensure virtuals are included in JSON
loginHistorySchema.set('toJSON', { virtuals: true });
loginHistorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);