require('dotenv').config();

module.exports = {
    // Bot sozlamalari
    botToken: process.env.BOT_TOKEN || '',
    adminIds: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [],
    botUsername: process.env.BOT_USERNAME || 'yolchi_goals_bot',
    
    // Kanal sozlamalari (MUHIM!)
    channelId: process.env.CHANNEL_ID || '',
    channelUsername: process.env.CHANNEL_USERNAME || '',
    
    // Server sozlamalari
    webUrl: process.env.WEB_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Debug
    isProduction: process.env.NODE_ENV === 'production',
    
    // Kanalni tekshirish
    getChannelTarget() {
        return this.channelId || this.channelUsername;
    },
    
    // Admin tekshirish
    isAdmin(userId) {
        return this.adminIds.includes(userId.toString());
    }
};