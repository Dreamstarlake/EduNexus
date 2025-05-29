// backend/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database.js'); // Adjust path to database.js
const router = express.Router();

// --- Utility to generate simple ID (if not already in a shared util file) ---
// For consistency with how course IDs were handled client-side initially.
// In a real app, UUID library or database auto-increment might be preferred for user IDs.
function generateSimpleId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// JWT Secret Key - IMPORTANT: Store this in an environment variable in production!
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-and-complex-key-for-dev';

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    try {
        // Check if username already exists
        const userExistsSql = 'SELECT * FROM users WHERE username = ?';
        db.get(userExistsSql, [username], async (err, row) => {
            if (err) {
                console.error("DB error checking user:", err.message);
                return res.status(500).json({ error: 'Server error during registration (db check)' });
            }
            if (row) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const userId = generateSimpleId(); // Generate an ID for the user

            // Store user
            const insertSql = 'INSERT INTO users (id, username, password) VALUES (?, ?, ?)';
            db.run(insertSql, [userId, username, hashedPassword], function (err) {
                if (err) {
                    console.error("DB error inserting user:", err.message);
                    return res.status(500).json({ error: 'Server error during registration (db insert)' });
                }
                // Respond with success (don't send password back)
                res.status(201).json({ message: 'User registered successfully', userId: userId });
            });
        });
    } catch (error) {
        console.error("Server error during registration:", error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], async (err, user) => {
        if (err) {
            console.error("DB error during login:", err.message);
            return res.status(500).json({ error: 'Server error during login (db query)' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials (user not found)' });
        }

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid credentials (password mismatch)' });
            }

            // User matched, create JWT
            const payload = {
                user: {
                    id: user.id,
                    username: user.username
                    // Add other user details if needed in token, but keep it minimal
                }
            };

            jwt.sign(
                payload,
                JWT_SECRET,
                { expiresIn: '1h' }, // Token expires in 1 hour (can be configured)
                (err, token) => {
                    if (err) throw err;
                    res.json({ token, message: "Login successful" });
                }
            );
        } catch (error) {
            console.error("Error during password comparison or JWT signing:", error);
            res.status(500).json({ error: 'Server error during login process' });
        }
    });
});

module.exports = router;
