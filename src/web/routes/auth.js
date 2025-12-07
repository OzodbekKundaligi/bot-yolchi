const express = require('express');
const router = express.Router();
const db = require('../../database/connection');

// Login sahifasi
router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: 'Kirish - Yolchi',
        error: null
    });
});

// Login qilish (Telegram bot orqali)
router.post('/login', async (req, res) => {
    try {
        // Bu yerda aslida Telegram bot orqali autentifikatsiya bo'ladi
        // Hozircha oddiy redirect
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', {
            title: 'Kirish - Yolchi',
            error: 'Xatolik yuz berdi'
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    res.redirect('/');
});

// Profile ga qaytish
router.get('/profile/redirect', async (req, res) => {
    try {
        const { userId, goalId } = req.query;
        
        if (userId) {
            // Foydalanuvchini olish
            const user = await db.getUser(userId);
            if (user) {
                // Profil sahifasiga yo'naltirish
                return res.redirect(`/profile/${userId}`);
            }
        }
        
        if (goalId) {
            // Maqsad sahifasiga yo'naltirish
            return res.redirect(`/goal/${goalId}`);
        }
        
        res.redirect('/');
    } catch (error) {
        console.error('Redirect error:', error);
        res.redirect('/');
    }
});

// Telegram botga ulanish
router.get('/connect/telegram', (req, res) => {
    const botUsername = process.env.BOT_USERNAME || 'yolchi_goals_bot';
    res.redirect(`https://t.me/${botUsername}?start=web_auth`);
});

// Auth callback (Telegram'dan)
router.get('/auth/callback', async (req, res) => {
    try {
        const { id, first_name, last_name, username, auth_date, hash } = req.query;
        
        if (!id) {
            return res.redirect('/login?error=invalid_data');
        }
        
        // Foydalanuvchini yaratish/yangilash
        const userData = {
            id: parseInt(id),
            first_name: first_name || '',
            last_name: last_name || '',
            username: username || '',
            auth_date: auth_date,
            hash: hash
        };
        
        await db.createUser(userData);
        
        // Session yaratish (oddiy cookie)
        res.cookie('user_id', id, { maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 kun
        
        res.redirect('/');
        
    } catch (error) {
        console.error('Auth callback error:', error);
        res.redirect('/login?error=auth_failed');
    }
});

// Auth middleware
function requireAuth(req, res, next) {
    const userId = req.cookies.user_id;
    
    if (!userId) {
        return res.redirect('/login');
    }
    
    req.userId = userId;
    next();
}

// Auth check API
router.get('/api/check', async (req, res) => {
    try {
        const userId = req.cookies.user_id;
        
        if (!userId) {
            return res.json({ authenticated: false });
        }
        
        const user = await db.getUser(userId);
        res.json({
            authenticated: !!user,
            user: user ? {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username
            } : null
        });
        
    } catch (error) {
        console.error('Auth check error:', error);
        res.json({ authenticated: false });
    }
});

module.exports = { router, requireAuth };