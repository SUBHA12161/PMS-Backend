const mongoose = require("mongoose");
const Performance = require("../models/Performance");

const addPerformance = async (req, res) => {
    try {
        const { kpiId, weightage, goal, achievement, employeeId, remarks } = req.body;
        const uId = req.user._id;

        if (!kpiId || !employeeId || !weightage || !goal) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const newPerformance = new Performance({ kpiId, employeeId, weightage, goal, manager_achievement: achievement, remarks, addedBy: uId });
        await newPerformance.save();

        res.status(201).json({ message: "Performance saved successfully." });
    } catch (error) {
        console.error("Error saving Performance:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

const getPerformance = async (req, res) => {
    try {
        const { page = 1, perPage = 10, uId } = req.query;

        if (!mongoose.Types.ObjectId.isValid(uId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const skip = (page - 1) * perPage;
        const limit = parseInt(perPage);

        const performances = await Performance.aggregate([
            {
                $match: { employeeId: new mongoose.Types.ObjectId(uId) },
            },
            {
                $lookup: {
                    from: "kpis",
                    localField: "kpiId",
                    foreignField: "_id",
                    as: "kpiDetails",
                },
            },
            {
                $unwind: "$kpiDetails",
            },
            {
                $addFields: {
                    weightageNum: { $toDouble: "$weightage" },
                    goalNum: { $toDouble: "$goal" },
                    achievementNum: {
                        $cond: {
                            if: { $eq: ["$manager_achievement", ""] },
                            then: { $toDouble: 0 },
                            else: { $toDouble: "$manager_achievement" }
                        }
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "employeeId",
                    foreignField: "_id",
                    as: "employeeDetails",
                },
            },
            {
                $unwind: "$employeeDetails",
            },
            {
                $project: {
                    _id: 1,
                    remarks: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    emp_achievement: 1,
                    employeeName: "$employeeDetails.name",
                    employeePosition: "$employeeDetails.role",
                    kpiName: "$kpiDetails.name",
                    weightage: "$weightageNum",
                    goal: "$goalNum",
                    achievement: {
                        $cond: {
                            if: { $eq: ["$manager_achievement", ""] },
                            then: "",
                            else: "$manager_achievement"
                        }
                    },
                    average: {
                        $cond: {
                            if: { $or: [{ $eq: ["$goalNum", 0] }, { $not: "$goalNum" }] },
                            then: 0,
                            else: {
                                $multiply: [
                                    { $divide: ["$achievementNum", "$goalNum"] },
                                    10,
                                    "$weightageNum",
                                    0.01,
                                ],
                            },
                        },
                    },
                },
            },
            {
                $skip: skip,
            },
            {
                $limit: limit,
            },
        ]);

        const total = await Performance.countDocuments({ addedBy: uId });

        res.status(200).json({
            performances,
            total,
            totalPages: Math.ceil(total / perPage),
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.error("Error fetching performance data:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

const updatePerformance = async (req, res) => {
    try {
        const { _id, emp_achievement } = req.body;

        const data = await Performance.updateOne({ _id }, { $set: { emp_achievement } })
        if (data.modifiedCount) {
            res.status(200).json({ Message: "Updated Succesfull." });
        } else {
            res.status(500).json({ message: "Internal server error." });
        }
    } catch (error) {
        console.error("Error in update Performance:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = { addPerformance, getPerformance, updatePerformance };
