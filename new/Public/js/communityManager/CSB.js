// Simple animation for cards on page load
function closeForm(type) {
  const popup = type === "details" 
    ? document.getElementById("bookingDetailsPopup")
    : document.getElementById("FormPopup");
  
  if (popup) {
    popup.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Initialize elements
  const cards = document.querySelectorAll(".stat-card, .bookings-table");
  const buttons = document.querySelectorAll(".available-btn");
  const approve = document.querySelectorAll(".approve-btn");
  const reject = document.querySelectorAll(".reject-btn");
   const spaceType = document.getElementById("spaceType");
    const spaceName = document.getElementById("spaceName");

    function updateSpaceName() {
      const selectedValue = spaceType.value;

      if (selectedValue === "Other") {
        // Enable for custom input
        spaceName.value = "";
        spaceName.removeAttribute("disabled");
        spaceName.placeholder = "Enter custom space name";
      } else if (selectedValue) {
        // Auto-fill and lock
        spaceName.value = selectedValue;
        spaceName.setAttribute("disabled", "disabled");
      } else {
        // Reset if no selection
        spaceName.value = "";
        spaceName.removeAttribute("disabled");
        spaceName.placeholder = "";
      }
    }

    // Listen for dropdown change
    spaceType.addEventListener("change", updateSpaceName);

    // Run once on load (in case there's already a selected value)
    updateSpaceName();
  
  // Animate cards on page load
  cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";

    setTimeout(() => {
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 200 + index * 100);
  });

  // Availability check buttons
  buttons.forEach((button) => {
    button.addEventListener("click", async function (e) {
      e.preventDefault();
      
      const id = button.getAttribute("data-id");
      if (!id) {
        alert("Invalid booking ID");
        return;
      }

      // Disable button during request
      button.disabled = true;
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="bi bi-hourglass-split"></i> Checking...';

      try {
        const response = await fetch(`/manager/commonSpace/checkAvailability/${id}`, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const res = await response.json();
        alert(res.message || "Availability checked");
        window.location.reload();
      } catch (error) {
        console.error("Error checking availability:", error);
        alert("Error checking availability. Please try again.");
      } finally {
        button.disabled = false;
        button.innerHTML = originalText;
      }
    });
  });

  // Approve buttons
  approve.forEach((button) => {
    button.addEventListener("click", async function (e) {
      e.preventDefault();
      
      const id = button.getAttribute("data-id");
      if (!id) {
        alert("Invalid booking ID");
        return;
      }

      // Disable button during request
      button.disabled = true;
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="bi bi-hourglass-split"></i> Processing...';

      try {
        const response = await fetch(`/manager/commonSpace/approve/${id}`, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const res = await response.json();
        alert(res.message || "Booking approved successfully");
        window.location.reload();
      } catch (error) {
        console.error("Error approving booking:", error);
        alert("Error approving booking. Please try again.");
      } finally {
        button.disabled = false;
        button.innerHTML = originalText;
      }
    });
  });

  // Reject buttons - Fixed event listener management
  reject.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      
      const id = button.getAttribute("data-id");
      if (!id) {
        alert("Invalid booking ID");
        return;
      }

      const popup = document.getElementById("FormPopup");
      const bookingForm = document.getElementById("bookingForm");
      const notesTextarea = document.getElementById("notes");
      
      if (!popup || !bookingForm || !notesTextarea) {
        alert("Form elements not found");
        return;
      }

      // Clear previous content and show popup
      notesTextarea.value = "";
      popup.style.display = "flex";

      // Remove any existing submit handlers
      const newForm = bookingForm.cloneNode(true);
      bookingForm.parentNode.replaceChild(newForm, bookingForm);

      // Add new submit handler
      newForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const textarea = newForm.querySelector("#notes");
        const purpose = textarea ? textarea.value.trim() : "";

        if (!purpose) {
          alert("Please provide a reason for rejection.");
          return;
        }

        // Disable form during submission
        const submitBtn = newForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Processing...";
        }

        try {
          const response = await fetch(`/manager/commonSpace/reject/${id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ purpose }),
          });

          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }

          const res = await response.json();
          alert(res.message || "Booking rejected successfully");
          
          popup.style.display = "none";
          window.location.reload();
        } catch (error) {
          console.error("Error rejecting booking:", error);
          alert("Network error. Please try again.");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Booking";
          }
        }
      });
    });
  });

  // Search functionality
  const searchInput = document.querySelector(".search-bar input");
  const searchButton = document.querySelector(".search-bar button");

  if (searchInput && searchButton) {
    const performSearch = () => {
      const searchTerm = searchInput.value.toLowerCase().trim();
      const bookingCards = document.querySelectorAll(".booking-card");
      let visibleCount = 0;

      bookingCards.forEach((card) => {
        const cardText = card.textContent.toLowerCase();
        if (!searchTerm || cardText.includes(searchTerm)) {
          card.style.display = "block";
          visibleCount++;
        } else {
          card.style.display = "none";
        }
      });

      // Handle empty state
      const existingEmptyState = document.querySelector(".empty-state.search-empty");
      const bookingsContainer = document.getElementById("bookingsContainer");

      if (visibleCount === 0 && searchTerm && bookingsContainer) {
        if (!existingEmptyState) {
          const emptyStateHTML = `
            <div class="empty-state search-empty" style="width:100%;">
              <i class="bi bi-search"></i>
              <h3>No matching bookings found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          `;
          bookingsContainer.insertAdjacentHTML("beforeend", emptyStateHTML);
        }
      } else if (existingEmptyState) {
        existingEmptyState.remove();
      }
    };

    searchButton.addEventListener("click", performSearch);
    searchInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") {
        performSearch();
      }
    });
  }

  // Management section toggle
  const toggleManagement = document.getElementById('toggleManagement');
  const managementContent = document.getElementById('managementContent');
  
  if (toggleManagement && managementContent) {
    toggleManagement.addEventListener('click', function() {
      const isHidden = managementContent.style.display === 'none' || 
                      !managementContent.style.display;
      
      managementContent.style.display = isHidden ? 'block' : 'none';
      this.textContent = isHidden ? 'Hide Management' : 'Show Management';
    });
  }

  // Add Space Form Toggle
  const addSpaceBtn = document.getElementById('addSpaceBtn');
  const spaceForm = document.getElementById('spaceForm');
  const formTitle = document.getElementById('formTitle');
  const spaceFormElement = document.getElementById('spaceFormElement');
  
  if (addSpaceBtn && spaceForm) {
    addSpaceBtn.addEventListener('click', function() {
      spaceForm.style.display = 'block';
      
      if (formTitle) {
        formTitle.textContent = 'Add New Common Space';
      }
      
      if (spaceFormElement) {
        spaceFormElement.reset();
        spaceFormElement.dataset.mode = 'add';
        delete spaceFormElement.dataset.spaceId;
      }
    });
  }

  // Cancel Space Form
  const cancelSpaceBtn = document.getElementById('cancelSpaceBtn');
  if (cancelSpaceBtn && spaceForm) {
    cancelSpaceBtn.addEventListener('click', function() {
      spaceForm.style.display = 'none';
    });
  }

  // Edit Space buttons
  document.querySelectorAll('.edit-space-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      try {
        const spaceData = this.dataset.space;
        if (!spaceData) {
          alert('Space data not found');
          return;
        }

        const space = JSON.parse(spaceData);
        
        if (spaceForm) {
          spaceForm.style.display = 'block';
        }
        
        if (formTitle) {
          formTitle.textContent = 'Edit Common Space';
        }
        
        // Fill form fields
        const fields = {
          'spaceType': space.type || '',
          'spaceName': space.name || '',
          'bookable': space.bookable ? 'true' : 'false',
          'maxHours': space.maxBookingDurationHours || '',
          'bookingRules': space.bookingRules || ''
        };

        Object.entries(fields).forEach(([id, value]) => {
          const element = document.getElementById(id);
          if (element) {
            element.value = value;
          }
        });
        
        // Set form mode
        if (spaceFormElement) {
          spaceFormElement.dataset.mode = 'edit';
          spaceFormElement.dataset.spaceId = space._id || space.name || '';
        }
      } catch (error) {
        console.error('Error parsing space data:', error);
        alert('Error loading space data');
      }
    });
  });

  // Delete Space buttons
  document.querySelectorAll('.delete-space-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const spaceId = this.dataset.id;
      
      if (!spaceId) {
        alert('Invalid space ID');
        return;
      }

      if (!confirm('Are you sure you want to delete this space?')) {
        return;
      }

      // Disable button during request
      this.disabled = true;
      const originalContent = this.innerHTML;
      this.innerHTML = '<i class="bi bi-hourglass-split"></i>';

      fetch(`/manager/api/community/spaces/${spaceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          const item = this.closest('.space-item');
          if (item) {
            item.remove();
          }

          // Check if no spaces left
          const remainingItems = document.querySelectorAll('.space-item');
          if (remainingItems.length === 0) {
            const spacesList = document.getElementById('spacesList');
            if (spacesList) {
              spacesList.innerHTML = `
                <div class="empty-state">
                  <i class="bi bi-building"></i>
                  <h3>No Common Spaces Configured</h3>
                  <p>Add your first common space to get started.</p>
                </div>
              `;
            }
          }

          alert(data.message || 'Space deleted successfully');
        } else {
          throw new Error(data.message || 'Unknown error');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error deleting space: ' + error.message);
      })
      .finally(() => {
        this.disabled = false;
        this.innerHTML = originalContent;
      });
    });
  });

  // Space Form submission
  if (spaceFormElement) {
    spaceFormElement.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get form data
      const spaceType = document.getElementById('spaceType');
      const spaceName = document.getElementById('spaceName');
      const bookable = document.getElementById('bookable');
      const maxHours = document.getElementById('maxHours');
      const bookingRules = document.getElementById('bookingRules');
      const bookingRent = document.getElementById('bookingRent');

      if (!spaceType || !spaceName) {
        alert('Required form fields not found');
        return;
      }

      const formData = {
        type: spaceType.value.trim(),
        name: spaceName.value.trim(),
        bookable: bookable ? bookable.value === 'true' : true,
        maxBookingDurationHours: maxHours && maxHours.value ? 
          parseInt(maxHours.value) : null,
        bookingRules: bookingRules ? bookingRules.value.trim() : '',
        bookingRent : parseInt(bookingRent.value)
      };

      // Validate required fields
      if (!formData.type || !formData.name) {
        alert('Please fill in all required fields');
        return;
      }

      // Disable form during submission
      const submitBtn = this.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
      }
      
      try {
        const mode = this.dataset.mode || 'add';
        const spaceId = this.dataset.spaceId;
        
        const url = mode === 'edit' && spaceId
          ? `/manager/api/community/spaces/${spaceId}`
          : '/manager/api/community/spaces';
        const method = mode === 'edit' ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          alert(data.message || 'Space saved successfully');
          location.reload();
        } else {
          throw new Error(data.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error saving space: ' + error.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save Space';
        }
      }
    });
  }

  // Save Booking Rules
  const saveRulesBtn = document.getElementById('saveRulesBtn');
  if (saveRulesBtn) {
    saveRulesBtn.addEventListener('click', async function() {
      const rulesTextarea = document.getElementById('bookingRulesTextarea');
      if (!rulesTextarea) {
        alert('Rules textarea not found');
        return;
      }

      const rules = rulesTextarea.value.trim();
      
      // Disable button during request
      this.disabled = true;
      const originalText = this.textContent;
      this.textContent = 'Saving...';
      
      try {
        const response = await fetch('/manager/manager/api/community/booking-rules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ rules })
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          alert(data.message || 'Booking rules saved successfully');
        } else {
          throw new Error(data.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error saving rules: ' + error.message);
      } finally {
        this.disabled = false;
        this.textContent = originalText;
      }
    });
  }
});