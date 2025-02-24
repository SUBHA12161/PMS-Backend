const Employee = require('../models/User');

const registerUser = async (req, res) => {
    const { name, email, designation, managerId, password } = req.body;

    try {
        const validManagerId = managerId === "" ? null : managerId;

        const newEmployee = new Employee({
            name,
            email,
            role: designation,
            manager_id: validManagerId,
            password,
            subordinates: [],
            ratings: [],
        });

        await newEmployee.save();

        if (validManagerId) {
            const manager = await Employee.findById(validManagerId);
            if (manager) {
                manager.subordinates.push(newEmployee._id);
                await manager.save();
            }
        }

        res.status(201).json({ message: 'Employee added successfully', employee: newEmployee });
    } catch (error) {
        res.status(500).json({ message: 'Error adding employee', error });
    }
};

const getEmployee = async (req, res) => {
    try {
        const { managerId, page = 1, perPage = 10 } = req.query;

        const query = managerId ? { manager_id: managerId } : {};
        const skip = (parseInt(page) - 1) * parseInt(perPage);
        const limit = parseInt(perPage);

        const employees = await Employee.find(query).skip(skip).limit(limit);
        const total = await Employee.countDocuments(query);

        res.json({ employees, total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching employees" });
    }
};

const getEmployeeCount = async (req, res) => {
    try {
        const { role, manager_id, _id } = req.user;

        if (role === "Admin" || role === "CEO") {
            const stats = await Employee.aggregate([
                {
                    $group: {
                        _id: "$role",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        role: "$_id",
                        count: 1,
                        _id: 0,
                    },
                },
            ]);

            const totalUsers = await Employee.countDocuments();

            return res.json({ totalUsers, roleCounts: stats });
        } else if (role !== "Executives/Associates") {
            const stats = await Employee.aggregate([
                {
                    $match: {
                        manager_id: _id,
                    },
                },
                {
                    $group: {
                        _id: "$role",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        role: "$_id",
                        count: 1,
                        _id: 0,
                    },
                },
            ]);

            const totalUsers = await Employee.countDocuments({
                manager_id: manager_id,
            });

            return res.json({
                totalUsers,
                roleCounts: stats,
            });
        } else {
            return res.json({
                totalUsers: 0,
                roleCounts: 0,
            });
        }
    } catch (error) {
        console.error("Error fetching employee stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { registerUser, getEmployee, getEmployeeCount };