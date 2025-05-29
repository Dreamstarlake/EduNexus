// backend/server.js
const express = require('express');
const db = require('./database.js');
const cors = require('cors');
const authMiddleware = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes'); // Add this line
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes and origins by default
app.use(express.json()); 

// --- Authentication Routes ---
app.use('/api/auth', authRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Hello from EduNexus Backend!');
});

// --- API Routes for Courses ---

// GET all courses for the authenticated user
app.get("/api/courses", authMiddleware, (req, res, next) => {
    const userId = req.user.id; // Get userId from the authenticated user
    const sql = "SELECT * FROM courses WHERE userId = ?";
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// POST create a new course for the authenticated user
app.post("/api/courses/", authMiddleware, (req, res, next) => {
    const errors = [];
    if (!req.body.name) errors.push("Name is required");
    if (!req.body.startTime) errors.push("Start time is required");
    if (!req.body.endTime) errors.push("End time is required");
    if (req.body.dayOfWeek === undefined) errors.push("Day of week is required");
    if (!req.body.id) errors.push("Client-generated ID is required"); // Keep client-gen ID for now

    if (errors.length) {
        res.status(400).json({"error": errors.join(", ")});
        return;
    }

    const userId = req.user.id; // Get userId from authenticated user
    const data = {
        id: req.body.id,
        name: req.body.name,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        dayOfWeek: req.body.dayOfWeek,
        color: req.body.color,
        instructor: req.body.instructor,
        location: req.body.location,
        userId: userId // Add userId to the course data
    };
    const sql = 'INSERT INTO courses (id, name, startTime, endTime, dayOfWeek, color, instructor, location, userId) VALUES (?,?,?,?,?,?,?,?,?)';
    const params = [data.id, data.name, data.startTime, data.endTime, data.dayOfWeek, data.color, data.instructor, data.location, data.userId];
    
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.status(201).json({ // Send 201 Created status
            "message": "success",
            "data": data 
        });
    });
});

// PUT update an existing course for the authenticated user
app.put("/api/courses/:id", authMiddleware, (req, res, next) => {
    const courseId = req.params.id;
    const userId = req.user.id;
    const data = {
        name: req.body.name,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        dayOfWeek: req.body.dayOfWeek,
        color: req.body.color,
        instructor: req.body.instructor,
        location: req.body.location
    };

    // First, verify the course belongs to the user (optional, but good practice)
    // Or ensure the UPDATE query itself implicitly handles this via "WHERE id = ? AND userId = ?"
    
    const sql = `UPDATE courses SET 
                   name = COALESCE(?, name), 
                   startTime = COALESCE(?, startTime), 
                   endTime = COALESCE(?, endTime), 
                   dayOfWeek = COALESCE(?, dayOfWeek), 
                   color = COALESCE(?, color), 
                   instructor = COALESCE(?, instructor), 
                   location = COALESCE(?, location) 
                   WHERE id = ? AND userId = ?`; // Added userId condition
    const params = [
        data.name, data.startTime, data.endTime, data.dayOfWeek, 
        data.color, data.instructor, data.location, 
        courseId, userId
    ];

    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        if (this.changes === 0) {
            // This could mean course not found OR course not owned by user
            return res.status(404).json({"error": "Course not found or not authorized to update."});
        }
        res.json({
            message: "success",
            data: data, 
            changes: this.changes
        });
    });
});

// DELETE a course for the authenticated user
app.delete("/api/courses/:id", authMiddleware, (req, res, next) => {
    const courseId = req.params.id;
    const userId = req.user.id;

    const sql = 'DELETE FROM courses WHERE id = ? AND userId = ?'; // Added userId condition
    const params = [courseId, userId];
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        if (this.changes === 0) {
            // This could mean course not found OR course not owned by user
            return res.status(404).json({"error": "Course not found or not authorized to delete."});
        }
        res.json({"message": "deleted", changes: this.changes});
    });
});

// Default response for any other request (404 Not Found)
// app.use(function(req, res){
//     res.status(404).json({"error": "Endpoint not found"});
// });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
