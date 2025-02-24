const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { createCourse, getCourses, getCourseById, getAnalytics, updateVideoProgress } = require("../controllers/courseController");

const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });

const router = express.Router();

router.post("/", protect, authorize("Instructor"), upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]), createCourse);
router.get("/", protect, getCourses);
router.get("/single/:courseId", protect, getCourseById);
router.get("/analytics", getAnalytics);
router.patch("/:courseId/progress", protect, updateVideoProgress);

module.exports = router;