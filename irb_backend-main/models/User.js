const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");

const User = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, "can't be blank"],
    match: [/\S+@\S+\.\S+/, "is invalid"],
    index: true,
  },
  // PARAMETER type , which can be IRBAdmin, IRBReviewer & Applicant.
  role: {
    type: String,
    enum: ["IRBAdmin", "IRBMember", "Applicant"],
    default: "Applicant",
  },
});

User.plugin(findOrCreate);

module.exports = mongoose.model("User", User);
