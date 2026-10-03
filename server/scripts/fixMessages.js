import mongoose from 'mongoose';
import 'dotenv/config';
import { toText } from '../src/utils/toText.js';

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('MONGO_URI is required.');
  process.exit(1);
}

await mongoose.connect(mongoUri);
const chats = mongoose.connection.collection('chats');
let fixedDocuments = 0;
let fixedMessages = 0;

for await (const chat of chats.find({ 'messages.content': { $exists: true } })) {
  let changed = false;
  const messages = (chat.messages || []).map((message) => {
    const content = toText(message.content);
    if (typeof message.content !== 'string' || content !== message.content) {
      changed = true;
      fixedMessages += 1;
    }
    return content ? { ...message, content } : null;
  }).filter(Boolean);

  if (changed) {
    await chats.updateOne({ _id: chat._id }, { $set: { messages } });
    fixedDocuments += 1;
  }
}

console.info(`Fixed ${fixedMessages} messages across ${fixedDocuments} chat documents.`);
await mongoose.disconnect();