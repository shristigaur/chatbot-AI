import { m } from 'framer-motion';

export default function BgYoungMan({ isLightMode, animationsActive }) {
  if (!animationsActive) return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a1020' }}>
      {/* Animated faint grid */}
      <m.div
        animate={{ y: [0, 40] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: '-40px 0 0 0',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Slow scanning light line */}
      {!isLightMode && (
        <m.div
          animate={{ y: ['-10vh', '110vh'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent)',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
          }}
        />
      )}
    </div>
  );
}
