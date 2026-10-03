'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

function cleanSpeechText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)|\[([^\]]+)\]\([^)]*\)/g, '$1$2')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSpeechText(text, limit = 200) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks = [];
  let current = '';
  sentences.forEach((sentence) => {
    const next = `${current} ${sentence}`.trim();
    if (current && next.length > limit) {
      chunks.push(current);
      current = sentence.trim();
    } else {
      current = next;
    }
  });
  if (current) chunks.push(current);
  return chunks;
}

export default function useSpeech({ voice = '', rate = 1, pitch = 1, onUnsupported } = {}) {
  const [speakingId, setSpeakingId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);
  const chunksRef = useRef([]);
  const indexRef = useRef(0);
  const activeIdRef = useRef(null);

  const stopSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    chunksRef.current = [];
    indexRef.current = 0;
    activeIdRef.current = null;
    setSpeakingId(null);
    setIsPaused(false);
  }, []);

  const speak = useCallback((id, value) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      onUnsupported?.();
      return;
    }
    if (activeIdRef.current === id) {
      stopSpeech();
      return;
    }
    const text = cleanSpeechText(value);
    if (!text) return;
    stopSpeech();
    const chunks = splitSpeechText(text);
    chunksRef.current = chunks;
    indexRef.current = 0;
    activeIdRef.current = id;
    setSpeakingId(id);
    setIsPaused(false);

    const speakNext = () => {
      const chunk = chunksRef.current[indexRef.current];
      if (!chunk || activeIdRef.current !== id) return;
      const utterance = new window.SpeechSynthesisUtterance(chunk);
      utterance.rate = Number(rate);
      utterance.pitch = Number(pitch);
      utterance.voice = window.speechSynthesis.getVoices().find((item) => item.name === voice) || null;
      utterance.onend = () => {
        indexRef.current += 1;
        if (indexRef.current < chunksRef.current.length) speakNext();
        else stopSpeech();
      };
      utterance.onerror = stopSpeech;
      utteranceRef.current = utterance;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };
    speakNext();
  }, [onUnsupported, pitch, rate, stopSpeech, voice]);

  const togglePause = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !activeIdRef.current) return;
    if (isPaused) window.speechSynthesis.resume();
    else window.speechSynthesis.pause();
    setIsPaused(!isPaused);
  }, [isPaused]);

  useEffect(() => {
    const stopOnEscape = (event) => { if (event.key === 'Escape') stopSpeech(); };
    const stopOnUnload = () => stopSpeech();
    window.addEventListener('keydown', stopOnEscape);
    window.addEventListener('beforeunload', stopOnUnload);
    return () => {
      window.removeEventListener('keydown', stopOnEscape);
      window.removeEventListener('beforeunload', stopOnUnload);
      stopSpeech();
    };
  }, [stopSpeech]);

  return { speakingId, isPaused, speak, stopSpeech, togglePause };
}