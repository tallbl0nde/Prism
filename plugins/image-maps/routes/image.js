var config = require('../config/config');
var express = require('express');
var path = require('path');
var router = express.Router();

var Image = require('../models/image');

// GET /
// Returns the image with the given ID.
router.get('/image', function(req, res, next) {
    // Get image for ID
    let image = Image.findByID(req.query.id);
    console.log(image);
    res.sendFile(path.join(config.imagesPath, image.fileName));
});

module.exports = router;