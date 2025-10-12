document.addEventListener("DOMContentLoaded", function () {
  // Tab switching functionality
  const tabs = document.querySelectorAll(".approval-tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      this.classList.add("active");

      // Hide all tab contents
      document
        .querySelectorAll("#tab-requests, #tab-approved, #tab-rejected")
        .forEach((content) => {
          content.classList.add("d-none");
        });

      // Show selected tab content
      const tabId = this.getAttribute("data-tab");
      document.getElementById(`tab-${tabId}`).classList.remove("d-none");
    });
  });

  // Handle approve/reject buttons in the popup
  document.getElementById("approveBtn")?.addEventListener("click", () => {
    handleVisitorAction("Approved");
  });

  document.getElementById("rejectBtn")?.addEventListener("click", () => {
    handleVisitorAction("Rejected");
  });

  async function handleVisitorAction(action) {
    const name = document.getElementById("popupName").textContent.trim();
    const contact = document.getElementById("popupContact").textContent.trim();
    const requestedBy = document.getElementById("popupRequested").textContent.trim();
    const purpose = document.getElementById("popupPurpose").textContent.trim();
    const date = document.getElementById("popupDate").textContent.trim();
    const vehicleNumber = document.getElementById("popupVehicle").value.trim();
    const ID = document.getElementById("popupID").textContent.trim();
    const status = action;

    try {
      const response = await fetch("/security/preApproval/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          contact,
          requestedBy,
          purpose,
          date,
          vehicleNumber,
          ID,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const res = await response.json();
      console.log("Response from server:", res);

      // Close popup and refresh the page
      closePopup();
     
    } catch (error) {
      console.error("Error:", error);
      alert(
        "An error occurred while processing your request. Please try again."
      );
    }
  }

  // Card click handlers for pending requests
  document.querySelectorAll("#tab-requests .visitor-card").forEach((card) => {
    const approveBtn = card.querySelector(".action-btn.approve");
    const rejectBtn = card.querySelector(".action-btn.reject");

    // Handle approve button click
    approveBtn?.addEventListener("click", function (e) {
      e.stopPropagation();
      showVisitorPopup(card);
    });

    // Handle reject button click
    rejectBtn?.addEventListener("click", function (e) {
      e.stopPropagation();
      showVisitorPopup(card);
    });

    // Handle card click (if you want the whole card to be clickable)
    card?.addEventListener("click", function () {
      showVisitorPopup(card);
    });
  });

  function showVisitorPopup(card) {
    const popup = document.getElementById("visitorPopup");

    // Fill popup with visitor data from card dataset
    document.getElementById("popupName").textContent = card.dataset.name;
    document.getElementById("popupContact").textContent = card.dataset.contact;
    document.getElementById("popupRequested").textContent =
      card.dataset.requested;
    document.getElementById("popupPurpose").textContent = card.dataset.purpose;
    document.getElementById(
      "popupDate"
    ).textContent = `${card.dataset.date}, ${card.dataset.time}`;
    document.getElementById("popupID").textContent = card.dataset.id;
    document.getElementById("popupVehicle").value = card.dataset.vehicle || "";

    // Show popup
    popup.style.display = "flex";
  }

function closePopup() {
  document.getElementById("visitorPopup").style.display = "none";
}
});


console.log(Html5QrcodeScanner)