const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config();

const app = express();

// Middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
});

app.use(cors('*'));
app.use(bodyParser.json());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(helmet());
app.use(limiter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// API Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/emp", require("./routes/employeeRoutes"));
app.use("/api/kpi", require("./routes/kpiRoutes"));
app.use("/api/Performance", require("./routes/Performance"));

// Serve React frontend
app.get("/", (req, res) => {
    res.send("Backend Running..")
});



app.post('/reviews/self', async (req, res) => {
    const { employeeId, kpiId, selfRating, comments } = req.body;

    try {
        const employee = await Employee.findById(employeeId);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        // Update or add self-rating
        const existingRating = employee.ratings.find(r => r.kpi_id === kpiId);
        if (existingRating) {
            existingRating.self_rating = selfRating;
            existingRating.comments = comments;
        } else {
            employee.ratings.push({ kpi_id: kpiId, self_rating: selfRating, comments });
        }

        await employee.save();
        res.status(200).json({ message: 'Self-review submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting self-review', error });
    }
});

app.post('/reviews/manager', async (req, res) => {
    const { managerId, subordinateId, kpiId, managerRating, remarks } = req.body;

    try {
        // Verify the manager-subordinate relationship
        const manager = await Employee.findById(managerId);
        if (!manager || !manager.subordinates.includes(subordinateId)) {
            return res.status(403).json({ message: 'Unauthorized to rate this employee' });
        }

        const subordinate = await Employee.findById(subordinateId);
        if (!subordinate) return res.status(404).json({ message: 'Subordinate not found' });

        // Update or add manager rating
        const existingRating = subordinate.ratings.find(r => r.kpi_id === kpiId);
        if (existingRating) {
            existingRating.manager_rating = managerRating;
            existingRating.manager_remarks = remarks;
        } else {
            subordinate.ratings.push({ kpi_id: kpiId, manager_rating: managerRating, manager_remarks: remarks });
        }

        await subordinate.save();
        res.status(200).json({ message: 'Manager review submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting manager review', error });
    }
});

app.get('/reviews/:employeeId', async (req, res) => {
    const { employeeId } = req.params;

    try {
        const employee = await Employee.findById(employeeId).populate('subordinates');

        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const totalRatings = employee.ratings.reduce((sum, r) => sum + (r.manager_rating || 0), 0);
        const overallPerformanceRating = totalRatings / (employee.ratings.length || 1);

        employee.overall_performance_rating = overallPerformanceRating; // Optionally update the database
        await employee.save();

        res.status(200).json({
            ratings: employee.ratings,
            subordinates: employee.subordinates,
            overall_performance_rating: overallPerformanceRating,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error });
    }
});


app.get('/reviews/overall/:employeeId', async (req, res) => {
    const { employeeId } = req.params;

    try {
        const employee = await Employee.findById(employeeId);

        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const totalRatings = employee.ratings.reduce((sum, r) => sum + (r.manager_rating || 0), 0);
        const overallPerformanceRating = totalRatings / (employee.ratings.length || 1);
        res.status(200).json({ overallPerformanceRating });
    } catch (error) {
        res.status(500).json({ message: 'Error saving overall review', error });
    }
});
const Employee = require('./models/User');

app.get("/managers", async (req, res) => {
    try {
        const managers = await Employee.find({ role: { $in: ["CEO", "Program Head", "Program Manager", "Business Manager", "Manager"] } }).select("name _id");
        res.json({ employees: managers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching managers" });
    }
});

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection failed:", err));

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));