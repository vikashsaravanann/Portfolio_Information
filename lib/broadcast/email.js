const nodemailer = require('nodemailer');

function getFirstName(fullName) {
    if (!fullName) return 'Student';
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || 'Student';
}

function buildHtml(name, messageBody) {
    const fname = getFirstName(name);
    // Convert plain text line breaks to HTML breaks
    const formattedMessage = (messageBody || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Notification</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0e0e0;border-top:4px solid #111111;">
  <tr>
    <td style="padding:40px 40px 30px;color:#333333;line-height:1.7;font-size:15px;">
      <p>Dear <strong style="color:#111111;">${fname}</strong>,</p>
      
      <div style="margin: 20px 0;">
        ${formattedMessage}
      </div>
      
    </td>
  </tr>
</table>
</td></tr>
</table>
</body></html>`;
}

async function send(message, recipients) {
    const results = { attempted: 0, sent: 0, failed: 0, errors: [] };
    
    let accounts = [];
    try {
        if (process.env.BROADCAST_SMTP_ACCOUNTS) {
            accounts = JSON.parse(process.env.BROADCAST_SMTP_ACCOUNTS);
        }
    } catch (e) {
        results.errors.push('Failed to parse BROADCAST_SMTP_ACCOUNTS JSON.');
        return results;
    }

    if (accounts.length === 0) {
        results.errors.push('SMTP configuration missing (BROADCAST_SMTP_ACCOUNTS).');
        return results;
    }

    const host = process.env.BROADCAST_SMTP_HOST || 'smtp.gmail.com';
    const port = Number.parseInt(process.env.BROADCAST_SMTP_PORT || '465', 10);
    const secure = port === 465;

    const transporters = accounts.map(acc => ({
        user: acc.email,
        transporter: nodemailer.createTransport({
            host: host,
            port: port,
            secure: secure,
            auth: {
                user: acc.email,
                pass: acc.password
            }
        })
    }));

    results.attempted = recipients.length;

    // Process in batches or sequentially. We will do sequentially to avoid rate limits, 
    // but in a serverless function we have a timeout (usually 10s on Vercel free tier). 
    // If the recipient list is large, serverless is not ideal for long loops.
    // For this port, we will use Promise.all with a concurrency limit.
    
    const BATCH_SIZE = 5;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (recipient, batchIdx) => {
            try {
                // Round-robin selection based on absolute index
                const absoluteIdx = i + batchIdx;
                const account = transporters[absoluteIdx % transporters.length];
                
                await account.transporter.sendMail({
                    from: account.user,
                    to: recipient.email,
                    subject: 'Update from Vikash Saravanan',
                    html: buildHtml(recipient.name, message)
                });
                results.sent++;
            } catch (err) {
                results.failed++;
                results.errors.push(`Failed to send to ${recipient.email}: ${err.message}`);
            }
        }));
    }

    return results;
}

module.exports = { send };
