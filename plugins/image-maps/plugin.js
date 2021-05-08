const database = require('./database');
const fs = require('fs');
const path = require('path');

const plugin = {
    // Metadata
    icon: "bi-images",
    name: "ImageMaps",
    author: "tallbl0nde",
    version: "1.0.0",

    // Routing
    path: "/imagemaps",
    routers: [
        require('./routes/image'),
        require('./routes/index')
    ],
    static: path.join(__dirname, 'public'),

    // Methods to run on events
    onInitialize: function() {
        let db = path.join(__dirname, "data", "database.db");

        // Setup database
        try {
            if (!fs.existsSync(db)) {
                // Create database
                database.initialize();
                console.log("[ImageMaps] Database created.");

            } else {
                console.log("[ImageMaps] Found existing database.");
            }

        } catch (err) {
            console.error("[ImageMaps] Error initializing database: " + err.message);
            fs.unlinkSync(db);
            process.exit(1);
        }

        // Close the database on exit
        process.on('exit', database.close);
    },

    onUserCreate: null,
    onUserDelete: null
};

module.exports = plugin;