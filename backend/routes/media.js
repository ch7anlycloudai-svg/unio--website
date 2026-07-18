/**
 * Media Routes - Hero Slides & Specialties Management
 * Mauritanian Students Union Website
 *
 * All file uploads are stored in Supabase Storage (bucket: "uploads").
 */

const express = require('express');
const router = express.Router();
const { getClient } = require('../models/database');
const { isAuthenticated: requireAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// ========================================
// MULTER CONFIGURATION (memory storage)
// ========================================

const storage = multer.memoryStorage();

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
// STORAGE HELPERS
// ========================================

/**
 * Extract the storage path from a Supabase public URL or legacy relative path.
 * Returns the path inside the "uploads" bucket, e.g. "hero/12345.jpg"
 */
function extractStoragePath(url) {
    if (!url) return null;

    // Supabase public URL
    const supabaseMarker = '/storage/v1/object/public/uploads/';
    const idx = url.indexOf(supabaseMarker);
    if (idx !== -1) {
        return url.substring(idx + supabaseMarker.length);
    }

    // Legacy relative path
    if (url.startsWith('/assets/uploads/')) {
        return url.replace('/assets/uploads/', '');
    }

    return null;
}

// ========================================
// HERO SLIDES ROUTES
// ========================================

/**
 * GET /api/media/hero - Get all active hero slides (public)
 */
router.get('/hero', async (req, res) => {
    try {
        const supabase = getClient();
        const { data: slides, error } = await supabase
            .from('hero_slides')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data: slides });
    } catch (error) {
        console.error('Error fetching hero slides:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب الشرائح' });
    }
});

/**
 * GET /api/media/hero/all - Get all hero slides (admin)
 */
router.get('/hero/all', requireAuth, async (req, res) => {
    try {
        const supabase = getClient();
        const { data: slides, error } = await supabase
            .from('hero_slides')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data: slides });
    } catch (error) {
        console.error('Error fetching all hero slides:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب الشرائح' });
    }
});

/**
 * POST /api/media/hero - Add new hero slide (admin)
 */
router.post('/hero', requireAuth, async (req, res) => {
    try {
        const { title, subtitle, image_url, link_url, link_text, display_order } = req.body;

        if (!image_url) {
            return res.status(400).json({ success: false, message: 'رابط الصورة مطلوب' });
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('hero_slides')
            .insert({
                title: title || '',
                subtitle: subtitle || '',
                image_url,
                link_url: link_url || '',
                link_text: link_text || '',
                display_order: display_order || 0
            })
            .select('id')
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'تمت إضافة الشريحة بنجاح',
            data: { id: data.id }
        });
    } catch (error) {
        console.error('Error adding hero slide:', error);
        res.status(500).json({ success: false, message: 'خطأ في إضافة الشريحة' });
    }
});

/**
 * PUT /api/media/hero/:id - Update hero slide (admin)
 */
router.put('/hero/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, image_url, link_url, link_text, display_order, is_active } = req.body;

        const supabase = getClient();
        const { error } = await supabase
            .from('hero_slides')
            .update({
                title,
                subtitle,
                image_url,
                link_url,
                link_text,
                display_order,
                is_active: is_active ? true : false
            })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'تم تحديث الشريحة بنجاح' });
    } catch (error) {
        console.error('Error updating hero slide:', error);
        res.status(500).json({ success: false, message: 'خطأ في تحديث الشريحة' });
    }
});

/**
 * DELETE /api/media/hero/:id - Delete hero slide (admin)
 */
router.delete('/hero/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const supabase = getClient();

        // Get slide to delete its image
        const { data: slide } = await supabase
            .from('hero_slides')
            .select('image_url')
            .eq('id', id)
            .single();

        const { error } = await supabase.from('hero_slides').delete().eq('id', id);
        if (error) throw error;

        // Delete image from Supabase Storage
        if (slide && slide.image_url) {
            const storagePath = extractStoragePath(slide.image_url);
            if (storagePath) {
                await supabase.storage.from('uploads').remove([storagePath]);
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
router.get('/specialties', async (req, res) => {
    try {
        const supabase = getClient();
        const { data: specialties, error } = await supabase
            .from('specialties')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;

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
router.get('/specialties/all', requireAuth, async (req, res) => {
    try {
        const supabase = getClient();
        const { data: specialties, error } = await supabase
            .from('specialties')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;

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
router.get('/specialties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const supabase = getClient();
        const { data: specialty, error } = await supabase
            .from('specialties')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !specialty) {
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
router.post('/specialties', requireAuth, async (req, res) => {
    try {
        const { name, name_ar, icon, description, image_url, video_url, video_type, items, duration, display_order } = req.body;

        if (!name || !name_ar) {
            return res.status(400).json({ success: false, message: 'اسم التخصص مطلوب' });
        }

        const itemsJson = Array.isArray(items) ? JSON.stringify(items) : items;

        const supabase = getClient();
        const { data, error } = await supabase
            .from('specialties')
            .insert({
                name,
                name_ar,
                icon: icon || '📚',
                description: description || '',
                image_url: image_url || '',
                video_url: video_url || '',
                video_type: video_type || 'youtube',
                items: itemsJson || '[]',
                duration: duration || '',
                display_order: display_order || 0
            })
            .select('id')
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'تمت إضافة التخصص بنجاح',
            data: { id: data.id }
        });
    } catch (error) {
        console.error('Error adding specialty:', error);
        res.status(500).json({ success: false, message: 'خطأ في إضافة التخصص' });
    }
});

/**
 * PUT /api/media/specialties/:id - Update specialty (admin)
 */
router.put('/specialties/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, name_ar, icon, description, image_url, video_url, video_type, items, duration, display_order, is_active } = req.body;

        const itemsJson = Array.isArray(items) ? JSON.stringify(items) : items;

        const supabase = getClient();
        const { error } = await supabase
            .from('specialties')
            .update({
                name,
                name_ar,
                icon,
                description,
                image_url,
                video_url,
                video_type,
                items: itemsJson,
                duration,
                display_order,
                is_active: is_active ? true : false,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'تم تحديث التخصص بنجاح' });
    } catch (error) {
        console.error('Error updating specialty:', error);
        res.status(500).json({ success: false, message: 'خطأ في تحديث التخصص' });
    }
});

/**
 * DELETE /api/media/specialties/:id - Delete specialty (admin)
 */
router.delete('/specialties/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const supabase = getClient();

        // Get specialty to delete its image
        const { data: specialty } = await supabase
            .from('specialties')
            .select('image_url')
            .eq('id', id)
            .single();

        const { error } = await supabase.from('specialties').delete().eq('id', id);
        if (error) throw error;

        // Delete image from Supabase Storage
        if (specialty && specialty.image_url) {
            const storagePath = extractStoragePath(specialty.image_url);
            if (storagePath) {
                await supabase.storage.from('uploads').remove([storagePath]);
            }
        }

        res.json({ success: true, message: 'تم حذف التخصص بنجاح' });
    } catch (error) {
        console.error('Error deleting specialty:', error);
        res.status(500).json({ success: false, message: 'خطأ في حذف التخصص' });
    }
});

// ========================================
// FILE UPLOAD ROUTES (Supabase Storage)
// ========================================

/**
 * POST /api/media/upload/:type - Upload image to Supabase Storage (admin)
 * type can be: hero, specialties, news, general
 */
router.post('/upload/:type', requireAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'لم يتم تحميل أي ملف' });
        }

        const type = req.params.type || 'general';
        const ext = path.extname(req.file.originalname).toLowerCase();
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        const storagePath = `${type}/${uniqueName}`;

        const supabase = getClient();
        const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('uploads')
            .getPublicUrl(storagePath);

        res.json({
            success: true,
            message: 'تم رفع الصورة بنجاح',
            data: {
                url: urlData.publicUrl,
                filename: uniqueName,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ success: false, message: 'خطأ في رفع الملف' });
    }
});

/**
 * DELETE /api/media/upload - Delete uploaded file from Supabase Storage (admin)
 */
router.delete('/upload', requireAuth, async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, message: 'رابط الملف غير صالح' });
        }

        const storagePath = extractStoragePath(url);
        if (!storagePath) {
            return res.status(400).json({ success: false, message: 'رابط الملف غير صالح' });
        }

        const supabase = getClient();
        const { error } = await supabase.storage
            .from('uploads')
            .remove([storagePath]);

        if (error) throw error;

        res.json({ success: true, message: 'تم حذف الملف بنجاح' });
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
