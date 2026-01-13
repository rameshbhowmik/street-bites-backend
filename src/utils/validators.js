// backend/src/utils/validators.js

// ========================
// INDIAN MOBILE NUMBER VALIDATOR
// ========================

/**
 * ভারতীয় মোবাইল নম্বর validate করে
 * @param {string} phone - Phone number to validate
 * @returns {Object} - { isValid: boolean, formatted: string, error: string }
 */
const validateIndianPhone = (phone) => {
  if (!phone) {
    return {
      isValid: false,
      formatted: null,
      error: 'মোবাইল নম্বর প্রয়োজন',
    };
  }

  // Whitespace এবং special characters remove
  let cleaned = phone.toString().replace(/\s+/g, '').replace(/[^\d+]/g, '');

  // Valid formats:
  // +919876543210 (13 chars)
  // 919876543210 (12 chars)
  // 9876543210 (10 chars)

  let normalized = cleaned;

  // Format check এবং normalize
  if (cleaned.startsWith('+91')) {
    // +91XXXXXXXXXX format
    normalized = cleaned;
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    // 91XXXXXXXXXX format
    normalized = '+' + cleaned;
  } else if (cleaned.length === 10) {
    // XXXXXXXXXX format
    normalized = '+91' + cleaned;
  } else {
    return {
      isValid: false,
      formatted: null,
      error: 'মোবাইল নম্বর ১০ ডিজিটের হতে হবে',
    };
  }

  // Extract last 10 digits
  const lastTenDigits = normalized.slice(-10);

  // Check if starts with valid prefix (6, 7, 8, or 9)
  const validPrefixes = ['6', '7', '8', '9'];
  if (!validPrefixes.includes(lastTenDigits[0])) {
    return {
      isValid: false,
      formatted: null,
      error: 'ভারতীয় মোবাইল নম্বর ৬, ৭, ৮, বা ৯ দিয়ে শুরু হতে হবে',
    };
  }

  // Check if all 10 digits are numbers
  if (!/^\d{10}$/.test(lastTenDigits)) {
    return {
      isValid: false,
      formatted: null,
      error: 'সঠিক মোবাইল নম্বর প্রদান করুন',
    };
  }

  return {
    isValid: true,
    formatted: normalized, // +91XXXXXXXXXX format
    formattedDisplay: `+91 ${lastTenDigits.slice(0, 5)} ${lastTenDigits.slice(5)}`, // +91 98765 43210
    error: null,
  };
};

// ========================
// EMAIL VALIDATOR
// ========================

/**
 * Email validate করে
 * @param {string} email - Email to validate
 * @returns {Object} - { isValid: boolean, normalized: string, error: string }
 */
const validateEmail = (email) => {
  if (!email) {
    return {
      isValid: false,
      normalized: null,
      error: 'ইমেইল প্রয়োজন',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalized = email.toLowerCase().trim();

  if (!emailRegex.test(normalized)) {
    return {
      isValid: false,
      normalized: null,
      error: 'সঠিক ইমেইল প্রদান করুন',
    };
  }

  return {
    isValid: true,
    normalized: normalized,
    error: null,
  };
};

// ========================
// PASSWORD VALIDATOR
// ========================

/**
 * Password strength check করে
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, strength: string, error: string }
 */
const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      strength: null,
      error: 'পাসওয়ার্ড প্রয়োজন',
    };
  }

  // Minimum length check
  if (password.length < 8) {
    return {
      isValid: false,
      strength: 'weak',
      error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে',
    };
  }

  // Strength calculation
  let strength = 'weak';
  let score = 0;

  // Length bonus
  if (password.length >= 12) score += 2;
  else if (password.length >= 10) score += 1;

  // Contains lowercase
  if (/[a-z]/.test(password)) score += 1;

  // Contains uppercase
  if (/[A-Z]/.test(password)) score += 1;

  // Contains number
  if (/\d/.test(password)) score += 1;

  // Contains special character
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  // Calculate strength
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return {
    isValid: true,
    strength: strength,
    score: score,
    error: null,
  };
};

// ========================
// INDIAN PINCODE VALIDATOR
// ========================

/**
 * ভারতীয় পিনকোড validate করে
 * @param {string} pincode - Pincode to validate
 * @returns {Object} - { isValid: boolean, formatted: string, error: string }
 */
const validatePincode = (pincode) => {
  if (!pincode) {
    return {
      isValid: false,
      formatted: null,
      error: 'পিনকোড প্রয়োজন',
    };
  }

  const cleaned = pincode.toString().replace(/\s+/g, '');

  if (!/^\d{6}$/.test(cleaned)) {
    return {
      isValid: false,
      formatted: null,
      error: 'পিনকোড ৬ ডিজিটের হতে হবে',
    };
  }

  return {
    isValid: true,
    formatted: cleaned,
    error: null,
  };
};

// ========================
// OTP VALIDATOR
// ========================

/**
 * OTP validate করে
 * @param {string} otp - OTP to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
const validateOTP = (otp) => {
  if (!otp) {
    return {
      isValid: false,
      error: 'OTP প্রয়োজন',
    };
  }

  const cleaned = otp.toString().replace(/\s+/g, '');

  if (!/^\d{6}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'OTP ৬ ডিজিটের হতে হবে',
    };
  }

  return {
    isValid: true,
    error: null,
  };
};

// ========================
// PHONE NUMBER FORMATTER
// ========================

/**
 * Phone number কে বিভিন্ন format এ convert করে
 * @param {string} phone - Phone number
 * @returns {Object} - Different formats
 */
const formatPhoneNumber = (phone) => {
  const validation = validateIndianPhone(phone);
  
  if (!validation.isValid) {
    return null;
  }

  const digits = validation.formatted.replace('+91', '');

  return {
    e164: validation.formatted, // +919876543210
    national: digits, // 9876543210
    international: validation.formattedDisplay, // +91 98765 43210
    uri: `tel:${validation.formatted}`, // tel:+919876543210
    whatsapp: `https://wa.me/${validation.formatted.replace('+', '')}`, // WhatsApp link
  };
};

// ========================
// BULK PHONE VALIDATOR
// ========================

/**
 * একসাথে multiple phone numbers validate করে
 * @param {Array} phones - Array of phone numbers
 * @returns {Object} - { valid: Array, invalid: Array }
 */
const validateBulkPhones = (phones) => {
  const valid = [];
  const invalid = [];

  phones.forEach((phone) => {
    const result = validateIndianPhone(phone);
    if (result.isValid) {
      valid.push({
        original: phone,
        formatted: result.formatted,
        display: result.formattedDisplay,
      });
    } else {
      invalid.push({
        original: phone,
        error: result.error,
      });
    }
  });

  return { valid, invalid };
};

// ========================
// EXPORTS
// ========================

module.exports = {
  validateIndianPhone,
  validateEmail,
  validatePassword,
  validatePincode,
  validateOTP,
  formatPhoneNumber,
  validateBulkPhones,
};

// ========================
// USAGE EXAMPLES
// ========================

/*
// Example 1: Validate phone
const result = validateIndianPhone('9876543210');
console.log(result);
// { isValid: true, formatted: '+919876543210', formattedDisplay: '+91 98765 43210', error: null }

// Example 2: Validate email
const emailResult = validateEmail('user@example.com');
console.log(emailResult);
// { isValid: true, normalized: 'user@example.com', error: null }

// Example 3: Check password strength
const passResult = validatePassword('MyPass@123');
console.log(passResult);
// { isValid: true, strength: 'strong', score: 5, error: null }

// Example 4: Format phone number
const formats = formatPhoneNumber('9876543210');
console.log(formats);
// {
//   e164: '+919876543210',
//   national: '9876543210',
//   international: '+91 98765 43210',
//   uri: 'tel:+919876543210',
//   whatsapp: 'https://wa.me/919876543210'
// }

// Example 5: Validate multiple phones
const bulkResult = validateBulkPhones(['9876543210', '1234567890', '+917890123456']);
console.log(bulkResult);
*/