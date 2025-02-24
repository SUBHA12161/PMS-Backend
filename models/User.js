const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    role: {
        type: String,
        enum: ["CEO", "Program Head", "Program Manager", "Business Manager", "Manager", "Executives/Associates", "Admin"],
        default: "Executives/Associates",
    },
    isGoogleAccount: { type: Boolean, default: false },
    manager_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
        default: null
    },
    subordinates: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    ratings: [
        {
            kpi_id: String,
            self_rating: Number,
            manager_rating: Number,
            weightage: Number,
            comments: String,
            manager_remarks: String,
        },
    ],
    overall_performance_rating: { type: Number, default: 0 },
});

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password") || this.isGoogleAccount || !this.password) {
        return next();
    }
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (err) {
        next(err);
    }
});

UserSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);