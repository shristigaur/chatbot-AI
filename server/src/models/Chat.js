import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, maxlength: 20000 },
  characters: { type: Array, default: [] },
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'New conversation', maxlength: 120 },
  ageFilter: { type: String, default: 'Adult' },
  activeCharacter: { type: Object, default: null },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

chatSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('Chat', chatSchema);