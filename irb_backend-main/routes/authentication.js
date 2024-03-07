const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
require("../controllers/controller.auth");
require("../controllers/controller.tokenJWT");
require("dotenv/config");
const passport = require("passport");

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] }),
);

const baseFrontendUrl = process.env.FRONTEND_URL;

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    session: false,
  }),
  function (req, res) {
    const token = jwt.sign(
      { user: { email: req.user.email }, id: req.user._id },
      process.env.jwt_secret_key
    );
    res.redirect(`${baseFrontendUrl}/OAuthRedirecting?token=${token}`);
  }
);

router.route("/failure").get((req, res) => {
  res.send("Login failed");
});

module.exports = router;
