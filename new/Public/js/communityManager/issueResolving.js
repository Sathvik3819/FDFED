document.addEventListener("DOMContentLoaded", function () {
  // Get all elements
  const assignTab = document.getElementById("assign-tab");
  const historyTab = document.getElementById("history-tab");
  const assignCard = document.getElementById("assign-card");
  const historyCard = document.getElementById("history-card");
  const historyTable = document.getElementById("history-table");
  const assignButtons = document.querySelectorAll(".assign-btn");
  const viewButtons = document.querySelectorAll(".view-btn");
  const issueIDField = document.getElementById("issueID");
  const issueAssignForm = document.getElementById("issueAssignForm");
  const close = document.querySelector(".close-btn");
  const popup = document.querySelector("#bookingDetailsPopup");

  // Tab switching functionality
  assignTab.addEventListener("click", function () {
    // Set active tab styling
    assignTab.classList.add("active");
    historyTab.classList.remove("active");

    // Show assign card and hide history card
    assignCard.style.display = "block";
    historyCard.style.display = "none";
  });

  close.addEventListener("click", () => {
    popup.style.display = "none";
  });

  historyTab.addEventListener("click", function () {
    // Set active tab styling
    historyTab.classList.add("active");
    assignTab.classList.remove("active");

    // Show history card and table, hide assign card
    historyCard.style.display = "block";
    historyTable.style.display = "table";
    assignCard.style.display = "none";
  });

  // Assign button functionality
  assignButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const data = button.getAttribute("data-id");
      console.log("Assign button clicked", data);
      issueIDField.value = data;
    });
  });

  // View button functionality
  viewButtons.forEach(async (button) => {
    button.addEventListener("click", async function () {
      const row = this.closest("tr");
      const issueID = row.querySelector("td:first-child").textContent;

      const response = await fetch(`/manager/issueResolving/${issueID}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const res = await response.json();

      if (res.success) {
        const issue = res.issue;
        console.log("Issue details:", issue);
        // Populate the popup with issue details
        document.getElementById("detail-id").innerText =
          issue[0].issueID || "-";
        document.getElementById("detail-status").innerText = issue[0].status || "-";
        document.getElementById("detail-facility").innerText =
          issue[0].title || "-";
        document.getElementById("detail-date").innerText =
          issue[0].resolvedAt || "-";
        document.getElementById("detail-time").innerText =
          issue[0].workerAssigned.name || "-";
        document.getElementById("detail-created").innerText =
          issue[0].description || "-";

        document.getElementById("detail-feedback").innerText =
          issue[0].feedback || "-";
        const rating = issue[0].rating || 0;
        const starHtml = "★".repeat(rating) + "☆".repeat(5 - rating);
        document.getElementById("detail-rating").innerText = starHtml;
      }

      popup.style.display = "flex";
    });
  });

  // Initialize with Assign Issues tab active
  assignTab.classList.add("active");
  assignCard.style.display = "block";
  historyCard.style.display = "none";
});
