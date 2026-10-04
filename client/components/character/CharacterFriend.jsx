import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import useAnimationMode from '../../hooks/useAnimationMode';
import { m, AnimatePresence } from 'framer-motion';
import { FUN_FACTS } from '../../lib/funFacts';

const SkinChildren = dynamic(() => import('./SkinChildren'), { ssr: false });
const SkinTeenagers = dynamic(() => import('./SkinTeenagers'), { ssr: false });
const SkinAdult = dynamic(() => import('./SkinAdult'), { ssr: false });
const SkinYoungMan = dynamic(() => import('./SkinYoungMan'), { ssr: false });
const SkinSenior = dynamic(() => import('./SkinSenior'), { ssr: false });
const SkinGenZ = dynamic(() => import('./SkinGenZ'), { ssr: false });
const SkinGenAlpha = dynamic(() => import('./SkinGenAlpha'), { ssr: false });


export default function CharacterFriend({ generation = 'Adult', overrideMood = null, size = 64 }) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isSleeping, setIsSleeping] = useState(false);
  const [isGiggling, setIsGiggling] = useState(false);
  const [isWaving, setIsWaving] = useState(true);
  const [speechBubble, setSpeechBubble] = useState('');
  const containerRef = useRef(null);
  const activityTimeout = useRef(null);
  const { animationsActive } = useAnimationMode();

  useEffect(() => {
    // Wave on first load
    const timer = setTimeout(() => setIsWaving(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const resetActivity = () => {
    if (isSleeping) {
      // Wake up with a yawn
      setIsSleeping(false);
      setSpeechBubble('Yawn...');
      setTimeout(() => {
        setSpeechBubble('');
      }, 2000);
    }
    if (activityTimeout.current) clearTimeout(activityTimeout.current);
    activityTimeout.current = setTimeout(() => {
      setIsSleeping(true);
      setSpeechBubble('');
    }, 60000); // 60 seconds
  };

  useEffect(() => {
    if (!animationsActive) return;
    
    let rafId;
    let lastTime = 0;
    
    const handleMouseMove = (e) => {
      resetActivity();
      const now = performance.now();
      if (now - lastTime < 50) return; // throttle to ~20fps
      lastTime = now;
      
      rafId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = (e.clientX - centerX) / (window.innerWidth / 2);
        const dy = (e.clientY - centerY) / (window.innerHeight / 2);
        const clampedX = Math.max(-1, Math.min(1, dx));
        const clampedY = Math.max(-1, Math.min(1, dy));
        setMousePos({ x: (clampedX + 1) / 2, y: (clampedY + 1) / 2 });
      });
    };

    const handleKeydown = () => resetActivity();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeydown);
    resetActivity();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeydown);
      if (rafId) cancelAnimationFrame(rafId);
      if (activityTimeout.current) clearTimeout(activityTimeout.current);
    };
  }, [animationsActive, isSleeping]);

  const handleTap = () => {
    setIsGiggling(true);
    resetActivity();
    
    const facts = FUN_FACTS[generation] || FUN_FACTS['Adult'];
    const fact = facts[Math.floor(Math.random() * facts.length)];
    setSpeechBubble(fact);
    
    setTimeout(() => {
      setIsGiggling(false);
    }, 1000);
    
    setTimeout(() => {
      setSpeechBubble('');
    }, 5000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTap();
    }
  };

  let computedMood = overrideMood || 'idle';
  if (isSleeping && !overrideMood) computedMood = 'sleep';
  if (isWaving) computedMood = 'waving';
  if (isGiggling) computedMood = 'happy';

  const props = { mood: computedMood, mousePos, animationsActive };
  
  let Skin = SkinAdult;
  if (generation === 'Children') Skin = SkinChildren;
  else if (generation === 'Teenagers') Skin = SkinTeenagers;
  else if (generation === 'Young Man') Skin = SkinYoungMan;
  else if (generation === 'Old/Senior') Skin = SkinSenior;
  else if (generation === 'Gen Z') Skin = SkinGenZ;
  else if (generation === 'Gen Alpha') Skin = SkinGenAlpha;

  return (
    <div 
      ref={containerRef} 
      style={{ width: size, height: size, flexShrink: 0, position: 'relative', cursor: 'pointer' }} 
      className="character-friend"
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${generation} character`}
    >
      <m.div
        animate={isGiggling ? { y: [0, -10, 0, -10, 0] } : {}}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Skin {...props} />
      </m.div>
      
      {isWaving && animationsActive && (
        <m.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 1, rotate: [0, 20, -20, 20, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          style={{ position: 'absolute', right: '-15px', top: '10px', fontSize: '24px' }}
        >
          👋
        </m.div>
      )}
      
      <AnimatePresence>
        {speechBubble && (
          <m.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            aria-live="polite"
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--surface-3)',
              color: 'var(--ink)',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '2px solid var(--accent)',
              fontSize: '12px',
              width: 'max-content',
              maxWidth: '200px',
              textAlign: 'center',
              zIndex: 20,
              boxShadow: 'var(--shadow)'
            }}
          >
            {speechBubble}
          </m.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {computedMood === 'sleep' && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '20px', fontWeight: 'bold', color: 'var(--accent)' }}
          >
            <m.div
              animate={{ y: [0, -10, -20], opacity: [0, 1, 0], scale: [0.5, 1, 1.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              z
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
