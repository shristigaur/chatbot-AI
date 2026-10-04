import { m } from 'framer-motion';

export default function SkinAdult({ mood, mousePos, animationsActive }) {
  // Adult: Minimal friendly orb/robot
  // mousePos.x is 0 to 1, we map it to -5 to 5
  const eyeX = (mousePos.x - 0.5) * 10;
  const eyeY = (mousePos.y - 0.5) * 10;

  const isThinking = mood === 'thinking';
  const isTalking = mood === 'talking' || mood === 'happy';

  const bobble = animationsActive ? {
    y: [0, -4, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
  } : {};

  const blink = animationsActive ? {
    scaleY: [1, 1, 0.1, 1, 1],
    transition: { duration: 4, repeat: Infinity, times: [0, 0.95, 0.96, 0.97, 1] }
  } : {};

  return (
    <m.svg viewBox="0 0 100 100" width="100%" height="100%" animate={bobble}>
      <circle cx="50" cy="50" r="45" fill="var(--surface-3)" stroke="var(--border)" strokeWidth="3" />
      <m.g animate={{ x: eyeX, y: eyeY }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
        {/* Eyes */}
        <m.circle cx="35" cy="45" r="5" fill="var(--ink)" animate={blink} />
        <m.circle cx="65" cy="45" r="5" fill="var(--ink)" animate={blink} />
        {/* Mouth */}
        {isTalking ? (
          <m.path 
            d="M 40 60 Q 50 70 60 60" 
            fill="none" 
            stroke="var(--ink)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            animate={animationsActive ? { d: ["M 40 60 Q 50 70 60 60", "M 40 60 Q 50 65 60 60", "M 40 60 Q 50 70 60 60"] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        ) : (
          <path d="M 45 60 Q 50 62 55 60" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        )}
      </m.g>
      {isThinking && (
        <m.circle cx="85" cy="20" r="8" fill="var(--accent)"
          animate={animationsActive ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </m.svg>
  );
}
