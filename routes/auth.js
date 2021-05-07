var express = require('express');
var passport = require('passport');
var router = express.Router();

// Check login credentials
router.post('/login', passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/',
        failureFlash: true
    }),
);

router.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/');
});

module.exports = router;