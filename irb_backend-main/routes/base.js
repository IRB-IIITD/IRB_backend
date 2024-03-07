const express = require("express");
const passport = require("passport");
require("../controllers/controller.tokenJWT");
const router = express.Router();
const {
    authorizedAdmin,
} = require("../middlewares/irbAuth");

router.get(
    "/me",
    passport.authenticate("jwt_strategy", {session: false}),
    async (req, res) => {
        res.json(req.user);
    }
);

module.exports = router;
