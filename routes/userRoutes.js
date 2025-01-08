const express = require("express");
const { registerUser, loginUser, getUserProfile, googleLogin } = require("../controllers/userController");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/auth/google", googleLogin);
router.get("/profile", protect, getUserProfile);

module.exports = router;