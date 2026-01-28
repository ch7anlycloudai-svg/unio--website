/**
 * Media Routes - Hero Slides & Specialties Management
 * Mauritanian Students Union Website
 */

const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const { isAuthenticated: requireAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========================================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ========================================

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'frontend', 'assets', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.params.type || 'general';
        const typeDir = path.join(uploadsDir, type);
        if (!fs.existsSync(typeDir)) {
            fs.mkdirSync(typeDir, { recursive: true });
        }
        cb(null, typeDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, uniqueSuffix + ext);
    }
});

// File filter for images only
const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// ========================================
// HERO SLIDES ROUTES
// ========================================

/**
 * GET /api/media/hero - Get all active hero slides (public)
 */
router.get('/hero', (req, res) => {
    try {
        const slides = db.all(
            'SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY display_order ASC'
        );
        res.json({ success: true, data: slides });
    } catch (error) {
        console.error('Error fetching hero slides:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب الشرائح' });
    }
});

/**
 * GET /api/media/hero/all - Get all hero slides (admin)
 */
router.get('/hero/all', requireAuth, (req, res) => {
    try {
        const slides = db.all('SELECT * FROM hero_slides ORDER BY display_order ASC');
        res.json({ success: true, data: slides });
    } catch (error) {
        console.error('Error fetching all hero slides:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب الشرائح' });
    }
});

/**
 * POST /api/media/hero - Add new hero slide (admin)
 */
router.post('/hero', requireAuth, (req, res) => {
    try {
        const { title, subtitle, image_url, link_url, link_text, display_order } = req.body;

        if (!image_url) {
            return res.status(400).json({ success: false, message: 'رابط الصورة مطلوب' });
        }

        const result = db.run(
            `INSERT INTO hero_slides (title, subtitle, image_url, link_url, link_text, display_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title || '', subtitle || '', image_url, link_url || '', link_text || '', display_order || 0]
        );

        res.json({
            success: true,
            message: 'تمت إضافة الشريحة بنجاح',
            data: { id: result.lastInsertRowid }
        });
    } catch (error) {
        console.error('Error adding hero slide:', error);
        res.status(500).json({ success: false, message: 'خطأ في إضافة الشريحة' });
    }
});

/**
 * PUT /api/media/hero/:id - Update hero slide (admin)
 */
router.put('/hero/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, image_url, link_url, link_text, display_order, is_active } = req.body;

        db.run(
            `UPDATE hero_slides
             SET title = ?, subtitle = ?, image_url = ?, link_url = ?, link_text = ?,
                 display_order = ?, is_active = ?
             WHERE id = ?`,
            [title, subtitle, image_url, link_url, link_text, display_order, is_active ? 1 : 0, id]
        );

        res.json({ success: true, message: 'تم تحديث الشريحة بنجاح' });
    } catch (error) {
        console.error('Error updating hero slide:', error);
        res.status(500).json({ success: false, message: 'خطأ في تحديث الشريحة' });
    }
});

/**
 * DELETE /api/media/hero/:id - Delete hero slide (admin)
 */
router.delete('/hero/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;

        // Get slide to delete its image
        const slide = db.get('SELECT image_url FROM hero_slides WHERE id = ?', [id]);

        db.run('DELETE FROM hero_slides WHERE id = ?', [id]);

        // Delete image file if it's a local upload
        if (slide && slide.image_url && slide.image_url.startsWith('/assets/uploads/')) {
            const imagePath = path.join(__dirname, '..', '..', 'frontend', slide.image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.json({ success: true, message: 'تم حذف الشريحة بنجاح' });
    } catch (error) {
        console.error('Error deleting hero slide:', error);
        res.status(500).json({ success: false, message: 'خطأ في حذف الشريحة' });
    }
});

// ========================================
// SPECIALTIES ROUTES
// ========================================

/**
 * GET /api/media/specialties - Get all active specialties (public)
 */
router.get('/specialties', (req, res) => {
    try {
        const specialties = db.all(
            'SELECT * FROM specialties WHERE is_active = 1 ORDER BY display_order ASC'
        );

        // Parse items JSON
        const parsed = specialties.map(spec => ({
            ...spec,
            items: spec.items ? JSON.parse(spec.items) : []
        }));

        res.json({ success: true, data: parsed });
    } catch (error) {
        console.error('Error fetching specialties:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب التخصصات' });
    }
});

/**
 * GET /api/media/specialties/all - Get all specialties (admin)
 */
router.get('/specialties/all', requireAuth, (req, res) => {
    try {
        const specialties = db.all('SELECT * FROM specialties ORDER BY display_order ASC');

        const parsed = specialties.map(spec => ({
            ...spec,
            items: spec.items ? JSON.parse(spec.items) : []
        }));

        res.json({ success: true, data: parsed });
    } catch (error) {
        console.error('Error fetching all specialties:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب التخصصات' });
    }
});

/**
 * GET /api/media/specialties/:id - Get single specialty
 */
router.get('/specialties/:id', (req, res) => {
    try {
        const { id } = req.params;
        const specialty = db.get('SELECT * FROM specialties WHERE id = ?', [id]);

        if (!specialty) {
            return res.status(404).json({ success: false, message: 'التخصص غير موجود' });
        }

        specialty.items = specialty.items ? JSON.parse(specialty.items) : [];

        res.json({ success: true, data: specialty });
    } catch (error) {
        console.error('Error fetching specialty:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب التخصص' });
    }
});

/**
 * POST /api/media/specialties - Add new specialty (admin)
 */
router.post('/specialties', requireAuth, (req, res) => {
    try {
        const { name, name_ar, icon, description, image_url, video_url, video_type, items, duration, display_order } = req.body;

        if (!name || !name_ar) {
            return res.status(400).json({ success: false, message: 'اسم التخصص مطلوب' });
        }

        const itemsJson = Array.isArray(items) ? JSON.stringify(items) : items;

        const result = db.run(
            `INSERT INTO specialties (name, name_ar, icon, description, image_url, video_url, video_type, items, duration, display_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, name_ar, icon || '📚', description || '', image_url || '', video_url || '', video_type || 'youtube', itemsJson || '[]', duration || '', display_order || 0]
        );

        res.json({
            success: true,
            message: 'تمت إضافة التخصص بنجاح',
            data: { id: result.lastInsertRowid }
        });
    } catch (error) {
        console.error('Error adding specialty:', error);
        res.status(500).json({ success: false, message: 'خطأ في إضافة التخصص' });
    }
});

/**
 * PUT /api/media/specialties/:id - Update specialty (admin)
 */
router.put('/specialties/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { name, name_ar, icon, description, image_url, video_url, video_type, items, duration, display_order, is_active } = req.body;

        const itemsJson = Array.isArray(items) ? JSON.stringify(items) : items;

        db.run(
            `UPDATE specialties
             SET name = ?, name_ar = ?, icon = ?, description = ?, image_url = ?,
                 video_url = ?, video_type = ?, items = ?, duration = ?,
                 display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name, name_ar, icon, description, image_url, video_url, video_type, itemsJson, duration, display_order, is_active ? 1 : 0, id]
        );

        res.json({ success: true, message: 'تم تحديث التخصص بنجاح' });
    } catch (error) {
        console.error('Error updating specialty:', error);
        res.status(500).json({ success: false, message: 'خطأ في تحديث التخصص' });
    }
});

/**
 * DELETE /api/media/specialties/:id - Delete specialty (admin)
 */
router.delete('/specialties/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;

        // Get specialty to delete its image
        const specialty = db.get('SELECT image_url FROM specialties WHERE id = ?', [id]);

        db.run('DELETE FROM specialties WHERE id = ?', [id]);

        // Delete image file if it's a local upload
        if (specialty && specialty.image_url && specialty.image_url.startsWith('/assets/uploads/')) {
            const imagePath = path.join(__dirname, '..', '..', 'frontend', specialty.image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.json({ success: true, message: 'تم حذف التخصص بنجاح' });
    } catch (error) {
        console.error('Error deleting specialty:', error);
        res.status(500).json({ success: false, message: 'خطأ في حذف التخصص' });
    }
});

// ========================================
// FILE UPLOAD ROUTES
// ========================================

/**
 * POST /api/media/upload/:type - Upload image (admin)
 * type can be: hero, specialties, general
 */
router.post('/upload/:type', requireAuth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'لم يتم تحميل أي ملف' });
        }

        const type = req.params.type || 'general';
        const imageUrl = `/assets/uploads/${type}/${req.file.filename}`;

        res.json({
            success: true,
            message: 'تم رفع الصورة بنجاح',
            data: {
                url: imageUrl,
                filename: req.file.filename,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ success: false, message: 'خطأ في رفع الملف' });
    }
});

/**
 * DELETE /api/media/upload - Delete uploaded file (admin)
 */
router.delete('/upload', requireAuth, (req, res) => {
    try {
        const { url } = req.body;

        if (!url || !url.startsWith('/assets/uploads/')) {
            return res.status(400).json({ success: false, message: 'رابط الملف غير صالح' });
        }

        const filePath = path.join(__dirname, '..', '..', 'frontend', url);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'تم حذف الملف بنجاح' });
        } else {
            res.status(404).json({ success: false, message: 'الملف غير موجود' });
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ success: false, message: 'خطأ في حذف الملف' });
    }
});

// ========================================
// VIDEO URL HELPERS
// ========================================

/**
 * POST /api/media/parse-video - Parse video URL and return embed info
 */
router.post('/parse-video', (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, message: 'رابط الفيديو مطلوب' });
        }

        const videoInfo = parseVideoUrl(url);

        if (videoInfo) {
            res.json({ success: true, data: videoInfo });
        } else {
            res.status(400).json({ success: false, message: 'رابط الفيديو غير مدعوم' });
        }
    } catch (error) {
        console.error('Error parsing video URL:', error);
        res.status(500).json({ success: false, message: 'خطأ في معالجة الرابط' });
    }
});

/**
 * Parse video URL and extract type and ID
 */
function parseVideoUrl(url) {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
        return {
            type: 'youtube',
            id: youtubeMatch[1],
            embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`
        };
    }

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) {
        return {
            type: 'vimeo',
            id: vimeoMatch[1],
            embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`
        };
    }

    // Google Drive
    const driveMatch = url.match(/(?:drive\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
        return {
            type: 'drive',
            id: driveMatch[1],
            embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`
        };
    }

    return null;
}

// Error handling for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'حجم الملف كبير جداً (الحد الأقصى 5MB)' });
        }
    }
    if (error.message === 'Only image files are allowed (jpeg, jpg, png, gif, webp)') {
        return res.status(400).json({ success: false, message: 'يُسمح فقط بملفات الصور (jpeg, jpg, png, gif, webp)' });
    }
    next(error);
});

module.exports = router;
