const path = require('path');
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
        connection = new sqlite3(path.join(__dirname, "data", "database.db"));
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
    return getConnection().prepare(statement).run(binds);
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

// Initializes the database with empty tables
// Throws an Error if an error cccurs.
function initialize() {
    doInTransaction(function() {
        // Create Images table
        query(`CREATE TABLE Images (
            "id" INTEGER NOT NULL UNIQUE,
            "file_name" TEXT NOT NULL UNIQUE,
            "upload_date" INTEGER NOT NULL,
            "size" INTEGER NOT NULL,
            "user_id" INTEGER NOT NULL,
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