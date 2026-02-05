/**
 * Pages Routes - Manage page content
 */

const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const { isAuthenticated } = require('../middleware/auth');

/**
 * GET /api/pages - Get all pages with content
 */
router.get('/', (req, res) => {
    try {
        const content = db.all('SELECT * FROM page_content ORDER BY page_name, display_order');

        const pages = {};
        content.forEach(item => {
            if (!pages[item.page_name]) {
                pages[item.page_name] = [];
            }
            pages[item.page_name].push(item);
        });

        res.json({ success: true, data: pages });
    } catch (error) {
        console.error('Get pages error:', error);
        res.status(500).json({ success: false, message: 'Error fetching pages' });
    }
});

/**
 * GET /api/pages/:pageName - Get content for a page
 */
router.get('/:pageName', (req, res) => {
    try {
        const content = db.all(
            'SELECT * FROM page_content WHERE page_name = ? ORDER BY display_order',
            [req.params.pageName]
        );

        const contentObject = {};
        content.forEach(item => {
            contentObject[item.section_id] = {
                id: item.id,
                title: item.section_title,
                content: item.content,
                type: item.content_type
            };
        });

        res.json({ success: true, page: req.params.pageName, data: contentObject });
    } catch (error) {
        console.error('Get page content error:', error);
        res.status(500).json({ success: false, message: 'Error fetching page content' });
    }
});

/**
 * PUT /api/pages/:pageName/bulk - Bulk update (admin)
 * NOTE: This route must come BEFORE /:pageName/:sectionId to match correctly
 */
router.put('/:pageName/bulk', isAuthenticated, (req, res) => {
    try {
        const { pageName } = req.params;
        const { sections } = req.body;

        if (!sections || !Array.isArray(sections)) {
            return res.status(400).json({ success: false, message: 'sections array is required' });
        }

        for (const section of sections) {
            // Only update section_title if provided
            if (section.section_title !== undefined) {
                db.run(
                    `UPDATE page_content SET
                        content = ?,
                        section_title = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE page_name = ? AND section_id = ?`,
                    [section.content, section.section_title, pageName, section.section_id]
                );
            } else {
                db.run(
                    `UPDATE page_content SET
                        content = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE page_name = ? AND section_id = ?`,
                    [section.content, pageName, section.section_id]
                );
            }
        }

        res.json({ success: true, message: `Updated ${sections.length} sections successfully` });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({ success: false, message: 'Error updating sections' });
    }
});

/**
 * GET /api/pages/:pageName/:sectionId - Get specific section
 */
router.get('/:pageName/:sectionId', (req, res) => {
    try {
        const content = db.get(
            'SELECT * FROM page_content WHERE page_name = ? AND section_id = ?',
            [req.params.pageName, req.params.sectionId]
        );

        if (!content) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        res.json({ success: true, data: content });
    } catch (error) {
        console.error('Get section error:', error);
        res.status(500).json({ success: false, message: 'Error fetching section' });
    }
});

/**
 * PUT /api/pages/:pageName/:sectionId - Update section (admin)
 */
router.put('/:pageName/:sectionId', isAuthenticated, (req, res) => {
    try {
        const { pageName, sectionId } = req.params;
        const { section_title, content, content_type } = req.body;

        const existing = db.get(
            'SELECT * FROM page_content WHERE page_name = ? AND section_id = ?',
            [pageName, sectionId]
        );

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        db.run(
            `UPDATE page_content SET
                section_title = COALESCE(?, section_title),
                content = COALESCE(?, content),
                content_type = COALESCE(?, content_type),
                updated_at = CURRENT_TIMESTAMP
            WHERE page_name = ? AND section_id = ?`,
            [section_title, content, content_type, pageName, sectionId]
        );

        const updated = db.get(
            'SELECT * FROM page_content WHERE page_name = ? AND section_id = ?',
            [pageName, sectionId]
        );

        res.json({ success: true, message: 'Section updated successfully', data: updated });
    } catch (error) {
        console.error('Update section error:', error);
        res.status(500).json({ success: false, message: 'Error updating section' });
    }
});

/**
 * POST /api/pages/:pageName - Add new section (admin)
 */
router.post('/:pageName', isAuthenticated, (req, res) => {
    try {
        const { pageName } = req.params;
        const { section_id, section_title, content, content_type, display_order } = req.body;

        if (!section_id || !content) {
            return res.status(400).json({ success: false, message: 'section_id and content are required' });
        }

        const existing = db.get(
            'SELECT * FROM page_content WHERE page_name = ? AND section_id = ?',
            [pageName, section_id]
        );

        if (existing) {
            return res.status(400).json({ success: false, message: 'Section already exists' });
        }

        let order = display_order;
        if (!order) {
            const maxOrder = db.get(
                'SELECT MAX(display_order) as max_order FROM page_content WHERE page_name = ?',
                [pageName]
            );
            order = (maxOrder?.max_order || 0) + 1;
        }

        db.run(
            'INSERT INTO page_content (page_name, section_id, section_title, content, content_type, display_order) VALUES (?, ?, ?, ?, ?, ?)',
            [pageName, section_id, section_title || '', content, content_type || 'text', order]
        );

        const newSection = db.get(
            'SELECT * FROM page_content WHERE page_name = ? AND section_id = ?',
            [pageName, section_id]
        );

        res.status(201).json({ success: true, message: 'Section created successfully', data: newSection });
    } catch (error) {
        console.error('Create section error:', error);
        res.status(500).json({ success: false, message: 'Error creating section' });
    }
});

/**
 * DELETE /api/pages/:pageName/:sectionId - Delete section (admin)
 */
router.delete('/:pageName/:sectionId', isAuthenticated, (req, res) => {
    try {
        const { pageName, sectionId } = req.params;

        const existing = db.get(
            'SELECT * FROM page_content WHERE page_name = ? AND section_id = ?',
            [pageName, sectionId]
        );

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        db.run('DELETE FROM page_content WHERE page_name = ? AND section_id = ?', [pageName, sectionId]);
        res.json({ success: true, message: 'Section deleted successfully' });
    } catch (error) {
        console.error('Delete section error:', error);
        res.status(500).json({ success: false, message: 'Error deleting section' });
    }
});

module.exports = router;
