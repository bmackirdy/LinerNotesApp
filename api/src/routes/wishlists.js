const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /v1/wishlists
 * @description List current user's wishlists
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: wishlists, error } = await req.supabase
      .from('wishlists')
      .select('*, wishlist_albums(album:albums(*))')
      .eq('user_id', req.user.sub);

    if (error) throw error;
    
    res.json(wishlists);
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    res.status(500).json({ error: 'Failed to fetch wishlists' });
  }
});

/**
 * @route POST /v1/wishlists
 * @description Create a new wishlist
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, is_private } = req.body;
    
    const { data: wishlist, error } = await req.supabase
      .from('wishlists')
      .insert([
        { 
          name, 
          description, 
          is_private: is_private || false,
          user_id: req.user.sub
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json(wishlist);
  } catch (error) {
    console.error('Error creating wishlist:', error);
    res.status(500).json({ error: 'Failed to create wishlist' });
  }
});

/**
 * @route GET /v1/wishlists/:wishlist_id
 * @description Get wishlist by ID
 * @access Private (or public if not private)
 */
router.get('/:wishlist_id', authenticateToken, async (req, res) => {
  try {
    const { wishlist_id } = req.params;
    
    const { data: wishlist, error } = await req.supabase
      .from('wishlists')
      .select('*, wishlist_albums(album:albums(*))')
      .eq('id', wishlist_id)
      .single();

    if (error) throw error;
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });
    
    // Check if wishlist is private and user is the owner
    if (wishlist.is_private && wishlist.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to view this wishlist' });
    }
    
    res.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

/**
 * @route PATCH /v1/wishlists/:wishlist_id
 * @description Update wishlist
 * @access Private (Owner only)
 */
router.patch('/:wishlist_id', authenticateToken, async (req, res) => {
  try {
    const { wishlist_id } = req.params;
    const { name, description, is_private } = req.body;
    
    // First verify ownership
    const { data: existingWishlist, error: fetchError } = await req.supabase
      .from('wishlists')
      .select('user_id')
      .eq('id', wishlist_id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingWishlist) return res.status(404).json({ error: 'Wishlist not found' });
    if (existingWishlist.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to update this wishlist' });
    }
    
    const { data: wishlist, error } = await req.supabase
      .from('wishlists')
      .update({
        name,
        description,
        is_private: is_private !== undefined ? is_private : existingWishlist.is_private,
        updated_at: new Date().toISOString()
      })
      .eq('id', wishlist_id)
      .select()
      .single();

    if (error) throw error;
    
    res.json(wishlist);
  } catch (error) {
    console.error('Error updating wishlist:', error);
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

/**
 * @route DELETE /v1/wishlists/:wishlist_id
 * @description Delete wishlist
 * @access Private (Owner only)
 */
router.delete('/:wishlist_id', authenticateToken, async (req, res) => {
  try {
    const { wishlist_id } = req.params;
    
    // First verify ownership
    const { data: existingWishlist, error: fetchError } = await req.supabase
      .from('wishlists')
      .select('user_id')
      .eq('id', wishlist_id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingWishlist) return res.status(404).json({ error: 'Wishlist not found' });
    if (existingWishlist.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to delete this wishlist' });
    }
    
    // Delete wishlist_albums first due to foreign key constraint
    const { error: deleteAlbumsError } = await req.supabase
      .from('wishlist_albums')
      .delete()
      .eq('wishlist_id', wishlist_id);

    if (deleteAlbumsError) throw deleteAlbumsError;
    
    // Then delete the wishlist
    const { error } = await req.supabase
      .from('wishlists')
      .delete()
      .eq('id', wishlist_id);

    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting wishlist:', error);
    res.status(500).json({ error: 'Failed to delete wishlist' });
  }
});

/**
 * @route POST /v1/wishlists/:wishlist_id/albums
 * @description Add album to wishlist
 * @access Private (Owner only)
 */
router.post('/:wishlist_id/albums', authenticateToken, async (req, res) => {
  try {
    const { wishlist_id } = req.params;
    const { album_id, notes, priority } = req.body;
    
    // Verify wishlist ownership
    const { data: wishlist, error: wishlistError } = await req.supabase
      .from('wishlists')
      .select('user_id')
      .eq('id', wishlist_id)
      .single();

    if (wishlistError) throw wishlistError;
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });
    if (wishlist.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to modify this wishlist' });
    }
    
    // Add album to wishlist
    const { data: wishlistAlbum, error } = await req.supabase
      .from('wishlist_albums')
      .insert([
        { 
          wishlist_id,
          album_id,
          notes,
          priority: priority || 'medium',
          added_at: new Date().toISOString()
        }
      ])
      .select('*, album:albums(*)')
      .single();

    if (error) throw error;
    
    res.status(201).json(wishlistAlbum);
  } catch (error) {
    console.error('Error adding album to wishlist:', error);
    res.status(500).json({ error: 'Failed to add album to wishlist' });
  }
});

/**
 * @route DELETE /v1/wishlists/:wishlist_id/albums/:album_id
 * @description Remove album from wishlist
 * @access Private (Owner only)
 */
router.delete('/:wishlist_id/albums/:album_id', authenticateToken, async (req, res) => {
  try {
    const { wishlist_id, album_id } = req.params;
    
    // Verify wishlist ownership
    const { data: wishlist, error: wishlistError } = await req.supabase
      .from('wishlists')
      .select('user_id')
      .eq('id', wishlist_id)
      .single();

    if (wishlistError) throw wishlistError;
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });
    if (wishlist.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to modify this wishlist' });
    }
    
    // Remove album from wishlist
    const { error } = await req.supabase
      .from('wishlist_albums')
      .delete()
      .eq('wishlist_id', wishlist_id)
      .eq('album_id', album_id);

    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    console.error('Error removing album from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove album from wishlist' });
  }
});

module.exports = router;
