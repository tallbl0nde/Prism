const crypto = require('crypto');
const fs = require('fs');

const Config = require("./config/config");
const JSZip = require("jszip-sync");

// Object used to interface with a minecraft resource pack.
// Supports editing all files + metadata relating to the pack.
class ResourcePack {
    // Constructs a new blank ResourcePack object.
    // See static methods.
    constructor(path) {
        this._path = path;

        // Create initial zip file if it doesn't exist
        this._zip = new JSZip();
        if (!fs.existsSync(this._path)) {
            this._initializePack();
        }

        // Load from file
        let data = fs.readFileSync(this._path);
        this._zip = this._zip.sync(function() {
            var zip = null;
            JSZip.loadAsync(data).then(function(content) {
                zip = content;
            });

            return zip;
        }.bind(this));
    }

    // --------------------------------------------------
    // Methods
    // --------------------------------------------------

    // Creates a new resource pack and writes it to the given file.
    _initializePack() {
        // Create .mcmeta
        let mcmeta = {
            pack: {
                pack_format: Config.resourcePack.version,
                description: Config.resourcePack.description
            }
        };

        let zipped = this._zip.sync(function() {
            // Add base files
            this._zip.folder("assets/");
            this._zip.file("pack.mcmeta", JSON.stringify(mcmeta, null, 4));

            // Write to disk
            var data = null;
            this._zip.generateAsync({
                type: "nodebuffer",
                compression: "STORE",
                compressionOptions: {
                    level: 9
                }
            }).then(function(content) {
                data = content;
            });
            return data;
        }.bind(this));
        fs.writeFileSync(this._path, zipped);
    }

    // Creates a file at the given path and with the given content.
    addFile(path, bytes) {
        if (typeof(path) != "string") {
            throw new Error("Path must be a string.");
        }

        this._zip.sync(function() {
            this._zip.file(path, bytes, {
                binary: true
            });
        }.bind(this));
    }

    // Creates a folder at the given path.
    addFolder(path) {
        if (typeof(path) != "string") {
            throw new Error("Path must be a string.");
        }

        if (path.substr(-1, 1) != "/") {
            path += "/";
        }

        this._zip.sync(function() {
            this._zip.folder(path);
        }.bind(this));
    }

    // Removes the file at the specified path from the zip file.
    removeFile(path) {
        if (typeof(path) != "string") {
            throw new Error("Path must be a string.");
        }

        this._zip.sync(function() {
            this._zip.remove(path);
        }.bind(this));
    }

    // Returns the content of the file at the requested location.
    // Null is returned if the file could not be read.
    readFile(path) {
        if (typeof(path) != "string") {
            throw new Error("Path must be a string.");
        }

        return this._zip.sync(function() {
            let entry = this._zip.file(path);
            if (entry === null) {
                return null;
            }

            var data = null;
            entry.async("nodebuffer").then(function (content) {
                data = content;
            });
            return data;
        }.bind(this));
    }

    // Save any changes made to the disk.
    // This will also update server.properties with the new hash of the zip.
    save() {
        // Update .zip first
        let zipped = this._zip.sync(function() {
            var data = null;
            this._zip.generateAsync({
                type: "nodebuffer",
                compression: "STORE",
                compressionOptions: {
                    level: 9
                }
            }).then(function(content) {
                data = content;
            });
            return data;
        }.bind(this));
        fs.writeFileSync(this._path, zipped);

        // Calculate SHA-1
        let sha1 = crypto.createHash('sha1').update(zipped).digest('hex');

        // Update server.properties
        const propFile = fs.readFileSync(Config.server.propertiesLocation);
        let lines = propFile.toString().replace(/\r\n/g, '\n').split('\n');
        lines = lines.map(line => {
            let key = line.split('=')[0];

            if (key == "resource-pack-sha1") {
                return `${key}=${sha1}`;
            }

            return line;
        });

        fs.writeFileSync(Config.server.propertiesLocation, lines.join('\n'));
    }
};

module.exports = ResourcePack;
