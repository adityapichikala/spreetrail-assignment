const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// Get settlement history for a group
router.get('/:groupId/settlements', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { startDate, endDate } = req.query;

    // Check if user is member of the group
    const membership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId: userId,
        leftAt: null
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You are not a member of this group'
        }
      });
    }

    // Build where clause
    const whereClause = {
      groupId,
      ...(startDate && { date: { gte: new Date(startDate) } }),
      ...(endDate && { date: { lte: new Date(endDate) } })
    };

    // Get settlements
    const settlements = await prisma.settlement.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        date: 'desc'
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true
          }
        },
        toUser: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get total count for pagination
    const total = await prisma.settlement.count({
      where: whereClause
    });

    res.status(200).json({
      success: true,
      data: {
        settlements,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching settlements'
      }
    });
  }
});

// Record a settlement
router.post('/:groupId/settlements', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const {
      fromUserId,
      toUserId,
      amount,
      currency,
      date,
      description
    } = req.body;

    // Check if user is member of the group
    const membership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId: userId,
        leftAt: null
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You are not a member of this group'
        }
      });
    }

    // Validate input
    if (!fromUserId || !toUserId || !amount || !currency || !date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required: fromUserId, toUserId, amount, currency, date'
        }
      });
    }

    // Verify fromUser is group member on settlement date
    const fromUserMembership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId: fromUserId,
        joinedAt: { lte: new Date(date) },
        ...(new Date(date) !== null && { leftAt: { gt: new Date(date) } })
      }
    });

    if (!fromUserMembership) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FROM_USER_NOT_ACTIVE_MEMBER',
          message: 'From user must be an active group member on the settlement date'
        }
      });
    }

    // Verify toUser is group member on settlement date
    const toUserMembership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId: toUserId,
        joinedAt: { lte: new Date(date) },
        ...(new Date(date) !== null && { leftAt: { gt: new Date(date) } })
      }
    });

    if (!toUserMembership) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TO_USER_NOT_ACTIVE_MEMBER',
          message: 'To user must be an active group member on the settlement date'
        }
      });
    }

    // Prevent self-settlement
    if (fromUserId === toUserId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SELF_SETTLEMENT_NOT_ALLOWED',
          message: 'Cannot create a settlement from and to the same user'
        }
      });
    }

    // Create settlement
    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        fromUserId,
        toUserId,
        amount: parseFloat(amount),
        currency,
        date: new Date(date),
        description: description || null,
        createdByUserId: userId
      }
    });

    // Get created settlement with relations
    const createdSettlement = await prisma.settlement.findUnique({
      where: { id: settlement.id },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true
          }
        },
        toUser: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: createdSettlement,
      message: 'Settlement recorded successfully'
    });
  } catch (error) {
    console.error('Create settlement error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while recording the settlement'
      }
    });
  }
});

module.exports = router;