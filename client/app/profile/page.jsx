"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/apiFetch';
import { API as API_URL } from '../../lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await apiFetch(`${API_URL}/user/preferences`);
        if (res.ok) {
          const data = await res.json();
          setPreferences(data);
        } else {
          setPreferences({});
        }
      } catch (err) {
        setPreferences({});
      }
    }
    loadPreferences();
  }, []);

  if (!preferences) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-lg mt-10">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Your Profile</h1>
        <p className="text-gray-500 mb-8">Anonymous User</p>
        
        <div className="space-y-4 mt-8">
          <button onClick={() => router.push('/')} className="w-full bg-gray-100 text-gray-800 p-3 rounded-lg hover:bg-gray-200">Back to Chat</button>
        </div>
      </div>
    </div>
  );
}
