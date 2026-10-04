import { m } from 'framer-motion';

export default function BgGenAlpha({ isLightMode, animationsActive }) {
  if (!animationsActive) return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Game grid base */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 2px, transparent 2px)',
        backgroundSize: '50px 50px'
      }} />
      
      {/* Level-up floating blocks */}
      <m.div
        animate={{ y: ['110vh', '-10vh'], rotate: [0, 90, 180] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          left: '15%',
          width: '30px',
          height: '30px',
          background: 'var(--accent)',
          border: '3px solid black',
          boxShadow: '3px 3px 0 black'
        }}
      />
      
      <m.div
        animate={{ y: ['110vh', '-10vh'], rotate: [0, -90, -180] }}
        transition={{ duration: 15, repeat: Infinity, delay: 4, ease: 'linear' }}
        style={{
          position: 'absolute',
          right: '25%',
          width: '40px',
          height: '40px',
          background: 'white',
          border: '3px solid black',
          boxShadow: '3px 3px 0 black'
        }}
      />
      
      {!isLightMode && (
        <m.div
          animate={{ y: ['110vh', '-10vh'], rotate: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, delay: 8, ease: 'linear' }}
          style={{ position: 'absolute', left: '60%', fontSize: '30px' }}
        >
          ⭐
        </m.div>
      )}
    </div>
  );
}
