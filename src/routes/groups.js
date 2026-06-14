const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// Get list of groups for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get groups where user is a member
    const groups = await prisma.group.findMany({
      where: {
        groupMemberships: {
          some: {
            userId: userId,
            leftAt: null // Currently active members
          }
        }
      },
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            groupMemberships: true,
            expenses: true
          }
        }
      }
    });

    // Get total count for pagination
    const total = await prisma.group.count({
      where: {
        groupMemberships: {
          some: {
            userId: userId,
            leftAt: null
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        groups,
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
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching groups'
      }
    });
  }
});

// Create a new group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, currency } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Group name is required'
        }
      });
    }

    // Create group
    const group = await prisma.group.create({
      data: {
        name,
        description,
        currency: currency || 'USD',
        createdByUserId: userId
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Automatically add creator as group member
    await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: userId,
        joinedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: group,
      message: 'Group created successfully'
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while creating the group'
      }
    });
  }
});

// Get group details
router.get('/:groupId', authMiddleware, async (req, res) => {
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

    // Get group details with members
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        groupMemberships: {
          where: {
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
        }
      }
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

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching group details'
      }
    });
  }
});

// Update group details
router.put('/:groupId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const { name, description, currency } = req.body;

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

    // Update group
    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: name || undefined,
        description: description || undefined,
        currency: currency || undefined
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: group,
      message: 'Group updated successfully'
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while updating the group'
      }
    });
  }
});

// Delete group
router.delete('/:groupId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;

    // Check if user is the creator of the group
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

    if (group.createdByUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Only the group creator can delete the group'
        }
      });
    }

    // Check if group has any expenses
    const expenseCount = await prisma.expense.count({
      where: { groupId }
    });

    if (expenseCount > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'GROUP_HAS_EXPENSES',
          message: 'Cannot delete group that contains expenses'
        }
      });
    }

    // Delete group (cascade will handle related records based on Prisma settings)
    await prisma.group.delete({
      where: { id: groupId }
    });

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while deleting the group'
      }
    });
  }
});

// Get group members
router.get('/:groupId/members', authMiddleware, async (req, res) => {
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

    // Get group members with membership details
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

    res.status(200).json({
      success: true,
      data: members.map(m => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        joinedAt: m.joinedAt
      }))
    });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching group members'
      }
    });
  }
});

// Invite user to group by email
router.post('/:groupId/members', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const { email } = req.body;

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
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required'
        }
      });
    }

    // Find user by email
    const userToInvite = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToInvite) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User with this email not found'
        }
      });
    }

    // Check if user is already a member
    const existingMembership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId: userToInvite.id
      }
    });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_ALREADY_MEMBER',
          message: 'User is already a member of the group'
        }
      });
    }

    // In a real implementation, we would send an invitation email
    // For now, we'll just create the membership (assuming auto-accept for simplicity)
    // In production, this should create an invitation record that needs to be accepted
    const newMembership = await prisma.groupMembership.create({
      data: {
        groupId,
        userId: userToInvite.id,
        joinedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: {
        invitationId: newMembership.id,
        user: {
          id: userToInvite.id,
          name: userToInvite.name,
          email: userToInvite.email
        }
      },
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while inviting user to group'
      }
    });
  }
});

// Remove user from group
router.delete('/:groupId/members/:userId', authMiddleware, async (req, res) => {
  try {
    const requestingUserId = req.user.userId;
    const { groupId, userId } = req.params;

    // Check if requesting user is member of the group
    const requestingMembership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId: requestingUserId,
        leftAt: null
      }
    });

    if (!requestingMembership) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You are not a member of this group'
        }
      });
    }

    // Check if target user is member of the group
    const targetMembership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId
      }
    });

    if (!targetMembership) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_MEMBER',
          message: 'User is not a member of the group'
        }
      });
    }

    // Prevent removing the last member
    const memberCount = await prisma.groupMembership.count({
      where: {
        groupId,
        leftAt: null
      }
    });

    if (memberCount <= 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LAST_MEMBER_CANNOT_REMOVE',
          message: 'Cannot remove the last member from the group'
        }
      });
    }

    // Update membership to set leave date
    await prisma.groupMembership.updateMany({
      where: {
        groupId,
        userId
      },
      data: {
        leftAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'User removed from group successfully'
    });
  } catch (error) {
    console.error('Remove user from group error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while removing user from group'
      }
    });
  }
});

module.exports = router;