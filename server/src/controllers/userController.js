export function getPreferences(req, res) { res.json(req.user.preferences || {}); }
export async function savePreferences(req, res, next) {
  try {
    const allowed = ['theme', 'wallpaper', 'fontSize', 'ttsVoice', 'ttsRate', 'language', 'highContrast', 'dyslexiaFriendly', 'autoRead'];
    const preferences = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (req.user.save) { req.user.preferences = { ...(req.user.preferences?.toObject ? req.user.preferences.toObject() : req.user.preferences), ...preferences }; await req.user.save(); }
    res.json({ ...req.user.preferences, ...preferences });
  } catch (error) { next(error); }
}

export function getProgress(req, res) { res.json(req.user.preferences?.progress || {}); }
export async function saveProgress(req, res, next) {
  try {
    const allowed = ['streak', 'lastActiveDate', 'xp', 'level', 'badges', 'questionsAsked', 'askedByVoice'];
    const progress = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (req.user.save) {
      if (!req.user.preferences) req.user.preferences = {};
      const existing = req.user.preferences.progress ? (req.user.preferences.progress.toObject ? req.user.preferences.progress.toObject() : req.user.preferences.progress) : {};
      req.user.preferences.progress = { ...existing, ...progress };
      req.user.markModified('preferences');
      await req.user.save();
      res.json(req.user.preferences.progress);
    } else {
      res.json(progress);
    }
  } catch (error) { next(error); }
}