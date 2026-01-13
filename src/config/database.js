// backend/src/config/database.js
const mongoose = require('mongoose');

/**
 * MongoDB Database Connection
 * Street Bites Project
 */

const connectDB = async () => {
  try {
    // Mongoose 6+ এ useNewUrlParser এবং useUnifiedTopology আর লাগে না
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);
    console.log('━'.repeat(50));
    
  } catch (error) {
    console.error('━'.repeat(50));
    console.error('❌ MongoDB Connection Error:');
    console.error(`📝 Message: ${error.message}`);
    console.error('━'.repeat(50));
    console.error('💡 Troubleshooting Tips:');
    console.error('   1. Check if MongoDB is running: mongod --version');
    console.error('   2. Check your MONGODB_URI in .env file');
    console.error('   3. Make sure MongoDB service is started');
    console.error('━'.repeat(50));
    
    // Exit process with failure
    process.exit(1);
  }
};

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;