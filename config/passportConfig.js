var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var facebookStrategy = require('passport-facebook').Strategy;
var db = require('../models');

passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    db.user.findById(id).then(function(user) {
        cb(null, user);
    }).catch(cb);
});

passport.use(new localStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, function(email, password, cb) {
    db.user.findOne({
        where: { email: email }
    }).then(function(user) {
        if (!user || !user.isValidPassword(password)) {
            cb(null, false); //No user or bad password
        } else {
            cb(null, user); //User is allowed, yay!
        }
    }).catch(cb);
}));

passport.use(new facebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: process.env.BASE_URL + '/auth/callback/facebook',
    profileFields: ['id', 'email', 'displayName'],
    enableProof: true
}, function(accessToken, refreshToken, profile, cb) {
    //See if we get the email
    var email = profile.emails ? profile.emails[0].value : null;

    //See if the user exists in the databass
    db.user.findOne({
        where: { email: email }
    }).then(function(existingUser) {
        //Thi sperson has logged in before
        if (existingUser && email) {
            existingUser.updateAttributes({
                facebookId: profile.id,
                facebookToken: accessToken
            }).then(function(updatedUser) {
                cb(null, updatedUser);
            }).catch(cb);
        } else {
            //This person is new & we need an entry for them on the users table
            db.user.findOrCreate({
                where: { facebookId: profile.id },
                defaults: {
                    facebookToken: accessToken,
                    email: email,
                    firstName: profile.displayName.split(' ')[0],
                    lastName: profile.displayName.split(' ')[1]
                }
            }).spread(function(user, wasCreated) {
                if (wasCreated) {
                    //They were new & so we created a new user
                    cb(null, user);
                } else {
                    //They were not new afterall
                    user.facebookToken = accessToken;
                    user.save().then(function() {
                        cb(null, user);
                    }).catch(cb);
                }
            }).catch(cb);
        }
    });
}));

module.exports = passport;
