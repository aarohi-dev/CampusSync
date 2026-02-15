const ResourceModel = require('../models/resourceModel');
const AuditLogModel = require('../models/auditLogModel');

/**
 * Resource Controller
 */

class ResourceController {
  /**
   * Get all resources
   */
  static async getAllResources(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const filters = {};
      if (req.query.type) filters.type = req.query.type;
      if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';

      const resources = await ResourceModel.getAll(filters, limit, offset);

      return res.status(200).json({
        success: true,
        data: resources,
        pagination: {
          page,
          limit,
          total: resources.length,
        },
      });
    } catch (error) {
      console.error('Fetch resources error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching resources',
        error: error.message,
      });
    }
  }

  /**
   * Get single resource
   */
  static async getResourceById(req, res) {
    try {
      const { id } = req.params;

      const resource = await ResourceModel.getById(id);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: resource,
      });
    } catch (error) {
      console.error('Fetch resource error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching resource',
        error: error.message,
      });
    }
  }

  /**
   * Create a new resource (admin only)
   */
  static async createResource(req, res) {
    try {
      const { name, type, location, capacity } = req.body;
      const adminId = req.user.id;

      // Validation
      if (!name || !type || !location || !capacity) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
      }

      const validTypes = ['lab', 'seminar_hall', 'projector'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        });
      }

      if (capacity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Capacity must be at least 1',
        });
      }

      // Create resource
      const resourceId = await ResourceModel.create(name, type, location, capacity);

      // Log action
      await AuditLogModel.create('RESOURCE_CREATED', adminId, resourceId, null, {
        name,
        type,
        location,
        capacity,
      });

      const resource = await ResourceModel.getById(resourceId);

      return res.status(201).json({
        success: true,
        message: 'Resource created successfully',
        data: resource,
      });
    } catch (error) {
      console.error('Create resource error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating resource',
        error: error.message,
      });
    }
  }

  /**
   * Update resource (admin only)
   */
  static async updateResource(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const updateData = req.body;

      // Validate resource exists
      const resource = await ResourceModel.getById(id);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // Validate type if provided
      if (updateData.type) {
        const validTypes = ['lab', 'seminar_hall', 'projector'];
        if (!validTypes.includes(updateData.type)) {
          return res.status(400).json({
            success: false,
            message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
          });
        }
      }

      // Validate capacity if provided
      if (updateData.capacity && updateData.capacity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Capacity must be at least 1',
        });
      }

      // Update resource
      const updated = await ResourceModel.update(id, updateData);

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'No changes made to resource',
        });
      }

      // Log action
      await AuditLogModel.create('RESOURCE_UPDATED', adminId, id, null, {
        changes: updateData,
      });

      const updatedResource = await ResourceModel.getById(id);

      return res.status(200).json({
        success: true,
        message: 'Resource updated successfully',
        data: updatedResource,
      });
    } catch (error) {
      console.error('Update resource error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating resource',
        error: error.message,
      });
    }
  }

  /**
   * Delete resource (admin only)
   */
  static async deleteResource(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      // Validate resource exists
      const resource = await ResourceModel.getById(id);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // Delete resource
      const deleted = await ResourceModel.delete(id);

      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete resource',
        });
      }

      // Log action
      await AuditLogModel.create('RESOURCE_DELETED', adminId, id, null, {
        name: resource.name,
        type: resource.type,
      });

      return res.status(200).json({
        success: true,
        message: 'Resource deleted successfully',
      });
    } catch (error) {
      console.error('Delete resource error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting resource',
        error: error.message,
      });
    }
  }

  /**
   * Get resources by type
   */
  static async getResourcesByType(req, res) {
    try {
      const { type } = req.params;

      const validTypes = ['lab', 'seminar_hall', 'projector'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        });
      }

      const resources = await ResourceModel.getByType(type);

      return res.status(200).json({
        success: true,
        data: resources,
      });
    } catch (error) {
      console.error('Fetch resources by type error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching resources',
        error: error.message,
      });
    }
  }
}

module.exports = ResourceController;
