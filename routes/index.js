var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.locals.title = "Index Page";
    res.locals.text = {
        heading: "Minecraft Login",
        login: "Login",
        rememberMe: "Remember Me"
    };

    res.render('index');
});

router.get('/home', function(req, res, next) {
    if (!req.user) {
        res.redirect('/');
        return;
    }

    res.locals.title = "Home Page";

    res.render('home');
});

module.exports = router;
