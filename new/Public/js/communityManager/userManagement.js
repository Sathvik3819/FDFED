document.addEventListener('DOMContentLoaded', () => {
    const forms = {
        resident: {
            element: document.getElementById('residentForm'),
            route: '/users/communityManager/add-resident',
            fields: ['residentFirstname', 'residentLastname', 'residentEmail', 'residentBlock', 'houseNumber', 'residentContact'],
            mapToBackend: (values) => ({
                residentFirstname: values.residentFirstname?.trim(),
                residentLastname: values.residentLastname?.trim(),
                email: values.residentEmail?.trim(),
                blockNo: values.residentBlock?.trim(),
                flatNo: values.houseNumber?.trim(),
                contact: values.residentContact?.trim()
            })
        },
        worker: {
            element: document.getElementById('workerForm'),
            route: '/users/communityManager/add-worker',
            fields: ['workerName', 'workerEmail', 'workerJobRole', 'workerContact', 'workerAddress', 'workerSalary', 'workerAvailabilityStatus'],
            mapToBackend: (values) => ({
                name: values.workerName?.trim(),
                email: values.workerEmail?.trim(),
                jobRole: values.workerJobRole?.trim(),
                contact: values.workerContact?.trim(),
                address: values.workerAddress?.trim(),
                salary: parseFloat(values.workerSalary) || 0,
                availabilityStatus: values.workerAvailabilityStatus?.trim() || "Available"
            })
        },
        security: {
            element: document.getElementById('securityForm'),
            route: '/users/communityManager/add-security',
            fields: ['securityName', 'securityEmail', 'securityContact', 'securityAddress', 'securityShift'],
            mapToBackend: (values) => ({
                name: values.securityName?.trim(),
                email: values.securityEmail?.trim(),
                contact: values.securityContact?.trim(),
                address: values.securityAddress?.trim(),
                Shift: values.securityShift?.trim() || "Day"
            })
        }
    };
    
    function setupFormSubmission(formConfig) {
        const { element: form, route, fields, mapToBackend } = formConfig;
        
        if (form) {
            form.addEventListener('submit', async function(event) {
                event.preventDefault();
    
                try {
                    const values = {};
                    fields.forEach(field => {
                        const input = document.getElementById(field);
                        if (!input || input.value.trim() === '') {
                            throw new Error(`Field ${field} is required.`);
                        }
                        values[field] = input.value.trim();
                    });
    
                    const backendData = mapToBackend(values);
                    const type = Object.keys(forms).find(key => forms[key].element === form);
    
                    // Check if this is an edit operation
                    const hiddenInput = form.querySelector('input[name="userId"]');
                    const isEdit = hiddenInput && hiddenInput.value;
                    
                    let response;
                    if (isEdit) {
                        // Edit existing user
                        response = await fetch(`/users/communityManager/edit-user/${type}/${hiddenInput.value}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(backendData),
                        });
                    } else {
                        // Add new user
                        response = await fetch(route, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(backendData),
                        });
                    }
    
                    const result = await response.json();
    
                    if (!response.ok) {
                        throw new Error(result.error || result.message || 'Operation failed');
                    }
    
                    if (isEdit) {
                        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
                    } else {
                        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`);
                    }
    
                    form.reset();
                    // Remove hidden userId input if it exists
                    if (hiddenInput) {
                        hiddenInput.remove();
                    }
                    closeForm(type);
                    
                    // Refresh the page to show updated data
                    window.location.reload();
    
                } catch (error) {
                    console.error('Form submission error:', error);
                    alert(error.message);
                }
            });
        }
    }

    Object.values(forms).forEach(setupFormSubmission);

    // Tab switching functionality
    function showTab(tabName) {
        // Hide all table containers
        document.querySelectorAll('.table-container').forEach(content => {
            content.style.display = 'none';
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.classList.remove('active');
        });

        // Show selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }

        // Add active class to clicked tab button
        const activeTabButton = document.querySelector(`.tab-btn[onclick="showTab('${tabName}')"]`);
        if (activeTabButton) {
            activeTabButton.classList.add('active');
        }
    }

    // Form popup functions
    function openForm(type) {
        const formPopup = document.getElementById(`${type}FormPopup`);
        if (formPopup) {
            formPopup.style.display = 'block';
            // Reset form title for add mode
            const title = formPopup.querySelector('.form-title');
            if (title) {
                title.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            }
        }
    }

    function closeForm(type) {
        const formPopup = document.getElementById(`${type}FormPopup`);
        if (formPopup) {
            formPopup.style.display = 'none';
            // Reset the form
            const form = formPopup.querySelector('form');
            if (form) {
                form.reset();
                // Remove hidden userId input if it exists
                const hiddenInput = form.querySelector('input[name="userId"]');
                if (hiddenInput) {
                    hiddenInput.remove();
                }
            }
        }
    }

    // Edit user functionality
    async function editUser(userId, type) {
        try {
            // Fetch user data from backend
            const response = await fetch(`/users/communityManager/get-user/${type}/${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const userData = await response.json();
            
            // Populate form with user data
            populateEditForm(userData, type);
            
            // Open the form popup
            openForm(type);
            
            // Change form title to edit mode
            const formPopup = document.getElementById(`${type}FormPopup`);
            const title = formPopup.querySelector('.form-title');
            if (title) {
                title.textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            }
            
            // Add hidden input for user ID
            const form = formPopup.querySelector('form');
            let hiddenInput = form.querySelector('input[name="userId"]');
            if (!hiddenInput) {
                hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = 'userId';
                form.appendChild(hiddenInput);
            }
            hiddenInput.value = userId;
            
        } catch (error) {
            console.error('Edit user error:', error);
            alert('Failed to load user data for editing');
        }
    }

    function populateEditForm(userData, type) {
        if (type === 'resident') {
            document.getElementById('residentFirstname').value = userData.residentFirstname || '';
            document.getElementById('residentLastname').value = userData.residentLastname || '';
            document.getElementById('residentEmail').value = userData.email || '';
            document.getElementById('residentBlock').value = userData.blockNo || '';
            document.getElementById('houseNumber').value = userData.flatNo || '';
            document.getElementById('residentContact').value = userData.contact || '';
        } else if (type === 'worker') {
            document.getElementById('workerName').value = userData.name || '';
            document.getElementById('workerEmail').value = userData.email || '';
            document.getElementById('workerJobRole').value = userData.jobRole || '';
            document.getElementById('workerContact').value = userData.contact || '';
            document.getElementById('workerAddress').value = userData.address || '';
            document.getElementById('workerSalary').value = userData.salary || '';
            document.getElementById('workerAvailabilityStatus').value = userData.availabilityStatus || 'Available';
        } else if (type === 'security') {
            document.getElementById('securityName').value = userData.name || '';
            document.getElementById('securityEmail').value = userData.email || '';
            document.getElementById('securityContact').value = userData.contact || '';
            document.getElementById('securityAddress').value = userData.address || '';
            document.getElementById('securityShift').value = userData.Shift || 'Day';
        }
    }

    // Delete user functionality
    async function deleteUser(userId, type) {
        // Safeguard: If type is not provided, try to determine it from the table
        if (!type) {
            const row = document.querySelector(`tr[data-user-id="${userId}"]`);
            if (row) {
                const table = row.closest('table');
                const tableId = table.closest('.table-container').id;
                
                // Map table container IDs to user types
                const typeMap = {
                    'residents': 'resident',
                    'workers': 'worker',
                    'security': 'security'
                };
                type = typeMap[tableId];
            }
        }

        if (!type) {
            alert('Unable to determine user type. Please refresh the page and try again.');
            return;
        }

        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const response = await fetch(`/users/communityManager/delete-user/${type}/${userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete user');
            }

            alert('User deleted successfully!');
            // Refresh the page to show updated data
            window.location.reload();
        } catch (error) {
            console.error('Delete user error:', error);
            alert('Failed to delete user: ' + error.message);
        }
    }

    // Update shift for security personnel
    async function updateShift(userId, shift) {
        try {
            const response = await fetch(`/users/communityManager/update-shift/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Shift: shift })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to update shift');
            }

            console.log('Shift updated successfully');
        } catch (error) {
            console.error('Update shift error:', error);
            alert('Failed to update shift: ' + error.message);
        }
    }

    // Update worker status
    async function updateWorkerStatus(userId, status) {
        try {
            const response = await fetch(`/users/communityManager/update-worker-status/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availabilityStatus: status })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to update worker status');
            }

            console.log('Worker status updated successfully');
        } catch (error) {
            console.error('Update worker status error:', error);
            alert('Failed to update worker status: ' + error.message);
        }
    }

    // Expose functions to global scope for onclick handlers
    window.showTab = showTab;
    window.openForm = openForm;
    window.closeForm = closeForm;
    window.editUser = editUser;
    window.deleteUser = deleteUser;
    window.updateShift = updateShift;
    window.updateWorkerStatus = updateWorkerStatus;

    // Add event listeners for close buttons
    document.querySelectorAll('.close-btn').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const popup = this.closest('.popup');
            if (popup) {
                popup.style.display = 'none';
            }
        });
    });

    // Close popup when clicking outside of it
    document.querySelectorAll('.popup').forEach(popup => {
        popup.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
});