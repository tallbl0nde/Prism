const config = require('./config/config');
const fs = require('fs');
const path = require('path');
const User = require('../../models/user');

// Cache of statistic files
let fileCache = {};

// Time of last ranking
let rankingTime = new Date(2000, 1, 1, 1, 1, 1);

// Precalculated rankings
let ranks = {};

// Reads in the file associated with the given UUID
// as a JSON. Returns null if no file could be found.
// Automatically caches the contents and updates if the
// file access time changes.
function readPlayerStatisticsFile(uuid) {
    // Create 'real' UUID string
    uuid = uuid.slice(0, 8) + "-" + uuid.slice(8, 12) + "-" + uuid.slice(12, 16) + "-" + uuid.slice(16, 20) + "-" + uuid.slice(20);

    // Read in data if not in cache or out of date
    let tmp = path.join(config.statsDir, `${uuid}.json`);
    let modifiedTime = fs.statSync(tmp).mtime;

    if (!fileCache[uuid] || fileCache[uuid].modifiedTime < modifiedTime) {
        // Read file and modified time
        let file = fs.readFileSync(tmp);

        // Insert/update entry
        fileCache[uuid] = {
            data: JSON.parse(file),
            modifiedTime: new Date(modifiedTime)
        }
    }

    return fileCache[uuid];
}

// Returns the rank of a user's statistic.
// Returns 0 if a rank could not be found.
function getRank(uuid, category, key) {
    if (ranks[uuid] && ranks[uuid][category] && ranks[uuid][category][key]) {
        return ranks[uuid][category][key];
    }

    return 0;
}

// Returns the statistic value for the given category and key.
// 0 is returned if the key could not be found.
function getStatistic(json, category, key, consists) {
    // Inner function which reads from file
    const readStatistic = function(json, category, key) {
        if (json.stats && json.stats[category] && json.stats[category][key]) {
            return json.stats[category][key];
        }

        return 0;
    }

    // Handle psuedo-statistics
    if (key.slice(0, 6) === "prism:" && consists != null) {
        let total = 0;

        consists.forEach(key => {
            total += readStatistic(json, category, key);
        });

        return total;

    // Otherwise just read from file
    } else {
        return readStatistic(json, category, key)
    }
}

// Gets the minecraft:custom statistic for the requested key
// and player. Returns null if no statistic could be found.
// Otherwise, an object containing the statistic and rank is
// returned.
function getCustomStatistic(uuid, key, consists) {
    let stats = readPlayerStatisticsFile(uuid);

    return {
        key: key,
        rank: getRank(uuid, "minecraft:custom", key),
        statistic: getStatistic(stats.data, "minecraft:custom", key, consists),
        uuid: uuid
    };
}

// Gets the time a user's statistics were last updated.
// This is usually the modified time of the file.
function getUpdateTime(uuid) {
    return readPlayerStatisticsFile(uuid).modifiedTime;
}

// Recalculates the ranking of statistics for all users given
// a list of statistics to rank.
function recalculateRanks(categoryKeyPairs) {
    // Get a list of all user UUIDs
    let uuids = User.findAll().map(user => {
        return user.uuid;
    });

    // Get all user statistics
    let stats = {};
    uuids.forEach(uuid => {
        let tmp = readPlayerStatisticsFile(uuid);
        if (tmp !== null) {
            stats[uuid] = tmp;
        }
    });

    // Abort with error if not all stats could be read
    if (uuids.length != Object.keys(stats).length) {
        throw new Error("Couldn't retrieve all player statistics");
    }

    // Don't do anything if all modified times are in the past
    let needsUpdate = false;
    for (const uuid in stats) {
        if (stats[uuid].modifiedTime > rankingTime) {
            needsUpdate = true;
        }
    }

    if (needsUpdate === false) {
        return;
    }

    // Otherwise proceed to ranking
    ranks = {};
    uuids.forEach(uuid => {
        ranks[uuid] = {};
    });

    categoryKeyPairs.forEach(pair => {
        // Get value of statistic for all users
        let rankings = [];
        Object.entries(stats).forEach(([key, value]) => {
            // Add placeholder for category if needed
            if (!ranks[key][pair.category]) {
                ranks[key][pair.category] = {};
            }

            let stat = getStatistic(value.data, pair.category, pair.key, pair.consists);
            rankings.push({
                uuid: key,
                value: stat
            });
        });

        // Sort based on value
        rankings = rankings.sort((a, b) => {
            if (a.value > b.value) {
                return -1;
            } else if (a.value < b.value) {
                return 1;
            }
            return 0;
        });

        // Assign ranks
        let lastValue = null;
        let nextRank = 0;
        for (let i = 0; i < rankings.length; i++) {
            if (lastValue != rankings[i].value) {
                nextRank++;
            }

            ranks[rankings[i].uuid][pair.category][pair.key] = nextRank;
            lastValue = rankings[i].value;
        }
    });
}

module.exports.getCustomStatistic = getCustomStatistic;
module.exports.getUpdateTime = getUpdateTime;
module.exports.recalculateRanks = recalculateRanks;