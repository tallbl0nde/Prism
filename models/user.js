const crypto = require('crypto');
const database = require('../database');

// Object used to interface with user records in the database.
// Any changes are not saved without explicitly calling save().
// All database related methods throw errors.
class User {
    // Constructs a blank user object. This should never be used
    // outside of the class. See static methods.
    constructor() {

    }

    // --------------------------------------------------
    // Static constructors
    // --------------------------------------------------

    // Constructs a new user object from the passed object.
    // Intended to only be used within static methods.
    static createFromRecord(data) {
        let user = new User();

        user._inDB = true;
        user._id = data.id;
        user._username = data.username;
        user._passwordSalt = data.password_salt;
        user._passwordHash = data.password_hash;
        user._createdTimestamp = data.created_timestamp;
        user._failedLogins = data.failed_logins;
        user._isAdmin = data.is_admin;
        user._imagePath = data.image_path;

        return user;
    }

    // Creates a new user object with the passed values.
    static createNew(username, password, isAdmin, imagePath) {
        let user = new User();

        user._inDB = false;
        user._id = null;

        if (typeof(username) != "string") {
            throw new Error("Username must be a string.");
        }
        user._username = username;

        if (typeof(password) != "string") {
            throw new Error("Password must be a string.");
        }
        user.setNewPassword(password);

        user._createdTimestamp = Math.floor(new Date().getTime() / 1000);
        user._failedLogins = 0;

        if (typeof(isAdmin) != "boolean") {
            throw new Error("Admin flag must be a boolean.");
        }
        user._isAdmin = isAdmin;

        if (typeof(imagePath) != "string") {
            throw new Error("Image path must be a string.");
        }
        user._imagePath = imagePath;

        return user;
    }

    // --------------------------------------------------
    // Properties
    // --------------------------------------------------

    // Gets the user's ID.
    get id() {
        return this._id;
    }

    // Gets the user's username.
    get username() {
        return this._username;
    }

    // Sets the user's username.
    set username(username) {
        this._username = username;
    }

    // Gets the date the user joined.
    get createdTimestamp() {
        return this._createdTimestamp;
    }

    // Gets the number of consecutive failed logins.
    get failedLogins() {
        return this._failedLogins;
    }

    // Gets whether the user is an admin.
    get isAdmin() {
        return this._isAdmin;
    }

    // Sets whether the user is an admin.
    set isAdmin(admin) {
        this._isAdmin = admin;
    }

    // Gets the path to the user's image.
    get imagePath() {
        return this._imagePath;
    }

    // Sets the path to the user's image.
    set imagePath(path) {
        this._imagePath = path;
    }

    // --------------------------------------------------
    // Methods
    // --------------------------------------------------

    // Increments the number of consecutive failed logins
    // the user has had.
    incrementFailedLogins() {
        this._failedLogins++;
    }

    // Sets the passed string as the user's password.
    // This method generates a new salt and applies
    // generates the new hash.
    setNewPassword(password) {
        // Generate salt
        this._passwordSalt = crypto.randomBytes(128).toString('base64');

        // Hash password and salt
        let hash = crypto.pbkdf2Sync(password, this._passwordSalt, 100000, 128, 'sha512');
        this._passwordHash = hash.toString('base64');
    }

    // Verifies if the passed password is correct.
    // Returns true if the password is correct, false otherwise.
    verifyPassword(password) {
        // Hash potential password with salt and compare
        let hash = crypto.pbkdf2Sync(password, this._passwordSalt, 100000, 128, 'sha512');
        return (this._passwordHash === hash.toString('base64'));
    }

    // --------------------------------------------------
    // Database interactions
    // --------------------------------------------------

    // Finds a User for the given id.
    // Returns null if one couldn't be found.
    static findByID(id) {
        let record = database.queryOne(`SELECT id, username, password_salt, password_hash, created_timestamp, failed_logins, is_admin, image_path
                                        FROM Users WHERE id = $id;`, {
                                            id: id
                                        });
        if (record === undefined) {
            return null;
        }

        // Convert to user object
        return User.createFromRecord(record);
    }

    // Finds a User for the given username.
    // Returns null if one couldn't be found.
    static findByUsername(username) {
        let record = database.queryOne(`SELECT id, username, password_salt, password_hash, created_timestamp, failed_logins, is_admin, image_path
                                        FROM Users WHERE username = $username;`, {
                                            username: username
                                        });
        if (record === undefined) {
            return null;
        }

        // Convert to user object
        return User.createFromRecord(record);
    }

    // Saves in-memory changes to the user object in the database
    save() {
        database.doInTransaction(function() {
            // Insert an entry if not in database
            if (this._inDB === false) {
                database.query(`INSERT INTO Users (
                                username, password_salt, password_hash, created_timestamp, failed_logins, is_admin, image_path
                                ) VALUES (
                                $username, $passwordSalt, $passwordHash, $createdTimestamp, $failedLogins, $isAdmin, $imagePath
                                );`,
                                {
                                    username: this._username,
                                    passwordSalt: this._passwordSalt,
                                    passwordHash: this._passwordHash,
                                    createdTimestamp: this._createdTimestamp,
                                    failedLogins: this._failedLogins,
                                    isAdmin: Number(this._isAdmin),
                                    imagePath: this._imagePath
                                });

            // Otherwise update
            } else {
                database.query(`UPDATE Users SET
                                username = $username, password_salt = $passwordSalt, password_hash = $passwordHash,
                                created_timestamp = $createdTimestamp, failed_logins = $failedLogins, is_admin = $isAdmin, image_path = $imagePath
                                WHERE id = $id;`,
                                {
                                    username: this._username,
                                    passwordSalt: this._passwordSalt,
                                    passwordHash: this._passwordHash,
                                    createdTimestamp: this._createdTimestamp,
                                    failedLogins: this._failedLogins,
                                    isAdmin: Number(this._isAdmin),
                                    imagePath: this._imagePath,
                                    id: this._id
                                });
            }
        }.bind(this));
    }
}

module.exports = User;