import { m } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function BgAdult({ isLightMode, animationsActive }) {
  const [timeGradient, setTimeGradient] = useState('rgba(79, 70, 229, 0.05)');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6 || hour >= 18) {
      // Night
      setTimeGradient('rgba(30, 58, 138, 0.08)');
    } else if (hour < 12) {
      // Morning
      setTimeGradient('rgba(252, 211, 77, 0.05)');
    } else {
      // Afternoon
      setTimeGradient('rgba(79, 70, 229, 0.05)');
    }
  }, []);

  if (!animationsActive) return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <m.div
        animate={{ 
          background: [
            `radial-gradient(circle at 20% 30%, ${timeGradient} 0%, transparent 60%)`,
            `radial-gradient(circle at 80% 70%, ${timeGradient} 0%, transparent 60%)`,
            `radial-gradient(circle at 20% 30%, ${timeGradient} 0%, transparent 60%)`
          ]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply' }}
      />

      {/* Subtle Drifting Particles */}
      <m.div
        animate={{ y: ['100vh', '-10vh'], x: [0, 30, 0, -30, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', left: '20%', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--ink)', opacity: 0.1 }}
      />
      <m.div
        animate={{ y: ['100vh', '-10vh'], x: [0, -40, 0, 40, 0] }}
        transition={{ duration: 55, repeat: Infinity, delay: 5, ease: 'linear' }}
        style={{ position: 'absolute', left: '70%', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ink)', opacity: 0.05 }}
      />

      {!isLightMode && (
        <m.div
          animate={{ y: ['100vh', '-10vh'], x: [0, 20, 0, -20, 0] }}
          transition={{ duration: 45, repeat: Infinity, delay: 15, ease: 'linear' }}
          style={{ position: 'absolute', left: '45%', width: '3px', height: '3px', borderRadius: '50%', background: 'var(--ink)', opacity: 0.15 }}
        />
      )}
    </div>
  );
}
