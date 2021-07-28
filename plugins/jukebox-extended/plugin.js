const database = require('./database');
const fs = require('fs');
const path = require('path');

var Audio = require('./models/audio');

const plugin = {
    // Metadata
    icon: "bi-music-note",
    name: "Custom Music",
    author: "tallbl0nde",
    version: "1.0.0",

    // Routing
    path: "/jukebox-extended",
    routers: [
        {
            prefix: '/audios',
            router: require('./routes/audios')
        },
        {
            prefix: '/',
            router: require('./routes/index')
        },
    ],
    static: path.join(__dirname, 'public'),

    // Methods to run on events
    onGetUsage: function(user) {
        let userAudios = Audio.findByUserID(user.id);

        // Calculate usage
        let bytes = userAudios.map(audio => {
            return audio.size;
        }).reduce((a, b) => a + b, 0);
        return bytes;
    },

    onInitialize: function() {
        let db = path.join(__dirname, "data", "database.db");

        // Setup database
        try {
            if (!fs.existsSync(db)) {
                // Create database
                database.initialize();
                console.log("[JukeboxExtended] Database created.");

            } else {
                console.log("[JukeboxExtended] Found existing database.");
            }

        } catch (err) {
            console.error("[JukeboxExtended] Error initializing database: " + err.message);
            fs.unlinkSync(db);
            process.exit(1);
        }

        // Close the database on exit
        process.on('exit', database.close);
    },

    onUserCreate: null,

    onUserDelete: function() {
        // TODO: Implement
    }
};

module.exports = plugin;
