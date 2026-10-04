import { m, AnimatePresence } from 'framer-motion';

const BADGE_INFO = {
  'First Question': { icon: '🌱', desc: 'Asked your very first question!' },
  'Curious Mind': { icon: '🧠', desc: 'Asked 5 questions.' },
  'Vocal Explorer': { icon: '🎤', desc: 'Used the voice mic.' },
  '3-Day Streak': { icon: '🔥', desc: 'Returned 3 days in a row.' }
};

export default function ProgressModal({ isOpen, onClose, progress, isChildrenMode }) {
  if (!isOpen) return null;

  const xpProgress = progress.xp % 100;
  
  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        onClick={onClose}
      >
        <m.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{
            background: 'var(--surface-1)', padding: '24px', borderRadius: '16px',
            width: '90%', maxWidth: '400px', boxShadow: 'var(--shadow)', border: '1px solid var(--surface-2)'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>{isChildrenMode ? 'My Sticker Book' : 'My Collection'}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--ink)' }}>×</button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Level {progress.level}</span>
            <span>{xpProgress} / 100 XP</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--surface-3)', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ width: `${xpProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.5s ease' }} />
          </div>
          
          <div style={{ marginBottom: '16px', fontWeight: 'bold' }}>
            {isChildrenMode ? 'Stickers:' : 'Badges:'}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {Object.keys(BADGE_INFO).map(badge => {
              const hasBadge = progress.badges.includes(badge);
              return (
                <div 
                  key={badge} 
                  style={{ 
                    padding: '12px', borderRadius: '8px', background: 'var(--surface-2)', 
                    opacity: hasBadge ? 1 : 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                    border: hasBadge ? '1px solid var(--accent)' : '1px solid transparent'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px', filter: hasBadge ? 'none' : 'grayscale(100%)' }}>
                    {BADGE_INFO[badge].icon}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>{badge}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>{BADGE_INFO[badge].desc}</div>
                </div>
              );
            })}
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}
