// backend/src/routes/auth.routes.js - ENHANCED VERSION
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, loginRateLimit } = require('../middleware/auth.middleware');

// ========================
// PUBLIC ROUTES (No authentication required)
// ========================

/**
 * @route   POST /api/auth/register
 * @desc    Register new user with email and phone
 * @access  Public
 * @body    { fullName, email, phone, password, roleName }
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email/phone and password
 * @access  Public
 * @body    { identifier (email or phone), password }
 */
router.post('/login', loginRateLimit, authController.login);

/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify 2FA code after login
 * @access  Public
 * @body    { tempToken, code }
 */
router.post('/verify-2fa', authController.verify2FA);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP for phone/email verification
 * @access  Public
 * @body    { userId, otp, type (phone/email) }
 */
router.post('/verify-otp', authController.verifyOTP);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to phone/email
 * @access  Public
 * @body    { userId, type (phone/email) }
 */
router.post('/resend-otp', authController.resendOTP);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Get new access token using refresh token
 * @access  Public
 * @body    { refreshToken }
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 * @body    { email }
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token from email
 * @access  Public
 * @body    { token, newPassword }
 */
router.post('/reset-password', authController.resetPassword);

// ========================
// PROTECTED ROUTES (Authentication required)
// ========================

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, authController.getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user from current device
 * @access  Private
 * @body    { refreshToken }
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password while logged in
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.post('/change-password', authenticateToken, authController.changePassword);

// ========================
// TWO-FACTOR AUTHENTICATION ROUTES
// ========================

/**
 * @route   POST /api/auth/2fa/enable
 * @desc    Generate QR code and backup codes for 2FA setup
 * @access  Private
 */
router.post('/2fa/enable', authenticateToken, authController.enable2FA);

/**
 * @route   POST /api/auth/2fa/verify-setup
 * @desc    Verify 2FA code to complete setup
 * @access  Private
 * @body    { code }
 */
router.post('/2fa/verify-setup', authenticateToken, authController.verify2FASetup);

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable 2FA (requires password)
 * @access  Private
 * @body    { password }
 */
router.post('/2fa/disable', authenticateToken, authController.disable2FA);

// ========================
// LOGIN HISTORY & SESSIONS
// ========================

/**
 * @route   GET /api/auth/login-history
 * @desc    Get user's login history
 * @access  Private
 * @query   { limit, page }
 */
router.get('/login-history', authenticateToken, authController.getLoginHistory);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get active sessions across all devices
 * @access  Private
 */
router.get('/sessions', authenticateToken, authController.getActiveSessions);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices (requires password)
 * @access  Private
 * @body    { password }
 */
router.post('/logout-all', authenticateToken, authController.logoutAllDevices);

// ========================
// DEVICE MANAGEMENT
// ========================

/**
 * @route   GET /api/auth/devices
 * @desc    Get user's trusted devices
 * @access  Private
 */
router.get('/devices', authenticateToken, authController.getTrustedDevices);

/**
 * @route   POST /api/auth/devices/block
 * @desc    Block a specific device
 * @access  Private
 * @body    { deviceFingerprint, reason }
 */
router.post('/devices/block', authenticateToken, authController.blockDevice);

/**
 * @route   POST /api/auth/devices/unblock
 * @desc    Unblock a specific device
 * @access  Private
 * @body    { deviceFingerprint }
 */
router.post('/devices/unblock', authenticateToken, authController.unblockDevice);

module.exports = router;

// ========================
// API DOCUMENTATION
// ========================

/*

BASE URL: http://localhost:5000/api/auth

==================
📋 AUTHENTICATION FLOW
==================

1. REGISTER USER
   POST /register
   Body: {
     "fullName": "রমেশ ভৌমিক",
     "email": "ramesh@example.com",
     "phone": "9876543210",
     "password": "MyPass@123",
     "roleName": "CUSTOMER"
   }
   Response: { userId, requiresVerification }

2. VERIFY OTP
   POST /verify-otp
   Body: {
     "userId": "...",
     "otp": "123456",
     "type": "phone"
   }
   Response: { token (if both verified) }

3. LOGIN
   POST /login
   Body: {
     "identifier": "ramesh@example.com", // or phone
     "password": "MyPass@123"
   }
   Response: { accessToken, refreshToken, user }

4. ACCESS PROTECTED ROUTES
   Headers: Authorization: Bearer {accessToken}

5. REFRESH TOKEN (when access token expires)
   POST /refresh-token
   Body: { "refreshToken": "..." }
   Response: { accessToken }

==================
🔐 TWO-FACTOR AUTHENTICATION FLOW
==================

1. ENABLE 2FA
   POST /2fa/enable
   Headers: Authorization: Bearer {token}
   Response: { secret, qrCode, backupCodes }

2. SCAN QR CODE in Google Authenticator app

3. VERIFY SETUP
   POST /2fa/verify-setup
   Body: { "code": "123456" }
   Response: { success, backupCodes }

4. LOGIN WITH 2FA
   POST /login
   Response: { requires2FA: true, tempToken }

5. VERIFY 2FA CODE
   POST /verify-2fa
   Body: { "tempToken": "...", "code": "123456" }
   Response: { accessToken, refreshToken }

==================
🔑 PASSWORD RESET FLOW
==================

1. REQUEST RESET
   POST /forgot-password
   Body: { "email": "ramesh@example.com" }

2. CHECK EMAIL for reset link

3. RESET PASSWORD
   POST /reset-password
   Body: {
     "token": "...",
     "newPassword": "NewPass@123"
   }

==================
📱 DEVICE MANAGEMENT
==================

1. GET DEVICES
   GET /devices
   Response: { devices, stats }

2. BLOCK DEVICE
   POST /devices/block
   Body: {
     "deviceFingerprint": "...",
     "reason": "suspicious_activity"
   }

3. UNBLOCK DEVICE
   POST /devices/unblock
   Body: { "deviceFingerprint": "..." }

==================
📊 LOGIN HISTORY
==================

1. GET HISTORY
   GET /login-history?limit=20&page=1
   Response: { history, stats, pagination }

2. GET ACTIVE SESSIONS
   GET /sessions
   Response: { activeSessions, sessions }

3. LOGOUT ALL DEVICES
   POST /logout-all
   Body: { "password": "MyPass@123" }

==================
🔒 SECURITY FEATURES
==================

✅ JWT Access Token (15 minutes)
✅ Refresh Token (7 days)
✅ Two-Factor Authentication
✅ Login History Tracking
✅ Suspicious Login Detection
✅ Device Fingerprinting
✅ Rate Limiting (5 attempts/15min)
✅ Account Lockout (5 failed attempts)
✅ Password Reset via Email
✅ Email & Phone OTP Verification
✅ Trusted Device Management
✅ Session Management
✅ Force Logout All Devices

==================
📝 RESPONSE FORMATS
==================

Success Response:
{
  "success": true,
  "message": "...",
  "data": { ... }
}

Error Response:
{
  "success": false,
  "message": "Error message in Bengali/English"
}

==================
🚨 ERROR CODES
==================

200 - Success
201 - Created
400 - Bad Request (Validation Error)
401 - Unauthorized (Invalid Credentials)
403 - Forbidden (No Permission / Account Issues)
404 - Not Found
423 - Locked (Account Locked)
429 - Too Many Requests (Rate Limit)
500 - Server Error

==================
🔧 TESTING TIPS
==================

1. Use Thunder Client or Postman
2. Save tokens in environment variables
3. Test all error scenarios
4. Check email/console for OTPs (dev mode)
5. Test 2FA with Google Authenticator
6. Test rate limiting by making 6+ login attempts
7. Test device blocking/unblocking
8. Test password reset flow
9. Test session management

==================
📚 DEPENDENCIES REQUIRED
==================

npm install:
- jsonwebtoken
- bcryptjs
- speakeasy (for 2FA)
- qrcode (for 2FA QR codes)
- @supabase/supabase-js
- crypto (built-in Node.js)

*/