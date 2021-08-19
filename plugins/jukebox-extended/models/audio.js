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
        audio._drop = data.drop == 1;
        audio._namespace = data.namespace;
        audio._name = data.name;
        audio._title = data.title;
        audio._duration = data.duration;
        audio._uploadDate = data.upload_date;
        audio._size = data.size;
        audio._userID = data.user_id;

        return audio;
    }

    // Creates a new audio object with the passed values.
    static createNew(drop, namespace, name, title, duration, size, userID) {
        let audio = new Audio();

        audio._inDB = false;
        audio._id = null;

        if (typeof(drop) != "boolean") {
            throw new Error("Drop must be a boolean.");
        }
        audio._drop = drop;

        if (typeof(namespace) != "string") {
            throw new Error("Namespace must be a string.");
        }
        audio._namespace = namespace;

        if (typeof(name) != "string") {
            throw new Error("File name must be a string.");
        }
        audio._name = name;

        if (typeof(title) != "string") {
            throw new Error("Title must be a string.");
        }
        audio._title  = title;

        if (typeof(duration) != "number") {
            throw new Error("Title must be a number.");
        }
        audio._duration = Math.round(duration);

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

    // Gets whether the audio can be dropped by a creeper.
    get drop() {
        return this._drop;
    }

    // Gets the audio's namespace.
    get namespace() {
        return this._namespace;
    }

    // Gets the audio's file name.
    get name() {
        return this._name;
    }

    // Gets the audio's title.
    get title() {
        return this._title;
    }

    // Gets the audio's duration in seconds.
    get duration() {
        return this._duration;
    }

    // Sets the audio's drop.
    // Changes aren't made until save() is called.
    set drop(drop) {
        this._drop = drop;
    }

    // Sets the audio's new name.
    // Changes aren't made until save() is called.
    set name(name) {
        this._newName = name;
    }

    // Sets the audio's new title.
    // Changes aren't made until save() is called.
    set title(title) {
        this._title = title;
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
        return database.queryAll(`SELECT id, [drop], namespace, name, title, duration, upload_date, size, user_id FROM Audios`)
                       .map(record => Audio.createFromRecord(record));
    }

    // Finds an audio with the ID.
    // Returns null if not found.
    static findByID(id) {
        let record = database.queryOne(`SELECT id, [drop], namespace, name, title, duration, upload_date, size, user_id FROM Audios WHERE id = $id;`, {
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
        let records = database.queryAll(`SELECT id, [drop], namespace, name, title, duration, upload_date, size, user_id FROM Audios WHERE user_id = $userID;`, {
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
    remove(resourcePack) {
        // Wrap all operations in transaction, causing database
        // to revert on FS error
        database.doInTransaction(function() {
            database.query(`DELETE FROM Audios WHERE id = $id;`, {
                                id: this._id
                            });

            resourcePack.removeSound(this._namespace, this._name, this._title);
            resourcePack.save();
        }.bind(this));
    }

    // Saves in-memory changes to the database and filesystem.
    // Throws an error should one occur.
    save(resourcePack, data) {
        // Wrap all operations in transaction, causing database
        // to revert on FS error
        database.doInTransaction(function() {
            // Insert if not in database
            if (this._inDB == false) {
                database.query(`INSERT INTO Audios (
                                [drop], namespace, name, title, duration, upload_date, size, user_id
                                ) VALUES (
                                $drop, $namespace, $name, $title, $duration, $uploadDate, $size, $userID
                                );`, {
                                    drop: this._drop ? 1 : 0,
                                    namespace: this._namespace,
                                    name: this._name,
                                    title: this._title,
                                    duration: this._duration,
                                    uploadDate: this._uploadDate,
                                    size: this._size,
                                    userID: this._userID
                                });

                resourcePack.addSound(this._namespace, this._name, this._title, this._duration, this._namespace, this._drop, data);
                resourcePack.save();

            // Update entry otherwise
            } else {
                database.query(`UPDATE Audios SET
                                [drop] = $drop, namespace = $namespace, name = $name, title = $title,
                                duration = $duration, upload_date = $uploadDate, size = $size, user_id = $userID
                                WHERE id = $id;`, {
                                    drop: this._drop ? 1 : 0,
                                    namespace: this._namespace,
                                    name: this._newFileName,
                                    title: this._title,
                                    duration: this._duration,
                                    uploadDate: this._uploadDate,
                                    size: this._size,
                                    userID: this._userID,
                                    id: this._id
                                });

                resourcePack.removeSound(this._namespace, this._name, this._title, this._namespace, this._drop, data);
                resourcePack.addSound(this._namespace, this._newFileName, this._title, this._duration, this._namespace, this._drop, data);
                resourcePack.save();
            }
        }.bind(this));
    }
}

module.exports = Audio;
