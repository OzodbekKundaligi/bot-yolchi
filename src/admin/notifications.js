const db = require('../database/connection');
const MainMenuKeyboard = require('../keyboards/mainMenu');
const GoalCreationKeyboard = require('../keyboards/goalCreation');
const config = require('../config/bot.config');

class AdminHandler {
    static async handleGoalApproval(ctx, action, goalId) {
        try {
            console.log('🔄 ADMIN: Goal approval process started');
            console.log(`📝 Goal ID: ${goalId}, Action: ${action}`);
            console.log(`👤 Admin ID: ${ctx.from.id}`);
            console.log(`📋 Admin list: ${config.adminIds}`);
            
            // Admin tekshirish
            const isAdmin = config.isAdmin(ctx.from.id);
            console.log(`👑 Is admin? ${isAdmin}`);
            
            if (!isAdmin) {
                await ctx.reply('❌ Siz admin emassiz!');
                return;
            }

            // Goal ni olish
            const goal = await db.getGoal(goalId);
            if (!goal) {
                await ctx.reply('❌ Maqsad topilmadi!');
                return;
            }

            console.log(`🎯 Found goal: ${goal.name}`);

            if (action === 'approve') {
                console.log('✅ Approving goal...');
                
                // 1. Goal ni yangilash
                await db.updateGoal(goalId, {
                    status: 'active',
                    isPublished: true,
                    approvedAt: new Date().toISOString(),
                    approvedBy: ctx.from.id
                });

                console.log('📝 Goal updated in database');

                // 2. KANALGA POST QO'YISH (ENG MUHIM QISM!)
                const postResult = await this.postToChannel(ctx, goal);
                
                if (!postResult.success) {
                    await ctx.reply(`⚠️ Maqsad tasdiqlandi, lekin kanalga joylanmadi: ${postResult.error}`);
                    return;
                }

                console.log('📤 Post sent to channel successfully');

                // 3. Foydalanuvchiga xabar
                try {
                    await ctx.telegram.sendMessage(
                        goal.authorId,
                        `🎉 TABRIKLAYMIZ!\n\n"${goal.name}" maqsadingiz tasdiqlandi va kanalga joylandi.\n\n` +
                        `Endi boshqalar sizning maqsadingizga qo'shilishi mumkin.`,
                        MainMenuKeyboard.getMainMenu()
                    );
                    console.log(`📩 Notification sent to user: ${goal.authorId}`);
                } catch (error) {
                    console.error('❌ Failed to notify user:', error);
                }

                // 4. Admin javobi
                await ctx.reply(`✅ "${goal.name}" maqsadi tasdiqlandi va kanalga joylandi!`);
                
                // 5. Xabarni o'chirish
                try {
                    await ctx.deleteMessage();
                } catch (e) {
                    console.log('Could not delete message:', e);
                }

            } else if (action === 'reject') {
                console.log('❌ Rejecting goal...');
                
                await db.updateGoal(goalId, {
                    status: 'cancelled',
                    isPublished: false,
                    rejectionReason: 'Admin tomonidan rad etildi'
                });

                // Foydalanuvchiga xabar
                try {
                    await ctx.telegram.sendMessage(
                        goal.authorId,
                        `⚠️ MAQSAD RAD ETILDI\n\n"${goal.name}" maqsadingiz platforma qoidalariga mos kelmadi.\n\n` +
                        `Sabab: Platforma qoidalariga mos kelmadi\n\n` +
                        `Yangidan maqsad yaratishingiz mumkin.`,
                        MainMenuKeyboard.getMainMenu()
                    );
                } catch (error) {
                    console.error('Failed to notify user:', error);
                }

                await ctx.reply('❌ Maqsad rad etildi.');
                
                try {
                    await ctx.deleteMessage();
                } catch (e) {
                    console.log('Could not delete message:', e);
                }
            }

        } catch (error) {
            console.error('❌ Goal approval ERROR:', error);
            await ctx.reply(`❌ Xatolik: ${error.message}`);
        }
    }

    // ============ KANALGA POST QO'YISH ============
    static async postToChannel(ctx, goal) {
        try {
            console.log('📤 Attempting to post to channel...');
            
            // Kanalni aniqlash
            const channelTarget = config.getChannelTarget();
            console.log(`🎯 Channel target: ${channelTarget}`);
            
            if (!channelTarget) {
                console.log('❌ No channel configured');
                return { success: false, error: 'Kanal sozlanmagan' };
            }

            // Post matnini tayyorlash
            const postText = this.formatGoalPost(goal);
            console.log(`📝 Post text length: ${postText.length} chars`);

            // Inline keyboard
            const keyboard = {
                inline_keyboard: [
                    [
                        {
                            text: "✅ QO'SHILISH",
                            callback_data: `join_goal_${goal.id}`
                        },
                        {
                            text: "🤖 BOTGA O'TISH",
                            url: `https://t.me/${config.botUsername}?start=goal_${goal.id}`
                        }
                    ]
                ]
            };

            console.log('🔄 Sending to Telegram API...');
            
            // Telegram API ga so'rov
            let message;
            try {
                message = await ctx.telegram.sendMessage(
                    channelTarget,
                    postText,
                    {
                        parse_mode: 'HTML',
                        reply_markup: keyboard,
                        disable_web_page_preview: true
                    }
                );
                
                console.log('✅ Telegram API success!');
                console.log(`📨 Message ID: ${message.message_id}`);
                
            } catch (telegramError) {
                console.error('❌ Telegram API error:', telegramError);
                
                // Tafsilotli xatolik tahlili
                if (telegramError.description) {
                    console.error(`📝 Error description: ${telegramError.description}`);
                    
                    if (telegramError.description.includes('chat not found')) {
                        return { 
                            success: false, 
                            error: 'Kanal topilmadi. ID/Username ni tekshiring' 
                        };
                    }
                    if (telegramError.description.includes('not enough rights')) {
                        return { 
                            success: false, 
                            error: 'Bot kanalda admin emas!' 
                        };
                    }
                    if (telegramError.description.includes('bot was blocked')) {
                        return { 
                            success: false, 
                            error: 'Bot kanaldan bloklangan' 
                        };
                    }
                }
                
                return { 
                    success: false, 
                    error: telegramError.message || 'Noma\'lum Telegram xatosi' 
                };
            }

            // Post ID sini saqlash
            if (message && message.message_id) {
                await db.updateGoal(goal.id, {
                    channelMessageId: message.message_id,
                    channelPostDate: new Date().toISOString()
                });
                console.log(`💾 Saved channel message ID: ${message.message_id}`);
            }

            return { success: true, messageId: message.message_id };

        } catch (error) {
            console.error('❌ Post to channel ERROR:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ============ POST MATNI FORMATI ============
    static formatGoalPost(goal) {
        const category = goal.category || 'Umumiy';
        const duration = goal.duration === 'custom' ? 'Maqsad tugaguncha' : `${goal.duration} kun`;
        const authorName = goal.authorName || 'Noma\'lum';
        const description = goal.description || '';
        
        // Qisqa tarif (maksimum 300 belgi)
        const shortDescription = description.length > 300 
            ? description.substring(0, 300) + '...' 
            : description;
        
        // Hashtag lar
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
    
    // ============ QO'SHIMCHA FUNKSIYALAR ============
    
    // Kanalni test qilish
    static async testChannel(ctx) {
        try {
            const channelTarget = config.getChannelTarget();
            
            if (!channelTarget) {
                return '❌ Kanal sozlanmagan. .env da CHANNEL_ID yoki CHANNEL_USERNAME ni kiriting.';
            }
            
            const testText = `🔧 TEST XABAR\n\n` +
                           `Sana: ${new Date().toLocaleDateString('uz-UZ')}\n` +
                           `Vaqt: ${new Date().toLocaleTimeString('uz-UZ')}\n` +
                           `Platforma: Yolchi Bot`;
            
            const message = await ctx.telegram.sendMessage(
                channelTarget,
                testText,
                { parse_mode: 'HTML' }
            );
            
            return `✅ Test muvaffaqiyatli!\n` +
                   `Kanal: ${channelTarget}\n` +
                   `Xabar ID: ${message.message_id}`;
            
        } catch (error) {
            return `❌ Test xatosi: ${error.message}`;
        }
    }
    
    // Admin ma'lumotlari
    static async getAdminInfo(ctx) {
        const isAdmin = config.isAdmin(ctx.from.id);
        const channelTarget = config.getChannelTarget();
        
        return `👑 ADMIN MA'LUMOTLARI\n\n` +
               `Sizning ID: ${ctx.from.id}\n` +
               `Adminmi: ${isAdmin ? '✅ HA' : '❌ YO\'Q'}\n` +
               `Adminlar ro'yxati: ${config.adminIds.join(', ')}\n` +
               `Kanal: ${channelTarget || 'Sozlanmagan'}\n` +
               `Bot: @${config.botUsername}`;
    }
}

module.exports = AdminHandler;