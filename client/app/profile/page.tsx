'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collectionCount, setCollectionCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          // Redirect to login if not authenticated
          window.location.href = '/collection';
          return;
        }

        setUser(authUser);

        // Get user profile from database
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .single();

        setProfile(profileData);

        // Get collection and wishlist counts
        try {
          const collectionsData = await api.get('/v1/collections', true);
          const wishlistData = await api.get('/v1/wishlists', true);
          
          const totalAlbums = collectionsData.collections?.reduce((total: number, collection: any) => 
            total + (collection.collection_albums?.length || 0), 0) || 0;
          const totalWishlist = wishlistData.wishlists?.reduce((total: number, wishlist: any) => 
            total + (wishlist.wishlist_albums?.length || 0), 0) || 0;
          
          setCollectionCount(totalAlbums);
          setWishlistCount(totalWishlist);
        } catch (err) {
          console.error('Failed to fetch counts:', err);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Please sign in to view your profile</p>
          <Link href="/collection" className="text-blue-600 hover:underline">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-4xl text-gray-500 mb-4 md:mb-0 md:mr-8">
            {(profile?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{profile?.display_name || 'Vinyl Enthusiast'}</h1>
            <p className="text-gray-600 mb-2">{user?.email || 'No email'}</p>
            <p className="text-sm text-gray-500">Member since {new Date(user?.created_at).getFullYear() || '2024'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Collection Stats</h2>
          <p className="text-3xl font-bold">{user.collectionCount}</p>
          <p className="text-gray-600">Albums in collection</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Wishlist</h2>
          <p className="text-3xl font-bold">{user.wishlistCount}</p>
          <p className="text-gray-600">Albums in wishlist</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Edit Profile
        </button>
      </div>
    </div>
  );
}
