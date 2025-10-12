document.addEventListener("DOMContentLoaded", () => {
  // Tab functionality
  const assignTab = document.getElementById("assign-tab");
  const historyTab = document.getElementById("history-tab");
  const assignCard = document.getElementById("assign-card");
  const historyCard = document.getElementById("history-card");

  assignTab.addEventListener("click", () => {
    assignTab.classList.add("active");
    historyTab.classList.remove("active");
    assignCard.style.display = "block";
    historyCard.style.display = "none";
  });

  historyTab.addEventListener("click", () => {
    historyTab.classList.add("active");
    assignTab.classList.remove("active");
    assignCard.style.display = "none";
    historyCard.style.display = "block";
  });

  // Assign Issue Form Population
  const assignButtons = document.querySelectorAll(".assign-btn");
  const issueIDInput = document.getElementById("issueID");
  const id = document.getElementById("idIssue");

  const assignPopup = document.getElementById("assignPopup");

  document.getElementById("cancelAssign").addEventListener("click", () => {
    console.log("Cancel button clicked");
    
    closeForm("assign");
  });

  assignButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const Id = button.getAttribute("data-id");
      const issueCard = event.target.closest(".issue-card");

      if (issueCard) {
        const displayedIssueID = issueCard
          .querySelector(".issue-card-id")
          .textContent.replace("Issue ID: ", "");
        issueIDInput.value = displayedIssueID;
        id.value = Id;

        // Show popup
        assignPopup.style.display = "flex";
      }
    });
  });

  // Close popup function
  window.closeForm = (type) => {
    if (type === "details") {
      bookingDetailsPopup.style.display = "none";
    } else if (type === "assign") {
      assignPopup.style.display = "none";
    }
  };

  // Close if user clicks outside popup
  assignPopup.addEventListener("click", (event) => {
    if (event.target === assignPopup) {
      closeForm("assign");
    }
  });

  document.getElementById("close-btn").addEventListener("click", () => {
    closeForm("details");
  });

  // Issue Details Popup functionality
  const bookingDetailsPopup = document.getElementById("bookingDetailsPopup");
  const viewDetailButtons = document.querySelectorAll(".view-btn");

  viewDetailButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
  const issueMongoId = event.target.dataset.id;

  try {
    const response = await fetch(`/manager/issueResolving/${issueMongoId}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const issue = await response.json();
    const issueData = issue.issue;

    const progressLine = document.querySelector(".progress-indicator");
    const steps = document.querySelectorAll(".step");
    const status = issueData.status;

    // Reset progress line and steps
    progressLine.style.width = "0%";
    steps.forEach((step) => {
      step.querySelector(".step-icon").classList.remove("step-icon-completed");
    }
    );
    // Update progress line and steps based on status
    if (status === "Pending") {
      progressLine.style.width = "0%";
      steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
    } else if (status === "In Progress") {
      progressLine.style.width = "28%";
      steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[1].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[2].querySelector(".step-icon").classList.add("step-icon-completed");
    }else if (status === "Assigned") {
      progressLine.style.width = "14%";
      steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[1].querySelector(".step-icon").classList.add("step-icon-completed");
    }else if (status === "Review Pending") {
      progressLine.style.width = "56%";
      steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[1].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[2].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[3].querySelector(".step-icon").classList.add("step-icon-completed");
    }else if (status === "Payment Pending") {
      progressLine.style.width = "84%";
      steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[1].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[2].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[3].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[4].querySelector(".step-icon").classList.add("step-icon-completed");
    }else if (status === "Resolved") {
      progressLine.style.width = "100%";
      steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[1].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[2].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[3].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[4].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[5].querySelector(".step-icon").classList.add("step-icon-completed");
    }

    console.log(issueData);
    

    document.getElementById("popupTrackingId").textContent =
      issueData.issueID || "-";
    document.getElementById("popupTitle").textContent = issueData.title || "-";

    const popupStatusElement = document.getElementById("popupStatus");
    popupStatusElement.textContent = issueData.status || "-";
    popupStatusElement.className = `status-badge status-${issueData?.status?.replace(
      /\s/g,
      ""
    )}`; 

    if (issueData.status === "Review Pending") {
      popupStatusElement.classList.add("review");
    } else if (issueData.status === "Payment Pending") {
      popupStatusElement.classList.add("paymentPending");
    }

    if (issueData.status === "Resolved") {
      document
    }

    document.getElementById("popupDescription").textContent =
      issueData.description || "-";
    document.getElementById("popupDate").textContent =
      new Date(issueData.createdAt).toLocaleDateString() || "-";
    document.getElementById("popupDeadline").textContent =
      issueData.deadline
        ? new Date(issueData.deadline).toLocaleDateString()
        : "-";
    

    // Worker section
    const worker = issueData.workerAssigned;
    const workerSection = document.getElementById("workerDetails");

    if (worker && worker.name) {
      workerSection.style.display = "grid";
      document.getElementById("popupWorkerName").textContent =
        worker.name || "-";
      document.getElementById("popupWorkerContact").textContent =
        worker.contact || "-";
      document.getElementById("popupWorkerSpecialization").textContent =
        worker.jobRole || "-";
    } else {
      workerSection.style.display = "none";
    }

    // Payment section
    const paymentDetailsSection = document.querySelector(".payment-details");
    if (issueData.payment ) {
      // Assuming these fields indicate payment details exist
      paymentDetailsSection.style.display = "grid";
      document.getElementById("popupAmount").textContent = issueData.payment.amount
        ? `₹${issueData.payment.amount}`
        : "-";
      const popupPaymentStatusElement =
        document.getElementById("popupPaymentStatus");
      popupPaymentStatusElement.textContent = issueData.payment.status || "-";
      popupPaymentStatusElement.className = `status-badge status-${issueData.payment?.status?.replace(
        /\s/g,
        ""
      )}`;
    } else {
      paymentDetailsSection.style.display = "none";
    }

    const feedbackDetailsSection = document.querySelector(".feedback-details");
    if (issueData.feedback && issueData.rating) {
      feedbackDetailsSection.style.display = "grid";
      // Display stars based on rating
      const starsContainer = document.getElementById("popupRating");
      starsContainer.innerHTML = "";
      const rating = issueData.rating;
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement("i");
        star.className = i <= rating ? "bi bi-star-fill" : "bi bi-star";
        starsContainer.appendChild(star);
      }
      document.getElementById("popupComments").textContent =
        issueData.feedback || "-";
    } else {
      feedbackDetailsSection.style.display = "none";
    }

    // Show cancel button only if status is Pending
    const cancelBtn = document.getElementById("cancelBtn");
    cancelBtn.style.display = issueData.status === "Pending" ? "block" : "none";
    // Set the issue ID for cancellation
    cancelBtn.setAttribute("data-id", issueData._id);

    // Show popup
    document.getElementById("bookingDetailsPopup").style.display = "flex";
  } catch (error) {
    console.error("Error fetching issue:", error);
    alert("An error occurred while fetching issue details.");
  }
});

  });

  // Function to close the popup
  window.closeForm = (type) => {
    if (type === "details") {
      bookingDetailsPopup.style.display = "none";
    }else if (type === "assign") {
      assignPopup.style.display = "none";
    }
  };

  // Close popup if clicked outside content
  bookingDetailsPopup.addEventListener("click", (event) => {
    if (event.target === bookingDetailsPopup) {
      closeForm("details");
    }
  });
});
