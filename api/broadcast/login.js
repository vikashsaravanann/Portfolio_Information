const { applyCors, applySecurityHeaders, getAllowedOrigins, getClientIp } = require('../../lib/http-utils');
const { createRateLimiter, setRateLimitHeaders } = require('../../lib/rate-limit');
const { verifyPassword, generateSessionToken } = require('../../lib/broadcast-auth');

// 5 attempts per 15 minutes per IP
const loginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5
});

module.exports = async function handler(req, res) {
    applySecurityHeaders(res);
    const allowed = applyCors(req, res, {
        methods: 'POST,OPTIONS',
        allowedOrigins: getAllowedOrigins()
    });

    if (req.headers.origin && !allowed) {
        return res.status(403).json({ success: false, error: 'Origin is not allowed by CORS policy.' });
    }

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const ip = getClientIp(req);
    const rateState = loginLimiter.check(`login:${ip}`);
    setRateLimitHeaders(res, rateState);

    if (!rateState.allowed) {
        return res.status(429).json({ success: false, error: 'Too many login attempts. Please try again later.' });
    }

    const { password } = req.body || {};
    
    if (verifyPassword(password)) {
        const token = generateSessionToken();
        return res.status(200).json({ success: true, token });
    } else {
        return res.status(401).json({ success: false, error: 'Invalid password.' });
    }
};
