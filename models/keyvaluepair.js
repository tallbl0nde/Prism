const database = require('../database');

// Object used to interface with arbitrary 'KeyValuePairs' in the database.
// The pair is not written or deleted without calling save() and
// delete() respectively.
class KeyValuePair {
    constructor(key, value) {
        if (typeof(key) != "string") {
            throw new Error("Key must be a string.");
        }
        this._key = key;

        if (typeof(value) != "string") {
            throw new Error("Value must be a string.");
        }
        this._value = value;
    }

    // --------------------------------------------------
    // Properties
    // --------------------------------------------------

    // Gets the key.
    get key() {
        return this._key;
    }

    // Sets the key.
    set key(key) {
        this._key = key;
    }

    // Gets the value.
    get value() {
        return this._value;
    }

    // Sets the key.
    set value(value) {
        this._value = value;
    }

    // --------------------------------------------------
    // Database interactions
    // --------------------------------------------------

    // Finds a KeyValuePair for the given key.
    // Returns null if one couldn't be found.
    static findByKey(key) {
        let record = database.queryOne(`SELECT key, value FROM KeyValuePairs WHERE key = $key;`, {
                         key: key
                     });

        if (record === undefined) {
            return null;
        }

        // Convert to token object
        return new KeyValuePair(record.key, record.value);
    }

    // Deletes the KeyValuePair from the database.
    delete() {
        database.query(`DELETE FROM KeyValuePairs WHERE key = $key;`, {
            key: this._key
        });
    }

    // Saves the KeyValuePair to the database.
    save() {
        database.query(`INSERT INTO KeyValuePairs (key, value) VALUES ($key, $value);`, {
            key: this._key,
            value: this._value
        });
    }
}

module.exports = KeyValuePair;
