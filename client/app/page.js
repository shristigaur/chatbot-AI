'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import MessageErrorBoundary from '../components/MessageErrorBoundary';
import CharacterAvatar from '../components/CharacterAvatar';
import useSpeech from '../hooks/useSpeech';
import { getGenerationTheme } from '../lib/themes';
import { toText } from '../lib/toText';

const MarkdownContent = dynamic(() => import('../components/MarkdownContent'), { ssr: false, loading: () => <span className="markdown-loading">Loading response…</span> });
const FloatingCreatures = dynamic(() => import('../components/FloatingCreatures'), { ssr: false });

function FloatingCreaturesPortal({ generation }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || !generation) return null;
  return createPortal(<FloatingCreatures generation={generation || 'Adult'} />, document.body);
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const filters = ['Children', 'Teenagers', 'Adult', 'Young Man', 'Old/Senior', 'Gen Z', 'Gen Alpha'];
const themes = { aurora: 'theme-aurora', citrus: 'theme-citrus', linen: 'theme-linen', ocean: 'theme-ocean', children: 'theme-children', teenagers: 'theme-teenagers', adult: 'theme-adult', 'young-man': 'theme-young-man', senior: 'theme-senior', 'gen-z': 'theme-gen-z', 'gen-alpha': 'theme-gen-alpha' };
const fallbackCharacters = [
  { name: 'Nova', emoji: '✦', personality: 'Curious and supportive', speakingStyle: 'Clear, upbeat, and concise', suggestedTheme: 'aurora', whyThisFits: 'A friendly default for exploring ideas.' },
  { name: 'Sage', emoji: '◒', personality: 'Patient and reflective', speakingStyle: 'Calm with thoughtful detail', suggestedTheme: 'linen', whyThisFits: 'Good for careful decisions and learning.' },
  { name: 'Spark', emoji: '✺', personality: 'Creative and energetic', speakingStyle: 'Playful with practical examples', suggestedTheme: 'citrus', whyThisFits: 'Useful when you want momentum and fresh ideas.' },
];
let activeSpeechId = null;
let activeGeneration = 'Adult';

function anonymousId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('lumina-anonymous-id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('lumina-anonymous-id', id); }
  return id;
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', 'x-anonymous-id': anonymousId(), ...options.headers } });
  if (!response.ok) throw new Error(toText((await response.json()).error) || 'Something went wrong');
  return response.json();
}

function MessageBubbleContent({ message, onSpeak, onRegenerate, isLast, generation }) {
  const user = message.role === 'user';
  console.log('[MessageBubble] content', typeof message.content, JSON.stringify(message.content));
  const text = toText(message.content);
  const messageId = message._id || message.id || message.createdAt || `${message.role}:${text.slice(0, 24)}`;
  const isSpeaking = activeSpeechId === messageId;
  const messageGeneration = generation || activeGeneration;
  return <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`message ${user ? 'message-user' : 'message-ai'}`}>
    <div className="message-meta"><span className="avatar">{user ? 'you' : <CharacterAvatar generation={getGenerationTheme(messageGeneration).avatar} mood={isSpeaking ? 'speaking' : 'idle'} size={28} />}</span><span>{user ? 'You' : 'Lumina'}</span><span className="message-time">{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span></div>
    {user ? <p className="user-copy">{text}</p> : <div className="markdown">{text ? <MarkdownContent text={text} /> : <span className="typing"><i /><i /><i /></span>}</div>}
    {!user && text && <div className="message-actions">{text.startsWith('Sorry, I could not complete that request:') ? <button onClick={onRegenerate}>Retry</button> : <button onClick={() => onSpeak(messageId, text)} aria-pressed={isSpeaking} aria-label={isSpeaking ? 'Stop reading' : 'Speak this message'}>{isSpeaking ? '▮▮ Stop' : '◉ Speak'}{isSpeaking && <span className="sound-wave" aria-hidden="true"><i /><i /><i /></span>}</button>}{isLast && !text.startsWith('Sorry, I could not complete that request:') && <button onClick={onRegenerate}>↻ Regenerate</button>}</div>}
  </motion.article>;
}

function MessageBubble(props) {
  return <MessageErrorBoundary><MessageBubbleContent {...props} /></MessageErrorBoundary>;
}

function CharacterCards({ characters, onPick }) {
  return <><FloatingCreaturesPortal generation={activeGeneration} /><section className="character-section" aria-label="Suggested characters"><div className="section-kicker">A different lens</div><div className="character-grid">{characters.map((character) => <button className="character-card" key={character.name} onClick={() => onPick(character)}><span className="character-emoji">{character.emoji}</span><span><strong>{character.name}</strong><small>{character.personality}</small><em>{character.whyThisFits}</em></span></button>)}</div></section></>;
}

function Sidebar({ chats, activeId, onSelect, onDelete, onClear, onNew, mobileOpen, onClose }) {
  const [query, setQuery] = useState('');
  const visible = chats.filter((chat) => chat.title.toLowerCase().includes(query.toLowerCase()));
  return <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}><div className="sidebar-top"><div className="brand"><span className="brand-mark">✦</span><span>Lumina<small>thoughtful AI</small></span></div><button className="icon-button mobile-close" onClick={onClose} aria-label="Close sidebar">×</button></div><button className="new-chat" onClick={onNew}>＋ New conversation</button><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" /></label><div className="history-label">Recent conversations</div><nav className="history-list" aria-label="Chat history">{visible.map((chat) => <div className={`history-item ${chat._id === activeId || chat.id === activeId ? 'active' : ''}`} key={chat._id || chat.id}><button onClick={() => onSelect(chat._id || chat.id)}><strong>{chat.title}</strong><small>{chat.ageFilter || 'Adult'} · {new Date(chat.updatedAt || Date.now()).toLocaleDateString()}</small></button><button className="delete-button" aria-label={`Delete ${chat.title}`} onClick={() => onDelete(chat._id || chat.id)}>×</button></div>)}{!visible.length && <p className="empty-history">Your conversations will appear here.</p>}</nav><div className="sidebar-bottom"><button className="quiet-button" onClick={onClear}>⌫ Clear history</button><span className="status-dot">● Local session ready</span></div></aside>;
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [input, setInput] = useState('');
  const [ageFilter, setAgeFilter] = useState('Adult');
  const [character, setCharacter] = useState(null);
  const activeCharacter = character;
  const [characters, setCharacters] = useState(fallbackCharacters);
  const [theme, setTheme] = useState('aurora');
  const [dark, setDark] = useState(false);
  const [settings, setSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState('');
  const [fontSize, setFontSize] = useState('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [listening, setListening] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voice, setVoice] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const scrollRef = useRef(null);
  const abortRef = useRef(null);
  const speech = useSpeech({ voice, rate, pitch, onUnsupported: () => setNotice('Text-to-speech is not supported in this browser.') });
  const generationTheme = getGenerationTheme(ageFilter);
  activeSpeechId = speech.speakingId;
  activeGeneration = ageFilter;

  useEffect(() => { request('/chats').then(setChats).catch(() => {}); if ('speechSynthesis' in window) { const load = () => setVoices(window.speechSynthesis.getVoices()); load(); window.speechSynthesis.onvoiceschanged = load; } }, []);
  useEffect(() => { const saved = localStorage.getItem('lumina-theme'); const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches; setDark(saved ? saved === 'dark' : preferred); }, []);
  useEffect(() => { localStorage.setItem('lumina-theme', dark ? 'dark' : 'light'); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  useEffect(() => { setTheme(getGenerationTheme(ageFilter).theme); }, [ageFilter]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, generating]);
  useEffect(() => { if (generating) speech.stopSpeech(); }, [generating, speech.stopSpeech]);
  useEffect(() => () => speech.stopSpeech(), [chatId, speech.stopSpeech]);
  useEffect(() => { const handler = (event) => { if (event.key === 'Escape') window.speechSynthesis?.cancel(); if (event.ctrlKey && event.key.toLowerCase() === 'm') { event.preventDefault(); startListening(); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); });

  function speak(messageId, text) { speech.speak(messageId, text); }
  function startListening() { const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Recognition) return setNotice('Speech recognition is not supported here. Try Chrome or Edge.'); const recognition = new Recognition(); recognition.lang = language; recognition.interimResults = true; recognition.onstart = () => setListening(true); recognition.onresult = (event) => setInput(Array.from(event.results).map((result) => result[0].transcript).join('')); recognition.onerror = () => { setNotice('Microphone access was unavailable.'); setListening(false); }; recognition.onend = () => setListening(false); recognition.start(); }
  async function sendMessage(text = input) { if (!text.trim() || generating) return; setInput(''); setNotice(''); const userMessage = { role: 'user', content: text.trim(), createdAt: new Date().toISOString() }; const nextMessages = [...messages, userMessage]; setMessages([...nextMessages, { role: 'assistant', content: '' }]); setGenerating(true); abortRef.current = new AbortController(); try { const response = await fetch(`${API}/chat/stream`, { method: 'POST', signal: abortRef.current.signal, headers: { 'Content-Type': 'application/json', 'x-anonymous-id': anonymousId() }, body: JSON.stringify({ chatId, message: userMessage.content, ageFilter, activeCharacter }) }); if (!response.ok) { const error = await response.json(); if (error.isEmergency) { setMessages([...nextMessages, { role: 'assistant', content: error.guidance }]); return; } throw new Error(error.error || 'Unable to reach Lumina'); } const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let answer = ''; while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const events = buffer.split('\n\n'); buffer = events.pop(); for (const event of events) { if (!event.startsWith('data: ')) continue; const data = JSON.parse(event.slice(6)); if (data.type === 'token') { answer += data.text; setMessages([...nextMessages, { role: 'assistant', content: answer }]); } if (data.type === 'done') { setChatId(data.chatId); } } } setMessages([...nextMessages, { role: 'assistant', content: answer, createdAt: new Date().toISOString() }]); const suggestions = await request('/chat/characters', { method: 'POST', body: JSON.stringify({ messages: [...nextMessages, { role: 'assistant', content: answer }], ageFilter }) }); setCharacters(suggestions.characters); if (autoRead) speak(answer); request('/chats').then(setChats).catch(() => {}); } catch (error) { if (error.name !== 'AbortError') setNotice(error.message); } finally { setGenerating(false); abortRef.current = null; } }
  async function loadChat(id) { try { const chat = await request(`/chats/${id}`); setChatId(id); setMessages((chat.messages || []).map((message) => ({ ...message, content: toText(message.content) }))); setAgeFilter(chat.ageFilter || 'Adult'); setCharacter(chat.activeCharacter || null); setSidebarOpen(false); } catch { setNotice('That conversation could not be loaded.'); } }
  async function deleteChat(id) { if (!window.confirm('Delete this conversation?')) return; await request(`/chats/${id}`, { method: 'DELETE' }).catch(() => {}); setChats(chats.filter((chat) => (chat._id || chat.id) !== id)); if (chatId === id) newChat(); }
  async function clearChats() { if (!window.confirm('Clear all conversation history?')) return; await request('/chats', { method: 'DELETE' }).catch(() => {}); setChats([]); newChat(); }
  function newChat() { setChatId(null); setMessages([]); setCharacter(null); setCharacters(fallbackCharacters); setSidebarOpen(false); }
  function pickCharacter(item) { setCharacter(item); setTheme(item.suggestedTheme in themes ? item.suggestedTheme : 'aurora'); }

  const classes = `${themes[theme] || 'theme-aurora'} ${dark ? 'dark-mode' : ''} ${highContrast ? 'high-contrast' : ''} ${dyslexia ? 'dyslexia' : ''} font-${fontSize}`;
  return <main className={classes}><Sidebar chats={chats} activeId={chatId} onSelect={loadChat} onDelete={deleteChat} onClear={clearChats} onNew={newChat} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /><section className="workspace"><header className="topbar"><button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">☰</button><div><span className="eyebrow">YOUR THINKING SPACE</span><h1>{character ? `${character.emoji} ${character.name}` : 'A calmer way to think'}</h1></div><div className="top-actions"><button className="round-control" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">{dark ? '☼' : '◐'}</button><button className="round-control" onClick={() => setSettings(!settings)} aria-label="Open settings">⚙</button></div></header><div className="filter-bar" aria-label="Generation style">{filters.map((filter) => <button className={ageFilter === filter ? 'selected' : ''} key={filter} onClick={() => setAgeFilter(filter)}>{filter}</button>)}</div><div className="chat-scroll" ref={scrollRef}><AnimatePresence>{!messages.length && <motion.div className="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="welcome-orbit">✦</div><span className="eyebrow">WELCOME TO LUMINA</span><h2>Make room for<br /><i>better questions.</i></h2><p>A thoughtful AI companion for curious minds. Ask anything, shape the mood, and follow the thread wherever it leads.</p><div className="prompt-row"><button onClick={() => sendMessage('Help me turn a vague idea into a clear plan.')}>Turn an idea into a plan <span>→</span></button><button onClick={() => sendMessage('Teach me something surprising in a simple way.')}>Teach me something surprising <span>→</span></button></div></motion.div>}{messages.map((message, index) => <MessageBubble key={`${index}-${message.role}`} message={message} onSpeak={speak} onRegenerate={() => sendMessage(messages[index - 1]?.content || '')} isLast={index === messages.length - 1} />)}{!generating && messages.some((message) => message.role === 'assistant' && message.content) && <CharacterCards characters={characters} onPick={pickCharacter} />}</AnimatePresence></div><div className="composer-wrap"><div className="composer"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder={listening ? 'Listening…' : 'Ask Lumina anything…'} aria-label="Message Lumina" rows="1" /><button className={`mic-button ${listening ? 'listening' : ''}`} onClick={startListening} aria-label="Start speech recognition">♩</button><button className="send-button" onClick={() => sendMessage()} disabled={generating || !input.trim()} aria-label="Send message">↑</button></div><div className="composer-footer"><span>Enter to send · Shift + Enter for a new line</span><span><b className="status-dot">●</b> Lumina is ready</span></div></div></section>{settings && <aside className="settings-panel"><div className="settings-head"><div><span className="eyebrow">PERSONALIZE</span><h2>Your preferences</h2></div><button className="icon-button" onClick={() => setSettings(false)}>×</button></div><label>Wallpaper<select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="aurora">Aurora gradient</option><option value="citrus">Citrus glow</option><option value="linen">Quiet linen</option><option value="ocean">Deep ocean</option></select></label><label>Language<select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="en-US">English</option><option value="hi-IN">Hindi</option><option value="en-IN">Hinglish</option></select></label><label>Voice<select value={voice} onChange={(event) => setVoice(event.target.value)}><option value="">System default</option>{voices.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label><label className="range-label">Speech speed <input type="range" min="0.6" max="1.5" step="0.1" value={rate} onChange={(event) => setRate(event.target.value)} /></label><label className="range-label">Speech pitch <input type="range" min="0.5" max="1.5" step="0.1" value={pitch} onChange={(event) => setPitch(event.target.value)} /></label><label className="toggle-row">Auto-read replies <input type="checkbox" checked={autoRead} onChange={(event) => setAutoRead(event.target.checked)} /></label><label className="toggle-row">High contrast <input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} /></label><label className="toggle-row">Dyslexia-friendly type <input type="checkbox" checked={dyslexia} onChange={(event) => setDyslexia(event.target.checked)} /></label><label>Text size<select value={fontSize} onChange={(event) => setFontSize(event.target.value)}><option value="normal">Comfortable</option><option value="large">Large</option></select></label><button className="test-speech" onClick={() => speak('Lumina is ready when you are.')}>Test voice</button></aside>}{notice && <div className="toast" role="alert">{notice}<button onClick={() => setNotice('')}>×</button></div>}</main>;
}