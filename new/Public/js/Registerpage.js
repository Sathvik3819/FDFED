// Form submission logic
document.getElementById('combinedForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get form values
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const communityName = document.getElementById('communityName').value.trim();
    const location = document.getElementById('location').value.trim();
    const description = document.getElementById('description').value.trim();

    // Check required fields
    if (!firstName || !lastName || !email || !phone || !communityName || !location || !description) {
        showAlert('Please fill in all required fields.', 'error');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address.', 'error');
        return;
    }

    // ✅ Phone number validation (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
        showAlert('Please enter a valid 10-digit phone number.', 'error');
        return;
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('communityName', communityName);
    formData.append('location', location);
    formData.append('description', description);

    // Append photos
    selectedPhotos.forEach(photo => {
        formData.append('photos', photo);
    });

    // Submit form
    fetch('/interest/submit', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { 
                throw new Error(err.message || 'Server error'); 
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        showAlert('Application submitted successfully! We will review your request.', 'success');
        // Reset form
        document.getElementById('combinedForm').reset();
        selectedPhotos = [];
        photoPreviewGrid.innerHTML = '';
        updatePhotoPreviewVisibility();
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Error submitting application: ' + error.message, 'error');
    });
});


const icon = document.querySelector("#img");
const pass = document.querySelector("#password");

icon.addEventListener("click", () => {
    console.log("clicked");

    if (pass.type === "password") {
        pass.type = "text";
        icon.src = "../imgs/showPass.svg";
    } else {
        pass.type = "password";
        icon.src = "../imgs/hidePass.svg";
    }
});