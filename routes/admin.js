var express = require('express');
var router = express.Router();

var User = require('../models/user');

// Helper to format timestamp
function formatTimestamp(timestamp) {
    let d = new Date(timestamp);
    let m = d.getMinutes().toString().padStart(2, "0");
    let s = d.getSeconds().toString().padStart(2, "0");
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear().toString().padStart(2, "0").substr(-2)} ${d.getHours()}:${m}:${s}`;
}

// Require that the user is logged in to access any of these routes
router.use(function(req, res, next) {
    if (!req.user.isAdmin) {
        req.flash('error', "You are not authorized to access this path.");
        return res.redirect('/');
    }

    next();
});

// GET /
// Renders the user management view.
router.get('/users', function(req, res, next) {
    // Get a list of all users
    res.locals.users = User.findAll().map(user => {
        return {
            id: user.id,
            username: user.username,
            creationTime: formatTimestamp(user.createdTimestamp * 1000),
            failedLogins: user.failedLogins,
            role: (user.isAdmin === true ? "Admin" : "User"),
            deletePath: `/admin/users/${user.id}`
        };
    });

    // Indicate we're on the user page
    res.locals.admin = {
        page: "users"
    };
    res.render('admin/users');
});

// DELETE /
// Deletes the given user.
router.delete('/users/:id', function(req, res, next) {
    //TODO:
    res.sendStatus(500);
});

module.exports = router;
