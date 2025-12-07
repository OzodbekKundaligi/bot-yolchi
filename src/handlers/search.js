const db = require('../database/connection');
const MainMenuKeyboard = require('../keyboards/mainMenu');
const GoalCreationKeyboard = require('../keyboards/goalCreation');
const Helpers = require('../utils/helpers');
const constants = require('../utils/constants');

// Tavsiyalar holatlari
const searchStates = {};

class SearchHandler {
    static async handleSearchMenu(ctx) {
        try {
            await ctx.reply(
                'Qidirish menyusi:\n\n💡 Tavsiyalar\n🔍 Kategoriya bo\'yicha qidirish\n🏠 Asosiy menyu',
                MainMenuKeyboard.getSearchMenu()
            );
        } catch (error) {
            console.error('Search menu error:', error);
            await ctx.reply('Xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.');
        }
    }

    static async handleRecommendations(ctx) {
        try {
            // Database funksiyalari mavjudligini tekshirish
            if (!db.getRecommendations) {
                await ctx.reply('Tavsiyalar tizimi hozircha ishga tushirilmagan.');
                return;
            }

            const recommendations = await db.getRecommendations(10);
            
            if (recommendations.length === 0) {
                // Agar tavsiyalar yo'q bo'lsa, oddiy maqsadlardan ko'rsatamiz
                const publishedGoals = await db.getPublishedGoals();
                
                if (publishedGoals.length === 0) {
                    await ctx.reply(
                        'Hozircha tavsiyalar mavjud emas.',
                        MainMenuKeyboard.getSearchMenu()
                    );
                    return;
                }

                // Tavsiya sifatida ko'rsatish
                const page = 1;
                searchStates[ctx.from.id] = {
                    type: 'recommendations',
                    data: publishedGoals.slice(0, 10),
                    currentPage: page
                };

                await this.showRecommendationPage(ctx, page);
                return;
            }

            searchStates[ctx.from.id] = {
                type: 'recommendations',
                data: recommendations,
                currentPage: 1
            };

            await this.showRecommendationPage(ctx, 1);

        } catch (error) {
            console.error('Recommendations error:', error);
            await ctx.reply('Xatolik yuz berdi.');
        }
    }

    static async showRecommendationPage(ctx, page) {
        try {
            const userId = ctx.from.id;
            const state = searchStates[userId];
            
            if (!state || state.type !== 'recommendations') {
                return;
            }

            const perPage = 1; // Har sahifada 1 ta tavsiya
            const startIndex = (page - 1) * perPage;
            
            if (startIndex >= state.data.length) {
                await ctx.reply('Barcha tavsiyalarni ko\'rib chiqdingiz.', MainMenuKeyboard.getSearchMenu());
                return;
            }

            const recommendation = state.data[startIndex];
            const totalPages = Math.ceil(state.data.length / perPage);

            let message = '';
            if (recommendation.title) {
                // Tavsiya obyekti
                message = `🎯 ${startIndex + 1}/${state.data.length}\n\n` +
                         `Nomi: ${recommendation.title}\n` +
                         `Muallif: ${recommendation.authorName || 'Noma\'lum'}\n` +
                         `Kategoriya: ${recommendation.category}\n` +
                         `Boshlanish: ${new Date(recommendation.startDate || recommendation.createdAt).toLocaleDateString('uz-UZ')}\n` +
                         `Davomiylik: ${recommendation.duration} kun\n\n` +
                         `👍 ${recommendation.likes || 0} | 👎 ${recommendation.dislikes || 0}`;
            } else {
                // Maqsad obyekti
                message = `🎯 ${startIndex + 1}/${state.data.length}\n\n` +
                         `Nomi: ${recommendation.name}\n` +
                         `Muallif: ${recommendation.authorName}\n` +
                         `Kategoriya: ${recommendation.category}\n` +
                         `Davomiylik: ${Helpers.formatDuration ? Helpers.formatDuration(recommendation.duration) : recommendation.duration + ' kun'}\n` +
                         `👥 Ishtirokchilar: ${recommendation.participants || 0} ta\n\n` +
                         `📝 ${Helpers.truncateText ? Helpers.truncateText(recommendation.description, 150) : recommendation.description.substring(0, 150) + '...'}\n\n` +
                         `👍 ${recommendation.likes || 0} | 👎 ${recommendation.dislikes || 0}`;
            }

            await ctx.reply(
                message,
                GoalCreationKeyboard.getRecommendationActions(recommendation.id)
            );

        } catch (error) {
            console.error('Show recommendation error:', error);
            await ctx.reply('Xatolik yuz berdi.');
        }
    }

    static async handleCategorySearch(ctx) {
        try {
            const categories = constants.CATEGORIES || [
                'Biznes', 'Karyera', 'Ta\'lim', 'Do\'stlar', 'Sog\'lom hayot',
                'Qiziqishlar', 'Til o\'rganish', 'Zamonaviy kasblar',
                'Shaxsiy rivojlanish', 'Kitobxonlik', 'Talaba', 'Sayohat', 'Sport'
            ];
            
            const buttons = [];
            
            // Har bir qatorda 2 ta kategoriya
            for (let i = 0; i < categories.length; i += 2) {
                const row = categories.slice(i, i + 2).map(category => 
                    `${category}`
                );
                buttons.push(row);
            }
            
            buttons.push(['🏠 Asosiy menyu']);

            await ctx.reply(
                'Qidirish uchun kategoriyani tanlang:',
                {
                    reply_markup: {
                        keyboard: buttons,
                        resize_keyboard: true
                    }
                }
            );

        } catch (error) {
            console.error('Category search error:', error);
            await ctx.reply('Xatolik yuz berdi.');
        }
    }

    static async handleCategorySelection(ctx, category) {
        try {
            if (!db.getGoalsByCategory) {
                await ctx.reply('Bu funksiya hozircha mavjud emas.');
                return;
            }

            const goals = await db.getGoalsByCategory(category);
            
            if (goals.length === 0) {
                await ctx.reply(
                    'Bu kategoriyada maqsad topilmadi.',
                    MainMenuKeyboard.getSearchMenu()
                );
                return;
            }

            searchStates[ctx.from.id] = {
                type: 'category_goals',
                data: goals,
                category: category,
                currentPage: 1
            };

            await this.showCategoryGoalsPage(ctx, 1);

        } catch (error) {
            console.error('Category selection error:', error);
            await ctx.reply('Xatolik yuz berdi.');
        }
    }

    static async showCategoryGoalsPage(ctx, page) {
        try {
            const userId = ctx.from.id;
            const state = searchStates[userId];
            
            if (!state || state.type !== 'category_goals') {
                return;
            }

            const perPage = 5;
            
            // Oddiy sahifalash funksiyasi
            const paginate = (array, page, perPage) => {
                const start = (page - 1) * perPage;
                const end = start + perPage;
                const totalPages = Math.ceil(array.length / perPage);
                
                return {
                    items: array.slice(start, end),
                    totalPages: totalPages
                };
            };
            
            const paginated = paginate(state.data, page, perPage);
            state.currentPage = page;

            let message = `🔍 "${state.category}" kategoriyasidagi maqsadlar\n\n`;
            
            paginated.items.forEach((goal, index) => {
                const num = (page - 1) * perPage + index + 1;
                const authorName = goal.authorName || 'Noma\'lum';
                const description = goal.description || '';
                const shortDesc = description.length > 60 ? description.substring(0, 60) + '...' : description;
                
                message += `${num}. ${goal.name}\n`;
                message += `   👤 ${authorName} | 👥 ${goal.participants || 0} ta\n`;
                message += `   📅 ${new Date(goal.createdAt).toLocaleDateString('uz-UZ')}\n`;
                message += `   📝 ${shortDesc}\n\n`;
            });

            message += `\nSahifa: ${page}/${paginated.totalPages}`;
            message += `\nMaqsadni tanlash uchun raqamini yozing (1-${paginated.items.length})`;

            await ctx.reply(
                message,
                MainMenuKeyboard.getPaginationButtons(page, paginated.totalPages, 'category_goals')
            );

        } catch (error) {
            console.error('Show category goals error:', error);
            await ctx.reply('Xatolik yuz berdi.');
        }
    }

    static async handleLikeDislike(ctx, action, recId) {
        try {
            const userId = ctx.from.id;
            
            if (action === 'like') {
                // Like qo'shish
                if (db.updateRecommendation) {
                    const rec = await db.getRecommendation(recId);
                    if (rec) {
                        await db.updateRecommendation(recId, {
                            likes: (rec.likes || 0) + 1
                        });
                    }
                }
                
                // Goal ni update qilish
                const goal = await db.getGoal(recId);
                if (goal) {
                    await db.updateGoal(recId, {
                        likes: (goal.likes || 0) + 1
                    });
                }
                
                await ctx.reply('Siz bu tavsiyani yoqtirdingiz 👍');
            } else if (action === 'dislike') {
                // Dislike qo'shish
                if (db.updateRecommendation) {
                    const rec = await db.getRecommendation(recId);
                    if (rec) {
                        await db.updateRecommendation(recId, {
                            dislikes: (rec.dislikes || 0) + 1
                        });
                    }
                }
                
                // Goal ni update qilish
                const goal = await db.getGoal(recId);
                if (goal) {
                    await db.updateGoal(recId, {
                        dislikes: (goal.dislikes || 0) + 1
                    });
                }
                
                await ctx.reply('Siz bu tavsiyani yoqtirmadingiz 👎');
            }

            // Keyingi tavsiyaga o'tish
            const state = searchStates[userId];
            if (state && state.type === 'recommendations') {
                await this.showRecommendationPage(ctx, state.currentPage);
            }

        } catch (error) {
            console.error('Like/dislike error:', error);
            await ctx.reply('Xatolik yuz berdi.');
        }
    }

    static async handleJoinRecommendation(ctx, recId) {
        try {
            const userId = ctx.from.id;
            const user = await db.getUser(userId);
            
            // Maqsadni olish
            const goal = await db.getGoal(recId);
            if (!goal) {
                await ctx.reply('Maqsad topilmadi.');
                return;
            }

            // Qo'shilish so'rovini yuborish
            const participation = await db.joinGoal(userId, recId);
            
            // Maqsad egasiga xabar yuborish
            const author = await db.getUser(goal.authorId);
            if (author) {
                const userName = `${user.first_name} ${user.last_name || ''}`.trim();
                try {
                    await ctx.telegram.sendMessage(
                        author.id,
                        `👤 ${userName} sizning "${goal.name}" maqsadingizga qo'shilmoqchi.\n\n` +
                        `Qabul qilish yoki rad etish uchun tugmalardan foydalaning.`,
                        GoalCreationKeyboard.getGoalApproval(recId)
                    );
                } catch (error) {
                    console.error('Failed to send notification to author:', error);
                }
            }

            await ctx.reply(
                'Qo\'shilish so\'rovingiz yuborildi. Maqsad egasi tasdiqlagandan so\'ng siz qo\'shilasiz.',
                MainMenuKeyboard.getMainMenu()
            );

        } catch (error) {
            console.error('Join recommendation error:', error);
            await ctx.reply('Xatolik yuz berdi.');
        }
    }

    static async handlePagination(ctx, page, type) {
        try {
            const userId = ctx.from.id;
            const state = searchStates[userId];
            
            if (!state || state.type !== type) {
                return;
            }

            if (type === 'category_goals') {
                await this.showCategoryGoalsPage(ctx, page);
            } else if (type === 'recommendations') {
                await this.showRecommendationPage(ctx, page);
            }

        } catch (error) {
            console.error('Pagination error:', error);
            await ctx.reply('Xatolik yuz berdi.');
        }
    }
}

// Export qilish - FAKAT SearchHandler ni export qilamiz
module.exports = SearchHandler;