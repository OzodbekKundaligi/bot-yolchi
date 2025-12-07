const fs = require('fs').promises;
const path = require('path');

class Database {
    constructor() {
        this.dataDir = path.join(__dirname, '../data');
        this.init();
    }

    async init() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Kerakli fayllarni yaratish
            const files = ['users.json', 'goals.json', 'participations.json', 'recommendations.json'];
            
            for (const file of files) {
                const filePath = path.join(this.dataDir, file);
                try {
                    await fs.access(filePath);
                } catch {
                    await fs.writeFile(filePath, JSON.stringify([]));
                }
            }
            
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization error:', error);
        }
    }

    async readFile(filename) {
        try {
            const filePath = path.join(this.dataDir, filename);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${filename}:`, error);
            return [];
        }
    }

    async writeFile(filename, data) {
        try {
            const filePath = path.join(this.dataDir, filename);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing ${filename}:`, error);
            return false;
        }
    }

    // User operations
    async getUser(userId) {
        const users = await this.readFile('users.json');
        return users.find(user => user.id === userId || user.userId === userId);
    }

    async createUser(userData) {
        const users = await this.readFile('users.json');
        
        // Check if user exists
        const existingUser = users.find(u => u.id === userData.id);
        if (existingUser) {
            return existingUser;
        }

        users.push({
            ...userData,
            createdAt: new Date().toISOString(),
            diamonds: 0,
            goalsCreated: 0,
            goalsJoined: 0
        });

        await this.writeFile('users.json', users);
        return userData;
    }

    async updateUser(userId, updates) {
        const users = await this.readFile('users.json');
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date().toISOString() };
            await this.writeFile('users.json', users);
            return users[userIndex];
        }
        
        return null;
    }

    // Goal operations
    async createGoal(goalData) {
        const goals = await this.readFile('goals.json');
        
        const newGoal = {
            id: Date.now().toString(),
            ...goalData,
            createdAt: new Date().toISOString(),
            status: 'pending',
            isActive: false,
            participants: 0,
            likes: 0,
            dislikes: 0,
            isPublished: false
        };

        goals.push(newGoal);
        await this.writeFile('goals.json', goals);
        
        // Update user's goalsCreated count
        const user = await this.getUser(goalData.authorId);
        if (user) {
            await this.updateUser(goalData.authorId, { goalsCreated: (user.goalsCreated || 0) + 1 });
        }

        return newGoal;
    }

    async getGoal(goalId) {
        const goals = await this.readFile('goals.json');
        return goals.find(goal => goal.id === goalId);
    }

    async getUserGoals(userId) {
        const goals = await this.readFile('goals.json');
        return goals.filter(goal => goal.authorId === userId);
    }

    async getPublishedGoals() {
        const goals = await this.readFile('goals.json');
        return goals.filter(goal => goal.isPublished && goal.status === 'active');
    }

    async getGoalsByCategory(category) {
        const goals = await this.readFile('goals.json');
        return goals.filter(goal => goal.category === category && goal.isPublished);
    }

    async updateGoal(goalId, updates) {
        const goals = await this.readFile('goals.json');
        const goalIndex = goals.findIndex(g => g.id === goalId);
        
        if (goalIndex !== -1) {
            goals[goalIndex] = { ...goals[goalIndex], ...updates };
            await this.writeFile('goals.json', goals);
            return goals[goalIndex];
        }
        
        return null;
    }

    // Participation operations
    async joinGoal(userId, goalId) {
        const participations = await this.readFile('participations.json');
        
        // Check if already joined
        const existing = participations.find(p => p.userId === userId && p.goalId === goalId);
        if (existing) {
            return existing;
        }

        const newParticipation = {
            id: Date.now().toString(),
            userId,
            goalId,
            joinedAt: new Date().toISOString(),
            status: 'pending'
        };

        participations.push(newParticipation);
        await this.writeFile('participations.json', participations);
        
        // Update goal participants count
        const goal = await this.getGoal(goalId);
        if (goal) {
            await this.updateGoal(goalId, { participants: (goal.participants || 0) + 1 });
        }
        
        // Update user's goalsJoined count
        const user = await this.getUser(userId);
        if (user) {
            await this.updateUser(userId, { goalsJoined: (user.goalsJoined || 0) + 1 });
        }

        return newParticipation;
    }

    async getUserParticipations(userId) {
        const participations = await this.readFile('participations.json');
        return participations.filter(p => p.userId === userId);
    }

    async getGoalParticipants(goalId) {
        const participations = await this.readFile('participations.json');
        return participations.filter(p => p.goalId === goalId);
    }

    // Recommendation operations
    async createRecommendation(recData) {
        const recommendations = await this.readFile('recommendations.json');
        
        const newRec = {
            id: Date.now().toString(),
            ...recData,
            createdAt: new Date().toISOString(),
            likes: 0,
            dislikes: 0
        };

        recommendations.push(newRec);
        await this.writeFile('recommendations.json', recommendations);
        return newRec;
    }

    async getRecommendations(limit = 10) {
        const recommendations = await this.readFile('recommendations.json');
        return recommendations.slice(0, limit);
    }

    async updateRecommendation(recId, updates) {
        const recommendations = await this.readFile('recommendations.json');
        const recIndex = recommendations.findIndex(r => r.id === recId);
        
        if (recIndex !== -1) {
            recommendations[recIndex] = { ...recommendations[recIndex], ...updates };
            await this.writeFile('recommendations.json', recommendations);
            return recommendations[recIndex];
        }
        
        return null;
    }
}

module.exports = new Database();
