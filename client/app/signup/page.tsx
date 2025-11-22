'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/collection`
        }
      });
      
      if (error) {
        alert(error.message);
      } else if (data.user && !data.session) {
        // User created but email confirmation required
        alert('Account created! You can now sign in.');
        // Auto-login by trying to sign in
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (!loginError) {
          window.location.href = '/collection';
        }
      } else if (data.session) {
        // Immediate signup (no confirmation needed)
        alert('Account created successfully!');
        window.location.href = '/collection';
      }
    } catch (err) {
      alert('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Sign Up</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          className="w-full px-3 py-2 border rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        
        <input
          type="password"
          required
          className="w-full px-3 py-2 border rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-md"
        >
          {loading ? 'Creating...' : 'Sign Up'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <Link href="/collection" className="text-blue-600">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}