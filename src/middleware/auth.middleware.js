// backend/src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================
// 1. JWT TOKEN VERIFICATION (authenticateToken)
// ============================================

/**
 * JWT Token Verify করে এবং user info req.user তে set করে
 */
exports.authenticateToken = async (req, res, next) => {
  try {
    let token;

    // Check token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'অনুগ্রহ করে login করুন',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).populate('role');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalid - User not found',
      });
    }

    // Check if user is active
    if (!user.isActive || user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'আপনার একাউন্ট সক্রিয় নয়',
      });
    }

    // Check if user changed password after token was issued
    if (user.passwordChangedAt) {
      const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          success: false,
          message: 'পাসওয়ার্ড পরিবর্তন হয়েছে। আবার login করুন',
        });
      }
    }

    // Grant access - set user in request
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth Middleware Error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token মেয়াদ শেষ হয়ে গেছে। আবার login করুন',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

// ============================================
// 2. ROLE-BASED AUTHORIZATION (authorizeRoles)
// ============================================

/**
 * Check if user has required roles
 * @param  {...string} roles - Allowed role names (e.g., 'Owner', 'Manager')
 */
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - No user found',
      });
    }

    // Get user's role name
    let userRole;
    if (typeof req.user.role === 'object' && req.user.role.name) {
      userRole = req.user.role.name;
    } else if (typeof req.user.role === 'string') {
      userRole = req.user.role;
    }

    // Normalize to lowercase for comparison
    const normalizedUserRole = userRole ? userRole.toLowerCase() : '';
    const normalizedAllowedRoles = roles.map(role => role.toLowerCase());

    // Check if user's role is in allowed roles (case-insensitive)
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `এই কাজ শুধুমাত্র ${roles.join(', ')} করতে পারবে`,
      });
    }

    next();
  };
};

// ============================================
// 3. PERMISSION-BASED AUTHORIZATION
// ============================================

/**
 * Check if user has specific permission
 * @param {string} module - Module name (e.g., 'products')
 * @param {string} action - Action name (e.g., 'create')
 */
exports.checkPermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Check permission (if role has hasPermission method)
    if (req.user.role.hasPermission && !req.user.role.hasPermission(module, action)) {
      return res.status(403).json({
        success: false,
        message: `আপনার ${module} ${action} করার permission নেই`,
      });
    }

    next();
  };
};

// ============================================
// 4. OWNERSHIP CHECK
// ============================================

/**
 * Check if user owns the resource or has admin privileges
 * @param {string} resourceKey - Key to check in req.params (e.g., 'userId')
 */
exports.checkOwnership = (resourceKey = 'userId') => {
  return (req, res, next) => {
    const resourceId = req.params[resourceKey];
    const userId = req.user._id.toString();

    // Admin roles can access any resource (case-insensitive check)
    const userRole = typeof req.user.role === 'object' ? req.user.role.name : req.user.role;
    const normalizedRole = userRole ? userRole.toLowerCase() : '';
    
    if (['owner', 'manager'].includes(normalizedRole)) {
      return next();
    }

    // Check ownership
    if (resourceId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'আপনি শুধুমাত্র নিজের তথ্য access করতে পারবেন',
      });
    }

    next();
  };
};

// ============================================
// 5. RATE LIMITER
// ============================================

const loginAttempts = new Map();

/**
 * Rate limit login attempts
 */
exports.loginRateLimit = (req, res, next) => {
  const identifier = req.body.identifier || req.body.phoneNumber || req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!loginAttempts.has(identifier)) {
    loginAttempts.set(identifier, []);
  }

  const attempts = loginAttempts.get(identifier);
  // Remove old attempts
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'অনেকবার চেষ্টা করা হয়েছে। ১৫ মিনিট পরে আবার চেষ্টা করুন',
    });
  }

  // Add current attempt
  recentAttempts.push(now);
  loginAttempts.set(identifier, recentAttempts);

  next();
};

// ============================================
// 6. OPTIONAL AUTH
// ============================================

/**
 * Optional authentication - doesn't fail if no token
 * Useful for public endpoints with optional user-specific features
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(); // Continue without user
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('role');

    if (user && user.isActive && !user.isBlocked) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Ignore errors and continue without user
    next();
  }
};

// ============================================
// BACKWARD COMPATIBILITY
// ============================================

// এগুলো পুরনো code এর জন্য রাখা হয়েছে
exports.protect = exports.authenticateToken;
exports.authorize = exports.authorizeRoles;
exports.restrictTo = exports.authorizeRoles;

module.exports = exports;