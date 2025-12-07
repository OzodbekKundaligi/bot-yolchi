const db = require('../../database/connection');
const Validators = require('../../utils/validators');

class GoalController {
    // Maqsad yaratish
    static async createGoal(req, res) {
        try {
            const { name, description, duration, category } = req.body;
            const userId = req.userId;
            
            // Validatsiya
            const errors = Validators.validateGoal({
                name, description, duration, category
            });
            
            if (errors) {
                return res.status(400).json({
                    success: false,
                    errors: errors
                });
            }
            
            const user = await db.getUser(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    errors: ['Foydalanuvchi topilmadi']
                });
            }
            
            // Maqsad yaratish
            const goalData = {
                name: Validators.sanitizeText(name),
                description: Validators.sanitizeText(description),
                duration: duration,
                category: category,
                authorId: userId,
                authorName: `${user.first_name} ${user.last_name || ''}`.trim()
            };
            
            const goal = await db.createGoal(goalData);
            
            res.status(201).json({
                success: true,
                goal: goal,
                message: 'Maqsad yaratildi'
            });
            
        } catch (error) {
            console.error('Create goal controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Maqsadni o'zgartirish
    static async updateGoal(req, res) {
        try {
            const goalId = req.params.id;
            const updates = req.body;
            const userId = req.userId;
            
            const goal = await db.getGoal(goalId);
            if (!goal) {
                return res.status(404).json({
                    success: false,
                    errors: ['Maqsad topilmadi']
                });
            }
            
            // Faqat muallif o'zgartira oladi
            if (goal.authorId !== userId) {
                return res.status(403).json({
                    success: false,
                    errors: ['Ruxsat berilmagan']
                });
            }
            
            // Sanitize qilish
            if (updates.name) updates.name = Validators.sanitizeText(updates.name);
            if (updates.description) updates.description = Validators.sanitizeText(updates.description);
            
            updates.updatedAt = new Date().toISOString();
            
            const updatedGoal = await db.updateGoal(goalId, updates);
            
            res.json({
                success: true,
                goal: updatedGoal,
                message: 'Maqsad yangilandi'
            });
            
        } catch (error) {
            console.error('Update goal controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Maqsadni o'chirish
    static async deleteGoal(req, res) {
        try {
            const goalId = req.params.id;
            const userId = req.userId;
            
            const goal = await db.getGoal(goalId);
            if (!goal) {
                return res.status(404).json({
                    success: false,
                    errors: ['Maqsad topilmadi']
                });
            }
            
            // Faqat muallif o'chira oladi
            if (goal.authorId !== userId) {
                return res.status(403).json({
                    success: false,
                    errors: ['Ruxsat berilmagan']
                });
            }
            
            // Statusni o'zgartirish
            await db.updateGoal(goalId, {
                status: 'cancelled',
                isPublished: false,
                updatedAt: new Date().toISOString()
            });
            
            res.json({
                success: true,
                message: 'Maqsad o\'chirildi'
            });
            
        } catch (error) {
            console.error('Delete goal controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Maqsadga qo'shilish
    static async joinGoal(req, res) {
        try {
            const goalId = req.params.id;
            const userId = req.userId;
            
            const goal = await db.getGoal(goalId);
            if (!goal || !goal.isPublished) {
                return res.status(404).json({
                    success: false,
                    errors: ['Maqsad topilmadi']
                });
            }
            
            // O'z maqsadiga qo'shilish mumkin emas
            if (goal.authorId === userId) {
                return res.status(400).json({
                    success: false,
                    errors: ['O\'z maqsadingizga qo\'shila olmaysiz']
                });
            }
            
            // Qo'shilish
            const participation = await db.joinGoal(userId, goalId);
            
            res.status(201).json({
                success: true,
                participation: participation,
                message: 'Qo\'shilish so\'rovi yuborildi'
            });
            
        } catch (error) {
            console.error('Join goal controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Maqsadni like qilish
    static async likeGoal(req, res) {
        try {
            const goalId = req.params.id;
            const userId = req.userId;
            
            const updatedGoal = await db.updateGoalLike(goalId, userId, 'like');
            
            if (!updatedGoal) {
                return res.status(404).json({
                    success: false,
                    errors: ['Maqsad topilmadi']
                });
            }
            
            res.json({
                success: true,
                likes: updatedGoal.likes || 0,
                message: 'Maqsad yoqdi'
            });
            
        } catch (error) {
            console.error('Like goal controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Maqsadni dislike qilish
    static async dislikeGoal(req, res) {
        try {
            const goalId = req.params.id;
            const userId = req.userId;
            
            const updatedGoal = await db.updateGoalLike(goalId, userId, 'dislike');
            
            if (!updatedGoal) {
                return res.status(404).json({
                    success: false,
                    errors: ['Maqsad topilmadi']
                });
            }
            
            res.json({
                success: true,
                dislikes: updatedGoal.dislikes || 0,
                message: 'Maqsad yoqmadi'
            });
            
        } catch (error) {
            console.error('Dislike goal controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Maqsad statistikasi
    static async getGoalStats(req, res) {
        try {
            const goalId = req.params.id;
            const goal = await db.getGoal(goalId);
            
            if (!goal) {
                return res.status(404).json({
                    success: false,
                    errors: ['Maqsad topilmadi']
                });
            }
            
            const participants = await db.getGoalParticipants(goalId);
            
            const stats = {
                goal: goal,
                participants: {
                    total: participants.length,
                    accepted: participants.filter(p => p.status === 'accepted').length,
                    pending: participants.filter(p => p.status === 'pending').length,
                    rejected: participants.filter(p => p.status === 'rejected').length
                },
                engagement: {
                    likes: goal.likes || 0,
                    dislikes: goal.dislikes || 0,
                    totalVotes: (goal.likes || 0) + (goal.dislikes || 0)
                },
                timeline: {
                    createdAt: goal.createdAt,
                    startDate: goal.startDate,
                    endDate: goal.endDate,
                    daysLeft: goal.endDate ? 
                        Math.ceil((new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 
                        null
                }
            };
            
            res.json({
                success: true,
                stats: stats
            });
            
        } catch (error) {
            console.error('Get goal stats controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
    
    // Maqsad ishtirokchilari
    static async getGoalParticipants(req, res) {
        try {
            const goalId = req.params.id;
            const page = Validators.validatePageNumber(req.query.page);
            const limit = Validators.validateLimit(req.query.limit);
            
            const goal = await db.getGoal(goalId);
            if (!goal) {
                return res.status(404).json({
                    success: false,
                    errors: ['Maqsad topilmadi']
                });
            }
            
            const allParticipants = await db.getGoalParticipants(goalId);
            
            // Ishtirokchi ma'lumotlarini olish
            const participants = [];
            const start = (page - 1) * limit;
            const end = start + limit;
            
            for (let i = start; i < Math.min(end, allParticipants.length); i++) {
                const participation = allParticipants[i];
                const user = await db.getUser(participation.userId);
                if (user) {
                    participants.push({
                        user: {
                            id: user.id,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            username: user.username
                        },
                        participation: participation
                    });
                }
            }
            
            res.json({
                success: true,
                participants: participants,
                pagination: {
                    page: page,
                    limit: limit,
                    total: allParticipants.length,
                    totalPages: Math.ceil(allParticipants.length / limit)
                }
            });
            
        } catch (error) {
            console.error('Get goal participants controller error:', error);
            res.status(500).json({
                success: false,
                errors: ['Server xatosi']
            });
        }
    }
}

module.exports = GoalController;