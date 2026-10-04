import { m } from 'framer-motion';

export default function SkinGenZ({ mood, mousePos, animationsActive }) {
  const eyeX = (mousePos.x - 0.5) * 10;
  const eyeY = (mousePos.y - 0.5) * 10;
  const isThinking = mood === 'thinking';
  const isTalking = mood === 'talking' || mood === 'happy';

  const float = animationsActive ? { 
    y: [0, -8, 0],
    rotate: [-2, 2, -2],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
  } : {};
  
  const blink = animationsActive ? { scaleY: [1, 1, 0.1, 1, 1], transition: { duration: 2.5, repeat: Infinity, times: [0, 0.8, 0.85, 0.9, 1] } } : {};

  // Neon ghost blob
  return (
    <m.svg viewBox="0 0 100 100" width="100%" height="100%" animate={float}>
      <defs>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <path 
        d="M 25 75 Q 35 85 50 75 Q 65 85 75 75 L 75 40 C 75 10, 25 10, 25 40 Z" 
        fill="none" 
        stroke="var(--accent)" 
        strokeWidth="4" 
        filter="url(#neon-glow)"
      />
      
      <m.g animate={{ x: eyeX, y: eyeY }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
        {/* Eyes (X style) */}
        <m.path d="M 30 35 L 40 45 M 40 35 L 30 45" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" animate={blink} />
        <m.path d="M 60 35 L 70 45 M 70 35 L 60 45" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" animate={blink} />
        
        {/* Mouth */}
        {isTalking ? (
          <m.circle cx="50" cy="55" r="4" fill="var(--ink)" filter="url(#neon-glow)"
            animate={animationsActive ? { scale: [1, 1.5, 1], ry: [4, 8, 4] } : {}}
            transition={{ duration: 0.2, repeat: Infinity }}
          />
        ) : (
          <path d="M 45 55 Q 50 58 55 55" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        )}
      </m.g>
      
      {isThinking && (
        <m.text x="80" y="20" fontSize="24" fill="var(--accent)" filter="url(#neon-glow)"
          animate={animationsActive ? { opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] } : {}} 
          transition={{ duration: 1, repeat: Infinity }}
        >
          ?
        </m.text>
      )}
    </m.svg>
  );
}
