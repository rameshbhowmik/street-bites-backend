// Main Server Entry Point
// মূল server file যেখান থেকে application শুরু হবে

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import configurations
const { testConnection } = require('./config/database');
const { testCloudinaryConnection } = require('./config/cloudinary');

// Import middlewares
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Express app initialize করা
const app = express();

// =============================================
// MIDDLEWARE SETUP
// =============================================

// Security middleware
app.use(helmet());

// CORS configuration
// Frontend থেকে API call করার অনুমতি দেওয়া
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
// Request body থেকে JSON data parse করার জন্য
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
// প্রতিটি request log করা
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });
}

// Rate limiting
// API abuse prevention
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'অনেক বেশি request পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন'
});

app.use('/api/', limiter);

// =============================================
// ROUTES
// =============================================

// Health check route
// Server চালু আছে কিনা check করার জন্য
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Street Bites API সফলভাবে চালু আছে! 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API status route
// Database ও Cloudinary connection status check করা
app.get('/api/status', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    const cloudinaryStatus = testCloudinaryConnection();

    res.json({
      success: true,
      message: 'System status',
      data: {
        server: 'Running',
        database: dbStatus ? 'Connected' : 'Disconnected',
        cloudinary: cloudinaryStatus ? 'Configured' : 'Not Configured',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Status check এ সমস্যা হয়েছে',
      error: error.message
    });
  }
});

// API documentation route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Street Bites API',
    version: '1.0.0',
    documentation: {
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        products: '/api/products',
        stalls: '/api/stalls',
        orders: '/api/orders',
        images: '/api/images'
      },
      image_upload_endpoints: {
        product_images: {
          single: 'POST /api/images/products/:id/upload',
          multiple: 'POST /api/images/products/:id/upload-multiple',
          delete: 'DELETE /api/images/products/:id'
        },
        profile_picture: {
          upload: 'POST /api/images/profile/upload',
          delete: 'DELETE /api/images/profile'
        },
        stall_photos: {
          upload: 'POST /api/images/stalls/:id/upload',
          hygiene: 'POST /api/images/stalls/:id/hygiene'
        },
        receipts: {
          upload: 'POST /api/images/receipts/upload',
          delete: 'DELETE /api/images/receipts'
        },
        reviews: {
          upload: 'POST /api/images/reviews/upload',
          delete: 'DELETE /api/images/reviews'
        }
      }
    }
  });
});

// =============================================
// API ROUTES
// =============================================

// Main API routes (যদি routes/index.js থাকে)
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Legacy route support (যদি সরাসরি routes ব্যবহার করতে চান)
// Individual routes uncomment করতে পারেন
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const productRoutes = require('./routes/productRoutes');
// const stallRoutes = require('./routes/stallRoutes');
// const orderRoutes = require('./routes/orderRoutes');
// const imageUploadRoutes = require('./routes/imageUploadRoutes');

// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/stalls', stallRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/images', imageUploadRoutes);

// =============================================
// ERROR HANDLING
// =============================================

// 404 error handler
// যখন কোন route match করবে না
app.use(notFound);

// Global error handler
// সমস্ত error এখানে handle হবে
app.use(errorHandler);

// =============================================
// SERVER START
// =============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Database connection test করা
    console.log('🔄 Database connection test করা হচ্ছে...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Database connection ব্যর্থ হয়েছে!');
      console.error('⚠️  অনুগ্রহ করে .env ফাইলের database credentials check করুন');
      process.exit(1);
    }

    // Cloudinary configuration test করা
    console.log('🔄 Cloudinary configuration test করা হচ্ছে...');
    const cloudinaryConfigured = testCloudinaryConnection();

    // Server start করা
    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('🎉 Street Bites Backend Server');
      console.log('========================================');
      console.log(`🚀 Server চালু হয়েছে: http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: Connected`);
      console.log(`📁 Cloudinary: ${cloudinaryConfigured ? '✅ Configured' : '⚠️  Not Configured'}`);
      console.log('========================================');
      console.log('');
      console.log('💡 Available Endpoints:');
      console.log('   - Health check: http://localhost:' + PORT);
      console.log('   - Status check: http://localhost:' + PORT + '/api/status');
      console.log('   - API docs: http://localhost:' + PORT + '/api');
      console.log('');
      console.log('📸 Image Upload Endpoints:');
      console.log('   - Product images: /api/images/products/:id/upload');
      console.log('   - Profile picture: /api/images/profile/upload');
      console.log('   - Stall photos: /api/images/stalls/:id/upload');
      console.log('   - Receipts: /api/images/receipts/upload');
      console.log('   - Reviews: /api/images/reviews/upload');
      console.log('');
      if (!cloudinaryConfigured) {
        console.log('⚠️  Warning: Cloudinary not configured!');
        console.log('   Image upload features will not work.');
        console.log('   Please add Cloudinary credentials to .env file.');
        console.log('');
      }
    });

  } catch (error) {
    console.error('❌ Server start করতে সমস্যা হয়েছে:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
// Promise rejection handle করা
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  console.log('🔄 Server বন্ধ করা হচ্ছে...');
  process.exit(1);
});

// Handle uncaught exceptions
// Uncaught exception handle করা
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.log('🔄 Server বন্ধ করা হচ্ছে...');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

// Server start করা
startServer();

module.exports = app;