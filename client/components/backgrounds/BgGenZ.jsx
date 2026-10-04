import { m } from 'framer-motion';

export default function BgGenZ({ isLightMode, animationsActive }) {
  if (!animationsActive) return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Morphing neon blobs */}
      <m.div
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
          borderRadius: ['30%', '50%', '30%']
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '30vw',
          height: '30vw',
          background: 'rgba(139, 92, 246, 0.1)',
          filter: 'blur(40px)',
          mixBlendMode: 'overlay'
        }}
      />
      
      <m.div
        animate={{ 
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, -40, 0],
          borderRadius: ['40%', '30%', '40%']
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '40vw',
          height: '40vw',
          background: 'rgba(236, 72, 153, 0.1)',
          filter: 'blur(50px)',
          mixBlendMode: 'overlay'
        }}
      />

      {/* Floating emoji reactions */}
      {!isLightMode && (
        <>
          <m.div
            animate={{ y: ['110vh', '-10vh'], x: [0, 20, -20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', left: '20%', fontSize: '24px', opacity: 0.3 }}
          >
            🔥
          </m.div>
          <m.div
            animate={{ y: ['110vh', '-10vh'], x: [0, -30, 30, 0] }}
            transition={{ duration: 20, repeat: Infinity, delay: 5, ease: 'linear' }}
            style={{ position: 'absolute', left: '80%', fontSize: '24px', opacity: 0.3 }}
          >
            💀
          </m.div>
        </>
      )}
    </div>
  );
}
