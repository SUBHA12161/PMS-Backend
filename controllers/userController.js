const User = require("../models/User");
const { generateToken, generateRefreshToken } = require("../utils/jwt");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, googleId } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const userData = { name, email, role, googleId };
        if (password) userData.password = password;

        const user = await User.create(userData);

        res.status(201).json({ status: "success", user });
    } catch (err) {
        res.status(400).json({ message: "Error creating user", error: err.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password, googleId } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "User not found. Please register." });
        }

        if (googleId) {
            if (!user.googleId || user.googleId !== googleId) {
                return res.status(401).json({ message: "Invalid Google credentials" });
            }
        } else {
            if (!password || !(await user.comparePassword(password))) {
                return res.status(401).json({ message: "Invalid email or password" });
            }
        }

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({
            token,
            refreshToken,
            user: { id: user.id, email: user.email, role: user.role, name: user.name },
        });
    } catch (err) {
        res.status(500).json({ message: "Error logging in", error: err.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({ name, email, googleId, password: null, isGoogleAccount: true });
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }

        const jwtToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({
            token: jwtToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("Error authenticating with Google", err);
        res.status(500).json({ message: "Google authentication failed", error: err.message });
    }
};


const getManagers = async (req, res) => {
    try {
        const managers = await User.find({ role: { $in: ["CEO", "Program Head", "Program Manager", "Business Manager", "Manager"] } }).select("name _id");
        res.json({ employees: managers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching managers" });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, googleLogin, getManagers };