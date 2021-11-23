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
    if (!fileCache[uuid] || fileCache[uuid].modifiedTime > new Date()) {
        // Read file and modified time
        let tmp = path.join(config.statsDir, `${uuid}.json`);
        let file = fs.readFileSync(tmp);
        let modifiedTime = fs.statSync(tmp).mtime;

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
// Null is returned if the key could not be found.
function getStatistic(json, category, key) {
    if (json.stats && json.stats[category] && json.stats[category][key]) {
        return json.stats[category][key];
    }

    return null;
}

// Gets the minecraft:custom statistic for the requested key
// and player. Returns null if no statistic could be found.
// Otherwise, an object containing the statistic and rank is
// returned.
function getCustomStatistic(uuid, key) {
    let stats = readPlayerStatisticsFile(uuid);

    return {
        key: key,
        rank: getRank(uuid, "minecraft:custom", key),
        statistic: getStatistic(stats.data, "minecraft:custom", key),
        uuid: uuid
    };
}

// Recalculates the ranking of statistics for all users given
// a list of statistics to rank.
function recalculateRanks(categoryKeyPairs) {
    // Get a list of all user UUIDs
    let uuids = User.findAll().map(user => {
        return user.uuid;
    });

    // Get all user statistics
    let stats = [];
    uuids.forEach(uuid => {
        let tmp = readPlayerStatisticsFile(uuid);
        if (tmp !== null) {
            stats.push(tmp);
        }
    });

    // Abort with error if not all stats could be read
    if (uuids.length != stats.length) {
        throw new Error("Couldn't retrieve all player statistics");
    }

    // Don't do anything if all modified times are in the past
    let needsUpdate = false;
    stats.forEach(stat => {
        if (stat.modifiedTime > rankingTime) {
            needsUpdate = true;
        }
    });

    if (!needsUpdate) {
        return;
    }

    // Otherwise proceed to ranking

}

module.exports.getCustomStatistic = getCustomStatistic;
module.exports.recalculateRanks = recalculateRanks;