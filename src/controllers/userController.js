// User Controller
// User সংক্রান্ত সব operations

const { validationResult } = require('express-validator');
const User = require('../models/User');
const { uploadSingleImage, deleteImage } = require('../utils/uploadUtils');

// =============================================
// GET PROFILE - নিজের profile দেখা
// =============================================
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

    // Password বাদ দিয়ে response পাঠানো
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

// =============================================
// UPDATE PROFILE - Profile update করা
// =============================================
const updateProfile = async (req, res) => {
  try {
    // Validation check
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

    // Input validation
    if (!full_name && !phone && !email) {
      return res.status(400).json({
        success: false,
        message: 'Update করার জন্য কমপক্ষে একটি field প্রদান করুন'
      });
    }

    // Email বা phone change হলে duplicate check করা
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

    // Profile update করা
    const updatedUser = await User.update(userId, req.body);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User পাওয়া যায়নি'
      });
    }

    // Password বাদ দিয়ে response পাঠানো
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

// =============================================
// UPLOAD PROFILE PICTURE - Profile picture upload
// =============================================
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    // File check করা
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'কোন ছবি upload করা হয়নি'
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

    // পুরাতন profile picture থাকলে delete করা
    if (user.profile_picture) {
      try {
        const urlParts = user.profile_picture.split('/');
        const fileName = urlParts[urlParts.length - 1].split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        await deleteImage(`${folder}/${fileName}`);
      } catch (error) {
        console.error('Old profile picture delete error:', error);
        // পুরাতন picture delete এ error হলেও continue করা
      }
    }

    // Cloudinary এ নতুন image upload করা
    const uploadResult = await uploadSingleImage(
      req.file.buffer,
      'profile',
      {
        public_id: `profile_${userId}_${Date.now()}`
      }
    );

    // Database এ image URL save করা
    const updatedUser = await User.update(userId, {
      profile_picture: uploadResult.url
    });

    // Password বাদ দিয়ে response পাঠানো
    const { password, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      success: true,
      message: 'Profile picture সফলভাবে upload হয়েছে',
      data: {
        profile_picture: uploadResult.url,
        user: userWithoutPassword
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

// =============================================
// DELETE PROFILE PICTURE - Profile picture delete
// =============================================
const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    // User খুঁজে বের করা
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User পাওয়া যায়নি'
      });
    }

    // Profile picture check করা
    if (!user.profile_picture) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture নেই'
      });
    }

    // Cloudinary থেকে delete করা
    try {
      const urlParts = user.profile_picture.split('/');
      const fileName = urlParts[urlParts.length - 1].split('.')[0];
      const folder = urlParts[urlParts.length - 2];
      await deleteImage(`${folder}/${fileName}`);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
    }

    // Database থেকে URL remove করা
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

// =============================================
// GET ALL USERS - সব users list (Admin only)
// =============================================
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

    // সব users থেকে password বাদ দেওয়া
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

// =============================================
// GET USER BY ID - নির্দিষ্ট user দেখা (Admin only)
// =============================================
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

    // Password বাদ দিয়ে response পাঠানো
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

// =============================================
// UPDATE USER STATUS - User status change (Admin only)
// =============================================
const updateUserStatus = async (req, res) => {
  try {
    // Validation check
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

    // Validation
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

    // Password বাদ দিয়ে response পাঠানো
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

// =============================================
// GET USER STATISTICS - User statistics (Admin only)
// =============================================
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