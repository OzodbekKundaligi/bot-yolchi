module.exports = {
    // Start messages
    WELCOME: (name) => `Xush kelibsiz, ${name}! 👋\nSiz Yolchi platformasiga muvaffaqiyatli ulandingiz.\n\nAsosiy menyudan foydalanishingiz mumkin:`,

    // Main menu
    MAIN_MENU: `Asosiy menyu:\n\n📋 Maqsadlarim\n🪪 Profil\n🎯 Maqsadlar\nℹ️ Biz haqimizda`,

    // Goals menu
    GOALS_MENU: `Maqsadlar menyusi:\n1. Maqsad yaratish\n2. Mening maqsadlarim\n3. Men qo'shilgan maqsadlar\n4. Asosiy menyu`,

    // Profile messages
    PROFILE_INFO: (user) => `👤 Ism: ${user.first_name || '—'}\n🏷 Familiya: ${user.last_name || '—'}\n🚹 Jins: ${user.gender || '—'}\n📞 Telefon: ${user.phone || '—'}\n🎂 Tug'ilgan sana: ${user.birth_date || '—'}\n📍 Joylashuv: ${user.location || '—'}\n💬 Bio: ${user.bio || '—'}\n💎 Olmos: ${user.diamonds || 0}`,

    // Goal creation messages
    ENTER_GOAL_NAME: `Maqsadingiz nomini kiriting:`,
    ENTER_GOAL_DESCRIPTION: `Maqsadingiz haqida yozing ✍️\n(Kamida 50 ta belgi)`,
    DESCRIPTION_TOO_SHORT: `Tarif juda ham qisqa. Kamida 50 ta belgi kiriting.`,
    SELECT_DURATION: `Maqsad necha kun davom etadi? ⏱️`,
    SELECT_CATEGORY: `Maqsad kategoriyasini tanlang 🎯`,
    GOAL_CREATED: (goalName) => `🎯 "${goalName}" maqsadi yaratildi!\nHozircha tekshiruv jarayonida.\nTasdiqlangach, kanalga joylashni xohlaysizmi?`,
    GOAL_NOT_PUBLISHED: `Maqsadingiz muvaffaqiyatli yaratildi. Biroq kanalga joylanmaydi.`,

    // My goals messages
    MY_GOALS_LIST: (goals, page, totalPages) => `📋 Mening maqsadlarim\n\n${goals.map((goal, index) => `${(page-1)*10 + index + 1}. ${goal.name} — ${new Date(goal.createdAt).toLocaleDateString('uz-UZ')}`).join('\n')}\n\nSahifa: ${page}/${totalPages}\nKerakli maqsadni ko'rish uchun mos raqamni tanlang:`,
    GOAL_DETAILS: (goal) => {
        const startDate = goal.startDate ? new Date(goal.startDate).toLocaleDateString('uz-UZ') : '—';
        const endDate = goal.endDate ? new Date(goal.endDate).toLocaleDateString('uz-UZ') : '—';
        const createdDate = new Date(goal.createdAt).toLocaleDateString('uz-UZ');
        
        return `🎯 Maqsad: ${goal.name}\n\n📝 Tarif: ${goal.description}\n📊 Holati: ${goal.status === 'pending' ? '⏳ Kutilmoqda' : goal.status === 'active' ? '✅ Faol' : '✅ Yakunlangan'}\n🚀 Boshlangan: ${goal.isActive ? '✅' : '❌'}\n⏱️ Davomiyligi: ${goal.duration} kun\n🏁 Yakunlangan: ${goal.status === 'completed' ? '✅' : '❌'}\n📅 Boshlanish sanasi: ${startDate}\n📝 Yaratilgan: ${createdDate}\n👤 Muallif: ${goal.authorName}\n👥 Maqsaddoshlar: ${goal.participants || 0} ta\n🏷️ Kategoriya: ${goal.category}`;
    },

    // Joined goals messages
    JOINED_GOALS_LIST: (goals, page, totalPages) => `Men qo'shilgan maqsadlar:\n\n${goals.map((goal, index) => `${(page-1)*10 + index + 1}. ${goal.name} — ${new Date(goal.joinedAt).toLocaleDateString('uz-UZ')}`).join('\n')}\n\nSahifa: ${page}/${totalPages}`,

    // Search messages
    RECOMMENDATIONS_MENU: `💡 Tavsiyalar\nKategoriya bo'yicha qidirish\nAsosiy menyu`,
    RECOMMENDATION_ITEM: (rec, index, total) => `🎯 ${index + 1}/${total}\n\nNomi: ${rec.title}\nMuallif: ${rec.authorName}\nKategoriya: ${rec.category}\nBoshlanish: ${new Date(rec.startDate).toLocaleDateString('uz-UZ')}\nDavomiylik: ${rec.duration} kun\n\n👍 ${rec.likes} | 👎 ${rec.dislikes}`,
    NO_GOALS_IN_CATEGORY: `Bu kategoriyada maqsad topilmadi.`,
    SELECT_CATEGORY_FOR_SEARCH: `Qidirish uchun kategoriyani tanlang:`,

    // About message
    ABOUT_TEXT: `🤖 Yolchi Platformasi\n\nYolchi — bu maqsadlaringizni belgilash, ularga erishish va boshqalar bilan baham ko'rish uchun mo'ljallangan platforma.\n\n✨ Xususiyatlari:\n✅ Maqsad yaratish va boshqarish\n✅ Boshqalarning maqsadlariga qo'shilish\n✅ Kategoriyalar bo'yicha qidirish\n✅ Profil va statistikalar\n\n📞 Aloqa: @yolchi_support\n🌐 Veb sayt: https://yolchi.uz\n\nBiz bilan birga o'z maqsadlaringizga erishing! 🚀`,

    // Profile edit messages
    ENTER_NAME: `Yangi ismingizni kiriting (kamida 3 harf):`,
    ENTER_LAST_NAME: `Yangi familiyangizni kiriting:`,
    ENTER_PHONE: `Telefon raqamingizni kiriting (+998XXXXXXXXX formatida):`,
    SELECT_GENDER: `Jinsingizni tanlang:`,
    ENTER_BIRTH_DATE: `Tug'ilgan sanangizni kiriting (DD.MM.YYYY formatida):`,
    ENTER_LOCATION: `Joylashuvingizni kiriting:`,
    ENTER_BIO: `Bio ma'lumotingizni kiriting (maksimum 200 belgi):`,
    UPDATE_SUCCESS: (field) => `${field} muvaffaqiyatli yangilandi!`,

    // Error messages
    ERROR_OCCURRED: `Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.`,
    INVALID_INPUT: `Noto'g'ri kiritilgan ma'lumot. Iltimos, qaytadan urinib ko'ring.`,
    NOT_FOUND: `Ma'lumot topilmadi.`,
    ACCESS_DENIED: `Sizga ruxsat berilmagan.`,

    // Success messages
    SUCCESS: `Muvaffaqiyatli bajarildi! ✅`,
    JOIN_REQUEST_SENT: `Qo'shilish so'rovingiz yuborildi. Maqsad egasi tasdiqlagandan so'ng siz qo'shilasiz.`,
    LIKE_RECORDED: `Siz bu tavsiyani yoqtirdingiz 👍`,
    DISLIKE_RECORDED: `Siz bu tavsiyani yoqtirmadingiz 👎`
};