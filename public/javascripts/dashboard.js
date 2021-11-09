// Toggles the sidebar based on the value in the cookie
// Passed true if the setting should be inverted
function toggleSidebar(toggle) {
    // Read cookie value
    let sidebarSize = localStorage.getItem("sidebarSize");
    if (sidebarSize === null) {
        sidebarSize = "large";
    }

    // Toggle if required
    if (toggle) {
        if (sidebarSize == "small") {
            sidebarSize = "large";
        } else if (sidebarSize = "large") {
            sidebarSize = "small";
        }
    }
    localStorage.setItem("sidebarSize", sidebarSize);

    // Disable/enable transition
    if (toggle == true) {
        document.getElementById("pluginContent").style.transition = "";
        document.getElementById("sidebar").style.transition = "";
    } else {
        document.getElementById("pluginContent").style.transition = "padding-left 0s";
        document.getElementById("sidebar").style.transition = "width 0s";
    }

    // Adjust sidebar appearance
    let smElms = Array.from(document.getElementsByClassName("sidebar-sm"));
    let smTipElms = Array.from(document.getElementsByClassName("sidebar-sm-tooltip"));
    let lgElms = Array.from(document.getElementsByClassName("sidebar-lg"));

    if (sidebarSize == "small") {
        smElms.forEach(elm => {
            elm.style.display = "inline-block";
        });
        smTipElms.forEach(elm => {
            console.log(elm);
            bootstrap.Tooltip.getInstance(elm).enable();
        });
        lgElms.forEach(elm => {
            elm.style.display = "none";
        });
        document.getElementById("pluginContent").style["padding-left"] = "5em";
        document.getElementById("sidebar").style.width = "5em";

    } else if (sidebarSize == "large") {
        smElms.forEach(elm => {
            window.setTimeout(() => {
                elm.style.display = "none";
            }, (toggle == true) ? 300 : 0);
        });
        smTipElms.forEach(elm => {
            console.log(elm);
            bootstrap.Tooltip.getInstance(elm).disable();
        });
        lgElms.forEach(elm => {
            window.setTimeout(() => {
                elm.style.display = "inline-block";
            }, (toggle == true) ? 300 : 0);
        });
        document.getElementById("pluginContent").style["padding-left"] = "";
        document.getElementById("sidebar").style.width = "";
    }
}

// Add event for when the DOM is loaded
window.addEventListener("load", () => {
    toggleSidebar(false);

    // Fade out overlay
    let overlay = document.getElementById('loading');
    overlay.style.opacity = '0';
    window.setTimeout(() => {
        overlay.style.display = 'none';
    }, 700);
});