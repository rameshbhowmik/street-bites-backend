// backend/src/models/TrustedDevice.js
const mongoose = require('mongoose');

/**
 * Trusted Device Schema - User's trusted devices management
 * Features: Device trust, Auto-block suspicious devices, Device limit
 */
const trustedDeviceSchema = new mongoose.Schema(
  {
    // ============ User Reference ============
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ============ Device Information ============
    deviceFingerprint: {
      type: String,
      required: true,
      index: true,
    },

    // Custom device name (user can set)
    deviceName: {
      type: String,
      trim: true,
      default: null,
    },

    deviceInfo: {
      userAgent: String,
      deviceType: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown',
      },
      browser: String,
      os: String,
    },

    // ============ Trust Status ============
    isTrusted: {
      type: Boolean,
      default: true,
      index: true,
    },

    // When device was first added
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },

    // When device was last used
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    // ============ Trust Level ============
    trustLevel: {
      type: String,
      enum: ['unknown', 'low', 'medium', 'high'],
      default: 'low',
      index: true,
    },

    // Factors that increase trust:
    trustFactors: {
      // Number of successful logins
      successfulLoginCount: {
        type: Number,
        default: 0,
      },

      // Days since first login
      daysSinceFirstSeen: {
        type: Number,
        default: 0,
      },

      // Verified by 2FA
      verifiedBy2FA: {
        type: Boolean,
        default: false,
      },

      // User manually verified this device
      manuallyVerified: {
        type: Boolean,
        default: false,
      },
    },

    // ============ Location Tracking ============
    lastKnownLocation: {
      country: String,
      countryCode: String,
      city: String,
      ipAddress: String,
    },

    // All locations this device was used from
    locationHistory: [
      {
        country: String,
        city: String,
        ipAddress: String,
        lastSeenAt: Date,
      },
    ],

    // ============ Blocking Information ============
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },

    blockedAt: {
      type: Date,
      default: null,
    },

    blockedReason: {
      type: String,
      enum: [
        'suspicious_activity',
        'user_blocked',
        'security_breach',
        'too_many_failed_attempts',
        'reported_stolen',
        null,
      ],
      default: null,
    },

    // ============ Expiry ============
    expiresAt: {
      type: Date,
      default: null, // null = never expires
    },

    // ============ Additional Info ============
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

// Compound index for user + device lookup
trustedDeviceSchema.index({ userId: 1, deviceFingerprint: 1 }, { unique: true });
trustedDeviceSchema.index({ userId: 1, isTrusted: 1 });
trustedDeviceSchema.index({ userId: 1, isBlocked: 1 });

// ========================
// VIRTUAL FIELDS
// ========================

// Check if device trust is expired
trustedDeviceSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

// Calculate trust score (0-100)
trustedDeviceSchema.virtual('trustScore').get(function () {
  let score = 0;

  // Base score
  if (this.isTrusted) score += 20;

  // Successful logins (max 30 points)
  score += Math.min(this.trustFactors.successfulLoginCount * 2, 30);

  // Days since first seen (max 20 points)
  score += Math.min(this.trustFactors.daysSinceFirstSeen, 20);

  // 2FA verified (10 points)
  if (this.trustFactors.verifiedBy2FA) score += 10;

  // Manually verified (20 points)
  if (this.trustFactors.manuallyVerified) score += 20;

  return Math.min(score, 100);
});

// Human-readable device description
trustedDeviceSchema.virtual('deviceDescription').get(function () {
  if (this.deviceName) return this.deviceName;

  const { deviceType, browser, os } = this.deviceInfo;
  return `${deviceType || 'Unknown'} - ${browser || 'Unknown Browser'} on ${os || 'Unknown OS'}`;
});

// ========================
// STATIC METHODS
// ========================

/**
 * Find or create trusted device
 */
trustedDeviceSchema.statics.findOrCreate = async function (userId, deviceFingerprint, deviceInfo = {}) {
  let device = await this.findOne({ userId, deviceFingerprint });

  if (!device) {
    device = await this.create({
      userId,
      deviceFingerprint,
      deviceInfo,
      trustLevel: 'low',
    });
  } else {
    // Update last used
    device.lastUsedAt = new Date();
    await device.save();
  }

  return device;
};

/**
 * Get user's trusted devices
 */
trustedDeviceSchema.statics.getUserDevices = function (userId) {
  return this.find({ userId, isBlocked: false }).sort({ lastUsedAt: -1 }).lean();
};

/**
 * Check if device is trusted
 */
trustedDeviceSchema.statics.isDeviceTrusted = async function (userId, deviceFingerprint) {
  const device = await this.findOne({ userId, deviceFingerprint });

  if (!device) return false;
  if (device.isBlocked) return false;
  if (device.isExpired) return false;
  if (!device.isTrusted) return false;

  return device.trustScore >= 50; // Minimum trust score
};

/**
 * Block device
 */
trustedDeviceSchema.statics.blockDevice = async function (userId, deviceFingerprint, reason = 'user_blocked') {
  return this.findOneAndUpdate(
    { userId, deviceFingerprint },
    {
      $set: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: reason,
      },
    },
    { new: true }
  );
};

/**
 * Remove old/unused devices (cleanup)
 */
trustedDeviceSchema.statics.cleanupOldDevices = function (days = 90) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    lastUsedAt: { $lt: cutoffDate },
    'trustFactors.manuallyVerified': false,
  });
};

/**
 * Get device statistics for user
 */
trustedDeviceSchema.statics.getUserDeviceStats = async function (userId) {
  const devices = await this.find({ userId });

  return {
    totalDevices: devices.length,
    trustedDevices: devices.filter((d) => d.isTrusted && !d.isBlocked).length,
    blockedDevices: devices.filter((d) => d.isBlocked).length,
    highTrustDevices: devices.filter((d) => d.trustScore >= 70).length,
    deviceTypes: {
      mobile: devices.filter((d) => d.deviceInfo.deviceType === 'mobile').length,
      tablet: devices.filter((d) => d.deviceInfo.deviceType === 'tablet').length,
      desktop: devices.filter((d) => d.deviceInfo.deviceType === 'desktop').length,
    },
  };
};

// ========================
// INSTANCE METHODS
// ========================

/**
 * Record successful login
 */
trustedDeviceSchema.methods.recordLogin = function (ipAddress = '', location = {}) {
  this.lastUsedAt = new Date();
  this.trustFactors.successfulLoginCount += 1;
  
  // Calculate days since first seen
  const daysSince = Math.floor((Date.now() - this.firstSeenAt) / (1000 * 60 * 60 * 24));
  this.trustFactors.daysSinceFirstSeen = daysSince;

  // Update location
  if (ipAddress) {
    this.lastKnownLocation = {
      ...location,
      ipAddress,
    };

    // Add to location history if new
    const existingLocation = this.locationHistory.find(
      (loc) => loc.ipAddress === ipAddress
    );

    if (!existingLocation) {
      this.locationHistory.push({
        ...location,
        ipAddress,
        lastSeenAt: new Date(),
      });
    }
  }

  // Auto-upgrade trust level
  this.upgradeTrustLevel();

  return this.save();
};

/**
 * Upgrade trust level based on trust score
 */
trustedDeviceSchema.methods.upgradeTrustLevel = function () {
  const score = this.trustScore;

  if (score >= 80) {
    this.trustLevel = 'high';
  } else if (score >= 60) {
    this.trustLevel = 'medium';
  } else if (score >= 30) {
    this.trustLevel = 'low';
  } else {
    this.trustLevel = 'unknown';
  }
};

/**
 * Mark device as verified by 2FA
 */
trustedDeviceSchema.methods.verify2FA = function () {
  this.trustFactors.verifiedBy2FA = true;
  this.upgradeTrustLevel();
  return this.save();
};

/**
 * Manually verify device (by user)
 */
trustedDeviceSchema.methods.manualVerify = function () {
  this.trustFactors.manuallyVerified = true;
  this.isTrusted = true;
  this.upgradeTrustLevel();
  return this.save();
};

/**
 * Block this device
 */
trustedDeviceSchema.methods.block = function (reason = 'user_blocked') {
  this.isBlocked = true;
  this.blockedAt = new Date();
  this.blockedReason = reason;
  return this.save();
};

/**
 * Unblock this device
 */
trustedDeviceSchema.methods.unblock = function () {
  this.isBlocked = false;
  this.blockedAt = null;
  this.blockedReason = null;
  return this.save();
};

// ========================
// MIDDLEWARE
// ========================

// Auto-detect device info on creation
trustedDeviceSchema.pre('save', function (next) {
  if (this.isNew && this.deviceInfo.userAgent) {
    const ua = this.deviceInfo.userAgent.toLowerCase();

    // Device type
    if (/mobile|android|iphone|ipod/i.test(ua)) {
      this.deviceInfo.deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      this.deviceInfo.deviceType = 'tablet';
    } else {
      this.deviceInfo.deviceType = 'desktop';
    }

    // Browser
    if (ua.includes('chrome')) this.deviceInfo.browser = 'Chrome';
    else if (ua.includes('firefox')) this.deviceInfo.browser = 'Firefox';
    else if (ua.includes('safari')) this.deviceInfo.browser = 'Safari';
    else if (ua.includes('edge')) this.deviceInfo.browser = 'Edge';

    // OS
    if (ua.includes('windows')) this.deviceInfo.os = 'Windows';
    else if (ua.includes('mac')) this.deviceInfo.os = 'MacOS';
    else if (ua.includes('android')) this.deviceInfo.os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone')) this.deviceInfo.os = 'iOS';
  }

  next();
});

// Ensure virtuals are included in JSON
trustedDeviceSchema.set('toJSON', { virtuals: true });
trustedDeviceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TrustedDevice', trustedDeviceSchema);