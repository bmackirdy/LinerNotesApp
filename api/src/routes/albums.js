const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /v1/albums
 * @description List all albums with optional filtering
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { artist_id, genre, year } = req.query;
    let query = req.supabase
      .from('albums')
      .select('*, artist:artists(*)')
      .order('release_date', { ascending: false });

    if (artist_id) {
      query = query.eq('artist_id', artist_id);
    }
    if (genre) {
      query = query.contains('genres', [genre]);
    }
    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('release_date', startDate).lte('release_date', endDate);
    }

    const { data: albums, error } = await query;
    if (error) throw error;
    
    res.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

/**
 * @route POST /v1/albums
 * @description Create a new album
 * @access Private (Admin only in future)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      title, 
      artist_id, 
      release_date, 
      cover_image_url, 
      genres, 
      label, 
      tracklist,
      spotify_id,
      apple_music_id
    } = req.body;
    
    const { data: album, error } = await req.supabase
      .from('albums')
      .insert([
        { 
          title, 
          artist_id, 
          release_date, 
          cover_image_url, 
          genres: genres || [], 
          label,
          tracklist: tracklist || [],
          spotify_id,
          apple_music_id,
          created_by: req.user.sub
        }
      ])
      .select('*, artist:artists(*)')
      .single();

    if (error) throw error;
    
    res.status(201).json(album);
  } catch (error) {
    console.error('Error creating album:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
});

/**
 * @route GET /v1/albums/:album_id
 * @description Get album by ID
 * @access Public
 */
router.get('/:album_id', async (req, res) => {
  try {
    const { album_id } = req.params;
    
    const { data: album, error } = await req.supabase
      .from('albums')
      .select('*, artist:artists(*)')
      .eq('id', album_id)
      .single();

    if (error) throw error;
    if (!album) return res.status(404).json({ error: 'Album not found' });
    
    res.json(album);
  } catch (error) {
    console.error('Error fetching album:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

/**
 * @route PATCH /v1/albums/:album_id
 * @description Update album
 * @access Private (Admin only in future)
 */
router.patch('/:album_id', authenticateToken, async (req, res) => {
  try {
    const { album_id } = req.params;
    const { 
      title, 
      artist_id, 
      release_date, 
      cover_image_url, 
      genres, 
      label, 
      tracklist,
      spotify_id,
      apple_music_id
    } = req.body;
    
    const { data: album, error } = await req.supabase
      .from('albums')
      .update({
        title, 
        artist_id, 
        release_date, 
        cover_image_url, 
        genres: genres || [], 
        label,
        tracklist: tracklist || [],
        spotify_id,
        apple_music_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', album_id)
      .select('*, artist:artists(*)')
      .single();

    if (error) throw error;
    if (!album) return res.status(404).json({ error: 'Album not found' });
    
    res.json(album);
  } catch (error) {
    console.error('Error updating album:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

/**
 * @route DELETE /v1/albums/:album_id
 * @description Delete album
 * @access Private (Admin only in future)
 */
router.delete('/:album_id', authenticateToken, async (req, res) => {
  try {
    const { album_id } = req.params;
    
    const { error } = await req.supabase
      .from('albums')
      .delete()
      .eq('id', album_id);

    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

module.exports = router;
