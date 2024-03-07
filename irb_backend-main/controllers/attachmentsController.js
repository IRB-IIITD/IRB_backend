const path = require("path");
const fs = require("fs");
const base64 = require("base64topdf");

// Import the Application schema from your database library
const Application = require("../models/Application");
const Comment = require("../models/Comment");

const uploadFiles = async (fileData, name, applicationId) => {
  const appId = applicationId;
  const comment = await Comment.findOne({
    application_id: appId,
  });

  const folderName = `attachments_${appId}`;
  let folderPath = path.join(
    __dirname,
    "..",
    "uploads/attachments/",
    folderName
  );

  if (comment) {
    folderPath = path.join(
      __dirname,
      "..",
      "uploads/attachments/",
      folderName,
      "revisedApplication"
    );
  }

  const fileName = name + "_" + appId;
  const extension = ".pdf";
  const Name = `${fileName}${extension}`;
  fs.mkdirSync(folderPath, { recursive: true });

  try {
    const decodedPdfData = base64.base64Decode(
      fileData,
      path.join(folderPath, Name)
    );
  } catch (err) {
    console.log(err);
  }

  return;
};

async function helperAttachment(_id) {
  const application = await Application.findOne({
    _id: _id,
  });

  let answer = application.answer;

  for (const key in answer) {
    if (answer[key] && answer[key].pdfFiles) {
      for (const file in answer[key].pdfFiles) {
        const fileName = answer[key].pdfFiles[file].name;
        const fileData = answer[key].pdfFiles[file].file.substring(28);
        await uploadFiles(fileData, fileName, application.application_id);
      }
    }
  }

  return;
}

module.exports = {
  uploadFiles,
  helperAttachment,
};
