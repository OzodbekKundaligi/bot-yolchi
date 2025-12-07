const db = require('../../database/connection');
const messages = require('../../utils/messages');
const MainMenuKeyboard = require('../../keyboards/mainMenu');
const GoalCreationKeyboard = require('../../keyboards/goalCreation');
const Helpers = require('../../utils/helpers');

class JoinedGoalsHandler {
    static async handleJoinedGoals(ctx) {
        try {
            const userId = ctx.from.id;
            
            // Foydalanuvchining qatnashgan maqsadlarini olish
            const participations = await db.getUserParticipations(userId);
            
            if (participations.length === 0) {
                await ctx.reply(
                    'Siz hali hech qanday maqsadga qo\'shilmagansiz.',
                    MainMenuKeyboard.getMainMenu()
                );
                return;
            }

            // Maqsad ma'lumotlarini olish
            const joinedGoals = [];
            for (const participation of participations) {
                const goal = await db.getGoal(participation.goalId);
                if (goal) {
                    joinedGoals.push({
                        ...goal,
                        joinedAt: participation.joinedAt,
                        participationStatus: participation.status
                    });
                }
            }

            if (joinedGoals.length === 0) {
                await ctx.reply(
                    'Maqsadlar topilmadi.',
                    MainMenuKeyboard.getMainMenu()
                );
                return;
            }

            // Sahifalash
            const page = 1;
            const perPage = 10;
            const paginated = Helpers.paginate(joinedGoals, page, perPage);
            
            // Holatni saqlash
            const paginationStates = require('./myGoals').paginationStates;
            paginationStates[userId] = {
                type: 'joined_goals',
                data: joinedGoals,
                currentPage: page
            };

            await ctx.reply(
                messages.JOINED_GOALS_LIST(paginated.items, page, paginated.totalPages),
                MainMenuKeyboard.getPaginationButtons(page, paginated.totalPages, 'joined_goals')
            );

        } catch (error) {
            console.error('Joined goals error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleJoinedGoalSelection(ctx, goalNumber) {
        try {
            const userId = ctx.from.id;
            const paginationStates = require('./myGoals').paginationStates;
            const state = paginationStates[userId];
            
            if (!state || state.type !== 'joined_goals') {
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
            
            // Qo'shilgan maqsad uchun maxsus xabar
            const statusText = goal.participationStatus === 'accepted' ? '✅ Qabul qilingan' : 
                              goal.participationStatus === 'pending' ? '⏳ Kutilmoqda' : '❌ Rad etilgan';
            
            const message = `🎯 Maqsad: ${goal.name}\n\n` +
                          `📝 Tarif: ${Helpers.truncateText(goal.description, 200)}\n` +
                          `📊 Holati: ${formattedGoal.statusText}\n` +
                          `👤 Muallif: ${goal.authorName}\n` +
                          `🏷️ Kategoriya: ${goal.category}\n` +
                          `⏱️ Davomiyligi: ${formattedGoal.durationText}\n` +
                          `👥 Maqsaddoshlar: ${goal.participants || 0} ta\n` +
                          `📅 Qo'shilgan sana: ${new Date(goal.joinedAt).toLocaleDateString('uz-UZ')}\n` +
                          `📊 Sizning holatingiz: ${statusText}\n\n` +
                          `Maqsad haqida batafsil: /goal_${goal.id}`;

            await ctx.reply(message, MainMenuKeyboard.getMainMenu());

        } catch (error) {
            console.error('Joined goal selection error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleLeaveGoal(ctx, goalId) {
        try {
            const userId = ctx.from.id;
            
            // Bu yerda qatnashishni o'chirish logikasi
            // Hozircha oddiy xabar
            await ctx.reply(
                'Siz maqsaddan chiqdingiz.',
                MainMenuKeyboard.getMainMenu()
            );

        } catch (error) {
            console.error('Leave goal error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }
}

module.exports = JoinedGoalsHandler;