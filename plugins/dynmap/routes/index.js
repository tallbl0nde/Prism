var config = require('../config/config');
var express = require('express');
var router = express.Router();

// GET /
// Renders the main view, containing the dynmap iframe.
router.get('/', function(req, res, next) {
    res.locals.path = config.url;
    res.render('dynmap/index');
});

module.exports = router;
