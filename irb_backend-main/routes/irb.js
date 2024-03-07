const router = require("express").Router();
const passport = require("passport");
const Application = require("../models/Application");
const { authorizedMember, authorizedAdmin } = require("../middlewares/irbAuth");
const User = require("../models/User");
const path = require("path");
const Comment = require("../models/Comment");
const { sendMail, html2doc, htmlToPdf } = require("../utils/helpers");
const fs = require("fs");
router.get("/submitted", passport.authenticate("jwt_strategy", { session: false }), authorizedMember, async (req, res) => {
    try {
        const applications = await Application.find({
            pending: false,
            approved: false,
        }).populate("user");

        res.status(200).json(applications);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err });
    }
});

router.post("/approveApplication", passport.authenticate("jwt_strategy", { session: false }), authorizedAdmin, async function (req, res) {
    try {
        const applicationId = req.body.applicationId;
        const application = await Application.findOne({
            application_id: applicationId,
        });

        let message = `Application ${applicationId} does not exist`;
        if (application) {
            application.approved = true;
            await application.save();
            message = `Application Approved ${applicationId}`;
        }

        res.status(200).json({ message: message });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err });
    }
});

router.get("/saveCommentsPdf/:applicationId", passport.authenticate("jwt_strategy", { session: false }), async (req, res) => {
    try {
        const applicationId = req.params.applicationId;
        const application = await Application.findOne({
            application_id: applicationId,
        });

        const comments = await Comment.find({
            application_id: applicationId,
        });

        let data = { comments: [], name: "", title: "" };
        for (const comment of comments) {
            data["comments"] = [
                ...data["comments"],
                {
                    reviewer: comment.reviewer,
                    section: comment.section,
                    comment: comment.comment,
                },
            ];
        }

        const user = await User.findOne({
            _id: application.user,
        });

        data["name"] = user.name;
        data["title"] = application.answer.bsi.studyTitle.answer;
        let folderName = applicationId + "_comments";
        let folderPath_ = path.join(__dirname, "..", "commentsDocFiles/", folderName);
        await fs.mkdirSync(folderPath_, { recursive: true });
        setTimeout(async () => {
            await htmlToPdf(data, applicationId);
            res.status(200).json({message: "PDF saved successfully"});
        }, 3000);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err });
    }
});

router.get(
    "/getCommentsPdf/:applicationId",
    passport.authenticate("jwt_strategy", { session: false }),
    // authorizedAdmin,
    async (req, res) => {
        try {
            const applicationId = req.params.applicationId;
            let nameOfPDF = applicationId + "_comments.pdf";
            let folderName = applicationId + "_comments";
            let folderPath_ = path.join(__dirname, "..", "commentsDocFiles/", folderName);
            if (fs.existsSync(folderPath_)) {
                console.log("folder exists");
                const fileData = fs.readFileSync(path.join(folderPath_, nameOfPDF));
                const base64Data = Buffer.from(fileData).toString("base64");
                const dataUrl = `data:application/pdf;base64,${base64Data}`;
                res.status(200).json({ dataUrl: dataUrl });
            } else {
                res.status(500).json({ message: "File not found" });
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: err });
        }
    }
);
router.get(
    "/getApprovedApplications",
    passport.authenticate("jwt_strategy", { session: false }),
    authorizedAdmin,
    authorizedMember,
    async (req, res) => {
        try {
            const applications = await Application.find({
                approved: true,
            }).populate("user");

            res.status(200).json(applications);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: err });
        }
    }
);

router.post("/members/add", passport.authenticate("jwt_strategy", { session: false }), authorizedAdmin, async function (req, res) {
    try {
        const name = req.body.name;
        const email = req.body.email;

        //check if it exists then make it IRBReviewer or create the user with the same role
        const user = await User.findOne({
            email: email,
        });

        if (user) {
            user.role = "IRBMember";
            await user.save();
        } else {
            const newUser = new User({
                email: email,
                name: name,
                role: "IRBMember",
            });
            await newUser.save();
        }

        res.status(200).json({ message: "IRB Member Added: " + email });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/members/list", passport.authenticate("jwt_strategy", { session: false }), authorizedAdmin, async (req, res) => {
    try {
        const users = await User.find({
            role: "IRBMember",
        });

        return res.status(200).json(users);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

router.post("/members/remove", passport.authenticate("jwt_strategy", { session: false }), authorizedAdmin, async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({
            email: email,
        });

        let message = "";
        if (user) {
            user.role = "Applicant";
            await user.save();
            message = "IRB Member Removed: " + email;
        } else {
            //user not found error
            message = "User not found";
        }

        return res.status(200).json({ message: message });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
});

router.post("/sendComments", passport.authenticate("jwt_strategy", { session: false }), authorizedAdmin, async (req, res) => {
    const comments = await Comment.find({
        application_id: req.body.applicationId,
    });

    const application = await Application.findOne({
        application_id: req.body.applicationId,
    });

    application.pending = true;
    await application.save();

    const user = await User.findOne({
        _id: application.user,
    });

    let studyTitle = application.answer.bsi.studyTitle.answer;

    const response = await sendMail(user.email, `Reviews on your Application: ${studyTitle}`, comments);

    res.status(200).json({ message: "Email Sent Successfully" });
});

module.exports = router;
