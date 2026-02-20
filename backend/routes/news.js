/**
 * News Routes - CRUD operations for news articles
 */

const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const { isAuthenticated } = require('../middleware/auth');

/**
 * GET /api/news - Get published news
 */
router.get('/', async (req, res) => {
    try {
        const { category, limit, published } = req.query;

        let sql = 'SELECT * FROM news WHERE 1=1';
        const params = [];

        if (published !== undefined) {
            sql += ' AND published = ?';
            params.push(parseInt(published));
        } else {
            sql += ' AND published = 1';
        }

        if (category && category !== 'all') {
            sql += ' AND category = ?';
            params.push(category);
        }

        sql += ' ORDER BY created_at DESC';

        if (limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const news = await db.all(sql, params);
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
        const news = await db.all('SELECT * FROM news ORDER BY created_at DESC');
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
        const news = await db.get('SELECT * FROM news WHERE id = ?', [req.params.id]);
        if (!news) {
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

        const result = await db.run(
            'INSERT INTO news (title, content, category, image_url, location, published) VALUES (?, ?, ?, ?, ?, ?)',
            [title, content, category || 'news', image_url || null, location || null, published !== undefined ? published : 1]
        );

        const newNews = await db.get('SELECT * FROM news WHERE id = ?', [result.lastInsertRowid]);
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

        const existing = await db.get('SELECT * FROM news WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }

        await db.run(
            `UPDATE news SET
                title = COALESCE(?, title),
                content = COALESCE(?, content),
                category = COALESCE(?, category),
                image_url = COALESCE(?, image_url),
                location = COALESCE(?, location),
                published = COALESCE(?, published),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [title, content, category, image_url, location, published, id]
        );

        const updated = await db.get('SELECT * FROM news WHERE id = ?', [id]);
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
        const existing = await db.get('SELECT * FROM news WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }

        await db.run('DELETE FROM news WHERE id = ?', [req.params.id]);
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
        const existing = await db.get('SELECT * FROM news WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }

        const newStatus = existing.published ? 0 : 1;
        await db.run('UPDATE news SET published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, req.params.id]);

        res.json({ success: true, message: newStatus ? 'News published' : 'News unpublished', published: newStatus });
    } catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({ success: false, message: 'Error toggling publish status' });
    }
});

module.exports = router;
