// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// JWT Secret Key - IMPORTANT: Must be the same as in authRoutes.js and from environment variables in production!
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-and-complex-key-for-dev';

function authMiddleware(req, res, next) {
    // Get token from header
    const authHeader = req.header('Authorization');

    // Check if not token
    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Check if token is in Bearer format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ msg: 'Token is not in Bearer format' });
    }
    
    const token = parts[1];

    // Verify token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Add user from payload to request object
        req.user = decoded.user; 
        next(); // Proceed to the next middleware or route handler
    } catch (e) {
        console.error('Token verification failed:', e.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
}

module.exports = authMiddleware;
