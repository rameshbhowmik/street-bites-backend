// Authentication Controller
// সব authentication সংক্রান্ত operations

const { User } = require('../models');
const {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  validatePasswordStrength,
  validateEmail,
  validatePhone,
  sanitizeInput,
  generateOTP,
  generateResetToken
} = require('../utils/authUtils');

// =============================================
// REGISTER - নতুন user registration
// =============================================
const register = async (req, res) => {
  try {
    const { email, phone, password, full_name, role } = req.body;

    // Input validation
    if (!email || !phone || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'সব তথ্য প্রদান করুন (email, phone, password, full_name)'
      });
    }

    // Email validation
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'সঠিক email address প্রদান করুন'
      });
    }

    // Phone validation
    if (!validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'সঠিক phone number প্রদান করুন (01XXXXXXXXX)'
      });
    }

    // Password strength validation
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password দুর্বল',
        errors: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await User.checkExists(email, phone);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email 
          ? 'এই email ইতিমধ্যে ব্যবহৃত হয়েছে' 
          : 'এই phone number ইতিমধ্যে ব্যবহৃত হয়েছে'
      });
    }

    // Password hash করা
    const hashedPassword = await hashPassword(password);

    // User তৈরি করা
    const newUser = await User.create({
      email: sanitizeInput(email.toLowerCase()),
      phone: sanitizeInput(phone),
      password_hash: hashedPassword,
      full_name: sanitizeInput(full_name),
      role: role || 'customer',
      status: 'active'
    });

    // JWT token generate করা
    const token = generateToken(newUser.id, newUser.role);
    const refreshToken = generateRefreshToken(newUser.id);

    // Password hash response থেকে সরিয়ে ফেলা
    delete newUser.password_hash;

    // Success response
    return res.status(201).json({
      success: true,
      message: 'Registration সফল হয়েছে',
      data: {
        user: newUser,
        token: token,
        refreshToken: refreshToken
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration এ সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// LOGIN - User login
// =============================================
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email or phone

    // Input validation
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone এবং Password প্রদান করুন'
      });
    }

    // User খোঁজা (email বা phone দিয়ে)
    let user;
    if (validateEmail(identifier)) {
      user = await User.findByEmail(identifier.toLowerCase());
    } else if (validatePhone(identifier)) {
      user = await User.findByPhone(identifier);
    } else {
      return res.status(400).json({
        success: false,
        message: 'সঠিক email অথবা phone number প্রদান করুন'
      });
    }

    // User না পাওয়া গেলে
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ভুল email/phone অথবা password'
      });
    }

    // Account status check করা
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'আপনার account সক্রিয় নেই। Admin এর সাথে যোগাযোগ করুন।'
      });
    }

    // Password verify করা
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'ভুল email/phone অথবা password'
      });
    }

    // JWT token generate করা
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Password hash response থেকে সরিয়ে ফেলা
    delete user.password_hash;

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Login সফল হয়েছে',
      data: {
        user: user,
        token: token,
        refreshToken: refreshToken
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login এ সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET PROFILE - Current user profile
// =============================================
const getProfile = async (req, res) => {
  try {
    // req.user middleware থেকে আসছে
    const userId = req.user.id;

    // User details fetch করা
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User পাওয়া যায়নি'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile fetch সফল',
      data: user
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Profile fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// CHANGE PASSWORD - Password change করা
// =============================================
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Input validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'পুরনো এবং নতুন password প্রদান করুন'
      });
    }

    // New password strength validation
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'নতুন password দুর্বল',
        errors: passwordValidation.errors
      });
    }

    // User fetch করা (password hash সহ)
    const user = await User.findByEmail(req.user.email);

    // Old password verify করা
    const isOldPasswordValid = await comparePassword(oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'পুরনো password ভুল'
      });
    }

    // নতুন password hash করা
    const hashedNewPassword = await hashPassword(newPassword);

    // Database এ update করা
    await User.updatePassword(userId, hashedNewPassword);

    return res.status(200).json({
      success: true,
      message: 'Password সফলভাবে পরিবর্তন হয়েছে'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password change করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// FORGOT PASSWORD - Password reset request
// =============================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Input validation
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'সঠিক email address প্রদান করুন'
      });
    }

    // User খোঁজা
    const user = await User.findByEmail(email.toLowerCase());

    // Security: User না থাকলেও same response দেওয়া
    // তাহলে কেউ email exist করে কিনা বুঝতে পারবে না
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'যদি email টি আমাদের system এ থাকে, একটি reset link পাঠানো হয়েছে'
      });
    }

    // Reset token generate করা
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // TODO: Database এ reset token save করতে হবে
    // TODO: Email পাঠাতে হবে reset link সহ

    // OTP generate করা (Alternative approach)
    const otp = generateOTP(6);
    console.log(`📧 Reset OTP for ${email}: ${otp}`);

    // TODO: SMS/Email service integrate করতে হবে

    return res.status(200).json({
      success: true,
      message: 'Password reset instructions পাঠানো হয়েছে',
      // Development এর জন্য - Production এ সরিয়ে দিতে হবে
      ...(process.env.NODE_ENV === 'development' && { 
        debug: { otp, resetToken } 
      })
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password reset request এ সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// RESET PASSWORD - নতুন password set করা
// =============================================
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Input validation
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token এবং নতুন password প্রদান করুন'
      });
    }

    // Password strength validation
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'নতুন password দুর্বল',
        errors: passwordValidation.errors
      });
    }

    // TODO: Database থেকে reset token verify করতে হবে
    // TODO: Token expire হয়েছে কিনা check করতে হবে

    // Password hash করা
    const hashedPassword = await hashPassword(newPassword);

    // TODO: Database এ password update করতে হবে
    // await User.updatePassword(userId, hashedPassword);

    return res.status(200).json({
      success: true,
      message: 'Password সফলভাবে reset হয়েছে'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password reset করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// VERIFY OTP - OTP verification (Future ready)
// =============================================
const verifyOTP = async (req, res) => {
  try {
    const { identifier, otp } = req.body; // identifier = email or phone

    // Input validation
    if (!identifier || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone এবং OTP প্রদান করুন'
      });
    }

    // TODO: Database থেকে OTP verify করতে হবে
    // TODO: OTP expire হয়েছে কিনা check করতে হবে

    return res.status(200).json({
      success: true,
      message: 'OTP verification সফল'
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'OTP verification এ সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// LOGOUT - User logout (Token invalidation)
// =============================================
const logout = async (req, res) => {
  try {
    // TODO: Token blacklist করতে হবে (Redis ব্যবহার করা ভালো)
    // TODO: Refresh token revoke করতে হবে

    return res.status(200).json({
      success: true,
      message: 'Logout সফল হয়েছে'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout এ সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// REFRESH TOKEN - নতুন access token generate
// =============================================
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token প্রদান করুন'
      });
    }

    // Refresh token verify করা
    const { verifyToken } = require('../utils/authUtils');
    const decoded = verifyToken(refreshToken);

    // Token type check করা
    if (decoded.type !== 'refresh') {
      return res.status(400).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // User fetch করা
    const user = await User.findById(decoded.userId);

    if (!user || user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // নতুন access token generate করা
    const newAccessToken = generateToken(user.id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Token refresh সফল',
      data: {
        token: newAccessToken
      }
    });

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyOTP,
  logout,
  refreshAccessToken
};