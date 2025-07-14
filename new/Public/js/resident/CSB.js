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

// Wait for DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
  // Open booking form
  document.getElementById("bookFacilityBtn")?.addEventListener("click", () => {
    openForm("booking");
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
          b.commonspace.Date || "-";
        document.getElementById("detail-time").textContent = `${
          b.commonspace.from || "-"
        } - ${b.commonspace.to || "-"}`;

        const createdAt = new Date(b.commonspace.createdAt);
        document.getElementById("detail-created").textContent =
          createdAt.toLocaleString();

        document.getElementById("detail-purpose").textContent =
          b.commonspace.description || "-";

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
        } else {
          document.getElementById("cancellation-section").style.display =
            "none";
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
});
