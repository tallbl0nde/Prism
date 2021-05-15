var config = require('../config/config');
var express = require('express');
var path = require('path');
var router = express.Router();

var Image = require('../models/image');

// PUT /images/:id
// [C]reate
// TODO:

// GET /images
// [R]ead
// Returns all stored images for the logged in user.
router.get('/', function (req, res, next) {
    //
});

// GET /images/:id
// [R]ead
// Returns the image with the given ID.
router.get('/:id/thumbnail', function(req, res, next) {
    // Get image for ID
    let image = Image.findByID(req.params.id);
    if (image === null) {
        // TODO: Send empty response??
    }

    res.sendFile(path.join(config.imagesPath, image.fileName));
});

// PUT /images/:id
// [U]pdate
// TODO:

// DELETE /images/:id
// [D]elete
// TODO:

module.exports = router;