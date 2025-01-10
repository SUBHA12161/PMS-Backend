const express = require("express");
const { addKpi, getKpi } = require("../controllers/kpiController");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/add", protect, addKpi);
router.get("/get", protect, getKpi);

module.exports = router;