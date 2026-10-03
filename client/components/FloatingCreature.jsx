'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Lottie } from 'lottie-react';

export default function FloatingCreature({ file, index, paused }) {
  const reduced = useReducedMotion();
  const [data, setData] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    if (!file) return undefined;
    fetch(file, { signal: controller.signal }).then((response) => response.ok ? response.json() : null).then(setData).catch(() => {});
    return () => controller.abort();
  }, [file]);
  const path = { x: [0, index % 2 ? -20 : 20, 0], y: [0, -12 - index * 4, 0], rotate: [0, index % 2 ? -4 : 4, 0] };
  return <motion.div className="floating-creature" style={{ '--creature-index': index }} aria-hidden="true" animate={reduced || paused ? { opacity: .45 } : path} transition={{ duration: 8 + index * 1.5, repeat: reduced || paused ? 0 : Infinity, repeatType: 'mirror', ease: 'easeInOut' }}>{data ? <Lottie animationData={data} loop={!reduced && !paused} autoplay={!reduced && !paused} isPaused={reduced || paused} /> : <svg viewBox="0 0 100 100" className="fallback-creature"><path d="M25 72V43C25 22 75 22 75 43V72C68 82 59 76 50 84C41 76 32 82 25 72Z" fill="#85c9b3" stroke="#18322e" strokeWidth="4" /><circle cx="41" cy="49" r="5" fill="#18322e" /><circle cx="59" cy="49" r="5" fill="#18322e" /><path d="M43 62Q50 68 57 62" fill="none" stroke="#18322e" strokeWidth="3" strokeLinecap="round" /></svg>}</motion.div>;
}
