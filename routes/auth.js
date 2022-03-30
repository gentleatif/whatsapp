const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const bodyParser = require("body-parser");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const MongoStore = require("connect-mongo");
const session = require("express-session");
// url = "https://whatsapp-2-0.herokuapp.com";
url = "http://localhost:8000";
const mongoUrl =
  "mongodb+srv://hamlit:a9507920T@cluster0.jw9ud.mongodb.net/bookDB?retryWrites=true&w=majority";
const passport = require("passport");
const cookieParser = require("cookie-parser");
// mongodb connection

// mongoose connection
mongoose.connect(mongoUrl, function (err, db) {
  if (err) {
    console.log(err);
  } else {
    console.log("DB connected Succussfully");
  }
});

router.use(
  session({
    cookie: {
      maxAge: 31556952000,
    },
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoUrl, ttl: 365 * 24 * 60 * 60 }),
  })
);
router.use(passport.initialize());
router.use(passport.session());
router.use(function (req, res, next) {
  next();
});

const userSchema = mongoose.Schema({
  uid: String,
  email: String,
  name: String,
  pic: String,
});
const User = mongoose.model("User", userSchema);
// used to serialize the user for the session

// route middleware to make sure user login
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();

  // if they aren't redirect them to the home page
  res.redirect("/");
}
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
passport.serializeUser(function (user, done) {
  done(null, user.id);
  // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
// google startegy
passport.use(
  new GoogleStrategy(
    {
      clientID:
        "927158530936-nrt2la41km9tq59jc5jggmqmns9li4oe.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: `${url}/google/callback`,
    },
    function (accessToken, refreshToken, profile, done) {
      // getting profile info from here
      const profileJson = profile._json;

      // asynchronous
      process.nextTick(function () {
        // find the user in the database based on their facebook id
        User.findOne({ uid: profile.id }, function (err, user) {
          // if there is an error, stop everything and return that
          // ie an error connecting to the database
          if (err) return done(err);

          // if the user is found, then log them in
          if (user) {
            return done(null, user); // user found, return that user
          } else {
            // console.log("below is new profile dtls");

            // console.log(profile);

            // if there is no user found with that facebook id, create them
            var newUser = new User();
            // set all of the facebook information in our user model
            // console.log(profile);
            newUser.uid = profile.id;
            // // newUser.token = token; // we will save the token that facebook provides to the user
            newUser.name = profile.displayName;
            newUser.email = profile.emails[0].value;
            newUser.pic = profile.photos[0].value;
            // save our user to the database
            newUser.save(function (err) {
              if (err) throw err;

              // if successful, return the new user
              return done(null, newUser);
            });
          }
        });
      });
    }
  )
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    successRedirect: "/scan",
  })
);
// google startegy end
module.exports = router;
