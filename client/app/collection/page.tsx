'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

// Login form component
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
      // Use real Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Store the session
      if (data.session) {
        localStorage.setItem('supabase.auth.token', data.session.access_token);
        localStorage.setItem('supabase.auth.refresh_token', data.session.refresh_token);
        window.location.href = '/collection';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Sign In to Liner Notes</h2>
      
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
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account? <a href="/signup" className="text-blue-600 hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}

interface Collection {
  collection_id: string;
  name: string;
  description: string;
  collection_albums: {
    condition: string;
    notes: string;
    albums: {
      title: string;
      release_year: number;
      genre: string;
      labels: { name: string };
      album_artists: { artists: { name: string } }[];
    };
  }[];
}

export default function CollectionPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      // Check if user is authenticated first
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        setError('Please sign in to view your collection');
        setLoading(false);
        return;
      }

      try {
        const data = await api.get('/v1/collections', true);
        setCollections(data.collections || []);
      } catch (err: any) {
        if (err.message.includes('401') || err.message.includes('authorization') || err.message.includes('token')) {
          // Clear invalid tokens and show login
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('supabase.auth.refresh_token');
          setError('Please sign in to view your collection');
        } else {
          setError('Failed to load collections');
        }
        console.error('Error fetching collections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading your collection...</p>
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

  // Flatten all albums from all collections
  const allAlbums = collections.flatMap(collection => 
    collection.collection_albums.map(ca => ({
      ...ca.albums,
      condition: ca.condition,
      notes: ca.notes,
      collectionName: collection.name
    }))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Collection</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add Album
        </button>
      </div>

      {allAlbums.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your collection is empty</p>
          <button className="text-blue-600 hover:underline">Add your first album</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allAlbums.map((album, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="bg-gray-200 h-48 rounded-md mb-4 flex items-center justify-center">
                <span className="text-gray-400">No Cover</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{album.title}</h3>
              <p className="text-gray-600 mb-1">
                {album.album_artists.map(artist => artist.artists.name).join(', ')}
              </p>
              <p className="text-gray-500 text-sm mb-1">{album.labels?.name} • {album.release_year}</p>
              <p className="text-gray-500 text-sm mb-2">{album.genre}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {album.condition}
                </span>
                <span className="text-xs text-gray-400">{album.collectionName}</span>
              </div>
              {album.notes && (
                <p className="text-gray-600 text-sm mt-2 italic">{album.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
