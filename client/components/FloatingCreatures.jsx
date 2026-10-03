'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import FloatingCreature from './FloatingCreature';
import { getCreatures } from '../lib/creatures';

export default function FloatingCreatures({ generation = 'Adult' }) {
  const [limit, setLimit] = useState(4);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const files = useMemo(() => {
    return getCreatures(generation).slice(0, limit);
  }, [generation, limit]);
  useEffect(() => {
    const update = () => setLimit(window.innerWidth <= 780 ? 2 : 4);
    const visibility = () => setPaused(document.visibilityState !== 'visible');
    const motionPreference = () => setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    update(); visibility(); motionPreference();
    window.addEventListener('resize', update);
    document.addEventListener('visibilitychange', visibility);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener?.('change', motionPreference);
    return () => { window.removeEventListener('resize', update); document.removeEventListener('visibilitychange', visibility); media.removeEventListener?.('change', motionPreference); };
  }, []);
  return <AnimatePresence mode="wait"><motion.div key={generation || 'Adult'} className="floating-creatures" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: reduced ? 0 : 1 }} exit={{ opacity: 0 }} transition={{ duration: .45 }}>{files.map((creature, index) => <FloatingCreature key={creature.id || `${generation || 'Adult'}-${index}`} file={creature.file} index={index} paused={paused || reduced} />)}</motion.div></AnimatePresence>;
}
