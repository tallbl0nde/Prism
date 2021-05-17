// Disables the submit button
function onFormSubmit() {
    document.getElementById("upload-button").setAttribute("disabled", "");
}

// Updates the passed dimension box
function updateDimension(elm) {
    // Limit value
    let value = Number(elm.value);
    value = (value > elm.max ? elm.max : value);
    elm.value = value;

    // Update text
    updateDimensions();
}

// Updates the "this will require" text
function updateDimensions() {
    let elm = document.getElementById("dimensions");
    let w = document.getElementById("width").value;
    let h = document.getElementById("height").value;
    elm.textContent = `An image with these dimensions will require ${Math.ceil(h/128)} rows and ${Math.ceil(w/128)} columns.`;
}

// Updates image related fields with the passed path.
function updateImage(event) {
    if (event.files && event.files[0]) {
        let reader = new FileReader();
        reader.onload = (e) => {
            let tmp = new Image();
            tmp.onload = () => {
                // Display image
                document.getElementById("image").setAttribute('src', tmp.src);
                document.getElementById("data").value = tmp.src;

                // Update dimensions
                let elmW = document.getElementById("width");
                let elmH = document.getElementById("height");

                let w = tmp.width;
                let h = tmp.height;
                if (w > elmW.max || h > elmH.max) {
                    if (w > h) {
                        w = 1280;
                        h = Math.ceil(h * w/tmp.width);
                    } else {
                        h = 1280;
                        w = Math.ceil(w * h/tmp.height);
                    }
                }

                elmW.value = w;
                elmH.value = h;
                updateDimensions();

                // Update file name + extension
                let filename = event.files[0].name;
                let fixed = filename.split('.')[0].replace(/[^a-zA-Z0-9-_]/g, "");

                elm = document.getElementById("name");
                elm.value = fixed.substring(0, elm.getAttribute('maxlength'));

                document.getElementById("extension").textContent = `.${filename.split('.').pop()}`;
                document.getElementById("extension-data").value = `.${filename.split('.').pop()}`;
            }
            tmp.src = e.target.result;
        };

        reader.readAsDataURL(event.files[0]);
    }
}

// Updates the name field
function updateName() {
    let elm = document.getElementById("name");
    elm.value = elm.value.replace(/[^a-zA-Z0-9-_]/g, "");
}

// Store form data on unload
window.onbeforeunload = function() {
    sessionStorage.setItem("image", document.getElementById("image").getAttribute("src"));
    sessionStorage.setItem("extension", document.getElementById("extension").textContent);

    let attrs = ["name", "width", "height"];
    attrs.forEach(attr => {
        sessionStorage.setItem(attr, document.getElementById(attr).value);
    });
}

// Restore form data on load
window.onload = function() {
    let tmp = null;

    tmp = sessionStorage.getItem("image");
    if (tmp !== null) {
        document.getElementById("image").setAttribute("src", tmp);
        document.getElementById("data").value = tmp;
    }

    tmp = sessionStorage.getItem("extension");
    if (tmp !== null) {
        document.getElementById("extension").textContent = tmp;
        document.getElementById("extension-data").value = tmp;
    }

    let attrs = ["name", "width", "height"];
    attrs.forEach(attr => {
        tmp = sessionStorage.getItem(attr);
        if (tmp !== null) {
            document.getElementById(attr).value = tmp;
        }
    });

    if (document.getElementById("width").value) {
        updateDimensions();
    }
}