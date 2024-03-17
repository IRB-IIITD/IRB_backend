const express = require("express");
const router = express.Router();
const Application = require("../models/Application");
const passport = require("passport");
const User = require("../models/User");
const mongoose = require("mongoose");
const fs = require('fs');
const path = require('path');
require("../controllers/controller.tokenJWT");
const {createPDF, createPDF2} = require("../controllers/pdfController");
const pdf2base64 = require("pdf-to-base64");
const {PDFDocument} = require('pdf-lib');

router.post(
    "/",
    passport.authenticate("jwt_strategy", {session: false}),
    async (req, res) => {
        try {
            const answer = req.body.data;
            const applicationId = req.body.applicationId;
            let savedApplication;
            if (applicationId) {
                console.log("applicationId: ", applicationId)
                const existingApplication = await Application.findOne({
                    application_id: applicationId,
                });
                existingApplication.answer = answer;
                savedApplication = await existingApplication.save();
            } else {
                const application = new Application({
                    application_id: mongoose.Types.ObjectId(),
                    user: req.user._id,
                    answer: answer,
                });
                savedApplication = await application.save();
            }
            res.header('Access-Control-Allow-Origin', '*');
            res.status(200).json(savedApplication);
        } catch (err) {
            res.status(500).json({message: "Internal Server Error"});
            console.log(err);
        }
    }
);

router.get(
    "/pending",
    passport.authenticate("jwt_strategy", {session: false}),
    async (req, res) => {
        try {
            const applications = await Application.find({
                user: req.user._id,
                pending: true,
                approved: false,
            }).populate("user");

            res.status(200).json(applications);
        } catch (err) {
            console.log(err);
            res.status(500).json({message: err});
        }
    }
);

router.delete(
    "/delete/:userId",
    passport.authenticate("jwt_strategy", {session: false}),
    async (req, res) => {
        try {
            const userId = req.params.userId;
            const deletedApplications = await Application.deleteMany({
                user: userId,
            });
            res.status(200).json({message: "Applications deleted"});
        } catch (err) {
            res.status(500).json({message: err.messge});
        }
    }
)


router.delete(
    "/delete",
    passport.authenticate("jwt_strategy", {session: false}),
    async (req, res) => {
        try {
            const applicationId = req.body.applicationId;
            const deletedApplication = await Application.findOneAndDelete({
                application_id: applicationId,
            });
            //delete the folder in uploads/attachments_appId

            if (deletedApplication) {
                const dir = path.join(
                    __dirname,
                    `../uploads/attachments_${applicationId}`
                );

                if (fs.existsSync(dir)) {
                    fs.rmdirSync(dir, {recursive: true});
                }

                //delete finalpdfs/appId.pdf
                const finalPdfPath = path.join(
                    __dirname,
                    `../finalpdfs/${applicationId}.pdf`
                );

                if (fs.existsSync(finalPdfPath)) {
                    fs.unlinkSync(finalPdfPath);
                }
            }

            res.status(200).json({message: "Application deleted"});
        } catch (err) {
            res.status(500).json({message: err.messge});
        }
    }
);

router.get(
    "/submitted",
    passport.authenticate("jwt_strategy", {session: false}),
    async (req, res) => {
        try {
            const applications = await Application.find({
                user: req.user._id,
                // pending: false,
                approved: false,
            }).populate("user");

            res.status(200).json(applications);
        } catch (err) {
            console.log(err);
            res.status(500).json({message: err});
        }
    }
);

router.get(
    "/approved",
    passport.authenticate("jwt_strategy", {session: false}),
    async (req, res) => {
        try {
            const applications = await Application.find({
                user: req.user._id,
                pending: false,
                approved: true,
            }).populate("user");

            res.status(200).json(applications);
        } catch (err) {
            console.log(err);
            res.status(500).json({message: err});
        }
    }
);

router.get(
    "/submit/:applicationId",
    passport.authenticate("jwt_strategy", {session: false}),
    async (req, res) => {
        try {
            const application = await Application.findOne({
                application_id: req.params.applicationId,
            });

            // if (application.pending) {
            //     application.pending = false;
            await application.save();
            // }

            res.status(200).json(application);
        } catch (err) {
            res.status(500).json({message: err.message});
        }
    }
);

router.get(
    "/:applicationId",
    passport.authenticate("jwt_strategy", {session: false}),
    async (req, res) => {
        try {
            console.log("applicationId: ", req.params.applicationId);
            const application = await Application.findOne({
                application_id: mongoose.Types.ObjectId(req.params.applicationId),
            });
            res.json(application);
        } catch (err) {
            res.status(500).json({message: "Internal Server Error"});
            console.log(err);
        }
    }
);


router.get(
    "/savepdf/:applicationId",
    passport.authenticate("jwt_strategy", {session: false}),
    async (req, res) => {
        try {
            const applicationId = req.params.applicationId;
            setTimeout(async () => {
                await createPDF2(applicationId);
                res.status(200).json({message: "PDF saved successfully"});
            }, 3000);
        } catch (err) {
            res.status(500).json({message: "Internal Server Error"});
            console.log(err);
        }
    }
)

router.get(
    "/getpdf/:applicationId",
    passport.authenticate("jwt_strategy", {session: false}),
    async (req, res) => {
        try {
            const applicationId = req.params.applicationId;
            // print(applicationId, " ---- Application ID")
            const application = await Application.findOne({
                application_id: mongoose.Types.ObjectId(applicationId),
            });
            const json = application.answer;
            const pdfFilePath = path.join(
                __dirname,
                `../uploads/attachments/attachments_${applicationId}/report_${applicationId}.pdf`
            );
            if (fs.existsSync(pdfFilePath)) {
                await pdf2base64(pdfFilePath)
                    .then(
                        async (response) => {
                            let pdfFiles = [];
                            pdfFiles.push(response);
                            if (json["si"]) {
                                for (let pdfs in json["si"]["pdfFiles"]) {
                                    pdfFiles.push(json["si"]["pdfFiles"][pdfs].file.substring(28));
                                }
                            }
                            if (json["sp"]) {
                                for (let pdfs in json["sp"]["pdfFiles"]) {
                                    pdfFiles.push(json["sp"]["pdfFiles"][pdfs].file.substring(28));
                                }
                            }
                            if (json["mad"]) {
                                for (let pdfs in json["mad"]["pdfFiles"]) {
                                    pdfFiles.push(json["mad"]["pdfFiles"][pdfs].file.substring(28));
                                }
                            }
                            if (json["oth"]) {
                                for (let pdfs in json["oth"]["pdfFiles"]) {
                                    pdfFiles.push(json["oth"]["pdfFiles"][pdfs].file.substring(28));
                                }
                            }
                            // console.log(pdfFiles, "pdfFiles")
                            const pdfBuffers = pdfFiles.map((pdfFile) => Buffer.from(pdfFile, 'base64'));// Create a new PDF document
                            const mergedPDF = await PDFDocument.create();
                            for (const pdfBuffer of pdfBuffers) {
                                // Load each PDF
                                const pdfDoc = await PDFDocument.load(pdfBuffer);

                                // Iterate through the pages and copy them to the merged PDF
                                const pages = await mergedPDF.copyPages(pdfDoc, pdfDoc.getPageIndices());
                                pages.forEach((page) => {
                                    mergedPDF.addPage(page);
                                });
                            }
                            // Serialize the merged PDF to a binary buffer
                            const mergedPDFBuffer = await mergedPDF.save();
                            // Encode the merged PDF back to Base64
                            const mergedBase64PDF = Buffer.from(mergedPDFBuffer).toString('base64');

                            res.status(200).json({
                                pdfDecodedStringUrl: `data:application/pdf;base64,${mergedBase64PDF}`
                            });
                        }
                    )
                    .catch(
                        (err) => {
                            res.status(500).json({message: "Internal Server Error"});
                            console.log(err);
                        }
                    )
            } else {
                res.status(500).json({message: "Internal Server Error"});
            }
        } catch (err) {
            res.status(500).json({message: "Internal Server Error"});
            console.log(err);
        }
    }
)

module.exports = router;
