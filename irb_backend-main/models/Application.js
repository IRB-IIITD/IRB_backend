const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");
const User = require("./User");

const Application = new mongoose.Schema({
    application_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
        required: true,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    answer: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    pending: {
        type: Boolean,
        default: true,
    },
    totalComments:{
        type: Number,
        default: 0,
    },
    approved: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

Application.plugin(findOrCreate);

module.exports = mongoose.model("Application", Application);