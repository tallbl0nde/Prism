const database = require('../database')
const fs = require('fs');
const path = require('path');

// Object used to interface with audio records in the database.
// Any changes are not saved without explicitly calling save().
class Audio {
    // Constructs a blank audio object. This should never be used
    // outside of the class. See static methods.
    constructor() {

    }

    // --------------------------------------------------
    // Static constructors
    // --------------------------------------------------

    // Constructs a new image object from the passed object.
    // Intended to only be used within static methods.
    static createFromRecord(data) {
        let audio = new Audio();

        audio._inDB = true;
        audio._id = data.id;
        audio._namespace = data.namespace;
        audio._fileName = data.file_name;
        audio._zipPath = data.zip_path;
        audio._uploadDate = data.upload_date;
        audio._size = data.size;
        audio._userID = data.user_id;

        return audio;
    }

    // Creates a new audio object with the passed values.
    static createNew(namespace, fileName, zipPath, size, userID) {
        let audio = new Audio();

        audio._inDB = false;
        audio._id = null;

        if (typeof(namespace) != "string") {
            throw new Error("Namespace must be a string.");
        }
        audio._namespace = fileName;

        if (typeof(fileName) != "string") {
            throw new Error("File name must be a string.");
        }
        audio._fileName = fileName;

        if (typeof(zipPath) != "string") {
            throw new Error("Zip path must be a string.");
        }
        audio._fileName = zipPath;

        audio._uploadDate = Math.floor(new Date().getTime() / 1000);

        if (typeof(size) != "number") {
            throw new Error("Size must be a number.");
        }
        audio._size = size;

        if (typeof(userID) != "number") {
            throw new Error("User ID must be a number.");
        }
        audio._userID = userID;

        return audio;
    }

    // --------------------------------------------------
    // Properties
    // --------------------------------------------------

    // Gets the audio's ID.
    get id() {
        return this._id;
    }

    // Gets the audio's namespace.
    get namespace() {
        return this._namespace;
    }

    // Gets the audio's file name.
    get fileName() {
        return this._fileName;
    }

    // Gets the audio's zip path.
    get zipPath() {
        return this._zipPath;
    }

    // Sets the audio's new file name.
    // Changes aren't made until save() is called.
    set fileName(fileName) {
        this._newFileName = fileName;
    }

    // Sets the audio's new namespace.
    // Changes aren't made until save() is called.
    set namespace(namespace) {
        this._newNamespace = namespace;
    }

    // Gets a timestamp representing when the audio was uploaded.
    get uploadDate() {
        return this._uploadDate;
    }

    // Gets the size of the audio in bytes.
    get size() {
        return this._size;
    }

    // Gets the ID of the user who uploaded the audio.
    get userID() {
        return this._userID;
    }

    // --------------------------------------------------
    // Database interactions
    // --------------------------------------------------

    // Finds all audios stored.
    // Returns an empty array if none are found.
    static findAll() {
        return database.queryAll(`SELECT id, namespace, file_name, zip_path, upload_date, size, user_id FROM Audios`)
                       .map(record => Audio.createFromRecord(record));
    }

    // Finds an audio with the ID.
    // Returns null if not found.
    static findByID(id) {
        let record = database.queryOne(`SELECT id, namespace, file_name, zip_path, upload_date, size, user_id FROM Audios WHERE id = $id;`, {
            id: id
        });
        if (record === undefined) {
            return null;
        }

        return Audio.createFromRecord(record);
    }

    // Finds all audios which were created by the given user.
    // Returns an empty array if none are found.
    static findByUserID(userID) {
        let records = database.queryAll(`SELECT id, namespace, file_name, zip_path, upload_date, size, user_id FROM Audios WHERE user_id = $userID;`, {
            userID: userID
        });

        // Return empty array if none found
        if (records.length == 0) {
            return [];
        }

        // Convert all to audio objects
        return records.map(record => Audio.createFromRecord(record));
    }

    // Deletes the audio from the database and file-system.
    // Throws an error should one occur.
    remove() {
        // Wrap all operations in transaction, causing database
        // to revert on FS error
        database.doInTransaction(function() {
            database.query(`DELETE FROM Audios WHERE id = $id;`, {
                                id: this._id
                            });

            // TODO: Remove from resource pack
            // let filepath = path.join(config.imagesPath, this._fileName);
            // if (fs.existsSync(filepath)) {
            //     fs.unlinkSync(filepath);
            // }
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
                database.query(`INSERT INTO Audios (
                                namespace, file_name, zip_path, upload_date, size, user_id
                                ) VALUES (
                                $namespace, $fileName, $zipPath, $uploadDate, $size, $userID
                                );`, {
                                    namespace: this._namespace,
                                    fileName: this._fileName,
                                    zipPath: this._zipPath,
                                    uploadDate: this._uploadDate,
                                    size: this._size,
                                    userID: this._userID
                                });

                // TODO: Insert into resource pack

            // Update entry otherwise
            } else {
                // TODO: Update resource pack

                try {
                    database.query(`UPDATE Audios SET
                                    namespace = $namespace, file_name = $fileName, zip_path = $zipPath,
                                    upload_date = $uploadDate, size = $size, user_id = $userID
                                    WHERE id = $id;`, {
                                        namespace: this._namespace,
                                        fileName: this._newFileName,
                                        zipPath: this._zipPath,
                                        uploadDate: this._uploadDate,
                                        size: this._size,
                                        userID: this._userID,
                                        id: this._id
                                    });
                } catch (err) {
                    // TODO: Undo update
                    throw new Error(err.message);
                }
            }
        }.bind(this));
    }
}

module.exports = Audio;
