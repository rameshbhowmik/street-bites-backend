// backend/src/models/DeliveryZone.js
const mongoose = require('mongoose');

/**
 * Delivery Zone Schema
 * ডেলিভারি জোন স্কিমা
 * 
 * Purpose: বিভিন্ন এলাকার জন্য ডেলিভারি জোন ম্যানেজমেন্ট
 * Features:
 * - জোন-ওয়াইজ ডেলিভারি চার্জ
 * - মিনিমাম অর্ডার অ্যামাউন্ট
 * - ডেলিভারি টাইম এস্টিমেশন
 * - ডেলিভারি পার্সন অ্যাসাইনমেন্ট
 * - পিক আওয়ার ম্যানেজমেন্ট
 * - জিও-লোকেশন সাপোর্ট
 */

const deliveryZoneSchema = new mongoose.Schema({
  // ============ জোন বেসিক তথ্য ============
  zoneName: {
    type: String,
    required: [true, 'ডেলিভারি জোনের নাম প্রয়োজন'],
    trim: true,
    maxlength: [100, 'জোনের নাম সর্বোচ্চ ১০০ অক্ষর হতে পারে']
  },

  zoneCode: {
    type: String,
    required: [true, 'জোন কোড প্রয়োজন'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^ZONE-[A-Z0-9]{4,8}$/, 'জোন কোড ফরম্যাট: ZONE-XXXX']
  },

  description: {
    type: String,
    maxlength: [500, 'বর্ণনা সর্বোচ্চ ৫০০ অক্ষর হতে পারে']
  },

  // ============ জিও-লোকেশন ============
  // Polygon দিয়ে এলাকা ডিফাইন করা (GeoJSON format)
  geoPolygon: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of arrays [lng, lat]
      required: [true, 'জোনের coordinates প্রয়োজন']
    }
  },

  // জোনের সেন্টার পয়েন্ট (optional, ক্যালকুলেটেড)
  centerPoint: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere' // জিও-স্পেশিয়াল ইনডেক্স
    }
  },

  // ============ কভারেজ এরিয়া ============
  includedLocalities: [{
    localityName: {
      type: String,
      required: [true, 'লোকালিটির নাম প্রয়োজন'],
      trim: true
    },
    area: String,
    pinCode: {
      type: String,
      validate: {
        validator: function(v) {
          // Indian PIN code: 6 digits
          return /^\d{6}$/.test(v);
        },
        message: 'সঠিক ৬ ডিজিটের পিনকোড দিন'
      }
    },
    // এই লোকালিটির coordinates (optional)
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number] // [longitude, latitude]
    }
  }],

  excludedLocalities: [{
    localityName: String,
    reason: {
      type: String,
      maxlength: 200
    }
  }],

  // ============ ডেলিভারি চার্জ এবং সেটিংস ============
  deliveryCharge: {
    baseCharge: {
      type: Number,
      required: [true, 'বেস ডেলিভারি চার্জ প্রয়োজন'],
      min: [0, 'ডেলিভারি চার্জ ঋণাত্মক হতে পারে না'],
      default: 0
    },

    // দূরত্ব-ভিত্তিক চার্জ
    perKmCharge: {
      type: Number,
      default: 0,
      min: [0, 'প্রতি কিমি চার্জ ঋণাত্মক হতে পারে না']
    },

    // ফ্রি ডেলিভারি থ্রেশহোল্ড
    freeDeliveryAbove: {
      type: Number,
      default: 0,
      min: [0, 'ফ্রি ডেলিভারি অ্যামাউন্ট ঋণাত্মক হতে পারে না']
    },

    // সার্জ প্রাইসিং (পিক আওয়ারে)
    surgePricing: {
      enabled: {
        type: Boolean,
        default: false
      },
      surgeMultiplier: {
        type: Number,
        default: 1.5,
        min: [1, 'সার্জ মাল্টিপ্লায়ার কমপক্ষে ১ হতে হবে']
      }
    }
  },

  // ============ মিনিমাম অর্ডার ============
  minimumOrderAmount: {
    type: Number,
    required: [true, 'মিনিমাম অর্ডার অ্যামাউন্ট প্রয়োজন'],
    default: 0,
    min: [0, 'মিনিমাম অর্ডার অ্যামাউন্ট ঋণাত্মক হতে পারে না']
  },

  // ============ ডেলিভারি ডিসট্যান্স এবং টাইম ============
  deliveryDistance: {
    // সর্বোচ্চ ডেলিভারি দূরত্ব (km)
    maxDistance: {
      type: Number,
      required: [true, 'সর্বোচ্চ ডেলিভারি দূরত্ব প্রয়োজন'],
      min: [0.5, 'সর্বোচ্চ দূরত্ব কমপক্ষে ০.৫ কিমি'],
      max: [50, 'সর্বোচ্চ দূরত্ব ৫০ কিমি পর্যন্ত']
    },

    // গড় দূরত্ব
    averageDistance: {
      type: Number,
      default: 0
    }
  },

  estimatedDeliveryTime: {
    // মিনিমাম সময় (মিনিট)
    minTime: {
      type: Number,
      required: [true, 'মিনিমাম ডেলিভারি টাইম প্রয়োজন'],
      min: [10, 'মিনিমাম ডেলিভারি টাইম ১০ মিনিট'],
      default: 20
    },

    // সর্বোচ্চ সময় (মিনিট)
    maxTime: {
      type: Number,
      required: [true, 'সর্বোচ্চ ডেলিভারি টাইম প্রয়োজন'],
      min: [15, 'সর্বোচ্চ ডেলিভারি টাইম ১৫ মিনিট'],
      default: 40
    },

    // গড় ডেলিভারি টাইম (মিনিট)
    averageTime: {
      type: Number,
      default: 30
    }
  },

  // ============ পিক আওয়ার সেটিংস ============
  peakHours: [{
    dayOfWeek: {
      type: String,
      enum: {
        values: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'all'],
        message: 'সঠিক দিন নির্বাচন করুন'
      },
      required: true
    },
    
    startTime: {
      type: String,
      required: [true, 'পিক আওয়ার শুরুর সময় প্রয়োজন'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'সময় ফরম্যাট: HH:MM (24-hour)']
    },
    
    endTime: {
      type: String,
      required: [true, 'পিক আওয়ার শেষের সময় প্রয়োজন'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'সময় ফরম্যাট: HH:MM (24-hour)']
    },

    extraDelayMinutes: {
      type: Number,
      default: 10,
      min: [0, 'অতিরিক্ত বিলম্ব ঋণাত্মক হতে পারে না']
    },

    delayNote: {
      type: String,
      maxlength: [200, 'নোট সর্বোচ্চ ২০০ অক্ষর']
    }
  }],

  // ============ অ্যাসাইনড ডেলিভারি পার্সন ============
  assignedDeliveryPersons: [{
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ডেলিভারি পার্সন আইডি প্রয়োজন']
    },
    
    personName: {
      type: String,
      required: [true, 'ডেলিভারি পার্সনের নাম প্রয়োজন']
    },

    contactNumber: {
      type: String,
      required: [true, 'মোবাইল নম্বর প্রয়োজন'],
      validate: {
        validator: function(v) {
          // ইন্ডিয়ান মোবাইল: 10 digits, 6-9 দিয়ে শুরু
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'সঠিক ১০ ডিজিটের মোবাইল নম্বর দিন (৬-৯ দিয়ে শুরু)'
      }
    },

    vehicleType: {
      type: String,
      enum: {
        values: ['bicycle', 'bike', 'scooter', 'car', 'other'],
        message: 'সঠিক গাড়ির ধরন নির্বাচন করুন'
      },
      default: 'bike'
    },

    vehicleNumber: {
      type: String,
      trim: true
    },

    isAvailable: {
      type: Boolean,
      default: true
    },

    assignedDate: {
      type: Date,
      default: Date.now
    },

    // পারফরম্যান্স মেট্রিক্স
    performance: {
      totalDeliveries: {
        type: Number,
        default: 0
      },
      successfulDeliveries: {
        type: Number,
        default: 0
      },
      averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      averageDeliveryTime: {
        type: Number,
        default: 0
      }
    }
  }],

  // ============ জোন পারফরম্যান্স ============
  zonePerformance: {
    totalOrders: {
      type: Number,
      default: 0
    },

    successfulDeliveries: {
      type: Number,
      default: 0
    },

    failedDeliveries: {
      type: Number,
      default: 0
    },

    averageDeliveryTime: {
      type: Number,
      default: 0
    },

    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },

    // মাসিক রেভিনিউ
    monthlyRevenue: {
      type: Number,
      default: 0
    },

    // মাসিক ডেলিভারি চার্জ
    monthlyDeliveryCharges: {
      type: Number,
      default: 0
    }
  },

  // ============ সার্ভিস অপারেশন ============
  operationalStatus: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'temporarily-unavailable', 'under-maintenance'],
      message: 'স্ট্যাটাস হতে হবে: active, inactive, temporarily-unavailable, বা under-maintenance'
    },
    default: 'active'
  },

  serviceAvailability: {
    // সার্ভিস কোন দিন চালু থাকবে
    availableDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],

    // সার্ভিস সময়
    serviceHours: {
      openTime: {
        type: String,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'সময় ফরম্যাট: HH:MM (24-hour)']
      },
      closeTime: {
        type: String,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'সময় ফরম্যাট: HH:MM (24-hour)']
      }
    },

    // 24/7 সার্ভিস
    is24x7: {
      type: Boolean,
      default: false
    }
  },

  // ============ সার্ভিস নোটিফিকেশন ============
  serviceNotifications: [{
    notificationType: {
      type: String,
      enum: ['maintenance', 'delay', 'unavailable', 'surge-pricing', 'other']
    },
    message: {
      type: String,
      required: true,
      maxlength: [500, 'বার্তা সর্বোচ্চ ৫০০ অক্ষর']
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  }],

  // ============ স্পেশাল রুলস ============
  specialRules: [{
    ruleName: String,
    ruleDescription: String,
    startDate: Date,
    endDate: Date,
    applicableOn: [{
      type: String,
      enum: ['all', 'weekdays', 'weekends', 'specific-day']
    }],
    deliveryChargeModification: {
      type: String,
      enum: ['fixed', 'percentage', 'waived'],
      default: 'fixed'
    },
    modificationValue: Number,
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // ============ ম্যানেজমেন্ট তথ্য ============
  managedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    userRole: String
  },

  linkedStalls: [{
    stallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stall'
    },
    stallName: String,
    distance: Number // জোন সেন্টার থেকে দূরত্ব (km)
  }],

  // ============ স্ট্যাটাস এবং মেটাডাটা ============
  isActive: {
    type: Boolean,
    default: true
  },

  notes: {
    type: String,
    maxlength: [1000, 'নোট সর্বোচ্চ ১০০০ অক্ষর']
  }
}, {
  timestamps: true,
  versionKey: false
});

// ============ INDEXES ============
deliveryZoneSchema.index({ zoneCode: 1 }, { unique: true });
deliveryZoneSchema.index({ 'centerPoint': '2dsphere' }); // জিও-স্পেশিয়াল সার্চের জন্য
deliveryZoneSchema.index({ operationalStatus: 1, isActive: 1 });
deliveryZoneSchema.index({ 'includedLocalities.pinCode': 1 });

// ============ VIRTUAL FIELDS ============
// ডেলিভারি সাকসেস রেট
deliveryZoneSchema.virtual('deliverySuccessRate').get(function() {
  if (this.zonePerformance.totalOrders === 0) return 0;
  return ((this.zonePerformance.successfulDeliveries / this.zonePerformance.totalOrders) * 100).toFixed(2);
});

// অ্যাভেইলেবল ডেলিভারি পার্সন সংখ্যা
deliveryZoneSchema.virtual('availablePersonsCount').get(function() {
  return this.assignedDeliveryPersons.filter(p => p.isAvailable).length;
});

// সার্ভিস স্ট্যাটাস বাংলায়
deliveryZoneSchema.virtual('statusText').get(function() {
  const statusMap = {
    'active': 'সক্রিয়',
    'inactive': 'নিষ্ক্রিয়',
    'temporarily-unavailable': 'সাময়িকভাবে অনুপলব্ধ',
    'under-maintenance': 'রক্ষণাবেক্ষণে'
  };
  return statusMap[this.operationalStatus] || this.operationalStatus;
});

// গড় ডেলিভারি চার্জ
deliveryZoneSchema.virtual('averageDeliveryCharge').get(function() {
  if (this.zonePerformance.totalOrders === 0) return 0;
  return (this.zonePerformance.monthlyDeliveryCharges / this.zonePerformance.totalOrders).toFixed(2);
});

// ============ STATIC METHODS ============
// পিনকোড দিয়ে জোন খুঁজুন
deliveryZoneSchema.statics.findByPinCode = function(pinCode) {
  return this.findOne({
    'includedLocalities.pinCode': pinCode,
    operationalStatus: 'active',
    isActive: true
  });
};

// জিও-লোকেশন দিয়ে জোন খুঁজুন
deliveryZoneSchema.statics.findByLocation = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    centerPoint: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // meters
      }
    },
    operationalStatus: 'active',
    isActive: true
  });
};

// অ্যাক্টিভ জোন সব খুঁজুন
deliveryZoneSchema.statics.findActiveZones = function() {
  return this.find({
    operationalStatus: 'active',
    isActive: true
  }).select('zoneName zoneCode deliveryCharge minimumOrderAmount estimatedDeliveryTime');
};

// হাই পারফর্মিং জোন খুঁজুন
deliveryZoneSchema.statics.findTopPerformingZones = function(limit = 10) {
  return this.find({
    isActive: true
  })
  .sort({ 
    'zonePerformance.monthlyRevenue': -1,
    'zonePerformance.averageRating': -1
  })
  .limit(limit);
};

// লো পারফর্মিং জোন খুঁজুন
deliveryZoneSchema.statics.findLowPerformingZones = function(threshold = 60, limit = 10) {
  return this.aggregate([
    {
      $addFields: {
        successRate: {
          $cond: [
            { $eq: ['$zonePerformance.totalOrders', 0] },
            0,
            { $multiply: [
              { $divide: ['$zonePerformance.successfulDeliveries', '$zonePerformance.totalOrders'] },
              100
            ]}
          ]
        }
      }
    },
    {
      $match: {
        successRate: { $lt: threshold },
        isActive: true
      }
    },
    {
      $sort: { successRate: 1 }
    },
    {
      $limit: limit
    }
  ]);
};

// ============ INSTANCE METHODS ============
// ডেলিভারি পার্সন অ্যাসাইন করুন
deliveryZoneSchema.methods.assignDeliveryPerson = function(personData) {
  // চেক করুন যে এই পার্সন আগে থেকে অ্যাসাইনড আছে কিনা
  const existing = this.assignedDeliveryPersons.find(
    p => p.personId.toString() === personData.personId.toString()
  );
  
  if (!existing) {
    this.assignedDeliveryPersons.push({
      ...personData,
      assignedDate: new Date()
    });
  }
  
  return this.save();
};

// ডেলিভারি পার্সন রিমুভ করুন
deliveryZoneSchema.methods.removeDeliveryPerson = function(personId) {
  this.assignedDeliveryPersons = this.assignedDeliveryPersons.filter(
    p => p.personId.toString() !== personId.toString()
  );
  return this.save();
};

// লোকালিটি যোগ করুন
deliveryZoneSchema.methods.addLocality = function(localityData) {
  // চেক করুন যে এই লোকালিটি আগে থেকে আছে কিনা
  const existing = this.includedLocalities.find(
    l => l.localityName.toLowerCase() === localityData.localityName.toLowerCase()
  );
  
  if (!existing) {
    this.includedLocalities.push(localityData);
  }
  
  return this.save();
};

// পিক আওয়ার চেক করুন
deliveryZoneSchema.methods.isPeakHour = function(dateTime = new Date()) {
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dateTime.getDay()];
  const currentTime = `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`;
  
  return this.peakHours.some(peak => {
    return (peak.dayOfWeek === dayOfWeek || peak.dayOfWeek === 'all') &&
           currentTime >= peak.startTime && 
           currentTime <= peak.endTime;
  });
};

// ডেলিভারি চার্জ ক্যালকুলেট করুন
deliveryZoneSchema.methods.calculateDeliveryCharge = function(orderAmount, distance = 0, dateTime = new Date()) {
  let charge = this.deliveryCharge.baseCharge;
  
  // ফ্রি ডেলিভারি চেক
  if (this.deliveryCharge.freeDeliveryAbove > 0 && orderAmount >= this.deliveryCharge.freeDeliveryAbove) {
    return 0;
  }
  
  // দূরত্ব-ভিত্তিক চার্জ
  if (distance > 0 && this.deliveryCharge.perKmCharge > 0) {
    charge += (distance * this.deliveryCharge.perKmCharge);
  }
  
  // পিক আওয়ার সার্জ প্রাইসিং
  if (this.deliveryCharge.surgePricing.enabled && this.isPeakHour(dateTime)) {
    charge *= this.deliveryCharge.surgePricing.surgeMultiplier;
  }
  
  return Math.round(charge);
};

// ডেলিভারি টাইম এস্টিমেট করুন
deliveryZoneSchema.methods.estimateDeliveryTime = function(dateTime = new Date()) {
  let minTime = this.estimatedDeliveryTime.minTime;
  let maxTime = this.estimatedDeliveryTime.maxTime;
  
  // পিক আওয়ারে অতিরিক্ত সময় যোগ করুন
  if (this.isPeakHour(dateTime)) {
    const peakHour = this.peakHours.find(peak => {
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dateTime.getDay()];
      const currentTime = `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`;
      return (peak.dayOfWeek === dayOfWeek || peak.dayOfWeek === 'all') &&
             currentTime >= peak.startTime && 
             currentTime <= peak.endTime;
    });
    
    if (peakHour) {
      minTime += peakHour.extraDelayMinutes;
      maxTime += peakHour.extraDelayMinutes;
    }
  }
  
  return { minTime, maxTime };
};

// অর্ডার আপডেট করুন
deliveryZoneSchema.methods.updateOrderStats = function(isSuccess = true, deliveryTime = 0) {
  this.zonePerformance.totalOrders += 1;
  
  if (isSuccess) {
    this.zonePerformance.successfulDeliveries += 1;
  } else {
    this.zonePerformance.failedDeliveries += 1;
  }
  
  // গড় ডেলিভারি টাইম আপডেট
  if (deliveryTime > 0) {
    const totalTime = this.zonePerformance.averageDeliveryTime * (this.zonePerformance.totalOrders - 1);
    this.zonePerformance.averageDeliveryTime = (totalTime + deliveryTime) / this.zonePerformance.totalOrders;
  }
  
  return this.save();
};

// নোটিফিকেশন যোগ করুন
deliveryZoneSchema.methods.addNotification = function(notificationData) {
  this.serviceNotifications.push({
    ...notificationData,
    isActive: true
  });
  return this.save();
};

// জোন অ্যাক্টিভেট/ডিঅ্যাক্টিভেট করুন
deliveryZoneSchema.methods.toggleStatus = function(status) {
  this.operationalStatus = status;
  return this.save();
};

// ============ PRE-SAVE MIDDLEWARE ============
deliveryZoneSchema.pre('save', function(next) {
  // Center point ক্যালকুলেট করুন (যদি না থাকে)
  if (this.isModified('geoPolygon') && this.geoPolygon.coordinates.length > 0) {
    const coords = this.geoPolygon.coordinates[0];
    let sumLng = 0, sumLat = 0;
    
    coords.forEach(coord => {
      sumLng += coord[0];
      sumLat += coord[1];
    });
    
    this.centerPoint = {
      type: 'Point',
      coordinates: [sumLng / coords.length, sumLat / coords.length]
    };
  }
  
  // Available days default set করুন
  if (!this.serviceAvailability.availableDays || this.serviceAvailability.availableDays.length === 0) {
    this.serviceAvailability.availableDays = [
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ];
  }
  
  next();
});

// ============ MODEL EXPORT ============
const DeliveryZone = mongoose.model('DeliveryZone', deliveryZoneSchema);

module.exports = DeliveryZone;