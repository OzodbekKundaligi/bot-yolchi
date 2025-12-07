const messages = require('../utils/messages');
const MainMenuKeyboard = require('../keyboards/mainMenu');

class AboutHandler {
    static async handleAbout(ctx) {
        try {
            await ctx.reply(
                messages.ABOUT_TEXT,
                MainMenuKeyboard.getMainMenu()
            );
        } catch (error) {
            console.error('About handler error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleSupport(ctx) {
        try {
            await ctx.reply(
                '🆘 Yordam va qo\'llab-quvvatlash:\n\n' +
                '📞 Aloqa: @yolchi_support\n' +
                '📧 Email: support@yolchi.uz\n' +
                '🌐 Veb sayt: https://yolchi.uz\n\n' +
                'Ish vaqti: 09:00 - 18:00 (har kuni)',
                MainMenuKeyboard.getMainMenu()
            );
        } catch (error) {
            console.error('Support error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleStats(ctx) {
        try {
            // Statistika ma'lumotlari (keyinroq to'ldiriladi)
            await ctx.reply(
                '📊 Platforma statistikasi:\n\n' +
                '👥 Umumiy foydalanuvchilar: 1000+\n' +
                '🎯 Yaratilgan maqsadlar: 500+\n' +
                '🤝 Qo\'shilgan ishtiroklar: 2000+\n' +
                '✅ Muvaffaqiyatli yakunlangan: 300+\n\n' +
                '💎 Eng faol foydalanuvchilar:\n' +
                '1. @user1 - 45 maqsad\n' +
                '2. @user2 - 32 maqsad\n' +
                '3. @user3 - 28 maqsad',
                MainMenuKeyboard.getMainMenu()
            );
        } catch (error) {
            console.error('Stats error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }
}

module.exports = AboutHandler;