const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authentication");
const baseRoutes = require("./routes/base");
const applicationRoutes = require("./routes/application");
const commentRoute = require("./routes/Comment");
const attachmentsRoute = require("./routes/attachments");
const morgan = require("morgan");
const cors = require("cors");
const Application = require("./models/Application");
const {helperAttachment} = require("./controllers/attachmentsController");
const {createPDF} = require("./controllers/pdfController");
const irbRoute = require("./routes/irb");

app.use(cors());

require("dotenv/config");

app.use(morgan("dev"));

app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({extended: true, limit: "50mb"}));

app.use("/", baseRoutes);
app.use("/auth", authRoutes);
app.use("/getpdf", attachmentsRoute);
app.use("/application", applicationRoutes);
app.use("/comment", commentRoute);
app.use("/irb", irbRoute);

app.route("/").get(
    async (req, res) => {
        res.send("Hello I am running");
    });

app.listen(process.env.PORT || 8000, async () => {
    console.log(`Running app on port ${process.env.PORT || "8000"}`);
    await mongoose
        .connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log("Connected to Mongo!");
            const changeStream = Application.watch({fullDocument: "updateLookup"});
            changeStream.on("change", async (change) => {
                if (
                    change.operationType === "update" &&
                    change.updateDescription.updatedFields.pending === false
                ) {
                    console.log("change stream triggered")
                    const id = change.documentKey._id.toString();
                    console.log("app.js id: ", id)
                    await createPDF(id);
                    await helperAttachment(id);
                }
            });
        })
        .catch((err) => {
            console.error("Error connecting to mongo", err);
        });
});
