"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch } from '../../lib/apiFetch';

const AuthContext = createContext({ user: null, loading: true, logout: () => {} });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      router.push('/welcome');
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [router]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiFetch(`${API_URL}/auth/me`);
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          
          if (['/welcome', '/login', '/signup'].includes(pathname)) {
            router.push('/');
          }
        } else {
          setUser(null);
          if (!['/welcome', '/login', '/signup'].includes(pathname)) {
            router.push('/welcome');
          }
        }
      } catch (error) {
        setUser(null);
        if (!['/welcome', '/login', '/signup'].includes(pathname)) {
          router.push('/welcome');
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [pathname, router, API_URL]);

  const logout = async () => {
    await apiFetch(`${API_URL}/auth/logout`, { method: 'POST' });
    localStorage.removeItem('accessToken');
    setUser(null);
    router.push('/welcome');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">Loading Lumina...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
