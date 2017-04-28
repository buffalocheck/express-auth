module.exports = function(req, res, next) {
    if (!req.user) {
        req.flash('error', 'You need to be logged in to see this page, yo!');
        res.redirect('/auth/login'); //Slow down champ!
    } else {
        next(); //Good to go. Proceed as planned.
    }
}
