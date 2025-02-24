const express = require("express");
const { registerUser, getEmployee, getEmployeeCount } = require("../controllers/employeeController");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/add", protect, registerUser);
router.get("/get", protect, getEmployee);
router.get("/getCount", protect, getEmployeeCount);

module.exports = router;