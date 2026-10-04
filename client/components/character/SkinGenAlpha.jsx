import { m } from 'framer-motion';

export default function SkinGenAlpha({ mood, mousePos, animationsActive }) {
  const eyeX = (mousePos.x - 0.5) * 8;
  const eyeY = (mousePos.y - 0.5) * 8;
  const isThinking = mood === 'thinking';
  const isTalking = mood === 'talking' || mood === 'happy';

  // Blocky jumpy motion
  const bobble = animationsActive ? { 
    y: [0, -5, 0], 
    transition: { duration: 1, repeat: Infinity, ease: 'steps(3)' } 
  } : {};
  
  const blink = animationsActive ? { 
    scaleY: [1, 1, 0.1, 1, 1], 
    transition: { duration: 3, repeat: Infinity, times: [0, 0.9, 0.92, 0.94, 1] } 
  } : {};

  return (
    <m.svg viewBox="0 0 100 100" width="100%" height="100%" animate={bobble}>
      {/* Blocky base */}
      <rect x="20" y="20" width="60" height="60" fill="var(--surface-3)" stroke="black" strokeWidth="6" />
      <rect x="25" y="25" width="50" height="50" fill="white" stroke="none" />
      
      <m.g animate={{ x: Math.round(eyeX/2)*2, y: Math.round(eyeY/2)*2 }} transition={{ duration: 0.1 }}>
        {/* Pixel Eyes */}
        <m.rect x="35" y="40" width="8" height="8" fill="black" animate={blink} />
        <m.rect x="57" y="40" width="8" height="8" fill="black" animate={blink} />
        
        {/* Pixel Mouth */}
        {isTalking ? (
          <m.rect x="42" y="60" width="16" height="8" fill="var(--accent)" stroke="black" strokeWidth="2"
            animate={animationsActive ? { scaleY: [1, 0.5, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, ease: 'steps(2)' }}
          />
        ) : (
          <rect x="42" y="60" width="16" height="4" fill="black" />
        )}
      </m.g>
      
      {isThinking && (
        <m.g animate={animationsActive ? { y: [0, -4, 0] } : {}} transition={{ duration: 0.5, repeat: Infinity, ease: 'steps(2)' }}>
          <rect x="75" y="10" width="6" height="6" fill="black" />
          <rect x="85" y="5" width="6" height="6" fill="black" />
        </m.g>
      )}
    </m.svg>
  );
}
