document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const managersTableBody = document.getElementById('managersTableBody');
    const addManagerBtn = document.getElementById('addManagerBtn');
    const searchInput = document.getElementById('searchInput');
    const communityFilter = document.getElementById('communityFilter');
    const managerModal = document.getElementById('managerModal');
    const viewManagerModal = document.getElementById('viewManagerModal');
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    const managerForm = document.getElementById('managerForm');
    const saveManagerBtn = document.getElementById('saveManager');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const editFromViewBtn = document.getElementById('editFromView');
    
    // Pagination elements
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const startRecordSpan = document.getElementById('startRecord');
    const endRecordSpan = document.getElementById('endRecord');
    const totalRecordsSpan = document.getElementById('totalRecords');
    const paginationContainer = document.getElementById('pagination');
    
    // Toggle sidebar functionality
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        document.querySelector('.main-content').classList.toggle('expanded');
      });
    }
    
    // Modal variables
    let currentManagerId = null;
    let viewedManagerId = null;
    let managers = [];
    let filteredManagers = [];
    
    // Pagination variables
    let currentPage = 1;
    const recordsPerPage = 8;
    
    // Fetch all managers from the API
    async function fetchManagers() {
      try {
        // Show loading indicator
        managersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading managers...</td></tr>';
        
        const response = await fetch('/admin/api/community-managers');
        const data = await response.json();
        
        if (data.success) {
          managers = data.managers;
          filteredManagers = [...managers];
          currentPage = 1; // Reset to first page when fetching new data
          updatePagination();
          renderManagers();
        } else {
          showToast('Error fetching managers: ' + data.error, 'error');
          managersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading managers</td></tr>';
        }
      } catch (error) {
        console.error('Error fetching managers:', error);
        showToast('Failed to load managers. Please try again.', 'error');
        managersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading managers</td></tr>';
      }
    }
    
    // Show toast notifications
    function showToast(message, type = 'success') {
      // Simple toast implementation
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.right = '20px';
      toast.style.padding = '12px 20px';
      toast.style.backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
      toast.style.color = 'white';
      toast.style.borderRadius = '4px';
      toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      toast.style.zIndex = '9999';
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '1';
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 300);
        }, 3000);
      }, 100);
    }
    
    // Filter managers based on search input and community filter
    function filterManagers() {
      const searchTerm = searchInput.value.toLowerCase().trim();
      const communityName = communityFilter.value;
      
      filteredManagers = managers.filter(manager => {
        const matchesSearch = 
          manager.name.toLowerCase().includes(searchTerm) ||
          manager.email.toLowerCase().includes(searchTerm) ||
          (manager.contact && manager.contact.toLowerCase().includes(searchTerm));
        
        const matchesCommunity = 
          !communityName || 
          (manager.assignedCommunity && manager.assignedCommunity.name === communityName);
        
        return matchesSearch && matchesCommunity;
      });
      
      // Reset to first page when filtering
      currentPage = 1;
      updatePagination();
      renderManagers();
    }
    
    // Update pagination display
    function updatePagination() {
      const totalPages = Math.ceil(filteredManagers.length / recordsPerPage);
      const startIndex = (currentPage - 1) * recordsPerPage;
      const endIndex = Math.min(startIndex + recordsPerPage, filteredManagers.length);
      
      startRecordSpan.textContent = filteredManagers.length > 0 ? startIndex + 1 : 0;
      endRecordSpan.textContent = endIndex;
      totalRecordsSpan.textContent = filteredManagers.length;
      
      // Enable/disable prev/next buttons
      prevPageBtn.classList.toggle('disabled', currentPage === 1);
      nextPageBtn.classList.toggle('disabled', currentPage === totalPages || totalPages === 0);
      
      // Generate page number buttons
      generatePageButtons(totalPages);
    }
    
    // Generate pagination buttons
    function generatePageButtons(totalPages) {
      // Clear existing page buttons (except prev and next)
      const pageButtons = paginationContainer.querySelectorAll('.page-number');
      pageButtons.forEach(button => button.remove());
      
      // Hide pagination if no data or only one page
      if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
      } else {
        paginationContainer.style.display = 'flex';
      }
      
      // Determine which page buttons to show
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      
      if (endPage - startPage < 4 && totalPages > 5) {
        startPage = Math.max(1, endPage - 4);
      }
      
      // Add page number buttons
      for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
          if (i !== currentPage) {
            currentPage = i;
            updatePagination();
            renderManagers();
          }
        });
        
        // Insert before the next button
        paginationContainer.insertBefore(pageBtn, nextPageBtn);
      }
    }
    
    // Render managers table with pagination
    function renderManagers() {
      // Clear the table first
      managersTableBody.innerHTML = '';
      
      const startIndex = (currentPage - 1) * recordsPerPage;
      const pageManagers = filteredManagers.slice(startIndex, startIndex + recordsPerPage);
      
      if (pageManagers.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="6" class="text-center">No community managers found</td>';
        managersTableBody.appendChild(emptyRow);
        return;
      }
      
      pageManagers.forEach(manager => {
        const row = document.createElement('tr');
        row.dataset.id = manager._id;
        
        row.innerHTML = `
          <td>${manager.name || 'N/A'}</td>
          <td>${manager.email || 'N/A'}</td>
          <td>${manager.contact || 'N/A'}</td>
          <td>${manager.assignedCommunity ? manager.assignedCommunity.name : 'Unassigned'}</td>
          <td>${manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : 'N/A'}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-sm btn-icon btn-view" data-id="${manager._id}" title="View manager">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-icon btn-edit" data-id="${manager._id}" title="Edit manager">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-icon btn-delete" data-id="${manager._id}" title="Delete manager">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        `;
        
        managersTableBody.appendChild(row);
      });
      
      // Attach event listeners to action buttons after rendering
      attachActionButtonListeners();
    }
    
    // Attach event listeners to table action buttons
    function attachActionButtonListeners() {
      // View buttons
      const viewButtons = document.querySelectorAll('.btn-view');
      viewButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const managerId = this.getAttribute('data-id');
          viewManager(managerId);
          
          // Add visual feedback for button click
          this.classList.add('clicked');
          setTimeout(() => this.classList.remove('clicked'), 200);
        });
      });
      
      // Edit buttons
      const editButtons = document.querySelectorAll('.btn-edit');
      editButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const managerId = this.getAttribute('data-id');
          editManager(managerId);
          
          // Add visual feedback for button click
          this.classList.add('clicked');
          setTimeout(() => this.classList.remove('clicked'), 200);
        });
      });
      
      // Delete buttons
      const deleteButtons = document.querySelectorAll('.btn-delete');
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const managerId = this.getAttribute('data-id');
          const manager = managers.find(m => m._id === managerId);
          
          if (manager) {
            document.getElementById('deleteManagerName').textContent = manager.name;
            currentManagerId = managerId;
            openModal(deleteConfirmationModal);
          }
          
          // Add visual feedback for button click
          this.classList.add('clicked');
          setTimeout(() => this.classList.remove('clicked'), 200);
        });
      });
    }
    
    // View manager details
    async function viewManager(managerId) {
      try {
        // Show loading state
        document.getElementById('detailName').textContent = 'Loading...';
        document.getElementById('detailEmail').textContent = 'Please wait';
        document.getElementById('detailContact').textContent = '';
        document.getElementById('detailCommunity').textContent = '';
        document.getElementById('detailCreated').textContent = '';
        
        openModal(viewManagerModal);
        
        const response = await fetch(`/admin/api/community-managers/${managerId}`);
        const data = await response.json();
        
        if (data.success) {
          const manager = data.manager;
          viewedManagerId = manager._id;
          
          // Populate view modal
          document.getElementById('detailName').textContent = manager.name || 'N/A';
          document.getElementById('detailEmail').textContent = manager.email || 'N/A';
          document.getElementById('detailContact').textContent = manager.contact || 'N/A';
          document.getElementById('detailCommunity').textContent = 
            manager.assignedCommunity ? manager.assignedCommunity.name : 'Unassigned';
          document.getElementById('detailCreated').textContent = 
            manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : 'N/A';
        } else {
          closeModal(viewManagerModal);
          showToast('Error fetching manager details: ' + data.error, 'error');
        }
      } catch (error) {
        console.error('Error fetching manager details:', error);
        closeModal(viewManagerModal);
        showToast('Failed to load manager details. Please try again.', 'error');
      }
    }
    
    // Open modal for adding new manager
    function addManager() {
      document.getElementById('modalTitle').textContent = 'Add New Manager';
     
      
      // Reset form
      managerForm.reset();
      currentManagerId = null;
      
      // Make community selection not required
      document.getElementById('assignedCommunity').required=false;
      
      openModal(managerModal);
    }
    
    // Open modal for editing existing manager
    async function editManager(managerId) {
      try {
        // Show loading state
        document.getElementById('modalTitle').textContent = 'Loading Manager...';
        openModal(managerModal);
        
        const response = await fetch(`/admin/api/community-managers/${managerId}`);
        const data = await response.json();
        
        if (data.success) {
          const manager = data.manager;
          document.getElementById('modalTitle').textContent = 'Edit Manager';
          document.getElementById('passwordNote').textContent = 'Leave empty to keep current password';
          document.getElementById('managerPassword').required = false;
          
          // Fill form with manager data
          document.getElementById('managerName').value = manager.name || '';
          document.getElementById('managerEmail').value = manager.email || '';
          document.getElementById('managerContact').value = manager.contact || '';
          
          
          // Make community selection not required
          document.getElementById('assignedCommunity').removeAttribute('required');
          
          // Set selected community
          const communitySelect = document.getElementById('assignedCommunity');
          if (manager.assignedCommunity) {
            communitySelect.value = manager.assignedCommunity._id;
          } else {
            communitySelect.value = '';
          }
          
          currentManagerId = managerId;
        } else {
          closeModal(managerModal);
          showToast('Error fetching manager details: ' + data.error, 'error');
        }
      } catch (error) {
        console.error('Error fetching manager details:', error);
        closeModal(managerModal);
        showToast('Failed to load manager details. Please try again.', 'error');
      }
    }
    
    // Save manager (create or update)
    async function saveManager() {
      // Form validation
      if (!managerForm.checkValidity()) {
        managerForm.reportValidity();
        return;
      }
      
      // Show loading state
      saveManagerBtn.textContent = 'Saving...';
      saveManagerBtn.disabled = true;
      
      // Collect form data
      const managerData = {
        name: document.getElementById('managerName').value,
        email: document.getElementById('managerEmail').value,
        contact: document.getElementById('managerContact').value,
        assignedCommunityId: document.getElementById('assignedCommunity').value || null
      };
      
      // Add password only if it's provided (required for new, optional for edit)
      const password = document.getElementById('managerPassword').value;
      if (password) {
        managerData.password = password;
      }
      
      // Determine if this is a create or update operation
      const isUpdate = !!currentManagerId;
      const url = isUpdate 
        ? `/admin/api/community-managers/${currentManagerId}` 
        : '/admin/api/community-managers';
      const method = isUpdate ? 'PUT' : 'POST';
      
      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(managerData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          showToast(`Manager ${isUpdate ? 'updated' : 'added'} successfully`);
          closeModal(managerModal);
          fetchManagers(); // Refresh the managers list
        } else {
          showToast(data.error || `Failed to ${isUpdate ? 'update' : 'add'} manager`, 'error');
        }
      } catch (error) {
        console.error(`Error ${isUpdate ? 'updating' : 'adding'} manager:`, error);
        showToast(`Failed to ${isUpdate ? 'update' : 'add'} manager. Please try again.`, 'error');
      } finally {
        // Reset button state
        saveManagerBtn.textContent = 'Save';
        saveManagerBtn.disabled = false;
      }
    }
    
    // Delete manager
    async function deleteManager() {
      if (!currentManagerId) return;
      
      // Show loading state
      confirmDeleteBtn.textContent = 'Deleting...';
      confirmDeleteBtn.disabled = true;
      
      try {
        const response = await fetch(`/admin/api/community-managers/${currentManagerId}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
          showToast('Manager deleted successfully');
          closeModal(deleteConfirmationModal);
          fetchManagers(); // Refresh the managers list
        } else {
          showToast('Error deleting manager: ' + data.error, 'error');
        }
      } catch (error) {
        console.error('Error deleting manager:', error);
        showToast('Failed to delete manager. Please try again.', 'error');
      } finally {
        // Reset button state
        confirmDeleteBtn.textContent = 'Delete';
        confirmDeleteBtn.disabled = false;
      }
    }
    
    // Modal functions
    function openModal(modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
      setTimeout(() => {
        modal.classList.add('show');
      }, 10);
    }
    
    function closeModal(modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
      }, 300);
    }
    
    // Close modal when clicking outside of it
    function setupModalOutsideClick() {
      const modals = document.querySelectorAll('.modal-backdrop');
      modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
          if (e.target === this) {
            closeModal(this);
          }
        });
      });
    }
    
    // Event Listeners
    
    // Add manager button
    addManagerBtn.addEventListener('click', addManager);
    
    // Search and filter inputs
    searchInput.addEventListener('input', filterManagers);
    communityFilter.addEventListener('change', filterManagers);
    
    // Save manager button
    saveManagerBtn.addEventListener('click', saveManager);
    
    // Confirm delete button
    confirmDeleteBtn.addEventListener('click', deleteManager);
    
    // Edit from view button
    editFromViewBtn.addEventListener('click', function() {
      closeModal(viewManagerModal);
      if (viewedManagerId) {
        editManager(viewedManagerId);
      }
    });
    
    // Pagination buttons
    prevPageBtn.addEventListener('click', function() {
      if (currentPage > 1 && !this.classList.contains('disabled')) {
        currentPage--;
        updatePagination();
        renderManagers();
      }
    });
    
    nextPageBtn.addEventListener('click', function() {
      const totalPages = Math.ceil(filteredManagers.length / recordsPerPage);
      if (currentPage < totalPages && !this.classList.contains('disabled')) {
        currentPage++;
        updatePagination();
        renderManagers();
      }
    });
    
    // Close modal buttons
    document.querySelectorAll('.modal-close, .btn-secondary[data-dismiss="modal"]').forEach(btn => {
      btn.addEventListener('click', function() {
        const modal = this.closest('.modal-backdrop');
        closeModal(modal);
      });
    });
    
    // Set up ESC key to close modals
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal-backdrop.show');
        openModals.forEach(modal => closeModal(modal));
      }
    });
    
    // Setup modal outside click
    setupModalOutsideClick();
    
    // Initialize
    fetchManagers();
  });