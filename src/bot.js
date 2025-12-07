// bot.js - SearchHandler importini tuzatamiz

const { Telegraf, session } = require('telegraf');
require('dotenv').config();

const config = require('./config/bot.config');
const db = require('./database/connection');

// Handlerlarni to'g'ri import qilish
const StartHandler = require('./handlers/start');
const { ProfileHandler, userStates } = require('./handlers/profile');
const { CreateGoalHandler, goalCreationStates } = require('./handlers/goals/createGoal');
const { MyGoalsHandler, paginationStates } = require('./handlers/goals/myGoals');
const JoinedGoalsHandler = require('./handlers/goals/joinedGoals');
const SearchHandler = require('./handlers/search'); // FAKAT SearchHandler
const AboutHandler = require('./handlers/about');
const AdminHandler = require('./admin/notifications');

// Klaviaturalar
const MainMenuKeyboard = require('./keyboards/mainMenu');
const GoalCreationKeyboard = require('./keyboards/goalCreation');

// Botni yaratish
const bot = new Telegraf(config.botToken);

// Session middleware
bot.use(session());

// Start command
bot.start(StartHandler.handleStart);

// Asosiy menyu tugmalari
bot.hears('🏠 Asosiy menyu', StartHandler.handleMainMenu);
bot.hears('⬅️ Orqaga', StartHandler.handleBack);
bot.hears('❌ Bekor qilish', StartHandler.handleCancel);

// Maqsadlar menyusi
bot.hears('📋 Maqsadlarim', (ctx) => {
    ctx.reply('Maqsadlar menyusi:', MainMenuKeyboard.getGoalsMenu());
});

// Maqsad yaratish
bot.hears('1️⃣ Maqsad yaratish', CreateGoalHandler.handleCreateGoal);
bot.hears('2️⃣ Mening maqsadlarim', MyGoalsHandler.handleMyGoals);
bot.hears('3️⃣ Men qo\'shilgan maqsadlar', JoinedGoalsHandler.handleJoinedGoals);
bot.hears('4️⃣ Asosiy menyu', StartHandler.handleMainMenu);

// Profil
bot.hears('🪪 Profil', ProfileHandler.handleProfile);

// Maqsadlar (qidirish)
bot.hears('🎯 Maqsadlar', (ctx) => {
    if (SearchHandler && SearchHandler.handleSearchMenu) {
        SearchHandler.handleSearchMenu(ctx);
    } else {
        ctx.reply('Qidirish menyusi:\n\n💡 Tavsiyalar\n🔍 Kategoriya bo\'yicha qidirish\n🏠 Asosiy menyu',
            MainMenuKeyboard.getSearchMenu());
    }
});

// Tavsiyalar
bot.hears('💡 Tavsiyalar', (ctx) => {
    if (SearchHandler && SearchHandler.handleRecommendations) {
        SearchHandler.handleRecommendations(ctx);
    } else {
        ctx.reply('Tavsiyalar tizimi hozircha ishga tushmagan.');
    }
});

// Kategoriya qidirish
bot.hears('🔍 Kategoriya bo\'yicha qidirish', (ctx) => {
    if (SearchHandler && SearchHandler.handleCategorySearch) {
        SearchHandler.handleCategorySearch(ctx);
    } else {
        ctx.reply('Kategoriyalar:\n\nBiznes, Karyera, Ta\'lim, Do\'stlar, Sog\'lom hayot, Qiziqishlar, Til o\'rganish, Zamonaviy kasblar, Shaxsiy rivojlanish, Kitobxonlik, Talaba, Sayohat, Sport',
            MainMenuKeyboard.getSearchMenu());
    }
});

// Biz haqimizda
bot.hears('ℹ️ Biz haqimizda', AboutHandler.handleAbout);

// Kategoriya tanlash (matn orqali)
bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;
    
    // Kategoriyalar ro'yxati
    const categories = [
        'Biznes', 'Karyera', 'Ta\'lim', 'Do\'stlar', 'Sog\'lom hayot',
        'Qiziqishlar', 'Til o\'rganish', 'Zamonaviy kasblar',
        'Shaxsiy rivojlanish', 'Kitobxonlik', 'Talaba', 'Sayohat', 'Sport'
    ];
    
    // Agar kategoriya tanlangan bo'lsa
    if (categories.includes(text)) {
        if (SearchHandler && SearchHandler.handleCategorySelection) {
            await SearchHandler.handleCategorySelection(ctx, text);
        } else {
            ctx.reply(`"${text}" kategoriyasini tanladingiz.`);
        }
        return;
    }
    
    // Maqsadlar ro'yxatidan tanlash (raqam yozilsa)
    if (!isNaN(text) && parseInt(text) > 0) {
        // Bu qismni keyinroq to'ldiramiz
        return;
    }
});

// Inline callback query handler
bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    
    try {
        // LIKE/DISLIKE handler
        if (callbackData.startsWith('like_rec_')) {
            const recId = callbackData.replace('like_rec_', '');
            if (SearchHandler && SearchHandler.handleLikeDislike) {
                await SearchHandler.handleLikeDislike(ctx, 'like', recId);
            }
        }
        else if (callbackData.startsWith('dislike_rec_')) {
            const recId = callbackData.replace('dislike_rec_', '');
            if (SearchHandler && SearchHandler.handleLikeDislike) {
                await SearchHandler.handleLikeDislike(ctx, 'dislike', recId);
            }
        }
        else if (callbackData.startsWith('join_rec_')) {
            const recId = callbackData.replace('join_rec_', '');
            if (SearchHandler && SearchHandler.handleJoinRecommendation) {
                await SearchHandler.handleJoinRecommendation(ctx, recId);
            }
        }
        
        // Sahifalash
        else if (callbackData.includes('_page_')) {
            const [type, , pageStr] = callbackData.split('_');
            const page = parseInt(pageStr);
            
            if (type === 'category_goals' || type === 'recommendations') {
                if (SearchHandler && SearchHandler.handlePagination) {
                    await SearchHandler.handlePagination(ctx, page, type);
                }
            }
        }
        
        await ctx.answerCbQuery();
        
    } catch (error) {
        console.error('Callback query error:', error);
        await ctx.answerCbQuery();
    }
});

// Xatoliklar
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
    ctx.reply('Xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.');
});

// Botni ishga tushirish
async function startBot() {
    try {
        // Database ni ishga tushirish
        await db.init();
        
        console.log('Database initialized');
        
        // Botni ishga tushirish
        await bot.launch();
        console.log('🤖 Bot ishga tushdi!');
        
        // Graceful shutdown
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
        
    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}
// Kanal ID sini olish uchun komanda
bot.command('getchannelid', async (ctx) => {
    try {
        // Forward qilingan xabar orqali
        if (ctx.message.reply_to_message) {
            const chatId = ctx.message.reply_to_message.chat.id;
            const chatType = ctx.message.reply_to_message.chat.type;
            const chatTitle = ctx.message.reply_to_message.chat.title;
            
            await ctx.reply(
                `📊 Chat ma'lumotlari:\n` +
                `ID: ${chatId}\n` +
                `Tur: ${chatType}\n` +
                `Nomi: ${chatTitle}\n\n` +
                `Kanal ID uchun: ${chatId}`
            );
        } else {
            await ctx.reply('Kanal ID sini olish uchun kanaldan xabarni forward qiling yoki reply bering.');
        }
    } catch (error) {
        console.error('Get channel ID error:', error);
        await ctx.reply('Xatolik yuz berdi.');
    }
});
// Kanal test komandasi
bot.command('testchannel', async (ctx) => {
    try {
        const channelId = config.channelId;
        const channelUsername = config.channelUsername;
        
        await ctx.reply(
            `🔧 Kanal test:\n` +
            `Kanal ID: ${channelId || 'Mavjud emas'}\n` +
            `Kanal username: ${channelUsername || 'Mavjud emas'}\n` +
            `Bot token: ${config.botToken ? 'Mavjud' : 'Mavjud emas'}\n\n` +
            `Tayyorlanmoqda...`
        );
        
        // Test xabarini yuborish
        if (channelId || channelUsername) {
            try {
                const testMessage = await ctx.telegram.sendMessage(
                    channelId || channelUsername,
                    '🔧 Test xabari - Yolchi Platformasi ishlayapti!',
                    { parse_mode: 'HTML' }
                );
                
                await ctx.reply(`✅ Test muvaffaqiyatli! Xabar ID: ${testMessage.message_id}`);
            } catch (error) {
                await ctx.reply(`❌ Xatolik: ${error.message}`);
            }
        } else {
            await ctx.reply('❌ Kanal ID yoki username topilmadi.');
        }
        
    } catch (error) {
        console.error('Test channel error:', error);
        await ctx.reply(`❌ Xatolik: ${error.message}`);
    }
});
// Ishga tushirish
startBot();

module.exports = bot;