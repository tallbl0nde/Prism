const config = require('../config/config');
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

var Audio = require('../models/audio');

// POST /audios/
// [C]reate
// Creates a file for the uploaded image and adds an entry to the database.
router.post('/', function(req, res, next) {
    // Refuse upload if over limit
    if (res.locals.user.usage.bytes >= req.globalConfig.storageLimit) {
        req.flash('error', "Your storage quota is full. Please free some space and try again.");
        return res.redirect('/audios/upload');
    }

    // Strip invalid characters from name, limit to 50 chars
    req.body.name = req.body.name.replace(/[^a-zA-Z0-9-_]/g, "");
    req.body.name = req.body.name.substring(0, 50);

    // Abort if empty name
    if (req.body.name.trim().length == 0) {
        req.flash('error', "The name field was left blank, please provide a name for the image.");
        return res.redirect('/imagemaps/upload');
    }

    // Abort if invalid dimensions
    req.body.width = Number(req.body.width);
    req.body.height = Number(req.body.height);
    if (req.body.width === 0 || req.body.height === 0) {
        req.flash('error', "No dimensions were provided. Please provide the size to scale the image to.");
        return res.redirect('/imagemaps/upload');
    }

    // Limit dimensions to 1280 x 1280
    if (req.body.width > 1280) {
        req.body.width = 1280;
    }

    if (req.body.height > 1280) {
        req.body.height = 1280;
    }

    // Form paths
    const filename = req.body.name + req.body.extension;
    const filepath = path.join(config.imagesPath, filename);

    // Abort if file exists
    if (fs.existsSync(filepath)) {
        req.flash('error', "An image with that name exists, please try a different name.");
        return res.redirect('/imagemaps/upload');
    }

    // TODO: Finish
});

// GET /audios/:id/download
// [R]ead
// Returns the audio file for the given audio ID.
router.get('/:id/download', function(req, res, next) {
    // Get audio for ID, sending 404 if not found
    let image = Audio.findByID(req.params.id);
    if (image === null) {
        return res.sendStatus(404);
    }

    // Verify the audio file exists
    // TODO: Implement properly
    const filepath = path.join(config.imagesPath, image.fileName);
    if (!fs.existsSync(filepath)) {
        return res.sendStatus(404);
    }

    res.type("image/png");
    res.download(filepath);
});

// POST /audios/:id
// [U]pdate
// Renames the audio with the given ID.
router.post('/:id', function(req, res, next) {
    // Get audio for ID
    let audio = Audio.findByID(req.params.id);
    if (audio === null) {
        return res.sendStatus(404);
    }

    // Only let the user who created it rename it
    if (audio.userID != req.user.id) {
        return res.sendStatus(403);
    }

    // Sanitize name
    req.body.name = req.body.name.replace(/[^a-zA-Z0-9-_]/g, "");
    req.body.name = req.body.name.substring(0, 50);

    const filename = req.body.name + req.body.extension;
    const filepath = path.join(config.imagesPath, filename);


    // Abort if empty name
    if (req.body.name.trim().length == 0) {
        return res.sendStatus(400);
    }

    // Make sure destination doesn't exist
    if (fs.existsSync(filepath)) {
        return res.sendStatus(400);
    }

    // Set new name and save
    image.fileName = filename;
    try {
        image.save();
    } catch (err) {
        console.log("Couldn't rename image: " + err.message);
        return res.sendStatus(500);
    }

    req.flash('info', "Image renamed successfully.");
    res.sendStatus(200);
});

// DELETE /audios/:id
// [D]elete
// Deletes the given audio ID from disk and database.
router.delete('/:id', function(req, res, next) {
    // Get audio for ID
    let audio = Audio.findByID(req.params.id);
    if (audio === null) {
        req.flash('error', "Couldn't delete image: the requested image couldn't be found.");
        return res.sendStatus(404);
    }

    // Only let the user who created it or admin delete it
    if (!(audio.userID == req.user.id || req.user.isAdmin === true)) {
        req.flash('error', "You do not have permission to delete this image.");
        return res.sendStatus(403);
    }

    try {
        audio.remove();
    } catch (err) {
        console.log("Couldn't delete audio file: " + err.message);
        req.flash('error', "An unexpected error occurred. Please try again later.");
        return res.sendStatus(500);
    }

    req.flash('info', "Audio file deleted successfully.");
    res.sendStatus(200);
});

module.exports = router;
