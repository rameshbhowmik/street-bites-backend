// Test Models Script
// সব models test করার জন্য

require('dotenv').config();
const { User, Stall, Product, Order } = require('./src/models');

async function testModels() {
  console.log('🧪 Models Testing শুরু হচ্ছে...\n');

  try {
    // =============================================
    // 1. User Model Test
    // =============================================
    console.log('📝 1. User Model Test:');
    
    const users = await User.findAll({ limit: 5 });
    console.log(`   ✅ Total Users: ${users.length}`);

    const userStats = await User.getStatistics();
    console.log(`   ✅ User Statistics:`, userStats);

    // =============================================
    // 2. Stall Model Test
    // =============================================
    console.log('\n📝 2. Stall Model Test:');
    
    const stalls = await Stall.findAll();
    console.log(`   ✅ Total Stalls: ${stalls.length}`);

    const activeStalls = await Stall.getActiveStalls();
    console.log(`   ✅ Active Stalls: ${activeStalls.length}`);

    // =============================================
    // 3. Product Model Test
    // =============================================
    console.log('\n📝 3. Product Model Test:');
    
    const products = await Product.findAll({ limit: 10 });
    console.log(`   ✅ Total Products: ${products.length}`);

    const productStats = await Product.getStatistics();
    console.log(`   ✅ Product Statistics:`, productStats);

    // =============================================
    // 4. Order Model Test
    // =============================================
    console.log('\n📝 4. Order Model Test:');
    
    const orders = await Order.findAll({ limit: 5 });
    console.log(`   ✅ Recent Orders: ${orders.length}`);

    const todayStats = await Order.getTodayStats();
    console.log(`   ✅ Today's Stats:`, todayStats);

    console.log('\n✅ সব Models সঠিকভাবে কাজ করছে! 🎉\n');

  } catch (error) {
    console.error('\n❌ Test করতে সমস্যা হয়েছে:', error.message);
    console.error(error);
  }

  process.exit(0);
}

// Test run করা
testModels();