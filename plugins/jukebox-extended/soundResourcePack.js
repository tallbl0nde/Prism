const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const Config = require("./config/config");
const ResourcePack = require('../../resourcePack');

// Path to base 'sounds' folder.
const ItemsPath = "assets/minecraft/models/item/";
const SoundsPath = "assets/minecraft/sounds/";

// Extends the base ResourcePack class to provide methods to
// add/remove sounds.
class SoundResourcePack extends ResourcePack {
    // Constructs a new SoundResourcePack object from the passed file.
    constructor(path) {
        super(path);
        this._initialize();
    }

    // --------------------------------------------------
    // Methods
    // --------------------------------------------------

    // Helper to form the 'full name' of a track.
    _formFullname(namespace, name) {
        return `${namespace}.${name}`;
    }

    // Helper to form the path based on namespace and file.
    _formPath(namespace, name) {
        return path.join(SoundsPath, `${namespace}/`, `${name}.ogg`);
    }

    // Ensures the resource pack has all needed files/folders.
    _initialize() {
        let path2 = path.join(SoundsPath, "..", "sounds.json");
        if (this.readFile(path2) === null) {
            // Create 'blank' sounds.json.
            this.addFile(SoundsPath);
            this.addFile(path2, JSON.stringify({}, null, 4));
        }

        path2 = path.join(ItemsPath, "music_disc_11.json");
        if (this.readFile(path2) === null) {
            // Create 'texture replacement' json
            this.addFile(ItemsPath);
            this.addFile(path2, JSON.stringify({
                parent: "minecraft:item/generated",
                textures: {
                    layer0: "minecraft:item/music_disc_11"
                },
                overrides: [
                    {
                        model: "item/music_disc_pigstep",
                        predicate: {
                            custom_model_data: 1
                        }
                    }
                ]
            }, null, 4));
        }
    }

    // Validates the parameters passed to the function.
    _validate(namespace, name, title) {
        if (typeof(namespace) != "string") {
            throw new Error("Namespace is not a string.");
        }

        if (typeof(name) != "string") {
            throw new Error("Name is not a string.");
        }

        if (typeof(title) != "string") {
            throw new Error("Title is not a string.");
        }
    }

    // Adds a sound to the resource pack with the specified
    // namespace and title using the given buffer of data.
    // Returns the path to the file in the zip.
    addSound(namespace, name, title, duration, author, drop, data) {
        this._validate(namespace, name, title);
        if (typeof(author) != "string") {
            throw new Error("Author is not a string.");
        }

        if (typeof(drop) != "boolean") {
            throw new Error("Drop is not a boolean.");
        }

        // Update sounds.json
        let path2 = path.join(SoundsPath, "..", "sounds.json");
        let data2 = this.readFile(path2);
        if (data2 === null) {
            throw new Error("Couldn't add sound: Couldn't read sounds.json.");
        }

        let object = JSON.parse(data2);
        object[this._formFullname(namespace, name)] = {
            sounds: [
                {
                    name: `${namespace}/${name}`,
                    stream: true
                }
            ]
        };
        this.addFile(path2, JSON.stringify(object, null, 4));

        // Update config.yml
        let data3 = fs.readFileSync(Config.configFile);
        let yaml = YAML.parse(data3.toString());
        if (yaml === null || yaml === undefined) {
            throw new Error("Couldn't add sound: Couldn't read config.yml");
        }

        try {
            if (yaml.jext.disc === null) {
                yaml.jext.disc = {};
            }

            yaml.jext.disc[title] = {
                'namespace': this._formFullname(namespace, name),
                'author': author,
                'model-data': 1,
                'creeper-drop': drop
            }
        } catch (err) {
            throw new Error(`Couldn't add sound: Incorrect YAML format (${err.message})`);
        }
        fs.writeFileSync(Config.configFile, YAML.stringify(yaml, {
            indent: 4
        }));

        // Update jukelooper config.yml if required
        if (Config.jukeLooper.enabled) {
            try {
                // Read existing content
                let data4 = fs.readFileSync(Config.jukeLooper.configFile);
                let yaml2 = YAML.parse(data4.toString());
                if (yaml2.customDurations === null) {
                    yaml2.customDurations = {};
                }

                // Add duration for record and save
                yaml2.customDurations[this._formFullname(namespace, name)] = duration;
                fs.writeFileSync(Config.jukeLooper.configFile, YAML.stringify(yaml2, {
                    indent: 4
                }));

            } catch (err) {
                console.log("Couldn't add duration to JukeLooper: " + err.message);
            }
        }

        // Add to zip if all succeeded
        this.addFile(this._formPath(namespace, name), data);
    }

    // Retrieves the sound with the given namespace and name.
    // Returns null if the sound could not be found.
    fetchSound(namespace, name) {
        this._validate(namespace, name, "");

        return this.readFile(this._formPath(namespace, name));
    }

    // Removes the sound with the given namespace and name.
    // No error is thrown if the file does not exist.
    removeSound(namespace, name, title) {
        this._validate(namespace, name, title);

        // Update sounds.json
        let path2 = path.join(SoundsPath, "..", "sounds.json");
        let data = this.readFile(path2);
        if (data === null) {
            throw new Error("Couldn't remove sound: Couldn't read sounds.json.");
        }

        let object = JSON.parse(data);
        delete object[this._formFullname(namespace, name)];
        this.addFile(path2, JSON.stringify(object, null, 4));

        // Update config.yml
        let data3 = fs.readFileSync(Config.configFile);
        let yaml = YAML.parse(data3.toString());
        if (yaml === null || yaml === undefined) {
            throw new Error("Couldn't remove sound: Couldn't read config.yml");
        }

        try {
            delete yaml.jext.disc[title];
        } catch (err) {
            throw new Error(`Couldn't remove sound: Incorrect YAML format (${err.message})`);
        }
        fs.writeFileSync(Config.configFile, YAML.stringify(yaml, {
            indent: 4
        }));

        // Update jukelooper config.yml
        if (Config.jukeLooper.enabled) {
            try {
                // Read in file
                let data4 = fs.readFileSync(Config.jukeLooper.configFile);
                let yaml2 = YAML.parse(data4.toString());

                // Write changes
                delete yaml2.customDurations[this._formFullname(namespace, name)];
                fs.writeFileSync(Config.jukeLooper.configFile, YAML.stringify(yaml2, {
                    indent: 4
                }));

            } catch (err) {
                console.log(`Couldn't remove duration from JukeLooper: ${err.message}`);
            }
        }

        // Delete file from zip last
        this.removeFile(this._formPath(namespace, name));
    }
};

module.exports = SoundResourcePack;
