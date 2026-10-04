import { m, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Confetti({ active }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: 15 }).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        scale: Math.random() * 0.5 + 0.5,
        color: ['#fef08a', '#818cf8', '#34d399', '#f472b6'][Math.floor(Math.random() * 4)],
        rotation: Math.random() * 360
      }));
      setParticles(newParticles);
      
      const timer = setTimeout(() => setParticles([]), 1500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!active && particles.length === 0) return null;

  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 10 }}>
      <AnimatePresence>
        {particles.map(p => (
          <m.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{ 
              x: p.x, 
              y: p.y - 50, 
              scale: p.scale, 
              opacity: 0,
              rotate: p.rotation + 180
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 + Math.random() * 0.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              backgroundColor: p.color,
              borderRadius: '50%',
              boxShadow: `0 0 4px ${p.color}`
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
