var express = require('express');
var path = require('path');
var sharp = require('sharp')
var router = express.Router();

// Helper returning the month as a string
function getMonthString(month) {
    if (month > 11) {
        return "Invalid";
    }

    return [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ][month];
}

// GET /
// Renders the account view.
router.get('/', function(req, res, next) {
    let d = new Date(req.user.createdTimestamp * 1000);
    res.locals.joinDate = `Joined on ${getMonthString(d.getMonth())} ${d.getDate()}, ${d.getFullYear().toString()}`;
    res.render('account');
});

// POST /password
// Updates the user's password.
router.post('/password', function(req, res, next) {
    // Check if current password is correct
    if (req.user.verifyPassword(req.body.old) === false) {
        req.flash('error', 'Incorrect password.');
        return res.redirect('/account');
    }

    // Ensure password is long enough
    if (req.body.new.length < 8) {
        req.flash('error', 'New password is too short, please provide a new password containing at least 8 characters.');
        return res.redirect('/account');
    }

    // Set new password
    req.user.setNewPassword(req.body.new);
    try {
        req.user.save();
    } catch (err) {
        console.log("Couldn't update password: " + err.message);
        req.flash('error', 'An error occurred changing your password. Please try again later.');
        return res.redirect('/account');
    }

    req.flash('info', 'Password changed successfully!');
    res.redirect('/account');
});

module.exports = router;
