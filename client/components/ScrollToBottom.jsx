import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';

export default function ScrollToBottom({ scrollRef }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setVisible(scrollHeight - scrollTop - clientHeight > 150);
      }
    };
    const ref = scrollRef.current;
    if (ref) ref.addEventListener('scroll', onScroll, { passive: true });
    return () => ref && ref.removeEventListener('scroll', onScroll);
  }, [scrollRef]);

  return (
    <AnimatePresence>
      {visible && (
        <m.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
          style={{
            position: 'absolute', bottom: '90px', right: '24px', zIndex: 50,
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'var(--surface-1)', border: '1px solid var(--surface-2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
          }}
          aria-label="Scroll to bottom"
        >
          ↓
        </m.button>
      )}
    </AnimatePresence>
  );
}
