const mongoose = require("mongoose");

const KpiSchema = new mongoose.Schema({
    name: { type: String, required: true },
    weightage: { type: Number, required: true },
    goal: { type: Number, required: true },
    addedBy: { type: String, required: true },
});

module.exports = mongoose.model("kpi", KpiSchema);