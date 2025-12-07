const express = require('express');
const router = express.Router();
const db = require('../../database/connection');
const { requireAuth } = require('./auth');
const Validators = require('../../utils/validators');

// Profil sahifasi
router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await db.getUser(req.userId);
        
        if (!user) {
            return res.redirect('/logout');
        }
        
        // Foydalanuvchi statistikasi
        const stats = await db.getUserStats(req.userId);
        
        // Foydalanuvchining maqsadlari
        const userGoals = await db.getUserGoals(req.userId);
        const joinedGoals = await db.getUserParticipations(req.userId);
        
        res.render('profile/index', {
            title: 'Profil - Yolchi',
            user: user,
            stats: stats,
            goals: userGoals.slice(0, 6),
            joinedGoals: joinedGoals.slice(0, 6),
            totalGoals: userGoals.length,
            totalJoined: joinedGoals.length
        });
        
    } catch (error) {
        console.error('Profile page error:', error);
        res.redirect('/');
    }
});

// Profilni tahrirlash sahifasi
router.get('/edit', requireAuth, async (req, res) => {
    try {
        const user = await db.getUser(req.userId);
        
        if (!user) {
            return res.redirect('/logout');
        }
        
        res.render('profile/edit', {
            title: 'Profilni tahrirlash',
            user: user
        });
        
    } catch (error) {
        console.error('Edit profile page error:', error);
        res.redirect('/profile');
    }
});

// Profilni yangilash
router.post('/update', requireAuth, async (req, res) => {
    try {
        const { field, value } = req.body;
        
        if (!field || !value) {
            return res.json({
                success: false,
                message: 'Maydon va qiymat kerak'
            });
        }
        
        let updateData = {};
        let error = null;
        
        switch (field) {
            case 'first_name':
                if (value.length < 3) {
                    error = 'Ism kamida 3 ta harf';
                } else {
                    updateData.first_name = Validators.sanitizeText(value);
                }
                break;
                
            case 'last_name':
                if (value.length < 2) {
                    error = 'Familiya kamida 2 ta harf';
                } else {
                    updateData.last_name = Validators.sanitizeText(value);
                }
                break;
                
            case 'phone':
                if (!Validators.validatePhone(value)) {
                    error = 'Telefon raqami noto\'g\'ri formatda';
                } else {
                    updateData.phone = value;
                }
                break;
                
            case 'birth_date':
                if (!Validators.validateBirthDate(value)) {
                    error = 'Tug\'ilgan sana noto\'g\'ri formatda (DD.MM.YYYY)';
                } else {
                    updateData.birth_date = value;
                }
                break;
                
            case 'location':
                if (value.length < 2) {
                    error = 'Joylashuv kamida 2 ta harf';
                } else {
                    updateData.location = Validators.sanitizeText(value);
                }
                break;
                
            case 'bio':
                if (value.length > 200) {
                    error = 'Bio 200 ta belgidan oshmasligi kerak';
                } else {
                    updateData.bio = Validators.sanitizeText(value);
                }
                break;
                
            case 'gender':
                if (!['Erkak', 'Ayol'].includes(value)) {
                    error = 'Noto\'g\'ri jins';
                } else {
                    updateData.gender = value;
                }
                break;
                
            default:
                error = 'Noto\'g\'ri maydon';
        }
        
        if (error) {
            return res.json({
                success: false,
                message: error
            });
        }
        
        // Yangilash
        const updatedUser = await db.updateUser(req.userId, updateData);
        
        if (!updatedUser) {
            return res.json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }
        
        res.json({
            success: true,
            message: 'Profil yangilandi',
            user: updatedUser
        });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.json({
            success: false,
            message: 'Xatolik yuz berdi'
        });
    }
});

// Foydalanuvchining maqsadlari
router.get('/goals', requireAuth, async (req, res) => {
    try {
        const page = Validators.validatePageNumber(req.query.page);
        const goals = await db.getUserGoals(req.userId);
        
        // Sahifalash
        const perPage = 12;
        const totalPages = Math.ceil(goals.length / perPage);
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedGoals = goals.slice(start, end);
        
        res.render('profile/goals', {
            title: 'Mening maqsadlarim',
            goals: paginatedGoals,
            currentPage: page,
            totalPages: totalPages,
            totalGoals: goals.length,
            user: await db.getUser(req.userId)
        });
        
    } catch (error) {
        console.error('User goals error:', error);
        res.redirect('/profile');
    }
});

// Qo'shilgan maqsadlar
router.get('/joined', requireAuth, async (req, res) => {
    try {
        const page = Validators.validatePageNumber(req.query.page);
        const participations = await db.getUserParticipations(req.userId);
        
        // Maqsad ma'lumotlarini olish
        const joinedGoals = [];
        for (const participation of participations) {
            const goal = await db.getGoal(participation.goalId);
            if (goal) {
                joinedGoals.push({
                    ...goal,
                    joinedAt: participation.joinedAt,
                    participationStatus: participation.status
                });
            }
        }
        
        // Sahifalash
        const perPage = 12;
        const totalPages = Math.ceil(joinedGoals.length / perPage);
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedGoals = joinedGoals.slice(start, end);
        
        res.render('profile/joined', {
            title: 'Qo\'shilgan maqsadlar',
            goals: paginatedGoals,
            currentPage: page,
            totalPages: totalPages,
            totalGoals: joinedGoals.length,
            user: await db.getUser(req.userId)
        });
        
    } catch (error) {
        console.error('Joined goals error:', error);
        res.redirect('/profile');
    }
});

// Statistikalar
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const stats = await db.getUserStats(req.userId);
        
        res.render('profile/stats', {
            title: 'Statistikalar',
            stats: stats,
            user: await db.getUser(req.userId)
        });
        
    } catch (error) {
        console.error('Stats page error:', error);
        res.redirect('/profile');
    }
});

// Boshqa foydalanuvchi profili
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await db.getUser(userId);
        
        if (!user) {
            return res.status(404).render('404', {
                title: 'Foydalanuvchi topilmadi'
            });
        }
        
        // Foydalanuvchi statistikasi
        const stats = await db.getUserStats(userId);
        
        // Foydalanuvchining faol maqsadlari
        const activeGoals = (await db.getUserGoals(userId))
            .filter(goal => goal.status === 'active' && goal.isPublished)
            .slice(0, 6);
        
        res.render('profile/public', {
            title: `${user.first_name} ${user.last_name || ''}`.trim(),
            profileUser: user,
            stats: stats,
            activeGoals: activeGoals,
            isOwnProfile: req.userId === userId,
            user: req.userId ? await db.getUser(req.userId) : null
        });
        
    } catch (error) {
        console.error('Public profile error:', error);
        res.status(500).render('error', {
            title: 'Xatolik',
            message: 'Profil yuklanmadi'
        });
    }
});

// Profil rasmini yangilash (keyinroq)
router.post('/avatar', requireAuth, async (req, res) => {
    try {
        // Hozircha oddiy xabar
        res.json({
            success: true,
            message: 'Rasm yangilandi (bu xususiyat keyinroq qo\'shiladi)'
        });
        
    } catch (error) {
        console.error('Update avatar error:', error);
        res.json({
            success: false,
            message: 'Xatolik yuz berdi'
        });
    }
});

module.exports = router;