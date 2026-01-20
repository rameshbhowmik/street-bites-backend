// backend/src/models/RefreshToken.js
const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Refresh Token Schema - Long-lived tokens for JWT refresh
 * Features: Token rotation, Device tracking, Automatic expiry
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    // ============ Token Information ============
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ============ Expiry ============
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    // ============ Device & Network Info ============
    deviceInfo: {
      userAgent: String,
      deviceType: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown',
      },
      deviceFingerprint: String,
    },

    ipAddress: {
      type: String,
      required: true,
    },

    // ============ Token Status ============
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedReason: {
      type: String,
      enum: [
        'user_logout',
        'password_changed',
        'security_breach',
        'manual_revoke',
        'token_refresh',
        null,
      ],
      default: null,
    },

    // ============ Usage Tracking ============
    lastUsedAt: {
      type: Date,
      default: null,
    },

    usageCount: {
      type: Number,
      default: 0,
    },

    // ============ Replacement Token (for rotation) ============
    replacedByToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ========================
// INDEXES
// ========================

refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired tokens

// ========================
// VIRTUAL FIELDS
// ========================

// Check if token is expired
refreshTokenSchema.virtual('isExpired').get(function () {
  return this.expiresAt < new Date();
});

// Check if token is valid (not expired and not revoked)
refreshTokenSchema.virtual('isValid').get(function () {
  return !this.isExpired && !this.isRevoked;
});

// Days until expiry
refreshTokenSchema.virtual('daysUntilExpiry').get(function () {
  if (this.isExpired) return 0;
  return Math.ceil((this.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
});

// ========================
// STATIC METHODS
// ========================

/**
 * Generate a new refresh token
 */
refreshTokenSchema.statics.generateToken = function (userId, deviceInfo = {}, ipAddress = '') {
  const token = crypto.randomBytes(64).toString('hex');
  const expiryDays = parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS || '7', 10);
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  return this.create({
    token,
    userId,
    expiresAt,
    deviceInfo,
    ipAddress,
  });
};

/**
 * Find valid token
 */
refreshTokenSchema.statics.findValidToken = function (token) {
  return this.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).populate('userId');
};

/**
 * Get all active tokens for user
 */
refreshTokenSchema.statics.getUserActiveTokens = function (userId) {
  return this.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Revoke all user tokens (force logout from all devices)
 */
refreshTokenSchema.statics.revokeAllUserTokens = async function (userId, reason = 'manual_revoke') {
  return this.updateMany(
    {
      userId,
      isRevoked: false,
    },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );
};

/**
 * Clean up expired tokens (can be run as cron job)
 */
refreshTokenSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

/**
 * Rotate token (revoke old, create new)
 */
refreshTokenSchema.statics.rotateToken = async function (oldToken, deviceInfo = {}, ipAddress = '') {
  const oldTokenDoc = await this.findOne({ token: oldToken });
  
  if (!oldTokenDoc) {
    throw new Error('Token not found');
  }

  if (oldTokenDoc.isRevoked || oldTokenDoc.isExpired) {
    throw new Error('Token is invalid');
  }

  // Create new token
  const newToken = await this.generateToken(oldTokenDoc.userId, deviceInfo, ipAddress);

  // Revoke old token
  oldTokenDoc.isRevoked = true;
  oldTokenDoc.revokedAt = new Date();
  oldTokenDoc.revokedReason = 'token_refresh';
  oldTokenDoc.replacedByToken = newToken.token;
  await oldTokenDoc.save();

  return newToken;
};

// ========================
// INSTANCE METHODS
// ========================

/**
 * Revoke this token
 */
refreshTokenSchema.methods.revoke = function (reason = 'manual_revoke') {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

/**
 * Update last used time
 */
refreshTokenSchema.methods.updateUsage = function () {
  this.lastUsedAt = new Date();
  this.usageCount += 1;
  return this.save();
};

/**
 * Check if token can be used
 */
refreshTokenSchema.methods.canBeUsed = function () {
  return !this.isRevoked && !this.isExpired;
};

// ========================
// MIDDLEWARE
// ========================

// Auto-detect device type from user agent
refreshTokenSchema.pre('save', function (next) {
  if (this.isNew && this.deviceInfo.userAgent) {
    const ua = this.deviceInfo.userAgent.toLowerCase();

    if (/mobile|android|iphone|ipod/i.test(ua)) {
      this.deviceInfo.deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      this.deviceInfo.deviceType = 'tablet';
    } else {
      this.deviceInfo.deviceType = 'desktop';
    }
  }
  next();
});

// Ensure virtuals are included in JSON
refreshTokenSchema.set('toJSON', { virtuals: true });
refreshTokenSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);