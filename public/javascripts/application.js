// Initialize toasts when loaded
document.addEventListener('DOMContentLoaded', event => {
    Array.from(document.getElementsByClassName("toast")).forEach(element => {
        new bootstrap.Toast(element, {
            delay: 5000
        }).show();
    });
});

// Enable tooltips
window.addEventListener('load', function() {
    let tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
