// Updated CSB.js - Frontend JavaScript with API-based Facility Data Fetching
// Store facility data globally
let facilityData = {};
// Function to open a popup
function openForm(type) {
  document.getElementById(type + "FormPopup").style.display = "flex";
}
// Function to close a popup
function closeForm(type) {
  if (type === "details") {
    document.getElementById("bookingDetailsPopup").style.display = "none";
  } else {
    document.getElementById(type + "FormPopup").style.display = "none";
  }
}
// Fetch facility data from API
async function fetchFacilityData() {
  try {
    const response = await fetch('/resident/api/facilities', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success && data.facilities) {
      // Convert array to object for easy lookup
      facilityData = {};
      data.facilities.forEach(facility => {
        facilityData[facility.name] = {
          maxBookingDurationHours: facility.maxBookingDurationHours,
          id: facility.id,
          description: facility.description,
          capacity: facility.capacity,
          amenities: facility.amenities
        };
      });
      return true;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching facility data:', error);
    // Fallback: Initialize with default values if API fails
    initializeFallbackFacilityData();
    return false;
  }
}
// Handle facility change
function handleFacilityChange() {
  const facility = document.getElementById("facility").value;
  const maxHoursDisplay = document.getElementById("maxHoursDisplay");
  if (facility) {
    // Reset date and time selections when facility changes
    document.getElementById("bookingDate").value = "";
    resetTimeSlots();
    // Find facility data and display max hours
    const selectedFacility = facilityData[facility];
    if (selectedFacility && selectedFacility.maxBookingDurationHours) {
      maxHoursDisplay.textContent = `Maximum booking duration: ${selectedFacility.maxBookingDurationHours} hour(s)`;
      maxHoursDisplay.style.color = "#007bff";
    }
  } else {
    maxHoursDisplay.textContent = "";
  }
}
// Handle date change
function handleDateChange() {
  const date = document.getElementById("bookingDate").value;
  if (date) {
    // Reset time selections when date changes
    resetTimeSlots();
    // TODO: Here you could fetch available slots for the selected date and facility
    // fetchAvailableSlots(facility, date);
  }
}
// Reset time slots
function resetTimeSlots() {
  const checkboxes = document.querySelectorAll('input[name="timeSlots"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
    checkbox.parentElement.classList.remove('selected');
  });
  updateSelectedTimeDisplay();
}
// Get maximum hours for selected facility
function getMaxHoursForFacility() {
  const facility = document.getElementById("facility").value;
  if (facility && facilityData[facility] && facilityData[facility].maxBookingDurationHours) {
    return facilityData[facility].maxBookingDurationHours;
  }
  // Return default max hours if facility data is not available
  return 4;
}
// Fetch specific facility data (alternative method)
async function fetchSpecificFacilityData(facilityName) {
  try {
    const response = await fetch(`/resident/commonSpace/api/facilities/${encodeURIComponent(facilityName)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success && data.facility) {
      // Update facility data for this specific facility
      facilityData[facilityName] = {
        maxBookingDurationHours: data.facility.maxBookingDurationHours,
        id: data.facility.id,
        description: data.facility.description,
        capacity: data.facility.capacity,
        amenities: data.facility.amenities
      };
      return facilityData[facilityName];
    }
  } catch (error) {
    console.error(`Error fetching data for facility ${facilityName}:`, error);
    return null;
  }
}
// Update selected time display and hidden inputs
function updateSelectedTimeDisplay() {
  const selectedSlots = Array.from(document.querySelectorAll('input[name="timeSlots"]:checked'))
    .map(cb => cb.value)
    .sort();
  const selectedTimeText = document.getElementById("selectedTimeText");
  const hiddenFromTime = document.getElementById("hiddenFromTime");
  const hiddenToTime = document.getElementById("hiddenToTime");
  if (selectedSlots.length === 0) {
    selectedTimeText.textContent = "No time slots selected";
    selectedTimeText.className = "no-selection";
    hiddenFromTime.value = "";
    hiddenToTime.value = "";
    return;
  }
  // Calculate start and end times
  const startTime = selectedSlots[0];
  const lastSlotHour = parseInt(selectedSlots[selectedSlots.length - 1].split(':')[0]);
  const endTime = String(lastSlotHour + 1).padStart(2, '0') + ':00';
  // Format display time
  const formatTime = (time24) => {
    const [hour, minute] = time24.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : (hourNum === 0 ? 12 : hourNum);
    return `${displayHour}:${minute} ${ampm}`;
  };
  selectedTimeText.textContent = `${formatTime(startTime)} - ${formatTime(endTime)}`;
  selectedTimeText.className = "time-selected";
  // Update hidden inputs
  hiddenFromTime.value = startTime;
  hiddenToTime.value = endTime;
}
// Check if slots are continuous
function areSlotsContinuous(slots) {
  if (slots.length <= 1) return true;
  const hours = slots.map(slot => parseInt(slot.split(':')[0])).sort((a, b) => a - b);
  for (let i = 1; i < hours.length; i++) {
    if (hours[i] - hours[i - 1] !== 1) {
      return false;
    }
  }
  return true;
}
// Handle time slot checkbox change with facility-specific max hours
function handleTimeSlotChange(checkbox) {
  const maxBookingDurationHours = getMaxHoursForFacility();
  // If checking a new slot, check limits first
  if (checkbox.checked) {
    const currentlySelected = document.querySelectorAll('input[name="timeSlots"]:checked').length;
    // Check if trying to select more than facility's max hours
    if (currentlySelected > maxBookingDurationHours) {
      checkbox.checked = false;
      alert(`You can select a maximum of ${maxBookingDurationHours} consecutive time slots for this facility.`);
      return;
    }
  }
  const selectedSlots = Array.from(document.querySelectorAll('input[name="timeSlots"]:checked'))
    .map(cb => cb.value);
  // Check if slots are continuous
  if (!areSlotsContinuous(selectedSlots)) {
    // Uncheck this slot and show warning
    checkbox.checked = false;
    alert("Please select continuous time slots only.");
    return;
  }
  // Update visual selection
  if (checkbox.checked) {
    checkbox.parentElement.classList.add('selected');
  } else {
    checkbox.parentElement.classList.remove('selected');
  }
  updateSelectedTimeDisplay();
}
// Show loading state
function showLoading(button) {
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="bi bi-spinner bi-spin"></i> Loading...';
  button.disabled = true;
  return originalText;
}
// Hide loading state
function hideLoading(button, originalText) {
  button.innerHTML = originalText;
  button.disabled = false;
}
// Wait for DOM to fully load
document.addEventListener("DOMContentLoaded", async () => {
  // Fetch facility data from API first
  const dataLoaded = await fetchFacilityData();
  // Open booking form
  document.getElementById("bookFacilityBtn")?.addEventListener("click", () => {
    openForm("booking");
  });
  // Handle time slot selection - direct event listeners on checkboxes
  document.querySelectorAll('input[name="timeSlots"]').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      handleTimeSlotChange(this);
    });
    // Also handle click events on labels for better UX
    const label = checkbox.nextElementSibling;
    if (label && label.tagName === 'LABEL') {
      label.addEventListener('click', function (e) {
        // Prevent default to handle manually
        e.preventDefault();
        checkbox.checked = !checkbox.checked;
        handleTimeSlotChange(checkbox);
      });
    }
  });
  // Handle clicks on time slot containers
  document.querySelectorAll('.time-slot').forEach(timeSlot => {
    timeSlot.addEventListener('click', function (e) {
      // Only handle if clicked on the container, not the checkbox or label
      if (e.target === this) {
        const checkbox = this.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          handleTimeSlotChange(checkbox);
        }
      }
    });
  });
  // Animate cards
  const cards = document.querySelectorAll(".stat-card, .table-container");
  cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    setTimeout(() => {
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 200 + index * 100);
  });
  // Cancel button handling
  document.querySelectorAll(".action-btn.cancel").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      const bookingId = button.getAttribute("data-id");
      const originalText = showLoading(button);
      // Confirm cancellation
      if (!confirm("Are you sure you want to cancel this booking?")) {
        hideLoading(button, originalText);
        return;
      }
      try {
        const res = await fetch(`/resident/commonSpace/cancelled/${bookingId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const result = await res.json();
        if (res.ok) {
          alert("Booking cancelled successfully.");
          window.location.reload();
        } else {
          throw new Error(result.error || "Failed to cancel booking");
        }
      } catch (error) {
        console.error("Cancellation error:", error);
        alert("Could not cancel the booking. Please try again.");
        hideLoading(button, originalText);
      }
    });
  });
  // View button handling — opens Booking Details popup
  document.querySelectorAll(".action-btn.view").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      const bookingId = button.getAttribute("data-id");
      const originalText = showLoading(button);
      try {
        const response = await fetch(`/resident/commonSpace/${bookingId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch booking details");
        }
        const data = await response.json();
        const b = data.commonspace;
        // Populate popup fields with safe fallbacks
        document.getElementById("detail-id").textContent = b._id ? b._id.toString().slice(-6) : "-";
        // Status with proper styling
        const statusElement = document.getElementById("detail-status");
        statusElement.innerHTML = `<span class="status-badge status-${b.status?.toLowerCase() || 'unknown'}">${b.status || 'Unknown'}</span>`;
        document.getElementById("detail-facility").textContent = b.name || "-";
        document.getElementById("detail-date").textContent = b.Date || b.date || "-";
        document.getElementById("detail-time").textContent = `${b.from || b.startTime || "-"} - ${b.to || b.endTime || "-"}`;
        // Format created date
        if (b.createdAt) {
          const createdAt = new Date(b.createdAt);
          document.getElementById("detail-created").textContent = createdAt.toLocaleString();
        } else {
          document.getElementById("detail-created").textContent = "-";
        }
        document.getElementById("detail-purpose").textContent = b.description || b.purpose || "No purpose specified";
        // Cancellation section
        if (b.status === "Cancelled" || b.cancellationReason) {
          document.getElementById("cancellation-section").style.display = "block";
          document.getElementById("detail-cancellation-reason").textContent = b.cancellationReason || "No reason provided";
          document.getElementById("detail-cancelled-by").textContent = b.cancelledBy || "System";
          if (b.cancelledAt) {
            const cancelledAt = new Date(b.cancelledAt);
            document.getElementById("detail-cancelled-at").textContent = cancelledAt.toLocaleString();
          } else {
            document.getElementById("detail-cancelled-at").textContent = "-";
          }
        } else {
          document.getElementById("cancellation-section").style.display = "none";
        }
        // Manager comment section
        if (b.managerComment) {
          document.getElementById("manager-comment-section").style.display = "block";
          document.getElementById("detail-manager-comment").textContent = b.managerComment;
        } else {
          document.getElementById("manager-comment-section").style.display = "none";
        }
        // Feedback section
        if (b.feedback || b.rating) {
          document.getElementById("feedback-section").style.display = "block";
          document.getElementById("detail-feedback").textContent = b.feedback || "-";
          document.getElementById("detail-rating").textContent = b.rating || "-";
        } else {
          document.getElementById("feedback-section").style.display = "none";
        }
        // Show popup
        document.getElementById("bookingDetailsPopup").style.display = "flex";
      } catch (err) {
        console.error("Error fetching booking details:", err);
        alert("Failed to load booking details. Please try again.");
      } finally {
        hideLoading(button, originalText);
      }
    });
  });
  // Click outside to close any popup
  document.querySelectorAll(".popup").forEach((popup) => {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        popup.style.display = "none";
      }
    });
  });
  // Form submission handling
  document.getElementById("bookingForm")?.addEventListener("submit", function (e) {
    const selectedSlots = document.querySelectorAll('input[name="timeSlots"]:checked');
    const maxBookingDurationHours = getMaxHoursForFacility();
    if (selectedSlots.length === 0) {
      e.preventDefault();
      alert("Please select at least one time slot.");
      return;
    }
    if (selectedSlots.length > maxBookingDurationHours) {
      e.preventDefault();
      alert(`You can select a maximum of ${maxBookingDurationHours} time slots for this facility.`);
      return;
    }
    const fromTime = document.getElementById("hiddenFromTime").value;
    const toTime = document.getElementById("hiddenToTime").value;
    const facility = document.getElementById("facility").value;
    const date = document.getElementById("bookingDate").value;
    if (!fromTime || !toTime) {
      e.preventDefault();
      alert("Please select valid time slots.");
      return;
    }
    if (!facility) {
      e.preventDefault();
      alert("Please select a facility.");
      return;
    }
    if (!date) {
      e.preventDefault();
      alert("Please select a date.");
      return;
    }
    // Remove timeSlots checkboxes from form submission to avoid confusion
    const timeSlotsCheckboxes = document.querySelectorAll('input[name="timeSlots"]');
    timeSlotsCheckboxes.forEach(checkbox => {
      checkbox.disabled = true;
    });
    // Show loading state on submit button
    const submitButton = this.querySelector('button[type="submit"]');
    showLoading(submitButton);
  });
});