const fetch = require('node-fetch');

async function send(message, recipients) {
    const results = { attempted: 0, sent: 0, failed: 0, errors: [] };
    
    const botToken = process.env.TELEGRAM_BROADCAST_BOT_TOKEN;
    if (!botToken) {
        results.errors.push('TELEGRAM_BROADCAST_BOT_TOKEN is missing.');
        return results;
    }

    const validRecipients = recipients.filter(r => r.telegram_chat_id);
    results.attempted = validRecipients.length;
    if (results.attempted === 0) return results;

    const BATCH_SIZE = 10; 
    // Telegram allows max 30 messages per second.
    // Batching with small delays is best practice.
    for (let i = 0; i < validRecipients.length; i += BATCH_SIZE) {
        const batch = validRecipients.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (recipient) => {
            const fname = (recipient.name || 'Student').split(/\\s+/)[0];
            const personalizedMessage = `Hi ${fname},

${message}`;

            try {
                const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: recipient.telegram_chat_id,
                        text: personalizedMessage
                    })
                });

                const data = await response.json();
                if (response.ok && data.ok) {
                    results.sent++;
                } else {
                    results.failed++;
                    results.errors.push(`Telegram error for ${recipient.telegram_chat_id}: ${data.description}`);
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Network error for ${recipient.telegram_chat_id}: ${error.message}`);
            }
        }));

        // Rate limiting delay (approx 330ms to stay well under 30 msg/sec)
        if (i + BATCH_SIZE < validRecipients.length) {
            await new Promise(r => setTimeout(r, 400));
        }
    }

    return results;
}

module.exports = { send };
