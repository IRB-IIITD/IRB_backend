const express = require("express");
const router = express.Router();
const Application = require("../models/Application");
const passport = require("passport");
const Comment = require("../models/Comment");
const {
    authorizedMember,
} = require("../middlewares/irbAuth");
require("../controllers/controller.tokenJWT");

router.post('/addComment', 
    passport.authenticate("jwt_strategy", { session: false }),
    authorizedMember,
    async function(req, res){
        try{
            const applicationId = req.body.applicationId;
            const commentText = req.body.commentText;            

            const comment = await Comment.findOne({
                reviewer: req.user.name,
                application_id: applicationId
            });
            
      const application = await Application.findOne({
        application_id: applicationId,
      });

      if (comment) {
        comment.comment = commentText;
        await comment.save();
      } else {
        const newComment = new Comment({
          application_id: applicationId,
          comment: commentText,
          reviewer: req.user.name,
        });
        await newComment.save();

        application.totalComments += 1;
        await application.save();
      }

      res.status(200).json({ message: "Comment added" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: err.message });
    }
  }
);

router.get('/getComments/:applicationId',
    passport.authenticate("jwt_strategy", { session: false }),
    authorizedMember,
    async function(req, res){
        try{
            const applicationId = req.params.applicationId;
            const comments = await Comment.find({
                application_id: applicationId,
            });
            res.status(200).json(comments);
        } catch(err){
            res.status(500).json({ message: err.message });
        }
    }
);

module.exports = router;
