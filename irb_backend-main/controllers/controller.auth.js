const express = require("express");
const passport = require("passport");
const router = express.Router();
const GoogleStrategy = require("passport-google-oauth2").Strategy;
require("dotenv/config");
const User = require("../models/User");
require("./controller.tokenJWT");
const googleAuth = require("../routes/authentication");

const passportConfig = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
    passReqToCallback: true,
};

passport.use(
    new GoogleStrategy(passportConfig, function (
        request,
        accessToken,
        refreshToken,
        profile,
        done
    ) {
    if (profile._json.domain === "iiitd.ac.in"){
        if(profile._json.email == process.env.ADMIN_EMAIL){
            User.findOrCreate(
                {email: profile._json.email},
                {name: profile.displayName, email: profile._json.email, type: "IRBAdmin"},
                function (err, user) {
                    return done(err, user);
                }
            );
        }else{
            User.findOrCreate(
                {email: profile._json.email},
                {name: profile.displayName, email: profile._json.email, type: "Applicant"},
                function (err, user) {
                    return done(err, user);
                }
            );
        }
    }else{
        return done(new Error("Invalid Host Domain"));
    }
})
);

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.serializeUser(function (user, done) {
    done(null, user);
});

module.exports = router;
