const Helpers = require('./helpers');

class Validators {
    static validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static validateUsername(username) {
        if (!username || username.length < 3) {
            return 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo\'lishi kerak';
        }
        if (username.length > 20) {
            return 'Foydalanuvchi nomi 20 ta belgidan oshmasligi kerak';
        }
        const regex = /^[a-zA-Z0-9_]+$/;
        if (!regex.test(username)) {
            return 'Foydalanuvchi nomi faqat harflar, raqamlar va pastki chiziqdan iborat bo\'lishi kerak';
        }
        return null;
    }

    static validatePassword(password) {
        if (!password || password.length < 6) {
            return 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak';
        }
        return null;
    }

    static validateGoal(goalData) {
        const errors = [];
        
        // Nomni tekshirish
        const nameError = Helpers.validateGoalName(goalData.name);
        if (nameError) errors.push(nameError);
        
        // Tarifni tekshirish
        const descError = Helpers.validateGoalDescription(goalData.description);
        if (descError) errors.push(descError);
        
        // Davomiylikni tekshirish
        if (!goalData.duration) {
            errors.push('Davomiylik tanlanishi kerak');
        }
        
        // Kategoriyani tekshirish
        if (!goalData.category) {
            errors.push('Kategoriya tanlanishi kerak');
        }
        
        return errors.length > 0 ? errors : null;
    }

    static validateUserUpdate(userData) {
        const errors = [];
        
        if (userData.first_name && userData.first_name.length < 3) {
            errors.push('Ism kamida 3 ta harfdan iborat bo\'lishi kerak');
        }
        
        if (userData.phone && !Helpers.validatePhone(userData.phone)) {
            errors.push('Telefon raqami noto\'g\'ri formatda');
        }
        
        if (userData.birth_date && !Helpers.validateBirthDate(userData.birth_date)) {
            errors.push('Tug\'ilgan sana noto\'g\'ri formatda');
        }
        
        if (userData.bio && userData.bio.length > 200) {
            errors.push('Bio 200 ta belgidan oshmasligi kerak');
        }
        
        return errors.length > 0 ? errors : null;
    }

    static validateParticipation(userId, goalId) {
        if (!userId || !goalId) {
            return 'Foydalanuvchi ID yoki maqsad ID si noto\'g\'ri';
        }
        return null;
    }

    static validateCategory(category) {
        const categories = require('./constants').CATEGORIES;
        if (!categories.includes(category)) {
            return 'Noto\'g\'ri kategoriya';
        }
        return null;
    }

    static validateDuration(duration) {
        const durations = ['7', '17', '21', '28', 'custom'];
        if (!durations.includes(duration)) {
            return 'Noto\'g\'ri davomiylik';
        }
        return null;
    }

    static sanitizeText(text, maxLength = 1000) {
        if (!text) return '';
        
        // HTML taglarni tozalash
        let sanitized = text
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        
        // Ortiqcha bo'sh joylarni olib tashlash
        sanitized = sanitized.replace(/\s+/g, ' ').trim();
        
        // Uzunligini cheklash
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength) + '...';
        }
        
        return sanitized;
    }

    static isAdmin(userId) {
        const config = require('../config/bot.config');
        return config.adminIds.includes(userId.toString());
    }

    static validatePageNumber(page) {
        const pageNum = parseInt(page);
        if (isNaN(pageNum) || pageNum < 1) {
            return 1;
        }
        return pageNum;
    }

    static validateLimit(limit) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return 10;
        }
        return limitNum;
    }
}

module.exports = Validators;