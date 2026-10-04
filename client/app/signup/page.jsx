"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/apiFetch';
import { useAuth } from '../../components/auth/AuthProvider';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState('Adult');
  const [error, setError] = useState('');
  const router = useRouter();
  const { setUser } = useAuth();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiFetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        body: JSON.stringify({ email, name, ageGroup, anonymousId: localStorage.getItem('anonymousId') })
      });
      const data = await res.json();
      
      if (res.ok) {
        // Automatically login
        const loginRes = await apiFetch(`${API_URL}/auth/login`, {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.accessToken) {
           localStorage.setItem('accessToken', loginData.accessToken);
           setUser(loginData.user);
           router.push('/');
        } else {
           router.push('/login');
        }
      } else {
        setError(data.error || 'Failed to sign up');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Profile</h1>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">{error}</div>}
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full border border-gray-300 rounded-lg p-3 text-gray-800" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-lg p-3 text-gray-800" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
            <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 bg-white">
              <option value="Child">Child</option>
              <option value="Teenager">Teenager</option>
              <option value="Adult">Adult</option>
              <option value="Senior">Senior</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 mt-4">Sign up</button>
        </form>
      </div>
    </div>
  );
}
