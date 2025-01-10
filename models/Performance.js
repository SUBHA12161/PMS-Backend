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
        remarks: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Performance", PerformanceSchema);