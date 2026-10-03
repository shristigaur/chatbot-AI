import crypto from 'node:crypto';
import Chat from '../models/Chat.js';
import { predictCharacters, streamReply } from '../services/aiService.js';
import { toText } from '../utils/toText.js';

const memoryChats = new Map();
const historyCache = new Map();

function userKey(req) { return String(req.user._id); }

export async function streamChat(req, res, next) {
  let headersSent = false;
  try {
    const { chatId, message, ageFilter = 'Adult', activeCharacter = null } = req.body;
    const previous = await getChat(chatId, req);
    const messages = [...(previous?.messages || []), { role: 'user', content: toText(message) }];
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    headersSent = true;
    let disconnected = false;
    req.on('close', () => { disconnected = true; });
    const reply = toText(await streamReply({ messages, ageFilter, character: activeCharacter, onText: (token) => { if (!disconnected && typeof token === 'string') res.write(`data: ${JSON.stringify({ token, type: 'token', text: token })}\n\n`); } }));
    if (!reply) throw new Error('The AI returned an empty reply.');
    const updated = await saveChat(req, previous, { message, reply, ageFilter, activeCharacter });
    if (!disconnected) {
      res.write(`data: ${JSON.stringify({ done: true, type: 'done', reply, chatId: updated?.id || chatId || null })}\n\n`);
      res.end();
    }
  } catch (error) {
    if (headersSent && !res.writableEnded) {
      const readableError = error.message || 'AI request failed.';
      const friendlyError = `Sorry, I could not complete that request: ${readableError}`;
      res.write(`data: ${JSON.stringify({ error: readableError })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'token', text: friendlyError })}\n\n`);
      return res.end();
    }
    return next(error);
  }
}

export async function getCharacters(req, res, next) {
  try { res.json({ characters: await predictCharacters(req.body.messages || [], req.body.ageFilter || 'Adult') }); } catch (error) { next(error); }
}

export async function listChats(req, res, next) {
  try {
    const key = userKey(req);
    const cached = historyCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return res.json(cached.value);
    const chats = Chat.db.readyState === 1
      ? await Chat.find({ userId: req.user._id }).select('title ageFilter activeCharacter createdAt updatedAt').sort({ updatedAt: -1 }).lean()
      : [...memoryChats.values()].filter((chat) => chat.userId === key).reverse().map(({ id, title, ageFilter, activeCharacter, createdAt, updatedAt }) => ({ id, title, ageFilter, activeCharacter, createdAt, updatedAt }));
    historyCache.set(key, { value: chats, expiresAt: Date.now() + 3000 });
    return res.json(chats);
  } catch (error) { return next(error); }
}

export async function getChatById(req, res, next) {
  try { const chat = await getChat(req.params.id, req); if (!chat) return res.status(404).json({ error: 'Chat not found.' }); return res.json(chat); } catch (error) { next(error); }
}

export async function updateChat(req, res, next) {
  try {
    const updates = {};
    if (req.body.title) updates.title = req.body.title.slice(0, 120);
    if (req.body.ageFilter) updates.ageFilter = req.body.ageFilter;
    if (req.body.activeCharacter) updates.activeCharacter = req.body.activeCharacter;
    const chat = Chat.db.readyState === 1 ? await Chat.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, updates, { new: true }) : Object.assign(memoryChats.get(req.params.id), updates);
    return res.json(chat);
  } catch (error) { next(error); }
}

export async function deleteChat(req, res, next) {
  try { if (Chat.db.readyState === 1) await Chat.deleteOne({ _id: req.params.id, userId: req.user._id }); else memoryChats.delete(req.params.id); return res.status(204).end(); } catch (error) { next(error); }
}

export async function clearChats(req, res, next) {
  try { if (Chat.db.readyState === 1) await Chat.deleteMany({ userId: req.user._id }); else [...memoryChats].forEach(([key, chat]) => { if (chat.userId === userKey(req)) memoryChats.delete(key); }); return res.status(204).end(); } catch (error) { next(error); }
}

async function getChat(id, req) {
  if (!id) return null;
  return Chat.db.readyState === 1 ? Chat.findOne({ _id: id, userId: req.user._id }) : memoryChats.get(id);
}

async function saveChat(req, previous, { message, reply, ageFilter, activeCharacter }) {
  if (Chat.db.readyState === 1) {
    const chat = previous || new Chat({ userId: req.user._id, title: message.slice(0, 52), ageFilter, activeCharacter });
    chat.messages.push({ role: 'user', content: toText(message) }, { role: 'assistant', content: toText(reply) });
    chat.ageFilter = ageFilter;
    chat.activeCharacter = activeCharacter;
    return chat.save();
  }
  const id = previous?.id || crypto.randomUUID();
  const chat = previous || { id, userId: userKey(req), title: message.slice(0, 52), messages: [] };
  chat.messages.push({ role: 'user', content: toText(message) }, { role: 'assistant', content: toText(reply) });
  memoryChats.set(id, chat);
  historyCache.delete(userKey(req));
  return chat;
}