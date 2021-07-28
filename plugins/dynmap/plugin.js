const fs = require('fs');
const path = require('path');

const plugin = {
    // Metadata
    icon: "bi-geo-alt",
    name: "Server Map",
    author: "tallbl0nde",
    version: "1.0.0",

    // Routing
    path: "/dynmap",
    routers: [
        {
            prefix: '/',
            router: require('./routes/index')
        }
    ],
    static: path.join(__dirname, 'public'),

    // Methods to run on events
    onGetUsage: null,
    onInitialize: null,
    onUserCreate: null,
    onUserDelete: null
};

module.exports = plugin;
