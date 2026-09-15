const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
    try {
        console.log('registerUser payload:', req.body);
        const { name, email, username, password, role } = req.body;

        if (!name || !email || !username || !password || !role) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(400).json({ message: "User with that email or username already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        const user = new User({ name, email, username, password: hashed, role });
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "secret", {
            expiresIn: "7d",
        });

        return res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('registerUser error:', error);
        return res.status(500).json({ message: "Server error" });
    }
};

const loginUser = async (req, res) => {
    try {
        console.log('loginUser payload:', req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "secret", {
            expiresIn: "7d",
        });

        return res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('loginUser error:', error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { registerUser, loginUser };