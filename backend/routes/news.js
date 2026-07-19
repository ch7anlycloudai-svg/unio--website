/**
 * News Routes - CRUD operations for news articles
 */

const express = require('express');
const router = express.Router();
const { getClient } = require('../models/database');
const { isAuthenticated } = require('../middleware/auth');

/**
 * GET /api/news - Get published news
 */
router.get('/', async (req, res) => {
    try {
        const { category, limit, published } = req.query;
        const supabase = getClient();

        let query = supabase.from('news').select('*');

        if (published !== undefined) {
            query = query.eq('published', parseInt(published) === 1);
        } else {
            query = query.eq('published', true);
        }

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        query = query.order('created_at', { ascending: false });

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const { data: news, error } = await query;
        if (error) throw error;

        res.json({ success: true, data: news });
    } catch (error) {
        console.error('Get news error:', error);
        res.status(500).json({ success: false, message: 'Error fetching news' });
    }
});

/**
 * GET /api/news/all - Get all news (admin)
 */
router.get('/all', isAuthenticated, async (req, res) => {
    try {
        const supabase = getClient();
        const { data: news, error } = await supabase
            .from('news')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: news });
    } catch (error) {
        console.error('Get all news error:', error);
        res.status(500).json({ success: false, message: 'Error fetching news' });
    }
});

/**
 * GET /api/news/:id - Get single news
 */
router.get('/:id', async (req, res) => {
    try {
        const supabase = getClient();
        const { data: news, error } = await supabase
            .from('news')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !news) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }
        res.json({ success: true, data: news });
    } catch (error) {
        console.error('Get news by id error:', error);
        res.status(500).json({ success: false, message: 'Error fetching news' });
    }
});

/**
 * POST /api/news - Create news (admin)
 */
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { title, content, category, image_url, location, published } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and content are required' });
        }

        const supabase = getClient();
        const { data: newNews, error } = await supabase
            .from('news')
            .insert({
                title,
                content,
                category: category || 'news',
                image_url: image_url || null,
                location: location || null,
                published: published !== undefined ? (published ? true : false) : true
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, message: 'News created successfully', data: newNews });
    } catch (error) {
        console.error('Create news error:', error);
        res.status(500).json({ success: false, message: 'Error creating news' });
    }
});

/**
 * PUT /api/news/:id - Update news (admin)
 */
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, image_url, location, published } = req.body;

        const supabase = getClient();

        // Check if exists
        const { data: existing, error: findErr } = await supabase
            .from('news')
            .select('*')
            .eq('id', id)
            .single();

        if (findErr || !existing) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }

        // Build update object with only provided fields (COALESCE equivalent)
        const updates = { updated_at: new Date().toISOString() };
        if (title !== undefined && title !== null) updates.title = title;
        if (content !== undefined && content !== null) updates.content = content;
        if (category !== undefined && category !== null) updates.category = category;
        if (image_url !== undefined && image_url !== null) updates.image_url = image_url;
        if (location !== undefined && location !== null) updates.location = location;
        if (published !== undefined && published !== null) updates.published = published ? true : false;

        const { data: updated, error } = await supabase
            .from('news')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: 'News updated successfully', data: updated });
    } catch (error) {
        console.error('Update news error:', error);
        res.status(500).json({ success: false, message: 'Error updating news' });
    }
});

/**
 * DELETE /api/news/:id - Delete news (admin)
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const supabase = getClient();

        const { data: existing, error: findErr } = await supabase
            .from('news')
            .select('id')
            .eq('id', req.params.id)
            .single();

        if (findErr || !existing) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }

        const { error } = await supabase.from('news').delete().eq('id', req.params.id);
        if (error) throw error;

        res.json({ success: true, message: 'News deleted successfully' });
    } catch (error) {
        console.error('Delete news error:', error);
        res.status(500).json({ success: false, message: 'Error deleting news' });
    }
});

/**
 * PATCH /api/news/:id/toggle-publish - Toggle publish status (admin)
 */
router.patch('/:id/toggle-publish', isAuthenticated, async (req, res) => {
    try {
        const supabase = getClient();

        const { data: existing, error: findErr } = await supabase
            .from('news')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (findErr || !existing) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }

        const newStatus = !existing.published;
        const { error } = await supabase
            .from('news')
            .update({ published: newStatus, updated_at: new Date().toISOString() })
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ success: true, message: newStatus ? 'News published' : 'News unpublished', published: newStatus ? 1 : 0 });
    } catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({ success: false, message: 'Error toggling publish status' });
    }
});

module.exports = router;
