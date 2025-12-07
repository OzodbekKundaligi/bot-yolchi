const db = require('../../database/connection');
const Validators = require('../../utils/validators');

class UserController {
    // Foydalanuvchi ma'lumotlari
    static async getUser(req, res) {
        try {
            const userId = req.params.id;
            const user = await db.getUser(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    errors: ['Foydalanuvchi topilmadi']
                });
            }
            
            // Maxfiy ma'lumotlarni olib tashlash
            const safeUser = { ...user };
            delete safeUser.hash;
            delete safeUser.auth_date;
            
            res.json({
                success: true,
                user: safeUser
            });
            
        } catch (error) {
            console.error('Get user controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Foydalanuvchini yangilash
    static async updateUser(req, res) {
        try {
            const userId = req.params.id;
            const updates = req.body;
            
            // Faqat o'z profilini yangilashi mumkin
            if (userId !== req.userId) {
                return res.status(403).json({
                    success: false,
                    errors: ['Ruxsat berilmagan']
                });
            }
            
            // Validatsiya
            const validationErrors = Validators.validateUserUpdate(updates);
            if (validationErrors) {
                return res.status(400).json({
                    success: false,
                    errors: validationErrors
                });
            }
            
            // Sanitize qilish
            if (updates.first_name) updates.first_name = Validators.sanitizeText(updates.first_name);
            if (updates.last_name) updates.last_name = Validators.sanitizeText(updates.last_name);
            if (updates.location) updates.location = Validators.sanitizeText(updates.location);
            if (updates.bio) updates.bio = Validators.sanitizeText(updates.bio);
            
            updates.updatedAt = new Date().toISOString();
            
            const updatedUser = await db.updateUser(userId, updates);
            
            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    errors: ['Foydalanuvchi topilmadi']
                });
            }
            
            res.json({
                success: true,
                user: updatedUser,
                message: 'Profil yangilandi'
            });
            
        } catch (error) {
            console.error('Update user controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Foydalanuvchi statistikasi
    static async getUserStats(req, res) {
        try {
            const userId = req.params.id;
            const stats = await db.getUserStats(userId);
            
            res.json({
                success: true,
                stats: stats
            });
            
        } catch (error) {
            console.error('Get user stats controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Foydalanuvchi maqsadlari
    static async getUserGoals(req, res) {
        try {
            const userId = req.params.id;
            const page = Validators.validatePageNumber(req.query.page);
            const limit = Validators.validateLimit(req.query.limit);
            const status = req.query.status; // 'active', 'completed', 'pending'
            
            let goals = await db.getUserGoals(userId);
            
            // Filtrlash
            if (status) {
                goals = goals.filter(goal => goal.status === status);
            }
            
            // Sahifalash
            const total = goals.length;
            const totalPages = Math.ceil(total / limit);
            const start = (page - 1) * limit;
            const end = start + limit;
            const paginatedGoals = goals.slice(start, end);
            
            res.json({
                success: true,
                goals: paginatedGoals,
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    totalPages: totalPages
                }
            });
            
        } catch (error) {
            console.error('Get user goals controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Foydalanuvchi qo'shilgan maqsadlar
    static async getUserParticipations(req, res) {
        try {
            const userId = req.params.id;
            const page = Validators.validatePageNumber(req.query.page);
            const limit = Validators.validateLimit(req.query.limit);
            const status = req.query.status;
            
            let participations = await db.getUserParticipations(userId);
            
            // Filtrlash
            if (status) {
                participations = participations.filter(p => p.status === status);
            }
            
            // Maqsad ma'lumotlarini olish
            const goals = [];
            const start = (page - 1) * limit;
            const end = start + limit;
            
            for (let i = start; i < Math.min(end, participations.length); i++) {
                const participation = participations[i];
                const goal = await db.getGoal(participation.goalId);
                if (goal) {
                    goals.push({
                        ...goal,
                        participation: participation
                    });
                }
            }
            
            res.json({
                success: true,
                goals: goals,
                pagination: {
                    page: page,
                    limit: limit,
                    total: participations.length,
                    totalPages: Math.ceil(participations.length / limit)
                }
            });
            
        } catch (error) {
            console.error('Get user participations controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Foydalanuvchini o'chirish (soft delete)
    static async deleteUser(req, res) {
        try {
            const userId = req.params.id;
            
            // Faqat o'z profilini o'chirishi mumkin
            if (userId !== req.userId) {
                return res.status(403).json({
                    success: false,
                    errors: ['Ruxsat berilmagan']
                });
            }
            
            // Foydalanuvchi ma'lumotlarini yangilash (soft delete)
            await db.updateUser(userId, {
                is_deleted: true,
                deleted_at: new Date().toISOString()
            });
            
            res.json({
                success: true,
                message: 'Profil o\'chirildi'
            });
            
        } catch (error) {
            console.error('Delete user controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Foydalanuvchi aktivligi
    static async updateUserActivity(req, res) {
        try {
            const userId = req.userId;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    errors: ['Avtorizatsiya talab qilinadi']
                });
            }
            
            await db.updateUser(userId, {
                last_active: new Date().toISOString()
            });
            
            res.json({
                success: true,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Update user activity controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Top foydalanuvchilar
    static async getTopUsers(req, res) {
        try {
            const limit = Validators.validateLimit(req.query.limit || 10);
            
            const users = await db.readFile('users.json');
            
            // Faqat faol foydalanuvchilar
            const activeUsers = users.filter(user => !user.is_deleted);
            
            // Ballarni hisoblash
            const usersWithScores = await Promise.all(activeUsers.map(async user => {
                const stats = await db.getUserStats(user.id);
                
                const score = 
                    (stats.totalGoalsCreated * 10) +
                    (stats.totalGoalsJoined * 5) +
                    (stats.completedGoals * 20) +
                    (user.diamonds || 0);
                
                return {
                    ...user,
                    score: score,
                    stats: stats
                };
            }));
            
            // Saralash
            const topUsers = usersWithScores
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(user => ({
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    score: user.score,
                    goals_created: user.stats.totalGoalsCreated,
                    goals_completed: user.stats.completedGoals,
                    diamonds: user.diamonds || 0
                }));
            
            res.json({
                success: true,
                users: topUsers
            });
            
        } catch (error) {
            console.error('Get top users controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
}

module.exports = UserController;