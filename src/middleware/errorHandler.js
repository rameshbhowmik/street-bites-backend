// Error Handling Middleware
// সমস্ত error handle করার জন্য middleware

// 404 Not Found handler
// যখন কোন route match করবে না
const notFound = (req, res, next) => {
  const error = new Error(`Route পাওয়া যায়নি - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler
// সমস্ত error এখানে আসবে এবং সুন্দরভাবে response পাঠানো হবে
const errorHandler = (err, req, res, next) => {
  // Status code নির্ধারণ করা
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Error response তৈরি করা
  const errorResponse = {
    success: false,
    message: err.message || 'সার্ভারে সমস্যা হয়েছে',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  };

  // Console এ error log করা
  console.error('❌ Error:', {
    message: err.message,
    statusCode: statusCode,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  // Response পাঠানো
  res.status(statusCode).json(errorResponse);
};

// Validation error handler
// express-validator থেকে আসা validation errors handle করা
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    
    errors.array().forEach(error => {
      if (!formattedErrors[error.path || error.param]) {
        formattedErrors[error.path || error.param] = [];
      }
      formattedErrors[error.path || error.param].push(error.msg);
    });

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: formattedErrors
    });
  }
  
  next();
};

// Async error wrapper
// Async functions এর error automatically catch করার জন্য
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database error handler
// PostgreSQL specific errors handle করা
const handleDatabaseError = (error) => {
  // Unique constraint violation
  if (error.code === '23505') {
    return {
      statusCode: 409,
      message: 'এই তথ্য ইতিমধ্যে বিদ্যমান আছে'
    };
  }

  // Foreign key violation
  if (error.code === '23503') {
    return {
      statusCode: 400,
      message: 'সংশ্লিষ্ট ডাটা পাওয়া যায়নি'
    };
  }

  // Not null violation
  if (error.code === '23502') {
    return {
      statusCode: 400,
      message: 'প্রয়োজনীয় তথ্য প্রদান করুন'
    };
  }

  // Default database error
  return {
    statusCode: 500,
    message: 'ডাটাবেসে সমস্যা হয়েছে'
  };
};

// Custom error class
// নিজস্ব error তৈরি করার জন্য
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  notFound,
  errorHandler,
  handleValidationErrors,
  asyncHandler,
  handleDatabaseError,
  AppError
};