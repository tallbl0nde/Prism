const cache = require('memory-cache');
const config = require('../config/config');
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const sharp = require('sharp');

var Image = require('../models/image');

// POST /images/
// [C]reate
// Creates a file for the uploaded image and adds an entry to the database.
router.post('/', function(req, res, next) {
    // Get list of the user's images and refuse upload if over limit
    req.userImages = Image.findByUserID(req.user.id);
    let bytes = req.userImages.map(image => {
        return image.size;
    }).reduce((a, b) => a + b, 0);

    if (bytes >= req.globalConfig.storageLimit) {
        req.flash('error', "Your storage quota is full. Please delete some images and then try again.");
        return res.redirect('/imagemaps/upload');
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
            console.log(err.message);
            req.flash('error', "An internal server error occurred. Please try again later.");
            return res.redirect('/imagemaps/upload');
        });
});

// GET /images/:id/download
// [R]ead
// Returns the image file for the given image ID.
router.get('/:id/download', function(req, res, next) {
    // Get image for ID, sending 404 if not found
    let image = Image.findByID(req.params.id);
    if (image === null) {
        return res.sendStatus(404);
    }

    // Verify the image file exists
    const filepath = path.join(config.imagesPath, image.fileName);
    if (!fs.existsSync(filepath)) {
        return res.sendStatus(404);
    }

    res.type("image/png");
    res.download(filepath);
});

// GET /images/:id/thumbnail
// [R]ead
// Returns a thumbnail for the image with the given ID.
router.get('/:id/thumbnail', function(req, res, next) {
    // Get image for ID
    let image = Image.findByID(req.params.id);
    if (image === null) {
        return res.sendFile(path.join(__dirname, '../public/image-maps/images/noimage.png'));
    }

    // Check cache for resized image, send if present
    let data = cache.get(`image-${image.id}-thumbnail`);
    if (data != null) {
        res.writeHead(200, {
            "Content-Type": "image/jpeg",
            "Content-Length": data.length
        });
        return res.end(Buffer.from(data, "base64"));
    }

    // Otherwise resize image and cache
    let fullpath = path.join(config.imagesPath, image.fileName);
    if (!fs.existsSync(fullpath)) {
        return res.sendFile(path.join(__dirname, '../public/image-maps/images/noimage.png'));
    }

    sharp(fullpath)
        .resize({ height: config.thumbnail.height })
        .jpeg()
        .toBuffer()
        .then(data => {
            cache.put(`image-${image.id}-thumbnail`, data, config.thumbnail.cacheMs);
            res.writeHead(200, {
                "Content-Type": "image/jpeg",
                "Content-Length": data.length
            });
            return res.end(Buffer.from(data, "base64"));
        })
        .catch(err => {
            console.log(err.message);
            return res.sendFile(path.join(__dirname, '../public/image-maps/images/noimage.png'));
        });
});

// POST /images/:id
// [U]pdate
// Renames the image with the given ID.
router.post('/:id', function(req, res, next) {
    // Get image for ID
    let image = Image.findByID(req.params.id);
    if (image === null) {
        return res.sendStatus(404);
    }

    // Only let the user who created it rename it
    if (image.userID != req.user.id) {
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

// DELETE /images/:id
// [D]elete
// Deletes the given image ID from disk and database.
router.delete('/:id', function(req, res, next) {
    // Get image for ID
    let image = Image.findByID(req.params.id);
    if (image === null) {
        req.flash('error', "Couldn't delete image: the requested image couldn't be found.");
        return res.sendStatus(404);
    }

    // Only let the user who created it or admin delete it
    if (!(image.userID == req.user.id || req.user.isAdmin === true)) {
        req.flash('error', "You do not have permission to delete this image.");
        return res.sendStatus(403);
    }

    try {
        image.remove();
    } catch (err) {
        console.log("Couldn't delete image: " + err.message);
        req.flash('error', "An unexpected error occurred. Please try again later.");
        return res.sendStatus(500);
    }

    req.flash('info', "Image deleted successfully.");
    res.sendStatus(200);
});

module.exports = router;
