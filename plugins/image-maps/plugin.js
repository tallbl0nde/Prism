const database = require('./database');
const fs = require('fs');
const path = require('path');

var Image = require('./models/image');

const plugin = {
    // Metadata
    icon: "bi-images",
    name: "Custom Images",
    author: "tallbl0nde",
    version: "1.0.0",

    // Routing
    path: "/image-maps",
    routers: [
        {
            prefix: '/images',
            router: require('./routes/images')
        },
        {
            prefix: '/',
            router: require('./routes/index')
        },
    ],
    static: path.join(__dirname, 'public'),

    // Methods to run on events
    onGetUsage: function(user) {
        let userImages = Image.findByUserID(user.id);

        // Calculate usage
        let bytes = userImages.map(image => {
            return image.size;
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
