-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-------------------------
-- Profiles (uses auth.users)
-------------------------
-- We rely on the built-in auth.users table for authentication.
-- Create a profiles table to store app-specific user data.
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- mirrors auth.users.id
  auth_user_id uuid UNIQUE NOT NULL, -- foreign key to auth.users (the Supabase Auth user id)
  display_name text,
  join_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- FK to auth.users (note: auth.users is managed by Supabase Auth; do not modify)
ALTER TABLE profiles
  ADD CONSTRAINT profiles_auth_user_fk
  FOREIGN KEY (auth_user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);

-------------------------
-- Labels
-------------------------
CREATE TABLE IF NOT EXISTS labels (
  label_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text,
  discogs_id integer,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_labels_name ON labels (name);

-------------------------
-- Artists
-------------------------
CREATE TABLE IF NOT EXISTS artists (
  artist_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discogs_id integer,
  country text,
  genre text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_artists_name ON artists (name);

-------------------------
-- Albums
-------------------------
CREATE TABLE IF NOT EXISTS albums (
  album_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id uuid,
  title text NOT NULL,
  release_year integer,
  discogs_id integer,
  cover_image_url text,
  genre text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE albums
  ADD CONSTRAINT albums_label_fk
  FOREIGN KEY (label_id)
  REFERENCES labels(label_id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_albums_label_id ON albums(label_id);
CREATE INDEX IF NOT EXISTS ux_albums_discogs_id ON albums(discogs_id);

-------------------------
-- AlbumArtist (many-to-many)
-------------------------
CREATE TABLE IF NOT EXISTS album_artists (
  album_artist_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL,
  artist_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT album_artists_album_fk FOREIGN KEY (album_id) REFERENCES albums(album_id) ON DELETE CASCADE,
  CONSTRAINT album_artists_artist_fk FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_album_artists_album_id ON album_artists(album_id);
CREATE INDEX IF NOT EXISTS idx_album_artists_artist_id ON album_artists(artist_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_album_artists_album_artist ON album_artists(album_id, artist_id);

-------------------------
-- Collections
-------------------------
CREATE TABLE IF NOT EXISTS collections (
  collection_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL, -- references profiles.id (app profile)
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT collections_profile_fk FOREIGN KEY (user_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_collections_user_profile_id ON collections(user_profile_id);

-------------------------
-- CollectionAlbum (join table)
-------------------------
-- Enum for condition
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collection_condition') THEN
    CREATE TYPE collection_condition AS ENUM ('New', 'Excellent', 'Good', 'Fair', 'Poor');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS collection_albums (
  collection_album_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL,
  album_id uuid NOT NULL,
  condition collection_condition NOT NULL DEFAULT 'Good',
  notes text,
  date_added timestamptz DEFAULT now(),
  CONSTRAINT collection_albums_collection_fk FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE CASCADE,
  CONSTRAINT collection_albums_album_fk FOREIGN KEY (album_id) REFERENCES albums(album_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collection_albums_collection_id ON collection_albums(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_albums_album_id ON collection_albums(album_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_collection_album_unique ON collection_albums(collection_id, album_id);

-------------------------
-- WishLists
-------------------------
CREATE TABLE IF NOT EXISTS wishlists (
  wishlist_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT wishlists_profile_fk FOREIGN KEY (user_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_profile_id ON wishlists(user_profile_id);

-------------------------
-- WishListAlbum (join table)
-------------------------
CREATE TABLE IF NOT EXISTS wishlist_albums (
  wishlist_album_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id uuid NOT NULL,
  album_id uuid NOT NULL,
  priority integer,
  acquired boolean DEFAULT false,
  date_added timestamptz DEFAULT now(),
  CONSTRAINT wishlist_albums_wishlist_fk FOREIGN KEY (wishlist_id) REFERENCES wishlists(wishlist_id) ON DELETE CASCADE,
  CONSTRAINT wishlist_albums_album_fk FOREIGN KEY (album_id) REFERENCES albums(album_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wishlist_albums_wishlist_id ON wishlist_albums(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_albums_album_id ON wishlist_albums(album_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_wishlist_album_unique ON wishlist_albums(wishlist_id, album_id);

-------------------------
-- Helpful indexes
-------------------------
CREATE INDEX IF NOT EXISTS idx_albums_genre ON albums(genre);
CREATE INDEX IF NOT EXISTS idx_artists_genre ON artists(genre);

-------------------------
-- Optional: helper view to join auth.users and profiles
-------------------------
CREATE OR REPLACE VIEW app_user_profiles AS
SELECT
  u.id AS auth_user_id,
  p.id AS profile_id,
  coalesce(p.display_name, u.email) AS display_name,
  u.email,
  p.join_date,
  p.created_at AS profile_created_at
FROM auth.users u
LEFT JOIN profiles p ON p.auth_user_id = u.id;
