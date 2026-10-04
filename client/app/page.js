'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m, LazyMotion, domAnimation } from 'framer-motion';
import dynamic from 'next/dynamic';
import MessageErrorBoundary from '../components/MessageErrorBoundary';
import CharacterAvatar from '../components/CharacterAvatar';
import CharacterFriend from '../components/character/CharacterFriend';
import LivingBackground from '../components/backgrounds/LivingBackground';
import useSpeech from '../hooks/useSpeech';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useAnimationMode from '../hooks/useAnimationMode';
import useProgress from '../hooks/useProgress';
import ProgressModal from '../components/ProgressModal';
import Confetti from '../components/Confetti';
import ScrollToBottom from '../components/ScrollToBottom';
import { getDailyContent } from '../lib/dailyContent';
import { soundEngine } from '../lib/sound';
import { apiUrl, assertEventStream, request, warmApi } from '../lib/api';
import { getGenerationTheme } from '../lib/themes';
import { toText } from '../lib/toText';

function BackendStatus() {
  const [status, setStatus] = useState({ state: 'Waking up' });
  useEffect(() => { 
    let cancelled = false; 
    warmApi().then(() => { 
      if (!cancelled) setStatus({ state: 'Connected' }); 
      request('/health').then(res => { if (!cancelled && res.model) setStatus({ state: 'Connected', model: res.model }); }).catch(()=> {});
    }).catch(() => { 
      if (!cancelled) setStatus({ state: 'Unreachable' }); 
    }); 
    return () => { cancelled = true; }; 
  }, []);
  return <div className={`backend-status backend-${status.state.toLowerCase()}`}><span className="status-dot">●</span> Backend: {status.state} {status.model ? `(${status.model})` : ''}</div>;
}

const MarkdownContent = dynamic(() => import('../components/MarkdownContent'), { ssr: false, loading: () => <span className="markdown-loading">Loading response…</span> });
const API = { toString: () => apiUrl('/').replace(/\/+$/, '') };

async function fetch(url, options) {
  const response = await globalThis.fetch(url, options);
  if (String(url).includes('/chat/stream')) await assertEventStream(response);
  return response;
}

const filters = ['Children', 'Teenagers', 'Adult', 'Young Man', 'Old/Senior', 'Gen Z', 'Gen Alpha'];
const themes = {
  'theme-children': 'theme-children',
  'theme-teenagers': 'theme-teenagers',
  'theme-adult': 'theme-adult',
  'theme-youngman': 'theme-youngman',
  'theme-senior': 'theme-senior',
  'theme-genz': 'theme-genz',
  'theme-genalpha': 'theme-genalpha'
};
const fallbackCharacters = [
  { name: 'Nova', emoji: '✦', personality: 'Curious and supportive', speakingStyle: 'Clear, upbeat, and concise', suggestedTheme: 'base', whyThisFits: 'A friendly default for exploring ideas.' },
  { name: 'Sage', emoji: '◒', personality: 'Patient and reflective', speakingStyle: 'Calm with thoughtful detail', suggestedTheme: 'base', whyThisFits: 'Good for careful decisions and learning.' },
  { name: 'Spark', emoji: '✺', personality: 'Creative and energetic', speakingStyle: 'Playful with practical examples', suggestedTheme: 'base', whyThisFits: 'Useful when you want momentum and fresh ideas.' },
];
let activeSpeechId = null;
let activeGeneration = 'Adult';

function anonymousId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('lumina-anonymous-id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('lumina-anonymous-id', id); }
  return id;
}

function MessageBubbleContent({ message, onSpeak, onRegenerate, isLast, generation, isChildrenMode }) {
  const user = message.role === 'user';
  const text = toText(message.content);
  const messageId = message._id || message.id || message.createdAt || `${message.role}:${text.slice(0, 24)}`;
  const isSpeaking = activeSpeechId === messageId;
  const messageGeneration = generation || activeGeneration;
  
  if (message.error) {
    if (isChildrenMode) {
      return (
        <m.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="chat-bubble chat-bubble-ai" style={{ border: '3px solid #ef4444', background: '#fee2e2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <CharacterAvatar generation="cartoon" mood="thinking" size={48} />
            <strong>Lumina</strong>
          </div>
          <p>{message.error}</p>
          <button className="kids-btn" onClick={onRegenerate} style={{ marginTop: '16px', background: '#ef4444', color: 'white', border: 'none' }}>Try Again</button>
        </m.div>
      );
    }
    return (
       <m.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="message message-ai">
         <div className="message-error">
           <p>{message.error}</p>
           {message.code && <code>Error code: {message.code}</code>}
           <button onClick={onRegenerate}>Retry</button>
         </div>
       </m.article>
    );
  }
  
  if (isChildrenMode) {
    return (
      <m.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className={`chat-bubble ${user ? 'chat-bubble-user' : 'chat-bubble-ai'}`} style={{ marginLeft: user ? 'auto' : '0', marginRight: user ? '0' : 'auto' }}>
        {!user && <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <CharacterFriend generation="Children" mood={isSpeaking ? 'talking' : !text ? 'thinking' : 'idle'} size={48} />
          <strong>Lumina</strong>
        </div>}
        {user ? <p>{text}</p> : <div className="markdown">{text ? <MarkdownContent text={text} /> : <div className="typing-indicator">Thinking...</div>}</div>}
        {!user && text && !text.startsWith('Sorry') && (
          <button className="listen-btn" onClick={() => onSpeak(messageId, text)} aria-pressed={isSpeaking}>
            {isSpeaking ? '▮▮ Stop Listening' : '🔊 Listen'}
          </button>
        )}
      </m.div>
    );
  }

  return <m.article initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className={`message ${user ? 'message-user' : 'message-ai'}`}>
    <div className="message-meta"><span className="avatar">{user ? 'you' : <CharacterFriend generation={messageGeneration} mood={isSpeaking ? 'talking' : !text ? 'thinking' : 'idle'} size={32} />}</span><span>{user ? 'You' : 'Lumina'}</span><span className="message-time">{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span></div>
    {user ? <p className="user-copy">{text}</p> : <div className="markdown">{text ? <MarkdownContent text={text} /> : <div className="typing-indicator"><CharacterFriend generation={messageGeneration} mood="thinking" size={24} /> Thinking...</div>}</div>}
    {!user && text && <div className="message-actions">{text.startsWith('Sorry, I could not complete that request:') ? <button onClick={onRegenerate}>Retry</button> : <button onClick={() => onSpeak(messageId, text)} aria-pressed={isSpeaking} aria-label={isSpeaking ? 'Stop reading' : 'Speak this message'}>{isSpeaking ? '▮▮ Stop' : '◉ Speak'}{isSpeaking && <span className="sound-wave" aria-hidden="true"><i /><i /><i /></span>}</button>}{isLast && !text.startsWith('Sorry, I could not complete that request:') && <button onClick={onRegenerate}>↻ Regenerate</button>}</div>}
  </m.article>;
}

function MessageBubble(props) {
  return <MessageErrorBoundary><MessageBubbleContent {...props} /></MessageErrorBoundary>;
}

function CharacterCards({ characters, onPick, isChildrenMode }) {
  if (isChildrenMode) return null;
  return <><BackendStatus /><section className="character-section" aria-label="Suggested characters"><div className="section-kicker">A different lens</div><div className="character-grid">{characters.map((character) => <button className="character-card" key={character.name} onClick={() => onPick(character)}><span className="character-emoji">{character.emoji}</span><span><strong>{character.name}</strong><small>{character.personality}</small><em>{character.whyThisFits}</em></span></button>)}</div></section></>;
}

function Sidebar({ chats, activeId, onSelect, onDelete, onClear, onNew, mobileOpen, onClose, isChildrenMode, currentFilter }) {
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState('current');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  let visible = chats;
  if (!isChildrenMode) {
    visible = chats.filter((chat) => chat.title.toLowerCase().includes(query.toLowerCase()));
  } else {
    if (filterMode === 'current') visible = chats.filter((chat) => chat.ageFilter === currentFilter);
  }
  
  if (isChildrenMode) {
    return (
      <aside className={`sidebar kids-sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand"><span className="brand-mark">✦</span><span>Lumina<small>For Kids</small></span></div>
          <button className="icon-button mobile-close" onClick={onClose} aria-label="Close menu">×</button>
        </div>
        <button className="new-chat kids-btn" onClick={onNew} style={{ margin: '16px', background: 'var(--accent)', color: 'white' }}>➕ New Chat</button>
        <div className="kids-sidebar-tabs" style={{ display: 'flex', gap: '8px', padding: '0 16px' }}>
          <button onClick={() => setFilterMode('current')} style={{ flex: 1, padding: '8px', borderRadius: '12px', background: filterMode === 'current' ? 'var(--accent)' : '#f1f5f9', color: filterMode === 'current' ? 'white' : 'black', border: 'none', fontWeight: 'bold' }}>My Chats</button>
          <button onClick={() => setFilterMode('all')} style={{ flex: 1, padding: '8px', borderRadius: '12px', background: filterMode === 'all' ? 'var(--accent)' : '#f1f5f9', color: filterMode === 'all' ? 'white' : 'black', border: 'none', fontWeight: 'bold' }}>All</button>
        </div>
        <nav className="history-list" style={{ padding: '16px', gap: '12px', overflowY: 'auto' }}>
          {visible.map((chat) => (
            <div className={`history-item kids-history-card ${chat._id === activeId || chat.id === activeId ? 'active' : ''}`} key={chat._id || chat.id} style={{ minHeight: '56px', background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {confirmDeleteId === (chat._id || chat.id) ? (
                <div style={{ padding: '12px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>Are you sure?</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button onClick={() => { onDelete(chat._id || chat.id); setConfirmDeleteId(null); }} style={{ background: '#ef4444', color: 'white', padding: '6px 16px', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}>Yes</button>
                    <button onClick={() => setConfirmDeleteId(null)} style={{ background: '#e2e8f0', color: 'black', padding: '6px 16px', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}>No</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <button onClick={() => { onSelect(chat._id || chat.id); if (window.innerWidth < 768) onClose(); }} style={{ flex: 1, textAlign: 'left', padding: '12px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{chat.activeCharacter?.emoji || '💬'}</span>
                    <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', fontSize: '16px' }}>{chat.title.slice(0, 20)}</strong>
                  </button>
                  <button onClick={() => setConfirmDeleteId(chat._id || chat.id)} style={{ padding: '12px', border: 'none', background: 'transparent', fontSize: '20px' }}>🗑️</button>
                </div>
              )}
            </div>
          ))}
          {!visible.length && <p style={{ textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>No chats yet!</p>}
        </nav>
      </aside>
    );
  }
  
  return <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}><div className="sidebar-top"><div className="brand"><span className="brand-mark">✦</span><span>Lumina<small>thoughtful AI</small></span></div><button className="icon-button mobile-close" onClick={onClose} aria-label="Close sidebar">×</button></div><button className="new-chat" onClick={onNew}>＋ New conversation</button><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" /></label><div className="history-label">Recent conversations</div><nav className="history-list" aria-label="Chat history">{visible.map((chat) => <div className={`history-item ${chat._id === activeId || chat.id === activeId ? 'active' : ''}`} key={chat._id || chat.id}><button onClick={() => { onSelect(chat._id || chat.id); }}><strong>{chat.title}</strong><small>{chat.ageFilter || 'Adult'} · {new Date(chat.updatedAt || Date.now()).toLocaleDateString()}</small></button><button className="delete-button" aria-label={`Delete ${chat.title}`} onClick={() => onDelete(chat._id || chat.id)}>×</button></div>)}{!visible.length && <p className="empty-history">Your conversations will appear here.</p>}</nav><div className="sidebar-bottom"><button className="quiet-button" onClick={() => document.dispatchEvent(new Event('open-collection'))}>🏆 {isChildrenMode ? 'My Sticker Book' : 'My Collection'}</button><button className="quiet-button" onClick={onClear}>⌫ Clear history</button><span className="status-dot">● Local session ready</span></div></aside>;
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
  const [theme, setTheme] = useState('base');
  const [dark, setDark] = useState(false);
  const [settings, setSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState('');
  const [fontSize, setFontSize] = useState('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const [autoSend, setAutoSend] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [voices, setVoices] = useState([]);
  const [voice, setVoice] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [stars, setStars] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const { animationMode, setAnimationMode, animationsActive } = useAnimationMode();
  const { progress, addXp, showLevelUp } = useProgress();
  const [showCollection, setShowCollection] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('lumina-sound');
    if (saved === 'true') {
      setSoundEnabled(true);
      soundEngine.setEnabled(true);
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('lumina-sound', soundEnabled);
    soundEngine.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    if (showLevelUp) soundEngine.playLevelUp();
  }, [showLevelUp]);

  useEffect(() => {
    const handleOpenCollection = () => setShowCollection(true);
    document.addEventListener('open-collection', handleOpenCollection);
    return () => document.removeEventListener('open-collection', handleOpenCollection);
  }, []);
  
  const streak = progress.streak;
  
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    if (hour < 22) return 'Good evening';
    return 'Good night';
  };
  
  const isChildrenMode = ageFilter === 'Children';
  
  const scrollRef = useRef(null);
  const abortRef = useRef(null);
  
  const speech = useSpeech({ voice, rate: isChildrenMode ? 0.9 : rate, pitch, onUnsupported: () => setNotice('Text-to-speech is not supported in this browser.') });
  const { listening, interimText, error: sttError, startListening, stopListening, toggleListening } = useSpeechRecognition({ 
    language, 
    onResult: (text) => {
      setInput((prev) => (prev ? prev + ' ' : '') + text);
      if (autoSend) {
        setTimeout(() => { sendMessage(text); }, 100);
      }
    } 
  });
  
  activeSpeechId = speech.speakingId;
  activeGeneration = ageFilter;

  useEffect(() => { request('/chats').then(setChats).catch(() => {}); if ('speechSynthesis' in window) { const load = () => setVoices(window.speechSynthesis.getVoices()); load(); window.speechSynthesis.onvoiceschanged = load; } }, []);
  useEffect(() => { warmApi().catch((error) => setNotice(`Waking up the server, this can take up to a minute. ${error.message}`)); }, []);
  useEffect(() => { const saved = localStorage.getItem('lumina-theme'); const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches; setDark(saved ? saved === 'dark' : preferred); }, []);
  useEffect(() => { localStorage.setItem('lumina-theme', dark ? 'dark' : 'light'); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  useEffect(() => { 
    setTheme(getGenerationTheme(ageFilter).theme); 
    if (ageFilter === 'Children') {
      setAutoRead(true);
      setAutoSend(true);
      setDark(false);
    }
  }, [ageFilter]);
  useEffect(() => { 
    const savedStars = localStorage.getItem('lumina-stars');
    if (savedStars) setStars(parseInt(savedStars, 10) || 0);
  }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, generating, interimText]);
  useEffect(() => { if (generating) speech.stopSpeech(); }, [generating, speech.stopSpeech]);
  useEffect(() => () => speech.stopSpeech(), [chatId, speech.stopSpeech]);
  useEffect(() => { if (sttError) setNotice(sttError); }, [sttError]);

  const handleSpeak = useCallback((messageId, text) => {
    if (activeSpeechId === messageId) {
      speech.stopSpeech();
    } else {
      stopListening(); // Stop mic before TTS starts
      speech.speak(messageId, text);
    }
  }, [activeSpeechId, speech, stopListening]);

  const handleMicToggle = useCallback(() => {
    if (!listening) {
      speech.stopSpeech(); // Stop TTS before mic starts
    }
    toggleListening();
  }, [listening, speech, toggleListening]);

  async function sendMessage(text = input, overrideMessages = null) { 
    if (!text.trim() || generating) return; 
    setInput(''); 
    setNotice(''); 
    const userMessage = { role: 'user', content: text.trim(), createdAt: new Date().toISOString() }; 
    const currentHistory = overrideMessages !== null ? overrideMessages : messages;
    const nextMessages = [...currentHistory, userMessage]; 
    setMessages([...nextMessages, { role: 'assistant', content: '' }]); 
    setGenerating(true); 
    soundEngine.playSend();
    abortRef.current = new AbortController(); 
    
    try { 
      const response = await fetch(`${API}/chat/stream`, { method: 'POST', signal: abortRef.current.signal, headers: { 'Content-Type': 'application/json', 'x-anonymous-id': anonymousId() }, body: JSON.stringify({ chatId, message: userMessage.content, ageFilter, activeCharacter }) }); 
      if (!response.ok) { 
        const error = await response.json(); 
        if (error.isEmergency) { setMessages([...nextMessages, { role: 'assistant', content: error.guidance }]); return; } 
        throw new Error(error.error || 'Unable to reach Lumina'); 
      } 
      const reader = response.body.getReader(); 
      const decoder = new TextDecoder(); 
      let buffer = ''; 
      let answer = ''; 
      while (true) { 
        const { value, done } = await reader.read(); 
        if (done) break; 
        buffer += decoder.decode(value, { stream: true }); 
        const events = buffer.split('\n\n'); 
        buffer = events.pop(); 
        for (const event of events) { 
          if (!event.startsWith('data: ')) continue; 
          const data = JSON.parse(event.slice(6)); 
          if (data.type === 'token') { 
            answer += data.text; 
            setMessages([...nextMessages, { role: 'assistant', content: answer }]); 
          } 
          if (data.type === 'done') { setChatId(data.chatId); } 
          if (data.error) { 
            setMessages([...nextMessages, { role: 'assistant', content: answer, error: data.error, code: data.code }]);
            throw new Error(data.error);
          }
        } 
      } 
      setMessages([...nextMessages, { role: 'assistant', content: answer, createdAt: new Date().toISOString() }]); 
      
      if (isChildrenMode) {
        const newStars = stars + 1;
        setStars(newStars);
        localStorage.setItem('lumina-stars', newStars.toString());
        if (newStars % 3 === 0) setNotice(`Wow! You asked ${newStars} questions! 🌟`);
      }
      
      const suggestions = await request('/chat/characters', { method: 'POST', body: JSON.stringify({ messages: [...nextMessages, { role: 'assistant', content: answer }], ageFilter }) }); 
      setCharacters(suggestions.characters); 
      if (autoRead) handleSpeak('auto', answer); 
      request('/chats').then(setChats).catch(() => {}); 
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 3000);
      soundEngine.playReceive();
      addXp(10, listening);
    } catch (error) { 
      if (error.name !== 'AbortError') setNotice(error.message); 
    } finally { 
      setGenerating(false); 
      abortRef.current = null; 
    } 
  }
  
  async function handleRegenerate(index) {
    if (generating) return;
    const userMsg = messages[index - 1];
    if (!userMsg || userMsg.role !== 'user') return;
    
    // Remove the error/assistant message and the preceding user message
    const newMessages = messages.slice(0, index - 1);
    setMessages(newMessages);
    
    // Call sendMessage but with the newMessages array injected
    setTimeout(() => {
      sendMessage(userMsg.content, newMessages);
    }, 0);
  }
  async function loadChat(id) { try { const chat = await request(`/chats/${id}`); setChatId(id); setMessages((chat.messages || []).map((message) => ({ ...message, content: toText(message.content) }))); setAgeFilter(chat.ageFilter || 'Adult'); setCharacter(chat.activeCharacter || null); setSidebarOpen(false); } catch { setNotice('That conversation could not be loaded.'); } }
  async function deleteChat(id) { if (!window.confirm('Delete this conversation?')) return; await request(`/chats/${id}`, { method: 'DELETE' }).catch(() => {}); setChats(chats.filter((chat) => (chat._id || chat.id) !== id)); if (chatId === id) newChat(); }
  async function clearChats() { if (!window.confirm('Clear all conversation history?')) return; await request('/chats', { method: 'DELETE' }).catch(() => {}); setChats([]); newChat(); }
  function newChat() { setChatId(null); setMessages([]); setCharacter(null); setCharacters(fallbackCharacters); setSidebarOpen(false); }
  function pickCharacter(item) { setCharacter(item); setTheme(item.suggestedTheme in themes ? item.suggestedTheme : 'base'); }

  const classes = `${themes[theme] || 'theme-base'} ${dark ? 'dark-mode' : ''} ${highContrast ? 'high-contrast' : ''} ${dyslexia ? 'dyslexia' : ''} font-${fontSize}`;
  const daily = getDailyContent(ageFilter);
  
  return <LazyMotion features={domAnimation}>
    <m.main 
      className={classes}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <Sidebar chats={chats} activeId={chatId} onSelect={loadChat} onDelete={deleteChat} onClear={clearChats} onNew={newChat} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isChildrenMode={isChildrenMode} currentFilter={ageFilter} />
  
  <ProgressModal isOpen={showCollection} onClose={() => setShowCollection(false)} progress={progress} isChildrenMode={isChildrenMode} />
  
  {showLevelUp && animationsActive && (
    <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
      <m.div 
        initial={{ y: -50, opacity: 0, scale: 0.5 }} 
        animate={{ y: 0, opacity: 1, scale: 1 }} 
        exit={{ y: -50, opacity: 0, scale: 0.5 }}
        style={{ background: 'var(--accent)', color: 'white', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
      >
        🎉 Level Up! You are now Level {progress.level} 🎉
      </m.div>
    </div>
  )}

  <section className="workspace">
    <Confetti active={celebrating && animationsActive} />
    <LivingBackground generation={ageFilter} />
    
    <AnimatePresence mode="wait">
      <m.div 
        key={ageFilter} 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 1.02 }} 
        transition={{ duration: 0.3 }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      >
        <div className="sparkle-wipe" />
      </m.div>
    </AnimatePresence>
    {isChildrenMode && stars > 0 && <div className="stars-counter">🌟 {stars}</div>}
    
    <header className="topbar">
      <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar" style={{ display: isChildrenMode ? 'inline-grid' : '' }}>☰</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CharacterFriend generation={ageFilter} mood={celebrating ? 'happy' : generating ? 'thinking' : 'idle'} size={40} />
        <div>
          <span className="eyebrow" style={{ display: isChildrenMode ? 'none' : 'block' }}>YOUR THINKING SPACE</span>
          <h1>{character ? `${character.emoji} ${character.name}` : isChildrenMode ? 'Lumina ✦' : 'A calmer way to think'}</h1>
        </div>
      </div>
      <div className="top-actions">
        {!isChildrenMode && <button className="round-control" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">{dark ? '☼' : '◐'}</button>}
        {!isChildrenMode && <button className="round-control" onClick={() => setSettings(!settings)} aria-label="Open settings">⚙</button>}
      </div>
    </header>
    
    <div className="filter-bar" aria-label="Generation style">
      {filters.map((filter) => <button className={ageFilter === filter ? 'selected' : ''} key={filter} onClick={() => setAgeFilter(filter)}>{filter}</button>)}
    </div>
    
    <ScrollToBottom scrollRef={scrollRef} />
    
    <div className="chat-scroll" ref={scrollRef}>
      <AnimatePresence>
        {!messages.length && (
          <m.div className="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {isChildrenMode ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <CharacterFriend generation={ageFilter} mood={celebrating ? 'happy' : 'idle'} size={100} />
                </div>
                <h2 className="kids-greeting">{getTimeGreeting()}! {getGenerationTheme(ageFilter).greeting}</h2>
                {streak > 0 && <div style={{textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', marginTop: '-15px', marginBottom: '20px'}}>Welcome back! Day {streak} in a row 🌟</div>}
                
                <div style={{ background: '#fef08a', padding: '16px', borderRadius: '16px', margin: '0 auto 24px', maxWidth: '400px', textAlign: 'center', border: '3px solid #facc15' }}>
                  <strong style={{ color: '#854d0e', fontSize: '18px' }}>Did you know?</strong>
                  <p style={{ margin: '8px 0 0', color: '#422006' }}>{daily.fact}</p>
                </div>
                
                <div style={{ padding: '0 24px 24px' }}>
                  <button className={`mic-btn ${listening ? 'listening' : ''}`} onClick={handleMicToggle} aria-label="Start speaking">
                    🎤
                  </button>
                  {listening && <p style={{ textAlign: 'center', marginTop: '16px', fontWeight: 'bold' }}>Listening...</p>}
                </div>
                <div className="kids-home-grid">
                  <button className="kids-home-btn" onClick={() => sendMessage(daily.question)} style={{ background: '#f472b6', color: 'white', borderColor: '#db2777' }}>
                    ❓ {daily.question}
                  </button>
                  {getGenerationTheme(ageFilter).suggestions.slice(0, 3).map((sug, i) => (
                    <button key={i} className="kids-home-btn" onClick={() => sendMessage(sug)}>
                      {sug}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="welcome-orbit">
                  <CharacterFriend generation={ageFilter} mood={celebrating ? 'happy' : 'idle'} size={80} />
                </div>
                <span className="eyebrow">WELCOME TO LUMINA</span>
                <h2>{getTimeGreeting()}.</h2>
                {streak > 0 && <div style={{color: 'var(--accent)', fontWeight: 'bold', margin: '5px 0 15px'}}>Welcome back! Day {streak} in a row 🔥</div>}
                
                <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'left', borderLeft: '4px solid var(--accent)' }}>
                  <strong style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Fact</strong>
                  <p style={{ margin: '4px 0 0' }}>{daily.fact}</p>
                </div>
                
                <p>A thoughtful AI companion for curious minds. Ask anything, shape the mood, and follow the thread wherever it leads.</p>
                <div className="prompt-row">
                  <button onClick={() => sendMessage(daily.question)} style={{ borderLeft: '3px solid var(--accent)' }}><strong>QOTD:</strong> {daily.question} <span>→</span></button>
                  {getGenerationTheme(ageFilter).suggestions.slice(0, 2).map((sug, i) => (
                    <button key={i} onClick={() => sendMessage(sug)}>{sug} <span>→</span></button>
                  ))}
                </div>
              </>
            )}
          </m.div>
        )}
        
        {messages.map((message, index) => <MessageBubble key={`${index}-${message.role}`} message={message} onSpeak={handleSpeak} onRegenerate={() => handleRegenerate(index)} isLast={index === messages.length - 1} isChildrenMode={isChildrenMode} />)}
        
        {!generating && messages.some((message) => message.role === 'assistant' && message.content) && <CharacterCards characters={characters} onPick={pickCharacter} isChildrenMode={isChildrenMode} />}
      </AnimatePresence>
    </div>
    
    <div className="composer-wrap">
      {!isChildrenMode || messages.length > 0 ? (
        <div className="composer">
          <textarea value={input + (interimText ? ` ${interimText}` : '')} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder={listening ? 'Listening…' : isChildrenMode ? 'Type or say something...' : 'Ask Lumina anything…'} aria-label="Message Lumina" rows="1" style={isChildrenMode ? { fontSize: '20px', padding: '8px' } : {}} />
          <button className={`mic-button ${listening ? 'listening' : ''}`} onClick={handleMicToggle} aria-label="Start speech recognition">🎤</button>
          <button className="send-button" onClick={() => sendMessage()} disabled={generating || (!input.trim() && !interimText)} aria-label="Send message">↑</button>
        </div>
      ) : null}
      
      {!isChildrenMode && (
        <div className="composer-footer">
          <span>Enter to send · Shift + Enter for a new line</span>
          <span><b className="status-dot">●</b> Lumina is ready</span>
        </div>
      )}
      {isChildrenMode && <div style={{ textAlign: 'center', marginTop: '12px', color: 'var(--muted)', fontSize: '14px', fontWeight: 'bold' }}>Ask a grown-up if you are unsure!</div>}
    </div>
  </section>
  
  {settings && !isChildrenMode && <aside className="settings-panel"><div className="settings-head"><div><span className="eyebrow">PERSONALIZE</span><h2>Your preferences</h2></div><button className="icon-button" onClick={() => setSettings(false)}>×</button></div><label>Language<select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="en-US">English (US)</option><option value="en-IN">English (India)</option><option value="hi-IN">Hindi</option></select></label><label>Voice<select value={voice} onChange={(event) => setVoice(event.target.value)}><option value="">System default</option>{voices.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label><label className="range-label">Speech speed <input type="range" min="0.6" max="1.5" step="0.1" value={rate} onChange={(event) => setRate(event.target.value)} /></label><label className="range-label">Speech pitch <input type="range" min="0.5" max="1.5" step="0.1" value={pitch} onChange={(event) => setPitch(event.target.value)} /></label><label className="toggle-row">Auto-read replies <input type="checkbox" checked={autoRead} onChange={(event) => setAutoRead(event.target.checked)} /></label><label className="toggle-row">Auto-send after speaking <input type="checkbox" checked={autoSend} onChange={(event) => setAutoSend(event.target.checked)} /></label><label className="toggle-row">High contrast <input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} /></label><label className="toggle-row">Dyslexia-friendly type <input type="checkbox" checked={dyslexia} onChange={(event) => setDyslexia(event.target.checked)} /></label><label className="toggle-row">Sound effects <input type="checkbox" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} /></label><label>Text size<select value={fontSize} onChange={(event) => setFontSize(event.target.value)}><option value="normal">Comfortable</option><option value="large">Large</option></select></label><label>Animations<select value={animationMode} onChange={(event) => setAnimationMode(event.target.value)}><option value="Full">Full</option><option value="Light">Light</option><option value="Off">Off</option></select></label><button className="test-speech" onClick={() => speech.speak('test', 'Lumina is ready when you are.')}>Test voice</button><div style={{marginTop: '20px', padding: '10px', background: 'var(--surface-2)', borderRadius: '8px'}}><BackendStatus /></div></aside>}
  
  {notice && <div className="toast" role="alert" style={isChildrenMode ? { fontSize: '20px', borderRadius: '16px', border: '3px solid var(--accent)', padding: '16px', background: 'white' } : {}}>{notice}<button onClick={() => setNotice('')}>×</button></div>}
  </m.main>
  </LazyMotion>;
}