//Requires & global var's
var express = require('express');
var passport = require('../config/passportConfig');
var db = require('../models');
var router = express.Router();

// Routes
router.get('/login', function(req, res) {
    res.render('logInForm');
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    successFlash: 'Winner winner - chicken dinner! Logged in.',
    failureRedirect: '/auth/login',
    failureFlash: 'Wah wah... try again.'
}));

router.get('/signup', function(req, res) {
    res.render('signupform');
});

router.post('/signup', function(req, res, next) {
    db.user.findOrCreate({
        where: { email: req.body.email },
        defaults: {
            'firstName': req.body.firstName,
            'lastName': req.body.lastName,
            'password': req.body.password
        }
    }).spread(function(user, wasCreated) {
        if (wasCreated) {
            //good!
            passport.authenticate('local', {
                successRedirect: '/profile',
                successFlash: 'Account created & logged in, yo!',
                failureRedirect: '/login',
                failureFlash: 'Unknown error occured. Please re-log in.'
            })(req, res, next);
        } else {
            //Bad!
            req.flash('error', 'Email already exists. Please log in, yo!');
            res.redirect('/auth/login');
        }
    }).catch(function(error) {
        req.flash('error', error.message);
        res.redirect('/auth/signup');
    })
});

router.get('/logout', function(req, res) {
    req.logout();
    req.flash('success', 'You logged out.');
    res.redirect('/');
});

//Export
module.exports = router;
