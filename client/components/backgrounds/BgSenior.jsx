import { m } from 'framer-motion';

export default function BgSenior({ isLightMode, animationsActive }) {
  if (!animationsActive) return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Warm gentle gradient */}
      <m.div
        animate={{ 
          background: [
            'radial-gradient(circle at 20% 80%, rgba(245, 158, 11, 0.05) 0%, transparent 60%)',
            'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.05) 0%, transparent 60%)',
            'radial-gradient(circle at 20% 80%, rgba(245, 158, 11, 0.05) 0%, transparent 60%)'
          ]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply' }}
      />
      
      {/* Floating leaves/petals */}
      <m.div
        animate={{ y: ['-10vh', '110vh'], x: [0, 40, -20, 30, 0], rotate: [0, 180, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', left: '30%', fontSize: '24px', opacity: 0.4 }}
      >
        🍂
      </m.div>
      
      {!isLightMode && (
        <m.div
          animate={{ y: ['-10vh', '110vh'], x: [0, -30, 20, -10, 0], rotate: [0, -180, -360] }}
          transition={{ duration: 35, repeat: Infinity, delay: 10, ease: 'linear' }}
          style={{ position: 'absolute', left: '70%', fontSize: '20px', opacity: 0.3 }}
        >
          🍃
        </m.div>
      )}
    </div>
  );
}
