const express = require('express');
const resourceController = require('../controllers/resourceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Resource Routes
 */

// Get all resources
router.get('/', resourceController.getAllResources);

// Get resource by ID
router.get('/:id', resourceController.getResourceById);

// Get resources by type
router.get('/type/:type', resourceController.getResourcesByType);

// Create resource (admin only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  resourceController.createResource
);

// Update resource (admin only)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  resourceController.updateResource
);

// Delete resource (admin only)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  resourceController.deleteResource
);

module.exports = router;
