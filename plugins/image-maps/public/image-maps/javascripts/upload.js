// Updates the passed dimension box
function updateDimension(elm) {
    // Limit value
    let value = Number(elm.value);
    value = (value > elm.max ? elm.max : value);
    elm.value = value;

    // Update text
    let elmW = document.getElementById("width");
    let elmH = document.getElementById("height");
    elm = document.getElementById("dimensions");
    elm.textContent = `An image with these dimensions will require ${Math.ceil(elmW.value/128)} rows and ${Math.ceil(elmH.value/128)} columns.`;
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

                // Update dimensions
                let elmW = document.getElementById("width");
                let elmH = document.getElementById("height");

                let w = tmp.width;
                let h = tmp.height;
                if (w > elmW.max || h > elmH.max) {
                    if (w > h) {
                        w = 1280;
                        h *= (w/tmp.width);
                    } else {
                        w *= (h/tmp.height);
                        h = 1280;
                    }
                }

                elmW.value = w;
                elmH.value = h;

                let elm = document.getElementById("dimensions");
                elm.textContent = `An image with these dimensions will require ${Math.ceil(w/128)} rows and ${Math.ceil(h/128)} columns.`;

                // Update file name + extension
                let filename = event.files[0].name;
                let fixed = filename.split('.')[0].replace(/[^a-zA-Z0-9-_]/g, "");

                elm = document.getElementById("name");
                elm.value = fixed.substring(0, elm.getAttribute('maxlength'));

                document.getElementById("extension").textContent = `.${filename.split('.').pop()}`;
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
