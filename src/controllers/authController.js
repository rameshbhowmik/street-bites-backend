// backend/src/controllers/authController.js - ROLE CASE FIXED

const User = require('../models/User');
const Role = require('../models/Role');
const LoginHistory = require('../models/LoginHistory');
const RefreshToken = require('../models/RefreshToken');
const TrustedDevice = require('../models/TrustedDevice');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { validateIndianPhone, validateEmail, validatePassword, validateOTP } = require('../utils/validators');
const {
  sendEmailOTP,
  sendPhoneOTP,
  sendPasswordResetEmail,
  send2FASetupEmail,
  sendSuspiciousLoginAlert
} = require('../config/supabase');

// ========================
// HELPER: GENERATE TOKENS
// ========================

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });
};

const generateRefreshToken = async (userId, deviceInfo, ipAddress) => {
  return await RefreshToken.generateToken(userId, deviceInfo, ipAddress);
};

// ========================
// HELPER: DEVICE FINGERPRINT
// ========================

const getDeviceFingerprint = (req) => {
  const ua = req.get('user-agent') || '';
  const ip = req.ip || '';
  return crypto.createHash('sha256').update(ua + ip).digest('hex');
};

// ========================
// 🔥 HELPER: NORMALIZE ROLE NAME (NEW)
// ========================

const normalizeRoleName = (roleName) => {
  if (!roleName) return 'customer';
  // Convert to lowercase and trim whitespace
  return roleName.toLowerCase().trim();
};

// ========================
// HELPER: DETECT SUSPICIOUS LOGIN
// ========================

const detectSuspiciousLogin = async (user, req) => {
  const suspiciousReasons = [];
  const deviceFingerprint = getDeviceFingerprint(req);

  // Check if device is trusted
  const isTrusted = await TrustedDevice.isDeviceTrusted(user._id, deviceFingerprint);
  if (!isTrusted) {
    suspiciousReasons.push('new_device');
  }

  // Check if IP is suspicious
  const isIPSuspicious = await LoginHistory.isIPSuspicious(req.ip);
  if (isIPSuspicious) {
    suspiciousReasons.push('blacklisted_ip');
  }

  // Check login time (unusual time = 2AM-5AM)
  const hour = new Date().getHours();
  if (hour >= 2 && hour <= 5) {
    suspiciousReasons.push('unusual_time');
  }

  return {
    isSuspicious: suspiciousReasons.length > 0,
    reasons: suspiciousReasons,
  };
};

// ========================
// 1. REGISTER - Enhanced with Role Fix
// ========================

exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, password, roleName = 'CUSTOMER' } = req.body;

    // 🔥 NORMALIZE ROLE NAME (FIX)
    const normalizedRoleName = normalizeRoleName(roleName);

    // Validation
    const phoneValidation = validateIndianPhone(phone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ success: false, message: phoneValidation.error });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ success: false, message: emailValidation.error });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ success: false, message: passwordValidation.error });
    }

    // Check existing users
    const existingUserByEmail = await User.findByEmail(emailValidation.normalized);
    if (existingUserByEmail) {
      return res.status(400).json({ success: false, message: 'এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট আছে' });
    }

    const existingUserByPhone = await User.findByPhone(phoneValidation.formatted);
    if (existingUserByPhone) {
      return res.status(400).json({ success: false, message: 'এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একাউন্ট আছে' });
    }

    // 🔥 GET ROLE (WITH NORMALIZED NAME)
    const role = await Role.findByName(normalizedRoleName);
    if (!role) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid role: ${roleName}. Available roles: owner, investor, manager, employee, delivery_person, customer` 
      });
    }

    // Create User
    const user = await User.create({
      fullName,
      email: emailValidation.normalized,
      phone: phoneValidation.formatted,
      password,
      role: role._id,
    });

    // Generate OTPs
    const phoneOTP = user.generateOTP('phone');
    const emailOTP = user.generateOTP('email');
    await user.save();

    // Send OTPs
    await sendPhoneOTP(phoneValidation.formatted, phoneOTP);
    await sendEmailOTP(emailValidation.normalized, emailOTP);

    res.status(201).json({
      success: true,
      message: 'Registration successful! OTP পাঠানো হয়েছে',
      data: {
        userId: user._id,
        email: user.email,
        phone: user.phoneFormatted,
        requiresVerification: { phone: !user.phoneVerified, email: !user.emailVerified },
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// ========================
// 2. LOGIN - Enhanced with Security
// ========================

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'ইমেইল/ফোন এবং পাসওয়ার্ড প্রয়োজন' });
    }

    // Find user
    let user;
    if (identifier.includes('@')) {
      const emailValidation = validateEmail(identifier);
      if (emailValidation.isValid) {
        user = await User.findByEmail(emailValidation.normalized).select('+password').populate('role');
      }
    } else {
      const phoneValidation = validateIndianPhone(identifier);
      if (phoneValidation.isValid) {
        user = await User.findByPhone(phoneValidation.formatted).select('+password').populate('role');
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড' });
    }

    // Check account status
    if (user.isAccountLocked()) {
      await LoginHistory.create({
        userId: user._id,
        loginStatus: 'blocked',
        failureReason: 'account_locked',
        deviceInfo: { userAgent: req.get('user-agent'), deviceFingerprint: getDeviceFingerprint(req) },
        networkInfo: { ipAddress: req.ip },
      });
      return res.status(423).json({ success: false, message: 'একাউন্ট লক হয়ে গেছে। ১৫ মিনিট পরে চেষ্টা করুন' });
    }

    if (user.isBlocked) {
      await LoginHistory.create({
        userId: user._id,
        loginStatus: 'blocked',
        failureReason: 'account_blocked',
        deviceInfo: { userAgent: req.get('user-agent'), deviceFingerprint: getDeviceFingerprint(req) },
        networkInfo: { ipAddress: req.ip },
      });
      return res.status(403).json({ success: false, message: `একাউন্ট ব্লক করা হয়েছে। কারণ: ${user.blockedReason || 'Unknown'}` });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      user.trackLoginAttempt(false, req.ip, req.get('user-agent'));
      await user.save();

      await LoginHistory.create({
        userId: user._id,
        loginStatus: 'failed',
        failureReason: 'wrong_password',
        deviceInfo: { userAgent: req.get('user-agent'), deviceFingerprint: getDeviceFingerprint(req) },
        networkInfo: { ipAddress: req.ip },
      });

      return res.status(401).json({ success: false, message: 'ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড' });
    }

    // Check verification
    if (!user.phoneVerified || !user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'প্রথমে phone/email verify করুন',
        requiresVerification: { phone: !user.phoneVerified, email: !user.emailVerified },
        userId: user._id,
      });
    }

    // Detect suspicious activity
    const { isSuspicious, reasons } = await detectSuspiciousLogin(user, req);

    // Create login history
    const deviceFingerprint = getDeviceFingerprint(req);
    const loginHistory = await LoginHistory.create({
      userId: user._id,
      loginStatus: isSuspicious ? 'suspicious' : 'success',
      deviceInfo: { userAgent: req.get('user-agent'), deviceFingerprint },
      networkInfo: { ipAddress: req.ip },
      isSuspicious,
      suspiciousReasons: reasons,
    });

    if (isSuspicious) {
      // Send alert email
      await sendSuspiciousLoginAlert(user.email, {
        location: 'Unknown',
        ipAddress: req.ip,
        deviceType: 'Unknown',
        browser: 'Unknown',
        timestamp: new Date(),
      });
    }

    // Update/Create trusted device
    const device = await TrustedDevice.findOrCreate(user._id, deviceFingerprint, {
      userAgent: req.get('user-agent'),
    });
    await device.recordLogin(req.ip);

    // If 2FA enabled, require 2FA code
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: false,
        requires2FA: true,
        message: '2FA code প্রয়োজন',
        tempToken: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '5m' }),
      });
    }

    // Track successful login
    user.trackLoginAttempt(true, req.ip, req.get('user-agent'));
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(
      user._id,
      { userAgent: req.get('user-agent'), deviceFingerprint },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken: refreshToken.token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phoneFormatted,
          role: user.role.name, // 🔥 Already lowercase from database
          profilePicture: user.profilePicture?.url,
        },
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

// ========================
// 3. VERIFY 2FA CODE
// ========================

exports.verify2FA = async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ success: false, message: 'Token এবং 2FA code প্রয়োজন' });
    }

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('role');

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    // Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      // Check backup codes
      const backupCodeIndex = user.twoFactorBackupCodes.findIndex((bc) => bc === code);
      if (backupCodeIndex === -1) {
        return res.status(400).json({ success: false, message: 'ভুল 2FA code' });
      }
      // Remove used backup code
      user.twoFactorBackupCodes.splice(backupCodeIndex, 1);
      await user.save();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const deviceFingerprint = getDeviceFingerprint(req);
    const refreshToken = await generateRefreshToken(
      user._id,
      { userAgent: req.get('user-agent'), deviceFingerprint },
      req.ip
    );

    // Mark device as 2FA verified
    const device = await TrustedDevice.findOne({ userId: user._id, deviceFingerprint });
    if (device) {
      await device.verify2FA();
    }

    res.status(200).json({
      success: true,
      message: '2FA verification successful',
      data: {
        accessToken,
        refreshToken: refreshToken.token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phoneFormatted,
          role: user.role.name, // 🔥 Already lowercase
        },
      },
    });
  } catch (error) {
    console.error('2FA Verification Error:', error);
    res.status(500).json({ success: false, message: '2FA verification failed', error: error.message });
  }
};

// ========================
// 4. REFRESH TOKEN
// ========================

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token প্রয়োজন' });
    }

    // Find and validate token
    const refreshToken = await RefreshToken.findValidToken(token);
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    // Update usage
    await refreshToken.updateUsage();

    // Generate new access token
    const accessToken = generateAccessToken(refreshToken.userId);

    res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(500).json({ success: false, message: 'Token refresh failed', error: error.message });
  }
};

// ========================
// 5. FORGOT PASSWORD
// ========================

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'ইমেইল প্রয়োজন' });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ success: false, message: emailValidation.error });
    }

    const user = await User.findByEmail(emailValidation.normalized);
    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: 'যদি এই ইমেইল আমাদের সিস্টেমে থাকে, তাহলে reset link পাঠানো হয়েছে',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send email
    await sendPasswordResetEmail(user.email, resetToken, user.fullName);

    res.status(200).json({
      success: true,
      message: 'Password reset link পাঠানো হয়েছে',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed', error: error.message });
  }
};

// ========================
// 6. RESET PASSWORD
// ========================

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token এবং নতুন পাসওয়ার্ড প্রয়োজন' });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ success: false, message: passwordValidation.error });
    }

    // Hash token and find user
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();

    // Revoke all refresh tokens
    await RefreshToken.revokeAllUserTokens(user._id, 'password_changed');
    await LoginHistory.terminateAllSessions(user._id, 'security_logout');

    res.status(200).json({
      success: true,
      message: 'Password reset successful. সব device থেকে logout হয়ে গেছে।',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed', error: error.message });
  }
};

// ========================
// 7. ENABLE TWO-FACTOR AUTHENTICATION
// ========================

exports.enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: '2FA already enabled' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Street Bites (${user.email})`,
      issuer: 'Street Bites',
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    // Save temporarily
    user.twoFactorSecret = secret.base32;
    user.twoFactorBackupCodes = backupCodes;
    user.twoFactorEnabled = false;
    await user.save();

    // Send email
    await send2FASetupEmail(user.email, qrCodeUrl, backupCodes, user.fullName);

    res.status(200).json({
      success: true,
      message: '2FA setup initiated',
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes,
      },
    });
  } catch (error) {
    console.error('Enable 2FA Error:', error);
    res.status(500).json({ success: false, message: '2FA setup failed', error: error.message });
  }
};

// ========================
// 8. VERIFY AND ENABLE 2FA
// ========================

exports.verify2FASetup = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: '2FA code প্রয়োজন' });
    }

    const user = await User.findById(req.user.id);

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: '2FA setup not initiated' });
    }

    // Verify code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'ভুল 2FA code' });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA সফলভাবে সক্রিয় করা হয়েছে',
      data: {
        backupCodes: user.twoFactorBackupCodes,
      },
    });
  } catch (error) {
    console.error('Verify 2FA Setup Error:', error);
    res.status(500).json({ success: false, message: '2FA verification failed', error: error.message });
  }
};

// ========================
// 9. DISABLE TWO-FACTOR AUTHENTICATION
// ========================

exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'পাসওয়ার্ড প্রয়োজন' });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'ভুল পাসওয়ার্ড' });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA বন্ধ করা হয়েছে',
    });
  } catch (error) {
    console.error('Disable 2FA Error:', error);
    res.status(500).json({ success: false, message: '2FA disable failed', error: error.message });
  }
};

// ========================
// 10. GET LOGIN HISTORY
// ========================

exports.getLoginHistory = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const history = await LoginHistory.find({ userId: req.user.id })
      .sort({ attemptedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await LoginHistory.countDocuments({ userId: req.user.id });
    const stats = await LoginHistory.getUserStats(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        history,
        stats,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get Login History Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch login history', error: error.message });
  }
};

// ========================
// 11. GET ACTIVE SESSIONS
// ========================

exports.getActiveSessions = async (req, res) => {
  try {
    const sessions = await LoginHistory.getActiveSessions(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        activeSessions: sessions.length,
        sessions,
      },
    });
  } catch (error) {
    console.error('Get Active Sessions Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sessions', error: error.message });
  }
};

// ========================
// 12. LOGOUT FROM ALL DEVICES
// ========================

exports.logoutAllDevices = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'পাসওয়ার্ড প্রয়োজন' });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'ভুল পাসওয়ার্ড' });
    }

    // Revoke all refresh tokens
    await RefreshToken.revokeAllUserTokens(req.user.id, 'user_logout');
    await LoginHistory.terminateAllSessions(req.user.id, 'user_logout');

    res.status(200).json({
      success: true,
      message: 'সব device থেকে logout করা হয়েছে',
    });
  } catch (error) {
    console.error('Logout All Devices Error:', error);
    res.status(500).json({ success: false, message: 'Logout failed', error: error.message });
  }
};

// ========================
// 13. GET TRUSTED DEVICES
// ========================

exports.getTrustedDevices = async (req, res) => {
  try {
    const devices = await TrustedDevice.getUserDevices(req.user.id);
    const stats = await TrustedDevice.getUserDeviceStats(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        devices,
        stats,
      },
    });
  } catch (error) {
    console.error('Get Trusted Devices Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch devices', error: error.message });
  }
};

// ========================
// 14. BLOCK DEVICE
// ========================

exports.blockDevice = async (req, res) => {
  try {
    const { deviceFingerprint, reason = 'user_blocked' } = req.body;

    if (!deviceFingerprint) {
      return res.status(400).json({ success: false, message: 'Device fingerprint প্রয়োজন' });
    }

    await TrustedDevice.blockDevice(req.user.id, deviceFingerprint, reason);

    // Revoke refresh tokens from this device
    await RefreshToken.updateMany(
      {
        userId: req.user.id,
        'deviceInfo.deviceFingerprint': deviceFingerprint,
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'device_blocked',
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Device blocked successfully',
    });
  } catch (error) {
    console.error('Block Device Error:', error);
    res.status(500).json({ success: false, message: 'Device block failed', error: error.message });
  }
};

// ========================
// 15. UNBLOCK DEVICE
// ========================

exports.unblockDevice = async (req, res) => {
  try {
    const { deviceFingerprint } = req.body;

    if (!deviceFingerprint) {
      return res.status(400).json({ success: false, message: 'Device fingerprint প্রয়োজন' });
    }

    const device = await TrustedDevice.findOne({
      userId: req.user.id,
      deviceFingerprint,
    });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    await device.unblock();

    res.status(200).json({
      success: true,
      message: 'Device unblocked successfully',
    });
  } catch (error) {
    console.error('Unblock Device Error:', error);
    res.status(500).json({ success: false, message: 'Device unblock failed', error: error.message });
  }
};

// ========================
// 16. CHANGE PASSWORD (WHILE LOGGED IN)
// ========================

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'বর্তমান এবং নতুন পাসওয়ার্ড প্রয়োজন' });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ success: false, message: passwordValidation.error });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'বর্তমান পাসওয়ার্ড ভুল' });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ success: false, message: 'নতুন পাসওয়ার্ড আগেরটির মতো হতে পারবে না' });
    }

    // Set new password
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    // Revoke all other refresh tokens
    await RefreshToken.updateMany(
      {
        userId: req.user.id,
        _id: { $ne: req.currentRefreshToken?._id },
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'password_changed',
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'পাসওয়ার্ড পরিবর্তন সফল। অন্য সব device থেকে logout হয়ে গেছে।',
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ success: false, message: 'Password change failed', error: error.message });
  }
};

// ========================
// 17. VERIFY OTP
// ========================

exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp, type = 'phone' } = req.body;

    const otpValidation = validateOTP(otp);
    if (!otpValidation.isValid) {
      return res.status(400).json({ success: false, message: otpValidation.error });
    }

    const user = await User.findById(userId)
      .select('+phoneOTP.code +phoneOTP.expiresAt +phoneOTP.attempts +emailOTP.code +emailOTP.expiresAt +emailOTP.attempts');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const result = user.verifyOTP(otp, type);
    if (!result.success) {
      await user.save();
      return res.status(400).json({ success: false, message: result.message });
    }

    await user.save();

    let token = null;
    if (user.phoneVerified && user.emailVerified) {
      token = generateAccessToken(user._id);
    }

    res.status(200).json({
      success: true,
      message: `${type === 'phone' ? 'মোবাইল' : 'ইমেইল'} verify হয়েছে`,
      data: {
        verified: true,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        token: token,
      },
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ success: false, message: 'OTP verification failed', error: error.message });
  }
};

// ========================
// 18. RESEND OTP
// ========================

exports.resendOTP = async (req, res) => {
  try {
    const { userId, type = 'phone' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if ((type === 'phone' && user.phoneVerified) || (type === 'email' && user.emailVerified)) {
      return res.status(400).json({ success: false, message: 'Already verified' });
    }

    const otp = user.generateOTP(type);
    await user.save();

    if (type === 'phone') {
      await sendPhoneOTP(user.phone, otp);
    } else {
      await sendEmailOTP(user.email, otp);
    }

    res.status(200).json({
      success: true,
      message: 'নতুন OTP পাঠানো হয়েছে',
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ success: false, message: 'OTP resend failed', error: error.message });
  }
};

// ========================
// 19. GET CURRENT USER
// ========================

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role').populate('assignedStall');

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phoneFormatted,
        role: {
          name: user.role.name, // 🔥 Already lowercase
          displayName: user.role.displayName,
          level: user.role.level,
        },
        profilePicture: user.profilePicture?.url,
        address: user.fullAddress,
        assignedStall: user.assignedStall,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user data', error: error.message });
  }
};

// ========================
// 20. LOGOUT
// ========================

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke this refresh token
      const token = await RefreshToken.findOne({ token: refreshToken });
      if (token) {
        await token.revoke('user_logout');
      }
    }

    // Mark current session as logged out
    const deviceFingerprint = getDeviceFingerprint(req);
    await LoginHistory.updateOne(
      {
        userId: req.user.id,
        'deviceInfo.deviceFingerprint': deviceFingerprint,
        loginStatus: 'success',
        loggedOutAt: null,
      },
      {
        $set: {
          loggedOutAt: new Date(),
          logoutReason: 'user_logout',
        },
      },
      { sort: { attemptedAt: -1 } }
    );

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ success: false, message: 'Logout failed', error: error.message });
  }
};

// ========================
// MODULE EXPORTS
// ========================

module.exports = {
  register: exports.register,
  login: exports.login,
  verify2FA: exports.verify2FA,
  refreshToken: exports.refreshToken,
  forgotPassword: exports.forgotPassword,
  resetPassword: exports.resetPassword,
  enable2FA: exports.enable2FA,
  verify2FASetup: exports.verify2FASetup,
  disable2FA: exports.disable2FA,
  getLoginHistory: exports.getLoginHistory,
  getActiveSessions: exports.getActiveSessions,
  logoutAllDevices: exports.logoutAllDevices,
  getTrustedDevices: exports.getTrustedDevices,
  blockDevice: exports.blockDevice,
  unblockDevice: exports.unblockDevice,
  changePassword: exports.changePassword,
  verifyOTP: exports.verifyOTP,
  resendOTP: exports.resendOTP,
  getMe: exports.getMe,
  logout: exports.logout,
}