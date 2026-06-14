const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const groupRoutes = require('./groups');
const expenseRoutes = require('./expenses');
const importRoutes = require('./import');
const balanceRoutes = require('./balances');
const settlementRoutes = require('./settlements');
const exchangeRateRoutes = require('./exchange-rates');
const auditRoutes = require('./audit');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/expenses', expenseRoutes);
router.use('/import', importRoutes);
router.use('/balances', balanceRoutes);
router.use('/settlements', settlementRoutes);
router.use('/exchange-rates', exchangeRateRoutes);
router.use('/audit', auditRoutes);

module.exports = router;