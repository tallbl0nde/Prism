const config = require('../config/config');
const database = require('../database')
const fs = require('fs');
const path = require('path');

// Object used to interface with image records in the database.
// Any changes are not saved without explicitly calling save().
class Image {
    // Constructs a blank image object. This should never be used
    // outside of the class. See static methods.
    constructor() {

    }

    // --------------------------------------------------
    // Static constructors
    // --------------------------------------------------

    // Constructs a new image object from the passed object.
    // Intended to only be used within static methods.
    static createFromRecord(data) {
        let image = new Image();

        image._inDB = true;
        image._id = data.id;
        image._fileName = data.file_name;
        image._uploadDate = data.upload_date;
        image._size = data.size;
        image._userID = data.user_id;

        return image;
    }

    // Creates a new image object with the passed values.
    static createNew(fileName, size, userID) {
        let image = new Image();

        image._inDB = false;
        image._id = null;

        if (typeof(fileName) != "string") {
            throw new Error("File name must be a string.");
        }
        image._fileName = fileName;

        image._uploadDate = Math.floor(new Date().getTime() / 1000);

        if (typeof(size) != "number") {
            throw new Error("Size must be a number.");
        }
        image._size = size;

        if (typeof(userID) != "number") {
            throw new Error("User ID must be a number.");
        }
        image._userID = userID;

        return image;
    }

    // --------------------------------------------------
    // Properties
    // --------------------------------------------------

    // Gets the image's ID.
    get id() {
        return this._id;
    }

    // Gets the image's file name.
    get fileName() {
        return this._fileName;
    }

    // Sets the image's new file name.
    // Changes aren't made until save() is called.
    set fileName(fileName) {
        this._newFileName = fileName;
    }

    // Gets a timestamp representing when the image was uploaded.
    get uploadDate() {
        return this._uploadDate;
    }

    // Gets the size of the image in bytes.
    get size() {
        return this._size;
    }

    // Gets the ID of the user who uploaded the image.
    get userID() {
        return this._userID;
    }

    // --------------------------------------------------
    // Database interactions
    // --------------------------------------------------

    // Finds all images stored.
    // Returns an empty array if none are found.
    static findAll() {
        return database.queryAll(`SELECT id, file_name, upload_date, size, user_id FROM Images`)
                       .map(record => Image.createFromRecord(record));
    }

    // Finds an image with the ID.
    // Returns null if not found.
    static findByID(id) {
        let record = database.queryOne(`SELECT id, file_name, upload_date, size, user_id FROM Images WHERE id = $id;`, {
            id: id
        });
        if (record === undefined) {
            return null;
        }

        return Image.createFromRecord(record);
    }

    // Finds all images which were created by the given user.
    // Returns an empty array if none are found.
    static findByUserID(userID) {
        let records = database.queryAll(`SELECT id, file_name, upload_date, size, user_id FROM Images WHERE user_id = $userID;`, {
            userID: userID
        });

        // Return empty array if none found
        if (records.length == 0) {
            return [];
        }

        // Convert all to image objects
        return records.map(record => Image.createFromRecord(record));
    }

    // Deletes the image from the database and file-system.
    // Throws an error should one occur.
    remove() {
        // Wrap all operations in transaction, causing database
        // to revert on FS error
        database.doInTransaction(function() {
            database.query(`DELETE FROM Images WHERE id = $id;`, {
                                id: this._id
                            });

            let filepath = path.join(config.imagesPath, this._fileName);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }.bind(this));
    }

    // Saves in-memory changes to the database and filesystem.
    // Throws an error should one occur.
    save() {
        // Wrap all operations in transaction, causing database
        // to revert on FS error
        database.doInTransaction(function() {
            // Insert if not in database
            if (this._inDB == false) {
                database.query(`INSERT INTO Images (
                                file_name, upload_date, size, user_id
                                ) VALUES (
                                $fileName, $uploadDate, $size, $userID
                                );`, {
                                    fileName: this._fileName,
                                    uploadDate: this._uploadDate,
                                    size: this._size,
                                    userID: this._userID
                                });

            // Update entry otherwise
            } else {
                // Rename file first
                if (this._fileName != this._newFileName) {
                    fs.renameSync(path.join(config.imagesPath, this._fileName), path.join(config.imagesPath, this._newFileName), err => {
                        throw new Error("Couldn't rename image: " + err.message);
                    });
                }

                try {
                    database.query(`UPDATE Images SET
                                    file_name = $fileName, upload_date = $uploadDate,
                                    size = $size, user_id = $userID
                                    WHERE id = $id;`, {
                                        fileName: this._newFileName,
                                        uploadDate: this._uploadDate,
                                        size: this._size,
                                        userID: this._userID,
                                        id: this._id
                                    });
                } catch (err) {
                    fs.renameSync(path.join(config.imagesPath, this._newFileName), path.join(config.imagesPath, this._fileName));
                    throw new Error(err.message);
                }
            }
        }.bind(this));
    }
}

module.exports = Image;