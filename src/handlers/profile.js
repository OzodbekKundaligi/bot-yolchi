const db = require('../database/connection');
const messages = require('../utils/messages');
const MainMenuKeyboard = require('../keyboards/mainMenu');
const Helpers = require('../utils/helpers');

// Foydalanuvchi holatlari
const userStates = {};

class ProfileHandler {
    static async handleProfile(ctx) {
        try {
            const userId = ctx.from.id;
            const user = await db.getUser(userId);
            
            if (!user) {
                await ctx.reply('Profil topilmadi. Iltimos, /start ni bosing.');
                return;
            }

            await ctx.reply(
                messages.PROFILE_INFO(user),
                MainMenuKeyboard.getProfileEditMenu()
            );

        } catch (error) {
            console.error('Profile handler error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleEditField(ctx, field) {
        try {
            const userId = ctx.from.id;
            
            // Holatni saqlash
            userStates[userId] = {
                action: `edit_${field}`,
                step: 'waiting_input'
            };

            let message = '';
            let keyboard = MainMenuKeyboard.getCancelButton();

            switch (field) {
                case 'first_name':
                    message = messages.ENTER_NAME;
                    break;
                case 'last_name':
                    message = messages.ENTER_LAST_NAME;
                    break;
                case 'phone':
                    message = messages.ENTER_PHONE;
                    break;
                case 'gender':
                    message = messages.SELECT_GENDER;
                    keyboard = MainMenuKeyboard.getGenderSelection();
                    break;
                case 'birth_date':
                    message = messages.ENTER_BIRTH_DATE;
                    break;
                case 'location':
                    message = messages.ENTER_LOCATION;
                    break;
                case 'bio':
                    message = messages.ENTER_BIO;
                    break;
            }

            await ctx.reply(message, keyboard);

        } catch (error) {
            console.error('Edit field error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleTextInput(ctx) {
        try {
            const userId = ctx.from.id;
            const text = ctx.message.text;
            const state = userStates[userId];

            if (!state || state.step !== 'waiting_input') {
                return;
            }

            let isValid = true;
            let errorMessage = '';

            switch (state.action) {
                case 'edit_first_name':
                    if (text.length < 3) {
                        isValid = false;
                        errorMessage = 'Ism kamida 3 ta harfdan iborat bo\'lishi kerak';
                    }
                    break;

                case 'edit_last_name':
                    if (text.length < 2) {
                        isValid = false;
                        errorMessage = 'Familiya kamida 2 ta harfdan iborat bo\'lishi kerak';
                    }
                    break;

                case 'edit_phone':
                    if (!Helpers.validatePhone(text)) {
                        isValid = false;
                        errorMessage = 'Telefon raqami noto\'g\'ri formatda. Iltimos, +998XXXXXXXXX formatida kiriting';
                    }
                    break;

                case 'edit_birth_date':
                    if (!Helpers.validateBirthDate(text)) {
                        isValid = false;
                        errorMessage = 'Tug\'ilgan sana noto\'g\'ri formatda. Iltimos, DD.MM.YYYY formatida kiriting';
                    }
                    break;

                case 'edit_location':
                    if (text.length < 2) {
                        isValid = false;
                        errorMessage = 'Joylashuv kamida 2 ta harfdan iborat bo\'lishi kerak';
                    }
                    break;

                case 'edit_bio':
                    if (text.length > 200) {
                        isValid = false;
                        errorMessage = 'Bio 200 ta belgidan oshmasligi kerak';
                    }
                    break;
            }

            if (!isValid) {
                await ctx.reply(errorMessage);
                return;
            }

            // Ma'lumotlarni yangilash
            const fieldMap = {
                'edit_first_name': 'first_name',
                'edit_last_name': 'last_name',
                'edit_phone': 'phone',
                'edit_birth_date': 'birth_date',
                'edit_location': 'location',
                'edit_bio': 'bio'
            };

            const field = fieldMap[state.action];
            await db.updateUser(userId, { [field]: text });

            // Holatni tozalash
            delete userStates[userId];

            await ctx.reply(
                messages.UPDATE_SUCCESS(field.replace('_', ' ')),
                MainMenuKeyboard.getMainMenu()
            );

        } catch (error) {
            console.error('Text input error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleGenderSelection(ctx, gender) {
        try {
            const userId = ctx.from.id;
            
            await db.updateUser(userId, {
                gender: gender === 'male' ? 'Erkak' : 'Ayol'
            });

            // Holatni tozalash
            delete userStates[userId];

            await ctx.reply(
                messages.UPDATE_SUCCESS('Jins'),
                MainMenuKeyboard.getMainMenu()
            );

        } catch (error) {
            console.error('Gender selection error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }

    static async handleBackToProfileEdit(ctx) {
        try {
            const userId = ctx.from.id;
            delete userStates[userId];
            
            await this.handleProfile(ctx);
            
        } catch (error) {
            console.error('Back to profile edit error:', error);
            await ctx.reply(messages.ERROR_OCCURRED);
        }
    }
}

module.exports = { ProfileHandler, userStates };