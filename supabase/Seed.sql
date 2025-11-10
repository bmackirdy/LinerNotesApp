BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

----------------------------------------------------------------
-- 0) Your existing auth.users UUIDs
----------------------------------------------------------------
WITH seed_users(id) AS (
  VALUES
    ('c24e7aef-2944-4104-8691-dfc5387c93d5'::uuid),
    ('d73204c6-6683-4f8d-a1bc-d1395dc6bf16'::uuid),
    ('36521fdc-41b2-4e90-9326-35d15f5d0028'::uuid)
)
-- 1) Profiles (idempotent)
, upsert_profiles AS (
  INSERT INTO profiles (auth_user_id, display_name)
  SELECT id, 'User ' || left(id::text, 8)
  FROM seed_users
  ON CONFLICT (auth_user_id)
  DO UPDATE SET display_name = EXCLUDED.display_name
  RETURNING id, auth_user_id, display_name
)
SELECT 1;

----------------------------------------------------------------
-- 2) Labels
----------------------------------------------------------------
INSERT INTO labels (name, country, discogs_id)
VALUES
  ('Blue Note Records', 'USA', 12345),
  ('Atlantic Records',  'USA', 23456),
  ('Ninja Tune',        'UK',  34567)
ON CONFLICT (name) DO NOTHING;

----------------------------------------------------------------
-- 3) Artists
----------------------------------------------------------------
INSERT INTO artists (name, country, genre, discogs_id)
VALUES
  ('John Coltrane',  'USA', 'Jazz',       1111),
  ('Aretha Franklin','USA', 'Soul',       2222),
  ('Bonobo',         'UK',  'Electronic', 3333),
  ('Aphex Twin',     'UK',  'Electronic', 4444)
ON CONFLICT (name) DO NOTHING;

----------------------------------------------------------------
-- 4) Albums
----------------------------------------------------------------
INSERT INTO albums (label_id, title, release_year, discogs_id, cover_image_url, genre)
VALUES
  ((SELECT label_id FROM labels WHERE name='Blue Note Records'),
    'Blue Train', 1957, 5001, NULL, 'Jazz'),
  ((SELECT label_id FROM labels WHERE name='Atlantic Records'),
    'I Never Loved a Man the Way I Love You', 1967, 5002, NULL, 'Soul'),
  ((SELECT label_id FROM labels WHERE name='Ninja Tune'),
    'Dial ''M'' for Monkey', 2003, 5003, NULL, 'Electronic'),
  ((SELECT label_id FROM labels WHERE name='Ninja Tune'),
    'Black Sands', 2010, 5004, NULL, 'Electronic'),
  ((SELECT label_id FROM labels WHERE name='Warp Records'),
    'Selected Ambient Works 85–92', 1992, 5005, NULL, 'Electronic')
ON CONFLICT DO NOTHING;

-- Ensure Warp Records exists and backfill if needed
INSERT INTO labels (name, country, discogs_id)
SELECT 'Warp Records','UK',45678
WHERE NOT EXISTS (SELECT 1 FROM labels WHERE name='Warp Records');

UPDATE albums a
SET label_id = (SELECT label_id FROM labels WHERE name='Warp Records')
WHERE a.title = 'Selected Ambient Works 85–92'
  AND a.label_id IS NULL;

----------------------------------------------------------------
-- 5) Album ↔ Artist
----------------------------------------------------------------
INSERT INTO album_artists (album_id, artist_id)
SELECT
  (SELECT album_id FROM albums  WHERE title='Blue Train'),
  (SELECT artist_id FROM artists WHERE name='John Coltrane')
ON CONFLICT (album_id, artist_id) DO NOTHING;

INSERT INTO album_artists (album_id, artist_id)
SELECT
  (SELECT album_id FROM albums  WHERE title='I Never Loved a Man the Way I Love You'),
  (SELECT artist_id FROM artists WHERE name='Aretha Franklin')
ON CONFLICT (album_id, artist_id) DO NOTHING;

INSERT INTO album_artists (album_id, artist_id)
SELECT a.album_id, (SELECT artist_id FROM artists WHERE name='Bonobo')
FROM albums a
WHERE a.title IN ('Dial ''M'' for Monkey','Black Sands')
ON CONFLICT (album_id, artist_id) DO NOTHING;

INSERT INTO album_artists (album_id, artist_id)
SELECT
  (SELECT album_id FROM albums  WHERE title='Selected Ambient Works 85–92'),
  (SELECT artist_id FROM artists WHERE name='Aphex Twin')
ON CONFLICT (album_id, artist_id) DO NOTHING;

----------------------------------------------------------------
-- 6) Collections (two per profile)
----------------------------------------------------------------
INSERT INTO collections (user_profile_id, name, description)
SELECT p.id, 'Favorites', 'Auto-seeded favorites'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM collections c
  WHERE c.user_profile_id = p.id AND c.name = 'Favorites'
);

INSERT INTO collections (user_profile_id, name, description)
SELECT p.id, 'To Spin', 'Queue'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM collections c
  WHERE c.user_profile_id = p.id AND c.name = 'To Spin'
);

----------------------------------------------------------------
-- 7) Collection Albums
----------------------------------------------------------------
INSERT INTO collection_albums (collection_id, album_id, condition, notes)
SELECT c.collection_id, a.album_id, 'Excellent', 'Seeded'
FROM collections c
JOIN LATERAL (
  SELECT album_id FROM albums ORDER BY title ASC LIMIT 3
) a ON TRUE
WHERE c.name = 'Favorites'
  AND NOT EXISTS (
    SELECT 1 FROM collection_albums ca
    WHERE ca.collection_id = c.collection_id AND ca.album_id = a.album_id
  );

INSERT INTO collection_albums (collection_id, album_id, condition, notes)
SELECT c.collection_id, a.album_id, 'Good', 'Seeded'
FROM collections c
JOIN LATERAL (
  SELECT album_id FROM albums ORDER BY title ASC OFFSET 3 LIMIT 2
) a ON TRUE
WHERE c.name = 'To Spin'
  AND NOT EXISTS (
    SELECT 1 FROM collection_albums ca
    WHERE ca.collection_id = c.collection_id AND ca.album_id = a.album_id
  );

----------------------------------------------------------------
-- 8) Wishlists
----------------------------------------------------------------
INSERT INTO wishlists (user_profile_id, name, description)
SELECT p.id, 'Wantlist', 'Things I''m hunting for'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM wishlists w
  WHERE w.user_profile_id = p.id AND w.name = 'Wantlist'
);

----------------------------------------------------------------
-- 9) Wishlist Albums
----------------------------------------------------------------
INSERT INTO wishlist_albums (wishlist_id, album_id, priority, acquired)
SELECT w.wishlist_id, a.album_id, x.priority, false
FROM wishlists w
JOIN LATERAL (
  VALUES ( (SELECT album_id FROM albums WHERE title='Black Sands'), 1 ),
         ( (SELECT album_id FROM albums WHERE title='Selected Ambient Works 85–92'), 2 )
) AS x(album_id, priority) ON TRUE
JOIN albums a ON a.album_id = x.album_id
WHERE w.name = 'Wantlist'
  AND NOT EXISTS (
    SELECT 1 FROM wishlist_albums wa
    WHERE wa.wishlist_id = w.wishlist_id AND wa.album_id = a.album_id
  );

COMMIT;
