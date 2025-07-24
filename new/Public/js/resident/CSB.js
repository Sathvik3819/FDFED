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

// Handle facility change
function handleFacilityChange() {
  const facility = document.getElementById("facility").value;
  if (facility) {
    // Reset date and time selections when facility changes
    document.getElementById("bookingDate").value = "";
    resetTimeSlots();
  }
}

// Handle date change
function handleDateChange() {
  const date = document.getElementById("bookingDate").value;
  if (date) {
    // Reset time selections when date changes
    resetTimeSlots();
    // Here you could fetch available slots for the selected date and facility
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
    if (hours[i] - hours[i-1] !== 1) {
      return false;
    }
  }
  return true;
}

// Handle time slot checkbox change
function handleTimeSlotChange(checkbox) {
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

// Wait for DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
  // Open booking form
  document.getElementById("bookFacilityBtn")?.addEventListener("click", () => {
    openForm("booking");
  });

  // Handle time slot selection - direct event listeners on checkboxes
  document.querySelectorAll('input[name="timeSlots"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      handleTimeSlotChange(this);
    });
    
    // Also handle click events on labels for better UX
    const label = checkbox.nextElementSibling;
    if (label && label.tagName === 'LABEL') {
      label.addEventListener('click', function(e) {
        // Prevent default to handle manually
        e.preventDefault();
        checkbox.checked = !checkbox.checked;
        handleTimeSlotChange(checkbox);
      });
    }
  });

  // Handle clicks on time slot containers
  document.querySelectorAll('.time-slot').forEach(timeSlot => {
    timeSlot.addEventListener('click', function(e) {
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
    button.addEventListener("click", async () => {
      const bookingId = button.getAttribute("data-id");

      try {
        const res = await fetch(
          `/resident/commonSpace/cancelled/${bookingId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        alert("Booking cancelled successfully.");
        window.location.reload();
      } catch (error) {
        console.error(error);
        alert("Could not cancel the booking.");
      }
    });
  });

  // View button handling — opens Booking Details popup
  document.querySelectorAll(".action-btn.view").forEach((button) => {
    button.addEventListener("click", async () => {
      const bookingId = button.getAttribute("data-id");
      console.log("Booking ID:", bookingId);

      try {
        const response = await fetch(`/resident/commonSpace/${bookingId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });

        const b = await response.json(); // assuming `b` is the booking object
        console.log("Booking Details:", b);

        // Populate popup fields
        document.getElementById("detail-id").innerText =
          b.commonspace._id || "-";
        document.getElementById(
          "detail-status"
        ).innerHTML = `<span class="status-badge status-${b.commonspace.status}">${b.commonspace.status}</span>`;
        document.getElementById("detail-facility").textContent =
          b.commonspace.name || "-";
        document.getElementById("detail-date").textContent =
          b.commonspace.Date || b.commonspace.date || "-";
        document.getElementById("detail-time").textContent = `${
          b.commonspace.from || b.commonspace.startTime || "-"
        } - ${b.commonspace.to || b.commonspace.endTime || "-"}`;

        const createdAt = new Date(b.commonspace.createdAt);
        document.getElementById("detail-created").textContent =
          createdAt.toLocaleString();

        document.getElementById("detail-purpose").textContent =
          b.commonspace.description || b.commonspace.purpose || "-";

        // Optional fields: show/hide based on values
        if (
          b.commonspace.status === "Cancelled" ||
          b.commonspace.cancellationReason
        ) {
          document.getElementById("cancellation-section").style.display =
            "block";
          document.getElementById("detail-cancellation-reason").textContent =
            b.commonspace.cancellationReason || "-";
          document.getElementById("detail-cancelled-by").textContent =
            b.commonspace.cancelledBy || "Admin";
          
          if (b.commonspace.cancelledAt) {
            const cancelledAt = new Date(b.commonspace.cancelledAt);
            document.getElementById("detail-cancelled-at").textContent =
              cancelledAt.toLocaleString();
          }
        } else {
          document.getElementById("cancellation-section").style.display =
            "none";
        }

        // Manager comment section
        if (b.commonspace.managerComment) {
          document.getElementById("manager-comment-section").style.display = "block";
          document.getElementById("detail-manager-comment").textContent =
            b.commonspace.managerComment || "-";
        } else {
          document.getElementById("manager-comment-section").style.display = "none";
        }

        if (b.feedback || b.rating) {
          document.getElementById("feedback-section").style.display = "block";
          document.getElementById("detail-feedback").textContent =
            b.feedback || "-";
          document.getElementById("detail-rating").textContent =
            b.rating || "-";
        } else {
          document.getElementById("feedback-section").style.display = "none";
        }

        // Show popup
        document.getElementById("bookingDetailsPopup").style.display = "flex";
      } catch (err) {
        console.error("Error fetching booking details:", err);
        alert("Failed to load booking details.");
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
  document.getElementById("bookingForm")?.addEventListener("submit", function(e) {
    const selectedSlots = document.querySelectorAll('input[name="timeSlots"]:checked');
    if (selectedSlots.length === 0) {
      e.preventDefault();
      alert("Please select at least one time slot.");
      return;
    }
    
    const fromTime = document.getElementById("hiddenFromTime").value;
    const toTime = document.getElementById("hiddenToTime").value;
    
    if (!fromTime || !toTime) {
      e.preventDefault();
      alert("Please select valid time slots.");
      return;
    }
    
    // Remove timeSlots checkboxes from form submission to avoid confusion
    const timeSlotsCheckboxes = document.querySelectorAll('input[name="timeSlots"]');
    timeSlotsCheckboxes.forEach(checkbox => {
      checkbox.disabled = true;
    });
  });
});