/**
 * Memberships Routes - Handle membership applications
 */

const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const { isAuthenticated } = require('../middleware/auth');

/**
 * POST /api/memberships - Submit application (public)
 */
router.post('/', (req, res) => {
    try {
        const { full_name, email, phone, university, major, academic_level, wilaya } = req.body;

        if (!full_name || !email || !phone || !university || !major || !academic_level || !wilaya) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        const existing = db.get('SELECT id FROM memberships WHERE email = ?', [email]);
        if (existing) {
            return res.status(400).json({ success: false, message: 'This email is already registered' });
        }

        db.run(
            'INSERT INTO memberships (full_name, email, phone, university, major, academic_level, wilaya) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [full_name, email, phone, university, major, academic_level, wilaya]
        );

        res.status(201).json({ success: true, message: 'Membership application submitted successfully!' });
    } catch (error) {
        console.error('Create membership error:', error);
        res.status(500).json({ success: false, message: 'Error submitting application' });
    }
});

/**
 * GET /api/memberships - Get all applications (admin)
 */
router.get('/', isAuthenticated, (req, res) => {
    try {
        const { status } = req.query;

        let sql = 'SELECT * FROM memberships';
        const params = [];

        if (status) {
            sql += ' WHERE status = ?';
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC';

        const memberships = db.all(sql, params);
        res.json({ success: true, data: memberships });
    } catch (error) {
        console.error('Get memberships error:', error);
        res.status(500).json({ success: false, message: 'Error fetching memberships' });
    }
});

/**
 * GET /api/memberships/stats - Get statistics (admin)
 */
router.get('/stats', isAuthenticated, (req, res) => {
    try {
        const total = db.get('SELECT COUNT(*) as count FROM memberships');
        const pending = db.get('SELECT COUNT(*) as count FROM memberships WHERE status = ?', ['pending']);
        const approved = db.get('SELECT COUNT(*) as count FROM memberships WHERE status = ?', ['approved']);
        const rejected = db.get('SELECT COUNT(*) as count FROM memberships WHERE status = ?', ['rejected']);

        res.json({
            success: true,
            data: {
                total: total?.count || 0,
                pending: pending?.count || 0,
                approved: approved?.count || 0,
                rejected: rejected?.count || 0
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

/**
 * GET /api/memberships/:id - Get single application (admin)
 */
router.get('/:id', isAuthenticated, (req, res) => {
    try {
        const membership = db.get('SELECT * FROM memberships WHERE id = ?', [req.params.id]);
        if (!membership) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        res.json({ success: true, data: membership });
    } catch (error) {
        console.error('Get membership error:', error);
        res.status(500).json({ success: false, message: 'Error fetching application' });
    }
});

/**
 * PATCH /api/memberships/:id/status - Update status (admin)
 */
router.patch('/:id/status', isAuthenticated, (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const existing = db.get('SELECT * FROM memberships WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        db.run('UPDATE memberships SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: `Membership ${status} successfully` });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
});

/**
 * DELETE /api/memberships/:id - Delete application (admin)
 */
router.delete('/:id', isAuthenticated, (req, res) => {
    try {
        const existing = db.get('SELECT * FROM memberships WHERE id = ?', [req.params.id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        db.run('DELETE FROM memberships WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Application deleted successfully' });
    } catch (error) {
        console.error('Delete membership error:', error);
        res.status(500).json({ success: false, message: 'Error deleting application' });
    }
});

module.exports = router;
