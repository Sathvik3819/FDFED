// Auto-refresh variables
let autoRefreshInterval;
const REFRESH_INTERVAL = 30000; // 30 seconds

// Add spin animation
const spinStyle = document.createElement('style');
spinStyle.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinStyle);

        document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const managersTableBody = document.getElementById('managersTableBody');
            const addManagerBtn = document.getElementById('addManagerBtn');
            const searchInput = document.getElementById('searchInput');
            const communityFilter = document.getElementById('communityFilter');
            const refreshBtn = document.getElementById('refreshBtn');
            const managerModal = document.getElementById('managerModal');
            const viewManagerModal = document.getElementById('viewManagerModal');
            const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
            const managerForm = document.getElementById('managerForm');
            const saveManagerBtn = document.getElementById('saveManager');
            const confirmDeleteBtn = document.getElementById('confirmDelete');
            const editFromViewBtn = document.getElementById('editFromView');
            
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
            
            // Start auto-refresh
            startAutoRefresh();
            window.addEventListener('beforeunload', stopAutoRefresh);
        
            // Fetch all managers from the API
            async function fetchManagers() {
                try {
                    // For demonstration, using sample data
                    // In a real application, you would fetch from your API
                   
                    renderManagers();
                    
                 
                    const response = await fetch(`/admin/api/community-managers?t=${Date.now()}`);
                    const data = await response.json();
                    
                    if (data.success) {
                        managers = data.managers;
                        filteredManagers = [...managers];
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
            
            // Manual refresh function
            async function manualRefresh() {
                const refreshIcon = document.getElementById('refreshIcon');
                
                if (refreshIcon) {
                    refreshIcon.style.animation = 'spin 1s linear infinite';
                }
                
                try {
                    await fetchManagers();
                    showNotification('Community Managers refreshed successfully!', 'success');;
                } catch (error) {
                    console.error('Error refreshing managers:', error);
                    showToast('Failed to refresh managers', 'error');
                } finally {
                    if (refreshIcon) {
                        setTimeout(() => {
                            refreshIcon.style.animation = '';
                        }, 500);
                    }
                }
            }
            
            // Start auto-refresh
            function startAutoRefresh() {
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                }
                
                autoRefreshInterval = setInterval(async () => {
                    console.log('Auto-refreshing managers...');
                    try {
                        await fetchManagers();
                    } catch (error) {
                        console.error('Auto-refresh error:', error);
                    }
                }, REFRESH_INTERVAL);
            }
            
            // Stop auto-refresh
            function stopAutoRefresh() {
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    autoRefreshInterval = null;
                }
            }
              function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">&times;</button>
    `;
    
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        .notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
        }
        .notification {
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.16);
          margin-bottom: 10px;
          padding: 15px;
          width: 300px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          animation: slideIn 0.3s ease-out forwards;
        }
        .notification-content {
          display: flex;
          align-items: center;
        }
        .notification-content i {
          margin-right: 10px;
        }
        .notification.success i {
          color: #28a745;
        }
        .notification.error i {
          color: #dc3545;
        }
        .notification.info i {
          color: #17a2b8;
        }
        .notification-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          color: #6c757d;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    let container = document.querySelector('.notification-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        container.removeChild(notification);
      }, 300);
    });
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            container.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
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
                
                renderManagers();
            }
            
            // Render managers table
            function renderManagers() {
                let html = '';
                if (filteredManagers.length === 0) {
                    html = '<tr><td colspan="6" class="text-center">No community managers found</td></tr>';
                } else {
                    filteredManagers.forEach(manager => {
                        const formattedDate = manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : 'N/A';
                        html += `
                            <tr data-id="${manager._id}">
                                <td>${manager.name || 'N/A'}</td>
                                <td>${manager.email || 'N/A'}</td>
                                <td>${manager.contact || 'N/A'}</td>
                                <td>${manager.assignedCommunity ? manager.assignedCommunity.name : 'Unassigned'}</td>
                                <td>${formattedDate}</td>
                                <td>
                                    <div class="table-actions">
                                        
                                        <button class="btn btn-sm btn-icon btn-edit" data-id="${manager._id}" title="Edit manager">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-icon btn-delete" data-id="${manager._id}" title="Delete manager">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                }
            
                managersTableBody.innerHTML = html;
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
                    
                    // For demonstration, using sample data
                    // In a real application, you would fetch from your API
                    const manager = managers.find(m => m._id === managerId);
                    
                    if (manager) {
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
                        showToast('Error fetching manager details', 'error');
                    }
                    
                   
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
                document.getElementById('managerModalTitle').textContent = 'Add New Manager';
                
                // Reset form
                managerForm.reset();
                currentManagerId = null;
                
                // Make password required for new managers
                document.getElementById('managerPassword').required = true;
                document.getElementById('passwordNote').textContent = 'Password is required for new managers';
                
                // Make community selection not required
                document.getElementById('assignedCommunity').required = false;
                
                openModal(managerModal);
            }
            
            // Open modal for editing existing manager
            async function editManager(managerId) {
                try {
                    const modalTitle = document.getElementById('managerModalTitle');
                    modalTitle.textContent = 'Loading Manager...';
                    openModal(managerModal);
                    
                    // For demonstration, using sample data
                    // In a real application, you would fetch from your API
                    const manager = managers.find(m => m._id === managerId);
                    
                    if (manager) {
                        modalTitle.textContent = 'Edit Manager';
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
                        showToast('Error fetching manager details', 'error');
                    }
                    
                  
                    const response = await fetch(`/admin/api/community-managers/${managerId}`);
                    const data = await response.json();
                    
                    if (data.success) {
                        const manager = data.manager;
                        modalTitle.textContent = 'Edit Manager';
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
                
                try {
                    // For demonstration, just show a success message
                    // In a real application, you would send to your API
                    showToast(`Manager ${isUpdate ? 'updated' : 'added'} successfully`);
                    closeModal(managerModal);
                    
                    
                    const url = isUpdate 
                        ? `/admin/api/community-managers/${currentManagerId}` 
                        : '/admin/api/community-managers';
                    const method = isUpdate ? 'PUT' : 'POST';
                    
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
                        await fetchManagers(); // Refresh the managers list
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
                    // For demonstration, just show a success message
                    // In a real application, you would send to your API
                    showToast('Manager deleted successfully');
                    closeModal(deleteConfirmationModal);
                    
                  
                    const response = await fetch(`/admin/api/community-managers/${currentManagerId}`, {
                        method: 'DELETE'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showToast('Manager deleted successfully');
                        closeModal(deleteConfirmationModal);
                        await fetchManagers(); // Refresh the managers list
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
            if (refreshBtn) refreshBtn.addEventListener('click', manualRefresh);
            
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