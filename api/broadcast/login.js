const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { applyCors, applySecurityHeaders, getAllowedOrigins, getClientIp } = require('../../lib/http-utils');
const { createRateLimiter, setRateLimitHeaders } = require('../../lib/rate-limit');
const { generateSessionToken } = require('../../lib/broadcast-auth');
const analyticsStore = require('../../lib/analytics-store');

// 5 attempts per 15 minutes per IP
const ipLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5
});

// 10 attempts per hour per username to prevent distributed brute force on admin
const userLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10
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
    
    // Check IP rate limit first
    const ipRateState = ipLimiter.check(`login_ip:${ip}`);
    setRateLimitHeaders(res, ipRateState); // We'll return headers for the IP limit primarily

    if (!ipRateState.allowed) {
        analyticsStore.recordEvent({ type: 'broadcast_login_failed', data: { ip, reason: 'ip_ratelimit' } });
        return res.status(429).json({ success: false, error: 'Too many login attempts. Please try again later.' });
    }

    const { username, password } = req.body || {};
    
    if (!username || !password) {
        analyticsStore.recordEvent({ type: 'broadcast_login_failed', data: { ip, reason: 'missing_credentials' } });
        return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    // Check Username rate limit
    const normalizedUsername = String(username).toLowerCase();
    const userRateState = userLimiter.check(`login_user:${normalizedUsername}`);
    
    if (!userRateState.allowed) {
        analyticsStore.recordEvent({ type: 'broadcast_login_failed', data: { ip, reason: 'user_ratelimit' } });
        return res.status(429).json({ success: false, error: 'Account temporarily locked due to too many failed attempts. Please try again later.' });
    }

    const expectedUsername = process.env.BROADCAST_ADMIN_USERNAME;
    const expectedHash = process.env.BROADCAST_ADMIN_PASSWORD_HASH;

    if (!expectedUsername || !expectedHash) {
        console.error('Server missing BROADCAST_ADMIN_USERNAME or BROADCAST_ADMIN_PASSWORD_HASH');
        return res.status(500).json({ success: false, error: 'Server configuration error.' });
    }

    // Timing-safe username comparison
    let isUsernameMatch = false;
    try {
        isUsernameMatch = crypto.timingSafeEqual(
            Buffer.from(username),
            Buffer.from(expectedUsername)
        );
    } catch (e) {
        // Length mismatch throws an error
        isUsernameMatch = false;
    }

    // Only compare password if username matched (to prevent leaking valid usernames via timing)
    // Actually, to prevent timing attacks where they know the username is wrong because bcrypt isn't run,
    // we should always run bcrypt on *something*. 
    // Let's run it against the expectedHash regardless of username match.
    const isPasswordMatch = await bcrypt.compare(password, expectedHash);

    if (isUsernameMatch && isPasswordMatch) {
        const token = generateSessionToken();
        return res.status(200).json({ success: true, token });
    } else {
        analyticsStore.recordEvent({ type: 'broadcast_login_failed', data: { ip, reason: 'invalid_credentials' } });
        return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }
};
