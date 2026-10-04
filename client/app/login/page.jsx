"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/apiFetch';
import { useAuth } from '../../components/auth/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setUser } = useAuth();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiFetch(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.accessToken) {
          // Dev email_only mode
          localStorage.setItem('accessToken', data.accessToken);
          setUser(data.user);
          router.push('/');
        } else {
          // OTP sent
          setStep(2);
        }
      } else {
        setError(data.error || 'Failed to login');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiFetch(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      
      if (res.ok && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
        router.push('/');
      } else {
        setError(data.error || 'Failed to verify OTP');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Log in</h1>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-lg p-3 text-gray-800" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700">Continue</button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit Code</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required className="w-full border border-gray-300 rounded-lg p-3 text-gray-800" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700">Verify</button>
          </form>
        )}
      </div>
    </div>
  );
}
