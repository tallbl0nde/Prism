const Config = require('../config/config');
const deasync = require('deasync');
const express = require('express');
const fs = require('fs');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const upload = multer()

var Audio = require('../models/audio');
var SoundResourcePack = require('../soundResourcePack');

// POST /audios/
// [C]reate
// Creates a file for the uploaded audio and adds an entry to the database.
router.post('/', upload.any(), function(req, res, next) {
    // Refuse upload if over limit
    if (res.locals.user.usage.bytes >= req.globalConfig.storageLimit) {
        req.flash('error', "Your storage quota is full. Please free some space and try again.");
        return res.redirect('jukebox-extended/upload');
    }

    // Strip invalid characters from fields
    req.body.namespace = req.body.namespace.replace(/[^a-z0-9-_]/g, "");
    req.body.namespace = req.body.namespace.substring(0, 20);
    req.body.name = req.body.name.replace(/[^a-z0-9-_]/g, "");
    req.body.name = req.body.name.substring(0, 50);
    req.body.title = req.body.title.replace(/[^A-Za-z0-9-_\(\) ]/g, "");
    req.body.title = req.body.title.substring(0, 70);

    // Abort if empty namespace
    if (req.body.namespace.trim().length == 0) {
        req.flash('error', "The namespace field was left blank, please provide a namespace for the audio.");
        return res.redirect('upload');
    }

    // Abort if empty name
    if (req.body.name.trim().length == 0) {
        req.flash('error', "The name field was left blank, please provide a name for the audio.");
        return res.redirect('upload');
    }

    // Abort if empty title
    if (req.body.title.trim().length == 0) {
        req.flash('error', "The title field was left blank, please provide a title for the audio.");
        return res.redirect('upload');
    }

    // Check if audio with same name exists
    let pack = new SoundResourcePack(req.globalConfig.resourcePack.path);
    if (pack.fetchSound(req.body.namespace, req.body.name) != null) {
        req.flash('error', "Audio already exists with the same namespace and name. Please choose different values.");
        return res.redirect('upload');
    }

    // Get duration
    let data = req.files[0].buffer;
    let filePath = path.join(Config.tempDir, "tmp.ogg");
    fs.writeFileSync(filePath, data);

    let duration = -1;
    getAudioDurationInSeconds(filePath).then(secs => {
        duration = secs;
    }).catch(() => {
        duration = 0;
    });

    // Wait for async call to finish
    deasync.loopWhile(() => {
        return duration < 0;
    });
    fs.unlinkSync(filePath);

    // Create object and save
    let audio = Audio.createNew(req.body.drop === undefined ? false : req.body.drop, req.body.namespace, req.body.name, req.body.title, duration, data.length, req.user.id);

    try {
        audio.save(pack, data);

    } catch (err) {
        console.log("Couldn't save audio file: " + err.message);
        req.flash('error', "Couldn't save audio file, please try again later.");
        return res.redirect('upload');
    }

    req.flash('info', "Audio file uploaded successfully! Your music disc will be available after the next server restart.");
    res.redirect('/jukebox-extended');
});

// GET /audios/:id/download
// [R]ead
// Returns the audio file for the given audio ID.
router.get('/:id/download', function(req, res, next) {
    // Get audio for ID, sending 404 if not found
    let audio = Audio.findByID(req.params.id);
    if (audio === null) {
        return res.sendStatus(404);
    }

    // Verify the audio file exists
    let pack = new SoundResourcePack(req.globalConfig.resourcePack.path);
    let data = pack.fetchSound(audio.namespace, audio.name);
    if (data === null) {
        return res.sendStatus(404);
    }

    res.type("audio/ogg");
    res.end(data);
});


// DELETE /audios/:id
// [D]elete
// Deletes the given audio ID from disk and database.
router.delete('/:id', function(req, res, next) {
    // Get audio for ID
    let audio = Audio.findByID(req.params.id);
    if (audio === null) {
        req.flash('error', "Couldn't delete audio: the requested audio couldn't be found.");
        return res.sendStatus(404);
    }

    // Only let the user who created it or admin delete it
    if (!(audio.userID == req.user.id || req.user.isAdmin === true)) {
        req.flash('error', "You do not have permission to delete this audio.");
        return res.sendStatus(403);
    }

    try {
        audio.remove(new SoundResourcePack(req.globalConfig.resourcePack.path));
    } catch (err) {
        console.log("Couldn't delete audio file: " + err.message);
        req.flash('error', "An unexpected error occurred. Please try again later.");
        return res.sendStatus(500);
    }

    req.flash('info', "Audio file deleted successfully.");
    res.sendStatus(200);
});

module.exports = router;
