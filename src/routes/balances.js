const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// Get current balances for all members in a group
router.get('/groups/:groupId/balances', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;

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

    // Get group details
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found'
        }
      });
    }

    // Get all active members of the group
    const members = await prisma.groupMembership.findMany({
      where: {
        groupId,
        leftAt: null
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

    // Calculate balances for each member
    const balances = await Promise.all(
      members.map(async (membership) => {
        const userId = membership.userId;
        const user = membership.user;

        // Get all expenses for the group where the user was an active member at the time
        const expenses = await prisma.expense.findMany({
          where: {
            groupId,
            // Expense date must be within user's membership period
            date: {
              gte: membership.joinedAt,
              ...(membership.leftAt !== null ? { lte: membership.leftAt } : {})
            }
          }
        });

        let balance = 0;
        const breakdown = [];

        // Process each expense
        for (const expense of expenses) {
          // Convert expense amount to group currency if needed
          const expenseAmountInGroupCurrency = expense.amount * (expense.exchangeRate || 1);

          // Find user's participation in this expense
          const participant = await prisma.expenseParticipant.findFirst({
            where: {
              expenseId: expense.id,
              userId: userId
            }
          });

          let userShare = 0;
          if (participant) {
            // Calculate share based on split type
            if (expense.splitType === 'EQUAL') {
              // Equal split: divide by number of participants
              const participantCount = await prisma.expenseParticipant.count({
                where: { expenseId: expense.id }
              });
              userShare = expenseAmountInGroupCurrency / participantCount;
            } else if (expense.splitType === 'PERCENTAGE') {
              // Percentage split: use percentage field
              userShare = expenseAmountInGroupCurrency * (participant.percentage || 0) / 100;
            } else if (expense.splitType === 'EXACT') {
              // Exact split: use amount field
              userShare = participant.amount || 0;
            } else if (expense.splitType === 'UNEQUAL') {
              // Unequal split: use either percentage or amount
              if (participant.percentage) {
                userShare = expenseAmountInGroupCurrency * participant.percentage / 100;
              } else if (participant.amount) {
                userShare = participant.amount;
              }
            }
          }

          // If user is the payer, they paid the full amount (negative share for them)
          if (expense.payerId === userId) {
            userShare = -expenseAmountInGroupCurrency;
          }

          // Add to balance
          balance += userShare;

          // Add to breakdown if user has a non-zero share
          if (Math.abs(userShare) > 0.001) { // Avoid near-zero amounts due to floating point
            breakdown.push({
              expenseId: expense.id,
              description: expense.description,
              amount: expense.amount,
              currency: expense.currency,
              share: userShare,
              settlements: [] // Would be populated with related settlements in a full implementation
            });
          }
        }
      })
    );

    // Flatten the balances array (since we used Promise.all with map)
    const flatBalances = balances.flat();

    res.status(200).json({
      success: true,
      data: flatBalances
    });
  } catch (error) {
    console.error('Get group balances error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while calculating group balances'
      }
    });
  }
});

// Get balances for a user across all groups
router.get('/users/:userId/balances', authMiddleware, async (req, res) => {
  try {
    const requestingUserId = req.user.userId;
    const { userId } = req.params;

    // Users can only view their own balances
    if (requestingUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only view your own balances'
        }
      });
    }

    // Get all group memberships for the user
    const memberships = await prisma.groupMembership.findMany({
      where: {
        userId,
        leftAt: null
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            currency: true
          }
        }
      }
    });

    // Calculate balances for each group
    const groupBalances = await Promise.all(
      memberships.map(async (membership) => {
        const groupId = membership.groupId;
        const group = membership.group;

        // Get all expenses for the group where the user was an active member at the time
        const expenses = await prisma.expense.findMany({
          where: {
            groupId,
            // Expense date must be within user's membership period
            date: {
              gte: membership.joinedAt,
              ...(membership.leftAt !== null ? { lte: membership.leftAt } : {})
            }
          }
        });

        let balance = 0;
        const breakdown = [];

        // Process each expense
        for (const expense of expenses) {
          // Convert expense amount to group currency if needed
          const expenseAmountInGroupCurrency = expense.amount * (expense.exchangeRate || 1);

          // Find user's participation in this expense
          const participant = await prisma.expenseParticipant.findFirst({
            where: {
              expenseId: expense.id,
              userId: userId
            }
          });

          let userShare = 0;
          if (participant) {
            // Calculate share based on split type
            if (expense.splitType === 'EQUAL') {
              // Equal split: divide by number of participants
              const participantCount = await prisma.expenseParticipant.count({
                where: { expenseId: expense.id }
              });
              userShare = expenseAmountInGroupCurrency / participantCount;
            } else if (expense.splitType === 'PERCENTAGE') {
              // Percentage split: use percentage field
              userShare = expenseAmountInGroupCurrency * (participant.percentage || 0) / 100;
            } else if (expense.splitType === 'EXACT') {
              // Exact split: use amount field
              userShare = participant.amount || 0;
            } else if (expense.splitType === 'UNEQUAL') {
              // Unequal split: use either percentage or amount
              if (participant.percentage) {
                userShare = expenseAmountInGroupCurrency * participant.percentage / 100;
              } else if (participant.amount) {
                userShare = participant.amount;
              }
            }
          }

          // If user is the payer, they paid the full amount (negative share for them)
          if (expense.payerId === userId) {
            userShare = -expenseAmountInGroupCurrency;
          }

          // Add to balance
          balance += userShare;

          // Add to breakdown if user has a non-zero share
          if (Math.abs(userShare) > 0.001) { // Avoid near-zero amounts due to floating point
            breakdown.push({
              expenseId: expense.id,
              description: expense.description,
              amount: expense.amount,
              currency: expense.currency,
              share: userShare,
              settlements: [] // Would be populated with related settlements in a full implementation
            });
          }
        }
      })
    );

    // Flatten the balances array
    const flatGroupBalances = groupBalances.flat();

    res.status(200).json({
      success: true,
      data: flatGroupBalances
    });
  } catch (error) {
    console.error('Get user balances error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while calculating user balances'
      }
    });
  }
});

module.exports = router;