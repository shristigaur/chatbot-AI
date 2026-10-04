import { m } from 'framer-motion';

export default function SkinSenior({ mood, mousePos, animationsActive }) {
  const eyeX = (mousePos.x - 0.5) * 6;
  const eyeY = (mousePos.y - 0.5) * 6;
  const isThinking = mood === 'thinking';
  const isTalking = mood === 'talking' || mood === 'happy';

  const bobble = animationsActive ? { y: [0, -2, 0], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' } } : {};
  const blink = animationsActive ? { scaleY: [1, 1, 0.1, 1, 1], transition: { duration: 6, repeat: Infinity, times: [0, 0.9, 0.92, 0.94, 1] } } : {};

  return (
    <m.svg viewBox="0 0 100 100" width="100%" height="100%" animate={bobble}>
      {/* Owl Body */}
      <path d="M 30 70 C 30 30, 70 30, 70 70 C 70 90, 30 90, 30 70" fill="var(--surface-3)" stroke="var(--ink)" strokeWidth="3" />
      {/* Feathers/Wings */}
      <path d="M 30 50 Q 20 65 35 80" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <path d="M 70 50 Q 80 65 65 80" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      
      {/* Glasses */}
      <circle cx="40" cy="45" r="12" fill="none" stroke="var(--accent)" strokeWidth="3" />
      <circle cx="60" cy="45" r="12" fill="none" stroke="var(--accent)" strokeWidth="3" />
      <line x1="52" y1="45" x2="48" y2="45" stroke="var(--accent)" strokeWidth="3" />
      
      <m.g animate={{ x: eyeX, y: eyeY }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
        {/* Eyes */}
        <m.circle cx="40" cy="45" r="4" fill="var(--ink)" animate={blink} />
        <m.circle cx="60" cy="45" r="4" fill="var(--ink)" animate={blink} />
      </m.g>
      
      {/* Beak / Mouth */}
      {isTalking ? (
        <m.path d="M 45 60 L 50 68 L 55 60 Z" fill="#f59e0b" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round"
          animate={animationsActive ? { d: ["M 45 60 L 50 68 L 55 60 Z", "M 45 60 L 50 63 L 55 60 Z", "M 45 60 L 50 68 L 55 60 Z"] } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
      ) : (
        <path d="M 45 60 L 50 65 L 55 60 Z" fill="#f59e0b" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
      )}
      
      {isThinking && (
        <m.path d="M 75 25 Q 85 20 90 10" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 3"
          animate={animationsActive ? { strokeDashoffset: [0, -20] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </m.svg>
  );
}
