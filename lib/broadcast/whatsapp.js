const fetch = require('node-fetch');

async function send(message, recipients) {
    const results = { attempted: 0, sent: 0, failed: 0, errors: [] };
    
    const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
        results.errors.push('WhatsApp configuration missing (WHATSAPP_CLOUD_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID).');
        return results;
    }

    const validRecipients = recipients.filter(r => r.phone && r.phone.replace(/D/g, '').length >= 10);
    results.attempted = validRecipients.length;
    if (results.attempted === 0) return results;

    const BATCH_SIZE = 5;
    for (let i = 0; i < validRecipients.length; i += BATCH_SIZE) {
        const batch = validRecipients.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (recipient) => {
            const fname = (recipient.name || 'Student').split(/\\s+/)[0];
            const personalizedMessage = `Hi ${fname},

${message}`;
            
            // Format phone number to international format, assuming Indian +91 if 10 digits
            let cleanPhone = recipient.phone.replace(/D/g, '');
            if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

            try {
                const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: cleanPhone,
                        type: 'text',
                        text: {
                            preview_url: false,
                            body: personalizedMessage
                        }
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    results.sent++;
                } else {
                    results.failed++;
                    results.errors.push(`WhatsApp error for ${cleanPhone}: ${data.error?.message || 'Unknown error'}`);
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Network error for ${cleanPhone}: ${error.message}`);
            }
        }));

        // Rate limit mitigation
        if (i + BATCH_SIZE < validRecipients.length) {
            await new Promise(r => setTimeout(r, 200));
        }
    }

    return results;
}

module.exports = { send };
