export function getPreferences(req, res) { res.json(req.user.preferences || {}); }
export async function savePreferences(req, res, next) {
  try {
    const allowed = ['theme', 'wallpaper', 'fontSize', 'ttsVoice', 'ttsRate', 'language', 'highContrast', 'dyslexiaFriendly', 'autoRead'];
    const preferences = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (req.user.save) { req.user.preferences = { ...req.user.preferences.toObject(), ...preferences }; await req.user.save(); }
    res.json({ ...req.user.preferences, ...preferences });
  } catch (error) { next(error); }
}