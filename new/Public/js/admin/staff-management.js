document.addEventListener('DOMContentLoaded', function() {
    // ====== SIDEBAR TOGGLE ======
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            document.querySelector('.main-content').classList.toggle('expanded');
        });
    }

    // ====== MODAL HANDLING ======
    const modals = {
        resident: document.getElementById('residentModal'),
        security: document.getElementById('securityModal'),
        worker: document.getElementById('workerModal'),
        viewDetails: document.getElementById('viewDetailsModal'),
        deleteConfirmation: document.getElementById('deleteConfirmationModal')
    };

    function openModal(modalId) {
        if (modals[modalId]) {
            // Close all modals first
            closeAllModals();
            
            // Then open the requested modal
            modals[modalId].classList.add('show');
            document.body.classList.add('modal-open');
            
            console.log(`Opening modal: ${modalId}`);
        } else {
            console.error(`Modal with ID ${modalId} not found in modals object`);
        }
    }

    // Close modal function - updated to use CSS classes
    function closeModal(modalId) {
        if (modals[modalId]) {
            modals[modalId].classList.remove('show');
            document.body.classList.remove('modal-open');
            
            console.log(`Closing modal: ${modalId}`);
        } else {
            console.error(`Modal with ID ${modalId} not found in modals object`);
        }
    }

    // Close all modals - updated to use CSS classes
    function closeAllModals() {
        Object.keys(modals).forEach(modalId => {
            if (modals[modalId]) {
                modals[modalId].classList.remove('show');
            }
        });
        document.body.classList.remove('modal-open');
        
        console.log('Closed all modals');
    }

    // Close modal buttons
    document.querySelectorAll('.modal-close, [data-dismiss="modal"]').forEach(button => {
        button.addEventListener('click', function() {
            closeAllModals();
        });
    });

    // Close modal on outside click
    Object.values(modals).forEach(modal => {
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeAllModals();
                }
            });
        }
    });

    // ====== ADD BUTTONS ======
    const addButtons = {
        resident: document.getElementById('addResidentBtn'),
        security: document.getElementById('addSecurityBtn'),
        worker: document.getElementById('addWorkerBtn')
    };

    // Add button click handlers
    Object.keys(addButtons).forEach(type => {
        if (addButtons[type]) {
            addButtons[type].addEventListener('click', function() {
                resetForm(type);
                // Update modal title
                document.getElementById(`${type}ModalTitle`).textContent = `Add New ${type === 'resident' ? 'Resident' : type === 'security' ? 'Security Personnel' : 'Maintenance Worker'}`;
                openModal(type);
            });
        }
    });

    // ====== SAVE BUTTONS ======
    const saveButtons = {
        resident: document.getElementById('saveResident'),
        security: document.getElementById('saveSecurity'),
        worker: document.getElementById('saveWorker')
    };

    // Save button click handlers
    Object.keys(saveButtons).forEach(type => {
        if (saveButtons[type]) {
            saveButtons[type].addEventListener('click', function() {
                saveStaffMember(type);
            });
        }
    });

    // ====== VIEW/EDIT/DELETE BUTTONS ======
    // Handle view button clicks
    document.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            const itemType = this.getAttribute('data-type');
            viewStaffDetails(itemType, itemId);
        });
    });

    // Edit button click handlers
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            const itemType = this.getAttribute('data-type');
            editStaffMember(itemType, itemId);
        });
    });

    // Delete button click handlers
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            const itemType = this.getAttribute('data-type');
            const itemRow = document.querySelector(`tr[data-id="${itemId}"]`);
            let itemName = '';
            
            if (itemRow) {
                itemName = itemRow.querySelector('td:first-child').textContent;
            }
            
            // Set delete modal info
            document.getElementById('deleteItemName').textContent = itemName;
            
            // Store data for delete confirmation
            document.getElementById('confirmDelete').setAttribute('data-id', itemId);
            document.getElementById('confirmDelete').setAttribute('data-type', itemType);
            
            // Open delete confirmation modal
            openModal('deleteConfirmation');
        });
    });

    // Confirm delete button
    document.getElementById('confirmDelete').addEventListener('click', function() {
        const itemId = this.getAttribute('data-id');
        const itemType = this.getAttribute('data-type');
        deleteStaffMember(itemType, itemId);
    });

    // Edit from view details button
    document.getElementById('editFromView').addEventListener('click', function() {
        const itemId = this.getAttribute('data-id');
        const itemType = this.getAttribute('data-type');
        closeModal('viewDetails');
        editStaffMember(itemType, itemId);
    });

    // ====== FILTERING ======
    // Global search
    const globalSearchInput = document.getElementById('globalSearchInput');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', function() {
            filterStaffMembers();
        });
    }

    // Community filter
    const communityFilter = document.getElementById('communityFilter');
    if (communityFilter) {
        communityFilter.addEventListener('change', function() {
            filterStaffMembers();
        });
    }

    // ====== PAGINATION ======
    // Setup pagination for all tables
    setupPagination('residents');
    setupPagination('security');
    setupPagination('workers');

    // ====== HELPER FUNCTIONS ======
    
    // Function to reset form
    function resetForm(type) {
        const form = document.getElementById(`${type}Form`);
        if (form) {
            form.reset();
            // Remove any data-id attribute if exists
            if (form.hasAttribute('data-id')) {
                form.removeAttribute('data-id');
            }
            
            // Show password field for new entries
            document.getElementById(`${type}Password`).required = true;
            document.getElementById(`${type}PasswordNote`).style.display = 'none';
        }
    }

    // Function to save staff member (create or update)
    async function saveStaffMember(type) {
        const form = document.getElementById(`${type}Form`);
        if (!form) return;
        
        // Check if all required fields are filled
        const isValid = form.checkValidity();
        if (!isValid) {
            form.reportValidity();
            return;
        }
        
        // Prepare data object based on form type
        let data = {};
        const itemId = form.getAttribute('data-id');
        const isUpdate = !!itemId;
        
        try {
            // Build data object based on staff type
            switch(type) {
                case 'resident':
                    data = {
                        residentFirstname: document.getElementById('residentFirstname').value,
                        residentLastname: document.getElementById('residentLastname').value,
                        flatNo: document.getElementById('flatNo').value,
                        blockNo: document.getElementById('blockNo').value,
                        email: document.getElementById('residentEmail').value,
                        contact: document.getElementById('residentContact').value,
                        communityId: document.getElementById('residentCommunity').value
                    };
                    
                    // Add password only if provided or new entry
                    const residentPassword = document.getElementById('residentPassword').value;
                    if (residentPassword || !isUpdate) {
                        data.password = residentPassword;
                    }
                    break;
                    
                case 'security':
                    data = {
                        name: document.getElementById('securityName').value,
                        email: document.getElementById('securityEmail').value,
                        contact: document.getElementById('securityContact').value,
                        address: document.getElementById('securityAddress').value,
                        Shift: document.getElementById('securityShift').value,
                        
                    };
                    
                    // Add password only if provided or new entry
                    const securityPassword = document.getElementById('securityPassword').value;
                    if (securityPassword || !isUpdate) {
                        data.password = securityPassword;
                    }
                    break;
                    
                case 'worker':
                    data = {
                        name: document.getElementById('workerName').value,
                        email: document.getElementById('workerEmail').value,
                        contact: document.getElementById('workerContact').value,
                        address: document.getElementById('workerAddress').value,
                        jobRole: document.getElementById('workerJobRole').value,
                        availabilityStatus: document.getElementById('workerStatus').value,
                        salary: document.getElementById('workerSalary').value,
                        communityId: document.getElementById('workerCommunity').value
                    };
                    
                    // Add password only if provided or new entry
                    const workerPassword = document.getElementById('workerPassword').value;
                    if (workerPassword || !isUpdate) {
                        data.password = workerPassword;
                    }
                    break;
            }
            
            // API endpoint based on staff type and operation (create/update)
            const endpoint = isUpdate 
                ? `/users/admin/api/${type === 'resident' ? 'residents' : type === 'security' ? 'security' : 'workers'}/${itemId}`
                : `/users/admin/api/${type === 'resident' ? 'residents' : type === 'security' ? 'security' : 'workers'}`;
            
            // HTTP method based on operation
            const method = isUpdate ? 'PUT' : 'POST';
            
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Success: reload page to show updated data
                window.location.reload();
            } else {
                // Error handling
                alert(`Error: ${result.error || 'Unknown error occurred'}`);
            }
        } catch (error) {
            console.error(`Error ${isUpdate ? 'updating' : 'creating'} ${type}:`, error);
            alert(`Failed to ${isUpdate ? 'update' : 'add'} ${type}. Please try again.`);
        }
    }

    // Function to view staff details
    async function viewStaffDetails(type, id) {
        try {
            // API endpoint based on staff type
            const endpoint = `/users/admin/api/${type === 'resident' ? 'residents' : type === 'security' ? 'security' : 'workers'}/${id}`;
            
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (response.ok) {
                // Get content container
                const contentContainer = document.getElementById('viewDetailsContent');
                
                // Set modal title based on staff type
                let title = '';
                switch(type) {
                    case 'resident':
                        title = 'Resident Details';
                        break;
                    case 'security':
                        title = 'Security Personnel Details';
                        break;
                    case 'worker':
                        title = 'Maintenance Worker Details';
                        break;
                }
                document.getElementById('viewDetailsTitle').textContent = title;
                
                // Store data for edit button
                document.getElementById('editFromView').setAttribute('data-id', id);
                document.getElementById('editFromView').setAttribute('data-type', type);
                
                // Generate HTML based on staff type
                let html = '';
                
                if (type === 'resident') {
                    const resident = data.resident || data; // Handle different API response formats
                    html = `
                        <div class="details-item">
                            <div class="details-label">Name</div>
                            <div class="details-value">${resident.residentFirstname} ${resident.residentLastname}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Flat/Block</div>
                            <div class="details-value">Flat ${resident.flatNo}, Block ${resident.blockNo}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Email</div>
                            <div class="details-value">${resident.email}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Contact</div>
                            <div class="details-value">${resident.contact}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Community</div>
                            <div class="details-value">${resident.community ? resident.community.name : 'Unassigned'}</div>
                        </div>
                    `;
                } else if (type === 'security') {
                    const security = data.security || data;
                    html = `
                        <div class="details-item">
                            <div class="details-label">Name</div>
                            <div class="details-value">${security.name}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Email</div>
                            <div class="details-value">${security.email}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Contact</div>
                            <div class="details-value">${security.contact}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Address</div>
                            <div class="details-value">${security.address}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Shift</div>
                            <div class="details-value">${security.Shift}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Community</div>
                            <div class="details-value">${security.community ? security.community.name : 'Unassigned'}</div>
                        </div>
                    `;
                } else if (type === 'worker') {
                    const worker = data.worker || data;
                    html = `
                        <div class="details-item">
                            <div class="details-label">Name</div>
                            <div class="details-value">${worker.name}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Email</div>
                            <div class="details-value">${worker.email}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Contact</div>
                            <div class="details-value">${worker.contact}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Address</div>
                            <div class="details-value">${worker.address}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Job Role</div>
                            <div class="details-value">${worker.jobRole}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Availability Status</div>
                            <div class="details-value">
                                <span class="status-badge status-${worker.availabilityStatus.toLowerCase().replace(' ', '-')}">${worker.availabilityStatus}</span>
                            </div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Salary</div>
                            <div class="details-value">$${worker.salary}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Community</div>
                            <div class="details-value">${worker.community ? worker.community.name : 'Unassigned'}</div>
                        </div>
                    `;
                }
                
                contentContainer.innerHTML = html;
                openModal('viewDetails');
            } else {
                // Error handling
                alert(`Error: ${data.error || 'Could not fetch details'}`);
            }
        } catch (error) {
            console.error(`Error fetching ${type} details:`, error);
            alert(`Failed to fetch ${type} details. Please try again.`);
        }
    }

    // Function to edit staff member
    async function editStaffMember(type, id) {
        try {
            // API endpoint based on staff type
            const endpoint = `/users/admin/api/${type === 'resident' ? 'residents' : type === 'security' ? 'security' : 'workers'}/${id}`;
            
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (response.ok) {
                // Get the proper data object based on response structure
                const item = data[type] || data;
                
                // Set form as edit mode
                const form = document.getElementById(`${type}Form`);
                form.setAttribute('data-id', id);
                
                // Update modal title
                document.getElementById(`${type}ModalTitle`).textContent = `Edit ${type === 'resident' ? 'Resident' : type === 'security' ? 'Security Personnel' : 'Maintenance Worker'}`;
                
                // Password is not required on edit
                document.getElementById(`${type}Password`).required = false;
                document.getElementById(`${type}PasswordNote`).style.display = 'block';
                
                // Fill form fields based on staff type
                switch(type) {
                    case 'resident':
                        document.getElementById('residentFirstname').value = item.residentFirstname;
                        document.getElementById('residentLastname').value = item.residentLastname;
                        document.getElementById('flatNo').value = item.flatNo;
                        document.getElementById('blockNo').value = item.blockNo;
                        document.getElementById('residentEmail').value = item.email;
                        document.getElementById('residentContact').value = item.contact;
                       
                        document.getElementById('residentPassword').value = ''; // Clear password field
                        break;
                        
                    case 'security':
                        document.getElementById('securityName').value = item.name;
                        document.getElementById('securityEmail').value = item.email;
                        document.getElementById('securityContact').value = item.contact;
                        document.getElementById('securityAddress').value = item.address;
                        document.getElementById('securityShift').value = item.Shift;
                       
                        document.getElementById('securityPassword').value = ''; // Clear password field
                        break;
                        
                    case 'worker':
                        document.getElementById('workerName').value = item.name;
                        document.getElementById('workerEmail').value = item.email;
                        document.getElementById('workerContact').value = item.contact;
                        document.getElementById('workerAddress').value = item.address;
                        document.getElementById('workerJobRole').value = item.jobRole;
                        document.getElementById('workerStatus').value = item.availabilityStatus;
                        document.getElementById('workerSalary').value = item.salary;
                        
                        document.getElementById('workerPassword').value = ''; // Clear password field
                        break;
                }
                
                // Open modal
                openModal(type);
            } else {
                // Error handling
                alert(`Error: ${data.error || 'Could not fetch staff details'}`);
            }
        } catch (error) {
            console.error(`Error fetching ${type} for edit:`, error);
            alert(`Failed to fetch ${type} details for editing. Please try again.`);
        }
    }

    // Function to delete staff member
    async function deleteStaffMember(type, id) {
        try {
            // API endpoint based on staff type
            const endpoint = `/users/admin/api/${type === 'resident' ? 'residents' : type === 'security' ? 'security' : 'workers'}/${id}`;
            
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Close the modal
                closeModal('deleteConfirmation');
                
                // Success: reload page to show updated data
                window.location.reload();
            } else {
                // Error handling
                alert(`Error: ${data.error || 'Could not delete item'}`);
            }
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            alert(`Failed to delete ${type}. Please try again.`);
        }
    }

    // Function to filter staff members based on search and community filter
    function filterStaffMembers() {
        const searchTerm = document.getElementById('globalSearchInput').value.toLowerCase();
        const communityFilter = document.getElementById('communityFilter').value.toLowerCase();
        
        // Filter all tables
        filterTable('residents', searchTerm, communityFilter);
        filterTable('security', searchTerm, communityFilter);
        filterTable('workers', searchTerm, communityFilter);
    }

    // Function to filter a specific table
    function filterTable(tableType, searchTerm, communityFilter) {
        const tbody = document.getElementById(`${tableType}TableBody`);
        if (!tbody) return;
        
        const rows = tbody.querySelectorAll('tr');
        let visibleRowCount = 0;
        
        rows.forEach(row => {
            // Skip message rows (e.g., "No data found")
            if (row.cells.length === 1 && row.cells[0].hasAttribute('colspan')) {
                return;
            }
            
            const rowText = row.textContent.toLowerCase();
            const rowCommunity = row.querySelector('td:nth-last-child(2)')?.textContent.toLowerCase() || '';
            
            // Apply filters
            const matchesSearch = searchTerm === '' || rowText.includes(searchTerm);
            const matchesCommunity = communityFilter === '' || rowCommunity.includes(communityFilter);
            
            // Show/hide row based on filters
            if (matchesSearch && matchesCommunity) {
                row.style.display = '';
                visibleRowCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Show "No results" message if no rows match the filters
        if (visibleRowCount === 0 && rows.length > 0) {
            // Check if "No results" message already exists
            let noResultsRow = tbody.querySelector('.no-results-row');
            
            if (!noResultsRow) {
                // Create new "No results" row
                noResultsRow = document.createElement('tr');
                noResultsRow.className = 'no-results-row';
                
                const cell = document.createElement('td');
                cell.textContent = 'No matching records found';
                cell.colSpan = tbody.querySelector('tr')?.cells.length || 6;
                cell.className = 'text-center';
                
                noResultsRow.appendChild(cell);
                tbody.appendChild(noResultsRow);
            } else {
                // Show existing "No results" row
                noResultsRow.style.display = '';
            }
        } else {
            // Hide "No results" message if rows match the filters
            const noResultsRow = tbody.querySelector('.no-results-row');
            if (noResultsRow) {
                noResultsRow.style.display = 'none';
            }
        }
        
        // Reset pagination
        resetPagination(tableType);
    }

    // Function to set up pagination for a specific table
    // Function to set up pagination for a specific table
function setupPagination(tableType) {
    const itemsPerPage = 5;
    const tbody = document.getElementById(`${tableType}TableBody`);
    const pagination = document.getElementById(`${tableType}Pagination`);
    
    if (!tbody || !pagination) return;
    
    const rows = tbody.querySelectorAll('tr:not(.no-results-row)');
    const totalRows = rows.length;
    const totalPages = Math.ceil(totalRows / itemsPerPage);
    
    // Update pagination info
    const pageInfo = pagination.querySelector('.page-info');
    const startRecordElem = pagination.querySelector('.start-record');
    const endRecordElem = pagination.querySelector('.end-record');
    const totalRecordsElem = pagination.querySelector('.total-records');
    
    if (pageInfo && startRecordElem && endRecordElem && totalRecordsElem) {
        startRecordElem.textContent = totalRows > 0 ? '1' : '0';
        endRecordElem.textContent = Math.min(totalRows, itemsPerPage);
        totalRecordsElem.textContent = totalRows;
    }
    
    // Create page buttons
    const pageButtons = pagination.querySelector('.page-buttons');
    if (pageButtons) {
        // Clear existing page number buttons (keep prev/next)
        const existingButtons = pageButtons.querySelectorAll('.page-number');
        existingButtons.forEach(button => button.remove());
        
        // Get prev/next buttons
        const prevButton = pageButtons.querySelector('.prev-page');
        const nextButton = pageButtons.querySelector('.next-page');
        
        // Add page number buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'page-btn page-number' + (i === 1 ? ' active' : '');
            pageButton.textContent = i;
            pageButton.dataset.page = i;
            
            // Insert between prev and next buttons
            if (nextButton) {
                pageButtons.insertBefore(pageButton, nextButton);
            } else {
                pageButtons.appendChild(pageButton);
            }
            
            // Add click event
            pageButton.addEventListener('click', function() {
                changePage(tableType, parseInt(this.dataset.page));
            });
        }
        
        // Add click events for prev/next buttons
        if (prevButton) {
            // Clear existing event listeners
            const newPrevButton = prevButton.cloneNode(true);
            prevButton.parentNode.replaceChild(newPrevButton, prevButton);
            
            newPrevButton.addEventListener('click', function() {
                if (!this.classList.contains('disabled')) {
                    const activePage = parseInt(pagination.querySelector('.page-number.active').dataset.page);
                    changePage(tableType, activePage - 1);
                }
            });
        }
        
        if (nextButton) {
            // Clear existing event listeners
            const newNextButton = nextButton.cloneNode(true);
            nextButton.parentNode.replaceChild(newNextButton, nextButton);
            
            newNextButton.addEventListener('click', function() {
                if (!this.classList.contains('disabled')) {
                    const activePage = parseInt(pagination.querySelector('.page-number.active').dataset.page);
                    changePage(tableType, activePage + 1);
                }
            });
        }
        
        // Initial button states
        if (prevButton) {
            prevButton.classList.add('disabled'); // Disabled on first page
        }
        
        if (nextButton) {
            nextButton.classList.toggle('disabled', totalPages <= 1);
        }
    }
    
    // Show initial page (actually hide all rows not on first page)
    changePage(tableType, 1);
}

// Function to change page
function changePage(tableType, pageNumber) {
    const itemsPerPage = 5;
    const tbody = document.getElementById(`${tableType}TableBody`);
    const pagination = document.getElementById(`${tableType}Pagination`);
    
    if (!tbody || !pagination) return;
    
    // Get all visible rows (excluding hidden rows from filtering and no-results rows)
    const visibleRows = Array.from(tbody.querySelectorAll('tr:not(.no-results-row)')).filter(row => 
        row.style.display !== 'none'
    );
    
    const totalRows = visibleRows.length;
    const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
    
    // Validate page number
    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));
    
    // Calculate start and end indices
    const startIndex = (pageNumber - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalRows);
    
    // Hide all rows first
    visibleRows.forEach(row => {
        row.style.display = 'none';
    });
    
    // Show only rows for current page
    for (let i = startIndex; i < endIndex; i++) {
        visibleRows[i].style.display = '';
    }
    
    // Update pagination info
    const startRecordElem = pagination.querySelector('.start-record');
    const endRecordElem = pagination.querySelector('.end-record');
    
    if (startRecordElem && endRecordElem) {
        startRecordElem.textContent = totalRows > 0 ? startIndex + 1 : '0';
        endRecordElem.textContent = endIndex;
    }
    
    // Update active page button
    const pageButtons = pagination.querySelectorAll('.page-number');
    pageButtons.forEach(button => {
        button.classList.toggle('active', parseInt(button.dataset.page) === pageNumber);
    });
    
    // Update prev/next button states
    const prevButton = pagination.querySelector('.prev-page');
    const nextButton = pagination.querySelector('.next-page');
    
    if (prevButton) {
        prevButton.classList.toggle('disabled', pageNumber <= 1);
    }
    
    if (nextButton) {
        nextButton.classList.toggle('disabled', pageNumber >= totalPages);
    }
}

// Function to reset pagination (after filtering)
function resetPagination(tableType) {
    const tbody = document.getElementById(`${tableType}TableBody`);
    const pagination = document.getElementById(`${tableType}Pagination`);
    
    if (!tbody || !pagination) return;
    
    // Get visible rows count (excluding hidden rows from filtering and no-results rows)
    const visibleRows = Array.from(tbody.querySelectorAll('tr:not(.no-results-row)')).filter(row => 
        row.style.display !== 'none'
    );
    
    const totalRows = visibleRows.length;
    const itemsPerPage = 5;
    const totalPages = Math.ceil(totalRows / itemsPerPage) || 1; // Ensure at least 1 page
    
    // Update page buttons
    const pageButtonsContainer = pagination.querySelector('.page-buttons');
    
    if (pageButtonsContainer) {
        // Get prev/next buttons
        const prevButton = pageButtonsContainer.querySelector('.prev-page');
        const nextButton = pageButtonsContainer.querySelector('.next-page');
        
        // Clear existing page buttons except prev/next
        const pageNumButtons = pageButtonsContainer.querySelectorAll('.page-number');
        pageNumButtons.forEach(button => button.remove());
        
        // Add new page buttons based on filtered rows
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'page-btn page-number' + (i === 1 ? ' active' : '');
            pageButton.textContent = i;
            pageButton.dataset.page = i;
            
            // Insert before next button or append if next button doesn't exist
            if (nextButton) {
                pageButtonsContainer.insertBefore(pageButton, nextButton);
            } else {
                pageButtonsContainer.appendChild(pageButton);
            }
            
            // Add click event
            pageButton.addEventListener('click', function() {
                changePage(tableType, parseInt(this.dataset.page));
            });
        }
        
        // Update prev/next button states
        if (prevButton) {
            prevButton.classList.add('disabled'); // Disabled on first page
        }
        
        if (nextButton) {
            nextButton.classList.toggle('disabled', totalPages <= 1);
        }
    }
    
    // Update pagination info
    const totalRecordsElem = pagination.querySelector('.total-records');
    const startRecordElem = pagination.querySelector('.start-record');
    const endRecordElem = pagination.querySelector('.end-record');
    
    if (totalRecordsElem && startRecordElem && endRecordElem) {
        totalRecordsElem.textContent = totalRows;
        startRecordElem.textContent = totalRows > 0 ? '1' : '0';
        endRecordElem.textContent = Math.min(totalRows, itemsPerPage);
    }
    
    // Show first page
    changePage(tableType, 1);
}
    // Initial filtering setup on page load
    filterStaffMembers();

    // Theme toggle functionality (if needed)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            
            // Store theme preference
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);
            
            // Update toggle icon
            const toggleIcon = themeToggle.querySelector('i');
            if (toggleIcon) {
                toggleIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
            }
        });
        
        // Load theme preference on startup
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        if (savedDarkMode) {
            document.body.classList.add('dark-mode');
            const toggleIcon = themeToggle.querySelector('i');
            if (toggleIcon) {
                toggleIcon.className = 'fas fa-sun';
            }
        }
    }

    // Table export functionality (CSV)
    const exportButtons = document.querySelectorAll('.export-table');
    exportButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tableType = this.getAttribute('data-table');
            exportTableToCSV(tableType);
        });
    });

    // Function to export table data to CSV
    function exportTableToCSV(tableType) {
        const table = document.getElementById(`${tableType}Table`);
        if (!table) return;

        const headers = [];
        const headerCells = table.querySelectorAll('thead th');
        headerCells.forEach(header => {
            // Skip action column
            if (!header.classList.contains('actions-column')) {
                headers.push(header.textContent.trim());
            }
        });

        const rows = [];
        const dataCells = table.querySelectorAll('tbody tr:not(.no-results-row):not(.hidden-row)');
        
        dataCells.forEach(row => {
            const rowData = [];
            const cells = row.querySelectorAll('td');
            
            cells.forEach((cell, index) => {
                // Skip action column
                if (!headerCells[index].classList.contains('actions-column')) {
                    rowData.push(cell.textContent.trim().replace(/,/g, ' '));
                }
            });
            
            if (rowData.length > 0) {
                rows.push(rowData);
            }
        });

        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.join(',') + '\n';
        });

        // Create download link
        const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${tableType}_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Notification handling
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        const notificationText = notification.querySelector('.notification-text');
        if (notificationText) {
            notificationText.textContent = message;
        }
        
        // Set notification type (success, error, info)
        notification.className = `notification ${type}`;
        
        // Show notification
        notification.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    // Close notification button
    const notificationClose = document.querySelector('.notification-close');
    if (notificationClose) {
        notificationClose.addEventListener('click', function() {
            const notification = document.getElementById('notification');
            if (notification) {
                notification.classList.remove('show');
            }
        });
    }
    
    // Check for success messages from redirect (if using URL parameters)
    const urlParams = new URLSearchParams(window.location.search);
    const successMsg = urlParams.get('success');
    const errorMsg = urlParams.get('error');
    
    if (successMsg) {
        showNotification(decodeURIComponent(successMsg), 'success');
    } else if (errorMsg) {
        showNotification(decodeURIComponent(errorMsg), 'error');
    }
});