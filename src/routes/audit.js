const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// Get audit log entries (admin only)
// In a real implementation, we would check for admin role
router.get('/log', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { entityType, entityId, userId: filterUserId, startDate, endDate, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause = {};

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (entityId) {
      whereClause.entityId = entityId;
    }

    if (filterUserId) {
      whereClause.userId = filterUserId;
    }

    if (startDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(endDate)
      };
    }

    // Get audit log entries
    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      skip,
      take: limitNum,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get total count for pagination
    const total = await prisma.auditLog.count({
      where: whereClause
    });

    res.status(200).json({
      success: true,
      data: {
        auditLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching audit log entries'
      }
    });
  }
});

module.exports = router;