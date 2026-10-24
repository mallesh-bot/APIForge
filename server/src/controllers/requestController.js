import SavedRequest from '../models/SavedRequest.js';
import Collection from '../models/Collection.js';

export async function listRequests(req, res, next) {
  try {
    const filter = { ownerId: req.user.id };
    if (req.query.collectionId) {
      filter.collectionId = req.query.collectionId;
    }

    const requests = await SavedRequest.find(filter).sort({ order: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    next(err);
  }
}

export async function createRequest(req, res, next) {
  try {
    const {
      collectionId,
      name,
      method = 'GET',
      urlTemplate = '',
      params = [],
      headers = [],
      auth = { type: 'none' },
      body = { type: 'none', content: '' },
      assertions = [],
      description = '',
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Request name is required',
      });
    }

    if (!collectionId) {
      return res.status(400).json({
        success: false,
        message: 'collectionId is required',
      });
    }

    // Verify collection ownership
    const collection = await Collection.findOne({
      _id: collectionId,
      ownerId: req.user.id,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Target collection not found or does not belong to you',
      });
    }

    const maxOrderDoc = await SavedRequest.findOne({
      collectionId,
      ownerId: req.user.id,
    }).sort({ order: -1 });

    const order = maxOrderDoc ? maxOrderDoc.order + 1 : 0;

    const savedRequest = await SavedRequest.create({
      ownerId: req.user.id,
      collectionId,
      name: name.trim(),
      method: method.toUpperCase(),
      urlTemplate,
      params,
      headers,
      auth,
      body,
      assertions,
      order,
      description,
    });

    return res.status(201).json({
      success: true,
      message: 'Request saved successfully',
      request: savedRequest,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRequest(req, res, next) {
  try {
    const request = await SavedRequest.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    return res.status(200).json({
      success: true,
      request,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateRequest(req, res, next) {
  try {
    const request = await SavedRequest.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    const {
      name,
      method,
      urlTemplate,
      params,
      headers,
      auth,
      body,
      assertions,
      order,
      description,
      collectionId,
    } = req.body;

    if (name !== undefined) request.name = name.trim();
    if (method !== undefined) request.method = method.toUpperCase();
    if (urlTemplate !== undefined) request.urlTemplate = urlTemplate;
    if (params !== undefined) request.params = params;
    if (headers !== undefined) request.headers = headers;
    if (auth !== undefined) request.auth = auth;
    if (body !== undefined) request.body = body;
    if (assertions !== undefined) request.assertions = assertions;
    if (order !== undefined) request.order = order;
    if (description !== undefined) request.description = description;

    if (collectionId !== undefined && collectionId !== String(request.collectionId)) {
      const targetCol = await Collection.findOne({ _id: collectionId, ownerId: req.user.id });
      if (!targetCol) {
        return res.status(404).json({ success: false, message: 'Target collection not found' });
      }
      request.collectionId = collectionId;
    }

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Request updated successfully',
      request,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteRequest(req, res, next) {
  try {
    const request = await SavedRequest.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Request deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function duplicateRequest(req, res, next) {
  try {
    const original = await SavedRequest.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    const duplicate = await SavedRequest.create({
      ownerId: req.user.id,
      collectionId: original.collectionId,
      name: `${original.name} (Copy)`,
      method: original.method,
      urlTemplate: original.urlTemplate,
      params: original.params,
      headers: original.headers,
      auth: original.auth,
      body: original.body,
      assertions: original.assertions,
      order: original.order + 1,
      description: original.description,
    });

    return res.status(201).json({
      success: true,
      message: 'Request duplicated successfully',
      request: duplicate,
    });
  } catch (err) {
    next(err);
  }
}
