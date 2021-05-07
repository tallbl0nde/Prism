var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    // Redirect to home page if logged in
    if (req.user) {
        res.redirect('/home');
        return;
    }

    res.locals.title = "Index Page";
    res.locals.text = {
        heading: "Minecraft Login",
        login: "Login",
        rememberMe: "Remember Me"
    };

    res.render('index');
});

router.get('/home', function(req, res, next) {
    // Redirect to index page if not logged in
    if (!req.user) {
        res.redirect('/');
        return;
    }

    res.locals.title = "Home Page";
    res.render('home');
});

module.exports = router;
