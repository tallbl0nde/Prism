// Disables the submit button
function onFormSubmit() {
    document.getElementById("upload-button").setAttribute("disabled", "");
    document.getElementById("upload-spinner").style.display = "inline-block";
}

// Updates the passed text box
function updateText(elm) {
    // Remove illegal characters
    let text = elm.value;
    let fixed = text.replace(/[^a-z0-9-_]/g, "");
    elm.value = fixed;

    // Update text
    updateFullname();
}

// Updates the "this will require" text
function updateFullname() {
    let namespace = document.getElementById("namespace").value;
    let name = document.getElementById("filename").value;
    let elm = document.getElementById("fullname");

    elm.textContent = (name === "" || namespace === "" ? "Choose the namespace and name for the audio to view the final ID for the music disc." : `A music disc will be created with the ID: '${namespace}.${name}'.`);
}

// Store form data on unload
window.onbeforeunload = function() {
    sessionStorage.setItem("namespace", document.getElementById("namespace").value);
    sessionStorage.setItem("filename", document.getElementById("filename").value);
}

// Restore form data on load
window.addEventListener('load', function() {
    let tmp = null;

    tmp = sessionStorage.getItem("namespace");
    if (tmp !== null) {
        n1 = tmp;
        document.getElementById("namespace").value = tmp;
    }

    tmp = sessionStorage.getItem("filename");
    if (tmp !== null) {
        n2 = tmp;
        document.getElementById("filename").value = tmp;
    }

    updateFullname();
});
