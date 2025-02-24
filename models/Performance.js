const mongoose = require("mongoose");

const PerformanceSchema = new mongoose.Schema(
    {
        kpiId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        weightage: {
            type: String,
            required: true,
        },
        goal: {
            type: String,
            required: true,
        },
        manager_achievement: {
            type: String,
            default: "0",
        },
        emp_achievement: {
            type: String,
            default: "0",
        },
        remarks: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Performance", PerformanceSchema);