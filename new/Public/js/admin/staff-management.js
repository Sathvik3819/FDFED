// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const mainContent = document.querySelector('.main-content');
  
  const modals = {
    resident: document.getElementById('residentModal'),
    security: document.getElementById('securityModal'),
    worker: document.getElementById('workerModal'),
    viewDetails: document.getElementById('viewDetailsModal'),
    deleteConfirmation: document.getElementById('deleteConfirmationModal')
  };
  
  const addButtons = {
    resident: document.getElementById('addResidentBtn'),
    security: document.getElementById('addSecurityBtn'),
    worker: document.getElementById('addWorkerBtn')
  };
  
  const saveButtons = {
    resident: document.getElementById('saveResident'),
    security: document.getElementById('saveSecurity'),
    worker: document.getElementById('saveWorker')
  };
  
  const globalSearchInput = document.getElementById('globalSearchInput');
  const communityFilter = document.getElementById('communityFilter');
  const themeToggle = document.getElementById('themeToggle');
  const notification = document.getElementById('notification');
  
  // Variables
  let residents = [];
  let securityPersonnel = [];
  let maintenanceWorkers = [];
  let filteredResidents = [];
  let filteredSecurity = [];
  let filteredWorkers = [];
  let selectedItemId = null;
  let selectedItemType = null;

  // Event Listeners
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      if (mainContent) mainContent.classList.toggle('expanded');
    });
  }
  
  // Modal handling
  function openModal(modalId) {
    if (modals[modalId]) {
      closeAllModals();
      modals[modalId].classList.add('show');
      document.body.classList.add('modal-open');
    }
  }
  
  function closeModal(modalId) {
    if (modals[modalId]) {
      modals[modalId].classList.remove('show');
      document.body.classList.remove('modal-open');
    }
  }
  
  function closeAllModals() {
    Object.values(modals).forEach(modal => {
      if (modal) modal.classList.remove('show');
    });
    document.body.classList.remove('modal-open');
  }
  
  // Close modal buttons
  document.querySelectorAll('.modal-close, [data-dismiss="modal"]').forEach(button => {
    button.addEventListener('click', closeAllModals);
  });
  
  // Close modal on outside click
  Object.values(modals).forEach(modal => {
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) closeAllModals();
      });
    }
  });
  
  // Add button click handlers
  Object.keys(addButtons).forEach(type => {
    if (addButtons[type]) {
      addButtons[type].addEventListener('click', function() {
        resetForm(type);
        const title = type === 'resident' ? 'Resident' : 
                     type === 'security' ? 'Security Personnel' : 'Maintenance Worker';
        document.getElementById(`${type}ModalTitle`).textContent = `Add New ${title}`;
        openModal(type);
      });
    }
  });
  
  // Save button click handlers
  Object.keys(saveButtons).forEach(type => {
    if (saveButtons[type]) {
      saveButtons[type].addEventListener('click', function() {
        saveStaffMember(type);
      });
    }
  });
  
  // View/Edit/Delete button handlers
  document.querySelectorAll('.btn-view').forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      const itemType = this.getAttribute('data-type');
      viewStaffDetails(itemType, itemId);
    });
  });
  
  document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      const itemType = this.getAttribute('data-type');
      editStaffMember(itemType, itemId);
    });
  });
  
  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      const itemType = this.getAttribute('data-type');
      const itemRow = document.querySelector(`tr[data-id="${itemId}"]`);
      let itemName = itemRow ? itemRow.querySelector('td:first-child').textContent : '';
      
      document.getElementById('deleteItemName').textContent = itemName;
      document.getElementById('confirmDelete').setAttribute('data-id', itemId);
      document.getElementById('confirmDelete').setAttribute('data-type', itemType);
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
  
  // Filtering
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', filterStaffMembers);
  }
  
  if (communityFilter) {
    communityFilter.addEventListener('change', filterStaffMembers);
  }
  
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
      const isDarkMode = document.body.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDarkMode);
      
      const toggleIcon = themeToggle.querySelector('i');
      if (toggleIcon) {
        toggleIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
      }
    });
    
    // Load theme preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
      const toggleIcon = themeToggle.querySelector('i');
      if (toggleIcon) toggleIcon.className = 'fas fa-sun';
    }
  }
  
  // Helper Functions
  
  function resetForm(type) {
    const form = document.getElementById(`${type}Form`);
    if (form) {
      form.reset();
      if (form.hasAttribute('data-id')) form.removeAttribute('data-id');
      document.getElementById(`${type}Password`).required = true;
      document.getElementById(`${type}PasswordNote`).style.display = 'none';
    }
  }
  
  async function saveStaffMember(type) {
    const form = document.getElementById(`${type}Form`);
    if (!form || !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    let data = {};
    const itemId = form.getAttribute('data-id');
    const isUpdate = !!itemId;
    
    try {
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
          const residentPassword = document.getElementById('residentPassword').value;
          if (residentPassword || !isUpdate) data.password = residentPassword;
          break;
          
        case 'security':
          data = {
            name: document.getElementById('securityName').value,
            email: document.getElementById('securityEmail').value,
            contact: document.getElementById('securityContact').value,
            address: document.getElementById('securityAddress').value,
            Shift: document.getElementById('securityShift').value
          };
          const securityPassword = document.getElementById('securityPassword').value;
          if (securityPassword || !isUpdate) data.password = securityPassword;
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
          const workerPassword = document.getElementById('workerPassword').value;
          if (workerPassword || !isUpdate) data.password = workerPassword;
          break;
      }
      
      const endpoint = isUpdate 
        ? `/admin/api/${type === 'resident' ? 'residents' : type === 'security' ? 'security' : 'workers'}/${itemId}`
        : `/admin/api/${type === 'resident' ? 'residents' : type === 'security' ? 'security' : 'workers'}`;
      
      const method = isUpdate ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        window.location.reload();
      } else {
        showNotification(`Error: ${result.error || 'Unknown error occurred'}`, 'error');
      }
    } catch (error) {
      console.error(`Error ${isUpdate ? 'updating' : 'creating'} ${type}:`, error);
      showNotification(`Failed to ${isUpdate ? 'update' : 'add'} ${type}. Please try again.`, 'error');
    }
  }
  
  async function viewStaffDetails(type, id) {
    try {
      const endpoint = `/admin/api/${type === 'resident' ? 'residents' : type === 'security' ? 'security' : 'workers'}/${id}`;
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (response.ok) {
        const item = data[type] || data;
        let title = type === 'resident' ? 'Resident' : 
                   type === 'security' ? 'Security Personnel' : 'Maintenance Worker';
        
        document.getElementById('viewDetailsTitle').textContent = `${title} Details`;
        document.getElementById('editFromView').setAttribute('data-id', id);
        document.getElementById('editFromView').setAttribute('data-type', type);
        
        let html = '';
        if (type === 'resident') {
          html = `
            <div class="details-item">
              <div class="details-label">Name</div>
              <div class="details-value">${item.residentFirstname} ${item.residentLastname}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Flat/Block</div>
              <div class="details-value">Flat ${item.flatNo}, Block ${item.blockNo}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Email</div>
              <div class="details-value">${item.email}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Contact</div>
              <div class="details-value">${item.contact}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Community</div>
              <div class="details-value">${item.community ? item.community.name : 'Unassigned'}</div>
            </div>
          `;
        } else if (type === 'security') {
          html = `
            <div class="details-item">
              <div class="details-label">Name</div>
              <div class="details-value">${item.name}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Email</div>
              <div class="details-value">${item.email}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Contact</div>
              <div class="details-value">${item.contact}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Address</div>
              <div class="details-value">${item.address}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Shift</div>
              <div class="details-value">${item.Shift}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Community</div>
              <div class="details-value">${item.community ? item.community.name : 'Unassigned'}</div>
            </div>
          `;
        } else if (type === 'worker') {
          html = `
            <div class="details-item">
              <div class="details-label">Name</div>
              <div class="details-value">${item.name}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Email</div>
              <div class="details-value">${item.email}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Contact</div>
              <div class="details-value">${item.contact}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Address</div>
              <div class="details-value">${item.address}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Job Role</div>
              <div class="details-value">${item.jobRole}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Availability Status</div>
              <div class="details-value">
                <span class="status-badge status-${item.availabilityStatus.toLowerCase().replace(' ', '-')}">${item.availabilityStatus}</span>
              </div>
            </div>
            <div class="details-item">
              <div class="details-label">Salary</div>
              <div class="details-value">$${item.salary}</div>
            </div>
            <div class="details-item">
              <div class="details-label">Community</div>
              <div class="details-value">${item.community ? item.community.name : 'Unassigned'}</div>
            </div>
          `;
        }
        
        document.getElementById('viewDetailsContent').innerHTML = html;
        openModal('viewDetails');
      } else {
        showNotification(`Error: ${data.error || 'Could not fetch details'}`, 'error');
      }
    } catch (error) {
      console.error(`Error fetching ${type} details:`, error);
      showNotification(`Failed to fetch ${type} details. Please try again.`, 'error');
    }
  }
  
  async function editStaffMember(type, id) {
    try {
      const endpoint = `/admin/api/${type === 'resident' ? 'residents' : type === 'security' ? 'security' : 'workers'}/${id}`;
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (response.ok) {
        const item = data[type] || data;
        const form = document.getElementById(`${type}Form`);
        form.setAttribute('data-id', id);
        
        const title = type === 'resident' ? 'Resident' : 
                     type === 'security' ? 'Security Personnel' : 'Maintenance Worker';
        document.getElementById(`${type}ModalTitle`).textContent = `Edit ${title}`;
        
        document.getElementById(`${type}Password`).required = false;
        document.getElementById(`${type}PasswordNote`).style.display = 'block';
        
        switch(type) {
          case 'resident':
            document.getElementById('residentFirstname').value = item.residentFirstname;
            document.getElementById('residentLastname').value = item.residentLastname;
            document.getElementById('flatNo').value = item.flatNo;
            document.getElementById('blockNo').value = item.blockNo;
            document.getElementById('residentEmail').value = item.email;
            document.getElementById('residentContact').value = item.contact;
            document.getElementById('residentPassword').value = '';
            break;
            
          case 'security':
            document.getElementById('securityName').value = item.name;
            document.getElementById('securityEmail').value = item.email;
            document.getElementById('securityContact').value = item.contact;
            document.getElementById('securityAddress').value = item.address;
            document.getElementById('securityShift').value = item.Shift;
            document.getElementById('securityPassword').value = '';
            break;
            
          case 'worker':
            document.getElementById('workerName').value = item.name;
            document.getElementById('workerEmail').value = item.email;
            document.getElementById('workerContact').value = item.contact;
            document.getElementById('workerAddress').value = item.address;
            document.getElementById('workerJobRole').value = item.jobRole;
            document.getElementById('workerStatus').value = item.availabilityStatus;
            document.getElementById('workerSalary').value = item.salary;
            document.getElementById('workerPassword').value = '';
            break;
        }
        
        openModal(type);
      } else {
        showNotification(`Error: ${data.error || 'Could not fetch staff details'}`, 'error');
      }
    } catch (error) {
      console.error(`Error fetching ${type} for edit:`, error);
      showNotification(`Failed to fetch ${type} details for editing. Please try again.`, 'error');
    }
  }
  
  async function deleteStaffMember(type, id) {
    try {
      const endpoint = `/admin/api/${type === 'resident' ? 'residents' : type === 'security' ? 'security' : 'workers'}/${id}`;
      const response = await fetch(endpoint, { method: 'DELETE' });
      const data = await response.json();
      
      if (response.ok) {
        closeModal('deleteConfirmation');
        window.location.reload();
      } else {
        showNotification(`Error: ${data.error || 'Could not delete item'}`, 'error');
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      showNotification(`Failed to delete ${type}. Please try again.`, 'error');
    }
  }
  
  function filterStaffMembers() {
    const searchTerm = globalSearchInput ? globalSearchInput.value.toLowerCase() : '';
    const communityFilterValue = communityFilter ? communityFilter.value.toLowerCase() : '';
    
    filterTable('residents', searchTerm, communityFilterValue);
    filterTable('security', searchTerm, communityFilterValue);
    filterTable('workers', searchTerm, communityFilterValue);
  }
  
  function filterTable(tableType, searchTerm, communityFilterValue) {
    const tbody = document.getElementById(`${tableType}TableBody`);
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    let visibleRowCount = 0;
    
    rows.forEach(row => {
      if (row.cells.length === 1 && row.cells[0].hasAttribute('colspan')) return;
      
      const rowText = row.textContent.toLowerCase();
      const rowCommunity = row.querySelector('td:nth-last-child(2)')?.textContent.toLowerCase() || '';
      
      const matchesSearch = searchTerm === '' || rowText.includes(searchTerm);
      const matchesCommunity = communityFilterValue === '' || rowCommunity.includes(communityFilterValue);
      
      if (matchesSearch && matchesCommunity) {
        row.style.display = '';
        visibleRowCount++;
      } else {
        row.style.display = 'none';
      }
    });
    
    if (visibleRowCount === 0 && rows.length > 0) {
      let noResultsRow = tbody.querySelector('.no-results-row');
      
      if (!noResultsRow) {
        noResultsRow = document.createElement('tr');
        noResultsRow.className = 'no-results-row';
        
        const cell = document.createElement('td');
        cell.textContent = 'No matching records found';
        cell.colSpan = tbody.querySelector('tr')?.cells.length || 6;
        cell.className = 'text-center';
        
        noResultsRow.appendChild(cell);
        tbody.appendChild(noResultsRow);
      } else {
        noResultsRow.style.display = '';
      }
    } else {
      const noResultsRow = tbody.querySelector('.no-results-row');
      if (noResultsRow) noResultsRow.style.display = 'none';
    }
  }
  
  function showNotification(message, type = 'success') {
    if (!notification) return;
    
    const notificationText = notification.querySelector('.notification-text');
    if (notificationText) notificationText.textContent = message;
    
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 5000);
  }
  
  // Close notification button
  const notificationClose = document.querySelector('.notification-close');
  if (notificationClose) {
    notificationClose.addEventListener('click', function() {
      if (notification) notification.classList.remove('show');
    });
  }
  
  // Check for URL success/error messages
  const urlParams = new URLSearchParams(window.location.search);
  const successMsg = urlParams.get('success');
  const errorMsg = urlParams.get('error');
  
  if (successMsg) {
    showNotification(decodeURIComponent(successMsg), 'success');
  } else if (errorMsg) {
    showNotification(decodeURIComponent(errorMsg), 'error');
  }
  
  // Initialize with server-side data if available
  function initializeWithServerData() {
    // Residents
    if (typeof window.initialResidents === 'undefined') {
      window.initialResidents = [];
      const residentRows = document.querySelectorAll('#residentsTableBody tr[data-id]');
      residentRows.forEach(row => {
        const id = row.getAttribute('data-id');
        const name = `${row.cells[0].textContent} ${row.cells[1].textContent}`;
        const flatBlock = `${row.cells[2].textContent}, ${row.cells[3].textContent}`;
        const email = row.cells[4].textContent;
        const contact = row.cells[5].textContent;
        const community = row.cells[6].textContent;
        
        window.initialResidents.push({
          _id: id,
          residentFirstname: row.cells[0].textContent,
          residentLastname: row.cells[1].textContent,
          flatNo: row.cells[2].textContent,
          blockNo: row.cells[3].textContent,
          email,
          contact,
          community: { name: community }
        });
      });
    }
    
    // Security
    if (typeof window.initialSecurity === 'undefined') {
      window.initialSecurity = [];
      const securityRows = document.querySelectorAll('#securityTableBody tr[data-id]');
      securityRows.forEach(row => {
        const id = row.getAttribute('data-id');
        const name = row.cells[0].textContent;
        const email = row.cells[1].textContent;
        const contact = row.cells[2].textContent;
        const address = row.cells[3].textContent;
        const shift = row.cells[4].textContent;
        const community = row.cells[5].textContent;
        
        window.initialSecurity.push({
          _id: id,
          name,
          email,
          contact,
          address,
          Shift: shift,
          community: { name: community }
        });
      });
    }
    
    // Workers
    if (typeof window.initialWorkers === 'undefined') {
      window.initialWorkers = [];
      const workerRows = document.querySelectorAll('#workersTableBody tr[data-id]');
      workerRows.forEach(row => {
        const id = row.getAttribute('data-id');
        const name = row.cells[0].textContent;
        const email = row.cells[1].textContent;
        const contact = row.cells[2].textContent;
        const address = row.cells[3].textContent;
        const jobRole = row.cells[4].textContent;
        const status = row.cells[5].textContent.trim();
        const salary = row.cells[6].textContent;
        const community = row.cells[7].textContent;
        
        window.initialWorkers.push({
          _id: id,
          name,
          email,
          contact,
          address,
          jobRole,
          availabilityStatus: status,
          salary,
          community: { name: community }
        });
      });
    }
  }
  
  
  // Initialize with server data
  initializeWithServerData();
  
  // Window resize handler for responsive display
  window.addEventListener('resize', filterStaffMembers);
  
  // Initial filtering
  filterStaffMembers();
});