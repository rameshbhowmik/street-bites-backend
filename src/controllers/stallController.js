/**
 * ═══════════════════════════════════════════════════════════════
 * STALL CONTROLLER - ENTERPRISE VERSION
 * ═══════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ QR Code upload (আলাদা folder)
 * ✅ Stall photo upload (আলাদা folder)
 * ✅ Auto-delete old images
 */

const { Stall } = require('../models');
const { uploadSingleImage, updateImage, deleteImage, uploadMultipleImages } = require('../utils/uploadUtils');

// ═══════════════════════════════════════════════════════════════
// CREATE STALL
// ═══════════════════════════════════════════════════════════════
const createStall = async (req, res) => {
  try {
    const {
      stall_name,
      stall_code,
      location,
      latitude,
      longitude,
      opening_time,
      closing_time,
      manager_id,
      status
    } = req.body;

    // Validation
    if (!stall_name || !stall_code || !location) {
      return res.status(400).json({
        success: false,
        message: 'Stall name, code এবং location প্রদান করুন'
      });
    }

    // Check if code already exists
    const codeExists = await Stall.checkCodeExists(stall_code);
    if (codeExists) {
      return res.status(409).json({
        success: false,
        message: 'এই stall code ইতিমধ্যে ব্যবহৃত হয়েছে'
      });
    }

    // Stall তৈরি করা
    const newStall = await Stall.create({
      stall_name,
      stall_code,
      location,
      latitude,
      longitude,
      opening_time,
      closing_time,
      manager_id,
      status: status || 'active',
      qr_code: null // QR code পরে upload করা যাবে
    });

    return res.status(201).json({
      success: true,
      message: 'Stall সফলভাবে তৈরি হয়েছে',
      data: newStall
    });

  } catch (error) {
    console.error('❌ Create stall error:', error);
    return res.status(500).json({
      success: false,
      message: 'Stall তৈরি করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// UPLOAD QR CODE (আলাদা folder এ সেভ হবে)
// ═══════════════════════════════════════════════════════════════
const uploadQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    // File check
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'কোন QR code image পাওয়া যায়নি'
      });
    }

    // Stall খুঁজে বের করা
    const stall = await Stall.findById(id);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: 'Stall পাওয়া যায়নি'
      });
    }

    // ✅ পুরাতন QR code থাকলে auto-delete করে নতুন upload করা
    // 🎯 'qr_code' type ব্যবহার করায় আলাদা folder এ সেভ হবে
    const uploadResult = await updateImage(
      stall.qr_code,        // পুরাতন QR code URL
      req.file.buffer,      // নতুন file buffer
      'qr_code',            // Upload type (আলাদা folder)
      id                    // Stall ID
    );

    // Database এ QR code URL update করা
    const updatedStall = await Stall.update(id, {
      qr_code: uploadResult.url
    });

    return res.status(200).json({
      success: true,
      message: 'QR code সফলভাবে upload হয়েছে',
      data: {
        stall: updatedStall,
        qr_code: {
          url: uploadResult.url,
          public_id: uploadResult.public_id
        }
      }
    });

  } catch (error) {
    console.error('❌ Upload QR code error:', error);
    return res.status(500).json({
      success: false,
      message: 'QR code upload করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// UPLOAD STALL PHOTO (আলাদা folder এ সেভ হবে)
// ═══════════════════════════════════════════════════════════════
const uploadStallPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'কোন photo পাওয়া যায়নি'
      });
    }

    const stall = await Stall.findById(id);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: 'Stall পাওয়া যায়নি'
      });
    }

    // ✅ Stall photo upload করা
    // 🎯 'stall' type ব্যবহার করায় আলাদা folder এ সেভ হবে
    const uploadResult = await uploadSingleImage(
      req.file.buffer,
      'stall',              // Upload type (আলাদা folder)
      id
    );

    return res.status(200).json({
      success: true,
      message: 'Stall photo সফলভাবে upload হয়েছে',
      data: {
        photo: {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
          variants: uploadResult.variants
        }
      }
    });

  } catch (error) {
    console.error('❌ Upload stall photo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Stall photo upload করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// UPLOAD HYGIENE PHOTOS (Multiple - আলাদা folder এ)
// ═══════════════════════════════════════════════════════════════
const uploadHygienePhotos = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'কোন hygiene photos পাওয়া যায়নি'
      });
    }

    const stall = await Stall.findById(id);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: 'Stall পাওয়া যায়নি'
      });
    }

    // ✅ Multiple hygiene photos upload করা
    // 🎯 'hygiene' type ব্যবহার করায় আলাদা folder এ সেভ হবে
    const fileBuffers = req.files.map(file => file.buffer);
    const uploadResults = await uploadMultipleImages(
      fileBuffers,
      'hygiene',            // Upload type (আলাদা folder)
      id
    );

    return res.status(200).json({
      success: true,
      message: `${uploadResults.length}টি hygiene photo সফলভাবে upload হয়েছে`,
      data: {
        photos: uploadResults.map(result => ({
          url: result.url,
          public_id: result.public_id
        }))
      }
    });

  } catch (error) {
    console.error('❌ Upload hygiene photos error:', error);
    return res.status(500).json({
      success: false,
      message: 'Hygiene photos upload করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// GET ALL STALLS
// ═══════════════════════════════════════════════════════════════
const getAllStalls = async (req, res) => {
  try {
    const { status, search, limit, offset } = req.query;

    const filters = {
      status,
      search,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    };

    const stalls = await Stall.findAll(filters);

    return res.status(200).json({
      success: true,
      message: 'Stalls list fetch সফল',
      data: stalls
    });

  } catch (error) {
    console.error('❌ Get all stalls error:', error);
    return res.status(500).json({
      success: false,
      message: 'Stalls list fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// GET STALL BY ID
// ═══════════════════════════════════════════════════════════════
const getStallById = async (req, res) => {
  try {
    const { id } = req.params;

    const stall = await Stall.findById(id);

    if (!stall) {
      return res.status(404).json({
        success: false,
        message: 'Stall পাওয়া যায়নি'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Stall details fetch সফল',
      data: stall
    });

  } catch (error) {
    console.error('❌ Get stall by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Stall details fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// UPDATE STALL
// ═══════════════════════════════════════════════════════════════
const updateStall = async (req, res) => {
  try {
    const { id } = req.params;

    const existingStall = await Stall.findById(id);
    if (!existingStall) {
      return res.status(404).json({
        success: false,
        message: 'Stall পাওয়া যায়নি'
      });
    }

    // Stall code change হলে duplicate check
    if (req.body.stall_code && req.body.stall_code !== existingStall.stall_code) {
      const codeExists = await Stall.checkCodeExists(req.body.stall_code, id);
      if (codeExists) {
        return res.status(409).json({
          success: false,
          message: 'এই stall code ইতিমধ্যে ব্যবহৃত হয়েছে'
        });
      }
    }

    const updatedStall = await Stall.update(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Stall সফলভাবে update হয়েছে',
      data: updatedStall
    });

  } catch (error) {
    console.error('❌ Update stall error:', error);
    return res.status(500).json({
      success: false,
      message: 'Stall update করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// DELETE STALL
// ═══════════════════════════════════════════════════════════════
const deleteStall = async (req, res) => {
  try {
    const { id } = req.params;

    const stall = await Stall.findById(id);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: 'Stall পাওয়া যায়নি'
      });
    }

    // QR code থাকলে delete করা
    if (stall.qr_code) {
      try {
        await deleteImage(stall.qr_code);
        console.log('✅ QR code deleted from Cloudinary');
      } catch (error) {
        console.warn('⚠️  Failed to delete QR code:', error.message);
      }
    }

    const deletedStall = await Stall.delete(id);

    return res.status(200).json({
      success: true,
      message: 'Stall সফলভাবে delete হয়েছে',
      data: deletedStall
    });

  } catch (error) {
    console.error('❌ Delete stall error:', error);
    return res.status(500).json({
      success: false,
      message: 'Stall delete করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// GET STALL STATISTICS
// ═══════════════════════════════════════════════════════════════
const getStallStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    const statistics = await Stall.getStatistics(id);

    return res.status(200).json({
      success: true,
      message: 'Stall statistics fetch সফল',
      data: statistics
    });

  } catch (error) {
    console.error('❌ Get stall statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Statistics fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

module.exports = {
  createStall,
  uploadQRCode,
  uploadStallPhoto,
  uploadHygienePhotos,
  getAllStalls,
  getStallById,
  updateStall,
  deleteStall,
  getStallStatistics
};