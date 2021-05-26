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

}
