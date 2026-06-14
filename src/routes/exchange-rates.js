const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// Get exchange rates (optional filtering)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { fromCurrency, toCurrency, date } = req.query;

    // Build where clause
    const whereClause = {};

    if (fromCurrency) {
      whereClause.fromCurrency = fromCurrency;
    }

    if (toCurrency) {
      whereClause.toCurrency = toCurrency;
    }

    if (date) {
      whereClause.date = {
        lte: new Date(date) // Get rates on or before the specified date
      };
    }

    // Get exchange rates
    const exchangeRates = await prisma.exchangeRate.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc' // Most recent first
      }
    });

    res.status(200).json({
      success: true,
      data: exchangeRates
    });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching exchange rates'
      }
    });
  }
});

// Add manual exchange rate (admin only)
// In a real implementation, we would check for admin role
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      fromCurrency,
      toCurrency,
      rate,
      date,
      source
    } = req.body;

    // Validate input
    if (!fromCurrency || !toCurrency || !rate || !date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required: fromCurrency, toCurrency, rate, date'
        }
      });
    }

    // Validate rate is positive
    if (parseFloat(rate) <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RATE',
          message: 'Exchange rate must be a positive number'
        }
      });
    }

    // Create exchange rate
    const exchangeRate = await prisma.exchangeRate.create({
      data: {
        fromCurrency,
        toCurrency,
        rate: parseFloat(rate),
        date: new Date(date),
        source: source || 'Manual'
      }
    });

    res.status(201).json({
      success: true,
      data: exchangeRate,
      message: 'Exchange rate added successfully'
    });
  } catch (error) {
    console.error('Add exchange rate error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while adding the exchange rate'
      }
    });
  }
});

module.exports = router;