/**
 * Messages Routes - Handle contact form messages
 */

const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const { isAuthenticated } = require('../middleware/auth');

/**
 * POST /api/messages - Submit contact form (public)
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'Name, email, subject, and message are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        await db.run(
            'INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone || null, subject, message]
        );

        res.status(201).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Create message error:', error);
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
});

/**
 * GET /api/messages - Get all messages (admin)
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const messages = await db.all('SELECT * FROM messages ORDER BY created_at DESC');
        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
});

/**
 * GET /api/messages/unread-count - Get unread count (admin)
 */
router.get('/unread-count', isAuthenticated, async (req, res) => {
    try {
        const result = await db.get('SELECT COUNT(*) as count FROM messages WHERE is_read = 0');
        res.json({ success: true, count: result ? result.count : 0 });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ success: false, message: 'Error fetching unread count' });
    }
});

/**
 * GET /api/messages/:id - Get single message (admin)
 */
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const message = await db.get('SELECT * FROM messages WHERE id = ?', [req.params.id]);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        res.json({ success: true, data: message });
    } catch (error) {
        console.error('Get message error:', error);
        res.status(500).json({ success: false, message: 'Error fetching message' });
    }
});

/**
 * PATCH /api/messages/:id/read - Mark as read (admin)
 */
router.patch('/:id/read', isAuthenticated, async (req, res) => {
    try {
        const existing = await db.get('SELECT * FROM messages WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        await db.run('UPDATE messages SET is_read = 1 WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ success: false, message: 'Error marking message as read' });
    }
});

/**
 * PATCH /api/messages/:id/unread - Mark as unread (admin)
 */
router.patch('/:id/unread', isAuthenticated, async (req, res) => {
    try {
        const existing = await db.get('SELECT * FROM messages WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        await db.run('UPDATE messages SET is_read = 0 WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Message marked as unread' });
    } catch (error) {
        console.error('Mark as unread error:', error);
        res.status(500).json({ success: false, message: 'Error marking message as unread' });
    }
});

/**
 * DELETE /api/messages/:id - Delete message (admin)
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const existing = await db.get('SELECT * FROM messages WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        await db.run('DELETE FROM messages WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ success: false, message: 'Error deleting message' });
    }
});

module.exports = router;
