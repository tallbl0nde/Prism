var express = require('express');
var router = express.Router();
var utils = require('../utils');

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

// GET /admin/users
// Renders the user management view.
router.get('/users', function(req, res, next) {
    // Get a list of all users
    res.locals.users = User.findAll().map(user => {
        let usage = req.diskUsageForUser(user);
        return {
            id: user.id,
            username: user.username,
            creationTime: formatTimestamp(user.createdTimestamp * 1000),
            usage: `${utils.formatBytes(usage.bytes)} (${usage.percentage}%)`,
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

// GET /admin/users/new
// Renders the add user view.
router.get('/users/new', function(req, res, next) {
    // Indicate we're on the user page
    res.locals.admin = {
        page: "users"
    };
    res.render('admin/users_new');
});

// POST /admin/users/new
// Creates a new user with the specified information.
router.post('/users/new', function(req, res, next) {
    // Sanitize name
    req.body.username = req.body.username.replace(/[^a-zA-Z0-9-_]/g, "");
    req.body.username = req.body.username.substring(0, 20);

    if (req.body.username.trim().length == 0) {
        req.flash('error', 'Please provide a username.');
        return res.redirect('/admin/users/new');
    }

    if (req.body.password.trim().length < 8) {
        req.flash('error', 'Please provide a password of at least 8 characters.');
        return res.redirect('/admin/users/new');
    }

    if (req.body.isAdmin === undefined) {
        req.body.isAdmin = false;
    } else {
        req.body.isAdmin = true;
    }

    // Save user to database
    let user = User.createNew(req.body.username, req.body.password, req.body.isAdmin, 'public/images/users/default.png');
    try {
        user.save();
    } catch (err) {
        console.log(`Couldn't create user: ${err.message}`);
        req.flash('error', 'An unexpected error occurred creating the user. Please check the server logs for more info.');
        return res.redirect('/admin/users/new');
    }

    req.flash('info', 'User created successfully!');
    return res.redirect('/admin/users');
});

// DELETE /admin/users/:id
// Deletes the given user.
router.delete('/users/:id', function(req, res, next) {
    // Prevent deleting own user
    if (req.user.id === req.params.id) {
        return res.sendStatus(403);
    }

    // Find user and delete
    let user = User.findByID(req.params.id);
    if (user === null) {
        return res.sendStatus(400);
    }

    try
    {
        user.remove();
    } catch (err) {
        return res.sendStatus(500);
    }

    res.sendStatus(200);
});

module.exports = router;
