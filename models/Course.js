const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        price: { type: Number, required: true },
        instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        image: { type: String },
        category: { type: String },
        rating: { type: Number, default: 0 },
        outline: [
            {
                title: { type: String, required: true },
                description: { type: String },
            },
        ],
        videoUrl: { type: String },
        progress: [
            {
                studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                videoProgress: { type: Number, default: 0 },
                currentTime: { type: Number, default: 0 },
            }
        ],
        views:{ type: Number, default: 0 },
        timeSpent:{ type: Number, default: 0 },
    },
    { timestamps: true }
);

CourseSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model("Course", CourseSchema);