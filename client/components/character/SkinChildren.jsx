import { m } from 'framer-motion';

export default function SkinChildren({ mood, mousePos, animationsActive }) {
  const eyeX = (mousePos.x - 0.5) * 8;
  const eyeY = (mousePos.y - 0.5) * 8;
  const isThinking = mood === 'thinking';
  const isTalking = mood === 'talking' || mood === 'happy';

  const bobble = animationsActive ? { y: [0, -6, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } } : {};
  const blink = animationsActive ? { scaleY: [1, 1, 0.1, 1, 1], transition: { duration: 3, repeat: Infinity, times: [0, 0.9, 0.92, 0.94, 1] } } : {};

  return (
    <m.svg viewBox="0 0 100 100" width="100%" height="100%" animate={bobble}>
      {/* Ears */}
      <circle cx="20" cy="25" r="15" fill="var(--surface-3)" stroke="var(--ink)" strokeWidth="4" />
      <circle cx="80" cy="25" r="15" fill="var(--surface-3)" stroke="var(--ink)" strokeWidth="4" />
      {/* Head */}
      <circle cx="50" cy="55" r="40" fill="white" stroke="var(--ink)" strokeWidth="4" />
      <m.g animate={{ x: eyeX, y: eyeY }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
        {/* Eyes */}
        <m.circle cx="35" cy="45" r="6" fill="var(--ink)" animate={blink} />
        <m.circle cx="65" cy="45" r="6" fill="var(--ink)" animate={blink} />
        {/* Cheeks */}
        <circle cx="25" cy="55" r="5" fill="#fca5a5" opacity="0.6" />
        <circle cx="75" cy="55" r="5" fill="#fca5a5" opacity="0.6" />
        {/* Mouth */}
        {isTalking ? (
          <m.path d="M 40 60 Q 50 75 60 60 Z" fill="#ef4444" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round"
            animate={animationsActive ? { d: ["M 40 60 Q 50 75 60 60 Z", "M 40 60 Q 50 65 60 60 Z", "M 40 60 Q 50 75 60 60 Z"] } : {}}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
        ) : (
          <path d="M 40 60 Q 50 70 60 60" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
        )}
      </m.g>
      {isThinking && (
        <m.g animate={animationsActive ? { y: [-2, 2, -2] } : {}} transition={{ duration: 1, repeat: Infinity }}>
          <circle cx="75" cy="15" r="5" fill="var(--accent)" />
          <circle cx="85" cy="5" r="8" fill="var(--accent)" />
        </m.g>
      )}
    </m.svg>
  );
}
