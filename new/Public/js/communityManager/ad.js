document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab');
    const cards = document.querySelectorAll('.card');
    
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all cards
            cards.forEach(card => card.style.display = 'none');
            
            // Show the card corresponding to the clicked tab
            cards[index].style.display = 'block';
        });
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            mainContent.style.marginLeft = '270px';
        } else {
            mainContent.style.marginLeft = '0';
        }
    });

    // File upload handling
    const uploadArea = document.querySelector('.upload-area');
    let uploadedFile = null;
    
    uploadArea.addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.click();
        
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                uploadedFile = e.target.files[0];
                
                // Check file size (max 2MB)
                if (uploadedFile.size > 2 * 1024 * 1024) {
                    alert('File size exceeds 2MB limit. Please choose a smaller file.');
                    return;
                }
                
                // Display preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    uploadArea.innerHTML = `
                        <div class="uploaded-image">
                            <img src="${e.target.result}" alt="Uploaded Image">
                            <button class="remove-image">✕</button>
                        </div>
                    `;
                    
                    // Update preview area
                    updatePreview(e.target.result);
                    
                    // Add remove button functionality
                    document.querySelector('.remove-image').addEventListener('click', function(e) {
                        e.stopPropagation();
                        resetUploadArea();
                        resetPreview();
                        uploadedFile = null;
                    });
                };
                reader.readAsDataURL(uploadedFile);
            }
        });
    });
    
    // Function to reset upload area
    function resetUploadArea() {
        uploadArea.innerHTML = `
            <div>
                <p style="color: #777; font-size: 12px;">Recommended size: 1200x300px. Max file size: 2MB</p>
            </div>
        `;
    }
    
    // Function to update preview
    function updatePreview(imageSrc) {
        const previewArea = document.querySelector('.preview-area');
        const title = document.getElementById('ad-title').value || 'Advertisement Title';
        const link = document.querySelector('input[placeholder="https://example.com"]').value;
        
        previewArea.innerHTML = `
            <div class="ad-preview">
                <img src="${imageSrc}" alt="Advertisement Preview">
                <div class="ad-preview-info">
                    <h3>${title}</h3>
                    ${link ? `<a href="${link}" target="_blank">Learn More →</a>` : ''}
                </div>
            </div>
        `;
    }
    
    // Function to reset preview
    function resetPreview() {
        const previewArea = document.querySelector('.preview-area');
        previewArea.innerHTML = `
            <div style="color: #777;">
                <p>Your advertisement preview will appear here</p>
                <p style="font-size: 12px;">The preview shows how your ad will look on the resident dashboard</p>
            </div>
        `;
    }
    
    // Update preview when title or link changes
    document.getElementById('ad-title').addEventListener('input', function() {
        if (uploadedFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                updatePreview(e.target.result);
            };
            reader.readAsDataURL(uploadedFile);
        }
    });
    
    document.querySelector('input[placeholder="https://example.com"]').addEventListener('input', function() {
        if (uploadedFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                updatePreview(e.target.result);
            };
            reader.readAsDataURL(uploadedFile);
        }
    });
    
    // Form validation and submission
    const publishButton = document.querySelector('.btn-primary');
    publishButton.addEventListener('click', function() {
        const title = document.getElementById('ad-title').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        // Basic validation
        if (!title) {
            alert('Please enter an advertisement title.');
            return;
        }
        
        if (!startDate) {
            alert('Please select a start date.');
            return;
        }
        
        if (!endDate) {
            alert('Please select an end date.');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            alert('End date must be after start date.');
            return;
        }
        
        if (!uploadedFile) {
            alert('Please upload an image for your advertisement.');
            return;
        }
        
        // Create FormData object for sending to server
        const formData = new FormData();
        formData.append('title', title);
        formData.append('startDate', startDate);
        formData.append('endDate', endDate);
        formData.append('image', uploadedFile);
        formData.append('link', document.querySelector('input[placeholder="https://example.com"]').value);
        
        // Send data to server (implement AJAX call here)
        // For demonstration purposes, we'll just show a success message
        alert('Advertisement published successfully!');
        
        // Reset form
        document.getElementById('ad-title').value = '';
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        document.querySelector('input[placeholder="https://example.com"]').value = '';
        resetUploadArea();
        resetPreview();
        uploadedFile = null;
    });
});


