const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const pdf = require("html-pdf");
const Application = require("../models/Application");
const Comment = require("../models/Comment");
const User = require("../models/User");
const mongoose = require("mongoose");
const {PDFDocument, rgb} = require('pdf-lib');

const sections = ["bsi", "si", "pr", "pial", "pp", "pfcoi", "sp", "mad", "dmp", "cac", "bfts", "rarm", "oth"];
const fullForms = {
    "bsi": "Basic Study Information",
    "si": "Study Introduction",
    "pr": "Participant Recruitment",
    "pial": "Participating Institutions",
    "pp": "Participant Population",
    "pfcoi": "Conflict of Interests",
    "sp": "Participant Recruitment and Consenting Process",
    "mad": "Materials and Devices",
    "dmp": "Data Management and Storage",
    "cac": "Compensation and Costs",
    "bfts": "Benefits",
    "rarm": "Risks and Risk Mitigation",
    "oth": "Other"
}

// create an array of 13 0s to mark each section as visited or not
async function createPDF(id) {
    try {
        const application = await Application.findOne({
            _id: id,
        });
        //get user
        const user = await User.findOne({
            _id: application.user,
        });

        const name = user.name;

        const json = application.answer;

        const comments = await Comment.find({
            application_id: application.application_id,
        });

        const applicationId = application.application_id;

        var data = {
            questions: [],
            comments: [],
            dirname: path.join(__dirname, ".."),
            name: name,
        };

        let visited = Array(13).fill(0);
        for (const key in json) {
            for (const question in json[key]) {
                // if json[key][question]["answer"] is an object then iterate over it and add it to the answer string
                //check if answer is not an object
                if (question === "pdfFiles" || question === "pdfFileNames") {
                    continue;
                }
                if (
                    json[key][question]["answer"] === null ||
                    json[key][question]["answer"] === undefined ||
                    json[key][question]["answer"] === "" ||
                    json[key][question]["answer"].length === 0
                ) {
                    continue;
                }
                try {
                    let answer;
                    if (json[key][question]["answerText"]) {
                        answer = json[key][question]["answerText"]["text"]
                    } else {
                        answer = json[key][question]["answer"];
                    }
                    if (answer && typeof answer === "string") {
                        answer = answer.trim();
                    }
                    if (json[key][question]["questionText"].trim() === "Anticipated Start Date") {
                        // change the date to local date from UTC date string
                        const utcDate = new Date(answer);
                        answer = utcDate.toLocaleString();
                    }
                    if ((json[key][question]["questionText"].trim() === "Specifically indicate how would you recruit subjects for this project") || (json[key][question]["questionText"].trim() === "Type of consent document(s) to be used") || (json[key][question]["questionText"].trim() === "Types of Assent Documents") || (json[key][question]["questionText"].trim() === "Indicate what types of recording devices will be used to record data from participants by marking all boxes that apply to your study and answering the accompanying questions below.")) {
                        answer = json[key][question]["answerText"];
                    }
                    console.log("question:", question, " , ", json[key][question], " ,answer: ", answer)
                    if (visited[sections.indexOf(key)] === 0) {
                        data["questions"] = [
                            ...data["questions"],
                            {
                                question: fullForms[key],
                                answer: "sectionHeader",
                            },
                        ];
                        visited[sections.indexOf(key)] = 1;
                    }
                    data["questions"] = [
                        ...data["questions"],
                        {
                            question: json[key][question]["questionText"].trim(),
                            answer: answer,
                        },
                    ];
                } catch (err) {
                    console.log(err);
                }
            }
        }
        // sort the final data array according to the order of sections array
        let sortedData = [];
        for (let i = 0; i < sections.length; i++) {
            for (let j = 0; j < data["questions"].length; j++) {
                if (data["questions"][j]["answer"] === "sectionHeader" && data["questions"][j]["question"] === fullForms[sections[i]]) {
                    sortedData.push(data["questions"][j]);
                    for (let k = j + 1; k < data["questions"].length; k++) {
                        if (data["questions"][k]["answer"] === "sectionHeader") {
                            break;
                        }
                        sortedData.push(data["questions"][k]);
                    }
                }
            }
        }
        data["questions"] = sortedData;
        //get all png files in uploads/signatures/applicationId

        let nameOfPDF = "report_" + applicationId + ".pdf";
        // console.log("name: " + nameOfPDF);
        if (comments.length > 0) {
            nameOfPDF = "revisedReport_" + applicationId + ".pdf";
        }

        let folderName = "attachments_" + applicationId;
        let folderPath_ = path.join(
            __dirname,
            "..",
            "uploads/attachments/",
            folderName
        );

        if (application)
            if (comments.length > 0) {
                folderPath_ = path.join(
                    __dirname,
                    "..",
                    "uploads/attachments/",
                    folderName,
                    "revisedApplication"
                );
            }
        fs.mkdirSync(folderPath_, {recursive: true});
        // Render the HTML template using EJS and the data object
        await ejs.renderFile("./templates/irbApplication.html", data, async function (err, html) {
            if (err) {
                throw err;
            }
            var options = {
                format: "Letter",
                childProcessOptions: {
                    env: {
                        OPENSSL_CONF: "/dev/null",
                    },
                },
            };
            // Generate the PDF from the rendered HTML
            await pdf.create(html, options).toFile(path.join(folderPath_, nameOfPDF), function (err, name) {
                if (err) return console.log(err);
                return "success";
            });
        });
        // add the encoded pdf file in pdfFiles array to the report_applicationID.pdf file
        console.log("PDF BAN GAYIII");
        return "success";
    } catch (err) {
        console.log(err);
        return "error:" + err;
    }
}

async function createPDF2(id) {
    try {
        const application = await Application.findOne({
            application_id: mongoose.Types.ObjectId(id),
        });
        const user = await User.findOne({
            _id: application.user,
        });

        const name = user.name;
        const json = application.answer;
        const comments = await Comment.find({
            application_id: application.application_id,
        });

        const applicationId = application.application_id;

        var data = {
            questions: [],
            comments: [],
            dirname: path.join(__dirname, ".."),
            name: name,
        };
        let visited = Array(13).fill(0);

        for (const key in json) {
            for (const question in json[key]) {
                // if json[key][question]["answer"] is an object then iterate over it and add it to the answer string
                //check if answer is not an object
                if (question === "pdfFiles" || question === "pdfFileNames") {
                    continue;
                }
                if (
                    json[key][question]["answer"] === null ||
                    json[key][question]["answer"] === undefined ||
                    json[key][question]["answer"] === "" ||
                    json[key][question]["answer"].length === 0
                ) {
                    continue;
                }
                try {
                    let answer;
                    if (json[key][question]["answerText"]) {
                        answer = json[key][question]["answerText"]["text"]
                    } else {
                        answer = json[key][question]["answer"];
                    }
                    if (answer && typeof answer === "string") {
                        answer = answer.trim();
                    }
                    if (json[key][question]["questionText"].trim() === "Anticipated Start Date") {
                        // change the date to local date from UTC date string
                        const utcDate = new Date(answer);
                        answer = utcDate.toLocaleString();
                    }
                    if ((json[key][question]["questionText"].trim() === "Specifically indicate how would you recruit subjects for this project") || (json[key][question]["questionText"].trim() === "Type of consent document(s) to be used") || (json[key][question]["questionText"].trim() === "Types of Assent Documents") || (json[key][question]["questionText"].trim() === "Indicate what types of recording devices will be used to record data from participants by marking all boxes that apply to your study and answering the accompanying questions below.")) {
                        answer = json[key][question]["answerText"];
                    }
                    console.log("question:", question, " , ", json[key][question], " ,answer: ", answer)
                    if (visited[sections.indexOf(key)] === 0) {
                        data["questions"] = [
                            ...data["questions"],
                            {
                                question: fullForms[key],
                                answer: "sectionHeader",
                            },
                        ];
                        visited[sections.indexOf(key)] = 1;
                    }
                    data["questions"] = [
                        ...data["questions"],
                        {
                            question: json[key][question]["questionText"].trim(),
                            answer: answer,
                        },
                    ];
                } catch (err) {
                    console.log(err);
                }
            }
        }
        // sort the final data array according to the order of sections array
        let sortedData = [];
        for (let i = 0; i < sections.length; i++) {
            for (let j = 0; j < data["questions"].length; j++) {
                if (data["questions"][j]["answer"] === "sectionHeader" && data["questions"][j]["question"] === fullForms[sections[i]]) {
                    sortedData.push(data["questions"][j]);
                    for (let k = j + 1; k < data["questions"].length; k++) {
                        if (data["questions"][k]["answer"] === "sectionHeader") {
                            break;
                        }
                        sortedData.push(data["questions"][k]);
                    }
                }
            }
        }
        data["questions"] = sortedData;
        //get all png files in uploads/signatures/applicationId

        let nameOfPDF = "report_" + applicationId + ".pdf";
        // console.log("name: " + nameOfPDF);

        let folderName = "attachments_" + applicationId;
        let folderPath_ = path.join(
            __dirname,
            "..",
            "uploads/attachments/",
            folderName
        );


        fs.mkdirSync(folderPath_, {recursive: true});
        // Render the HTML template using EJS and the data object
        await ejs.renderFile("./templates/irbApplication.html", data, async function (err, html) {
            if (err) {
                throw err;
            }
            var options = {
                format: "Letter",
                childProcessOptions: {
                    env: {
                        OPENSSL_CONF: "/dev/null",
                    },
                },
            };
            // Generate the PDF from the rendered HTML
            pdf.create(html, options).toFile(path.join(folderPath_, nameOfPDF), function (err, name) {
                if (err) return console.log(err);
                return "success";
            });
        });
        // add the encoded pdf file in pdfFiles array to the report_applicationID.pdf file
        console.log("PDF BAN GAYIII");
        return "success";
    } catch (err) {
        console.log(err);
        return "error:" + err;
    }
}


module.exports = {createPDF, createPDF2};
