const fetch = require('node-fetch');
const { applyCors, applySecurityHeaders, getAllowedOrigins, getClientIp } = require('../../lib/http-utils');
const { createRateLimiter, setRateLimitHeaders } = require('../../lib/rate-limit');
const { checkBroadcastToken } = require('../../lib/broadcast-auth');

// strict rate limiting for dispatch
const dispatchLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10 // max 10 dispatches per minute per IP
});

const channelHandlers = {
    email: require('../../lib/broadcast/email'),
    sms: require('../../lib/broadcast/sms'),
    telegram: require('../../lib/broadcast/telegram'),
    whatsapp: require('../../lib/broadcast/whatsapp')
};

async function getRecipients() {
    const sourceUrl = process.env.BROADCAST_RECIPIENTS_SOURCE;
    if (!sourceUrl) {
        throw new Error('BROADCAST_RECIPIENTS_SOURCE is not configured.');
    }
    
    // Fetch JSON recipients
    const response = await fetch(sourceUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch recipients from source: ${response.statusText}`);
    }
    return response.json();
}

module.exports = async function handler(req, res) {
    applySecurityHeaders(res);
    const allowed = applyCors(req, res, {
        methods: 'POST,OPTIONS',
        allowedOrigins: getAllowedOrigins()
    });

    if (req.headers.origin && !allowed) {
        return res.status(403).json({ success: false, error: 'Origin is not allowed by CORS policy.' });
    }
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    const ip = getClientIp(req);
    const rateState = dispatchLimiter.check(`dispatch:${ip}`);
    setRateLimitHeaders(res, rateState);
    if (!rateState.allowed) {
        return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
    }

    if (!checkBroadcastToken(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const { message, channels } = req.body || {};
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Message body is required.' });
    }
    if (!Array.isArray(channels) || channels.length === 0) {
        return res.status(400).json({ success: false, error: 'At least one channel must be selected.' });
    }

    let recipients = [];
    try {
        recipients = await getRecipients();
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to load recipients', details: err.message });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ success: false, error: 'Recipient list is empty.' });
    }

    // Execute in parallel
    const promises = channels.map(async (ch) => {
        const handler = channelHandlers[ch];
        if (!handler) {
            return { channel: ch, error: 'Unsupported channel' };
        }
        try {
            const result = await handler.send(message, recipients);
            return { channel: ch, ...result };
        } catch (error) {
            return { channel: ch, error: error.message };
        }
    });

    const settled = await Promise.allSettled(promises);
    const results = {};
    
    settled.forEach((outcome, index) => {
        const ch = channels[index];
        if (outcome.status === 'fulfilled') {
            results[ch] = outcome.value;
        } else {
            results[ch] = { error: outcome.reason.message || 'Unknown error' };
        }
    });

    return res.status(200).json({
        success: true,
        results
    });
};
