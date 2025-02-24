const Course = require("../models/Course");
const mongoose = require("mongoose");

const createCourse = async (req, res) => {
    try {
        const { title, description, price, category, outline } = req.body;

        if (!title || !description || !price || !category) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const image = req.files?.image ? `/uploads/${req.files.image[0].filename}` : null;
        const videoUrl = req.files?.video ? `/uploads/${req.files.video[0].filename}` : null;

        const parsedOutline = outline ? JSON.parse(outline) : [];

        const course = await Course.create({
            title,
            description,
            price,
            category,
            image,
            videoUrl,
            outline: parsedOutline,
            instructor: req.user.id,
        });

        res.status(201).json({ status: "success", course });
    } catch (err) {
        res.status(400).json({ message: "Error creating course", error: err.message });
    }
};

const getCourses = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, price, rating } = req.query;

        const query = {};
        if (category) query.category = category;
        if (rating) {
            const ratingValue = parseFloat(rating);
            query.rating = { $gte: ratingValue, $lt: ratingValue + 1 };
        }

        const sort = {};
        if (price === "asc") sort.price = 1;
        if (price === "desc") sort.price = -1;

        const courses = await Course.find(query)
            .sort(sort)
            .skip((page - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        const totalCourses = await Course.countDocuments(query);

        res.status(200).json({
            status: "success",
            totalCourses,
            currentPage: Number(page),
            totalPages: Math.ceil(totalCourses / limit),
            courses,
        });
    } catch (err) {
        res.status(400).json({ message: "Error fetching courses", error: err.message });
    }
};


const getCourseById = async (req, res) => {
    try {
        const { courseId } = req.params;

        if (!mongoose.isValidObjectId(courseId)) {
            return res.status(400).json({ message: "Invalid course ID" });
        }

        const course = await Course.findById(courseId).lean();

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.status(200).json({ status: "success", course });
    } catch (error) {
        res.status(500).json({ message: "Error fetching course details", error: error.message });
    }
};

const updateVideoProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { videoProgress, currentTime } = req.body;

        if (!mongoose.isValidObjectId(courseId)) {
            return res.status(400).json({ message: "Invalid course ID" });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const studentId = req.user._id;

        if (!course.students.includes(studentId)) {
            course.students.push(studentId);
        }

        if (!Array.isArray(course.progress)) {
            course.progress = [];
        }

        const progressIndex = course.progress.findIndex(
            (entry) => entry.studentId.toString() === studentId.toString()
        );

        if (progressIndex >= 0) {
            course.progress[progressIndex].videoProgress = videoProgress;
            course.progress[progressIndex].currentTime = currentTime;
        } else {
            course.progress.push({ studentId, videoProgress, currentTime });
        }

        if (videoProgress > 0 && currentTime > 0) {
            course.views = course.views + 1;
        }

        course.timeSpent = course.timeSpent + currentTime;

        await course.save();

        res.status(200).json({ message: "Progress updated successfully" });
    } catch (error) {
        console.log("updateVideoProgress error == ", error);
        res.status(500).json({ message: "Error updating progress", error: error.message });
    }
};

const getAnalytics = async (req, res) => {
    try {
        const courses = await Course.find().populate('students');

        if (!courses || courses.length === 0) {
            return res.status(404).json({ message: "No courses found" });
        }

        let totalStudents = 0;
        let completedStudents = 0;
        let totalViews = 0;
        let totalTimeSpent = 0;

        courses.forEach(course => {
            totalStudents += course.students.length;

            completedStudents += course.progress.filter((progress) =>
                progress.videoProgress >= 97
            ).length;

            totalViews += course.views;
            totalTimeSpent += course.timeSpent;
        });

        const avgCompletionRate = totalStudents ? (completedStudents / totalStudents) * 100 : 0;
        const avgTimeSpent = totalStudents ? ((totalTimeSpent / totalStudents) % 60) : 0;

        res.status(200).json({
            totalStudents,
            completedStudents,
            avgCompletionRate,
            engagementMetrics: {
                totalViews,
                avgTimeSpent,
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error fetching overall analytics", error: err.message });
    }
};

module.exports = { createCourse, getCourses, getCourseById, getAnalytics, updateVideoProgress };