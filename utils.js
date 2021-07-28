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
