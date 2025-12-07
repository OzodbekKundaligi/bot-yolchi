const { Markup } = require('telegraf');

class MainMenuKeyboard {
    static getMainMenu() {
        return Markup.keyboard([
            ['📋 Maqsadlarim', '🪪 Profil'],
            ['🎯 Maqsadlar', 'ℹ️ Biz haqimizda']
        ]).resize();
    }

    static getGoalsMenu() {
        return Markup.keyboard([
            ['1️⃣ Maqsad yaratish', '2️⃣ Mening maqsadlarim'],
            ['3️⃣ Men qo\'shilgan maqsadlar', '4️⃣ Asosiy menyu']
        ]).resize();
    }

    static getSearchMenu() {
        return Markup.keyboard([
            ['💡 Tavsiyalar', '🔍 Kategoriya bo\'yicha qidirish'],
            ['🏠 Asosiy menyu']
        ]).resize();
    }

    static getCancelButton() {
        return Markup.keyboard([['❌ Bekor qilish']]).resize();
    }

    static getBackButton() {
        return Markup.keyboard([['⬅️ Orqaga']]).resize();
    }

    static removeKeyboard() {
        return Markup.removeKeyboard();
    }

    static getProfileEditMenu() {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('Ism', 'edit_first_name'),
                Markup.button.callback('Familiya', 'edit_last_name')
            ],
            [
                Markup.button.callback('Telefon', 'edit_phone'),
                Markup.button.callback('Jins', 'edit_gender')
            ],
            [
                Markup.button.callback('Tug\'ilgan sana', 'edit_birth_date'),
                Markup.button.callback('Joylashuv', 'edit_location')
            ],
            [
                Markup.button.callback('Bio', 'edit_bio'),
                Markup.button.callback('🏠 Asosiy menyu', 'main_menu')
            ]
        ]);
    }

    static getGenderSelection() {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('Erkak', 'gender_male'),
                Markup.button.callback('Ayol', 'gender_female')
            ],
            [Markup.button.callback('⬅️ Orqaga', 'back_to_profile_edit')]
        ]);
    }

    static getGoalActions(goalId) {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('👥 Maqsaddoshlar', `participants_${goalId}`),
                Markup.button.callback('📊 Statistikalar', `stats_${goalId}`)
            ],
            [Markup.button.callback('⬅️ Orqaga', 'back_to_my_goals')]
        ]);
    }

    static getPaginationButtons(currentPage, totalPages, prefix) {
        const buttons = [];
        
        if (currentPage > 1) {
            buttons.push(Markup.button.callback('⏮️ Oldingi', `${prefix}_page_${currentPage - 1}`));
        }
        
        if (currentPage < totalPages) {
            buttons.push(Markup.button.callback('Keyingi ⏭️', `${prefix}_page_${currentPage + 1}`));
        }
        
        buttons.push(Markup.button.callback('🏠 Asosiy menyu', 'main_menu'));
        
        return Markup.inlineKeyboard(buttons, { columns: 2 });
    }
}

module.exports = MainMenuKeyboard;