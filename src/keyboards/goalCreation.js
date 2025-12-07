const { Markup } = require('telegraf');
const constants = require('../utils/constants');

class GoalCreationKeyboard {
    static getDurationButtons() {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('7 kun', 'duration_7'),
                Markup.button.callback('17 kun', 'duration_17'),
                Markup.button.callback('21 kun', 'duration_21')
            ],
            [
                Markup.button.callback('28 kun', 'duration_28'),
                Markup.button.callback('Maqsad tugaguncha', 'duration_custom')
            ],
            [Markup.button.callback('❌ Bekor qilish', 'cancel_goal_creation')]
        ]);
    }

    static getCategoryButtons() {
        const buttons = [];
        const categories = constants.CATEGORIES;
        
        // Har bir qatorda 3 ta kategoriya
        for (let i = 0; i < categories.length; i += 3) {
            const row = categories.slice(i, i + 3).map(category => 
                Markup.button.callback(category, `category_${category}`)
            );
            buttons.push(row);
        }
        
        buttons.push([Markup.button.callback('❌ Bekor qilish', 'cancel_goal_creation')]);
        
        return Markup.inlineKeyboard(buttons);
    }

    static getPublishConfirmation() {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('✅ Ha', 'publish_yes'),
                Markup.button.callback('❌ Yo\'q', 'publish_no')
            ]
        ]);
    }

    static getGoalApproval(goalId) {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('✅ Tasdiqlash', `approve_${goalId}`),
                Markup.button.callback('❌ Rad etish', `reject_${goalId}`)
            ]
        ]);
    }

    static getGoalItemActions(goalId) {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('✅ Boshlash', `start_goal_${goalId}`),
                Markup.button.callback('✅ Yakunlash', `complete_goal_${goalId}`)
            ],
            [
                Markup.button.callback('✏️ Tahrirlash', `edit_goal_${goalId}`),
                Markup.button.callback('🗑️ O\'chirish', `delete_goal_${goalId}`)
            ],
            [Markup.button.callback('⬅️ Orqaga', 'back_to_goals_list')]
        ]);
    }

    static getJoinConfirmation(goalId) {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('✅ Qo\'shilish', `join_confirm_${goalId}`),
                Markup.button.callback('❌ Bekor qilish', 'cancel_join')
            ]
        ]);
    }

    static getRecommendationActions(recId) {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('👍', `like_rec_${recId}`),
                Markup.button.callback('👎', `dislike_rec_${recId}`)
            ],
            [
                Markup.button.callback('➕ Ishtirok etish', `join_rec_${recId}`),
                Markup.button.callback('🏠 Asosiy menyu', 'main_menu')
            ]
        ]);
    }
}

module.exports = GoalCreationKeyboard;