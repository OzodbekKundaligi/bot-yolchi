const db = require('../../database/connection');
const messages = require('../../utils/messages');
const MainMenuKeyboard = require('../../keyboards/mainMenu');
const GoalCreationKeyboard = require('../../keyboards/goalCreation');
const Helpers = require('../../utils/helpers');
const config = require('../../config/bot.config');

// Maqsad yaratish holatlari
const goalCreationStates = {};

class CreateGoalHandler {
    static async handleCreateGoal(ctx) {
        try {
            const userId = ctx.from.id;
            
            // Holatni boshlash
            goalCreationStates[userId] = {
                step: 'waiting_name',
                data: {}
            };

            await ctx.reply(
                messages.ENTER_GOAL_NAME,
                MainMenuKeyboard.getCancelButton()
            );

        } catch (error) {
            console.error('Create goal init error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleGoalName(ctx) {
        try {
            const userId = ctx.from.id;
            const state = goalCreationStates[userId];
            const goalName = ctx.message.text.trim();

            if (!state || state.step !== 'waiting_name') {
                return;
            }

            // Nomni tekshirish
            const validationError = Helpers.validateGoalName(goalName);
            if (validationError) {
                await ctx.reply(validationError);
                return;
            }

            // Holatni yangilash
            state.step = 'waiting_description';
            state.data.name = goalName;

            await ctx.reply(
                messages.ENTER_GOAL_DESCRIPTION,
                MainMenuKeyboard.getCancelButton()
            );

        } catch (error) {
            console.error('Goal name error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleGoalDescription(ctx) {
        try {
            const userId = ctx.from.id;
            const state = goalCreationStates[userId];
            const description = ctx.message.text.trim();

            if (!state || state.step !== 'waiting_description') {
                return;
            }

            // Tarifni tekshirish
            const validationError = Helpers.validateGoalDescription(description);
            if (validationError) {
                await ctx.reply(validationError);
                return;
            }

            // Holatni yangilash
            state.step = 'waiting_duration';
            state.data.description = description;

            await ctx.reply(
                messages.SELECT_DURATION,
                GoalCreationKeyboard.getDurationButtons()
            );

        } catch (error) {
            console.error('Goal description error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleDurationSelection(ctx, duration) {
        try {
            const userId = ctx.from.id;
            const state = goalCreationStates[userId];

            if (!state || state.step !== 'waiting_duration') {
                return;
            }

            // Holatni yangilash
            state.step = 'waiting_category';
            state.data.duration = duration;

            await ctx.reply(
                messages.SELECT_CATEGORY,
                GoalCreationKeyboard.getCategoryButtons()
            );

        } catch (error) {
            console.error('Duration selection error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleCategorySelection(ctx, category) {
        try {
            const userId = ctx.from.id;
            const state = goalCreationStates[userId];
            const user = await db.getUser(userId);

            if (!state || state.step !== 'waiting_category') {
                return;
            }

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
                messages.GOAL_CREATED(goal.name),
                GoalCreationKeyboard.getPublishConfirmation()
            );

        } catch (error) {
            console.error('Category selection error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handlePublishDecision(ctx, decision) {
        try {
            const userId = ctx.from.id;
            
            if (decision === 'no') {
                await ctx.reply(
                    messages.GOAL_NOT_PUBLISHED,
                    MainMenuKeyboard.getMainMenu()
                );
                return;
            }

            // Agar "Ha" tanlansa, adminlarga xabar yuborish
            const adminIds = config.adminIds;
            const lastGoal = await db.getUserGoals(userId);
            const goal = lastGoal[lastGoal.length - 1];

            if (goal) {
                for (const adminId of adminIds) {
                    try {
                        await ctx.telegram.sendMessage(
                            adminId,
                            `🆕 Yangi maqsad yaratildi!\n\n` +
                            `Nomi: ${goal.name}\n` +
                            `Muallif: ${goal.authorName}\n` +
                            `Kategoriya: ${goal.category}\n` +
                            `Davomiylik: ${Helpers.formatDuration(goal.duration)}\n\n` +
                            `Tarif: ${Helpers.truncateText(goal.description, 200)}`,
                            GoalCreationKeyboard.getGoalApproval(goal.id)
                        );
                    } catch (error) {
                        console.error(`Failed to send to admin ${adminId}:`, error);
                    }
                }
            }

            await ctx.reply(
                'Maqsadingiz adminlarga yuborildi. Tasdiqlash kutilmoqda...',
                MainMenuKeyboard.getMainMenu()
            );

        } catch (error) {
            console.error('Publish decision error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleCancelGoalCreation(ctx) {
        try {
            const userId = ctx.from.id;
            delete goalCreationStates[userId];
            
            await ctx.reply(
                'Maqsad yaratish bekor qilindi.',
                MainMenuKeyboard.getMainMenu()
            );

        } catch (error) {
            console.error('Cancel goal creation error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }
}

module.exports = { CreateGoalHandler, goalCreationStates };