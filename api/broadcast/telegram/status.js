const fetch = require('node-fetch');
const { applyCors, applySecurityHeaders, getAllowedOrigins, getClientIp } = require('../../../lib/http-utils');
const { createRateLimiter, setRateLimitHeaders } = require('../../../lib/rate-limit');
const { checkBroadcastToken } = require('../../../lib/broadcast-auth');

const statusLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 20
});

module.exports = async function handler(req, res) {
    applySecurityHeaders(res);
    const allowed = applyCors(req, res, {
        methods: 'GET,OPTIONS',
        allowedOrigins: getAllowedOrigins()
    });

    if (req.headers.origin && !allowed) {
        return res.status(403).json({ success: false, error: 'Origin is not allowed by CORS policy.' });
    }
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

    const ip = getClientIp(req);
    const rateState = statusLimiter.check(`tg_status:${ip}`);
    setRateLimitHeaders(res, rateState);
    if (!rateState.allowed) {
        return res.status(429).json({ success: false, error: 'Too many requests.' });
    }

    if (!checkBroadcastToken(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const token = process.env.TELEGRAM_BROADCAST_BOT_TOKEN;
    if (!token) {
        return res.status(200).json({ success: true, online: false, reason: 'No token configured' });
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await response.json();
        
        if (response.ok && data.ok) {
            return res.status(200).json({ 
                success: true, 
                online: true, 
                bot: {
                    username: data.result.username,
                    name: data.result.first_name
                }
            });
        } else {
            return res.status(200).json({ success: true, online: false, reason: data.description });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Network error checking Telegram status' });
    }
};
