const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");

const Comment = new mongoose.Schema({
    comment: {
        type: String,
        required: true
        // minlength: 5
        // maxlength: 100
    },
    application_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
        required: true
        // minlength: 5
        // maxlength: 100
    },
    reviewer: {
        type: String, 
        required: true
    }
    // section:{
    //     type: String,
    //     required: true
    // } 
});


Comment.plugin(findOrCreate);

module.exports = mongoose.model("Comment", Comment);