import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  streak: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: '' },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: { type: [String], default: [] },
  questionsAsked: { type: Number, default: 0 },
  askedByVoice: { type: Number, default: 0 }
}, { _id: false });

const preferencesSchema = new mongoose.Schema({
  theme: { type: String, default: 'light' },
  wallpaper: { type: String, default: 'aurora' },
  fontSize: { type: String, default: 'normal' },
  ttsVoice: { type: String, default: '' },
  ttsRate: { type: Number, default: 1 },
  language: { type: String, default: 'en-US' },
  highContrast: { type: Boolean, default: false },
  dyslexiaFriendly: { type: Boolean, default: false },
  autoRead: { type: Boolean, default: false },
  progress: { type: progressSchema, default: () => ({}) }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, default: 'Guest' },
  email: String,
  anonymousId: { type: String, unique: true, required: true },
  preferences: { type: preferencesSchema, default: () => ({}) },
}, { timestamps: true });

export default mongoose.model('User', userSchema);