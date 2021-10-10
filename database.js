const crypto = require('crypto');
const sqlite3 = require('better-sqlite3');

// --------------------------------------------------
// Connection management
// --------------------------------------------------

// Connection shared by all functions
var connection = null;

// Closes the database connection
function closeConnection() {
    if (connection != null) {
        connection.close();
        connection = null;
    }
}

// Opens a connection to the database if needed and returns object
function getConnection() {
    if (connection === null) {
        connection = new sqlite3('./database.db');
    }

    return connection;
}

// --------------------------------------------------
// Database queries
// --------------------------------------------------

// Executes the provided function within a database transaction.
function doInTransaction(func) {
    getConnection().transaction(func).deferred();
}

// Executes the provided statement and returns all returned rows
function queryAll(statement, binds = {}) {
    return getConnection().prepare(statement).all(binds);
}

// Executes the provided statement and returns the first row
function queryOne(statement, binds = {}) {
    return getConnection().prepare(statement).get(binds);
}

// Executes the provided statement
function query(statement, binds = {}) {
    getConnection().prepare(statement).run(binds);
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

// Initializes the database with empty tables
// Throws an Error if an error cccurs.
function initialize() {
    doInTransaction(function() {
        // Create KeyValuePairs table
        query(`CREATE TABLE KeyValuePairs (
            "key" TEXT NOT NULL UNIQUE,
            "value" TEXT NOT NULL
        );`);

        // Create RememberMeTokens table
        query(`CREATE TABLE RememberMeTokens (
            "token"	BLOB NOT NULL UNIQUE,
            "user_id" INTEGER NOT NULL
        );`);

        // Create Users table
        query(`CREATE TABLE "Users" (
            "id" INTEGER NOT NULL UNIQUE,
            "username" TEXT NOT NULL UNIQUE,
            "password_salt" BLOB NOT NULL UNIQUE,
            "password_hash" BLOB NOT NULL,
            "created_timestamp" INTEGER NOT NULL,
            "failed_logins" INTEGER NOT NULL DEFAULT 0,
            "is_admin" INTEGER NOT NULL,
            "image_path" TEXT NOT NULL DEFAULT "",
            PRIMARY KEY("id" AUTOINCREMENT)
        );`);
    });
}

module.exports.close = closeConnection;
module.exports.doInTransaction = doInTransaction;
module.exports.query = query;
module.exports.queryAll = queryAll;
module.exports.queryOne = queryOne;
module.exports.initialize = initialize;