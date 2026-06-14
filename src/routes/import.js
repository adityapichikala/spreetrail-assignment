const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'text/csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

// Import expenses from CSV
router.post('/groups/:groupId/expenses/import', authMiddleware, upload.single('file'), async (req, res) => {
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No file uploaded'
        }
      });
    }

    // Create import batch record
    const importBatch = await prisma.importBatch.create({
      data: {
        userId,
        status: 'PENDING',
        metadata: {
          filename: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        }
      }
    });

    // In a real implementation, we would process the CSV asynchronously
    // For now, we'll return the batch ID and status endpoint
    res.status(202).json({
      success: true,
      data: {
        importBatchId: importBatch.id,
        status: importBatch.status,
        message: 'File uploaded successfully. Import processing started.'
      }
    });
  } catch (error) {
    console.error('Import expense error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while processing the import'
      }
    });
  }
});

// Get import batch status and results
router.get('/batches/:batchId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { batchId } = req.params;

    // Get import batch
    const importBatch = await prisma.importBatch.findUnique({
      where: { id: batchId },
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

    if (!importBatch) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'IMPORT_BATCH_NOT_FOUND',
          message: 'Import batch not found'
        }
      });
    }

    // Check if user owns this import batch
    if (importBatch.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to view this import batch'
        }
      });
    }

    // Get imported expenses with anomalies
    const importedExpenses = await prisma.importedExpense.findMany({
      where: { importBatchId: batchId },
      include: {
        importAnomalies: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        importBatch,
        importedExpenses
      }
    });
  } catch (error) {
    console.error('Get import batch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching import batch details'
      }
    });
  }
});

// Resolve an anomaly
router.post('/batches/:batchId/anomalies/:anomalyId/resolve', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { batchId, anomalyId } = req.params;
    const { action, manualData } = req.body;

    // Validate action
    const validActions = ['APPROVE_SUGGESTED', 'MANUAL_CORRECTION', 'SKIP_ROW'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Action must be one of: ${validActions.join(', ')}`
        }
      });
    }

    // Get import anomaly
    const importAnomaly = await prisma.importedAnomaly.findUnique({
      where: { id: anomalyId },
      include: {
        importedExpense: {
          include: {
            importBatch: true
          }
        }
      }
    });

    if (!importAnomaly) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'IMPORT_ANOMALY_NOT_FOUND',
          message: 'Import anomaly not found'
        }
      });
    }

    // Check if user owns this import batch
    if (importAnomaly.importedExpense.importBatch.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to resolve this anomaly'
        }
      });
    }

    // Check if anomaly is already resolved
    if (importAnomaly.userResolution) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ANOMALY_ALREADY_RESOLVED',
          message: 'This anomaly has already been resolved'
        }
      });
    }

    // Update anomaly with user resolution
    const updatedAnomaly = await prisma.importedAnomaly.update({
      where: { id: anomalyId },
      data: {
        userResolution: action,
        manualCorrectionData: manualData || null,
        resolvedAt: new Date(),
        resolvedBy: userId
      }
    });

    // If action is MANUAL_CORRECTION, we would update the imported expense data
    // For now, we'll just record the resolution

    res.status(200).json({
      success: true,
      data: updatedAnomaly,
      message: 'Anomaly resolved successfully'
    });
  } catch (error) {
    console.error('Resolve anomaly error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while resolving the anomaly'
      }
    });
  }
});

// Get import report
router.get('/batches/:batchId/report', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { batchId } = req.params;

    // Get import batch
    const importBatch = await prisma.importBatch.findUnique({
      where: { id: batchId },
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

    if (!importBatch) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'IMPORT_BATCH_NOT_FOUND',
          message: 'Import batch not found'
        }
      });
    }

    // Check if user owns this import batch
    if (importBatch.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to view this import report'
        }
      });
    }

    // Get imported expenses with anomalies for report
    const importedExpenses = await prisma.importedExpense.findMany({
      where: { importBatchId: batchId },
      include: {
        importAnomalies: true,
        expense: true
      }
    });

    // Calculate statistics
    const totalRows = importBatch.rowCount || 0;
    const importedCount = importBatch.importedCount || 0;
    const anomalyCount = importBatch.anomalyCount || 0;
    const skippedCount = importedExpenses.filter(exp => exp.status === 'SKIPPED').length;

    // Group anomalies by type
    const anomalyBreakdown = {};
    importedExpenses.forEach(exp => {
      exp.importAnomalies.forEach(anomaly => {
        if (!anomalyBreakdown[anomaly.anomalyType]) {
          anomalyBreakdown[anomaly.anomalyType] = {
            count: 0,
            actionsTaken: []
          };
        }
        anomalyBreakdown[anomaly.anomalyType].count++;

        if (anomaly.userResolution) {
          anomalyBreakdown[anomaly.anomalyType].actionsTaken.push(anomaly.userResolution);
        } else {
          anomalyBreakdown[anomaly.anomalyType].actionsTaken.push('PENDING');
        }
      });
    });

    res.status(200).json({
      success: true,
      data: {
        importBatch,
        statistics: {
          totalRows,
          importedCount,
          anomalyCount,
          skippedCount
        },
        anomalyBreakdown,
        importedExpenses
      }
    });
  } catch (error) {
    console.error('Get import report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while generating the import report'
      }
    });
  }
});

module.exports = router;