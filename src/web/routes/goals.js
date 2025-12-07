const express = require('express');
const router = express.Router();
const db = require('../../database/connection');
const { requireAuth } = require('./auth');
const Validators = require('../../utils/validators');

// Barcha maqsadlar
router.get('/', async (req, res) => {
    try {
        const page = Validators.validatePageNumber(req.query.page);
        const category = req.query.category;
        const search = req.query.search;
        
        let goals = await db.getPublishedGoals();
        
        // Filtrlash
        if (category && category !== 'all') {
            goals = goals.filter(goal => goal.category === category);
        }
        
        if (search) {
            goals = await db.searchGoals(search);
        }
        
        // Saralash
        const sortBy = req.query.sort || 'newest';
        switch (sortBy) {
            case 'popular':
                goals.sort((a, b) => (b.participants || 0) - (a.participants || 0));
                break;
            case 'oldest':
                goals.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'newest':
            default:
                goals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
        
        // Sahifalash
        const perPage = 12;
        const totalPages = Math.ceil(goals.length / perPage);
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedGoals = goals.slice(start, end);
        
        // Popular kategoriyalar
        const popularCategories = await db.getPopularCategories(6);
        
        res.render('goals', {
            title: 'Maqsadlar',
            goals: paginatedGoals,
            categories: require('../../utils/constants').CATEGORIES,
            popularCategories: popularCategories,
            currentPage: page,
            totalPages: totalPages,
            currentCategory: category,
            searchQuery: search,
            sortBy: sortBy,
            totalGoals: goals.length,
            user: req.userId ? await db.getUser(req.userId) : null
        });
        
    } catch (error) {
        console.error('Goals page error:', error);
        res.status(500).render('error', {
            title: 'Xatolik',
            message: 'Maqsadlar yuklanmadi'
        });
    }
});

// Maqsad yaratish sahifasi
router.get('/create', requireAuth, async (req, res) => {
    try {
        res.render('goals/create', {
            title: 'Yangi maqsad - Yolchi',
            categories: require('../../utils/constants').CATEGORIES,
            durations: require('../../utils/constants').DURATION_OPTIONS,
            user: await db.getUser(req.userId)
        });
    } catch (error) {
        console.error('Create goal page error:', error);
        res.redirect('/goals');
    }
});

// Maqsad yaratish (API)
router.post('/create', requireAuth, async (req, res) => {
    try {
        const { name, description, duration, category } = req.body;
        
        // Validatsiya
        const errors = Validators.validateGoal({
            name, description, duration, category
        });
        
        if (errors) {
            return res.json({
                success: false,
                errors: errors
            });
        }
        
        const user = await db.getUser(req.userId);
        if (!user) {
            return res.json({
                success: false,
                errors: ['Foydalanuvchi topilmadi']
            });
        }
        
        // Maqsadni yaratish
        const goalData = {
            name: Validators.sanitizeText(name),
            description: Validators.sanitizeText(description),
            duration: duration,
            category: category,
            authorId: req.userId,
            authorName: `${user.first_name} ${user.last_name || ''}`.trim()
        };
        
        const goal = await db.createGoal(goalData);
        
        res.json({
            success: true,
            goalId: goal.id,
            message: 'Maqsad yaratildi! Admin tasdiqlashini kuting.'
        });
        
    } catch (error) {
        console.error('Create goal error:', error);
        res.json({
            success: false,
            errors: ['Server xatosi']
        });
    }
});

// Maqsad tafsilotlari
router.get('/:id', async (req, res) => {
    try {
        const goalId = req.params.id;
        const goal = await db.getGoal(goalId);
        
        if (!goal || !goal.isPublished) {
            return res.status(404).render('404', {
                title: 'Maqsad topilmadi'
            });
        }
        
        const participants = await db.getGoalParticipants(goalId);
        const participantUsers = [];
        
        for (const participant of participants.slice(0, 12)) {
            const user = await db.getUser(participant.userId);
            if (user) {
                participantUsers.push(user);
            }
        }
        
        // O'xshash maqsadlar
        const similarGoals = (await db.getGoalsByCategory(goal.category))
            .filter(g => g.id !== goalId && g.isPublished)
            .slice(0, 3);
        
        res.render('goal', {
            title: goal.name,
            goal: goal,
            participants: participantUsers,
            totalParticipants: participants.length,
            similarGoals: similarGoals,
            user: req.userId ? await db.getUser(req.userId) : null,
            isAuthor: req.userId && goal.authorId === req.userId
        });
        
    } catch (error) {
        console.error('Goal detail error:', error);
        res.status(500).render('error', {
            title: 'Xatolik',
            message: 'Maqsad yuklanmadi'
        });
    }
});

// Maqsadga qo'shilish
router.post('/:id/join', requireAuth, async (req, res) => {
    try {
        const goalId = req.params.id;
        const goal = await db.getGoal(goalId);
        
        if (!goal || !goal.isPublished) {
            return res.json({
                success: false,
                message: 'Maqsad topilmadi'
            });
        }
        
        // Qo'shilish
        const participation = await db.joinGoal(req.userId, goalId);
        
        res.json({
            success: true,
            message: 'Qo\'shilish so\'rovi yuborildi'
        });
        
    } catch (error) {
        console.error('Join goal error:', error);
        res.json({
            success: false,
            message: 'Xatolik yuz berdi'
        });
    }
});

// Maqsadni like/dislike
router.post('/:id/vote', requireAuth, async (req, res) => {
    try {
        const goalId = req.params.id;
        const { action } = req.body; // 'like' or 'dislike'
        
        if (!['like', 'dislike'].includes(action)) {
            return res.json({
                success: false,
                message: 'Noto\'g\'ri amal'
            });
        }
        
        const updatedGoal = await db.updateGoalLike(goalId, req.userId, action);
        
        if (!updatedGoal) {
            return res.json({
                success: false,
                message: 'Maqsad topilmadi'
            });
        }
        
        res.json({
            success: true,
            likes: updatedGoal.likes || 0,
            dislikes: updatedGoal.dislikes || 0
        });
        
    } catch (error) {
        console.error('Vote error:', error);
        res.json({
            success: false,
            message: 'Xatolik yuz berdi'
        });
    }
});

// Maqsadni tahrirlash sahifasi
router.get('/:id/edit', requireAuth, async (req, res) => {
    try {
        const goalId = req.params.id;
        const goal = await db.getGoal(goalId);
        
        if (!goal) {
            return res.redirect('/goals');
        }
        
        // Faqat muallif tahrirlashi mumkin
        if (goal.authorId !== req.userId) {
            return res.redirect(`/goals/${goalId}`);
        }
        
        res.render('goals/edit', {
            title: 'Maqsadni tahrirlash',
            goal: goal,
            categories: require('../../utils/constants').CATEGORIES,
            durations: require('../../utils/constants').DURATION_OPTIONS,
            user: await db.getUser(req.userId)
        });
        
    } catch (error) {
        console.error('Edit goal page error:', error);
        res.redirect('/goals');
    }
});

// Maqsadni yangilash
router.post('/:id/update', requireAuth, async (req, res) => {
    try {
        const goalId = req.params.id;
        const goal = await db.getGoal(goalId);
        
        if (!goal || goal.authorId !== req.userId) {
            return res.json({
                success: false,
                message: 'Ruxsat berilmagan'
            });
        }
        
        const { name, description, category } = req.body;
        
        // Validatsiya
        const errors = [];
        if (!name || name.length < 3) errors.push('Nom kamida 3 ta belgi');
        if (!description || description.length < 50) errors.push('Tarif kamida 50 ta belgi');
        if (!category) errors.push('Kategoriya tanlanishi kerak');
        
        if (errors.length > 0) {
            return res.json({
                success: false,
                errors: errors
            });
        }
        
        // Yangilash
        await db.updateGoal(goalId, {
            name: Validators.sanitizeText(name),
            description: Validators.sanitizeText(description),
            category: category,
            updatedAt: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Maqsad yangilandi'
        });
        
    } catch (error) {
        console.error('Update goal error:', error);
        res.json({
            success: false,
            message: 'Xatolik yuz berdi'
        });
    }
});

// Maqsadni o'chirish
router.post('/:id/delete', requireAuth, async (req, res) => {
    try {
        const goalId = req.params.id;
        const goal = await db.getGoal(goalId);
        
        if (!goal || goal.authorId !== req.userId) {
            return res.json({
                success: false,
                message: 'Ruxsat berilmagan'
            });
        }
        
        // Statusni o'zgartirish (aslida o'chirish emas)
        await db.updateGoal(goalId, {
            status: 'cancelled',
            isPublished: false
        });
        
        res.json({
            success: true,
            message: 'Maqsad o\'chirildi'
        });
        
    } catch (error) {
        console.error('Delete goal error:', error);
        res.json({
            success: false,
            message: 'Xatolik yuz berdi'
        });
    }
});

// Maqsad statistikasi
router.get('/:id/stats', async (req, res) => {
    try {
        const goalId = req.params.id;
        const goal = await db.getGoal(goalId);
        
        if (!goal) {
            return res.redirect('/goals');
        }
        
        const participants = await db.getGoalParticipants(goalId);
        
        // Statistika
        const stats = {
            totalParticipants: participants.length,
            activeParticipants: participants.filter(p => p.status === 'accepted').length,
            pendingParticipants: participants.filter(p => p.status === 'pending').length,
            daysLeft: goal.endDate ? 
                Math.ceil((new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 
                null,
            completionRate: goal.status === 'completed' ? 100 : 
                goal.startDate ? 
                    Math.round((Date.now() - new Date(goal.startDate)) / 
                    (new Date(goal.endDate) - new Date(goal.startDate)) * 100) : 
                    0
        };
        
        res.json({
            success: true,
            stats: stats,
            goal: goal
        });
        
    } catch (error) {
        console.error('Goal stats error:', error);
        res.json({
            success: false,
            message: 'Xatolik yuz berdi'
        });
    }
});

module.exports = router;