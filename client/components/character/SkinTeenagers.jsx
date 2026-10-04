import { m } from 'framer-motion';

export default function SkinTeenagers({ mood, mousePos, animationsActive }) {
  const eyeX = (mousePos.x - 0.5) * 12;
  const eyeY = (mousePos.y - 0.5) * 12;
  const isThinking = mood === 'thinking';
  const isTalking = mood === 'talking' || mood === 'happy';

  const bobble = animationsActive ? { rotate: [-5, 5, -5], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } } : {};
  const blink = animationsActive ? { scaleY: [1, 1, 0.1, 1, 1], transition: { duration: 4, repeat: Infinity, times: [0, 0.95, 0.96, 0.97, 1] } } : {};

  return (
    <m.svg viewBox="0 0 100 100" width="100%" height="100%" animate={bobble}>
      {/* Sticker Outline */}
      <path d="M 20 40 L 30 10 L 50 30 L 70 10 L 80 40 L 90 80 L 10 80 Z" fill="white" stroke="white" strokeWidth="8" strokeLinejoin="round" />
      {/* Cat Base */}
      <path d="M 20 40 L 30 10 L 50 30 L 70 10 L 80 40 L 90 80 L 10 80 Z" fill="var(--surface-3)" stroke="var(--ink)" strokeWidth="4" strokeLinejoin="round" />
      <m.g animate={{ x: eyeX, y: eyeY }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
        {/* Eyes */}
        <m.ellipse cx="35" cy="50" rx="4" ry="8" fill="var(--ink)" animate={blink} />
        <m.ellipse cx="65" cy="50" rx="4" ry="8" fill="var(--ink)" animate={blink} />
        {/* Whiskers */}
        <line x1="10" y1="50" x2="25" y2="48" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="55" x2="25" y2="55" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        <line x1="90" y1="50" x2="75" y2="48" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        <line x1="90" y1="55" x2="75" y2="55" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        {/* Mouth */}
        {isTalking ? (
          <m.path d="M 45 60 L 50 65 L 55 60 Z" fill="#ef4444" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round"
            animate={animationsActive ? { scaleY: [1, 0.5, 1] } : {}}
            transition={{ duration: 0.2, repeat: Infinity }}
          />
        ) : (
          <path d="M 40 60 Q 45 65 50 60 Q 55 65 60 60" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </m.g>
      {isThinking && (
        <m.text x="80" y="20" fontSize="24" animate={animationsActive ? { opacity: [0, 1, 0], y: [0, -10, -20] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>!</m.text>
      )}
    </m.svg>
  );
}
