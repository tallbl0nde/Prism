function onFormSubmit() {
    document.getElementById("password-submit").setAttribute('disabled', '');
}

// Sends a POST request to rename an image
function sendImageRequest(event) {
    // Get image data
    if (event.files && event.files[0]) {
        let reader = new FileReader();
        reader.onload = (e) => {
            let tmp = new Image();
            tmp.onload = () => {
                // Setup request
                let xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function() {
                    if (xhttp.readyState == XMLHttpRequest.DONE) {
                        location.reload();
                    }
                };

                // Send request
                xhttp.open("POST", `/account/image`, true);
                xhttp.setRequestHeader('Content-Type', 'application/json');
                xhttp.send(JSON.stringify({
                    data: tmp.src
                }));
            }
            tmp.src = e.target.result;
        };

        reader.readAsDataURL(event.files[0]);
    }
}

// Sends a POST request to rename an image
function sendRenameRequest() {
    // Hide alert div
    document.getElementById("alert-div").style.display = "none";

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
                    alert.textContent = "No name was provided, please provide a new name!";
                    break;

                case 403:
                    alert.textContent = "You do not have permission to perform this action.";
                    break;

                case 500:
                    alert.textContent = "An unexpected error occurred changing your username. Please try again later."
                    break;

                default:
                    alert.textContent = "No response received from server.";
                    break;
            }
        }
    };

    // Send request
    xhttp.open("POST", `/account/username`, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({
        "name": document.getElementById("rename-name").value
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
});
