import { m } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function BgChildren({ isLightMode, animationsActive }) {
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setIsNight(hour < 6 || hour >= 18);
  }, []);

  if (!animationsActive) return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Sun or Moon depending on time */}
      <m.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '10%',
          right: '15%',
          fontSize: '80px',
          filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.4))'
        }}
      >
        {isNight ? '🌙' : '☀️'}
      </m.div>

      {/* Twinkling Stars (only at night) */}
      {isNight && (
        <>
          <m.div animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: 'absolute', top: '15%', left: '20%', fontSize: '24px', color: '#fef08a' }}>✨</m.div>
          <m.div animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} style={{ position: 'absolute', top: '25%', right: '35%', fontSize: '20px', color: '#fef08a' }}>✨</m.div>
          {!isLightMode && <m.div animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} style={{ position: 'absolute', top: '40%', left: '10%', fontSize: '16px', color: '#fef08a' }}>✨</m.div>}
        </>
      )}

      {/* Slow Clouds */}
      <m.div
        animate={{ x: ['-10vw', '110vw'] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', top: '20%', left: 0, opacity: isNight ? 0.2 : 0.6 }}
      >
        ☁️
      </m.div>
      <m.div
        animate={{ x: ['110vw', '-10vw'] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', top: '50%', right: 0, fontSize: '40px', opacity: isNight ? 0.2 : 0.6 }}
      >
        ☁️
      </m.div>

      {/* Balloons / Rocket (omitted in light mode) */}
      {!isLightMode && (
        <>
          <m.div
            animate={{ y: ['110vh', '-20vh'], x: [0, 20, 0, -20, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', left: '30%', fontSize: '40px' }}
          >
            🎈
          </m.div>
          <m.div
            animate={{ y: ['110vh', '-20vh'], x: ['-10vw', '110vw'] }}
            transition={{ duration: 30, repeat: Infinity, delay: 10, ease: 'linear' }}
            style={{ position: 'absolute', left: '10%', fontSize: '30px' }}
          >
            🚀
          </m.div>
        </>
      )}
    </div>
  );
}
