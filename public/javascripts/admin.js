// Confirms that the user wishes to delete a user from the database
// and performs the action.
function confirmDeleteUser(button) {
    // Get data
    let username = button.getAttribute('data-username');
    let path = button.getAttribute('data-path');

    // Prompt for confirmation
    let confirmed = confirm(`Are you sure you wish to delete '${username}'? This action cannot be undone.`);
    if (confirmed != true) {
        return;
    }

    // If confirmed, send DELETE request
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == XMLHttpRequest.DONE) {
            let alert = document.getElementById("alert-div");

            if (xhttp.status != 200) {
                alert.style.display = "block";
            }

            switch (xhttp.status) {
                case 200:
                    location.reload();
                    break;

                case 400:
                    alert.textContent = "A error occurred finding that user. Please refresh the page and try again."
                    break;

                case 403:
                    alert.textContent = "You can't delete yourself!"
                    break;

                case 500:
                    alert.textContent = "An unexpected error occurred deleting the user. See the server logs for more information."
                    break;

                default:
                    alert.textContent = "No response received from server.";
                    break;
            }
        }
    }

    xhttp.open("DELETE", path, true);
    xhttp.send();
}

function onRefreshClick() {
    document.getElementById("refresh-button").setAttribute("disabled", "");
    document.getElementById("refresh-spinner").style.display = "inline-block";
}