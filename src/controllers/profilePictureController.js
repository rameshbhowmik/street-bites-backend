/**
 * Profile Picture Upload Controller
 * User এর profile picture upload করার controller
 */

const {
  uploadSingleImage,
  deleteImage,
  generateResponsiveUrls
} = require('../utils/uploadUtils');
const User = require('../models/User');

/**
 * Profile picture upload করা
 * POST /api/users/upload-profile-picture
 */
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id; // JWT থেকে user ID
    
    // File check করা
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
    
    // পুরাতন profile picture থাকলে delete করা
    if (user.profile_picture) {
      try {
        // URL থেকে public_id extract করা
        const publicId = user.profile_picture.split('/').slice(-2).join('/').split('.')[0];
        await deleteImage(`street-bites/profiles/${publicId}`);
      } catch (error) {
        console.error('Old profile picture delete error:', error);
        // পুরাতন picture delete এ error হলেও continue করা
      }
    }
    
    // নতুন profile picture upload করা
    const uploadResult = await uploadSingleImage(
      req.file.buffer,
      'profile',
      {
        public_id: `profile_${userId}_${Date.now()}` // Unique public ID
      }
    );
    
    // Database এ profile picture URL update করা
    const updatedUser = await User.update(userId, {
      profile_picture: uploadResult.url
    });
    
    // Responsive URLs তৈরি করা
    const responsiveUrls = generateResponsiveUrls(uploadResult.public_id);
    
    res.status(200).json({
      success: true,
      message: 'Profile picture সফলভাবে upload হয়েছে',
      data: {
        profile_picture: uploadResult.url,
        public_id: uploadResult.public_id,
        responsive_urls: responsiveUrls
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile picture upload করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

/**
 * Profile picture delete করা
 * DELETE /api/users/delete-profile-picture
 */
const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id; // JWT থেকে user ID
    
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
    
    // URL থেকে public_id extract করা
    const urlParts = user.profile_picture.split('/');
    const publicId = urlParts.slice(-2).join('/').split('.')[0];
    
    // Cloudinary থেকে delete করা
    await deleteImage(`street-bites/profiles/${publicId}`);
    
    // Database থেকে URL remove করা
    await User.update(userId, {
      profile_picture: null
    });
    
    res.status(200).json({
      success: true,
      message: 'Profile picture সফলভাবে delete হয়েছে'
    });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile picture delete করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

module.exports = {
  uploadProfilePicture,
  deleteProfilePicture
};