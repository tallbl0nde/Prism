var config = require('../config/config');
var express = require('express');
var path = require('path');
var router = express.Router();
var utils = require('../../../utils')

var Audio = require('../models/audio');
var User = require('../../../models/user');

// Middleware to fetch user's audios
router.use(function(req, res, next) {
    // Get list of the user's audios
    req.userAudios = Audio.findByUserID(req.user.id);
    return next();
});

// GET /
// Renders the main view, containing a list of images
// uploaded by the currently logged in user.
router.get('/', function(req, res, next) {
    // Create images from database
    res.locals.audios = req.userAudios.map(audio => {
        let d = new Date(audio.uploadDate * 1000);

        // TODO: Finish
        return {
            id: audio.id,
            name: `${audio.namespace}.${audio.fileName}`,
            downloadPath: `/jukebox-extended/audios/${audio.id}/download`,
            size: utils.formatBytes(audio.size),
            uploadDate: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear().toString().padStart(2, "0").substr(-2)} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`
        };
    });

    // Sort alphabetically
    res.locals.audios.sort((first, second) => {
        return first.name.toLowerCase().localeCompare(second.name.toLowerCase());
    });

    res.render('jukebox-extended/index');
});

// GET /all
// Renders the main view, containing a list of images
// uploaded by everyone
router.get('/all', function(req, res, next) {
    // Get all users from database
    let users = User.findAll();

    // Create images from database
    res.locals.audios = Audio.findAll().map(audio => {
        let d = new Date(audio.uploadDate * 1000);

        return {
            id: audio.id,
            name: `${audio.namespace}.${audio.fileName}`,
            downloadPath: `/imagemaps/images/${audio.id}/download`,
            size: utils.formatBytes(audio.size),
            uploadDate: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear().toString().padStart(2, "0").substr(-2)} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`,
            owner: users.find(user => user.id == audio.userID).username,
            isOwner: (req.user.id == audio.userID)
        };
    });

    // Sort alphabetically
    res.locals.audios.sort((first, second) => {
        return first.name.toLowerCase().localeCompare(second.name.toLowerCase());
    });

    res.render('jukebox-extended/index_all');
});

// GET /upload
// Renders the upload view.
router.get('/upload', function(req, res, next) {
    res.render('jukebox-extended/upload');
});

module.exports = router;
