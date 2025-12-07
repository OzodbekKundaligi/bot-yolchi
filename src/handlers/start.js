const db = require('../database/connection');
const messages = require('../utils/messages');
const MainMenuKeyboard = require('../keyboards/mainMenu');

class StartHandler {
    static async handleStart(ctx) {
        try {
            const userId = ctx.from.id;
            const firstName = ctx.from.first_name;
            const lastName = ctx.from.last_name || '';
            const username = ctx.from.username || '';

            // Foydalanuvchini yaratish yoki olish
            const user = await db.createUser({
                id: userId,
                userId: userId,
                first_name: firstName,
                last_name: lastName,
                username: username,
                language_code: ctx.from.language_code || 'uz'
            });

            // Xush kelib qolish xabari
            await ctx.reply(messages.WELCOME(firstName), MainMenuKeyboard.getMainMenu());

            // Foydalanuvchi statistikasini yangilash
            await db.updateUser(userId, {
                last_active: new Date().toISOString(),
                start_count: (user.start_count || 0) + 1
            });

        } catch (error) {
            console.error('Start handler error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleMainMenu(ctx) {
        try {
            await ctx.reply(messages.MAIN_MENU, MainMenuKeyboard.getMainMenu());
        } catch (error) {
            console.error('Main menu error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleCancel(ctx) {
        try {
            await ctx.reply('Amal bekor qilindi.', MainMenuKeyboard.getMainMenu());
        } catch (error) {
            console.error('Cancel error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleBack(ctx) {
        try {
            // Avvalgi menyuga qaytish logikasi
            // Siz holatlarni saqlashingiz kerak bo'lishi mumkin
            await ctx.reply('Orqaga qaytildi.', MainMenuKeyboard.getMainMenu());
        } catch (error) {
            console.error('Back error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }
}

module.exports = StartHandler;