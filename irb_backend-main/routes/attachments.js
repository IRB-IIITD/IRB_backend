const fs = require("fs");
const {joinPdfs} = require("../utils/helpers");
const path = require("path");
const router = require("express").Router();
require("../controllers/controller.tokenJWT");
const Comment = require("../models/Comment");
const {rearrange} = require("../utils/helpers");
const pdf2base64 = require("pdf-to-base64");
const passport = require("passport");
const base64topdf = require('base64topdf');

const {
    authorizedMember,
} = require("../middlewares/irbAuth");
const Application = require("../models/Application");
const mongoose = require("mongoose");
const {PDFDocument} = require("pdf-lib");

router.get(
    "/download-attachments/:applicationId",
    passport.authenticate('jwt_strategy', {session: false}),
    authorizedMember,
    async (req, res) => {
        try {
            const applicationId = req.params.applicationId;
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
);

module.exports = router;
