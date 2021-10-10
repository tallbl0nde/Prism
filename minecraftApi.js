const https = require('https');

// Asynchronously gets the UUID of the player with the passed username
// from Mojang's servers. The callback will be invoked with the following
// JSON:
// {
//     error: <true/false>,
//     errorMessage: <message describing error if one occurred, blank otherwise>,
//     uuid: <UUID if no error>
// }
function getUUIDForUsername(username, callback) {
    // Verify parameters.
    if (typeof(username) != "string") {
        throw new Error("Username must be a string.");
    }
    if (typeof(callback) != "function") {
        throw new Error("Callback must be a function.");
    }

    // Make request to Mojang's server with passed username.
    let data = "";
    https.get({
        host: "api.mojang.com",
        path: `/users/profiles/minecraft/${username}`
    }, response => {
        // Append response when data is received
        response.on('data', chunk => {
            data += chunk;
        });

        // Invoke passed callback with username at end of stream
        response.on('end', () => {
            let error = (response.statusCode != 200);
            callback({
                error: error,
                errorMessage: (error ? `${response.statusCode}: ${response.statusMessage}` : ""),
                uuid: (error ? "" : data)
            });
        });
    });
}

// Asynchronously gets the UUIDs of the players with the passed usernames
// from Mojang's servers. The callback will be invoked with the following
// JSON:
// {
//     error: <true/false>,
//     errorMessage: <message describing error if one occurred, blank otherwise>,
//     usernames: <empty if an error occurred> [
//         {
//             username: <username for requested UUID>,
//             uuid: <UUID for associated username>
//         },
//         {
//             <for each username>
//         }
//     ]
// }
function getUUIDsForUsernames(usernames, callback) {
    // Verify parameters.
    if (!Array.isArray(usernames)) {
        throw new Error("Usernames must be an array of usernames.");
    }
    usernames.forEach(username => {
        if (typeof(username) != "string") {
            throw new Error("All usernames must be a string.");
        }
    });
    if (typeof(callback) != "function") {
        throw new Error("Callback must be a function.");
    }

    // Make request to Mojang's server with passed username.
    let data = "";
    let request = https.request({
        host: "api.mojang.com",
        path: `/profiles/minecraft`,
        method: "POST",
        headers: {
            "Content-Type:": "application/json",
            "Content-Length": JSON.stringify(usernames).length
        }
    }, response => {
        // Append response when data is received
        response.on('data', chunk => {
            data += chunk;
        });

        // Invoke passed callback with usernames at end of stream
        response.on('end', () => {
            let error = (response.statusCode != 200);
            callback({
                error: error,
                errorMessage: (error ? `${response.statusCode}: ${response.statusMessage}` : ""),
                usernames: (error ? [] : JSON.parse(data))
            });
        });
    });
    request.write(JSON.stringify(usernames));
    request.end();
}

// Asynchronously gets the profile associated with the passed UUID
// from Mojang's servers. The callback will be invoked with the JSON
// received. The JSON has format:
// {
//     error: <true/false>,
//     errorMessage: <message describing error if one occurred, blank otherwise>,
//     uuid: <uuid if no error, blank otherwise>,
//     username: <username if no error, blank otherwise>,
//     skinURL: <URL to skin file if no error, blank otherwise>,
//     capeURL: <URL to cape file if no error, blank otherwise>
// }
function getProfileForUUID(uuid, callback) {
    // Verify parameters.
    if (typeof(uuid) != "string") {
        throw new Error("UUID must be a string.");
    }
    if (typeof(callback) != "function") {
        throw new Error("Callback must be a function.");
    }

    // Make request to Mojang's server with UUID.
    let data = "";
    https.get({
        host: "sessionserver.mojang.com",
        path: `/session/minecraft/profile/${uuid}`
    }, response => {
        // Append response when data is received
        response.on('data', chunk => {
            data += chunk;
        });

        // Invoke passed callback with profile at end of stream
        response.on('end', () => {
            // Process received data if no error
            let error = (response.statusCode != 200);
            let received = null;
            let skinURL = null;
            let capeURL = null;
            if (!error) {
                received = JSON.parse(data);
                received = JSON.parse(Buffer.from(received.properties[0].value, 'base64').toString());
                skinURL = (received.textures.SKIN == undefined ? "" : received.textures.SKIN.url)
                capeURL = (received.textures.CAPE == undefined ? "" : received.textures.CAPE.url)
            }

            callback({
                error: error,
                errorMessage: (error ? `${response.statusCode}: ${response.statusMessage}` : ""),
                uuid: (error ? "" : received.profileId),
                username: (error ? "" : received.profileName),
                skinURL: (error ? "" : skinURL),
                capeURL: (error ? "" : capeURL)
            });
        });
    });
}

module.exports.getProfileForUUID = getProfileForUUID;
module.exports.getUUIDForUsername = getUUIDForUsername;
module.exports.getUUIDsForUsernames = getUUIDsForUsernames;