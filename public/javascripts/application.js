// Initialize toasts when loaded
document.addEventListener('DOMContentLoaded', event => {
    Array.from(document.getElementsByClassName("toast")).forEach(element => {
        new bootstrap.Toast(element, {
            delay: 5000
        }).show();
    });
});