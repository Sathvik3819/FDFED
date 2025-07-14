document.addEventListener("DOMContentLoaded", function () {
  // Tab switching functionality
  const tabs = document.querySelectorAll(".approval-tab");
  const tabContents = document.querySelectorAll(".table-container");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      this.classList.add("active");

      // Hide all tab contents
      tabContents.forEach((content) => content.classList.add("d-none"));
      // Show selected tab content
      const tabId = this.getAttribute("data-tab");
      document.getElementById(`tab-${tabId}`).classList.remove("d-none");
    });
  });

  document.getElementById("approveBtn").addEventListener("click", () => {
    console.log("btn clicked");

    handleVisitorAction("Approved");
  });

  document.getElementById("rejectBtn").addEventListener("click", () => {
    handleVisitorAction("Rejected");
  });

  async function handleVisitorAction(action) {
    const name = document.getElementById("popupName").textContent.trim();
    const contact = document.getElementById("popupContact").textContent.trim();
    const requestedBy = document
      .getElementById("popupRequested")
      .textContent.trim();
    const purpose = document.getElementById("popupPurpose").textContent.trim();
    const date = document.getElementById("popupDate").textContent.trim();
    const vehicleNumber = document.getElementById("popupVehicle").value.trim();
    const ID = document.getElementById("popupID").textContent.trim();
    const status = action;

    console.log("ID : ", ID);

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

    const res = await response.json();

    console.log("sent to backend");

    window.location.reload();
  }

  // Visitor row click handler
  const visitorRows = document.querySelectorAll(".visitor-row");
  const popup = document.getElementById("visitorPopup");

  visitorRows.forEach((row) => {
    row.addEventListener("click", function () {
      console.log(this.dataset);

      // Fill popup with visitor data
      console.log(this.dataset);
      document.getElementById("popupName").textContent = this.dataset.name;
      document.getElementById("popupContact").textContent =
        this.dataset.contact;
      document.getElementById("popupID").textContent = this.dataset.id;

      document.getElementById("popupRequested").textContent =
        this.dataset.requested;
      document.getElementById("popupPurpose").textContent =
        this.dataset.purpose;
      document.getElementById("popupDate").textContent = this.dataset.date;
      document.getElementById("popupVehicle").textContent =
        this.dataset.vehicle || "N/A";

      // Show popup
      popup.style.display = "flex";
    });
  });
});

function closePopup() {
  document.getElementById("visitorPopup").style.display = "none";
}
