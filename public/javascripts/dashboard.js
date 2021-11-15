// Toggles the sidebar based on the value in the cookie
// Passed true if the setting should be inverted
function toggleSidebar(toggle) {
    // Read cookie value
    let sidebarSize = Cookies.get("sidebarSize");
    if (sidebarSize === undefined) {
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
    Cookies.set("sidebarSize", sidebarSize, {
        expires: 3650   // 10 years
    });

    // Adjust sidebar appearance
    let smElms = Array.from(document.getElementsByClassName("sidebar-sm"));
    let smTipElms = Array.from(document.getElementsByClassName("sidebar-sm-tooltip"));
    let lgElms = Array.from(document.getElementsByClassName("sidebar-lg"));

    if (sidebarSize == "small") {
        smTipElms.forEach(elm => {
            bootstrap.Tooltip.getInstance(elm).enable();
        });

        if (toggle) {
            smElms.forEach(elm => {
                elm.classList.toggle("d-none");
            });
            lgElms.forEach(elm => {
                elm.classList.toggle("d-none");
            });
        }

        document.getElementById("pluginContent").classList.add("content-lg");
        document.getElementById("pluginContent").classList.remove("content-sm");
        document.getElementById("sidebar").classList.add("content-lg");
        document.getElementById("sidebar").classList.remove("content-sm");

    } else if (sidebarSize == "large") {
        smTipElms.forEach(elm => {
            bootstrap.Tooltip.getInstance(elm).disable();
        });

        if (toggle) {
            smElms.forEach(elm => {
                window.setTimeout(() => {
                    elm.classList.toggle("d-none");
                }, 300);
            });
            lgElms.forEach(elm => {
                window.setTimeout(() => {
                    elm.classList.toggle("d-none");
                }, 300);
            });
        }

        document.getElementById("pluginContent").classList.add("content-sm");
        document.getElementById("pluginContent").classList.remove("content-lg");
        document.getElementById("sidebar").classList.add("content-sm");
        document.getElementById("sidebar").classList.remove("content-lg");
    }
}

// Add event for when the DOM is loaded
window.addEventListener("load", () => {
    toggleSidebar(false);
});