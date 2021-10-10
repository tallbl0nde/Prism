var config = require('../config/config');
var express = require('express');
var path = require('path');
var router = express.Router();
var utils = require('../../../utils')

var Image = require('../models/image');
var User = require('../../../models/user');

// Middleware to fetch user's images
router.use(function(req, res, next) {
    // Get list of the user's images
    req.userImages = Image.findByUserID(req.user.id);
    return next();
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
            command: `/imagemap place ${image.fileName}`,
            downloadPath: `/image-maps/images/${image.id}/download`,
            thumbnailPath: `/image-maps/images/${image.id}/thumbnail`,
            size: utils.formatBytes(image.size),
            uploadDate: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear().toString().padStart(2, "0").substr(-2)} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`
        };
    });

    // Sort alphabetically
    res.locals.images.sort((first, second) => {
        return first.name.toLowerCase().localeCompare(second.name.toLowerCase());
    });

    res.render('image-maps/index');
});

// GET /all
// Renders the main view, containing a list of images
// uploaded by everyone
router.get('/all', function(req, res, next) {
    // Get all users from database
    let users = User.findAll();

    // Create images from database
    res.locals.images = Image.findAll().map(image => {
        let d = new Date(image.uploadDate * 1000);
        let owner = users.find(user => user.id == image.userID);

        return {
            id: image.id,
            name: image.fileName,
            command: `/imagemap place ${image.fileName}`,
            downloadPath: `/image-maps/images/${image.id}/download`,
            thumbnailPath: `/image-maps/images/${image.id}/thumbnail`,
            path: path.join(config.imagesPath, image.fileName),
            size: utils.formatBytes(image.size),
            uploadDate: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear().toString().padStart(2, "0").substr(-2)} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`,
            owner: owner.username,
            ownerImage: owner.imagePath.replace('public/', '/'),
            isOwner: (req.user.id == image.userID)
        };
    });

    // Sort alphabetically
    res.locals.images.sort((first, second) => {
        return first.name.toLowerCase().localeCompare(second.name.toLowerCase());
    });

    res.render('image-maps/index_all');
});

// GET /upload
// Renders the upload view.
router.get('/upload', function(req, res, next) {
    res.render('image-maps/upload');
});

module.exports = router;
