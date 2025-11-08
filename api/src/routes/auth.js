const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /v1/auth/me
 * @description Get current user's profile
 * @access Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await req.supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.sub)
      .single();

    if (error) throw error;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * @route PATCH /v1/auth/me
 * @description Update current user's profile
 * @access Private
 */
router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const { username, display_name, bio, avatar_url } = req.body;
    
    const { data: profile, error } = await req.supabase
      .from('profiles')
      .update({
        username,
        display_name,
        bio,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.sub)
      .select()
      .single();

    if (error) throw error;
    
    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
