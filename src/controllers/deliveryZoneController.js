// backend/src/controllers/deliveryZoneController.js
const DeliveryZone = require('../models/DeliveryZone');
const User = require('../models/User');

/**
 * Delivery Zone Controller
 * ডেলিভারি জোন কন্ট্রোলার
 * 
 * এই controller এ আছে:
 * - ডেলিভারি জোন তৈরি
 * - জোন ম্যানেজমেন্ট
 * - ডেলিভারি পার্সন অ্যাসাইনমেন্ট
 * - ডেলিভারি চার্জ ক্যালকুলেশন
 */

// @desc    নতুন ডেলিভারি জোন তৈরি করুন
// @route   POST /api/delivery-zones
// @access  Private (Manager, Owner)
exports.createDeliveryZone = async (req, res) => {
  try {
    const {
      zoneName,
      zoneCode,
      geoPolygon,
      includedLocalities,
      deliveryCharge,
      minimumOrderAmount,
      deliveryDistance,
      estimatedDeliveryTime
    } = req.body;

    // জোন কোড unique কিনা চেক করুন
    const existingZone = await DeliveryZone.findOne({ zoneCode });
    if (existingZone) {
      return res.status(400).json({
        success: false,
        message: 'এই জোন কোড ইতিমধ্যে ব্যবহার করা হয়েছে'
      });
    }

    // নতুন জোন তৈরি করুন
    const zone = await DeliveryZone.create({
      zoneName,
      zoneCode,
      description: req.body.description,
      geoPolygon,
      includedLocalities,
      deliveryCharge,
      minimumOrderAmount,
      deliveryDistance,
      estimatedDeliveryTime,
      managedBy: {
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role
      }
    });

    res.status(201).json({
      success: true,
      message: 'ডেলিভারি জোন সফলভাবে তৈরি হয়েছে',
      data: zone
    });

  } catch (error) {
    console.error('ডেলিভারি জোন তৈরি করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'ডেলিভারি জোন তৈরি করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    সব ডেলিভারি জোন দেখুন
// @route   GET /api/delivery-zones
// @access  Public
exports.getAllDeliveryZones = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Query বিল্ড করুন
    const query = { isActive: true };
    if (status) query.operationalStatus = status;

    // Pagination
    const skip = (page - 1) * limit;

    const [zones, total] = await Promise.all([
      DeliveryZone.find(query)
        .select('-geoPolygon') // Polygon data বাদ দিন (heavy data)
        .sort({ zoneName: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DeliveryZone.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: zones.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: zones
    });

  } catch (error) {
    console.error('ডেলিভারি জোন পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'ডেলিভারি জোন পেতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    নির্দিষ্ট ডেলিভারি জোন দেখুন
// @route   GET /api/delivery-zones/:id
// @access  Public
exports.getDeliveryZoneById = async (req, res) => {
  try {
    const zone = await DeliveryZone.findById(req.params.id)
      .populate('assignedDeliveryPersons.personId', 'name email mobileNumber')
      .populate('linkedStalls.stallId', 'stallName stallCode address')
      .populate('managedBy.userId', 'name email');

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'ডেলিভারি জোন খুঁজে পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      data: zone
    });

  } catch (error) {
    console.error('ডেলিভারি জোন পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'ডেলিভারি জোন পেতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    ডেলিভারি জোন আপডেট করুন
// @route   PUT /api/delivery-zones/:id
// @access  Private (Manager, Owner)
exports.updateDeliveryZone = async (req, res) => {
  try {
    let zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'ডেলিভারি জোন খুঁজে পাওয়া যায়নি'
      });
    }

    // আপডেট করুন
    zone = await DeliveryZone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.status(200).json({
      success: true,
      message: 'ডেলিভারি জোন সফলভাবে আপডেট হয়েছে',
      data: zone
    });

  } catch (error) {
    console.error('ডেলিভারি জোন আপডেট করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'ডেলিভারি জোন আপডেট করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    পিনকোড দিয়ে জোন খুঁজুন
// @route   GET /api/delivery-zones/pincode/:pincode
// @access  Public
exports.getZoneByPinCode = async (req, res) => {
  try {
    const zone = await DeliveryZone.findByPinCode(req.params.pincode);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'এই পিনকোডের জন্য ডেলিভারি জোন খুঁজে পাওয়া যায়নি'
      });
    }

    res.status(200).json({
      success: true,
      data: zone
    });

  } catch (error) {
    console.error('পিনকোড দিয়ে জোন খুঁজতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'পিনকোড দিয়ে জোন খুঁজতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    জিও-লোকেশন দিয়ে জোন খুঁজুন
// @route   GET /api/delivery-zones/location
// @access  Public
exports.getZoneByLocation = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude এবং Latitude প্রয়োজন'
      });
    }

    const zones = await DeliveryZone.findByLocation(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(maxDistance)
    );

    res.status(200).json({
      success: true,
      count: zones.length,
      data: zones
    });

  } catch (error) {
    console.error('লোকেশন দিয়ে জোন খুঁজতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'লোকেশন দিয়ে জোন খুঁজতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    অ্যাক্টিভ জোন সব দেখুন
// @route   GET /api/delivery-zones/active
// @access  Public
exports.getActiveZones = async (req, res) => {
  try {
    const zones = await DeliveryZone.findActiveZones();

    res.status(200).json({
      success: true,
      count: zones.length,
      data: zones
    });

  } catch (error) {
    console.error('অ্যাক্টিভ জোন পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'অ্যাক্টিভ জোন পেতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    টপ পারফর্মিং জোন দেখুন
// @route   GET /api/delivery-zones/top-performing
// @access  Private
exports.getTopPerformingZones = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const zones = await DeliveryZone.findTopPerformingZones(parseInt(limit));

    res.status(200).json({
      success: true,
      count: zones.length,
      data: zones
    });

  } catch (error) {
    console.error('টপ পারফর্মিং জোন পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'টপ পারফর্মিং জোন পেতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    লো পারফর্মিং জোন দেখুন
// @route   GET /api/delivery-zones/low-performing
// @access  Private (Manager, Owner)
exports.getLowPerformingZones = async (req, res) => {
  try {
    const { threshold = 60, limit = 10 } = req.query;

    const zones = await DeliveryZone.findLowPerformingZones(
      parseFloat(threshold),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      count: zones.length,
      data: zones
    });

  } catch (error) {
    console.error('লো পারফর্মিং জোন পেতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'লো পারফর্মিং জোন পেতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    ডেলিভারি পার্সন অ্যাসাইন করুন
// @route   POST /api/delivery-zones/:id/assign-person
// @access  Private (Manager, Owner)
exports.assignDeliveryPerson = async (req, res) => {
  try {
    const { personId, vehicleType, vehicleNumber } = req.body;

    // ডেলিভারি পার্সন exist করে কিনা চেক করুন
    const person = await User.findOne({ 
      _id: personId, 
      role: 'delivery-person' 
    });

    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'ডেলিভারি পার্সন খুঁজে পাওয়া যায়নি'
      });
    }

    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'ডেলিভারি জোন খুঁজে পাওয়া যায়নি'
      });
    }

    await zone.assignDeliveryPerson({
      personId,
      personName: person.name,
      contactNumber: person.mobileNumber,
      vehicleType,
      vehicleNumber
    });

    res.status(200).json({
      success: true,
      message: 'ডেলিভারি পার্সন সফলভাবে অ্যাসাইন হয়েছে',
      data: zone
    });

  } catch (error) {
    console.error('ডেলিভারি পার্সন অ্যাসাইন করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'ডেলিভারি পার্সন অ্যাসাইন করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    ডেলিভারি পার্সন রিমুভ করুন
// @route   DELETE /api/delivery-zones/:id/remove-person/:personId
// @access  Private (Manager, Owner)
exports.removeDeliveryPerson = async (req, res) => {
  try {
    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'ডেলিভারি জোন খুঁজে পাওয়া যায়নি'
      });
    }

    await zone.removeDeliveryPerson(req.params.personId);

    res.status(200).json({
      success: true,
      message: 'ডেলিভারি পার্সন সফলভাবে রিমুভ হয়েছে',
      data: zone
    });

  } catch (error) {
    console.error('ডেলিভারি পার্সন রিমুভ করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'ডেলিভারি পার্সন রিমুভ করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    লোকালিটি যোগ করুন
// @route   POST /api/delivery-zones/:id/add-locality
// @access  Private (Manager, Owner)
exports.addLocality = async (req, res) => {
  try {
    const localityData = req.body;

    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'ডেলিভারি জোন খুঁজে পাওয়া যায়নি'
      });
    }

    await zone.addLocality(localityData);

    res.status(200).json({
      success: true,
      message: 'লোকালিটি সফলভাবে যোগ হয়েছে',
      data: zone
    });

  } catch (error) {
    console.error('লোকালিটি যোগ করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'লোকালিটি যোগ করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    ডেলিভারি চার্জ ক্যালকুলেট করুন
// @route   POST /api/delivery-zones/:id/calculate-charge
// @access  Public
exports.calculateDeliveryCharge = async (req, res) => {
  try {
    const { orderAmount, distance = 0 } = req.body;

    if (!orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Order amount প্রয়োজন'
      });
    }

    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'ডেলিভারি জোন খুঁজে পাওয়া যায়নি'
      });
    }

    const charge = zone.calculateDeliveryCharge(
      parseFloat(orderAmount),
      parseFloat(distance)
    );

    const deliveryTime = zone.estimateDeliveryTime();
    const isPeakHour = zone.isPeakHour();

    res.status(200).json({
      success: true,
      data: {
        zoneName: zone.zoneName,
        deliveryCharge: charge,
        estimatedTime: deliveryTime,
        isPeakHour,
        minimumOrderAmount: zone.minimumOrderAmount,
        freeDeliveryAbove: zone.deliveryCharge.freeDeliveryAbove
      }
    });

  } catch (error) {
    console.error('ডেলিভারি চার্জ ক্যালকুলেট করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'ডেলিভারি চার্জ ক্যালকুলেট করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    অর্ডার স্ট্যাট আপডেট করুন
// @route   PUT /api/delivery-zones/:id/update-order-stats
// @access  Private
exports.updateOrderStats = async (req, res) => {
  try {
    const { isSuccess, deliveryTime } = req.body;

    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'ডেলিভারি জোন খুঁজে পাওয়া যায়নি'
      });
    }

    await zone.updateOrderStats(isSuccess, deliveryTime);

    res.status(200).json({
      success: true,
      message: 'অর্ডার স্ট্যাট সফলভাবে আপডেট হয়েছে',
      data: zone
    });

  } catch (error) {
    console.error('অর্ডার স্ট্যাট আপডেট করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'অর্ডার স্ট্যাট আপডেট করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    নোটিফিকেশন যোগ করুন
// @route   POST /api/delivery-zones/:id/add-notification
// @access  Private (Manager, Owner)
exports.addNotification = async (req, res) => {
  try {
    const notificationData = req.body;

    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'ডেলিভারি জোন খুঁজে পাওয়া যায়নি'
      });
    }

    await zone.addNotification(notificationData);

    res.status(200).json({
      success: true,
      message: 'নোটিফিকেশন সফলভাবে যোগ হয়েছে',
      data: zone
    });

  } catch (error) {
    console.error('নোটিফিকেশন যোগ করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'নোটিফিকেশন যোগ করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    জোন স্ট্যাটাস পরিবর্তন করুন
// @route   PUT /api/delivery-zones/:id/toggle-status
// @access  Private (Manager, Owner)
exports.toggleZoneStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'ডেলিভারি জোন খুঁজে পাওয়া যায়নি'
      });
    }

    await zone.toggleStatus(status);

    res.status(200).json({
      success: true,
      message: 'জোন স্ট্যাটাস সফলভাবে পরিবর্তন হয়েছে',
      data: zone
    });

  } catch (error) {
    console.error('জোন স্ট্যাটাস পরিবর্তন করতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'জোন স্ট্যাটাস পরিবর্তন করতে ব্যর্থ',
      error: error.message
    });
  }
};

// @desc    ডেলিভারি জোন মুছুন
// @route   DELETE /api/delivery-zones/:id
// @access  Private (Owner)
exports.deleteDeliveryZone = async (req, res) => {
  try {
    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'ডেলিভারি জোন খুঁজে পাওয়া যায়নি'
      });
    }

    // Soft delete
    zone.isActive = false;
    await zone.save();

    res.status(200).json({
      success: true,
      message: 'ডেলিভারি জোন সফলভাবে মুছে ফেলা হয়েছে'
    });

  } catch (error) {
    console.error('ডেলিভারি জোন মুছতে ত্রুটি:', error);
    res.status(500).json({
      success: false,
      message: 'ডেলিভারি জোন মুছতে ব্যর্থ',
      error: error.message
    });
  }
};