const notyf = new Notyf({
  duration: 3000,
  position: { x: "center", y: "top" },
  types: [
    { type: "warning", background: "orange", icon: false },
    { type: "info", background: "blue", icon: false },
  ],
});

document.addEventListener("DOMContentLoaded", () => {
  const bookingsContainer = document.getElementById("bookingsContainer");
  const bookingDetailsPopup = document.getElementById("bookingDetailsPopup");
  const detailsContent = document.getElementById("detailsContent");
  const toggleManagement = document.getElementById("toggleManagement");
  const managementContent = document.getElementById("managementContent");
  const addSpaceBtn = document.getElementById("addSpaceBtn");
  const cancelSpaceBtn = document.getElementById("cancelSpaceBtn");
  const closeSpaceFormBtn = document.getElementById("closeSpaceForm");
  const spaceForm = document.getElementById("spaceFormPopup");
  const spaceFormElement = document.getElementById("spaceFormElement");
  const spacesList = document.getElementById("spacesList");
  const bookingRules = document.getElementById("bookingRules");
  const searchInput = document.querySelector(".search-bar input");
  const emptyState = document.querySelector(".empty-state");
  const cancellationReason = document.getElementById("cancellationReasonPopup");
  const submitRejectionBtn = document.getElementById("submitRejection");
  const cancelRejectionBtn = document.getElementById("cancelRejection");
  const manualRefreshBtn = document.getElementById("manualRefresh");

  let refreshInterval;
  let isRefreshing = false;
  let allBookings = []; 

  function openPopup(el) {
    el.style.display = "flex";
  }
  function closePopup(el) {
    el.style.display = "none";
  }

  // Function to fetch and update bookings
  async function refreshBookings() {
    if (isRefreshing) return;

    isRefreshing = true;

    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refreshing...';
    loadingIndicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--primary);
      color: white;
      padding: 8px 15px;
      border-radius: 20px;
      font-size: 0.9rem;
      z-index: 1000;
      animation: pulse 1s infinite;
    `;
    document.body.appendChild(loadingIndicator);

    try {
      const response = await fetch('/manager/commonSpace/api/bookings');
      const data = await response.json();

      if (data.success) {
        allBookings = data.bookings; // Store all bookings
        updateBookingCards(data.bookings);
        updateStats(data.bookings);
        // Re-apply search filter if there's an active search
        if (searchInput.value.trim()) {
          performSearch(searchInput.value.trim());
        }
      } else {
        console.error('Failed to fetch bookings:', data.message);
        notyf.error('Failed to refresh bookings');
      }
    } catch (error) {
      console.error('Error refreshing bookings:', error);
      notyf.error('Error refreshing bookings');
    } finally {
      isRefreshing = false;
      // Remove loading indicator
      const indicator = document.querySelector('.loading-indicator');
      if (indicator) {
        indicator.remove();
      }
    }
  }

  // Function to update booking cards
  function updateBookingCards(bookings) {
    if (!bookings || bookings.length === 0) {
      bookingsContainer.innerHTML = `
        <div class="empty-state w-100">
          <i class="bi bi-calendar-x"></i>
          <h3>No Bookings Found</h3>
          <p>There are currently no common space bookings to display.</p>
        </div>
      `;
      return;
    }

    const bookingCardsHTML = bookings.map(booking => `
      <div class="booking-card">
        <div class="booking-card-header">
          <span class="booking-id">ID: ${booking.ID}</span>
          <span class="booking-status status-${booking.status}">${booking.status}</span>
        </div>

        <h3 class="booking-space">${booking.name}</h3>

        <div class="booking-datetime">
          <i class="bi bi-calendar-event"></i>
          <span>${booking.Date}, ${booking.from} - ${booking.to}</span>
        </div>

        <div class="booking-actions">
          ${booking.status === "Pending" ? `
            <button class="available-btn" data-id="${booking._id}">
              <i class="bi bi-eye"></i> Check Availability
            </button>
          ` : booking.status === "available" ? `
            <button class="approve-btn" data-id="${booking._id}">
              <i class="bi bi-check-circle-fill"></i> Approve
            </button>
            <button class="reject-btn" data-id="${booking._id}">
              <i class="bi bi-x-circle-fill"></i> Reject
            </button>
          ` : `
            <button class="view-btn" data-id="${booking._id}">
              <i class="bi bi-eye"></i> View Details
            </button>
          `}
        </div>
      </div>
    `).join('');

    bookingsContainer.innerHTML = bookingCardsHTML;
  }

  // Function to update statistics
  function updateStats(bookings) {
    const todayBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === "Pending").length;
    const approvedBookings = bookings.filter(b => b.status === "Approved").length;

    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 3) {
      statCards[0].querySelector('.stat-number').textContent = todayBookings;
      statCards[1].querySelector('.stat-number').textContent = pendingBookings;
      statCards[2].querySelector('.stat-number').textContent = approvedBookings;
    }
  }

  // Start auto-refresh every 30 seconds
  function startAutoRefresh() {
    refreshInterval = setInterval(refreshBookings, 30000); // 30 seconds
  }

  // Stop auto-refresh
  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  // Manual refresh button
  manualRefreshBtn.addEventListener('click', () => {
    if (!isRefreshing) {
      refreshBookings();
    }
  });

  // Initialize with current bookings data
  function initializeBookings() {
    // Get initial bookings from the server-rendered data
    const initialCards = bookingsContainer.querySelectorAll('.booking-card');
    if (initialCards.length > 0) {
      // Extract data from existing cards for search functionality
      allBookings = Array.from(initialCards).map(card => {
        const id = card.querySelector('[data-id]')?.dataset.id;
        const status = card.querySelector('.booking-status')?.textContent;
        const name = card.querySelector('.booking-space')?.textContent;
        const datetime = card.querySelector('.booking-datetime span')?.textContent;
        const bookingId = card.querySelector('.booking-id')?.textContent?.replace('ID: ', '');

        return {
          _id: id,
          status: status,
          name: name,
          Date: datetime?.split(',')[0] || '',
          from: datetime?.split(',')[1]?.split(' - ')[0]?.trim() || '',
          to: datetime?.split(',')[1]?.split(' - ')[1]?.trim() || '',
          ID: bookingId
        };
      });
    }
  }

  // Initialize bookings data
  initializeBookings();

  // Start auto-refresh when page loads
  startAutoRefresh();

  // Stop auto-refresh when user leaves the page
  window.addEventListener('beforeunload', stopAutoRefresh);

  // Event delegation for booking actions (works with dynamically updated content)
  bookingsContainer.addEventListener("click", async (e) => {
    const card = e.target.closest(".booking-card");
    if (!card) return;
    const id = card.querySelector("[data-id]")?.dataset.id;

    if (e.target.closest(".available-btn")) {
      const result = await fetch(
        `/manager/commonSpace/checkAvailability/${id}`
      );
      const data = await result.json();
      if (data.success) {
        if (data.available) {
          card.querySelector(".booking-actions").innerHTML = `
            <button class="approve-btn" data-id="${id}"><i class="bi bi-check-circle-fill"></i> Approve</button>
            <button class="reject-btn" data-id="${id}"><i class="bi bi-x-circle-fill"></i> Reject</button>`;
          card.querySelector(".booking-status").innerText = "available";
          card.querySelector(".booking-status").className =
            "booking-status status-available";
          notyf.success("The requested slots are available.");
        } else {
          card.querySelector(".booking-status").innerText = "Rejected";
          card.querySelector(".booking-status").className =
            "booking-status status-Rejected";
          card.querySelector(
            ".booking-actions"
          ).innerHTML = `<button class="view-btn" data-id="${id}"><i class="bi bi-eye"></i> View Details</button>`;
          notyf.error("The requested slots are not available.");
        }
      } else {
        notyf.error(data.message || "Failed to check availability.");
      }
    }

    if (e.target.closest(".approve-btn")) {
      const response = await fetch(`/manager/commonSpace/approve/${id}`, {
        method: "GET",
      });
      const data = await response.json();
      if (data.success) {
        card.querySelector(".booking-status").innerText = "Approved";
        card.querySelector(".booking-status").className =
          "booking-status status-Booked";
        card.querySelector(
          ".booking-actions"
        ).innerHTML = `<button class="view-btn" data-id="${id}"><i class="bi bi-eye"></i> View Details</button>`;
        notyf.success("Booking approved successfully.");
        // Trigger refresh to update all data
        setTimeout(() => refreshBookings(), 1000);
      } else {
        notyf.error(data.message || "Failed to approve booking.");
      }
    }

    if (e.target.closest(".reject-btn")) {
      openPopup(cancellationReason);
      // Remove existing listeners to prevent duplicates
      const newSubmitBtn = document.getElementById("submitRejection");
      const clonedBtn = newSubmitBtn.cloneNode(true);
      newSubmitBtn.parentNode.replaceChild(clonedBtn, newSubmitBtn);

      clonedBtn.addEventListener("click", async () => {
        const reason = document.getElementById("rejectionReason").value;
        if (!reason) return;
        const response = await fetch(`/manager/commonSpace/reject/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        const data = await response.json();
        if (data.success) {
          card.querySelector(".booking-status").innerText = "Rejected";
          card.querySelector(".booking-status").className =
            "booking-status status-Rejected";
          card.querySelector(
            ".booking-actions"
          ).innerHTML = `<button class="view-btn" data-id="${id}"><i class="bi bi-eye"></i> View Details</button>`;
          notyf.success("Booking rejected successfully.");
          cancellationReason.style.display = "none";
          document.getElementById("rejectionReason").value = "";
          // Trigger refresh to update all data
          setTimeout(() => refreshBookings(), 1000);
        } else {
          notyf.error(data.message || "Failed to reject booking.");
        }
      });
    }

    if (e.target.closest(".view-btn")) {
      fetch(`/manager/commonSpace/details/${id}`).then(async (r) => {
        const data = await r.json();
        console.log(data);

        detailsContent.innerHTML = `
            <div class="details-grid shadow-sm">
            <div class="detail-item">
              <span class="detail-label me-1">Booking ID</span>
              <span class="detail-value" id="detail-id">${data.ID}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label me-2">Status</span>
              <span class="detail-badge status-badge status-${data.status
          } " id="detail-status">${data.status}</span>
            </div>
            <div class="detail-item">
              <div class="icon-col">
                <i class="bi bi-building text-primary"></i>
              </div>
              <div class="d-flex flex-column">
                <span class="detail-label">Facility</span>
                <span class="detail-value" id="detail-facility">${data.name
          }</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="icon-col">
                <i class="bi bi-calendar text-primary"></i>
              </div>
              <div class="d-flex flex-column">
                <span class="detail-label">Date</span>
                <span class="detail-value" id="detail-date">${data.date}</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="icon-col">
                <i class="bi bi-clock text-primary"></i>
              </div>
              <div class="d-flex flex-column">
                <span class="detail-label">Time</span>
                <span class="detail-value" id="detail-time">${data.from} - ${data.to
          }</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="icon-col">
                <i class="bi bi-person-circle text-primary"></i>
              </div>
              <div class="d-flex flex-column">
                <span class="detail-label">Created</span>
                <span class="detail-value" id="detail-created">${data.bookedBy.residentFirstName
          } ${data.bookedBy.residentLastName}</span>
              </div>
            </div>
            <div class="detail-item col-span-2">
              <div class="icon-col">
                <i class="bi bi-card-text text-primary"></i>
              </div>
              <div class="d-flex flex-column">
                <span class="detail-label">Purpose</span>
                <span class="detail-value" id="detail-purpose">${data.description
          }</span>
              </div>
            </div>
          </div>

          <!-- Cancellation Section -->
          ${data.feedback
            ? `
                <div id="cancellation-section" class="cancellation-box">
                  <h4>Cancellation Details</h4>
                  <div class="detail-item">
                    <span class="detail-label me-1">Reason : </span>
                    <span class="detail-value mt-0" id="detail-cancellation-reason"> ${data.feedback}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label me-1">Cancelled By </span>
                    <span class="detail-value mt-0" id="detail-cancelled-by"> Manager</span>
                  </div>
                  
                </div>
              `
            : ""
          }

          ${data.status === "Pending Payment" || data.status === "Booked"
            ? `
              <div id="payment-section" class="payment-box"  >
                  <h4>Payment Details</h4>
                  <div class="detail-item">
                    <span class="detail-label me-1">Amount : </span>
                    <span class="detail-value mt-0" id="detail-cancellation-reason"> ${data.payment?.amount
            }</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label me-2">Status</span>
                    <span class="detail-badge status-badge mb-1 status-${data.payment.status
            }   " id="detail-status">${data.payment?.status}</span>
                  </div>

                  ${data.payment.status === "Pending"
              ? `
                    <div class="detail-item"> 
                      <div class="detail-label me-1">Payment Deadline : </div>
                      <div class="detail-value mt-0" id="detail-payment-deadline">
                        ${data.payment?.paymentDeadline
                ? new Date(data.payment.paymentDeadline).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
                : "-"
              }
                      </div>

                    </div>
                    `
              : data.payment.status === "Completed" ? `
                    <div class="detail-item"> 
                      <div class="detail-label me-1">Transaction ID : </div>
                      <div class="detail-value mt-0" id="detail-transaction-id">
                        ${data.payment?._id || "-"}
                      </div>
                    </div>
                    <div class="detail-item"> 
                      <div class="detail-label me-1">Paid On : </div>
                      <div class="detail-value mt-0" id="detail-payment-completed">
                        ${data.payment?.paymentDate
                  ? new Date(data.payment.paymentDate).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                  : "-"
                }
                      </div>
                    </div>
                    <div class="detail-item"> 
                      <div class="detail-label me-1">Payment Method : </div>
                      <div class="detail-value mt-0" id="detail-payment-method">
                        ${data.payment?.paymentMethod || "-"}
                      </div>
                    </div>
                   
                      ` : "-"
            }
                  
              </div>
            `
            : ""
          } 

          `;
        openPopup(bookingDetailsPopup);
        document.querySelector(".close-btn").addEventListener("click", () => {
          bookingDetailsPopup.style.display = "none";
        });
      });
    }
  });

  toggleManagement.addEventListener("click", () => {
    managementContent.style.display =
      managementContent.style.display === "none" ? "block" : "none";
    toggleManagement.innerText =
      managementContent.style.display === "block"
        ? "Hide Management"
        : "Show Management";
  });

  addSpaceBtn.addEventListener("click", () => {
    spaceForm.style.display = "flex";
    document.getElementById("formTitle").innerText = "Add New Common Space";
    spaceFormElement.reset();
  });

  cancelSpaceBtn.addEventListener(
    "click",
    () => (spaceForm.style.display = "none")
  );
  closeSpaceFormBtn.addEventListener(
    "click",
    () => (spaceForm.style.display = "none")
  );

  spacesList.addEventListener("click", async (e) => {
    if (e.target.closest(".edit-space-btn")) {
      console.log(e.target.closest(".edit-space-btn").dataset);

      spaceForm.style.display = "flex";
      document.getElementById("formTitle").innerText = "Edit Space";
      document.getElementById("spaceType").value =
        e.target.closest(".edit-space-btn").dataset.type;
      document.getElementById("spaceName").value =
        e.target.closest(".edit-space-btn").dataset.name;
      document.getElementById("bookable").value =
        e.target.closest(".edit-space-btn").dataset.bookable;
      document.getElementById("maxHours").value =
        e.target.closest(".edit-space-btn").dataset.maxhours || 4;
      document.getElementById("bookingRent").value =
        e.target.closest(".edit-space-btn").dataset.rent || "";
      document.getElementById("bookingRules").value =
        e.target.closest(".edit-space-btn").dataset.rules || "";
      spaceFormElement.dataset.id =
        e.target.closest(".edit-space-btn").dataset.id;
    }
    if (e.target.closest(".delete-space-btn")) {
      const id = e.target.closest(".delete-space-btn").dataset.id;
      console.log(id);

      if (confirm("Are you sure you want to delete this space?")) {
        const response = await fetch(`/manager/spaces/${id}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (data.success) {
          e.target.closest(".space-item").remove();
          if (spacesList.children.length === 0) {
            const div = document.createElement("div");
            div.className = "empty-state";
            div.innerHTML = `
               
                <i class="bi bi-building"></i>
                <h3>No Common Spaces Configured</h3>
                <p>Add your first common space to get started.</p>
             
            `;
            spacesList.appendChild(div);
          }
        } else {
          notyf.error(data.message || "Failed to delete space.");
        }
      }
    }
  });

  spaceFormElement.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = spaceFormElement.dataset.id;
    const payload = {
      spaceType: document.getElementById("spaceType").value,
      spaceName: document.getElementById("spaceName").value,
      bookable: document.getElementById("bookable").value === "true",
      maxHours: document.getElementById("maxHours").value,
      bookingRent: document.getElementById("bookingRent").value,
      bookingRules: bookingRules.value,
    };
    const response = await fetch(`/manager/spaces${id ? "/" + id : ""}`, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log(JSON.stringify(data.space));

    if (data.success) {
      const newItem = document.createElement("div");
      newItem.className = "space-item";
      newItem.innerHTML = `
        <div class="space-actions">
                  <button
                    class="edit-space-btn"
                    data-id="${data.space._id}"
                    data-name="${data.space.name}"
                    data-type="${data.space.type}"
                    data-bookable="${data.space.bookable}"
                    data-maxhours="${data.space.maxBookingDurationHours}"
                    data-rent="${data.space.rent}"
                    data-rules="${data.space.bookingRules}"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="delete-space-btn" data-id="${data.space._id}">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                <h4>${data.space.name}</h4>
                <p><strong>Type:</strong> ${data.space.type}</p>
                <p>
                  <strong>Bookable:</strong> ${data.space.bookable ? "Yes" : "No"
        }
                </p>
                <p>
                  <strong>Max Hours:</strong> ${data.space.maxBookingDurationHours || "Not specified"
        }
                </p>
                <p>
                  <strong>Rules:</strong> ${data.space.bookingRules.substring(
          0,
          50
        )}...
                </p>
      `;
      const emptyState = spacesList.querySelector(".empty-state");
      console.log(emptyState || "no empty state");

      if (emptyState) {
        emptyState.remove();
        console.log("removed empty state");
      }
      if (id) {
        const existingItem = spacesList
          .querySelector(`.space-item .edit-space-btn[data-id='${id}']`)
          .closest(".space-item");
        existingItem.replaceWith(newItem);
      } else {
        spacesList.appendChild(newItem);
      }

      spaceForm.style.display = "none";
      notyf.success("Space saved successfully.");
    }
  });

  bookingRules?.addEventListener("input", () => {
    const lines = bookingRules.value
      .split("\n")
      .map((line, i) =>
        line ? `${i + 1}. ${line.replace(/^\d+\.\s*/, "")}` : ""
      )
      .join("\n");
    bookingRules.value = lines;
  });

  // Search functionality
  function performSearch(term) {
    if (!allBookings || allBookings.length === 0) return;

    const filteredBookings = allBookings.filter(booking => {
      const searchText = `${booking.name} ${booking.Date} ${booking.from} ${booking.to} ${booking.status} ${booking.ID}`.toLowerCase();
      return searchText.includes(term.toLowerCase());
    });

    updateBookingCards(filteredBookings);
  }

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim();
    if (term) {
      performSearch(term);
    } else {
      // Show all bookings if search is cleared
      updateBookingCards(allBookings);
    }
  });
});
