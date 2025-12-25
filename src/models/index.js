// Models Index
// সব models একসাথে export করার জন্য

const User = require('./User');
const Investor = require('./Investor');
const Employee = require('./Employee');
const Stall = require('./Stall');
const Product = require('./Product');
const Order = require('./Order');
const Transaction = require('./Transaction');

module.exports = {
  User,
  Investor,
  Employee,
  Stall,
  Product,
  Order,
  Transaction
};