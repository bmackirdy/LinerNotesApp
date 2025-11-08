const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /v1/collections
 * @description List current user's collections
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: collections, error } = await req.supabase
      .from('collections')
      .select('*, collection_albums(album:albums(*))')
      .eq('user_id', req.user.sub);

    if (error) throw error;
    
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

/**
 * @route POST /v1/collections
 * @description Create a new collection
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, is_private } = req.body;
    
    const { data: collection, error } = await req.supabase
      .from('collections')
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
    
    res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

/**
 * @route GET /v1/collections/:collection_id
 * @description Get collection by ID
 * @access Private (or public if not private)
 */
router.get('/:collection_id', authenticateToken, async (req, res) => {
  try {
    const { collection_id } = req.params;
    
    const { data: collection, error } = await req.supabase
      .from('collections')
      .select('*, collection_albums(album:albums(*))')
      .eq('id', collection_id)
      .single();

    if (error) throw error;
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    
    // Check if collection is private and user is the owner
    if (collection.is_private && collection.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to view this collection' });
    }
    
    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

/**
 * @route PATCH /v1/collections/:collection_id
 * @description Update collection
 * @access Private (Owner only)
 */
router.patch('/:collection_id', authenticateToken, async (req, res) => {
  try {
    const { collection_id } = req.params;
    const { name, description, is_private } = req.body;
    
    // First verify ownership
    const { data: existingCollection, error: fetchError } = await req.supabase
      .from('collections')
      .select('user_id')
      .eq('id', collection_id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingCollection) return res.status(404).json({ error: 'Collection not found' });
    if (existingCollection.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to update this collection' });
    }
    
    const { data: collection, error } = await req.supabase
      .from('collections')
      .update({
        name,
        description,
        is_private: is_private !== undefined ? is_private : existingCollection.is_private,
        updated_at: new Date().toISOString()
      })
      .eq('id', collection_id)
      .select()
      .single();

    if (error) throw error;
    
    res.json(collection);
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

/**
 * @route DELETE /v1/collections/:collection_id
 * @description Delete collection
 * @access Private (Owner only)
 */
router.delete('/:collection_id', authenticateToken, async (req, res) => {
  try {
    const { collection_id } = req.params;
    
    // First verify ownership
    const { data: existingCollection, error: fetchError } = await req.supabase
      .from('collections')
      .select('user_id')
      .eq('id', collection_id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingCollection) return res.status(404).json({ error: 'Collection not found' });
    if (existingCollection.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to delete this collection' });
    }
    
    // Delete collection_albums first due to foreign key constraint
    const { error: deleteAlbumsError } = await req.supabase
      .from('collection_albums')
      .delete()
      .eq('collection_id', collection_id);

    if (deleteAlbumsError) throw deleteAlbumsError;
    
    // Then delete the collection
    const { error } = await req.supabase
      .from('collections')
      .delete()
      .eq('id', collection_id);

    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

/**
 * @route POST /v1/collections/:collection_id/albums
 * @description Add album to collection
 * @access Private (Owner only)
 */
router.post('/:collection_id/albums', authenticateToken, async (req, res) => {
  try {
    const { collection_id } = req.params;
    const { album_id, notes, rating, purchase_date } = req.body;
    
    // Verify collection ownership
    const { data: collection, error: collectionError } = await req.supabase
      .from('collections')
      .select('user_id')
      .eq('id', collection_id)
      .single();

    if (collectionError) throw collectionError;
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    if (collection.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to modify this collection' });
    }
    
    // Add album to collection
    const { data: collectionAlbum, error } = await req.supabase
      .from('collection_albums')
      .insert([
        { 
          collection_id,
          album_id,
          notes,
          rating,
          purchase_date: purchase_date || new Date().toISOString()
        }
      ])
      .select('*, album:albums(*)')
      .single();

    if (error) throw error;
    
    res.status(201).json(collectionAlbum);
  } catch (error) {
    console.error('Error adding album to collection:', error);
    res.status(500).json({ error: 'Failed to add album to collection' });
  }
});

/**
 * @route DELETE /v1/collections/:collection_id/albums/:album_id
 * @description Remove album from collection
 * @access Private (Owner only)
 */
router.delete('/:collection_id/albums/:album_id', authenticateToken, async (req, res) => {
  try {
    const { collection_id, album_id } = req.params;
    
    // Verify collection ownership
    const { data: collection, error: collectionError } = await req.supabase
      .from('collections')
      .select('user_id')
      .eq('id', collection_id)
      .single();

    if (collectionError) throw collectionError;
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    if (collection.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to modify this collection' });
    }
    
    // Remove album from collection
    const { error } = await req.supabase
      .from('collection_albums')
      .delete()
      .eq('collection_id', collection_id)
      .eq('album_id', album_id);

    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    console.error('Error removing album from collection:', error);
    res.status(500).json({ error: 'Failed to remove album from collection' });
  }
});

module.exports = router;
