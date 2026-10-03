import crypto from 'node:crypto';
import User from '../models/User.js';

export async function identity(req, res, next) {
  try {
    const anonymousId = String(req.get('x-anonymous-id') || '').trim();
    if (!anonymousId || anonymousId.length > 100) {
      return res.status(400).json({ error: 'A valid x-anonymous-id header is required.' });
    }

    if (User.db.readyState !== 1) {
      req.user = { _id: anonymousId, anonymousId };
      return next();
    }

    req.user = await User.findOneAndUpdate(
      { anonymousId },
      { $setOnInsert: { anonymousId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return next();
  } catch (error) {
    return next(error);
  }
}

export function newAnonymousId() {
  return crypto.randomUUID();
}