// Authentication Middleware
// JWT token যাচাই করার middleware

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { verifyToken, extractTokenFromHeader } = require('../utils/authUtils');

// =============================================
// AUTHENTICATE TOKEN - JWT token verify করার middleware
// =============================================
const authenticateToken = async (req, res, next) => {
  try {
    // Authorization header থেকে token নেওয়া
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);

    // যদি token না থাকে
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'অ্যাক্সেস টোকেন প্রয়োজন। অনুগ্রহ করে লগইন করুন।'
      });
    }

    // Token verify করা
    const decoded = verifyToken(token);

    // Database থেকে user information নেওয়া
    const userResult = await query(
      'SELECT id, email, role, full_name, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    // যদি user না পাওয়া যায়
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ইউজার পাওয়া যায়নি'
      });
    }

    const user = userResult.rows[0];

    // User account suspended বা deleted কিনা check করা
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'আপনার account সক্রিয় নেই। Admin এর সাথে যোগাযোগ করুন।'
      });
    }

    // Request object এ user data যোগ করা
    req.user = user;
    req.token = token;

    next();

  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    
    return res.status(403).json({
      success: false,
      message: error.message || 'Authentication এ সমস্যা হয়েছে'
    });
  }
};

// =============================================
// AUTHORIZE ROLES - Role-based authorization middleware
// =============================================
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // User authenticated কিনা check করা
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'প্রথমে লগইন করুন'
      });
    }

    // User এর role allowed roles এর মধ্যে আছে কিনা check করা
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `শুধুমাত্র ${allowedRoles.join(', ')} access করতে পারবেন`
      });
    }

    next();
  };
};

// =============================================
// OPTIONAL AUTH - Token থাকলে verify করবে, না থাকলেও চলবে
// =============================================
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      const userResult = await query(
        'SELECT id, email, role, full_name, status FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].status === 'active') {
        req.user = userResult.rows[0];
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Error হলেও next() call করা কারণ এটা optional
    next();
  }
};

// =============================================
// CHECK OWNERSHIP - নিজের data কিনা check করা
// =============================================
const checkOwnership = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'লগইন করুন'
      });
    }

    // Admin সব access করতে পারবে
    if (req.user.role === 'owner') {
      return next();
    }

    // Resource এর user_id req.user.id এর সাথে match করছে কিনা
    const resourceUserId = req.params.userId || req.body[resourceUserIdField];

    if (parseInt(resourceUserId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'আপনার শুধুমাত্র নিজের data access করার অনুমতি আছে'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth,
  checkOwnership
};