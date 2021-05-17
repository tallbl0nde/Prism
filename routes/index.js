var express = require('express');
var passport = require('passport');
var router = express.Router();

var RememberMeToken = require('../models/remembermetoken');

// GET /
// Renders the dashboard view.
router.get('/', function(req, res, next) {
    res.render('dashboard');
});

// GET /login
// Renders the login page.
router.get('/login', function(req, res, next) {
    // Redirect to dashboard if logged in
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }

    res.locals.title = "Index Page";
    res.locals.text = {
        login: "Login",
        rememberMe: "Remember Me"
    };
    res.render('login');
});

// POST /login
// Checks the provided credentials and authenticates the
// user if correct, otherwise redirects back to /login.
router.post('/login',
    // Check credentials
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true
    }),

    // Handle the remember me checkbox
    function (req, res, next) {
        // Don't remember if not checked
        if (!req.body.remember) {
            return next();
        }

        // Issue remember me token
        let token = new RememberMeToken(req.user.id);
        token.save();
        res.cookie("remember_me", token.token);
        return next();

    },

    // Redirect to dashboard
    function(req, res, next) {
        res.redirect('/');
    }
);

// GET /logout
// Logs the user out (if logged in), and redirects
// to the login page.
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
    res.redirect('/login');
});

module.exports = router;