// Open the raise issue form popup
function openForm(formType) {
  if (formType === "issue") {
    document.getElementById("issueFormPopup").style.display = "flex";
  }
}

// Close the raise issue form popup
function closeForm(formType) {
  if (formType === "issue") {
    document.getElementById("issueFormPopup").style.display = "none";
  }
}

async function openIssuePopup(data) {
  try {
    const response = await fetch(`/resident/getIssueData/${data}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const issueData = await response.json();

    if (!response.ok) {
      console.error("Failed to fetch issue data:", issueData);
      return;
    }

    // Update the popup content
    document.getElementById("popupTrackingId").textContent =
      issueData.issueID || "-";
    document.getElementById("popupTitle").textContent = issueData.title || "-";

    // Update status badge color dynamically
    const popupStatusElement = document.getElementById("popupStatus");
    popupStatusElement.textContent = issueData.status || "-";
    popupStatusElement.className = `status-badge status-${issueData.status.replace(
      /\s/g,
      ""
    )}`; // Remove spaces for class name

    if (issueData.status === "Review Pending") {
      popupStatusElement.classList.add("review");
    } else if (issueData.status === "Payment Pending") {
      popupStatusElement.classList.add("paymentPending");
    }

    document.getElementById("popupCategory").textContent =
      issueData.category || "-"; // Added category to popup
    document.getElementById("popupDescription").textContent =
      issueData.description || "-";
    document.getElementById("popupDate").textContent =
      new Date(issueData.createdAt).toLocaleDateString() || "-";

    // Worker section
    const worker = issueData.workerAssigned;
    const workerSection = document.getElementById("workerDetails");

    if (worker && worker.name) {
      workerSection.style.display = "block";
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
    if (issueData.amount || issueData.paymentStatus) {
      // Assuming these fields indicate payment details exist
      paymentDetailsSection.style.display = "block";
      document.getElementById("popupAmount").textContent = issueData.amount
        ? `₹${issueData.amount}`
        : "-";
      const popupPaymentStatusElement =
        document.getElementById("popupPaymentStatus");
      popupPaymentStatusElement.textContent = issueData.paymentStatus || "-";
      popupPaymentStatusElement.className = `status-badge status-${issueData.paymentStatus.replace(
        /\s/g,
        ""
      )}`;
    } else {
      paymentDetailsSection.style.display = "none";
    }

    // Show cancel button only if status is Pending
    const cancelBtn = document.getElementById("cancelBtn");
    cancelBtn.style.display = issueData.status === "Pending" ? "block" : "none";
    // Set the issue ID for cancellation
    cancelBtn.setAttribute("data-id", issueData._id);

    // Show popup
    document.getElementById("issuePopup").style.display = "flex";
  } catch (error) {
    console.error("Error fetching issue:", error);
    alert("An error occurred while fetching issue details.");
  }
}

function closePopup() {
  document.getElementById("issuePopup").style.display = "none";
}

// Close popup if user clicks outside the popup content
window.onclick = function (event) {
  const popup = document.getElementById("issuePopup");
  const issueFormPopup = document.getElementById("issueFormPopup");
  const feedbackCon = document.getElementById("feedbackCon");

  if (event.target === popup) {
    closePopup();
  }
  if (event.target === issueFormPopup) {
    closeForm("issue");
  }
  if (event.target === feedbackCon) {
    closeFeedbackForm();
  }
};

function closeFeedbackForm() {
  document.getElementById("feedbackCon").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
  const issuesGrid = document.querySelector(".issues-grid");
  const cancelFeedbackBtn = document.querySelector(".cancel-feedback");
  const cancelIssueBtnPopup = document.getElementById("cancelBtn"); // For the cancel button inside the popup

  // Event delegation for action buttons in issue cards
  issuesGrid.addEventListener("click", async function (event) {
    const issueCard = event.target.closest(".issue-card");
    if (!issueCard) return; // Click was not inside an issue card

    const issueID = issueCard.getAttribute("data-id");

    // Handle delete button click
    const deleteBtn = event.target.closest(".action-btn.delete");
    if (deleteBtn) {
      console.log("Attempting to delete issue with ID:", issueID);
      if (confirm("Are you sure you want to cancel this issue?")) {
        try {
          const response = await fetch(`/resident/deleteIssue/${issueID}`, {
            method: "DELETE",
          });

          const result = await response.json();

          if (response.ok) {
            alert("Issue cancelled successfully!");
            issueCard.remove(); // Remove the card from the grid
          } else {
            alert(result.error || "Failed to cancel issue.");
          }
        } catch (error) {
          console.error("Error cancelling issue:", error);
          alert("Error cancelling issue. Please try again.");
        }
      }
    }

    // Handle view button click
    const viewBtn = event.target.closest(".action-btn.view");
    if (viewBtn) {
      openIssuePopup(issueID);
    }

    // Handle review button click
    const reviewBtn = event.target.closest(".action-btn.review-btn");
    if (reviewBtn) {
      document.getElementById("feedbackCon").style.display = "flex";
      document.getElementById("issueId").value = issueID;
    }

    // Handle pay button click (Assuming this redirects or opens a payment modal)
    const payBtn = event.target.closest(".action-btn.pay-btn");
    if (payBtn) {
      // For now, let's just log the ID. In a real app, you'd trigger a payment flow.
      alert(`Initiating payment for Issue ID: ${issueID}`);
      // Example: window.location.href = `/resident/makePayment/${issueID}`;
    }
  });

  // Handle cancel button in the feedback form
  cancelFeedbackBtn.addEventListener("click", function () {
    closeFeedbackForm();
  });

  // Handle cancel button inside the issue details popup
  cancelIssueBtnPopup.addEventListener("click", async function () {
    const issueID = cancelIssueBtnPopup.getAttribute("data-id");
    if (confirm("Are you sure you want to cancel this issue?")) {
      try {
        const response = await fetch(`/resident/deleteIssue/${issueID}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (response.ok) {
          alert("Issue cancelled successfully!");
          // Find and remove the corresponding card from the grid
          const cancelledCard = document.querySelector(
            `.issue-card[data-id="${issueID}"]`
          );
          if (cancelledCard) {
            cancelledCard.remove();
          }
          closePopup(); // Close the issue details popup
        } else {
          alert(result.error || "Failed to cancel issue.");
        }
      } catch (error) {
        console.error("Error cancelling issue:", error);
        alert("Error cancelling issue. Please try again.");
      }
    }
  });

  
});
