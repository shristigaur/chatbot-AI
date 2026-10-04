import { m } from 'framer-motion';

export default function BgTeenagers({ isLightMode, animationsActive }) {
  if (!animationsActive) return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Mesh Gradient Base */}
      <m.div
        animate={{ 
          background: [
            'radial-gradient(circle at 0% 0%, rgba(217, 70, 239, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, rgba(217, 70, 239, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 0% 0%, rgba(217, 70, 239, 0.1) 0%, transparent 50%)'
          ]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay' }}
      />
      <m.div
        animate={{ 
          background: [
            'radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 0% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)'
          ]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay' }}
      />

      {/* Drifting Doodles */}
      <m.div
        animate={{ rotate: 360, y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', top: '20%', left: '15%', fontSize: '24px', opacity: 0.3 }}
      >
        ✦
      </m.div>
      <m.div
        animate={{ rotate: -360, y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', top: '70%', right: '20%', fontSize: '24px', opacity: 0.3 }}
      >
        ✧
      </m.div>

      {/* Sticker Pop-ins (omitted in light mode) */}
      {!isLightMode && (
        <>
          <m.div
            animate={{ opacity: [0, 0, 0.5, 0, 0], scale: [0, 0, 1, 1.2, 0] }}
            transition={{ duration: 8, repeat: Infinity, times: [0, 0.2, 0.3, 0.5, 1] }}
            style={{ position: 'absolute', top: '40%', left: '80%', fontSize: '30px' }}
          >
            💖
          </m.div>
          <m.div
            animate={{ opacity: [0, 0, 0.4, 0, 0], scale: [0, 0, 1, 1.1, 0] }}
            transition={{ duration: 10, repeat: Infinity, times: [0, 0.5, 0.6, 0.8, 1], delay: 2 }}
            style={{ position: 'absolute', top: '15%', left: '40%', fontSize: '30px' }}
          >
            ✨
          </m.div>
        </>
      )}
    </div>
  );
}
