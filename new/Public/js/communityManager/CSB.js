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

  function openPopup(el) {
    el.style.display = "flex";
  }
  function closePopup(el) {
    el.style.display = "none";
  }

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
      } else {
        notyf.error(data.message || "Failed to approve booking.");
      }
    }

    if (e.target.closest(".reject-btn")) {
      openPopup(cancellationReason);
      submitRejectionBtn.addEventListener("click", async () => {
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
              <span class="detail-badge status-badge status-${
                data.status
              } " id="detail-status">${data.status}</span>
            </div>
            <div class="detail-item">
              <div class="icon-col">
                <i class="bi bi-building text-primary"></i>
              </div>
              <div class="d-flex flex-column">
                <span class="detail-label">Facility</span>
                <span class="detail-value" id="detail-facility">${
                  data.name
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
                <span class="detail-value" id="detail-time">${data.from} - ${
          data.to
        }</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="icon-col">
                <i class="bi bi-person-circle text-primary"></i>
              </div>
              <div class="d-flex flex-column">
                <span class="detail-label">Created</span>
                <span class="detail-value" id="detail-created">${
                  data.bookedBy.residentFirstName
                } ${data.bookedBy.residentLastName}</span>
              </div>
            </div>
            <div class="detail-item col-span-2">
              <div class="icon-col">
                <i class="bi bi-card-text text-primary"></i>
              </div>
              <div class="d-flex flex-column">
                <span class="detail-label">Purpose</span>
                <span class="detail-value" id="detail-purpose">${
                  data.description
                }</span>
              </div>
            </div>
          </div>

          <!-- Cancellation Section -->
          ${
            data.feedback
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

          ${
            data.status === "Pending Payment" || data.status === "Booked"
              ? `
              <div id="payment-section" class="payment-box"  >
                  <h4>Payment Details</h4>
                  <div class="detail-item">
                    <span class="detail-label me-1">Amount : </span>
                    <span class="detail-value mt-0" id="detail-cancellation-reason"> ${
                      data.payment?.amount
                    }</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label me-2">Status</span>
                    <span class="detail-badge status-badge mb-1 status-${
                      data.payment.status
                    }   " id="detail-status">${data.payment?.status}</span>
                  </div>

                  ${
                    data.payment.status === "Pending"
                      ? `
                    <div class="detail-item"> 
                      <div class="detail-label me-1">Payment Deadline : </div>
                      <div class="detail-value mt-0" id="detail-payment-deadline">
                        ${
                          data.payment?.paymentDeadline
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
                        ${
                          data.payment?.paymentDate
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
                  <strong>Bookable:</strong> ${
                    data.space.bookable ? "Yes" : "No"
                  }
                </p>
                <p>
                  <strong>Max Hours:</strong> ${
                    data.space.maxBookingDurationHours || "Not specified"
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

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    const cards = bookingsContainer.querySelectorAll(".booking-card");
    let visible = 0;
    cards.forEach((card) => {
      const text = card.innerText.toLowerCase();
      const match = text.includes(term);
      card.style.display = match ? "block" : "none";
      if (match) visible++;
    });
    const empty = bookingsContainer.querySelector(".empty-state");
    if (visible === 0) {
      if (!empty) {
        const div = document.createElement("div");
        div.className = "empty-state w-100";
        div.innerHTML = `<i class="bi bi-calendar-x"></i><h3>No Bookings Found</h3><p>No results match your search.</p>`;
        bookingsContainer.appendChild(div);
      }
    } else {
      empty?.remove();
    }
  });
});
