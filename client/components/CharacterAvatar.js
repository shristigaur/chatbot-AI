'use client';

import { motion, useReducedMotion } from 'framer-motion';

const designs = {
  animal: { body: '#f0a35b', ear: '#d9794e', eye: '#17231f' },
  wizard: { body: '#7383b8', ear: '#506292', eye: '#f8d77b' },
  streetwear: { body: '#5f8fc4', ear: '#d96e4f', eye: '#f6f8ef' },
  alien: { body: '#73b89b', ear: '#4d8c73', eye: '#18251f' },
  robot: { body: '#9ba8a5', ear: '#5b706a', eye: '#d96e4f' },
};

export default function CharacterAvatar({ mood = 'idle', generation = 'robot', size = 58 }) {
  const reduceMotion = useReducedMotion();
  const design = designs[generation] || designs.robot;
  const floating = reduceMotion ? {} : { y: [0, -4, 0] };
  const mouth = mood === 'speaking' || mood === 'happy' ? 'M43 53 Q50 60 57 53' : 'M44 54 Q50 57 56 54';
  return <motion.svg className={`character-avatar avatar-${generation}`} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${generation} assistant avatar`} animate={floating} transition={{ duration: 3, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' }}>
    <motion.path d="M27 35 L15 20 L34 27 M73 35 L85 20 L66 27" fill={design.ear} stroke="#15211e" strokeWidth="3" strokeLinejoin="round" />
    <motion.rect x="24" y="25" width="52" height="52" rx={generation === 'robot' ? 11 : 25} fill={design.body} stroke="#15211e" strokeWidth="3" />
    <motion.ellipse cx="40" cy="46" rx="5" ry={mood === 'thinking' ? 2 : 5} fill={design.eye} animate={reduceMotion ? {} : { scaleY: [1, 1, .15, 1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, .88, .9, .93, 1] }} />
    <motion.ellipse cx="60" cy="46" rx="5" ry={mood === 'thinking' ? 2 : 5} fill={design.eye} animate={reduceMotion ? {} : { scaleY: [1, 1, .15, 1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, .88, .9, .93, 1] }} />
    {mood === 'thinking' ? <g fill={design.eye}><circle cx="43" cy="62" r="2" /><circle cx="50" cy="62" r="2" /><circle cx="57" cy="62" r="2" /></g> : <path d={mouth} fill="none" stroke={design.eye} strokeWidth="3" strokeLinecap="round" />}
    {mood === 'happy' && <motion.path d="M79 60 Q93 48 88 34" fill="none" stroke={design.ear} strokeWidth="5" strokeLinecap="round" animate={reduceMotion ? {} : { rotate: [0, 12, 0] }} transition={{ duration: 1.2, repeat: 2 }} />}
  </motion.svg>;
}