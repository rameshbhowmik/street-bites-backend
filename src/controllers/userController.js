// backend/src/controllers/userController.js - FIXED VERSION

const User = require('../models/User');
const Role = require('../models/Role');
const { body, validationResult } = require('express-validator');
const { validateIndianPhone, validateEmail } = require('../utils/validators');

// ============================================
// 1. GET ALL USERS (Owner/Manager Access)
// ============================================

const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // 🔥 FIXED: Role search with case-insensitive
    if (role) {
      const roleDoc = await Role.findByName(role);
      if (roleDoc) {
        query.role = roleDoc._id;
      }
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const users = await User.find(query)
      .populate('role', 'name displayName level')
      .populate('assignedStall', 'stallName stallCode')
      .select('-password -phoneOTP -emailOTP')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const totalUsers = await User.countDocuments(query);

    const stats = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'roles',
          localField: '_id',
          foreignField: '_id',
          as: 'roleInfo'
        }
      },
      { $unwind: '$roleInfo' },
      {
        $project: {
          roleName: '$roleInfo.name',
          count: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: {
        users,
        stats,
        pagination: {
          total: totalUsers,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalUsers / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'ইউজার লিস্ট আনতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 2. GET SINGLE USER BY ID
// ============================================

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔥 FIXED: Lowercase role comparison
    if (
      req.user.id !== id &&
      !['owner', 'manager'].includes(req.user.role.name.toLowerCase())
    ) {
      return res.status(403).json({
        success: false,
        message: 'আপনি শুধু নিজের তথ্য দেখতে পারবেন'
      });
    }

    const user = await User.findById(id)
      .populate('role', 'name displayName level permissions')
      .populate('assignedStall', 'stallName stallCode address')
      .select('-password -phoneOTP -emailOTP');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ইউজার পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User found',
      data: { user }
    });
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({
      success: false,
      message: 'ইউজার তথ্য আনতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 3. CREATE NEW USER
// ============================================

const createUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      roleName,
      assignedStall,
      address,
      emergencyContact
    } = req.body;

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error
      });
    }

    const phoneValidation = validateIndianPhone(phone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.error
      });
    }

    const existingEmail = await User.findByEmail(emailValidation.normalized);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট আছে'
      });
    }

    const existingPhone = await User.findByPhone(phoneValidation.formatted);
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একাউন্ট আছে'
      });
    }

    // 🔥 FIXED: Use findByName which handles case-insensitive
    const role = await Role.findByName(roleName || 'customer');
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.create({
      fullName,
      email: emailValidation.normalized,
      phone: phoneValidation.formatted,
      password,
      role: role._id,
      assignedStall,
      address,
      emergencyContact,
      phoneVerified: true,
      emailVerified: true,
      createdBy: {
        userId: req.user.id,
        userName: req.user.fullName,
        userRole: req.user.role.name
      }
    });

    await user.populate('role', 'name displayName level');
    if (assignedStall) {
      await user.populate('assignedStall', 'stallName stallCode');
    }

    res.status(201).json({
      success: true,
      message: 'ইউজার সফলভাবে তৈরি হয়েছে',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phoneFormatted,
          role: user.role,
          assignedStall: user.assignedStall
        }
      }
    });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({
      success: false,
      message: 'ইউজার তৈরি করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 4. UPDATE USER
// ============================================

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ইউজার পাওয়া যায়নি'
      });
    }

    const isSelf = req.user.id === id;
    // 🔥 FIXED: Lowercase role comparison
    const isAdmin = ['owner', 'manager'].includes(req.user.role.name.toLowerCase());

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'আপনার এই অনুমতি নেই'
      });
    }

    const selfUpdateFields = [
      'fullName',
      'address',
      'emergencyContact',
      'profilePicture'
    ];

    const adminUpdateFields = [
      'fullName',
      'email',
      'phone',
      'role',
      'assignedStall',
      'address',
      'emergencyContact',
      'isActive',
      'salary',
      'joiningDate',
      'designation',
      'profilePicture'
    ];

    const allowedFields = isSelf && !isAdmin ? selfUpdateFields : adminUpdateFields;
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (filteredUpdates.email) {
      const emailValidation = validateEmail(filteredUpdates.email);
      if (!emailValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: emailValidation.error
        });
      }
      filteredUpdates.email = emailValidation.normalized;

      const existingEmail = await User.findByEmail(filteredUpdates.email);
      if (existingEmail && existingEmail._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: 'এই ইমেইল ইতিমধ্যে ব্যবহৃত হচ্ছে'
        });
      }
    }

    if (filteredUpdates.phone) {
      const phoneValidation = validateIndianPhone(filteredUpdates.phone);
      if (!phoneValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: phoneValidation.error
        });
      }
      filteredUpdates.phone = phoneValidation.formatted;

      const existingPhone = await User.findByPhone(filteredUpdates.phone);
      if (existingPhone && existingPhone._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: 'এই মোবাইল নম্বর ইতিমধ্যে ব্যবহৃত হচ্ছে'
        });
      }
    }

    // 🔥 FIXED: Use findByName for case-insensitive role search
    if (filteredUpdates.role && isAdmin) {
      const roleDoc = await Role.findByName(filteredUpdates.role);
      if (!roleDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }
      filteredUpdates.role = roleDoc._id;
    }

    Object.assign(user, filteredUpdates);
    user.updatedBy = {
      userId: req.user.id,
      userName: req.user.fullName,
      userRole: req.user.role.name,
      updatedAt: new Date()
    };

    await user.save();

    await user.populate('role', 'name displayName level');
    if (user.assignedStall) {
      await user.populate('assignedStall', 'stallName stallCode');
    }

    res.status(200).json({
      success: true,
      message: 'ইউজার আপডেট সফল হয়েছে',
      data: { user }
    });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({
      success: false,
      message: 'ইউজার আপডেট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 5. DELETE USER (Soft Delete)
// ============================================

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ইউজার পাওয়া যায়নি'
      });
    }

    const userRole = await Role.findById(user.role);
    // 🔥 FIXED: Lowercase comparison
    if (userRole.name.toLowerCase() === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Owner একাউন্ট মুছে ফেলা যাবে না'
      });
    }

    user.isActive = false;
    user.deletedAt = new Date();
    user.deletedBy = {
      userId: req.user.id,
      userName: req.user.fullName,
      userRole: req.user.role.name
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'ইউজার সফলভাবে মুছে ফেলা হয়েছে'
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: 'ইউজার মুছতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 6. GET CURRENT USER PROFILE
// ============================================

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('role', 'name displayName level permissions')
      .populate('assignedStall', 'stallName stallCode address')
      .select('-password -phoneOTP -emailOTP');

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'প্রোফাইল আনতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 7. UPDATE OWN PROFILE
// ============================================

const updateMyProfile = async (req, res) => {
  try {
    const allowedUpdates = ['fullName', 'address', 'emergencyContact'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('role', 'name displayName level')
      .populate('assignedStall', 'stallName stallCode')
      .select('-password -phoneOTP -emailOTP');

    res.status(200).json({
      success: true,
      message: 'প্রোফাইল আপডেট সফল হয়েছে',
      data: { user }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 8. UPLOAD PROFILE IMAGE
// ============================================

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'কোন ছবি আপলোড হয়নি'
      });
    }

    const user = await User.findById(req.user.id);

    user.profilePicture = {
      url: req.file.path,
      publicId: req.file.filename
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'প্রোফাইল ছবি আপলোড সফল হয়েছে',
      data: {
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Upload Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'ছবি আপলোড করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 9. DELETE PROFILE IMAGE
// ============================================

const deleteProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ইউজার পাওয়া যায়নি'
      });
    }

    if (!user.profilePicture || !user.profilePicture.url) {
      return res.status(400).json({
        success: false,
        message: 'কোনো প্রোফাইল ছবি নেই'
      });
    }

    if (user.profilePicture.publicId) {
      try {
        const cloudinary = require('cloudinary').v2;
        await cloudinary.uploader.destroy(user.profilePicture.publicId);
        console.log('✅ Profile picture deleted from Cloudinary');
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary deletion error:', cloudinaryError);
      }
    }

    user.profilePicture = {
      url: '',
      publicId: ''
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'প্রোফাইল ছবি মুছে ফেলা হয়েছে',
      data: {
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Delete Profile Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'ছবি মুছতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 10. GET ALL EMPLOYEES (Manager Access)
// ============================================

const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, stallId, isActive = true } = req.query;

    // 🔥 FIXED: Use findByName (case-insensitive)
    const employeeRole = await Role.findByName('employee');
    const deliveryRole = await Role.findByName('delivery_person');

    const query = {
      role: { $in: [employeeRole._id, deliveryRole._id] },
      isActive: isActive === 'true'
    };

    if (stallId) {
      query.assignedStall = stallId;
    }

    const skip = (page - 1) * limit;

    const employees = await User.find(query)
      .populate('role', 'name displayName')
      .populate('assignedStall', 'stallName stallCode')
      .select('-password -phoneOTP -emailOTP')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Employees fetched successfully',
      data: {
        employees,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get Employees Error:', error);
    res.status(500).json({
      success: false,
      message: 'কর্মচারী লিস্ট আনতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 11. GET ALL INVESTORS (Owner Access)
// ============================================

const getAllInvestors = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive = true } = req.query;

    // 🔥 FIXED: Use findByName (case-insensitive)
    const investorRole = await Role.findByName('investor');
    const query = {
      role: investorRole._id,
      isActive: isActive === 'true'
    };

    const skip = (page - 1) * limit;

    const investors = await User.find(query)
      .populate('role', 'name displayName')
      .select('-password -phoneOTP -emailOTP')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Investors fetched successfully',
      data: {
        investors,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get Investors Error:', error);
    res.status(500).json({
      success: false,
      message: 'বিনিয়োগকারী লিস্ট আনতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 12. ASSIGN STALL TO EMPLOYEE
// ============================================

const assignStallToEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { stallId } = req.body;

    if (!stallId) {
      return res.status(400).json({
        success: false,
        message: 'Stall ID প্রয়োজন'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'কর্মচারী পাওয়া যায়নি'
      });
    }

    const userRole = await Role.findById(user.role);
    // 🔥 FIXED: Lowercase comparison
    if (!['employee', 'delivery_person'].includes(userRole.name.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'এই ইউজার কর্মচারী নয়'
      });
    }

    user.assignedStall = stallId;
    await user.save();

    await user.populate('assignedStall', 'stallName stallCode address');

    res.status(200).json({
      success: true,
      message: 'স্টল সফলভাবে অ্যাসাইন করা হয়েছে',
      data: { user }
    });
  } catch (error) {
    console.error('Assign Stall Error:', error);
    res.status(500).json({
      success: false,
      message: 'স্টল অ্যাসাইন করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 13. BLOCK/UNBLOCK USER
// ============================================

const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ইউজার পাওয়া যায়নি'
      });
    }

    const userRole = await Role.findById(user.role);
    // 🔥 FIXED: Lowercase comparison
    if (userRole.name.toLowerCase() === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Owner কে ব্লক করা যাবে না'
      });
    }

    user.isBlocked = !user.isBlocked;
    if (user.isBlocked) {
      user.blockedAt = new Date();
      user.blockedBy = {
        userId: req.user.id,
        userName: req.user.fullName,
        userRole: req.user.role.name
      };
      user.blockedReason = reason || 'No reason provided';
    } else {
      user.blockedAt = null;
      user.blockedBy = null;
      user.blockedReason = null;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBlocked ? 'ইউজার ব্লক করা হয়েছে' : 'ইউজার আনব্লক করা হয়েছে',
      data: { isBlocked: user.isBlocked }
    });
  } catch (error) {
    console.error('Toggle Block Error:', error);
    res.status(500).json({
      success: false,
      message: 'ব্লক/আনব্লক করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// 14. GET USER STATISTICS
// ============================================

const getUserStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    const roleStats = await User.aggregate([
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'roleInfo'
        }
      },
      { $unwind: '$roleInfo' },
      {
        $group: {
          _id: '$roleInfo.name',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          role: '$_id',
          total: '$count',
          active: 1
        }
      }
    ]);

    const recentlyJoined = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('role', 'name displayName')
      .select('fullName email phone createdAt');

    res.status(200).json({
      success: true,
      message: 'Statistics fetched successfully',
      data: {
        overview: {
          total: totalUsers,
          active: activeUsers,
          blocked: blockedUsers,
          inactive: totalUsers - activeUsers
        },
        byRole: roleStats,
        recentlyJoined
      }
    });
  } catch (error) {
    console.error('Get Statistics Error:', error);
    res.status(500).json({
      success: false,
      message: 'পরিসংখ্যান আনতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ============================================
// MODULE EXPORTS
// ============================================

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
  deleteProfileImage,
  getAllEmployees,
  getAllInvestors,
  assignStallToEmployee,
  toggleBlockUser,
  getUserStatistics
};