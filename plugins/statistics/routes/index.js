var config = require('../config/config');
var express = require('express');
const minecraftStats = require('../minecraftStats');
var router = express.Router();
var User = require('../../../models/user');

// GET /
// Renders the main view.
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

    // Update rankings
    let categoryKeyPairs = [];
    for (const category in config.stats) {
        config.stats[category].forEach(entry => {
            categoryKeyPairs.push({
                category: "minecraft:custom",
                key: entry.minecraftKey,
                consists: entry.consists
            });
        });
    };

    minecraftStats.recalculateRanks(categoryKeyPairs);

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
                let stat = minecraftStats.getCustomStatistic(res.locals.selected.uuid, entry.minecraftKey, entry.consists);

                // Copy and update
                stats[category].push(JSON.parse(JSON.stringify(entry)));
                stats[category].at(-1).pseudo = (entry.consists !== undefined);
                stats[category].at(-1).rank = `#${stat.rank}`;
                stats[category].at(-1).value = entry.getString(stat.statistic);
            }
        });
    }
    let d = minecraftStats.getUpdateTime(res.locals.selected.uuid);

    res.locals.categoryIcons = config.categoryIcons;
    res.locals.stats = stats;
    res.locals.updateTime = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear().toString().padStart(2, "0").substr(-2)} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`
    res.render('statistics/index');
});

// GET /rankings
// Renders the ranking view.
router.get('/rankings', function(req, res, next) {
    // Redirect to user's stats page if none provided
    if (req.query.key === undefined) {
        return res.redirect(`.?uuid=${req.user.uuid}`);
    }

    // Update rankings
    let categoryKeyPairs = [];
    for (const category in config.stats) {
        config.stats[category].forEach(entry => {
            categoryKeyPairs.push({
                category: "minecraft:custom",
                key: entry.minecraftKey,
                consists: entry.consists
            });
        });
    };

    minecraftStats.recalculateRanks(categoryKeyPairs);

    // Populate list
    res.locals.statistics = {};
    for (const category in config.stats) {
        res.locals.statistics[category] = config.stats[category].map(entry => {
            return {
                name: entry.name,
                key: entry.minecraftKey,
                active: (entry.minecraftKey === req.query.key)
            };
        });
    }

    // Get entry for key
    let current = null;
    for (const category in config.stats) {
        config.stats[category].forEach(entry => {
            if (entry.minecraftKey === req.query.key) {
                current = entry;
            }
        });
    }

    // Redirect if not valid key
    if (current === null) {
        return res.redirect(`.?uuid=${req.user.uuid}`);
    }

    // Get ranking data
    res.locals.categoryIcons = config.categoryIcons;
    res.locals.description = current.description;
    res.locals.name = current.name;
    res.locals.rankings = [];

    User.findAll().forEach(user => {
        let stat = minecraftStats.getCustomStatistic(user.uuid, current.minecraftKey, current.consists);
        res.locals.rankings.push(stat);
        res.locals.rankings.at(-1).statistic = current.getString(stat.statistic);
        res.locals.rankings.at(-1).username = user.username;
        res.locals.rankings.at(-1).uuid = user.uuid;
    });

    res.locals.rankings = res.locals.rankings.sort((a, b) => {
        if (a.rank < b.rank) {
            return -1;
        } else if (a.rank > b.rank) {
            return 1;
        }
        return 0;
    });

    res.render('statistics/rankings');
});

module.exports = router;
