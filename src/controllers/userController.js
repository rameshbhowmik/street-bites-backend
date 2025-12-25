/**
 * ═══════════════════════════════════════════════════════════════
 * USER CONTROLLER - ENTERPRISE VERSION
 * ═══════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ Profile picture upload with auto-delete old image
 * ✅ Automatic compression
 * ✅ Error handling
 */

const { validationResult } = require('express-validator');
const User = require('../models/User');
const { uploadSingleImage, updateImage, deleteImage } = require('../utils/uploadUtils');

// ═══════════════════════════════════════════════════════════════
// GET PROFILE
// ═══════════════════════════════════════════════════════════════
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User পাওয়া যায়নি'
      });
    }

    // Password বাদ দিয়ে response
    const { password, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Profile fetch সফল',
      data: userWithoutPassword
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

// ═══════════════════════════════════════════════════════════════
// UPDATE PROFILE
// ═══════════════════════════════════════════════════════════════
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { full_name, phone, email } = req.body;

    if (!full_name && !phone && !email) {
      return res.status(400).json({
        success: false,
        message: 'Update করার জন্য কমপক্ষে একটি field প্রদান করুন'
      });
    }

    // Email বা phone duplicate check
    if (email || phone) {
      const checkEmail = email || req.user.email;
      const checkPhone = phone || req.user.phone;
      
      const existingUser = await User.checkExists(checkEmail, checkPhone, userId);

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: existingUser.email === checkEmail
            ? 'এই email ইতিমধ্যে ব্যবহৃত হয়েছে'
            : 'এই phone number ইতিমধ্যে ব্যবহৃত হয়েছে'
        });
      }
    }

    const updatedUser = await User.update(userId, req.body);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User পাওয়া যায়নি'
      });
    }

    const { password, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      success: true,
      message: 'Profile সফলভাবে update হয়েছে',
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Profile update করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// UPLOAD PROFILE PICTURE (WITH AUTO-DELETE OLD IMAGE)
// ═══════════════════════════════════════════════════════════════
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    // File check
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'কোন image file পাওয়া যায়নি'
      });
    }

    // User খুঁজে বের করা
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User পাওয়া যায়নি'
      });
    }

    // ✅ পুরাতন image থাকলে auto-delete করে নতুন upload করা
    const uploadResult = await updateImage(
      user.profile_picture,      // পুরাতন image URL
      req.file.buffer,            // নতুন file buffer
      'profile',                  // Upload type
      userId                      // Entity ID
    );

    // Database এ নতুন URL update করা
    const updatedUser = await User.update(userId, {
      profile_picture: uploadResult.url
    });

    const { password, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      success: true,
      message: 'Profile picture সফলভাবে upload হয়েছে',
      data: {
        user: userWithoutPassword,
        image: {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
          variants: uploadResult.variants
        }
      }
    });

  } catch (error) {
    console.error('❌ Upload profile picture error:', error);
    return res.status(500).json({
      success: false,
      message: 'Profile picture upload করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// DELETE PROFILE PICTURE
// ═══════════════════════════════════════════════════════════════
const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User পাওয়া যায়নি'
      });
    }

    if (!user.profile_picture) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture নেই'
      });
    }

    // Cloudinary থেকে delete
    await deleteImage(user.profile_picture);

    // Database থেকে URL remove
    await User.update(userId, {
      profile_picture: null
    });

    return res.status(200).json({
      success: true,
      message: 'Profile picture সফলভাবে delete হয়েছে'
    });

  } catch (error) {
    console.error('❌ Delete profile picture error:', error);
    return res.status(500).json({
      success: false,
      message: 'Profile picture delete করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// GET ALL USERS
// ═══════════════════════════════════════════════════════════════
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    const filters = {
      role,
      status,
      search,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const users = await User.findAll(filters);
    const totalUsers = await User.count({ role, status });

    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return res.status(200).json({
      success: true,
      message: 'Users list fetch সফল',
      data: {
        users: usersWithoutPasswords,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / parseInt(limit)),
          totalUsers,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Users list fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// GET USER BY ID
// ═══════════════════════════════════════════════════════════════
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User পাওয়া যায়নি'
      });
    }

    const { password, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'User details fetch সফল',
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('❌ Get user by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'User details fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// UPDATE USER STATUS
// ═══════════════════════════════════════════════════════════════
const updateUserStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'suspended', 'deleted'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status ${validStatuses.join(', ')} এর মধ্যে হতে হবে`
      });
    }

    const updatedUser = await User.update(userId, { status });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User পাওয়া যায়নি'
      });
    }

    const { password, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      success: true,
      message: 'User status সফলভাবে update হয়েছে',
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('❌ Update user status error:', error);
    return res.status(500).json({
      success: false,
      message: 'User status update করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// GET USER STATISTICS
// ═══════════════════════════════════════════════════════════════
const getUserStatistics = async (req, res) => {
  try {
    const statistics = await User.getStatistics();

    return res.status(200).json({
      success: true,
      message: 'User statistics fetch সফল',
      data: statistics
    });

  } catch (error) {
    console.error('❌ Get user statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Statistics fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getUserStatistics
};