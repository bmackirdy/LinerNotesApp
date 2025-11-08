const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /v1/artists
 * @description List all artists
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { data: artists, error } = await req.supabase
      .from('artists')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(artists);
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});

/**
 * @route POST /v1/artists
 * @description Create a new artist
 * @access Private (Admin only in future)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, bio, image_url, genres } = req.body;
    
    const { data: artist, error } = await req.supabase
      .from('artists')
      .insert([
        { 
          name, 
          bio, 
          image_url, 
          genres: genres || [],
          created_by: req.user.sub
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json(artist);
  } catch (error) {
    console.error('Error creating artist:', error);
    res.status(500).json({ error: 'Failed to create artist' });
  }
});

/**
 * @route GET /v1/artists/:artist_id
 * @description Get artist by ID
 * @access Public
 */
router.get('/:artist_id', async (req, res) => {
  try {
    const { artist_id } = req.params;
    
    const { data: artist, error } = await req.supabase
      .from('artists')
      .select('*')
      .eq('id', artist_id)
      .single();

    if (error) throw error;
    if (!artist) return res.status(404).json({ error: 'Artist not found' });
    
    res.json(artist);
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({ error: 'Failed to fetch artist' });
  }
});

/**
 * @route PATCH /v1/artists/:artist_id
 * @description Update artist
 * @access Private (Admin only in future)
 */
router.patch('/:artist_id', authenticateToken, async (req, res) => {
  try {
    const { artist_id } = req.params;
    const { name, bio, image_url, genres } = req.body;
    
    const { data: artist, error } = await req.supabase
      .from('artists')
      .update({
        name,
        bio,
        image_url,
        genres: genres || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', artist_id)
      .select()
      .single();

    if (error) throw error;
    if (!artist) return res.status(404).json({ error: 'Artist not found' });
    
    res.json(artist);
  } catch (error) {
    console.error('Error updating artist:', error);
    res.status(500).json({ error: 'Failed to update artist' });
  }
});

/**
 * @route DELETE /v1/artists/:artist_id
 * @description Delete artist
 * @access Private (Admin only in future)
 */
router.delete('/:artist_id', authenticateToken, async (req, res) => {
  try {
    const { artist_id } = req.params;
    
    const { error } = await req.supabase
      .from('artists')
      .delete()
      .eq('id', artist_id);

    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting artist:', error);
    res.status(500).json({ error: 'Failed to delete artist' });
  }
});

module.exports = router;
