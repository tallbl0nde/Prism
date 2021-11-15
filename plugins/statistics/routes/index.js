var express = require('express');
var router = express.Router();
var User = require('../../../models/user');

// GET /
// Renders the main view, containing the dynmap iframe.
router.get('/', function(req, res, next) {
    // Redirect to user's stats page if none provided
    if (req.query.uuid === undefined) {
        res.redirect(`.?uuid=${req.user.uuid}`);
    }

    // TODO: If invalid UUID, show message and redirect back to user's

    // Get all other users and filter out/pass relevant information
    res.locals.user.active = (req.query.uuid == req.user.uuid);
    res.locals.others = User.findAll().filter(user => user.uuid != req.user.uuid).sort((a, b) => {
        if (a.username < b.username) {
            return -1;
        } else if (a.username > b.username) {
            return 1;
        }
        return 0;
    }).map(user => {
        user.active = (req.query.uuid == user.uuid);
        user.image = `${user.imagePath.replace("public/", "/")}`;
        return user;
    });

    res.render('statistics/index');
});

module.exports = router;
