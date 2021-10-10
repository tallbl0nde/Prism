var database = require('../database');
var express = require('express');
var minecraftApi = require('../minecraftApi');
var router = express.Router();
var utils = require('../utils');

var KeyValuePair = require('../models/keyvaluepair');
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
    // Get last update time
    let value = KeyValuePair.findByKey("userDataLastRefreshTimestamp");
    res.locals.lastRefresh = `Last refreshed: ${value ? formatTimestamp(parseInt(value.value) * 1000) : "Never"}`;

    // Get a list of all users
    res.locals.users = User.findAll().map(user => {
        let usage = req.diskUsageForUser(user);
        return {
            id: user.id,
            username: user.username,
            uuid: user.uuid,
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

// GET /admin/users/refresh
// Refreshes the data cached from Mojang's servers,
// and then redirects to the users page.
router.get('/users/refresh', function(req, res, next) {
    // Get a list of all users
    let users = User.findAll();
    if (users.length == 0) {
        // This should never happen :P
        req.flash('info', 'No users to update!');
        return res.redirect('/admin/users');
    }

    // Iterate over each user, updating their data based on
    // their UUIDs
    let updateUser = function(index) {
        let user = users[index];
        minecraftApi.getProfileForUUID(user.uuid, profile => {
            // Stop if an error occurred
            if (profile.error) {
                req.flash('error', `Error refreshing user data: ${profile.errorMessage}`);
                return res.redirect('/admin/users');
            }

            // Update user data
            // TODO: Skin head/image
            user.username = profile.username;
            user.save();

            // Get profile for next user
            if (index < users.length - 1) {
                return updateUser(index + 1);

            // Or if there are no more users, redirect back to user page
            } else {
                let lastRefresh = new KeyValuePair("userDataLastRefreshTimestamp", Math.floor(new Date().getTime() / 1000).toString());
                lastRefresh.save();

                req.flash('info', "Updated user data successfully.");
                return res.redirect('/admin/users')
            }
        })
    }

    // Do in a transaction so either all or none get updated
    database.doInTransaction(() => {
        updateUser(0);
    });
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
    // Sanitize UUID
    req.body.uuid = req.body.uuid.replace(/[^a-zA-Z0-9]/g, "");

    if (req.body.uuid.trim().length != 32) {
        req.flash('error', 'Please provide a valid UUID.');
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

    // Get username for UUID from Mojang
    minecraftApi.getProfileForUUID(req.body.uuid, profile => {
        if (profile.error) {
            req.flash('error', `An error occurred finding a matching Minecraft account: ${profile.errorMessage}`);
            return res.redirect('/admin/users/new');
        }

        // Save user to database
        // TODO: save skin image
        let user = User.createNew(profile.username, profile.uuid, req.body.password, req.body.isAdmin, 'public/images/users/default.png');
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
