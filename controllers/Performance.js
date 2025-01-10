const Performance = require("../models/Performance");

const addPerformance = async (req, res) => {
    try {
        const { kpiId, employeeId, remarks } = req.body;
        const uId = req.user._id;

        if (!kpiId || !employeeId || !remarks) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const newPerformance = new Performance({ kpiId, employeeId, remarks, addedBy: uId });
        await newPerformance.save();

        res.status(201).json({ message: "Performance saved successfully." });
    } catch (error) {
        console.error("Error saving Performance:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

const getPerformance = async (req, res) => {
    try {
        const { page = 1, perPage = 10 } = req.query;
        const uId = req.user._id;

        const skip = (page - 1) * perPage;
        const limit = parseInt(perPage);

        // Perform aggregation to get performance with KPI and Employee details
        const performances = await Performance.aggregate([
            {
                $match: { addedBy: uId }, // Match the user who added the performance
            },
            {
                $lookup: {
                    from: "kpis", // Reference the 'kpis' collection
                    localField: "kpiId",
                    foreignField: "_id",
                    as: "kpiDetails",
                },
            },
            {
                $unwind: "$kpiDetails", // Unwind the KPI details to make it accessible
            },
            {
                $addFields: {
                    convertedId: { $toObjectId: "$employeeId" } // Convert employeeId to ObjectId for lookup
                }
            },
            {
                $lookup: {
                    from: "users", // Reference the 'employees' collection
                    localField: "convertedId",
                    foreignField: "_id",
                    as: "employeeDetails",
                },
            },
            {
                $unwind: "$employeeDetails", // Unwind the employee details to make it accessible
            },
            {
                $project: {
                    _id: 1,
                    remarks: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    employeeName: "$employeeDetails.name", // Extract employee name
                    employeePosition: "$employeeDetails.role", // Extract employee role (position)
                    kpiName: "$kpiDetails.name", // Extract KPI name
                    kpiWeightage: "$kpiDetails.weightage", // Extract KPI weightage
                    kpiGoal: "$kpiDetails.goal", // Extract KPI goal
                    kpiAchievement: "$kpiDetails.achievement", // Extract KPI achievement
                    average: {
                        $cond: {
                            if: { $eq: ["$kpiDetails.goal", 0] }, // Avoid division by 0
                            then: 0,
                            else: {
                                $multiply: [
                                    { $divide: ["$kpiDetails.achievement", "$kpiDetails.goal"] },
                                    10,
                                    "$kpiDetails.weightage",
                                    0.01, // Percentage (weightage / 100)
                                ],
                            },
                        },
                    },
                },
            },
            {
                $skip: skip, // Apply pagination: skip records
            },
            {
                $limit: limit, // Limit the number of records
            },
        ]);

        const total = await Performance.countDocuments({ addedBy: uId }); // Total count of performances

        res.status(200).json({
            performances,
            total,
            totalPages: Math.ceil(total / perPage), // Total pages for pagination
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.error("Error fetching performance data:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = { addPerformance, getPerformance };
