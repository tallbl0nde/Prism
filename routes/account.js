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

// POST /image
// Updates the user's image.
router.post('/image', function(req, res, next) {
    // Create file path from user id
    let filepath = path.join("public/images/users", req.user.id.toString() + ".jpg");

    // Resize image to requested size and write to filesystem
    const oldImage = req.body.data.split(";base64,").pop();
    sharp(Buffer.from(oldImage, "base64"))
        .jpeg()
        .resize(200, 200)
        .toFile(filepath)
        .then(() => {
            // Update database
            req.user.imagePath = filepath;
            try {
                req.user.save();
            } catch (err) {
                req.flash('error', "The new image couldn't be added to the database. Please try again later.");
                return res.redirect('/account');
            }

            // Redirect back
            req.flash('info', "Image changed successfully!");
            return res.redirect('/account');
        })
        .catch(err => {
            console.log(err.message);
            req.flash('error', "An internal server error occurred. Please try again later.");
            return res.redirect('/account');
        });
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

// POST /username
// Updates the user's username.
router.post('/username', function(req, res, next) {
    // Sanitize name
    req.body.name = req.body.name.replace(/[^a-zA-Z0-9-_]/g, "");
    req.body.name = req.body.name.substring(0, 20);

    // Ensure we have a name
    if (req.body.name.trim().length == 0) {
        return res.sendStatus(400);
    }

    // Update user object and save
    req.user.username = req.body.name;
    try {
        req.user.save();
    } catch (err) {
        console.log("Couldn't update username: " + err.message);
        res.sendStatus(500);
    }

    req.flash('info', "Username changed successfully!")
    res.sendStatus(200);
});


module.exports = router;
