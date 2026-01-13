// backend/src/controllers/authController.js
const User = require('../models/User');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');
const { validateIndianPhone, validateEmail, validatePassword, validateOTP } = require('../utils/validators');

// ========================
// HELPER: JWT TOKEN GENERATE
// ========================

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// ========================
// HELPER: OTP SEND (Dummy - আপনার SMS gateway integrate করবেন)
// ========================

const sendOTP = async (phone, otp) => {
  // TODO: Implement actual SMS gateway (Twilio, MSG91, etc.)
  console.log(`📱 OTP for ${phone}: ${otp}`);
  
  // Development এ console এ দেখাচ্ছি
  // Production এ SMS gateway দিয়ে পাঠাবেন
  return true;
};

const sendEmailOTP = async (email, otp) => {
  // TODO: Implement email service (SendGrid, Nodemailer, etc.)
  console.log(`📧 OTP for ${email}: ${otp}`);
  return true;
};

// ========================
// 1. REGISTER - নতুন user তৈরি
// ========================

exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, password, roleName = 'CUSTOMER' } = req.body;

    // ===== Validation =====
    
    // Phone validation
    const phoneValidation = validateIndianPhone(phone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.error,
      });
    }

    // Email validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error,
      });
    }

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.error,
      });
    }

    // ===== Check if user already exists =====
    const existingUserByEmail = await User.findByEmail(emailValidation.normalized);
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: 'এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট আছে',
      });
    }

    const existingUserByPhone = await User.findByPhone(phoneValidation.formatted);
    if (existingUserByPhone) {
      return res.status(400).json({
        success: false,
        message: 'এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একাউন্ট আছে',
      });
    }

    // ===== Get Role =====
    const role = await Role.findByName(roleName);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    // ===== Create User =====
    const user = await User.create({
      fullName,
      email: emailValidation.normalized,
      phone: phoneValidation.formatted,
      password,
      role: role._id,
    });

    // ===== Generate OTP for phone verification =====
    const phoneOTP = user.generateOTP('phone');
    await user.save();

    // Send OTP
    await sendOTP(phoneValidation.formatted, phoneOTP);

    // ===== Generate Email OTP =====
    const emailOTP = user.generateOTP('email');
    await user.save();

    // Send Email OTP
    await sendEmailOTP(emailValidation.normalized, emailOTP);

    // ===== Response =====
    res.status(201).json({
      success: true,
      message: 'Registration successful! OTP পাঠানো হয়েছে',
      data: {
        userId: user._id,
        email: user.email,
        phone: user.phoneFormatted,
        requiresVerification: {
          phone: !user.phoneVerified,
          email: !user.emailVerified,
        },
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

// ========================
// 2. VERIFY OTP
// ========================

exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp, type = 'phone' } = req.body;

    // OTP validation
    const otpValidation = validateOTP(otp);
    if (!otpValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: otpValidation.error,
      });
    }

    // Find user with OTP fields (IMPORTANT: select করতে হবে)
    const user = await User.findById(userId)
      .select('+phoneOTP.code +phoneOTP.expiresAt +phoneOTP.attempts +emailOTP.code +emailOTP.expiresAt +emailOTP.attempts');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify OTP
    const result = user.verifyOTP(otp, type);
    
    if (!result.success) {
      await user.save(); // Save attempts
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Save verification status
    await user.save();

    // Generate token if both verified
    let token = null;
    if (user.phoneVerified && user.emailVerified) {
      token = generateToken(user._id);
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
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message,
    });
  }
};

// ========================
// 3. RESEND OTP
// ========================

exports.resendOTP = async (req, res) => {
  try {
    const { userId, type = 'phone' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already verified
    if ((type === 'phone' && user.phoneVerified) || (type === 'email' && user.emailVerified)) {
      return res.status(400).json({
        success: false,
        message: 'Already verified',
      });
    }

    // Generate new OTP
    const otp = user.generateOTP(type);
    await user.save();

    // Send OTP
    if (type === 'phone') {
      await sendOTP(user.phone, otp);
    } else {
      await sendEmailOTP(user.email, otp);
    }

    res.status(200).json({
      success: true,
      message: 'নতুন OTP পাঠানো হয়েছে',
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP resend failed',
      error: error.message,
    });
  }
};

// ========================
// 4. LOGIN
// ========================

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email or phone

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'ইমেইল/ফোন এবং পাসওয়ার্ড প্রয়োজন',
      });
    }

    // Find user by email or phone
    let user;
    
    // Check if identifier is email or phone
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
      return res.status(401).json({
        success: false,
        message: 'ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড',
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      return res.status(423).json({
        success: false,
        message: 'একাউন্ট লক হয়ে গেছে। ১৫ মিনিট পরে চেষ্টা করুন',
      });
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: `একাউন্ট ব্লক করা হয়েছে। কারণ: ${user.blockedReason || 'Unknown'}`,
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      // Track failed attempt
      user.trackLoginAttempt(false, req.ip, req.get('user-agent'));
      await user.save();
      
      return res.status(401).json({
        success: false,
        message: 'ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড',
      });
    }

    // Check if phone/email verified
    if (!user.phoneVerified || !user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'প্রথমে phone/email verify করুন',
        requiresVerification: {
          phone: !user.phoneVerified,
          email: !user.emailVerified,
        },
        userId: user._id,
      });
    }

    // Track successful login
    user.trackLoginAttempt(true, req.ip, req.get('user-agent'));
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phoneFormatted,
          role: user.role.name,
          roleDisplayName: user.role.displayName,
          profilePicture: user.profilePicture.url,
        },
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// ========================
// 5. GET CURRENT USER
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
          name: user.role.name,
          displayName: user.role.displayName,
          level: user.role.level,
        },
        profilePicture: user.profilePicture.url,
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
      error: error.message,
    });
  }
};

// ========================
// 6. LOGOUT
// ========================

exports.logout = async (req, res) => {
  try {
    // Client side এ token remove করতে হবে
    // Optional: Token blacklist maintain করতে পারেন
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message,
    });
  }
};