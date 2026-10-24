import RequestHistory from '../models/RequestHistory.js';

export async function listHistory(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filter = { ownerId: req.user.id };

    if (req.query.method) {
      filter.method = req.query.method.toUpperCase();
    }

    if (req.query.status) {
      filter.statusCode = parseInt(req.query.status, 10);
    }

    const [history, total] = await Promise.all([
      RequestHistory.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      RequestHistory.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function clearHistory(req, res, next) {
  try {
    await RequestHistory.deleteMany({ ownerId: req.user.id });

    return res.status(200).json({
      success: true,
      message: 'Execution history cleared successfully',
    });
  } catch (err) {
    next(err);
  }
}
