// Updates the name field
function updateName() {
    let elm = document.getElementById("uuid");
    elm.value = elm.value.replace(/[^a-zA-Z0-9]/g, "");
}

// Updates the password field
function updatePassword() {
    let elm = document.getElementById("password");
    elm.value = elm.value.replace(/[^a-zA-Z0-9]/g, "");
}
