const { Telegraf, session } = require('telegraf');
require('dotenv').config();

const config = require('./config/bot.config');
const db = require('./database/connection');

// Handlerlar
const StartHandler = require('./handlers/start');
const { ProfileHandler, userStates } = require('./handlers/profile');
const { CreateGoalHandler, goalCreationStates } = require('./handlers/goals/createGoal');
const { MyGoalsHandler, paginationStates } = require('./handlers/goals/myGoals');
const JoinedGoalsHandler = require('./handlers/goals/joinedGoals');
const SearchHandler = require('./handlers/search');
const AboutHandler = require('./handlers/about');
const AdminHandler = require('./admin/notifications');

// Klaviaturalar
const MainMenuKeyboard = require('./keyboards/mainMenu');
const GoalCreationKeyboard = require('./keyboards/goalCreation');

// Botni yaratish
const bot = new Telegraf(config.botToken);

// Session middleware
bot.use(session());

// ============ ASOSIY HANDLERLAR ============

// Start
bot.start(StartHandler.handleStart);

// Asosiy menyu
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

// Qidirish
bot.hears('🎯 Maqsadlar', (ctx) => {
    SearchHandler.handleSearchMenu(ctx);
});

// Biz haqimizda
bot.hears('ℹ️ Biz haqimizda', AboutHandler.handleAbout);

// ============ YANGI: TEST KOMANDALARI ============

// Kanalni test qilish
bot.command('testchannel', async (ctx) => {
    try {
        const result = await AdminHandler.testChannel(ctx);
        await ctx.reply(result);
    } catch (error) {
        await ctx.reply(`❌ Test xatosi: ${error.message}`);
    }
});

// Admin ma'lumotlari
bot.command('admininfo', async (ctx) => {
    const info = await AdminHandler.getAdminInfo(ctx);
    await ctx.reply(info);
});

// Ma'lumotlar bazasi holati
bot.command('dbstatus', async (ctx) => {
    const users = await db.readFile('users.json');
    const goals = await db.readFile('goals.json');
    await ctx.reply(
        `📊 DATABASE HOLATI\n\n` +
        `👥 Foydalanuvchilar: ${users.length} ta\n` +
        `🎯 Maqsadlar: ${goals.length} ta\n` +
        `📍 Environment: ${config.nodeEnv}\n` +
        `🤖 Bot: @${config.botUsername}`
    );
});

// ID ni olish
bot.command('myid', (ctx) => {
    ctx.reply(`🆔 SIZNING ID'INGIZ: ${ctx.from.id}\n👤 Ism: ${ctx.from.first_name}`);
});

// Bot holati
bot.command('status', (ctx) => {
    ctx.reply(
        `🤖 BOT HOLATI\n\n` +
        `✅ Ishlamoqda\n` +
        `👑 Adminlar: ${config.adminIds.length} ta\n` +
        `🎯 Kanal: ${config.getChannelTarget() || 'Sozlanmagan'}\n` +
        `🌐 Environment: ${config.nodeEnv}`
    );
});

// ============ TEXT HANDLER ============

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text.trim();
    
    // Maqsad yaratish holati
    const goalState = goalCreationStates[userId];
    if (goalState) {
        if (goalState.step === 'waiting_name') {
            await CreateGoalHandler.handleGoalName(ctx);
            return;
        } else if (goalState.step === 'waiting_description') {
            await CreateGoalHandler.handleGoalDescription(ctx);
            return;
        }
    }
    
    // Profil tahrirlash
    const profileState = userStates[userId];
    if (profileState && profileState.step === 'waiting_input') {
        await ProfileHandler.handleTextInput(ctx);
        return;
    }
    
    // Kategoriya tanlash
    const categories = [
        'Biznes', 'Karyera', 'Ta\'lim', 'Do\'stlar', 'Sog\'lom hayot',
        'Qiziqishlar', 'Til o\'rganish', 'Zamonaviy kasblar',
        'Shaxsiy rivojlanish', 'Kitobxonlik', 'Talaba', 'Sayohat', 'Sport'
    ];
    
    if (categories.includes(text)) {
        await SearchHandler.handleCategorySelection(ctx, text);
        return;
    }
});

// ============ CALLBACK QUERY HANDLER ============

bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    
    try {
        console.log(`📞 Callback received: ${callbackData}`);
        
        // Davomiylik tanlash
        if (callbackData.startsWith('duration_')) {
            const duration = callbackData.replace('duration_', '');
            await CreateGoalHandler.handleDurationSelection(ctx, duration);
        }
        
        // Kategoriya tanlash
        else if (callbackData.startsWith('category_')) {
            const category = callbackData.replace('category_', '');
            await CreateGoalHandler.handleCategorySelection(ctx, category);
        }
        
        // Nashr qilish tanlovi
        else if (callbackData.startsWith('publish_')) {
            const decision = callbackData.replace('publish_', '');
            await CreateGoalHandler.handlePublishDecision(ctx, decision);
        }
        
        // Maqsadni tasdiqlash/rad etish
        else if (callbackData.startsWith('approve_') || callbackData.startsWith('reject_')) {
            const action = callbackData.startsWith('approve_') ? 'approve' : 'reject';
            const goalId = callbackData.replace(`${action}_`, '');
            await AdminHandler.handleGoalApproval(ctx, action, goalId);
        }
        
        // Bekor qilish
        else if (callbackData === 'cancel_goal_creation') {
            await CreateGoalHandler.handleCancelGoalCreation(ctx);
        }
        
        // Asosiy menyu
        else if (callbackData === 'main_menu') {
            await StartHandler.handleMainMenu(ctx);
        }
        
        await ctx.answerCbQuery();
        
    } catch (error) {
        console.error('❌ Callback query error:', error);
        await ctx.answerCbQuery('❌ Xatolik yuz berdi');
    }
});

// ============ XATOLIK HANDLER ============

bot.catch((err, ctx) => {
    console.error(`❌ Error for ${ctx.updateType}:`, err);
    ctx.reply('❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.');
});

// ============ BOTNI ISHGA TUSHIRISH ============

async function startBot() {
    try {
        console.log('🚀 Bot ishga tushmoqda...');
        console.log(`📅 Sana: ${new Date().toLocaleDateString('uz-UZ')}`);
        console.log(`🌐 Environment: ${config.nodeEnv}`);
        console.log(`🤖 Bot: @${config.botUsername}`);
        console.log(`👑 Adminlar: ${config.adminIds.length} ta`);
        console.log(`🎯 Kanal: ${config.getChannelTarget() || 'Sozlanmagan'}`);
        
        // Database
        await db.init();
        console.log('✅ Database ready');
        
        // Botni ishga tushirish
        await bot.launch();
        console.log('✅ Bot started successfully!');
        console.log('===================================');
        
        // Graceful shutdown
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
        
    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

// Ishga tushirish
startBot();

module.exports = bot;