"use client";

import React from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-lg mt-10">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">{user.name}'s Profile</h1>
        <p className="text-gray-500 mb-8">{user.email}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Age Group</div>
            <div className="text-lg font-bold text-gray-800">{user.ageGroup || 'Adult'}</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Character</div>
            <div className="text-lg font-bold text-gray-800">{user.character?.nickname || 'Pip'}</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <button onClick={() => router.push('/')} className="w-full bg-gray-100 text-gray-800 p-3 rounded-lg hover:bg-gray-200">Back to Chat</button>
          <button onClick={logout} className="w-full bg-red-50 text-red-600 p-3 rounded-lg hover:bg-red-100">Log out</button>
        </div>
      </div>
    </div>
  );
}
