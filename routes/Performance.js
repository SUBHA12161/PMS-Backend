const express = require("express");
const { addPerformance, getPerformance, updatePerformance ,updatePerformanceManager} = require("../controllers/Performance");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/add", protect, addPerformance);
router.get("/get", protect, getPerformance);
router.post("/update", protect, updatePerformance);
router.post("/updateManager", protect, updatePerformanceManager);

module.exports = router;