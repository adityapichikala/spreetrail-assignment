const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// Get expenses for a group
router.get('/:groupId/expenses', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { startDate, endDate, payerId, participantId } = req.query;

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
      ...(endDate && { date: { lte: new Date(endDate) } }),
      ...(payerId && { payerId }),
      ...(participantId && {
        participants: {
          some: {
            userId: participantId
          }
        }
      })
    };

    // Get expenses
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        date: 'desc'
      },
      include: {
        payer: {
          select: {
            id: true,
            name: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Get total count for pagination
    const total = await prisma.expense.count({
      where: whereClause
    });

    res.status(200).json({
      success: true,
      data: {
        expenses,
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
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching expenses'
      }
    });
  }
});

// Create a new expense
router.post('/:groupId/expenses', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const {
      payerId,
      amount,
      currency,
      date,
      description,
      splitType,
      participants
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
    if (!payerId || !amount || !currency || !date || !description || !splitType || !participants) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required: payerId, amount, currency, date, description, splitType, participants'
        }
      });
    }

    // Validate splitType
    const validSplitTypes = ['EQUAL', 'PERCENTAGE', 'EXACT', 'UNEQUAL'];
    if (!validSplitTypes.includes(splitType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SPLIT_TYPE',
          message: `Split type must be one of: ${validSplitTypes.join(', ')}`
        }
      });
    }

    // Verify payer is group member on expense date
    const payerMembership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId: payerId,
        joinedAt: { lte: new Date(date) },
        ...(new Date(date) !== null && { leftAt: { gt: new Date(date) } })
      }
    });

    if (!payerMembership) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYER_NOT_ACTIVE_MEMBER',
          message: 'Payer must be an active group member on the expense date'
        }
      });
    }

    // Verify all participants are group members on expense date
    for (const participant of participants) {
      const participantMembership = await prisma.groupMembership.findFirst({
        where: {
          groupId,
          userId: participant.userId,
          joinedAt: { lte: new Date(date) },
          ...(new Date(date) !== null && { leftAt: { gt: new Date(date) } })
        }
      });

      if (!participantMembership) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PARTICIPANT_NOT_ACTIVE_MEMBER',
            message: `Participant with ID ${participant.userId} is not an active group member on the expense date`
          }
        });
      }
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        groupId,
        payerId,
        amount: parseFloat(amount),
        currency,
        date: new Date(date),
        description,
        splitType,
        createdByUserId: userId
      }
    });

    // Create expense participants
    const participantPromises = participants.map(p => {
      return prisma.expenseParticipant.create({
        data: {
          expenseId: expense.id,
          userId: p.userId,
          percentage: splitType === 'PERCENTAGE' ? parseFloat(p.percentage) : undefined,
          amount: splitType === 'EXACT' ? parseFloat(p.amount) : undefined,
          notes: p.notes
        }
      });
    });

    await Promise.all(participantPromises);

    // Get created expense with relations
    const createdExpense = await prisma.expense.findUnique({
      where: { id: expense.id },
      include: {
        payer: {
          select: {
            id: true,
            name: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: createdExpense,
      message: 'Expense created successfully'
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while creating the expense'
      }
    });
  }
});

// Get expense details
router.get('/:groupId/expenses/:expenseId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId, expenseId } = req.params;

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

    // Get expense details
    const expense = await prisma.expense.findUnique({
      where: {
        id: expenseId,
        groupId
      },
      include: {
        payer: {
          select: {
            id: true,
            name: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPENSE_NOT_FOUND',
          message: 'Expense not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Get expense details error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching expense details'
      }
    });
  }
});

// Update expense
router.put('/:groupId/expenses/:expenseId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId, expenseId } = req.params;
    const {
      payerId,
      amount,
      currency,
      date,
      description,
      splitType,
      participants
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

    // Check if user is the creator of the expense
    const expense = await prisma.expense.findUnique({
      where: {
        id: expenseId,
        groupId
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPENSE_NOT_FOUND',
          message: 'Expense not found'
        }
      });
    }

    if (expense.createdByUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Only the expense creator can update the expense'
        }
      });
    }

    // Validate input
    if (!payerId || !amount || !currency || !date || !description || !splitType || !participants) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required: payerId, amount, currency, date, description, splitType, participants'
        }
      });
    }

    // Validate splitType
    const validSplitTypes = ['EQUAL', 'PERCENTAGE', 'EXACT', 'UNEQUAL'];
    if (!validSplitTypes.includes(splitType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SPLIT_TYPE',
          message: `Split type must be one of: ${validSplitTypes.join(', ')}`
        }
      });
    }

    // Verify payer is group member on expense date
    const payerMembership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId: payerId,
        joinedAt: { lte: new Date(date) },
        ...(new Date(date) !== null && { leftAt: { gt: new Date(date) } })
      }
    });

    if (!payerMembership) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYER_NOT_ACTIVE_MEMBER',
          message: 'Payer must be an active group member on the expense date'
        }
      });
    }

    // Verify all participants are group members on expense date
    for (const participant of participants) {
      const participantMembership = await prisma.groupMembership.findFirst({
        where: {
          groupId,
          userId: participant.userId,
          joinedAt: { lte: new Date(date) },
          ...(new Date(date) !== null && { leftAt: { gt: new Date(date) } })
        }
      });

      if (!participantMembership) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PARTICIPANT_NOT_ACTIVE_MEMBER',
            message: `Participant with ID ${participant.userId} is not an active group member on the expense date`
          }
        });
      }
    }

    // Update expense
    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        payerId,
        amount: parseFloat(amount),
        currency,
        date: new Date(date),
        description,
        splitType
      }
    });

    // Delete existing participants
    await prisma.expenseParticipant.deleteMany({
      where: { expenseId }
    });

    // Create new expense participants
    const participantPromises = participants.map(p => {
      return prisma.expenseParticipant.create({
        data: {
          expenseId,
          userId: p.userId,
          percentage: splitType === 'PERCENTAGE' ? parseFloat(p.percentage) : undefined,
          amount: splitType === 'EXACT' ? parseFloat(p.amount) : undefined,
          notes: p.notes
        }
      });
    });

    await Promise.all(participantPromises);

    // Get updated expense with relations
    const updatedExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        payer: {
          select: {
            id: true,
            name: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedExpense,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while updating the expense'
      }
    });
  }
});

// Delete expense
router.delete('/:groupId/expenses/:expenseId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId, expenseId } = req.params;

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

    // Check if user is the creator of the expense
    const expense = await prisma.expense.findUnique({
      where: {
        id: expenseId,
        groupId
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPENSE_NOT_FOUND',
          message: 'Expense not found'
        }
      });
    }

    if (expense.createdByUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Only the expense creator can delete the expense'
        }
      });
    }

    // Check if expense has any settlements that depend on it
    // In a more complex implementation, we might check for dependencies
    // For now, we'll allow deletion

    // Delete expense participants first
    await prisma.expenseParticipant.deleteMany({
      where: { expenseId }
    });

    // Delete expense
    await prisma.expense.delete({
      where: { id: expenseId }
    });

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while deleting the expense'
      }
    });
  }
});

module.exports = router;