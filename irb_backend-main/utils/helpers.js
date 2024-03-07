const nodemailer = require("nodemailer");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const ejs = require("ejs");
const pdf = require("html-pdf");
const path = require("path");
const { Buffer } = require("buffer");
const htmlToDocx = require("html-to-docx");
const { message, summary } = require("../utils/constants");
require("dotenv/config");

async function rearrange(pdfFiles, appId, flag) {
    const reportFilename = `report_${appId}.pdf`;
    const revisedReportFilename = `revisedReport_${appId}.pdf`;
    const assuranceFormFilename = `assuranceForm_${appId}.pdf`;

    let newPdfFiles = [];

    // Push the report file to the beginning of the new array (if it exists)
    const reportIndex = pdfFiles.indexOf(reportFilename);
    if (reportIndex >= 0) {
        newPdfFiles.push(pdfFiles[reportIndex]);
    } else if (flag) {
        // If flag is true and the report file does not exist, try to find the revised report file
        const revisedReportIndex = pdfFiles.indexOf(revisedReportFilename);
        if (revisedReportIndex >= 0) {
            newPdfFiles.push(pdfFiles[revisedReportIndex]);
        }
    }

    // Push the assurance form file to the new array (if it exists)
    const assuranceFormIndex = pdfFiles.indexOf(assuranceFormFilename);
    if (assuranceFormIndex >= 0) {
        newPdfFiles.push(pdfFiles[assuranceFormIndex]);
    }

    // Push the remaining files in the original order
    newPdfFiles = newPdfFiles.concat(
        pdfFiles.filter((filename, index) => {
            return filename !== reportFilename && filename !== revisedReportFilename && filename !== assuranceFormFilename;
        })
    );

    return newPdfFiles;
}

async function joinPdfs(pdfFilePaths) {
    const pdfDoc = await PDFDocument.create();
    for (const pdfFilePath of pdfFilePaths) {
        const pdfBytes = await fs.promises.readFile(pdfFilePath);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await pdfDoc.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => pdfDoc.addPage(page));
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

async function sendMail(to, subject, comments) {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.SENDER_EMAIL,
            pass: process.env.SENDER_EMAIL_PASSWORD,
        },
    });

    let text = message;

    for (var i = 0; i < comments.length; i++) {
        text += `Reviewer-${i + 1}` + "\n";
        text += comments[i].comment;
        text += "\n\n";
    }

    text += summary;

    // Define email options
    let mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: to,
        subject: subject,
        text: text,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.status(500).json({ message: "Error While Sending Email" });
        } else {
            res.status(200).json({ message: "Success" });
        }
    });
}

async function html2doc(data, applicationId) {
    const template = fs.readFileSync(path.join(__dirname, "..", "templates/commentsTemplate.html"), "utf-8");

    const compiledTemplate = ejs.compile(template);

    const renderedHtml = compiledTemplate(data);

    const docxBuffer = await htmlToDocx(renderedHtml);

    const docxFilePath = path.join(__dirname, "..", "commentsDocFiles/" + applicationId + "_comments.docx");

    fs.mkdirSync(path.join(__dirname, "..", "commentsDocFiles"), {
        recursive: true,
    });
    fs.writeFileSync(docxFilePath, docxBuffer);

    const fileData = fs.readFileSync(docxFilePath);

    const base64Data = Buffer.from(fileData).toString("base64");

    const mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return dataUrl;
}

async function htmlToPdf(data, applicationId) {
    let nameOfPDF = applicationId + "_comments.pdf";
    let folderName = applicationId + "_comments";
    let folderPath_ = path.join(__dirname, "..", "commentsDocFiles/", folderName);
    // fs.mkdirSync(folderPath_, { recursive: true });
    await ejs.renderFile("./templates/commentsTemplate.html", data, async function (err, html) {
        if (err) {
            console.log(err);
        } else {
            var options = {
                format: "Letter",
                childProcessOptions: {
                    env: {
                        OPENSSL_CONF: "/dev/null",
                    },
                },
            };
            await pdf.create(html, options).toFile(path.join(folderPath_, nameOfPDF), function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("File created successfully");
                }
            });
        }
    });
}

module.exports = {
    rearrange,
    sendMail,
    html2doc,
    joinPdfs,
    htmlToPdf,
};
