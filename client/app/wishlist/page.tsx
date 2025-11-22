'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

// Login form component (reused from collection page)
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      if (data.session) {
        localStorage.setItem('supabase.auth.token', data.session.access_token);
        localStorage.setItem('supabase.auth.refresh_token', data.session.refresh_token);
        window.location.href = '/wishlist';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Sign In to View Your Wishlist</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

interface WishlistItem {
  wishlist_id: string;
  name: string;
  wishlist_albums: Array<{
    album: {
      title: string;
      release_year: number;
      cover_image_url: string;
      genre: string;
    };
  }>;
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const data = await api.get('/v1/wishlists', true);
        setWishlistItems(data.wishlists || []);
      } catch (err: any) {
        if (err.message.includes('401') || err.message.includes('authorization') || err.message.includes('token')) {
          setError('Please sign in to view your wishlist');
        } else {
          setError('Failed to load wishlist');
        }
        console.error('Error fetching wishlist:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading your wishlist...</p>
      </div>
    );
  }

  if (error) {
    if (error.includes('sign in')) {
      return <LoginForm />;
    }
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add to Wishlist
        </button>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your wishlist is empty</p>
          <button className="text-blue-600 hover:underline">Add your first album</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((wishlist) => (
            wishlist.wishlist_albums.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-bold">{item.album.title}</h3>
                <p className="text-gray-600">{item.album.release_year}</p>
                <p className="text-gray-600">{item.album.genre}</p>
              </div>
            ))
          ))}
        </div>
      )}
    </div>
  );
}
