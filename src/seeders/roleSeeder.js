// backend/src/seeders/roleSeeder.js

const Role = require('../models/Role');
const mongoose = require('mongoose');
require('dotenv').config();

// ========================
// DEFAULT ROLES - Street Bites
// ⭐ IMPORTANT: Capital Case format (Owner, Manager, etc.)
// ========================

const defaultRoles = [
  {
    name: 'Owner', // ⭐ Capital Case (not OWNER)
    displayName: 'মালিক',
    description: 'সম্পূর্ণ সিস্টেমের নিয়ন্ত্রণ',
    level: 100,
    permissions: {
      users: { create: true, read: true, update: true, delete: true, viewAll: true },
      roles: { create: true, read: true, update: true, delete: true },
      products: { create: true, read: true, update: true, delete: true, manageStock: true, setPrice: true },
      categories: { create: true, read: true, update: true, delete: true },
      orders: { create: true, read: true, update: true, delete: true, viewAll: true, assignDelivery: true, cancelOrder: true },
      stalls: { create: true, read: true, update: true, delete: true, viewAll: true, assignEmployees: true },
      inventory: { create: true, read: true, update: true, delete: true, viewReports: true },
      finance: { viewRevenue: true, viewExpenses: true, viewProfit: true, manageBudget: true, viewInvestorReports: true },
      analytics: { viewSalesReports: true, viewCustomerReports: true, viewEmployeeReports: true, viewInventoryReports: true, exportData: true },
      notifications: { send: true, sendBulk: true },
      settings: { updateSystemSettings: true, managePaymentMethods: true, manageDeliverySettings: true },
    },
    isActive: true,
  },
  {
    name: 'Investor', // ⭐ Capital Case (not INVESTOR)
    displayName: 'বিনিয়োগকারী',
    description: 'লাভ-ক্ষতি দেখতে পারবেন',
    level: 80,
    permissions: {
      users: { create: false, read: false, update: false, delete: false, viewAll: false },
      roles: { create: false, read: false, update: false, delete: false },
      products: { create: false, read: true, update: false, delete: false, manageStock: false, setPrice: false },
      categories: { create: false, read: true, update: false, delete: false },
      orders: { create: false, read: false, update: false, delete: false, viewAll: false, assignDelivery: false, cancelOrder: false },
      stalls: { create: false, read: true, update: false, delete: false, viewAll: true, assignEmployees: false },
      inventory: { create: false, read: true, update: false, delete: false, viewReports: true },
      finance: { viewRevenue: true, viewExpenses: true, viewProfit: true, manageBudget: false, viewInvestorReports: true },
      analytics: { viewSalesReports: true, viewCustomerReports: true, viewEmployeeReports: false, viewInventoryReports: true, exportData: true },
      notifications: { send: false, sendBulk: false },
      settings: { updateSystemSettings: false, managePaymentMethods: false, manageDeliverySettings: false },
    },
    isActive: true,
  },
  {
    name: 'Manager', // ⭐ Capital Case (not MANAGER)
    displayName: 'ম্যানেজার',
    description: 'উৎপাদন এবং স্টল ব্যবস্থাপনা',
    level: 70,
    permissions: {
      users: { create: true, read: true, update: true, delete: false, viewAll: true }, // ⭐ Manager can create users
      roles: { create: false, read: true, update: false, delete: false },
      products: { create: true, read: true, update: true, delete: false, manageStock: true, setPrice: true },
      categories: { create: true, read: true, update: true, delete: false },
      orders: { create: true, read: true, update: true, delete: false, viewAll: true, assignDelivery: true, cancelOrder: true },
      stalls: { create: false, read: true, update: true, delete: false, viewAll: true, assignEmployees: true },
      inventory: { create: true, read: true, update: true, delete: false, viewReports: true },
      finance: { viewRevenue: true, viewExpenses: true, viewProfit: false, manageBudget: false, viewInvestorReports: false },
      analytics: { viewSalesReports: true, viewCustomerReports: true, viewEmployeeReports: true, viewInventoryReports: true, exportData: false },
      notifications: { send: true, sendBulk: false },
      settings: { updateSystemSettings: false, managePaymentMethods: false, manageDeliverySettings: true },
    },
    isActive: true,
  },
  {
    name: 'Employee', // ⭐ Capital Case (not EMPLOYEE)
    displayName: 'কর্মচারী',
    description: 'POS এবং বিক্রয় এন্ট্রি',
    level: 50,
    permissions: {
      users: { create: false, read: false, update: false, delete: false, viewAll: false },
      roles: { create: false, read: false, update: false, delete: false },
      products: { create: false, read: true, update: false, delete: false, manageStock: false, setPrice: false },
      categories: { create: false, read: true, update: false, delete: false },
      orders: { create: true, read: true, update: true, delete: false, viewAll: false, assignDelivery: false, cancelOrder: false },
      stalls: { create: false, read: true, update: false, delete: false, viewAll: false, assignEmployees: false },
      inventory: { create: false, read: true, update: false, delete: false, viewReports: false },
      finance: { viewRevenue: false, viewExpenses: false, viewProfit: false, manageBudget: false, viewInvestorReports: false },
      analytics: { viewSalesReports: false, viewCustomerReports: false, viewEmployeeReports: false, viewInventoryReports: false, exportData: false },
      notifications: { send: false, sendBulk: false },
      settings: { updateSystemSettings: false, managePaymentMethods: false, manageDeliverySettings: false },
    },
    isActive: true,
  },
  {
    name: 'Delivery_Person', // ⭐ Capital Case with underscore (not DELIVERY_PERSON)
    displayName: 'ডেলিভারি ব্যক্তি',
    description: 'অর্ডার ডেলিভারি',
    level: 40,
    permissions: {
      users: { create: false, read: false, update: false, delete: false, viewAll: false },
      roles: { create: false, read: false, update: false, delete: false },
      products: { create: false, read: true, update: false, delete: false, manageStock: false, setPrice: false },
      categories: { create: false, read: true, update: false, delete: false },
      orders: { create: false, read: true, update: true, delete: false, viewAll: false, assignDelivery: false, cancelOrder: false },
      stalls: { create: false, read: true, update: false, delete: false, viewAll: false, assignEmployees: false },
      inventory: { create: false, read: false, update: false, delete: false, viewReports: false },
      finance: { viewRevenue: false, viewExpenses: false, viewProfit: false, manageBudget: false, viewInvestorReports: false },
      analytics: { viewSalesReports: false, viewCustomerReports: false, viewEmployeeReports: false, viewInventoryReports: false, exportData: false },
      notifications: { send: false, sendBulk: false },
      settings: { updateSystemSettings: false, managePaymentMethods: false, manageDeliverySettings: false },
    },
    isActive: true,
  },
  {
    name: 'Customer', // ⭐ Capital Case (not CUSTOMER)
    displayName: 'গ্রাহক',
    description: 'অর্ডার প্লেস করবেন',
    level: 10,
    permissions: {
      users: { create: false, read: false, update: false, delete: false, viewAll: false },
      roles: { create: false, read: false, update: false, delete: false },
      products: { create: false, read: true, update: false, delete: false, manageStock: false, setPrice: false },
      categories: { create: false, read: true, update: false, delete: false },
      orders: { create: true, read: true, update: false, delete: false, viewAll: false, assignDelivery: false, cancelOrder: true },
      stalls: { create: false, read: true, update: false, delete: false, viewAll: false, assignEmployees: false },
      inventory: { create: false, read: false, update: false, delete: false, viewReports: false },
      finance: { viewRevenue: false, viewExpenses: false, viewProfit: false, manageBudget: false, viewInvestorReports: false },
      analytics: { viewSalesReports: false, viewCustomerReports: false, viewEmployeeReports: false, viewInventoryReports: false, exportData: false },
      notifications: { send: false, sendBulk: false },
      settings: { updateSystemSettings: false, managePaymentMethods: false, manageDeliverySettings: false },
    },
    isActive: true,
  },
];

// ========================
// SEEDER FUNCTION
// ========================

const seedRoles = async () => {
  try {
    // MongoDB Connect
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');

    // পুরানো roles মুছে ফেলা
    const deleteResult = await Role.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} old roles`);

    // নতুন roles insert করা
    const insertedRoles = await Role.insertMany(defaultRoles);
    console.log(`✅ Created ${insertedRoles.length} new roles successfully!`);

    // Roles list দেখানো
    const roles = await Role.find().sort({ level: -1 });
    console.log('\n📋 Created Roles:');
    console.log('═'.repeat(60));
    roles.forEach((role) => {
      console.log(`  ${role.level.toString().padStart(3)} | ${role.name.padEnd(20)} | ${role.displayName}`);
    });
    console.log('═'.repeat(60));

    console.log('\n✅ Role seeding completed successfully!');
    console.log('🎉 You can now use these roles in your application\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding roles:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run seeder
seedRoles();

// ========================
// USAGE
// ========================
// Terminal এ run করুন: node src/seeders/roleSeeder.js