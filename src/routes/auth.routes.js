// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, loginRateLimit } = require('../middleware/auth.middleware');

// ========================
// PUBLIC ROUTES (No auth required)
// ========================

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginRateLimit, authController.login);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP for phone/email
 * @access  Public
 */
router.post('/verify-otp', authController.verifyOTP);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP
 * @access  Public
 */
router.post('/resend-otp', authController.resendOTP);

// ========================
// PROTECTED ROUTES (Auth required)
// ========================

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, authController.getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, authController.logout);

module.exports = router;

// ========================
// API ENDPOINT DOCUMENTATION
// ========================

/*

BASE URL: http://localhost:5000/api/auth

==================
1. REGISTER USER
==================

POST /api/auth/register

Request Body:
{
  "fullName": "রমেশ ভৌমিক",
  "email": "ramesh@example.com",
  "phone": "9876543210",  // or "+919876543210" or "919876543210"
  "password": "MyPass@123",
  "roleName": "CUSTOMER"  // Optional, default: "CUSTOMER"
}

Success Response (201):
{
  "success": true,
  "message": "Registration successful! OTP পাঠানো হয়েছে",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "ramesh@example.com",
    "phone": "+91 98765 43210",
    "requiresVerification": {
      "phone": true,
      "email": true
    }
  }
}

Error Response (400):
{
  "success": false,
  "message": "এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট আছে"
}

==================
2. VERIFY OTP
==================

POST /api/auth/verify-otp

Request Body:
{
  "userId": "507f1f77bcf86cd799439011",
  "otp": "123456",
  "type": "phone"  // or "email"
}

Success Response (200):
{
  "success": true,
  "message": "মোবাইল verify হয়েছে",
  "data": {
    "verified": true,
    "phoneVerified": true,
    "emailVerified": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Only if both verified
  }
}

Error Response (400):
{
  "success": false,
  "message": "ভুল OTP"
}

==================
3. RESEND OTP
==================

POST /api/auth/resend-otp

Request Body:
{
  "userId": "507f1f77bcf86cd799439011",
  "type": "phone"  // or "email"
}

Success Response (200):
{
  "success": true,
  "message": "নতুন OTP পাঠানো হয়েছে"
}

==================
4. LOGIN
==================

POST /api/auth/login

Request Body:
{
  "identifier": "ramesh@example.com",  // Email or Phone
  "password": "MyPass@123"
}

Success Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "fullName": "রমেশ ভৌমিক",
      "email": "ramesh@example.com",
      "phone": "+91 98765 43210",
      "role": "CUSTOMER",
      "roleDisplayName": "গ্রাহক",
      "profilePicture": "https://..."
    }
  }
}

Error Response (401):
{
  "success": false,
  "message": "ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড"
}

Error Response (423) - Account Locked:
{
  "success": false,
  "message": "একাউন্ট লক হয়ে গেছে। ১৫ মিনিট পরে চেষ্টা করুন"
}

==================
5. GET CURRENT USER
==================

GET /api/auth/me

Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Success Response (200):
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "রমেশ ভৌমিক",
    "email": "ramesh@example.com",
    "phone": "+91 98765 43210",
    "role": {
      "name": "CUSTOMER",
      "displayName": "গ্রাহক",
      "level": 10
    },
    "profilePicture": "https://...",
    "address": "Street, Area, City, 700001",
    "assignedStall": null,
    "phoneVerified": true,
    "emailVerified": true,
    "twoFactorEnabled": false,
    "lastLogin": "2026-01-11T10:30:00.000Z"
  }
}

Error Response (401):
{
  "success": false,
  "message": "অনুগ্রহ করে login করুন"
}

==================
6. LOGOUT
==================

POST /api/auth/logout

Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Success Response (200):
{
  "success": true,
  "message": "Logout successful"
}

==================
PHONE NUMBER FORMATS ACCEPTED:
==================

All these formats are valid:
- 9876543210
- +919876543210
- 919876543210
- +91 98765 43210
- 91 9876543210

All will be normalized to: +919876543210

==================
ERROR CODES:
==================

200 - Success
201 - Created
400 - Bad Request (Validation Error)
401 - Unauthorized (Invalid Credentials)
403 - Forbidden (No Permission)
423 - Locked (Account Locked)
429 - Too Many Requests (Rate Limit)
500 - Server Error

*/