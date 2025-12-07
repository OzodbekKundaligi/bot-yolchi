const messages = require('./messages');
const constants = require('./constants');

class Helpers {
    static paginate(array, page = 1, perPage = 10) {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const totalPages = Math.ceil(array.length / perPage);
        
        return {
            items: array.slice(start, end),
            page,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            totalItems: array.length
        };
    }

    static formatGoalForDisplay(goal) {
        return {
            ...goal,
            formattedDate: new Date(goal.createdAt).toLocaleDateString('uz-UZ'),
            statusText: this.getStatusText(goal.status),
            durationText: constants.DURATION_OPTIONS[goal.duration] || goal.duration
        };
    }

    static getStatusText(status) {
        const statusMap = {
            'pending': '⏳ Kutilmoqda',
            'active': '✅ Faol',
            'completed': '✅ Yakunlangan',
            'cancelled': '❌ Bekor qilingan'
        };
        return statusMap[status] || status;
    }

    static validateGoalName(name) {
        if (!name || name.trim().length < 3) {
            return 'Maqsad nomi kamida 3 ta belgidan iborat bo\'lishi kerak';
        }
        if (name.length > 100) {
            return 'Maqsad nomi 100 ta belgidan oshmasligi kerak';
        }
        return null;
    }

    static validateGoalDescription(description) {
        if (!description || description.trim().length < 50) {
            return 'Maqsad tarifi kamida 50 ta belgidan iborat bo\'lishi kerak';
        }
        if (description.length > 1000) {
            return 'Maqsad tarifi 1000 ta belgidan oshmasligi kerak';
        }
        return null;
    }

    static validatePhone(phone) {
        const regex = /^\+998[0-9]{9}$/;
        return regex.test(phone);
    }

    static validateBirthDate(date) {
        const regex = /^\d{2}\.\d{2}\.\d{4}$/;
        if (!regex.test(date)) return false;
        
        const [day, month, year] = date.split('.').map(Number);
        const testDate = new Date(year, month - 1, day);
        
        return testDate.getDate() === day && 
               testDate.getMonth() === month - 1 && 
               testDate.getFullYear() === year;
    }

    static generateGoalId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static calculateEndDate(startDate, duration) {
        if (!startDate) return null;
        
        const endDate = new Date(startDate);
        if (duration === 'custom') {
            return null; // Custom duration
        }
        
        endDate.setDate(endDate.getDate() + parseInt(duration));
        return endDate.toISOString();
    }

    static formatDuration(duration) {
        return constants.DURATION_OPTIONS[duration] || duration;
    }

    static truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
}

module.exports = Helpers;