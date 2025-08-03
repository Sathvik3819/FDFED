// public/js/admin/staff-management.js
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const mainContent = document.querySelector('.main-content');
  
  // Modal elements
  const modals = {
    resident: document.getElementById('residentModal'),
    security: document.getElementById('securityModal'),
    worker: document.getElementById('workerModal'),
    viewDetails: document.getElementById('viewDetailsModal'),
    deleteConfirmation: document.getElementById('deleteConfirmationModal')
  };
  
  // Button elements
  const addButtons = {
    resident: document.getElementById('addResidentBtn'),
    security: document.getElementById('addSecurityBtn'),
    worker: document.getElementById('addWorkerBtn')
  };
  
  // Save buttons
  const saveButtons = {
    resident: document.getElementById('saveResident'),
    security: document.getElementById('saveSecurity'),
    worker: document.getElementById('saveWorker')
  };
  
  // Filter elements
  const globalSearchInput = document.getElementById('globalSearchInput');
  const communityFilter = document.getElementById('communityFilter');
  const themeToggle = document.getElementById('themeToggle');
  const notification = document.getElementById('notification');
  
  // Tab elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Variables
  let currentTab = 'residents';
  let selectedItemId = null;
  let selectedItemType = null;

  // Initialize the page
  init();

function init() {
  setupEventListeners();
  
  // Check if we have initial data from server-side rendering
  if (window.initialData) {
    renderTable(currentTab, window.initialData[currentTab]);
  } else {
    loadInitialData();
  }
  
  checkThemePreference();
}

  function setupEventListeners() {
    // Sidebar toggle
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        if (mainContent) mainContent.classList.toggle('expanded');
      });
    }
    
    // Tab switching
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab') || 
                       this.textContent.trim().toLowerCase();
        switchTab(tabName);
      });
    });
    
    // Modal handling
    Object.keys(addButtons).forEach(type => {
      if (addButtons[type]) {
        addButtons[type].addEventListener('click', () => openAddModal(type));
      }
    });
    
    Object.keys(saveButtons).forEach(type => {
      if (saveButtons[type]) {
        saveButtons[type].addEventListener('click', () => saveStaffMember(type));
      }
    });
    
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
    
    // Filtering
    if (globalSearchInput) {
      globalSearchInput.addEventListener('input', filterStaffMembers);
    }
    
    if (communityFilter) {
      communityFilter.addEventListener('change', filterStaffMembers);
    }
    
    // Theme toggle
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Notification close
    const notificationClose = document.querySelector('.notification-close');
    if (notificationClose) {
      notificationClose.addEventListener('click', () => {
        if (notification) notification.classList.remove('show');
      });
    }
  }

  function loadInitialData() {
  // Load communities for filter dropdown
  fetch('/api/communities')
    .then(response => response.json())
    .then(communities => {
      populateCommunityFilter(communities);
      // Load data for the current tab
      loadTabData(currentTab);
    })
    .catch(error => {
      console.error('Error loading communities:', error);
      showNotification('Failed to load community data', 'error');
    });
}

  function populateCommunityFilter(communities) {
    if (!communityFilter) return;
    
    // Clear existing options except the first one
    while (communityFilter.options.length > 1) {
      communityFilter.remove(1);
    }
    
    // Add new options
    communities.forEach(community => {
      const option = document.createElement('option');
      option.value = community._id;
      option.textContent = community.name;
      communityFilter.appendChild(option);
    });
  }

  function loadTabData(tabName) {
    const endpoint = `/admin/api/${tabName}`;
    
    fetch(endpoint)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        renderTable(tabName, data);
        currentTab = tabName;
      })
      .catch(error => {
        console.error(`Error loading ${tabName} data:`, error);
        showNotification(`Failed to load ${tabName} data`, 'error');
      });
  }

  function renderTable(type, data) {
    const tableBody = document.getElementById(`${type}TableBody`);
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!data || data.length === 0) {
      tableBody.innerHTML = `
        <tr class="no-results-row">
          <td colspan="6" class="text-center">No ${type} found</td>
        </tr>
      `;
      return;
    }
    
    data.forEach(item => {
      const row = document.createElement('tr');
      row.setAttribute('data-id', item._id);
      
      if (type === 'residents') {
        row.innerHTML = `
          <td>${item.residentFirstname} ${item.residentLastname}</td>
          <td>Flat ${item.flatNo}, Block ${item.blockNo}</td>
          <td>${item.email}</td>
          <td>${item.contact}</td>
          <td>${item.community?.name || 'Unassigned'}</td>
          <td class="table-actions">
            <button class="btn-icon btn-view" data-id="${item._id}" data-type="${type}">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon btn-edit" data-id="${item._id}" data-type="${type}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-delete" data-id="${item._id}" data-type="${type}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
      } else if (type === 'security') {
        row.innerHTML = `
          <td>${item.name}</td>
          <td>${item.email}</td>
          <td>${item.contact}</td>
          <td>${item.Shift}</td>
          <td>${item.community?.name || 'Unassigned'}</td>
          <td class="table-actions">
            <button class="btn-icon btn-view" data-id="${item._id}" data-type="${type}">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon btn-edit" data-id="${item._id}" data-type="${type}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-delete" data-id="${item._id}" data-type="${type}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
      } else if (type === 'workers') {
        const statusClass = item.availabilityStatus.toLowerCase().replace(' ', '-');
        row.innerHTML = `
          <td>${item.name}</td>
          <td>${item.jobRole}</td>
          <td>${item.contact}</td>
          <td><span class="status-badge status-${statusClass}">${item.availabilityStatus}</span></td>
          <td>${item.community?.name || 'Unassigned'}</td>
          <td class="table-actions">
            <button class="btn-icon btn-view" data-id="${item._id}" data-type="${type}">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon btn-edit" data-id="${item._id}" data-type="${type}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-delete" data-id="${item._id}" data-type="${type}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
      }
      
      tableBody.appendChild(row);
    });
    
    // Add event listeners to the new buttons
    addActionButtonListeners();
  }

  function addActionButtonListeners() {
    // View buttons
    document.querySelectorAll('.btn-view').forEach(button => {
      button.addEventListener('click', function() {
        const itemId = this.getAttribute('data-id');
        const itemType = this.getAttribute('data-type');
        viewStaffDetails(itemType, itemId);
      });
    });
    
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(button => {
      button.addEventListener('click', function() {
        const itemId = this.getAttribute('data-id');
        const itemType = this.getAttribute('data-type');
        editStaffMember(itemType, itemId);
      });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(button => {
      button.addEventListener('click', function() {
        const itemId = this.getAttribute('data-id');
        const itemType = this.getAttribute('data-type');
        confirmDelete(itemType, itemId);
      });
    });
  }

  function switchTab(tabName) {
    // Update UI
    tabButtons.forEach(button => {
      button.classList.toggle('active', button.getAttribute('data-tab') === tabName);
    });
    
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Load data if not already loaded
    if (currentTab !== tabName) {
      loadTabData(tabName);
    }
  }

  // Modal functions
  function openAddModal(type) {
    resetForm(type);
    const title = type === 'resident' ? 'Resident' : 
                 type === 'security' ? 'Security Personnel' : 'Maintenance Worker';
    document.getElementById(`${type}ModalTitle`).textContent = `Add New ${title}`;
    openModal(type);
  }

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

  function resetForm(type) {
    const form = document.getElementById(`${type}Form`);
    if (form) {
      form.reset();
      if (form.hasAttribute('data-id')) form.removeAttribute('data-id');
      document.getElementById(`${type}Password`).required = true;
      const noteElement = document.getElementById(`${type}PasswordNote`);
      if (noteElement) noteElement.style.display = 'none';
    }
  }

  // CRUD Operations
  function saveStaffMember(type) {
    const form = document.getElementById(`${type}Form`);
    if (!form || !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    const isUpdate = form.hasAttribute('data-id');
    const itemId = isUpdate ? form.getAttribute('data-id') : null;
    
    const data = gatherFormData(type);
    const endpoint = `/admin/api/${type}s${isUpdate ? `/${itemId}` : ''}`;
    const method = isUpdate ? 'PUT' : 'POST';
    
    fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(result => {
      showNotification(
        `${type.charAt(0).toUpperCase() + type.slice(1)} ${isUpdate ? 'updated' : 'added'} successfully`,
        'success'
      );
      closeModal(type);
      loadTabData(currentTab);
    })
    .catch(error => {
      console.error(`Error ${isUpdate ? 'updating' : 'creating'} ${type}:`, error);
      showNotification(
        `Failed to ${isUpdate ? 'update' : 'add'} ${type}. Please try again.`,
        'error'
      );
    });
  }

  function gatherFormData(type) {
    const data = {};
    const form = document.getElementById(`${type}Form`);
    
    if (type === 'resident') {
      data.residentFirstname = document.getElementById('residentFirstname').value;
      data.residentLastname = document.getElementById('residentLastname').value;
      data.flatNo = document.getElementById('flatNo').value;
      data.blockNo = document.getElementById('blockNo').value;
      data.email = document.getElementById('residentEmail').value;
      data.contact = document.getElementById('residentContact').value;
      data.communityId = document.getElementById('residentCommunity').value || null;
      
      const password = document.getElementById('residentPassword').value;
      if (password || !form.hasAttribute('data-id')) {
        data.password = password;
      }
    } 
    else if (type === 'security') {
      data.name = document.getElementById('securityName').value;
      data.email = document.getElementById('securityEmail').value;
      data.contact = document.getElementById('securityContact').value;
      data.address = document.getElementById('securityAddress').value;
      data.Shift = document.getElementById('securityShift').value;
      data.communityId = document.getElementById('securityCommunity').value || null;
      
      const password = document.getElementById('securityPassword').value;
      if (password || !form.hasAttribute('data-id')) {
        data.password = password;
      }
    } 
    else if (type === 'worker') {
      data.name = document.getElementById('workerName').value;
      data.email = document.getElementById('workerEmail').value;
      data.contact = document.getElementById('workerContact').value;
      data.address = document.getElementById('workerAddress').value;
      data.jobRole = document.getElementById('workerJobRole').value;
      data.availabilityStatus = document.getElementById('workerStatus').value;
      data.salary = document.getElementById('workerSalary').value;
      data.communityId = document.getElementById('workerCommunity').value || null;
      
      const password = document.getElementById('workerPassword').value;
      if (password || !form.hasAttribute('data-id')) {
        data.password = password;
      }
    }
    
    return data;
  }

  function viewStaffDetails(type, id) {
    fetch(`/admin/api/${type}s/${id}`)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        populateDetailsModal(type, data);
        openModal('viewDetails');
      })
      .catch(error => {
        console.error(`Error fetching ${type} details:`, error);
        showNotification(`Failed to fetch ${type} details`, 'error');
      });
  }

  function populateDetailsModal(type, item) {
    document.getElementById('viewDetailsTitle').textContent = 
      `${type.charAt(0).toUpperCase() + type.slice(1)} Details`;
    
    document.getElementById('editFromView').setAttribute('data-id', item._id);
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
          <div class="details-value">${item.community?.name || 'Unassigned'}</div>
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
          <div class="details-value">${item.community?.name || 'Unassigned'}</div>
        </div>
      `;
    } else if (type === 'worker') {
      const statusClass = item.availabilityStatus.toLowerCase().replace(' ', '-');
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
            <span class="status-badge status-${statusClass}">${item.availabilityStatus}</span>
          </div>
        </div>
        <div class="details-item">
          <div class="details-label">Salary</div>
          <div class="details-value">$${item.salary}</div>
        </div>
        <div class="details-item">
          <div class="details-label">Community</div>
          <div class="details-value">${item.community?.name || 'Unassigned'}</div>
        </div>
      `;
    }
    
    document.getElementById('viewDetailsContent').innerHTML = html;
  }

  function editStaffMember(type, id) {
    fetch(`/admin/api/${type}s/${id}`)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        populateEditForm(type, data);
        openModal(type);
      })
      .catch(error => {
        console.error(`Error fetching ${type} for edit:`, error);
        showNotification(`Failed to fetch ${type} for editing`, 'error');
      });
  }

  function populateEditForm(type, item) {
    const form = document.getElementById(`${type}Form`);
    form.setAttribute('data-id', item._id);
    
    const title = type === 'resident' ? 'Resident' : 
                 type === 'security' ? 'Security Personnel' : 'Maintenance Worker';
    document.getElementById(`${type}ModalTitle`).textContent = `Edit ${title}`;
    
    document.getElementById(`${type}Password`).required = false;
    const noteElement = document.getElementById(`${type}PasswordNote`);
    if (noteElement) noteElement.style.display = 'block';
    
    if (type === 'resident') {
      document.getElementById('residentFirstname').value = item.residentFirstname;
      document.getElementById('residentLastname').value = item.residentLastname;
      document.getElementById('flatNo').value = item.flatNo;
      document.getElementById('blockNo').value = item.blockNo;
      document.getElementById('residentEmail').value = item.email;
      document.getElementById('residentContact').value = item.contact;
      document.getElementById('residentCommunity').value = item.community?._id || '';
      document.getElementById('residentPassword').value = '';
    } 
    else if (type === 'security') {
      document.getElementById('securityName').value = item.name;
      document.getElementById('securityEmail').value = item.email;
      document.getElementById('securityContact').value = item.contact;
      document.getElementById('securityAddress').value = item.address;
      document.getElementById('securityShift').value = item.Shift;
      document.getElementById('securityCommunity').value = item.community?._id || '';
      document.getElementById('securityPassword').value = '';
    } 
    else if (type === 'worker') {
      document.getElementById('workerName').value = item.name;
      document.getElementById('workerEmail').value = item.email;
      document.getElementById('workerContact').value = item.contact;
      document.getElementById('workerAddress').value = item.address;
      document.getElementById('workerJobRole').value = item.jobRole;
      document.getElementById('workerStatus').value = item.availabilityStatus;
      document.getElementById('workerSalary').value = item.salary;
      document.getElementById('workerCommunity').value = item.community?._id || '';
      document.getElementById('workerPassword').value = '';
    }
  }

  function confirmDelete(type, id) {
    const itemName = document.querySelector(`tr[data-id="${id}"] td:first-child`).textContent;
    document.getElementById('deleteItemName').textContent = itemName;
    document.getElementById('confirmDelete').setAttribute('data-id', id);
    document.getElementById('confirmDelete').setAttribute('data-type', type);
    openModal('deleteConfirmation');
  }

  function deleteStaffMember() {
    const confirmButton = document.getElementById('confirmDelete');
    const itemId = confirmButton.getAttribute('data-id');
    const itemType = confirmButton.getAttribute('data-type');
    
    fetch(`/admin/api/${itemType}s/${itemId}`, { method: 'DELETE' })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(() => {
        showNotification(
          `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully`,
          'success'
        );
        closeModal('deleteConfirmation');
        loadTabData(currentTab);
      })
      .catch(error => {
        console.error(`Error deleting ${itemType}:`, error);
        showNotification(`Failed to delete ${itemType}`, 'error');
      });
  }

  // Edit from view details button
  document.getElementById('editFromView')?.addEventListener('click', function() {
    const itemId = this.getAttribute('data-id');
    const itemType = this.getAttribute('data-type');
    closeModal('viewDetails');
    editStaffMember(itemType, itemId);
  });

  // Confirm delete button
  document.getElementById('confirmDelete')?.addEventListener('click', deleteStaffMember);

  // Filter functions
  function filterStaffMembers() {
    const searchTerm = globalSearchInput?.value.toLowerCase() || '';
    const communityId = communityFilter?.value || '';
    
    const tableBody = document.getElementById(`${currentTab}TableBody`);
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    let visibleRowCount = 0;
    
    rows.forEach(row => {
      if (row.classList.contains('no-results-row')) return;
      
      const rowText = row.textContent.toLowerCase();
      const rowCommunityId = row.querySelector('td:nth-last-child(2)')?.getAttribute('data-community-id') || '';
      
      const matchesSearch = searchTerm === '' || rowText.includes(searchTerm);
      const matchesCommunity = communityId === '' || rowCommunityId === communityId;
      
      if (matchesSearch && matchesCommunity) {
        row.style.display = '';
        visibleRowCount++;
      } else {
        row.style.display = 'none';
      }
    });
    
    // Show/hide no results message
    const noResultsRow = tableBody.querySelector('.no-results-row');
    if (visibleRowCount === 0 && rows.length > 0) {
      if (!noResultsRow) {
        const newRow = document.createElement('tr');
        newRow.className = 'no-results-row';
        newRow.innerHTML = `
          <td colspan="6" class="text-center">No matching records found</td>
        `;
        tableBody.appendChild(newRow);
      } else {
        noResultsRow.style.display = '';
      }
    } else if (noResultsRow) {
      noResultsRow.style.display = 'none';
    }
  }

  // Theme functions
  function checkThemePreference() {
    if (!themeToggle) return;
    
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
      const toggleIcon = themeToggle.querySelector('i');
      if (toggleIcon) toggleIcon.className = 'fas fa-sun';
    }
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    const toggleIcon = themeToggle.querySelector('i');
    if (toggleIcon) {
      toggleIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  // Notification function
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

  // Check for URL success/error messages
  const urlParams = new URLSearchParams(window.location.search);
  const successMsg = urlParams.get('success');
  const errorMsg = urlParams.get('error');
  
  if (successMsg) {
    showNotification(decodeURIComponent(successMsg), 'success');
  } else if (errorMsg) {
    showNotification(decodeURIComponent(errorMsg), 'error');
  }

  // Window resize handler
  window.addEventListener('resize', filterStaffMembers);
});