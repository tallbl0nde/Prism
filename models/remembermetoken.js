const crypto = require('crypto');
const database = require('../database');

// Object used to interface with 'Remember Me' tokens in the database.
// The token is not written or deleted without calling save() and
// delete() respectively.
class RememberMeToken {
    // Constructs a new remember me token using the passed values.
    constructor(userID, token = null) {
        // Create a new token if not passed
        if (token === null) {
            token = crypto.randomBytes(64).toString('base64');
        }

        if (typeof(token) != "string") {
            throw new Error("Token must be a string.");
        }
        this._token = token;

        if (typeof(userID) != "number") {
            throw new Error("User ID must be a number.");
        }
        this._userID = userID;
    }

    // --------------------------------------------------
    // Properties
    // --------------------------------------------------

    // Gets the token itself.
    get token() {
        return this._token;
    }

    // Gets the user ID associated with the token.
    get userID() {
        return this._userID;
    }

    // --------------------------------------------------
    // Database interactions
    // --------------------------------------------------

    // Finds a RememberMeToken for the given token.
    // Returns null if one couldn't be found.
    static findByToken(token) {
        let record = database.queryOne(`SELECT token, user_id FROM RememberMeTokens WHERE token = $token;`, {
                         token: token
                     });

        if (record === undefined) {
            return null;
        }

        // Convert to token object
        return new RememberMeToken(record.user_id, record.token);
    }

    // Deletes the token from the database.
    delete() {
        database.query(`DELETE FROM RememberMeTokens WHERE token = $token;`, {
            token: this._token
        });
    }

    // Saves the token to the database.
    save() {
        database.query(`INSERT INTO RememberMeTokens (token, user_id) VALUES ($token, $userID);`, {
            token: this._token,
            userID: this._userID
        });
    }
}

module.exports = RememberMeToken;