var config = require('../config/config');
var express = require('express');
var path = require('path');
var router = express.Router();

var Image = require('../models/image');

// GET /
// Renders the main view, containing a list of images
// uploaded by the currently logged in user.
router.get('/', function(req, res, next) {
    // Get list of the user's images
    let images = Image.findByUserID(req.user.id);

    res.locals.images = images.map(image => {
        return {
            name: image.fileName,
            getPath: `/imagemaps/images/${image.id}/thumbnail`,
            path: path.join(config.imagesPath, image.fileName),
            size: image.size
        }
    });
    res.render('image-maps/index');
});

module.exports = router;