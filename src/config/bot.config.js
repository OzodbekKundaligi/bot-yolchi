module.exports = {
    botToken: process.env.BOT_TOKEN || '',
    adminIds: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [],
    botUsername: process.env.BOT_USERNAME || 'yolchi_goals_bot',
    webUrl: process.env.WEB_URL || 'http://localhost:3000'
};