import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import useAnimationMode from '../../hooks/useAnimationMode';

import { m, AnimatePresence } from 'framer-motion';

const BgChildren = dynamic(() => import('./BgChildren'), { ssr: false });
const BgTeenagers = dynamic(() => import('./BgTeenagers'), { ssr: false });
const BgAdult = dynamic(() => import('./BgAdult'), { ssr: false });
const BgYoungMan = dynamic(() => import('./BgYoungMan'), { ssr: false });
const BgSenior = dynamic(() => import('./BgSenior'), { ssr: false });
const BgGenZ = dynamic(() => import('./BgGenZ'), { ssr: false });
const BgGenAlpha = dynamic(() => import('./BgGenAlpha'), { ssr: false });

export default function LivingBackground({ generation }) {
  const { animationMode, animationsActive } = useAnimationMode();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Render nothing or just a static base if animations are fully off
  if (animationMode === 'Off') {
    return <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'var(--bg)' }} aria-hidden="true" />;
  }

  const props = {
    isLightMode: animationMode === 'Light',
    animationsActive
  };

  let BgComponent = BgAdult;
  if (generation === 'Children') BgComponent = BgChildren;
  else if (generation === 'Teenagers') BgComponent = BgTeenagers;
  else if (generation === 'Young Man') BgComponent = BgYoungMan;
  else if (generation === 'Old/Senior') BgComponent = BgSenior;
  else if (generation === 'Gen Z') BgComponent = BgGenZ;
  else if (generation === 'Gen Alpha') BgComponent = BgGenAlpha;

  return (
    <div 
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
      aria-hidden="true"
    >
      <AnimatePresence>
        <m.div
          key={generation}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <BgComponent {...props} />
        </m.div>
      </AnimatePresence>
    </div>
  );
}
