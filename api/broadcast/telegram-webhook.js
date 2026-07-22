const fetch = require('node-fetch');
const { applySecurityHeaders } = require('../../lib/http-utils');

module.exports = async function handler(req, res) {
    applySecurityHeaders(res);
    
    // Telegram webhook validation using a secret query parameter
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret && req.query.secret !== expectedSecret) {
        return res.status(401).json({ error: 'Unauthorized webhook call' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const update = req.body;
    if (!update || !update.message) {
        return res.status(200).send('OK'); // Acknowledge to Telegram to stop retries
    }

    const chatId = update.message.chat?.id;
    const text = (update.message.text || '').trim();

    if (chatId && text.startsWith('/start')) {
        const botToken = process.env.TELEGRAM_BROADCAST_BOT_TOKEN;
        if (botToken) {
            const replyText = `Welcome! Your Telegram Chat ID is: 

` +
                              `**${chatId}**

` +
                              `Please copy this ID and provide it to the administrator to receive broadcast messages.`;

            try {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: replyText,
                        parse_mode: 'Markdown'
                    })
                });
            } catch (err) {
                console.error('Webhook reply error:', err);
            }
        }
    }

    // Always return 200 OK to Telegram so it doesn't retry the update
    return res.status(200).send('OK');
};
