var config = require('../config/config');
var express = require('express');
var path = require('path');
var router = express.Router();

var Image = require('../models/image');

// Helper to format bytes to a string
// Won't work for >= 1024TB
function formatBytes(bytes) {
    let divs = 0;

    while (bytes >= 1024) {
        divs++;
        bytes /= 1024;
    }

    let suffix = "";
    switch (divs) {
        case 0:
            suffix = "B";
            break;

        case 1:
            suffix = "KB";
            break;

        case 2:
            suffix = "MB";
            break;

        case 3:
            suffix = "GB";
            break;

        case 4:
            suffix = "TB";
            break;
    }

    // Round to one decimal place
    bytes = Math.round((bytes + Number.EPSILON) * 10) / 10;
    return `${bytes} ${suffix}`;
}

// Middleware to fetch user's images and calculate usage
router.use(function(req, res, next) {
    // Get list of the user's images
    req.userImages = Image.findByUserID(req.user.id);

    // Calculate usage
    let bytes = req.userImages.map(image => {
        return image.size;
    }).reduce((a, b) => a + b, 0);

    // Round percentage to two decimal places
    let percentage = Math.round(((bytes/config.storageLimit) + Number.EPSILON) * 10000) / 100;
    percentage = (percentage > 100 ? 100 : percentage);
    res.locals.usage = {
        percentage: percentage,
        string: `${formatBytes(bytes)} / ${formatBytes(config.storageLimit)} (${percentage}%)`
    }
    next();
});

// GET /
// Renders the main view, containing a list of images
// uploaded by the currently logged in user.
router.get('/', function(req, res, next) {
    // Create images from database
    res.locals.images = req.userImages.map(image => {
        let d = new Date(image.uploadDate * 1000);

        return {
            id: image.id,
            name: image.fileName,
            downloadPath: `/imagemaps/images/${image.id}/download`,
            thumbnailPath: `/imagemaps/images/${image.id}/thumbnail`,
            path: path.join(config.imagesPath, image.fileName),
            size: formatBytes(image.size),
            uploadDate: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear().toString().padStart(2, "0").substr(-2)} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`
        };
    });

    // Sort alphabetically
    res.locals.images.sort((first, second) => {
        return first.name.toLowerCase().localeCompare(second.name.toLowerCase());
    });

    res.render('image-maps/index');
});

// GET /upload
// Renders the upload view.
router.get('/upload', function(req, res, next) {
    res.render('image-maps/upload');
});

module.exports = router;