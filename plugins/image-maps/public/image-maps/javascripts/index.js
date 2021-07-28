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

// Extracts and passes appropriate data to the rename modal
function prepareRenameModal(elm) {
    // Split name and extension
    let fullname = elm.getAttribute("data-name");
    if (fullname === null) {
        return;
    }

    let name = fullname.split('.')[0];
    let ext = fullname.split('.').pop();

    // Update modal
    document.getElementById("alert-div").style.display = "none";
    document.getElementById("rename-heading").textContent = `Rename '${fullname}'`;
    document.getElementById("rename-name").value = name;
    document.getElementById("rename-extension").textContent = `.${ext}`;
    document.getElementById("rename-extension-data").value = `.${ext}`;
    document.getElementById("rename-id").value = elm.getAttribute("data-id");
}

// Sends a DELETE request to delete an image
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
    xhttp.open("DELETE", `/image-smaps/images/${id}`, true);
    xhttp.send();
}

// Sends a POST request to rename an image
function sendRenameRequest() {
    // Hide alert div
    document.getElementById("alert-div").style.display = "none";

    // Do nothing if no ID
    let id = document.getElementById("rename-id").value;
    if (id.length === 0) {
        return;
    }

    // Setup request
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == XMLHttpRequest.DONE) {
            let alert = document.getElementById("alert-div");

            if (xhttp.status != 200) {
                alert.style.display = "block";
                document.getElementById("rename-submit").removeAttribute("disabled");
            }

            switch (xhttp.status) {
                case 200:
                    location.reload();
                    break;

                case 400:
                    alert.textContent = "Either an image with the same name exists or you didn't provide a name. Please provide a new name.";
                    break;

                case 403:
                    alert.textContent = "You do not have permission to rename this image.";
                    break;

                case 404:
                    alert.textContent = "Server error: image not found.";
                    break;

                case 500:
                    alert.textContent = "An unexpected error occurred renaming the image. Please try again later."
                    break;

                default:
                    alert.textContent = "No response received from server.";
                    break;
            }
        }
    };

    // Send request
    xhttp.open("POST", `/image-maps/images/${id}`, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({
        "name": document.getElementById("rename-name").value,
        "extension": document.getElementById("rename-extension-data").value
    }));

    document.getElementById("rename-submit").setAttribute("disabled", "");
}

// Updates the name field
function updateName() {
    let elm = document.getElementById("rename-name");
    elm.value = elm.value.replace(/[^a-zA-Z0-9-_]/g, "");
}

// Delete stored image data on load
window.addEventListener('load', function() {
    // Submit rename form on enter
    let elm = document.getElementById("rename-name");
    elm.addEventListener("keyup", event => {
        if (event.keyCode === 13) {
            event.stopPropagation();
            document.getElementById("rename-submit").click();
        }
    });

    // Load images asynchronously
    Array.from(document.getElementsByClassName("uploaded-image")).forEach(img => {
        img.src = img.getAttribute("data-url");
    });

    sessionStorage.clear();
});
