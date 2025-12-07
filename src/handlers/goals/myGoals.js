const db = require('../../database/connection');
const messages = require('../../utils/messages');
const MainMenuKeyboard = require('../../keyboards/mainMenu');
const GoalCreationKeyboard = require('../../keyboards/goalCreation');
const Helpers = require('../../utils/helpers');

// Sahifalash holatlari
const paginationStates = {};

class MyGoalsHandler {
    static async handleMyGoals(ctx) {
        try {
            const userId = ctx.from.id;
            const goals = await db.getUserGoals(userId);
            
            if (goals.length === 0) {
                await ctx.reply(
                    'Siz hali maqsad yaratmagansiz.',
                    MainMenuKeyboard.getMainMenu()
                );
                return;
            }

            // Sahifalash
            const page = 1;
            const perPage = 10;
            const paginated = Helpers.paginate(goals, page, perPage);
            
            // Holatni saqlash
            paginationStates[userId] = {
                type: 'my_goals',
                data: goals,
                currentPage: page
            };

            await ctx.reply(
                messages.MY_GOALS_LIST(paginated.items, page, paginated.totalPages),
                MainMenuKeyboard.getPaginationButtons(page, paginated.totalPages, 'my_goals')
            );

        } catch (error) {
            console.error('My goals error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleGoalSelection(ctx, goalNumber) {
        try {
            const userId = ctx.from.id;
            const state = paginationStates[userId];
            
            if (!state || state.type !== 'my_goals') {
                await ctx.reply('Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
                return;
            }

            const page = state.currentPage || 1;
            const perPage = 10;
            const startIndex = (page - 1) * perPage;
            const goalIndex = startIndex + (parseInt(goalNumber) - 1);
            
            if (goalIndex < 0 || goalIndex >= state.data.length) {
                await ctx.reply('Noto\'g\'ri raqam. Iltimos, qaytadan urinib ko\'ring.');
                return;
            }

            const goal = state.data[goalIndex];
            const formattedGoal = Helpers.formatGoalForDisplay(goal);
            
            await ctx.reply(
                messages.GOAL_DETAILS(formattedGoal),
                GoalCreationKeyboard.getGoalItemActions(goal.id)
            );

        } catch (error) {
            console.error('Goal selection error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handlePagination(ctx, page, type) {
        try {
            const userId = ctx.from.id;
            const state = paginationStates[userId];
            
            if (!state || state.type !== type) {
                return;
            }

            const perPage = 10;
            const paginated = Helpers.paginate(state.data, page, perPage);
            
            // Holatni yangilash
            state.currentPage = page;

            let message = '';
            if (type === 'my_goals') {
                message = messages.MY_GOALS_LIST(paginated.items, page, paginated.totalPages);
            } else if (type === 'joined_goals') {
                // Joined goals uchun xabar
                message = `Men qo'shilgan maqsadlar:\n\n${paginated.items.map((goal, index) => {
                    return `${(page-1)*10 + index + 1}. ${goal.name} — ${new Date(goal.joinedAt).toLocaleDateString('uz-UZ')}`;
                }).join('\n')}\n\nSahifa: ${page}/${paginated.totalPages}`;
            }

            await ctx.editMessageText(
                message,
                MainMenuKeyboard.getPaginationButtons(page, paginated.totalPages, type)
            );

        } catch (error) {
            console.error('Pagination error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleGoalAction(ctx, action, goalId) {
        try {
            const userId = ctx.from.id;
            const goal = await db.getGoal(goalId);
            
            if (!goal) {
                await ctx.reply('Maqsad topilmadi.');
                return;
            }

            // Faqat muallif amallarni bajarishi mumkin
            if (goal.authorId !== userId) {
                await ctx.reply('Siz bu maqsadning muallifi emassiz.');
                return;
            }

            switch (action) {
                case 'start':
                    await db.updateGoal(goalId, {
                        status: 'active',
                        isActive: true,
                        startDate: new Date().toISOString(),
                        endDate: Helpers.calculateEndDate(new Date(), goal.duration)
                    });
                    await ctx.reply('✅ Maqsad muvaffaqiyatli boshlandi!');
                    break;
                    
                case 'complete':
                    await db.updateGoal(goalId, {
                        status: 'completed',
                        isActive: false,
                        endDate: new Date().toISOString()
                    });
                    await ctx.reply('✅ Maqsad muvaffaqiyatli yakunlandi!');
                    break;
                    
                case 'delete':
                    // Bu yerda maqsadni o'chirish logikasi
                    // Hozircha faqat statusni o'zgartiramiz
                    await db.updateGoal(goalId, {
                        status: 'cancelled',
                        isActive: false
                    });
                    await ctx.reply('🗑️ Maqsad o\'chirildi.');
                    break;
            }

            // Orqaga qaytish
            await this.handleMyGoals(ctx);

        } catch (error) {
            console.error('Goal action error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleBackToGoalsList(ctx) {
        try {
            await this.handleMyGoals(ctx);
        } catch (error) {
            console.error('Back to goals list error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleParticipants(ctx, goalId) {
        try {
            const participants = await db.getGoalParticipants(goalId);
            
            if (participants.length === 0) {
                await ctx.reply('Hozircha maqsaddoshlar yo\'q.');
                return;
            }

            let message = `👥 Maqsaddoshlar ro'yxati:\n\n`;
            
            for (const participant of participants) {
                const user = await db.getUser(participant.userId);
                if (user) {
                    const userName = `${user.first_name} ${user.last_name || ''}`.trim();
                    const joinDate = new Date(participant.joinedAt).toLocaleDateString('uz-UZ');
                    message += `• ${userName} - ${joinDate}\n`;
                }
            }
            
            await ctx.reply(message);

        } catch (error) {
            console.error('Participants error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }
}

module.exports = { MyGoalsHandler, paginationStates };