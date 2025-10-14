const notyf = new Notyf({
  duration: 3000,
  position: { x: "center", y: "top" },
  types: [
    { type: "warning", background: "orange", icon: false },
    { type: "info", background: "blue", icon: false },
  ],
});

let facilityData = {};
let allBookings = [];
let isRefreshing = false;
let autoRefreshInterval;

function openForm(type) {
  document.getElementById(type + "FormPopup").style.display = "flex";
}

function closeForm(type) {
  if (type === "details") {
    document.getElementById("bookingDetailsPopup").style.display = "none";
  } else {
    document.getElementById(type + "FormPopup").style.display = "none";
  }
}

async function fetchFacilityData() {
  try {
    const response = await fetch("/resident/api/facilities");
    const data = await response.json();
    const facilities = data.facilities || data;
    facilityData = {};
    facilities.forEach((f) => {
      facilityData[f.name] = {
        maxHours: f.maxHours,
        bookingRules: f.bookingRules,
        id: f._id,
        rent: f.rent,
      };
    });

    return facilities;
  } catch (err) {
    console.error("Error fetching facilities:", err);
  }
}

function handleFacilityChange() {
  const facility = document.getElementById("facility").value;
  const maxHoursDisplay = document.getElementById("maxHoursDisplay");
  const timeSlotsContainer = document.getElementById("timeSlotsContainer");
  const formContainer = document.querySelector(".A");
  document.getElementById("bookingDate").value = "";
  resetTimeSlots();
  const selected = facilityData[facility];

  // Check if facility requires time slot booking
  const requiresTimeSlots = shouldShowTimeSlots(facility);

  if (requiresTimeSlots) {
    maxHoursDisplay.textContent = selected
      ? `Maximum booking duration: ${selected.maxBookingDurationHours} hour(s)`
      : "";
    maxHoursDisplay.style.color = "#007bff";
    maxHoursDisplay.classList.remove("no-time-slot");
    timeSlotsContainer.style.display = "block";
    formContainer.classList.remove("time-slots-hidden");
  } else {
    maxHoursDisplay.textContent = "No time slot booking required for this facility";
    maxHoursDisplay.style.color = "#28a745";
    maxHoursDisplay.classList.add("no-time-slot");
    timeSlotsContainer.style.display = "none";
    formContainer.classList.add("time-slots-hidden");
  }
}

function shouldShowTimeSlots(facilityName) {
  // Facilities that don't require time slot booking
  const noTimeSlotFacilities = [
    'gym', 'swimming pool', 'pool', 'fitness center', 'gymnasium'
  ];

  const facilityLower = facilityName.toLowerCase();

  // Check if facility name contains any of the no-time-slot keywords
  return !noTimeSlotFacilities.some(keyword =>
    facilityLower.includes(keyword)
  );
}



function handleDateChange() {
  document.getElementById("bookingDate").value && resetTimeSlots();
}

function resetTimeSlots() {
  document.querySelectorAll('input[name="timeSlots"]').forEach((c) => {
    c.checked = false;
    c.parentElement.classList.remove("selected");
  });
  updateSelectedTimeDisplay();
}

function getMaxHoursForFacility() {
  const f = document.getElementById("facility").value;
  console.log("hours : ",facilityData[f]);
  
  return facilityData[f]?.maxHours || 4;
}

function updateSelectedTimeDisplay() {
  const selected = Array.from(
    document.querySelectorAll('input[name="timeSlots"]:checked')
  )
    .map((cb) => cb.value)
    .sort();
  const txt = document.getElementById("selectedTimeText");
  const from = document.getElementById("hiddenFromTime");
  const to = document.getElementById("hiddenToTime");
  if (!selected.length) {
    txt.textContent = "No time slots selected";
    txt.className = "no-selection";
    from.value = to.value = "";
    return;
  }
  const start = selected[0];
  const end =
    String(parseInt(selected[selected.length - 1].split(":")[0]) + 1).padStart(
      2,
      "0"
    ) + ":00";
  const format = (t) => {
    const [h, m] = t.split(":");
    const n = parseInt(h);
    const ampm = n >= 12 ? "PM" : "AM";
    const disp = n > 12 ? n - 12 : n === 0 ? 12 : n;
    return `${disp}:${m} ${ampm}`;
  };
  txt.textContent = `${format(start)} - ${format(end)}`;
  txt.className = "time-selected";
  from.value = start;
  to.value = end;
}

function areSlotsContinuous(slots) {
  if (slots.length <= 1) return true;
  const hours = slots
    .map((s) => parseInt(s.split(":")[0]))
    .sort((a, b) => a - b);
  return hours.every((h, i) => i === 0 || h - hours[i - 1] === 1);
}

function handleTimeSlotChange(cb) {
  const max = getMaxHoursForFacility();
  if (cb.checked) {
    const count = document.querySelectorAll(
      'input[name="timeSlots"]:checked'
    ).length;
    if (count > max) {
      cb.checked = false;
      alert(`Max ${max} continuous slots allowed.`);
      return;
    }
  }
  const slots = Array.from(
    document.querySelectorAll('input[name="timeSlots"]:checked')
  ).map((s) => s.value);
  if (!areSlotsContinuous(slots)) {
    cb.checked = false;
    alert("Please select continuous time slots only.");
    return;
  }
  cb.parentElement.classList.toggle("selected", cb.checked);
  updateSelectedTimeDisplay();
}


function bookingRules() {
  const facility = document.getElementById("facility").value;
  return facilityData[facility]?.bookingRules || "";
}

function updateBookingCards(bookings) {
  const container = document.getElementById("bookingsGrid");
  container.innerHTML = ""; // Clear existing cards

  if (bookings.length === 0) {
    container.innerHTML = `
      <div class="no-bookings d-flex gap-3 justify-content-center align-items-center text-muted">
        <i class="bi bi-calendar fs-3"></i>
        <p>No bookings found</p>
      </div>`;
    return;
  }

  bookings.forEach(b => {
    const card = `
      <div class="booking-card ${b.status}">
        <div class="booking-card-header">
          <span class="booking-id">#${b._id.toString().slice(-6)}</span>
          <span class="status-badge status-${b.status}">${b.status}</span>
        </div>
        <div class="booking-details">
          <div class="booking-detail">
            <span class="detail-label">Facility:</span>
            <span class="detail-value">${b.name}</span>
          </div>
          <div class="booking-detail">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${b.Date}</span>
          </div>
          <div class="booking-detail">
            <span class="detail-label">Time:</span>
            <span class="detail-value">${b.from} - ${b.to}</span>
          </div>
          ${b.purpose ? `
            <div class="booking-detail">
              <span class="detail-label">Purpose:</span>
              <span class="detail-value">${b.purpose}</span>
            </div>` : ''}
        </div>
        <div class="booking-actions">
          <button class="action-btn view" data-id="${b._id}">
            <i class="bi bi-eye"></i> View Details
          </button>
          ${b.status === "Pending" ? `
            <button class="action-btn cancel" data-id="${b._id}">
              <i class="bi bi-x-circle"></i> Cancel
            </button>` : ''}
        </div>
      </div>`;
    container.insertAdjacentHTML("beforeend", card);
  });
}

function updateStats() {
  const pendingCount = allBookings.filter(b => b.status === 'Pending').length;
  const totalBookingsThisMonth = allBookings.length; 

  document.getElementById('pendingCount').textContent = pendingCount;
  document.getElementById('totalBookings').textContent = totalBookingsThisMonth;
}

async function refreshBookings() {
  if (isRefreshing) return;
  isRefreshing = true;

  const refreshBtn = document.getElementById('manualRefresh');
  const refreshStatus = document.getElementById('refreshStatus');
  
  refreshBtn?.classList.add('loading-indicator');
  refreshStatus.textContent = 'Refreshing...';
  refreshStatus.classList.add('show');

  try {
    const response = await fetch('/resident/api/bookings'); 
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }
    const data = await response.json();
    allBookings = data.bookings; 
    
    updateBookingCards(allBookings);
    updateStats();
    
    notyf.success('Bookings updated!');
  } catch (error) {
    console.error('Refresh error:', error);
    notyf.error('Could not refresh bookings.');
  } finally {
    isRefreshing = false;
    refreshBtn?.classList.remove('loading-indicator');
    setTimeout(() => {
      refreshStatus.classList.remove('show');
    }, 2000);
  }
}

function startAutoRefresh() {
  autoRefreshInterval = setInterval(refreshBookings, 30000); // Refresh every 30 seconds
}

function stopAutoRefresh() {
  clearInterval(autoRefreshInterval);
}

function showLoading(btn) {
  const txt = btn.innerHTML;
  btn.innerHTML = '<i class="bi bi-spinner bi-spin"></i> Loading...';
  btn.disabled = true;
  return txt;
}

function hideLoading(btn, txt) {
  btn.innerHTML = txt;
  btn.disabled = false;
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchFacilityData();
  const bookingGrid = document.querySelector(".bookings-grid");
  const bookingForm = document.getElementById("bookingForm");
  const showPopup = (id) =>
    (document.getElementById(id).style.display = "flex");
  const hidePopup = (id) =>
    (document.getElementById(id).style.display = "none");
  const updateText = (id, val) =>
    (document.getElementById(id).textContent = val || "-");
  const toggleSection = (id, s) =>
    (document.getElementById(id).style.display = s ? "block" : "none");

  document.getElementById("bookFacilityBtn")?.addEventListener("click", async (e) =>{ 
    const btn = e.currentTarget;
    const orig = showLoading(btn);
    try {
        const facilities = await fetchFacilityData();
        const facilitySelect = document.getElementById("facility");
        facilitySelect.innerHTML = '<option value="">Choose a facility...</option>';

        facilities.forEach(space => {
            const option = document.createElement('option');
            option.value = space.name;
            option.textContent = space.name;
            facilitySelect.appendChild(option);
        });

        openForm("booking");
    } catch (error) {
        notyf.error("Failed to load facilities. Please try again.");
    } finally {
        hideLoading(btn, orig);
        bookingForm.reset();
    }
    });
    
  document.getElementById('manualRefresh')?.addEventListener('click', refreshBookings);

  startAutoRefresh();
  window.addEventListener('beforeunload', stopAutoRefresh);

  document.querySelectorAll('input[name="timeSlots"]').forEach((cb) => {
    const fn = () => handleTimeSlotChange(cb);
    cb.addEventListener("change", fn);
    cb.nextElementSibling?.addEventListener("click", (e) => {
      e.preventDefault();
      cb.checked = !cb.checked;
      fn();
    });
  });

  document.getElementById("facility")?.addEventListener("change", () => {
    handleFacilityChange();
    document.getElementById('bookingRulesField').value = bookingRules();
  });

  bookingGrid?.addEventListener("click", async (e) => {
    const viewBtn = e.target.closest(".action-btn.view");
    const cancelBtn = e.target.closest(".action-btn.cancel");

    if (viewBtn) {
      e.preventDefault();
      const bookingId = viewBtn.dataset.id;
      const orig = showLoading(viewBtn);
      try {
        const res = await fetch(`/resident/commonSpace/${bookingId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });
        const { commonspace: b } = await res.json();

        updateText("detail-id", b._id ? b.ID : "-");
        document.getElementById(
          "detail-status"
        ).innerHTML = `<span class="status-badge status-${b.status || "unknown"
        }">${b.status || "Unknown"}</span>`;
        updateText("detail-facility", b.name);
        updateText("detail-date", b.Date || b.date);
        updateText("detail-time", `${b.from || "-"} - ${b.to || "-"}`);
        updateText(
          "detail-created",
          b.createdAt ? new Date(b.createdAt).toLocaleString() : "-"
        );
        updateText("detail-purpose", b.description || b.purpose);

        const isCancelled = !!(b.feedback || b.rating);
        const isPayment =
          b.status === "Pending Payment" || b.status === "Booked";

        toggleSection("cancellation-section", isCancelled);
        toggleSection("payment-section", isPayment);

        if (isCancelled) {
          updateText("detail-cancellation-reason", b.feedback);
          updateText("detail-cancelled-by", b.cancelledBy);
          updateText(
            "detail-cancelled-at",
            b.cancelledAt ? new Date(b.cancelledAt).toLocaleString() : "-"
          );
        }

        if (isPayment && b.payment) {
          const paymentSection = document.getElementById("payment-section");
          paymentSection.innerHTML = `
            <h4>Payment Details</h4>
            <div class="row">
              <div class="col">
                <div class="detail-item">
                  <span class="detail-label">Amount:</span> 
                  <span class="detail-value">${b.payment.amount || "-"}
                  </span>
                </div>
              </div>
              <div class="col">
                    <div class="detail-item">
                      <span class="detail-label">Status:</span> <span class="status-badge status-${b.payment.status
            }">${b.payment.status}</span>
                    </div>
              </div>
            </div>
            
          `;

          if (b.payment.status === "Pending") {
            paymentSection.insertAdjacentHTML(
              "beforeend",
              `<div class="detail-item"><span class="detail-label">Payment Deadline:</span> <span class="detail-value">${new Date(b.payment.paymentDeadline).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              }) || "-"
              }</span></div>
               `
            );
          } else if (b.payment.status === "Completed") {
            paymentSection.insertAdjacentHTML(
              "beforeend",
              `
              <div class="row">
                <div class="col" >
                  <div class="detail-item">
                    <span class="detail-label">Paid On:</span> 
                    <span class="detail-value">
                      ${new Date(b.payment.paymentDate).toLocaleString(
                "en-US",
                {
                  dateStyle: "medium",
                  timeStyle: "short",
                }
              )}
                    </span>
                  </div>
                  
                </div>
                <div class="col">
                  <div class="detail-item">
                    <span class="detail-label">Transaction ID:</span> 
                    <span class="detail-value">${b.payment._id}</span>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col">
                      <div class="detail-item">
                        <span class="detail-label">Method:</span> 
                        <span class="detail-value">${b.payment.paymentMethod || "-"
              }</span>
                      </div>
                </div>
              </div>
              
              `
            );
          }
        }

        showPopup("bookingDetailsPopup");
      } catch {
        notyf.error("Failed to load booking details");
      } finally {
        hideLoading(viewBtn, orig);
      }
    }

    if (cancelBtn) {
      e.preventDefault();
      const bookingId = cancelBtn.dataset.id;
      const card = cancelBtn.closest(".booking-card");
      const pendingNo = document.getElementById("pendingCount");
      const orig = showLoading(cancelBtn);

      if (!confirm("Are you sure you want to cancel this booking?")) {
        hideLoading(cancelBtn, orig);
        return;
      }

      try {
        const res = await fetch(`/resident/commonSpace/cancelled/${bookingId}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);

        notyf.success("Booking cancelled successfully");
        card.classList.add("cancelled");
        const badge = card.querySelector(".status-badge");
        if (badge) {
          badge.className = "status-badge status-cancelled";
          badge.textContent = "Cancelled";
        }
        if (pendingNo)
          pendingNo.textContent = Math.max(
            0,
            parseInt(pendingNo.textContent) - 1
          );
        cancelBtn.remove();
        
        setTimeout(refreshBookings, 1000); // Refresh after 1 second
      } catch {
        notyf.error("Failed to cancel booking");
      } finally {
        hideLoading(cancelBtn, orig);
      }
    }
  });

  document.querySelectorAll(".popup").forEach((p) =>
    p.addEventListener("click", (e) => {
      if (e.target === p) hidePopup(p.id);
    })
  );

  bookingForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const slots = Array.from(
      document.querySelectorAll('input[name="timeSlots"]:checked')
    );
    const f = document.getElementById("facility").value;
    const d = document.getElementById("bookingDate").value;
    const from = document.getElementById("hiddenFromTime").value;
    const to = document.getElementById("hiddenToTime").value;

    // Check if facility requires time slots
    const requiresTimeSlots = shouldShowTimeSlots(f);

    if (!f || !d) {
      return alert("Please complete all booking details.");
    }

    if (requiresTimeSlots) {
      if (!from || !to || !slots.length) {
        return alert("Please complete all booking details including time slots.");
      }
      if (slots.length > getMaxHoursForFacility()) {
        return alert("Exceeded max booking duration.");
      }
    }

    const btn = bookingForm.querySelector('button[type="submit"]');
    const orig = showLoading(btn);
    try {
      const res = await fetch("/resident/commonSpace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: requiresTimeSlots ? from : "00:00",
          to: requiresTimeSlots ? to : "23:59",
          facility: f,
          date: d ? d : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          purpose: document.getElementById("purpose").value,
          timeSlots: requiresTimeSlots ? slots.map((s) => s.value) : [],
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      notyf.success("Booking successful!");
      
      closeForm("booking");
      setTimeout(refreshBookings, 500); // Refresh after submission
    } catch (err) {
      notyf.error(err.message || "Booking failed.");
    } finally {
      hideLoading(btn, orig);
    }
  });
});