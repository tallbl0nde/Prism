var config = require('../config/config');
var express = require('express');
const minecraftStats = require('../minecraftStats');
var router = express.Router();
var User = require('../../../models/user');

// GET /
// Renders the main view, containing the dynmap iframe.
router.get('/', function(req, res, next) {
    // Redirect to user's stats page if none provided
    if (req.query.uuid === undefined) {
        return res.redirect(`.?uuid=${req.user.uuid}`);
    }

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
    res.locals.selected = (res.locals.user.active ? res.locals.user : res.locals.others.filter(other => {
        return other.active;
    })[0]);

    // Redirect back to user's page if no active user
    if (res.locals.selected == undefined) {
        req.flash('error', "Invalid player requested.");
        return res.redirect(`.?uuid=${req.user.uuid}`);
    }

    // Fetch statistics for user
    let stats = {};
    for (const category in config.stats) {
        // Copy
        stats[category] = [];

        // Replace getString with formatted value
        config.stats[category].forEach(entry => {
            // Skip over disabled stats
            if (entry.enabled === true) {
                // Read statistics
                let stat = minecraftStats.getCustomStatistic(res.locals.selected.uuid, entry.minecraftKey);
                console.log(stat);

                // Copy and update
                stats[category].push(JSON.parse(JSON.stringify(entry)));
                stats[category].at(-1).rank = `#${stat.rank}`;
                stats[category].at(-1).value = entry.getString(stat.statistic || 0);
            }
        });
    }

    res.locals.stats = stats;
    res.render('statistics/index');
});

module.exports = router;
