const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        // Check if user exists
        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
            if (result.length > 0) {
                return res.status(400).json({ message: "User already exists." });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into database
            db.query(
                "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
                [fullName, email, hashedPassword],
                (err, result) => {
                    if (err) return res.status(500).json({ message: "Database error." });

                    res.status(201).json({ message: "User registered successfully!" });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        // Check if user exists
        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
            if (result.length === 0) {
                return res.status(401).json({ message: "Invalid email or password." });
            }

            const user = result[0];

            // Compare password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid email or password." });
            }

            // Generate JWT token
            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

            res.status(200).json({ message: "Login successful!", token });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
};

