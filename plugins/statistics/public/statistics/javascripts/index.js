// Clear the scroll position when navigating between pages.
var clear = false;
function clearScroll() {
    clear = true;
}

// Resizes the given element to fill the remaining height
// of the webpage.
function fillRemainingHeight(elm) {
    let windowHeight = window.innerHeight;
    let elmOffset = elm.offsetTop;

    let height = `${windowHeight - elmOffset}px`;

    elm.style.height = height;
    elm.style.maxHeight = height;
}

// Resizes all required elements.
function resizeElements() {
    Array.from(document.getElementsByClassName("fill-height")).forEach(elm => {
        fillRemainingHeight(elm);
    });
}

// Attach event handlers to resize elements
window.onload = () => {
    resizeElements();

    // Restore scroll position on load
    let tmp = sessionStorage.getItem("sidelistScroll");
    if (tmp !== null) {
        document.getElementById("sidelist").scrollTop = tmp;
    }

    // Set back button href
    tmp = sessionStorage.getItem("playerUUID");
    let elm = document.getElementById("back-button");
    if (tmp !== null && elm !== null) {
        elm.href = `/statistics?uuid=${tmp}`;
    }
}
window.onresize = () => {
    resizeElements();
}
window.onunload = () => {
    // Store scroll position on unload
    sessionStorage.setItem("sidelistScroll", document.getElementById("sidelist").scrollTop);

    // Store UUID
    let tmp = new URLSearchParams(window.location.search).get('uuid');
    if (tmp !== null) {
        sessionStorage.setItem("playerUUID", tmp);
    }

    if (clear == true) {
        sessionStorage.setItem("sidelistScroll", null);
    }
}
