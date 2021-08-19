// Helper to format duration to a string
function formatDuration(seconds) {
    let secs = seconds % 60;
    let mins = Math.floor(seconds/60);
    let hours = Math.floor(mins/60);
    mins %= 60;

    hours = hours.toString().padStart(2, "0");
    mins = mins.toString().padStart(2, "0");
    secs = secs.toString().padStart(2, "0");

    if (hours == 0) {
        return `${mins}:${secs}`;
    } else {
        return `${hours}:${mins}:${secs}`;
    }
}

// Helper to format bytes to a string
// Won't work for >= 1024TB
function formatBytes(bytes) {
    let divs = 0;

    while (bytes >= 1024) {
        divs++;
        bytes /= 1024;
    }

    let suffix = "";
    switch (divs) {
        case 0:
            suffix = "B";
            break;

        case 1:
            suffix = "KB";
            break;

        case 2:
            suffix = "MB";
            break;

        case 3:
            suffix = "GB";
            break;

        case 4:
            suffix = "TB";
            break;
    }

    // Round to two decimal places
    bytes = Math.round((bytes + Number.EPSILON) * 100) / 100;
    return `${bytes} ${suffix}`;
}

module.exports.formatBytes = formatBytes;
module.exports.formatDuration = formatDuration;
