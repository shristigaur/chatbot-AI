import { m } from 'framer-motion';

export default function SkinYoungMan({ mood, mousePos, animationsActive }) {
  const eyeX = (mousePos.x - 0.5) * 15;
  const isThinking = mood === 'thinking';
  const isTalking = mood === 'talking' || mood === 'happy';

  const bobble = animationsActive ? { y: [0, -3, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } } : {};

  return (
    <m.svg viewBox="0 0 100 100" width="100%" height="100%" animate={bobble}>
      <rect x="25" y="20" width="50" height="60" rx="15" fill="var(--surface-3)" stroke="var(--accent)" strokeWidth="3" />
      {/* Visor */}
      <rect x="20" y="35" width="60" height="20" rx="10" fill="#020617" stroke="var(--ink)" strokeWidth="3" />
      {/* Visor Scanner Light */}
      <m.rect x="25" y="38" width="15" height="14" rx="7" fill="var(--accent)" opacity="0.8"
        animate={animationsActive ? { x: [0, 35, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      {/* Moving eye inside visor */}
      <m.circle cx="50" cy="45" r="4" fill="white"
        animate={{ x: eyeX }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      />
      {/* Mouth pattern */}
      {isTalking ? (
        <m.g animate={animationsActive ? { scaleY: [1, 0.2, 1] } : {}} transition={{ duration: 0.15, repeat: Infinity }}>
          <rect x="40" y="65" width="4" height="6" fill="var(--accent)" />
          <rect x="48" y="65" width="4" height="6" fill="var(--accent)" />
          <rect x="56" y="65" width="4" height="6" fill="var(--accent)" />
        </m.g>
      ) : (
        <g>
          <rect x="40" y="67" width="20" height="2" fill="var(--ink)" />
        </g>
      )}
      {isThinking && (
        <m.circle cx="75" cy="15" r="6" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4"
          animate={animationsActive ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </m.svg>
  );
}
