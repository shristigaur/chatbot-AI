import React from 'react';

export default function CharacterAvatar({ generation = 'default', mood = 'idle', size = 28 }) {
  if (generation === 'cartoon') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="20" fill="#f6c453" />
        <circle cx="35" cy="40" r="8" fill="#15211e" />
        <circle cx="65" cy="40" r="8" fill="#15211e" />
        {mood === 'speaking' ? (
          <path d="M 40 65 Q 50 75 60 65" stroke="#15211e" strokeWidth="6" strokeLinecap="round" />
        ) : mood === 'thinking' ? (
          <circle cx="50" cy="65" r="4" fill="#15211e" />
        ) : (
          <path d="M 40 65 Q 50 70 60 65" stroke="#15211e" strokeWidth="4" strokeLinecap="round" />
        )}
      </svg>
    );
  }
  return <div style={{width: size, height: size, background: 'var(--surface-3)', borderRadius: '50%'}}></div>;
}