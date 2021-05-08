var express = require('express');
var passport = require('passport');
var router = express.Router();

var RememberMeToken = require('../models/remembermetoken');

function handleRememberMe(req, res, next) {
    // Don't remember if not checked
    if (!req.body.remember) {
        return next();
    }

    // Issue remember me token
    let token = new RememberMeToken(req.user.id);
    token.save();
    res.cookie("remember_me", token.token);
    return next();
}

// Check login credentials
router.post('/login', passport.authenticate('local', {
        failureRedirect: '/',
        failureFlash: true
    }), handleRememberMe, function(req, res, next) {
        res.redirect('/home');
    }
);

router.get('/logout', function(req, res, next) {
    // Delete remember me token from database
    if (req.user && req.cookies["remember_me"]) {
        let token = RememberMeToken.findByToken(req.cookies["remember_me"]);
        if (token != null) {
            token.delete();
        }
    }

    // Delete remember me token cookie
    res.clearCookie("remember_me");

    // Logout and redirect to login page
    req.logout();
    res.redirect('/');
});

module.exports = router;