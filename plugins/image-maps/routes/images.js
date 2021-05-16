var config = require('../config/config');
var express = require('express');
var fs = require('fs');
var path = require('path');
var router = express.Router();
var sharp = require('sharp');

var Image = require('../models/image');

// POST /images/
// [C]reate
// Creates a file for the uploaded image and adds an entry to the database.
router.post('/', function(req, res, next) {
    // Strip invalid characters from name, limit to 50 chars
    req.body.name = req.body.name.replace(/[^a-zA-Z0-9-_]/g, "");
    req.body.name = req.body.name.substring(0, 50);

    // Limit dimensions to 1280 x 1280
    req.body.width = Number(req.body.width);
    if (req.body.width > 1280) {
        req.body.width = 1280;
    }

    req.body.height = Number(req.body.height);
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

    // Resize image to requested size and write to filesystem
    const oldImage = req.body.data.split(";base64,").pop();
    sharp(Buffer.from(oldImage, "base64"))
        .resize(req.body.width, req.body.height)
        .toFile(filepath)
        .then(() => {
            // Insert into database
            let image = Image.createNew(filename, fs.statSync(filepath).size, req.user.id);
            try {
                image.save();
            } catch (err) {
                console.log(err.message);

                // Delete if we couldn't insert
                fs.unlinkSync(path);
                req.flash('error', "An entry for the image couldn't be added to the database. Please try again later.");
                return res.redirect('/imagemaps/upload');
            }

            // Redirect back to root
            req.flash('info', "Image uploaded successfully!");
            return res.redirect('/imagemaps');
        })
        .catch(err => {
            console.log(err);
            req.flash('error', "An internal server error occurred. Please try again later.");
            return res.redirect('/imagemaps/upload');
        });
});

// GET /images
// [R]ead
// Returns all stored images for the logged in user.
router.get('/', function (req, res, next) {
    //
});

// GET /images/:id/thumbnail
// [R]ead
// Returns a thumbnail for the image with the given ID.
router.get('/:id/thumbnail', function(req, res, next) {
    // Get image for ID
    let image = Image.findByID(req.params.id);
    if (image === null) {
        // TODO: Send empty response??
    }

    res.sendFile(path.join(config.imagesPath, image.fileName));
});

// POST /images/:id
// [U]pdate
// TODO:

// DELETE /images/:id
// [D]elete
// TODO:

module.exports = router;