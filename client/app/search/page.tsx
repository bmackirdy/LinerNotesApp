'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SearchResult {
  id: string;
  title: string;
  type: 'album' | 'artist' | 'label';
  artist?: string;
  label?: string;
  year?: number;
  image?: string;
}

export default function SearchPage() {
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
      // Mock data for now - replace with actual Discogs API call
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Kind of Blue',
          type: 'album',
          artist: 'Miles Davis',
          label: 'Columbia',
          year: 1959,
          image: '/placeholder-album.jpg'
        },
        {
          id: '2',
          title: 'Miles Davis',
          type: 'artist',
          image: '/placeholder-artist.jpg'
        },
        {
          id: '3',
          title: 'Blue Note Records',
          type: 'label',
          image: '/placeholder-label.jpg'
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setResults(mockResults);
    } catch (err) {
      setError('Failed to search Discogs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = (item: SearchResult) => {
    // TODO: Implement add to collection logic
    alert(`Adding "${item.title}" to collection`);
  };

  const handleAddToWishlist = (item: SearchResult) => {
    // TODO: Implement add to wishlist logic
    alert(`Adding "${item.title}" to wishlist`);
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