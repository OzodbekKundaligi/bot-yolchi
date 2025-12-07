const db = require('../database/connection');
const MainMenuKeyboard = require('../keyboards/mainMenu');
const GoalCreationKeyboard = require('../keyboards/goalCreation');
const config = require('../config/bot.config');
const Helpers = require('../utils/helpers');

class AdminHandler {
    static async handleGoalApproval(ctx, action, goalId) {
        try {
            const adminId = ctx.from.id;
            
            // Adminligini tekshirish
            if (!config.adminIds.includes(adminId.toString())) {
                await ctx.reply('Siz admin emassiz.');
                return;
            }

            const goal = await db.getGoal(goalId);
            if (!goal) {
                await ctx.reply('Maqsad topilmadi.');
                return;
            }

            if (action === 'approve') {
                // 1. Maqsadni tasdiqlash
                await db.updateGoal(goalId, {
                    status: 'active',
                    isPublished: true,
                    approvedAt: new Date().toISOString(),
                    approvedBy: adminId
                });

                // 2. KANALGA POST QO'YISH
                await this.postToChannel(ctx, goal);
                
                // 3. Foydalanuvchiga xabar yuborish
                try {
                    await ctx.telegram.sendMessage(
                        goal.authorId,
                        `🎉 Tabriklaymiz!\n\n"${goal.name}" maqsadingiz tasdiqlandi va kanalga joylandi.\n\n` +
                        `Endi boshqalar sizning maqsadingizga qo'shilishi mumkin.`,
                        MainMenuKeyboard.getMainMenu()
                    );
                } catch (error) {
                    console.error('Failed to notify user:', error);
                }

                // 4. Boshqa adminlarga xabar
                for (const admin of config.adminIds) {
                    if (admin !== adminId.toString()) {
                        try {
                            await ctx.telegram.sendMessage(
                                admin,
                                `✅ Maqsad tasdiqlandi:\n"${goal.name}"\nTasdiqlovchi: @${ctx.from.username || 'admin'}`,
                                MainMenuKeyboard.removeKeyboard()
                            );
                        } catch (error) {
                            console.error(`Failed to notify admin ${admin}:`, error);
                        }
                    }
                }

                await ctx.reply('✅ Maqsad tasdiqlandi va nashr qilindi.');
                
                // Xabarni o'chirish
                await ctx.deleteMessage();

            } else if (action === 'reject') {
                // Maqsadni rad etish
                await db.updateGoal(goalId, {
                    status: 'cancelled',
                    isPublished: false,
                    rejectionReason: 'Admin tomonidan rad etildi'
                });

                // Foydalanuvchiga xabar yuborish
                try {
                    await ctx.telegram.sendMessage(
                        goal.authorId,
                        `⚠️ Maqsadingiz rad etildi.\n\n"${goal.name}" maqsadingiz platforma qoidalariga mos kelmadi.\n` +
                        `Sabab: Platforma qoidalariga mos kelmadi\n\n` +
                        `Yangidan maqsad yaratishingiz mumkin.`,
                        MainMenuKeyboard.getMainMenu()
                    );
                } catch (error) {
                    console.error('Failed to notify user:', error);
                }

                await ctx.reply('❌ Maqsad rad etildi.');
                
                // Xabarni o'chirish
                await ctx.deleteMessage();
            }

        } catch (error) {
            console.error('Goal approval error:', error);
            await ctx.reply('Xatolik yuz berdi.');
        }
    }

    // KANALGA POST QO'YISH FUNKSIYASI
    static async postToChannel(ctx, goal) {
        try {
            // Kanal username yoki ID si
            const channelId = config.channelId;
            const channelUsername = config.channelUsername;
            
            if (!channelId && !channelUsername) {
                console.error('Kanal ID yoki username topilmadi');
                return;
            }
            
            // Post matnini tayyorlash
            const postText = this.formatGoalPost(goal);
            
            // Inline keyboard - qo'shilish tugmasi
            const keyboard = {
                inline_keyboard: [
                    [
                        {
                            text: "✅ Qo'shilish",
                            callback_data: `join_goal_${goal.id}`
                        },
                        {
                            text: "🤖 Botga o'tish",
                            url: `https://t.me/${config.botUsername}`
                        }
                    ]
                ]
            };
            
            // Postni kanalga joylash
            let message;
            
            if (channelId) {
                // ID orqali
                message = await ctx.telegram.sendMessage(
                    channelId,
                    postText,
                    {
                        parse_mode: 'HTML',
                        reply_markup: keyboard
                    }
                );
            } else if (channelUsername) {
                // Username orqali
                message = await ctx.telegram.sendMessage(
                    channelUsername,
                    postText,
                    {
                        parse_mode: 'HTML',
                        reply_markup: keyboard
                    }
                );
            }
            
            // Post ID sini saqlash
            if (message && message.message_id) {
                await db.updateGoal(goal.id, {
                    channelMessageId: message.message_id,
                    channelPostDate: new Date().toISOString()
                });
            }
            
            console.log(`✅ Maqsad kanalga joylandi: ${goal.name}`);
            
        } catch (error) {
            console.error('Kanalga post joylash xatosi:', error);
            
            // Agar bot kanalda admin bo'lmasa
            if (error.description && error.description.includes('not enough rights')) {
                console.error('Bot kanalda admin emas!');
                console.error('Iltimos, botni kanalga admin qiling:');
                console.error('1. Kanal sozlamalariga boring');
                console.error('2. Adminlar ro\'yxatiga qo\'shing');
                console.error('3. Quyidagi huquqlarni bering:');
                console.error('   - Xabarlar yuborish');
                console.error('   - Inline keyboard qo\'shish');
            }
        }
    }
    
    // POST MATNINI FORMAT QILISH
    static formatGoalPost(goal) {
        const category = goal.category || 'Umumiy';
        const duration = Helpers.formatDuration ? Helpers.formatDuration(goal.duration) : `${goal.duration} kun`;
        const authorName = goal.authorName || 'Noma\'lum';
        const description = goal.description || '';
        const shortDescription = description.length > 300 ? 
            description.substring(0, 300) + '...' : description;
        
        const hashtags = `#${category.replace(/\s+/g, '_')} #Yolchi_Maqsad`;
        
        return `<b>🎯 YANGI MAQSAD</b>\n\n` +
               `<b>📌 Nomi:</b> ${goal.name}\n` +
               `<b>👤 Muallif:</b> ${authorName}\n` +
               `<b>🏷️ Kategoriya:</b> ${category}\n` +
               `<b>⏱️ Davomiylik:</b> ${duration}\n` +
               `<b>👥 Ishtirokchilar:</b> ${goal.participants || 0} ta\n\n` +
               `<b>📝 Maqsad:</b>\n${shortDescription}\n\n` +
               `<i>${hashtags}</i>`;
    }
    
    // QO'SHILISH SO'ROVI
    static async handleJoinRequest(ctx, action, goalId, userId) {
        try {
            const adminId = ctx.from.id;
            const goal = await db.getGoal(goalId);
            
            if (!goal || goal.authorId !== adminId) {
                await ctx.reply('Bu maqsad sizga tegishli emas yoki mavjud emas.');
                return;
            }

            const user = await db.getUser(userId);
            if (!user) {
                await ctx.reply('Foydalanuvchi topilmadi.');
                return;
            }

            if (action === 'approve') {
                // Qo'shilishni tasdiqlash
                // Bu yerda participations.json faylini yangilash kerak
                
                // Foydalanuvchiga xabar
                try {
                    await ctx.telegram.sendMessage(
                        userId,
                        `🎉 Tabriklaymiz!\n\n"${goal.name}" maqsadiga qo'shildingiz.\n` +
                        `Endi maqsad doshlari bilan birga ishlashingiz mumkin.`,
                        MainMenuKeyboard.getMainMenu()
                    );
                } catch (error) {
                    console.error('Failed to notify user:', error);
                }
                
                // Kanaldagi postni yangilash (ishtirokchilar soni)
                await this.updateChannelPost(ctx, goal);
                
                await ctx.reply('✅ Foydalanuvchi qo\'shildi.');

            } else if (action === 'reject') {
                // Qo'shilishni rad etish
                await ctx.reply('❌ Foydalanuvchi rad etildi.');
                
                // Foydalanuvchiga xabar
                try {
                    await ctx.telegram.sendMessage(
                        userId,
                        `⚠️ "${goal.name}" maqsadiga qo'shilish so'rovingiz rad etildi.\n` +
                        `Sabab: Maqsad egasi rad etdi\n\n` +
                        `Boshqa maqsadlarga qo'shilishingiz mumkin.`,
                        MainMenuKeyboard.getMainMenu()
                    );
                } catch (error) {
                    console.error('Failed to notify user:', error);
                }
            }

            // Xabarni o'chirish
            await ctx.deleteMessage();

        } catch (error) {
            console.error('Join request error:', error);
            await ctx.reply('Xatolik yuz berdi.');
        }
    }
    
    // KANALDAGI POSTNI YANGILASH (ishtirokchilar soni)
    static async updateChannelPost(ctx, goal) {
        try {
            if (!goal.channelMessageId || !config.channelId) {
                return;
            }
            
            const updatedText = this.formatGoalPost(goal);
            
            await ctx.telegram.editMessageText(
                config.channelId,
                goal.channelMessageId,
                null,
                updatedText,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "✅ Qo'shilish",
                                    callback_data: `join_goal_${goal.id}`
                                },
                                {
                                    text: "🤖 Botga o'tish",
                                    url: `https://t.me/${config.botUsername}`
                                }
                            ]
                        ]
                    }
                }
            );
            
        } catch (error) {
            console.error('Postni yangilash xatosi:', error);
        }
    }
}

module.exports = AdminHandler;