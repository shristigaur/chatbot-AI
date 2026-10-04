import { useState, useEffect, useCallback } from 'react';

export default function useProgress() {
  const [progress, setProgress] = useState({
    streak: 0,
    lastActiveDate: '',
    xp: 0,
    level: 1,
    badges: [],
    questionsAsked: 0,
    askedByVoice: 0
  });

  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    async function loadProgress() {
      try {
        let data = {};
        const stored = localStorage.getItem('lumina_progress');
        if (stored) {
          data = JSON.parse(stored);
        }

        try {
          const res = await fetch('/api/user/progress');
          if (res.ok) {
            const apiData = await res.json();
            if (Object.keys(apiData).length > 0) {
              data = { ...data, ...apiData };
            }
          }
        } catch (e) {
          console.warn('API progress fetch failed, using local');
        }

        const today = new Date().toDateString();
        let newStreak = data.streak || 0;
        
        if (data.lastActiveDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (data.lastActiveDate === yesterday.toDateString()) {
            newStreak += 1;
          } else if (data.lastActiveDate) {
            newStreak = 1;
          } else {
            newStreak = 1; // first day
          }
          data.streak = newStreak;
          data.lastActiveDate = today;
          
          await updateProgress(data);
        } else {
          setProgress(prev => ({ ...prev, ...data }));
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading progress:', err);
        setLoading(false);
      }
    }
    loadProgress();
  }, []);

  const updateProgress = useCallback(async (updates) => {
    setProgress(prev => {
      const next = { ...prev, ...updates };
      
      // Calculate level based on XP (e.g. 100 XP per level)
      const nextLevel = Math.floor(next.xp / 100) + 1;
      if (nextLevel > prev.level) {
        next.level = nextLevel;
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }

      // Check badges
      const newBadges = new Set(next.badges);
      if (next.questionsAsked >= 1) newBadges.add('First Question');
      if (next.questionsAsked >= 5) newBadges.add('Curious Mind');
      if (next.askedByVoice >= 1) newBadges.add('Vocal Explorer');
      if (next.streak >= 3) newBadges.add('3-Day Streak');
      next.badges = Array.from(newBadges);

      localStorage.setItem('lumina_progress', JSON.stringify(next));
      
      fetch('/api/user/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      }).catch(() => {});
      
      return next;
    });
  }, []);

  const addXp = useCallback((amount, byVoice = false) => {
    setProgress(prev => {
      const updates = {
        xp: prev.xp + amount,
        questionsAsked: prev.questionsAsked + 1,
        askedByVoice: prev.askedByVoice + (byVoice ? 1 : 0)
      };
      updateProgress(updates);
      return prev;
    });
  }, [updateProgress]);

  return {
    progress,
    addXp,
    showLevelUp,
    loading
  };
}
