const fs = require('fs').promises;
const path = require('path');
const config = require('../config/bot.config');

class Database {
    constructor() {
        this.dataDir = path.join(__dirname, '../../data');
        this.data = {
            users: [],
            goals: [],
            participations: [],
            recommendations: []
        };
        this.isRailway = config.isProduction;
    }

    async init() {
        try {
            if (!this.isRailway) {
                // Local: JSON fayllar
                await fs.mkdir(this.dataDir, { recursive: true });
                const files = ['users.json', 'goals.json', 'participations.json', 'recommendations.json'];
                
                for (const file of files) {
                    const filePath = path.join(this.dataDir, file);
                    try {
                        await fs.access(filePath);
                        const data = await fs.readFile(filePath, 'utf8');
                        this.data[file.replace('.json', '')] = JSON.parse(data);
                    } catch {
                        await fs.writeFile(filePath, JSON.stringify([]));
                        this.data[file.replace('.json', '')] = [];
                    }
                }
                console.log('✅ Local database initialized');
            } else {
                // Railway: Memory database
                console.log('✅ Railway memory database initialized');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Database initialization error:', error);
            // Memory da davom et
            return true;
        }
    }

    // Users
    async getUser(userId) {
        return this.data.users.find(user => user.id == userId);
    }

    async createUser(userData) {
        const existingUser = this.data.users.find(u => u.id == userData.id);
        if (existingUser) return existingUser;

        const newUser = {
            ...userData,
            createdAt: new Date().toISOString(),
            diamonds: 0,
            goalsCreated: 0,
            goalsJoined: 0
        };
        
        this.data.users.push(newUser);
        await this.saveToFile('users');
        return newUser;
    }

    async updateUser(userId, updates) {
        const userIndex = this.data.users.findIndex(u => u.id == userId);
        if (userIndex === -1) return null;

        this.data.users[userIndex] = { 
            ...this.data.users[userIndex], 
            ...updates, 
            updatedAt: new Date().toISOString() 
        };
        await this.saveToFile('users');
        return this.data.users[userIndex];
    }

    // Goals
    async createGoal(goalData) {
        const newGoal = {
            id: Date.now().toString(),
            ...goalData,
            createdAt: new Date().toISOString(),
            status: 'pending',
            isActive: false,
            participants: 0,
            likes: 0,
            dislikes: 0,
            isPublished: false,
            channelMessageId: null
        };

        this.data.goals.push(newGoal);
        await this.saveToFile('goals');
        
        // Update user stats
        const user = await this.getUser(goalData.authorId);
        if (user) {
            await this.updateUser(goalData.authorId, { 
                goalsCreated: (user.goalsCreated || 0) + 1 
            });
        }

        return newGoal;
    }

    async getGoal(goalId) {
        return this.data.goals.find(goal => goal.id === goalId);
    }

    async getUserGoals(userId) {
        return this.data.goals.filter(goal => goal.authorId == userId);
    }

    async getPublishedGoals() {
        return this.data.goals.filter(goal => goal.isPublished && goal.status === 'active');
    }

    async getGoalsByCategory(category) {
        return this.data.goals.filter(goal => goal.category === category && goal.isPublished);
    }

    async updateGoal(goalId, updates) {
        const goalIndex = this.data.goals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) return null;

        this.data.goals[goalIndex] = { 
            ...this.data.goals[goalIndex], 
            ...updates 
        };
        await this.saveToFile('goals');
        return this.data.goals[goalIndex];
    }

    // For search
    async getRecommendations(limit = 10) {
        const published = this.data.goals.filter(g => g.isPublished);
        return published.slice(0, limit);
    }

    // Participations
    async joinGoal(userId, goalId) {
        const existing = this.data.participations.find(p => 
            p.userId == userId && p.goalId === goalId
        );
        if (existing) return existing;

        const newParticipation = {
            id: Date.now().toString(),
            userId,
            goalId,
            joinedAt: new Date().toISOString(),
            status: 'pending'
        };

        this.data.participations.push(newParticipation);
        await this.saveToFile('participations');
        
        // Update goal participants count
        const goal = await this.getGoal(goalId);
        if (goal) {
            await this.updateGoal(goalId, { 
                participants: (goal.participants || 0) + 1 
            });
        }
        
        // Update user stats
        const user = await this.getUser(userId);
        if (user) {
            await this.updateUser(userId, { 
                goalsJoined: (user.goalsJoined || 0) + 1 
            });
        }

        return newParticipation;
    }

    async getUserParticipations(userId) {
        return this.data.participations.filter(p => p.userId == userId);
    }

    async getGoalParticipants(goalId) {
        return this.data.participations.filter(p => p.goalId === goalId);
    }

    // Helper methods
    async saveToFile(filename) {
        if (this.isRailway) return; // Railway'da faylga yozmaymiz
        
        try {
            const filePath = path.join(this.dataDir, `${filename}.json`);
            await fs.writeFile(filePath, JSON.stringify(this.data[filename], null, 2));
        } catch (error) {
            console.error(`Error saving ${filename}:`, error);
        }
    }

    async readFile(filename) {
        return this.data[filename.replace('.json', '')] || [];
    }
}

module.exports = new Database();