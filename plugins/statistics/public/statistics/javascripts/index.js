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
}
window.onresize = () => {
    resizeElements();
}