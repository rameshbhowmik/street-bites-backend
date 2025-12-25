// Authentication Utility Functions
// Authentication এর জন্য সব helper functions

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// =============================================
// PASSWORD HASHING - Password hash করা
// =============================================
const hashPassword = async (password) => {
  try {
    // Password strength check করা
    if (!password || password.length < 8) {
      throw new Error('Password কমপক্ষে ৮ অক্ষরের হতে হবে');
    }

    // Salt rounds - যত বেশি, তত secure কিন্তু slow
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
  } catch (error) {
    console.error('❌ Password hash error:', error.message);
    throw error;
  }
};

// =============================================
// PASSWORD COMPARISON - Password verify করা
// =============================================
const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('❌ Password comparison error:', error.message);
    throw error;
  }
};

// =============================================
// JWT TOKEN GENERATION - Token তৈরি করা
// =============================================
const generateToken = (userId, role, expiresIn = '24h') => {
  try {
    const payload = {
      userId: userId,
      role: role,
      issuedAt: new Date().toISOString()
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: expiresIn }
    );

    return token;
  } catch (error) {
    console.error('❌ Token generation error:', error.message);
    throw error;
  }
};

// =============================================
// REFRESH TOKEN GENERATION - Refresh token তৈরি করা
// =============================================
const generateRefreshToken = (userId) => {
  try {
    const payload = {
      userId: userId,
      type: 'refresh',
      issuedAt: new Date().toISOString()
    };

    // Refresh token দীর্ঘ সময়ের জন্য valid থাকে (7 days)
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return refreshToken;
  } catch (error) {
    console.error('❌ Refresh token generation error:', error.message);
    throw error;
  }
};

// =============================================
// TOKEN VERIFICATION - Token verify করা
// =============================================
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token এর মেয়াদ শেষ হয়ে গেছে');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('অবৈধ token');
    } else {
      throw new Error('Token verify করতে সমস্যা হয়েছে');
    }
  }
};

// =============================================
// OTP GENERATION - 6 digit OTP তৈরি করা
// =============================================
const generateOTP = (length = 6) => {
  try {
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      otp += digits[randomIndex];
    }

    return otp;
  } catch (error) {
    console.error('❌ OTP generation error:', error.message);
    throw error;
  }
};

// =============================================
// PASSWORD STRENGTH VALIDATION - Password শক্তিশালী কিনা check
// =============================================
const validatePasswordStrength = (password) => {
  const errors = [];

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password কমপক্ষে ৮ অক্ষরের হতে হবে');
  }

  // Maximum length check
  if (password.length > 50) {
    errors.push('Password সর্বোচ্চ ৫০ অক্ষরের হতে পারবে');
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('কমপক্ষে একটি বড় হাতের অক্ষর থাকতে হবে');
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('কমপক্ষে একটি ছোট হাতের অক্ষর থাকতে হবে');
  }

  // At least one number
  if (!/[0-9]/.test(password)) {
    errors.push('কমপক্ষে একটি সংখ্যা থাকতে হবে');
  }

  // At least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('কমপক্ষে একটি বিশেষ চিহ্ন থাকতে হবে (!@#$%^&* ইত্যাদি)');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// =============================================
// EMAIL VALIDATION - Email format check করা
// =============================================
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// =============================================
// PHONE VALIDATION - Phone number check (Bangladesh & India)
// =============================================
const validatePhone = (phone) => {
  // Bangladesh: +8801XXXXXXXXX or 01XXXXXXXXX (11 digits)
  const bdPhoneRegex = /^(\+88)?01[3-9]\d{8}$/;
  
  // India: +91XXXXXXXXXX or XXXXXXXXXX (10 digits)
  const inPhoneRegex = /^(\+91)?[6-9]\d{9}$/;
  
  return bdPhoneRegex.test(phone) || inPhoneRegex.test(phone);
};

// =============================================
// SANITIZE INPUT - Input থেকে harmful characters remove
// =============================================
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    .replace(/[<>]/g, '') // HTML tags remove
    .replace(/'/g, "''"); // SQL injection prevention
};

// =============================================
// GENERATE RESET TOKEN - Password reset token
// =============================================
const generateResetToken = () => {
  // Random 32 character token
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';

  for (let i = 0; i < 32; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return token;
};

// =============================================
// TOKEN EXPIRY TIME - Token কত সময় পর expire হবে
// =============================================
const getTokenExpiryTime = (expiresIn) => {
  const expiryMap = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };

  return expiryMap[expiresIn] || expiryMap['24h'];
};

// =============================================
// EXTRACT TOKEN FROM HEADER - Header থেকে token নেওয়া
// =============================================
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  generateOTP,
  validatePasswordStrength,
  validateEmail,
  validatePhone,
  sanitizeInput,
  generateResetToken,
  getTokenExpiryTime,
  extractTokenFromHeader
};