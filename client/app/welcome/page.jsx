"use client";

import React from 'react';
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to Lumina</h1>
      <p className="text-xl mb-8">Your friendly AI companion.</p>
      
      <div className="space-y-4 flex flex-col w-full max-w-xs">
        <Link href="/login" className="bg-blue-600 text-white text-center py-3 rounded-xl shadow hover:bg-blue-700 transition">
          Log in
        </Link>
        <Link href="/signup" className="bg-white border border-gray-300 text-gray-700 text-center py-3 rounded-xl shadow hover:bg-gray-50 transition">
          Create an account
        </Link>
      </div>
    </div>
  );
}
