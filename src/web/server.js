const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.WEB_PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database
const db = require('../database/connection');

// Routelarni import qilish
const { router: authRouter, requireAuth } = require('./routes/auth');
const goalsRouter = require('./routes/goals');
const profileRouter = require('./routes/profile');
const apiRouter = require('./routes/api');

// Routelarni ulash
app.use('/auth', authRouter);
app.use('/goals', goalsRouter);
app.use('/profile', profileRouter);
app.use('/api', apiRouter);

// Bosh sahifa
app.get('/', async (req, res) => {
    try {
        const trendingGoals = await db.getTrendingGoals(6);
        const newGoals = (await db.getPublishedGoals())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6);
        
        // Platforma statistikasi
        const stats = await db.getPlatformStats();
        
        res.render('home', {
            title: 'Yolchi - Maqsadlar Platformasi',
            trendingGoals: trendingGoals,
            newGoals: newGoals,
            stats: stats,
            user: req.cookies.user_id ? await db.getUser(req.cookies.user_id) : null
        });
    } catch (error) {
        console.error('Home page error:', error);
        res.render('home', {
            title: 'Yolchi - Maqsadlar Platformasi',
            trendingGoals: [],
            newGoals: [],
            stats: { totalUsers: 1000, totalGoals: 500 },
            user: null
        });
    }
});

// Bot holati
app.get('/bot', (req, res) => {
    const botUsername = process.env.BOT_USERNAME || 'yolchi_goals_bot';
    res.redirect(`https://t.me/${botUsername}`);
});

// Qo'llab-quvvatlash
app.get('/support', async (req, res) => {
    res.render('support', {
        title: 'Qo\'llab-quvvatlash - Yolchi',
        user: req.cookies.user_id ? await db.getUser(req.cookies.user_id) : null
    });
});

// Maxfiylik siyosati
app.get('/privacy', async (req, res) => {
    res.render('privacy', {
        title: 'Maxfiylik siyosati - Yolchi',
        user: req.cookies.user_id ? await db.getUser(req.cookies.user_id) : null
    });
});

// Foydalanish shartlari
app.get('/terms', async (req, res) => {
    res.render('terms', {
        title: 'Foydalanish shartlari - Yolchi',
        user: req.cookies.user_id ? await db.getUser(req.cookies.user_id) : null
    });
});

// 404 sahifasi
app.use(async (req, res) => {
    res.status(404).render('404', {
        title: 'Sahifa topilmadi - Yolchi',
        user: req.cookies.user_id ? await db.getUser(req.cookies.user_id) : null
    });
});

// Global xato boshqaruvchi
app.use(async (err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).render('error', {
        title: 'Xatolik - Yolchi',
        message: 'Kechirasiz, server xatosi yuz berdi.',
        user: req.cookies.user_id ? await db.getUser(req.cookies.user_id) : null
    });
});

// Server ni ishga tushirish
async function startServer() {
    try {
        // Database ni ishga tushirish
        await db.init();
        
        app.listen(PORT, () => {
            console.log(`🌐 Veb sayt http://localhost:${PORT} da ishga tushdi!`);
            console.log(`🤖 Bot: https://t.me/${process.env.BOT_USERNAME || 'yolchi_goals_bot'}`);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Ishga tushirish
startServer();

module.exports = app;