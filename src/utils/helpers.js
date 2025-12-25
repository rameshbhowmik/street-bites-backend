// Helper Functions
// বিভিন্ন সহায়ক functions

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Password hash করার function
// User এর password encrypt করে database এ save করার জন্য
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('❌ Password hash error:', error);
    throw new Error('Password encryption এ সমস্যা হয়েছে');
  }
};

// Password verify করার function
// Login এর সময় password match করানোর জন্য
const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('❌ Password comparison error:', error);
    throw new Error('Password যাচাই করতে সমস্যা হয়েছে');
  }
};

// JWT token generate করার function
// User login করার পর token তৈরি করার জন্য
const generateToken = (userId, role = 'user') => {
  try {
    const token = jwt.sign(
      { userId, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    return token;
  } catch (error) {
    console.error('❌ Token generation error:', error);
    throw new Error('Token তৈরি করতে সমস্যা হয়েছে');
  }
};

// Success response format
// সফল response এর জন্য standard format
const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message: message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Error response format
// Error response এর জন্য standard format
const errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message: message
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

// Pagination helper
// Database query এর জন্য pagination calculate করা
const getPagination = (page = 1, limit = 10) => {
  const pageNumber = parseInt(page) || 1;
  const limitNumber = parseInt(limit) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  return {
    limit: limitNumber,
    offset: offset,
    page: pageNumber
  };
};

// Format pagination response
// Pagination data সহ response format করা
const paginationResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: data,
    pagination: {
      currentPage: parseInt(page),
      totalPages: totalPages,
      totalItems: parseInt(total),
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

// Validate email format
// Email এর format সঠিক কিনা check করা
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Bangladesh format)
// বাংলাদেশের phone number format check করা
const isValidPhone = (phone) => {
  const phoneRegex = /^(\+88)?01[3-9]\d{8}$/;
  return phoneRegex.test(phone);
};

// Generate random OTP
// OTP (One Time Password) তৈরি করা
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

// Format price in BDT
// টাকার পরিমাণ সুন্দর format এ দেখানো
const formatPrice = (price) => {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT'
  }).format(price);
};

// Calculate distance between two coordinates
// দুটি স্থানের মধ্যে দূরত্ব calculate করা (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // পৃথিবীর ব্যাসার্ধ (কিলোমিটারে)
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // কিলোমিটারে
};

// Convert degrees to radians
// ডিগ্রি থেকে radian এ convert করা
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Sanitize user input
// User input থেকে harmful characters remove করা
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // HTML tags remove
    .replace(/'/g, "''"); // SQL injection prevention
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  successResponse,
  errorResponse,
  getPagination,
  paginationResponse,
  isValidEmail,
  isValidPhone,
  generateOTP,
  formatPrice,
  calculateDistance,
  sanitizeInput
};