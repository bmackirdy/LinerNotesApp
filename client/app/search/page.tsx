'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

interface SearchResult {
  id: string;
  title: string;
  type: 'album' | 'artist' | 'label';
  artist?: string;
  label?: string;
  year?: number;
  image?: string;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      searchDiscogs(query);
    }
  }, [query]);

  const searchDiscogs = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call your real Lambda API
      const response = await fetch(`https://rm0dtjuzqf.execute-api.us-east-1.amazonaws.com/dev/v1/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      // Transform API response to SearchResult format
      const searchResults: SearchResult[] = [];
      
      // Add albums
      if (data.albums) {
        data.albums.forEach((album: any, index: number) => {
          searchResults.push({
            id: `album-${index}`,
            title: album.title,
            type: 'album',
            artist: album.album_artists?.map((a: any) => a.artists.name).join(', ') || 'Unknown Artist',
            label: album.labels?.name || 'Unknown Label',
            year: album.release_year,
            image: album.cover_image_url || '/placeholder-album.jpg'
          });
        });
      }
      
      // Add artists
      if (data.artists) {
        data.artists.forEach((artist: any, index: number) => {
          searchResults.push({
            id: `artist-${index}`,
            title: artist.name,
            type: 'artist',
            image: '/placeholder-artist.jpg'
          });
        });
      }
      
      // Add labels
      if (data.labels) {
        data.labels.forEach((label: any, index: number) => {
          searchResults.push({
            id: `label-${index}`,
            title: label.name,
            type: 'label',
            image: '/placeholder-label.jpg'
          });
        });
      }
      
      setResults(searchResults);
    } catch (err) {
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async (item: SearchResult) => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        alert('Please sign in to add to collection');
        window.location.href = '/collection';
        return;
      }

      // Add to collection via API
      const response = await fetch('https://rm0dtjuzqf.execute-api.us-east-1.amazonaws.com/dev/collections/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: item.title,
          artist: item.artist,
          label: item.label,
          year: item.year,
          cover_image_url: item.image
        })
      });

      if (response.ok) {
        alert(`"${item.title}" added to collection!`);
      } else {
        const error = await response.json();
        alert(`Failed to add: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to add to collection. Please try again.');
    }
  };

  const handleAddToWishlist = async (item: SearchResult) => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Please sign in to add to wishlist');
        window.location.href = '/collection';
        return;
      }

      // Add to wishlist via API
      const response = await fetch('https://rm0dtjuzqf.execute-api.us-east-1.amazonaws.com/dev/wishlists/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: item.title,
          artist: item.artist,
          label: item.label,
          year: item.year,
          cover_image_url: item.image
        })
      });

      if (response.ok) {
        alert(`"${item.title}" added to wishlist!`);
      } else {
        const error = await response.json();
        alert(`Failed to add: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to add to wishlist. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Search Results</h1>
      
      {query && (
        <p className="text-gray-600 mb-6">
          Searching for "{query}" in Discogs...
        </p>
      )}

      {loading && (
        <div className="text-center py-8">
          <p>Loading search results...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="space-y-4">
          {results.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-gray-600 capitalize">{item.type}</p>
                  {item.artist && <p className="text-sm text-gray-500">Artist: {item.artist}</p>}
                  {item.label && <p className="text-sm text-gray-500">Label: {item.label}</p>}
                  {item.year && <p className="text-sm text-gray-500">Year: {item.year}</p>}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAddToCollection(item)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add to Collection
                </button>
                <button
                  onClick={() => handleAddToWishlist(item)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add to Wishlist
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && results.length === 0 && query && (
        <div className="text-center py-8">
          <p className="text-gray-600">No results found for "{query}"</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-8">
          <p className="text-gray-600">Enter a search term to find albums, artists, or labels</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Return to Home
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto"><p className="text-center py-8">Loading search...</p></div>}>
      <SearchPageContent />
    </Suspense>
  );
}