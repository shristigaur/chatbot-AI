import { useState, useEffect } from 'react';
import usePageVisible from './usePageVisible';

export default function useAnimationMode() {
  const [animationMode, setAnimationMode] = useState('Full');
  const isVisible = usePageVisible();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check local storage
    const saved = localStorage.getItem('lumina-animation-mode');
    if (saved && ['Full', 'Light', 'Off'].includes(saved)) {
      setAnimationMode(saved);
      return;
    }

    // Auto-detect best mode
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimationMode('Off');
      return;
    }

    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    
    // Simple heuristic for low-end devices or mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile || cores <= 4 || memory <= 4) {
      setAnimationMode('Light');
    } else {
      setAnimationMode('Full');
    }
  }, []);

  const saveMode = (mode) => {
    setAnimationMode(mode);
    localStorage.setItem('lumina-animation-mode', mode);
  };

  const animationsActive = animationMode !== 'Off' && isVisible;

  return { animationMode, setAnimationMode: saveMode, animationsActive };
}
