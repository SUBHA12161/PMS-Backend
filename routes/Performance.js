const express = require("express");
const { addPerformance, getPerformance, updatePerformance } = require("../controllers/Performance");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/add", protect, addPerformance);
router.get("/get", protect, getPerformance);
router.post("/update", protect, updatePerformance);

module.exports = router;