const Kpi = require('../models/Kpi');

const addKpi = async (req, res) => {
    try {
        const { name, weightage, goal, achievement } = req.body;
        if (!name || !weightage || !goal || !achievement) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const newKpi = new Kpi({
            name,
            weightage,
            goal,
            achievement,
            addedBy: req.user._id,
        });

        await newKpi.save();
        res.status(201).json({ message: "KPI added successfully", kpi: newKpi });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add KPI." });
    }
};

const getKpi = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const kpis = await Kpi.find({ addedBy: req.user._id })
            .skip(skip)
            .limit(limit);

        const totalCount = await Kpi.countDocuments({ addedBy: req.user._id });

        res.status(200).json({
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            kpis,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch KPIs." });
    }
};

module.exports = { addKpi, getKpi };