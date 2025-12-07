const db = require('../../database/connection');
const MainMenuKeyboard = require('../../keyboards/mainMenu');
const GoalCreationKeyboard = require('../../keyboards/goalCreation');
const config = require('../../config/bot.config');

// Maqsad yaratish holatlari
const goalCreationStates = {};

class CreateGoalHandler {
    static async handleCreateGoal(ctx) {
        try {
            const userId = ctx.from.id;
            
            goalCreationStates[userId] = {
                step: 'waiting_name',
                data: {}
            };

            await ctx.reply(
                '🎯 Maqsadingiz nomini kiriting:',
                MainMenuKeyboard.getCancelButton()
            );

        } catch (error) {
            console.error('Create goal init error:', error);
            await ctx.reply('❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.');
        }
    }

    static async handleGoalName(ctx) {
        try {
            const userId = ctx.from.id;
            const state = goalCreationStates[userId];
            const goalName = ctx.message.text.trim();

            if (!state || state.step !== 'waiting_name') return;

            // Soddalashtirilgan validatsiya
            if (goalName.length < 3) {
                await ctx.reply('❌ Maqsad nomi juda qisqa. Kamida 3 ta belgi kiriting.');
                return;
            }

            if (goalName.length > 100) {
                await ctx.reply('❌ Maqsad nomi juda uzun. Maksimum 100 ta belgi.');
                return;
            }

            state.step = 'waiting_description';
            state.data.name = goalName;

            await ctx.reply(
                '📝 Maqsadingiz haqida batafsil yozing (kamida 20 ta belgi):',
                MainMenuKeyboard.getCancelButton()
            );

        } catch (error) {
            console.error('Goal name error:', error);
            await ctx.reply('❌ Xatolik yuz berdi.');
        }
    }

    static async handleGoalDescription(ctx) {
        try {
            const userId = ctx.from.id;
            const state = goalCreationStates[userId];
            const description = ctx.message.text.trim();

            if (!state || state.step !== 'waiting_description') return;

            // Soddalashtirilgan validatsiya
            if (description.length < 20) {
                await ctx.reply('❌ Tarif juda qisqa. Kamida 20 ta belgi kiriting.');
                return;
            }

            if (description.length > 2000) {
                await ctx.reply('❌ Tarif juda uzun. Maksimum 2000 ta belgi.');
                return;
            }

            state.step = 'waiting_duration';
            state.data.description = description;

            await ctx.reply(
                '⏱️ Maqsad necha kun davom etadi?',
                GoalCreationKeyboard.getDurationButtons()
            );

        } catch (error) {
            console.error('Goal description error:', error);
            await ctx.reply('❌ Xatolik yuz berdi.');
        }
    }

    static async handleDurationSelection(ctx, duration) {
        try {
            const userId = ctx.from.id;
            const state = goalCreationStates[userId];

            if (!state || state.step !== 'waiting_duration') return;

            state.step = 'waiting_category';
            state.data.duration = duration;

            await ctx.reply(
                '🏷️ Maqsad kategoriyasini tanlang:',
                GoalCreationKeyboard.getCategoryButtons()
            );

        } catch (error) {
            console.error('Duration selection error:', error);
            await ctx.reply('❌ Xatolik yuz berdi.');
        }
    }

    static async handleCategorySelection(ctx, category) {
        try {
            const userId = ctx.from.id;
            const state = goalCreationStates[userId];
            const user = await db.getUser(userId);

            if (!state || state.step !== 'waiting_category') return;

            // Maqsadni saqlash
            const goalData = {
                ...state.data,
                category: category,
                authorId: userId,
                authorName: `${user.first_name} ${user.last_name || ''}`.trim(),
                status: 'pending'
            };

            const goal = await db.createGoal(goalData);

            // Holatni tozalash
            delete goalCreationStates[userId];

            await ctx.reply(
                `🎉 "${goal.name}" maqsadi yaratildi!\n\n` +
                `Hozircha tekshiruv jarayonida.\n` +
                `Admin tasdiqlagandan so'ng kanalga joylansinmi?`,
                GoalCreationKeyboard.getPublishConfirmation()
            );

        } catch (error) {
            console.error('Category selection error:', error);
            await ctx.reply('❌ Xatolik yuz berdi.');
        }
    }

    static async handlePublishDecision(ctx, decision) {
        try {
            const userId = ctx.from.id;
            
            if (decision === 'no') {
                await ctx.reply(
                    '✅ Maqsadingiz saqlandi, lekan kanalga joylanmaydi.',
                    MainMenuKeyboard.getMainMenu()
                );
                return;
            }

            // "Ha" tanlansa - adminlarga xabar
            const lastGoal = (await db.getUserGoals(userId)).pop();
            if (!lastGoal) {
                await ctx.reply('❌ Maqsad topilmadi.');
                return;
            }

            console.log(`📨 Sending to admins: ${lastGoal.name}`);
            
            // Adminlarga yuborish
            for (const adminId of config.adminIds) {
                try {
                    await ctx.telegram.sendMessage(
                        adminId,
                        `🆕 YANGI MAQSAD\n\n` +
                        `Nomi: ${lastGoal.name}\n` +
                        `Muallif: ${lastGoal.authorName}\n` +
                        `Kategoriya: ${lastGoal.category}\n` +
                        `Davomiylik: ${lastGoal.duration} kun\n\n` +
                        `Tasdiqlash yoki rad etish uchun pastdagi tugmalardan foydalaning.`,
                        GoalCreationKeyboard.getGoalApproval(lastGoal.id)
                    );
                    console.log(`✅ Sent to admin: ${adminId}`);
                } catch (error) {
                    console.error(`❌ Failed to send to admin ${adminId}:`, error);
                }
            }

            await ctx.reply(
                '📬 Maqsadingiz adminlarga yuborildi. Tasdiqlashni kuting...',
                MainMenuKeyboard.getMainMenu()
            );

        } catch (error) {
            console.error('Publish decision error:', error);
            await ctx.reply('❌ Xatolik yuz berdi.');
        }
    }

    static async handleCancelGoalCreation(ctx) {
        try {
            const userId = ctx.from.id;
            delete goalCreationStates[userId];
            
            await ctx.reply(
                '❌ Maqsad yaratish bekor qilindi.',
                MainMenuKeyboard.getMainMenu()
            );

        } catch (error) {
            console.error('Cancel goal creation error:', error);
            await ctx.reply('❌ Xatolik yuz berdi.');
        }
    }
}

module.exports = { CreateGoalHandler, goalCreationStates };