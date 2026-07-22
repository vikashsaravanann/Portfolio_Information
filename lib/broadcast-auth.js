const crypto = require('crypto');

const TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

function getHmacSecret() {
    return process.env.BROADCAST_JWT_SECRET || 'fallback-so-it-doesnt-crash';
}

function generateSessionToken() {
    const timestamp = Date.now().toString();
    const hmac = crypto.createHmac('sha256', getHmacSecret());
    hmac.update(`session:${timestamp}`);
    const signature = hmac.digest('hex');
    return `${timestamp}.${signature}`;
}

function checkBroadcastToken(req) {
    if (!process.env.BROADCAST_JWT_SECRET) {
        return false; // Deny all if no token is configured in env
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.split(' ')[1];
    const parts = token.split('.');
    if (parts.length !== 2) {
        return false;
    }

    const [timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    
    if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_EXPIRY_MS) {
        return false;
    }

    const hmac = crypto.createHmac('sha256', getHmacSecret());
    hmac.update(`session:${timestampStr}`);
    const expectedSignature = hmac.digest('hex');

    if (signature.length !== expectedSignature.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
    );
}

module.exports = {
    generateSessionToken,
    checkBroadcastToken
};
