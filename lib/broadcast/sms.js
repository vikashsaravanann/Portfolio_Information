const fetch = require('node-fetch');

async function send(message, recipients) {
    const results = { attempted: 0, sent: 0, failed: 0, errors: [] };
    
    const apiKey = process.env.FAST2SMS_API_KEY;
    const senderId = process.env.FAST2SMS_SENDER_ID || 'TXTIND';

    if (!apiKey) {
        results.errors.push('FAST2SMS_API_KEY is missing.');
        return results;
    }

    // Filter valid 10-digit Indian numbers (assuming Fast2SMS works for them)
    const validRecipients = recipients.filter(r => r.phone && r.phone.replace(/D/g, '').length >= 10);
    const validNumbers = validRecipients.map(r => {
        let clean = r.phone.replace(/D/g, '');
        if (clean.length > 10) clean = clean.slice(-10);
        return clean;
    });

    results.attempted = validNumbers.length;
    if (results.attempted === 0) return results;

    const BATCH_SIZE = 50;
    for (let i = 0; i < validNumbers.length; i += BATCH_SIZE) {
        const batch = validNumbers.slice(i, i + BATCH_SIZE);
        const numbersCsv = batch.join(',');

        try {
            const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                method: 'POST',
                headers: {
                    'authorization': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    route: 'v3',
                    sender_id: senderId,
                    message: message,
                    language: 'english',
                    flash: 0,
                    numbers: numbersCsv
                })
            });

            const data = await response.json();
            if (response.ok && data.return === true) {
                results.sent += batch.length;
            } else {
                results.failed += batch.length;
                results.errors.push(data.message || `Fast2SMS Error ${response.status}`);
            }
        } catch (error) {
            results.failed += batch.length;
            results.errors.push(`Network error: ${error.message}`);
        }
    }

    return results;
}

module.exports = { send };
