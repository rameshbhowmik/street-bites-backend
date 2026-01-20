require('dotenv').config();
const { cloudinary } = require('./src/config/cloudinary');

async function testCloudinary() {
  try {
    console.log('Testing Cloudinary connection...');
    
    const result = await cloudinary.api.ping();
    
    if (result.status === 'ok') {
      console.log('✅ Cloudinary connection successful!');
      console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    }
  } catch (error) {
    console.error('❌ Cloudinary connection failed:');
    console.error(error.message);
  }
}

testCloudinary();