const express = require("express");
const { addPerformance, getPerformance } = require("../controllers/Performance");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/add", protect, addPerformance);
router.get("/get", protect, getPerformance);

module.exports = router;