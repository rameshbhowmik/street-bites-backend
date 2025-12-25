// Stall Controller
// Stall সংক্রান্ত সব operations

const { Stall } = require('../models');

// =============================================
// GET ALL STALLS - সব stalls list
// =============================================
const getAllStalls = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const filters = {
      status,
      search,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const stalls = await Stall.findAll(filters);

    return res.status(200).json({
      success: true,
      message: 'Stalls list fetch সফল',
      data: {
        stalls,
        pagination: {
          currentPage: parseInt(page),
          limit: parseInt(limit),
          hasMore: stalls.length === parseInt(limit)
        }
      }
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

// =============================================
// GET STALL BY ID - একটি stall details
// =============================================
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

// =============================================
// CREATE STALL - নতুন stall তৈরি (Owner only)
// =============================================
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
      manager_id
    } = req.body;

    // Input validation
    if (!stall_name || !stall_code || !location) {
      return res.status(400).json({
        success: false,
        message: 'Stall name, code এবং location প্রদান করুন'
      });
    }

    // Stall code duplicate check
    const existingStall = await Stall.findByCode(stall_code);
    if (existingStall) {
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
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      opening_time: opening_time || '09:00:00',
      closing_time: closing_time || '22:00:00',
      manager_id: manager_id || null,
      status: 'active'
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

// =============================================
// UPDATE STALL - Stall update করা (Owner only)
// =============================================
const updateStall = async (req, res) => {
  try {
    const { id } = req.params;

    // Stall exist করে কিনা check করা
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

    // Stall update করা
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

// =============================================
// DELETE STALL - Stall মুছে ফেলা (Owner only)
// =============================================
const deleteStall = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedStall = await Stall.delete(id);

    if (!deletedStall) {
      return res.status(404).json({
        success: false,
        message: 'Stall পাওয়া যায়নি'
      });
    }

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

// =============================================
// GET ACTIVE STALLS - শুধুমাত্র active stalls
// =============================================
const getActiveStalls = async (req, res) => {
  try {
    const stalls = await Stall.getActiveStalls();

    return res.status(200).json({
      success: true,
      message: 'Active stalls fetch সফল',
      data: stalls
    });

  } catch (error) {
    console.error('❌ Get active stalls error:', error);
    return res.status(500).json({
      success: false,
      message: 'Active stalls fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET STALL WITH EMPLOYEES - Employee সহ stall info
// =============================================
const getStallWithEmployees = async (req, res) => {
  try {
    const { id } = req.params;

    const stall = await Stall.getStallWithEmployees(id);

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
    console.error('❌ Get stall with employees error:', error);
    return res.status(500).json({
      success: false,
      message: 'Stall details fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET STALL INVENTORY - Stall এর inventory
// =============================================
const getStallInventory = async (req, res) => {
  try {
    const { id } = req.params;

    // Stall exist করে কিনা check করা
    const stall = await Stall.findById(id);
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: 'Stall পাওয়া যায়নি'
      });
    }

    // Inventory query করার জন্য function call করতে হবে
    // এখানে আপনার inventory model এর function ব্যবহার করুন
    const { query } = require('../config/database');
    
    const inventoryResult = await query(`
      SELECT 
        ist.id,
        p.product_name,
        p.product_name_bengali,
        p.category,
        ist.quantity,
        ist.batch_number,
        ist.received_date,
        p.base_price
      FROM inventory_stall ist
      JOIN products p ON ist.product_id = p.id
      WHERE ist.stall_id = $1
      ORDER BY p.product_name
    `, [id]);

    return res.status(200).json({
      success: true,
      message: 'Stall inventory fetch সফল',
      data: {
        stall: {
          id: stall.id,
          stall_name: stall.stall_name,
          stall_code: stall.stall_code
        },
        inventory: inventoryResult.rows
      }
    });

  } catch (error) {
    console.error('❌ Get stall inventory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Stall inventory fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// FIND NEARBY STALLS - নিকটবর্তী stalls (GPS based)
// =============================================
const findNearbyStalls = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    // Validation
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude এবং longitude প্রদান করুন'
      });
    }

    const stalls = await Stall.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius)
    );

    return res.status(200).json({
      success: true,
      message: 'Nearby stalls fetch সফল',
      data: {
        location: { latitude, longitude },
        radius_km: radius,
        count: stalls.length,
        stalls
      }
    });

  } catch (error) {
    console.error('❌ Find nearby stalls error:', error);
    return res.status(500).json({
      success: false,
      message: 'Nearby stalls fetch করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

// =============================================
// GET STALL STATISTICS - Stall এর statistics
// =============================================
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

// =============================================
// UPDATE STALL STATUS - Status update করা (Owner only)
// =============================================
const updateStallStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validation
    const validStatuses = ['active', 'closed', 'maintenance', 'temporary_closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status ${validStatuses.join(', ')} এর মধ্যে হতে হবে`
      });
    }

    const updatedStall = await Stall.updateStatus(id, status);

    if (!updatedStall) {
      return res.status(404).json({
        success: false,
        message: 'Stall পাওয়া যায়নি'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Stall status সফলভাবে update হয়েছে',
      data: updatedStall
    });

  } catch (error) {
    console.error('❌ Update stall status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Stall status update করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
};

module.exports = {
  getAllStalls,
  getStallById,
  createStall,
  updateStall,
  deleteStall,
  getActiveStalls,
  getStallWithEmployees,
  getStallInventory,
  findNearbyStalls,
  getStallStatistics,
  updateStallStatus
};