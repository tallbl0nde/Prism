// Copys the passed data to the clipboard
function copyToClipboard(data) {
    // Copy
    let elm = document.createElement("textarea");
    elm.style.top = "0";
    elm.style.left = "0";
    elm.style.position = "fixed";
    elm.value = data;

    document.body.appendChild(elm);
    elm.focus();
    elm.select();
    let ok = document.execCommand("copy");
    document.body.removeChild(elm);

    // Show toast with status
    let container = document.getElementsByClassName("toast-container")[0];

    let toast = document.createElement("div");
    toast.className = "toast align-items-center"
    toast.setAttribute("role", "alert");

    let flex = document.createElement("div");
    flex.className = "d-flex";

    let body = document.createElement("div");
    body.className = "toast-body";

    let icon = document.createElement("i");
    icon.className = "bi-info-circle";
    icon.setAttribute("id", "flash-icon");

    let message = document.createElement("span");
    message.innerHTML = (ok ? "Command copied to clipboard." : "An error occurred accessing the clipboard.");

    let button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("data-bs-dismiss", "toast");
    button.className = "btn-close me-2 m-auto";

    body.appendChild(icon);
    body.appendChild(message);

    flex.appendChild(body);
    flex.appendChild(button);

    toast.appendChild(flex);
    container.appendChild(toast);

    new bootstrap.Toast(toast, {
        delay: 2500
    }).show();
}

// Extracts and passes appropriate data to the delete modal
function prepareDeleteModal(elm) {
    document.getElementById("delete-heading").textContent = `Delete '${elm.getAttribute("data-name")}'?`;
    document.getElementById("delete-id").value = elm.getAttribute("data-id");
}

// Sends a DELETE request to delete an audio file
function sendDeleteRequest() {
    document.getElementById("delete-submit").setAttribute("disabled", "");

    // Do nothing if no ID
    let id = document.getElementById("delete-id").value;
    if (id.length === 0) {
        return;
    }

    // Setup request
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == XMLHttpRequest.DONE) {
            location.reload();
        }
    }

    // Send request
    xhttp.open("DELETE", `/jukebox-extended/audios/${id}`, true);
    xhttp.send();
}

// Updates the name field
function updateName() {
    let elm = document.getElementById("rename-name");
    elm.value = elm.value.replace(/[^a-zA-Z0-9-_]/g, "");
}

// Delete stored image data on load
window.addEventListener('load', function() {
    sessionStorage.clear();
});
