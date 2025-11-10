-- Materialize the chosen auth user into a session temp table
CREATE TEMP TABLE tmp_picked_profile ON COMMIT PRESERVE ROWS AS
WITH ctx AS (
  SELECT 'c24e7aef-2944-4104-8691-dfc5387c93d5'::uuid AS auth_id
)
SELECT p.id AS profile_id, ctx.auth_id
FROM ctx
JOIN profiles p ON p.auth_user_id = ctx.auth_id;

-- Sanity: see the picked profile
SELECT pp.profile_id, pp.auth_id
FROM tmp_picked_profile pp;

-- ========= LABELS (CRUD) =========
-- C
INSERT INTO labels (name, country, discogs_id)
VALUES ('Test Label Co', 'USA', 90001)
ON CONFLICT (name) DO NOTHING;

-- R
SELECT label_id, name, country FROM labels
ORDER BY created_at DESC LIMIT 5;

-- U
UPDATE labels SET country='United States'
WHERE name='Test Label Co'
RETURNING *;

-- D
DELETE FROM labels WHERE name='Test Label Co' RETURNING *;

-- ========= ARTISTS (CRUD) =========
-- C
INSERT INTO artists (name, country, genre, discogs_id)
VALUES ('Test Artist', 'Canada', 'Indie', 99001)
ON CONFLICT (name) DO NOTHING;

-- R
SELECT artist_id, name, genre
FROM artists WHERE name='Test Artist';

-- U
UPDATE artists SET genre='Indie Rock'
WHERE name='Test Artist' RETURNING *;

-- D
DELETE FROM artists WHERE name='Test Artist' RETURNING *;

-- ========= ALBUMS (CRUD) =========
-- Ensure a label exists
INSERT INTO labels (name, country) VALUES ('CRUD Label','UK')
ON CONFLICT (name) DO NOTHING;

-- C
INSERT INTO albums (label_id, title, release_year, discogs_id, genre)
SELECT l.label_id, 'CRUD Album', 2024, 88001, 'Indie'
FROM labels l WHERE l.name='CRUD Label'
ON CONFLICT DO NOTHING;

-- R
SELECT a.album_id, a.title, l.name AS label, a.genre
FROM albums a LEFT JOIN labels l ON l.label_id=a.label_id
WHERE a.title='CRUD Album';

-- U
UPDATE albums SET release_year=2025, genre='Alternative'
WHERE title='CRUD Album' RETURNING *;

-- D
DELETE FROM albums WHERE title='CRUD Album' RETURNING *;
DELETE FROM labels WHERE name='CRUD Label' RETURNING *;

-- ========= ALBUM_ARTISTS (M:N) =========
-- Prepare data
INSERT INTO artists (name, country, genre)
VALUES ('Link Artist','USA','Electronic')
ON CONFLICT (name) DO NOTHING;

INSERT INTO albums (label_id, title, release_year, genre)
SELECT (SELECT label_id FROM labels WHERE name='Ninja Tune'),
       'Link Album', 2011, 'Electronic'
WHERE NOT EXISTS (SELECT 1 FROM albums WHERE title='Link Album');

-- C (link)
INSERT INTO album_artists (album_id, artist_id)
SELECT a.album_id, r.artist_id
FROM albums a, artists r
WHERE a.title='Link Album' AND r.name='Link Artist'
ON CONFLICT (album_id, artist_id) DO NOTHING;

-- R
SELECT a.title, ar.name AS artist
FROM album_artists aa
JOIN albums a  ON a.album_id=aa.album_id
JOIN artists ar ON ar.artist_id=aa.artist_id
WHERE a.title='Link Album';

-- Unlink (D-like update)
DELETE FROM album_artists
WHERE album_id=(SELECT album_id FROM albums WHERE title='Link Album')
  AND artist_id=(SELECT artist_id FROM artists WHERE name='Link Artist')
RETURNING *;

-- Relink (so downstream tests still have data)
INSERT INTO album_artists (album_id, artist_id)
SELECT a.album_id, r.artist_id
FROM albums a, artists r
WHERE a.title='Link Album' AND r.name='Link Artist'
ON CONFLICT DO NOTHING;

-- ========= COLLECTIONS (CRUD) =========
-- C: two collections for picked profile
INSERT INTO collections (user_profile_id, name, description)
SELECT pp.profile_id, v.name, v.description
FROM tmp_picked_profile pp
JOIN (VALUES
  ('CRUD Favorites','My CRUD favs'),
  ('CRUD Queue','Spin later')
) AS v(name, description) ON TRUE
ON CONFLICT DO NOTHING;

-- R
SELECT c.collection_id, c.name, c.description
FROM collections c
JOIN tmp_picked_profile pp ON pp.profile_id=c.user_profile_id
ORDER BY c.created_at DESC;

-- U
UPDATE collections c
SET name='CRUD Favorites (Renamed)'
FROM tmp_picked_profile pp
WHERE c.user_profile_id=pp.profile_id AND c.name='CRUD Favorites'
RETURNING c.*;

-- D (delete the queue)
DELETE FROM collections c
USING tmp_picked_profile pp
WHERE c.user_profile_id=pp.profile_id AND c.name='CRUD Queue'
RETURNING c.*;

-- ========= COLLECTION_ALBUMS (CRUD) =========
-- Pick a target collection id
WITH my_coll AS (
  SELECT c.collection_id
  FROM collections c
  JOIN tmp_picked_profile pp ON pp.profile_id=c.user_profile_id
  ORDER BY c.created_at DESC
  LIMIT 1
)
-- C: add 2 albums alphabetically
INSERT INTO collection_albums (collection_id, album_id, condition, notes)
SELECT mc.collection_id, a.album_id, 'Excellent', 'Added via CRUD test'
FROM my_coll mc
JOIN LATERAL (
  SELECT album_id FROM albums ORDER BY title ASC LIMIT 2
) a ON TRUE
ON CONFLICT (collection_id, album_id) DO NOTHING;

-- R
WITH my_coll AS (
  SELECT c.collection_id, c.name
  FROM collections c
  JOIN tmp_picked_profile pp ON pp.profile_id=c.user_profile_id
  ORDER BY c.created_at DESC LIMIT 1
)
SELECT mc.name AS collection,
       alb.title,
       string_agg(ar.name, ', ' ORDER BY ar.name) AS artists,
       ca.condition, ca.notes
FROM my_coll mc
JOIN collection_albums ca ON ca.collection_id=mc.collection_id
JOIN albums alb           ON alb.album_id=ca.album_id
LEFT JOIN album_artists aa ON aa.album_id=alb.album_id
LEFT JOIN artists ar       ON ar.artist_id=aa.artist_id
GROUP BY mc.name, alb.title, ca.condition, ca.notes
ORDER BY alb.title;

-- U
WITH my_coll AS (
  SELECT c.collection_id
  FROM collections c
  JOIN tmp_picked_profile pp ON pp.profile_id=c.user_profile_id
  ORDER BY c.created_at DESC LIMIT 1
)
UPDATE collection_albums ca
SET condition='Good', notes='Played once'
FROM my_coll mc
WHERE ca.collection_id=mc.collection_id
RETURNING ca.*;

-- D: remove one album (alphabetically first)
WITH my_coll AS (
  SELECT c.collection_id
  FROM collections c
  JOIN tmp_picked_profile pp ON pp.profile_id=c.user_profile_id
  ORDER BY c.created_at DESC LIMIT 1
),
first_album AS (
  SELECT album_id FROM albums ORDER BY title ASC LIMIT 1
)
DELETE FROM collection_albums ca
USING my_coll mc, first_album fa
WHERE ca.collection_id=mc.collection_id AND ca.album_id=fa.album_id
RETURNING ca.*;

-- ========= WISHLISTS (CRUD) =========
-- C
INSERT INTO wishlists (user_profile_id, name, description)
SELECT pp.profile_id, 'CRUD Wantlist', 'Hunting for these'
FROM tmp_picked_profile pp
ON CONFLICT DO NOTHING;

-- R
SELECT w.wishlist_id, w.name, w.description
FROM wishlists w
JOIN tmp_picked_profile pp ON pp.profile_id=w.user_profile_id;

-- U
UPDATE wishlists w
SET description='Updated description'
FROM tmp_picked_profile pp
WHERE w.user_profile_id=pp.profile_id AND w.name='CRUD Wantlist'
RETURNING w.*;

-- ========= WISHLIST_ALBUMS (CRUD) =========
-- C: add two albums w/ priorities
INSERT INTO wishlist_albums (wishlist_id, album_id, priority)
SELECT w.wishlist_id, a.album_id, x.priority
FROM wishlists w
JOIN tmp_picked_profile pp ON pp.profile_id=w.user_profile_id
JOIN (
  SELECT (SELECT album_id FROM albums ORDER BY title ASC  LIMIT 1) AS album_id, 1 AS priority
  UNION ALL
  SELECT (SELECT album_id FROM albums ORDER BY title DESC LIMIT 1) AS album_id, 2 AS priority
) x ON TRUE
JOIN albums a ON a.album_id=x.album_id
WHERE w.name='CRUD Wantlist'
ON CONFLICT (wishlist_id, album_id) DO NOTHING;

-- R
SELECT w.name AS wishlist,
       a.title,
       string_agg(ar.name, ', ' ORDER BY ar.name) AS artists,
       wa.priority, wa.acquired
FROM wishlists w
JOIN tmp_picked_profile pp ON pp.profile_id=w.user_profile_id
JOIN wishlist_albums wa ON wa.wishlist_id=w.wishlist_id
JOIN albums a ON a.album_id=wa.album_id
LEFT JOIN album_artists aa ON aa.album_id=a.album_id
LEFT JOIN artists ar       ON ar.artist_id=aa.artist_id
WHERE w.name='CRUD Wantlist'
GROUP BY w.name, a.title, wa.priority, wa.acquired
ORDER BY wa.priority;

-- U
UPDATE wishlist_albums wa
SET acquired=true, priority=3
FROM wishlists w
JOIN tmp_picked_profile pp ON pp.profile_id=w.user_profile_id
WHERE wa.wishlist_id=w.wishlist_id
  AND w.name='CRUD Wantlist'
  AND wa.album_id=(SELECT album_id FROM albums ORDER BY title ASC LIMIT 1)
RETURNING wa.*;

-- D
DELETE FROM wishlist_albums wa
USING wishlists w
JOIN tmp_picked_profile pp ON pp.profile_id=w.user_profile_id
WHERE wa.wishlist_id=w.wishlist_id
  AND w.name='CRUD Wantlist'
  AND wa.album_id=(SELECT album_id FROM albums ORDER BY title DESC LIMIT 1)
RETURNING wa.*;

-- ========= REPORTING / VIEW CHECKS =========
SELECT a.title, a.genre, l.name AS label,
       string_agg(ar.name, ', ' ORDER BY ar.name) AS artists
FROM albums a
LEFT JOIN labels l ON l.label_id=a.label_id
LEFT JOIN album_artists aa ON aa.album_id=a.album_id
LEFT JOIN artists ar ON ar.artist_id=aa.artist_id
GROUP BY a.title, a.genre, l.name
ORDER BY a.genre, a.title;

-- View check for the chosen auth user
SELECT * FROM app_user_profiles
WHERE auth_user_id = (SELECT auth_id FROM (VALUES ('c24e7aef-2944-4104-8691-dfc5387c93d5'::uuid)) v(auth_id));