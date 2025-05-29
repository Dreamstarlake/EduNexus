// backend/database.js
const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "edunexus.db";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => { // Use serialize to ensure statements run in order
            // Create users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, 
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL 
            )`, (err) => {
                if (err) {
                    console.error("Error creating users table:", err.message);
                } else {
                    console.log("Users table is ready or already exists.");
                }
            });

            // Create courses table (now with userId)
            // The 'id' for courses is client-generated TEXT.
            // 'userId' will link to users.id (which is also TEXT).
            db.run(`CREATE TABLE IF NOT EXISTS courses (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                startTime TEXT NOT NULL,
                endTime TEXT NOT NULL,
                dayOfWeek INTEGER NOT NULL,
                color TEXT,
                instructor TEXT,
                location TEXT,
                userId TEXT NOT NULL, 
                FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE 
            )`, (err) => {
                if (err) {
                    console.error("Error creating courses table with userId:", err.message);
                } else {
                    console.log("Courses table (with userId) is ready or already exists.");
                }
            });
        });
    }
});

module.exports = db;
