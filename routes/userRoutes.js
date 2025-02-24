const express = require("express");
const { registerUser, loginUser, getUserProfile, googleLogin ,getManagers} = require("../controllers/userController");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/auth/google", googleLogin);
router.get("/profile", protect, getUserProfile);
router.get("/managers", protect, getManagers);

module.exports = router;