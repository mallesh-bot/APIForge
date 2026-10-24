import Collection from '../models/Collection.js';
import SavedRequest from '../models/SavedRequest.js';

export async function listCollections(req, res, next) {
  try {
    const collections = await Collection.find({ ownerId: req.user.id }).sort({ createdAt: -1 });

    // Aggregate saved request count per collection
    const collectionIds = collections.map((c) => c._id);
    const requestCounts = await SavedRequest.aggregate([
      { $match: { collectionId: { $in: collectionIds }, ownerId: req.user.id } },
      { $group: { _id: '$collectionId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    requestCounts.forEach((r) => {
      countMap[r._id.toString()] = r.count;
    });

    const enriched = collections.map((col) => {
      const json = col.toJSON();
      json.requestCount = countMap[col._id.toString()] || 0;
      return json;
    });

    return res.status(200).json({
      success: true,
      collections: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function createCollection(req, res, next) {
  try {
    const { name, description = '' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Collection name is required',
      });
    }

    const collection = await Collection.create({
      ownerId: req.user.id,
      name: name.trim(),
      description: description.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      collection,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCollection(req, res, next) {
  try {
    const collection = await Collection.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    const requests = await SavedRequest.find({
      collectionId: collection._id,
      ownerId: req.user.id,
    }).sort({ order: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      collection: {
        ...collection.toJSON(),
        requests,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCollection(req, res, next) {
  try {
    const { name, description } = req.body;

    const collection = await Collection.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    if (name !== undefined) collection.name = name.trim();
    if (description !== undefined) collection.description = description.trim();

    await collection.save();

    return res.status(200).json({
      success: true,
      message: 'Collection updated successfully',
      collection,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCollection(req, res, next) {
  try {
    const collection = await Collection.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    // Cascade delete all requests in this collection
    await SavedRequest.deleteMany({
      collectionId: collection._id,
      ownerId: req.user.id,
    });

    await Collection.deleteOne({ _id: collection._id });

    return res.status(200).json({
      success: true,
      message: 'Collection and associated requests deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
