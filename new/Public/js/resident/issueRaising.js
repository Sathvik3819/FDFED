
const notyf = new Notyf({
  duration: 3000,
  position: { x: "center", y: "top" },
  dismissible: true,
});


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
      progressLine.style.width = "42%";
      steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[1].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[2].querySelector(".step-icon").classList.add("step-icon-completed");
      steps[3].querySelector(".step-icon").classList.add("step-icon-completed");
    }

    document.getElementById("popupTrackingId").textContent =
      issueData.issueID || "-";
    document.getElementById("popupTitle").textContent = issueData.title || "-";

    const popupStatusElement = document.getElementById("popupStatus");
    popupStatusElement.textContent = issueData.status || "-";
    popupStatusElement.className = `status-badge status-${issueData.status.replace(
      /\s/g,
      ""
    )}`; 

    if (issueData.status === "Review Pending") {
      popupStatusElement.classList.add("review");
    } else if (issueData.status === "Payment Pending") {
      popupStatusElement.classList.add("paymentPending");
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
      document.getElementById("popupAmount").textContent = issueData.amount
        ? `₹${issueData.payment.amount}`
        : "-";
      const popupPaymentStatusElement =
        document.getElementById("popupPaymentStatus");
      popupPaymentStatusElement.textContent = issueData.payment.status || "-";
      popupPaymentStatusElement.className = `status-badge status-${issueData.payment.status.replace(
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
  const issueForm = document.getElementById("issueForm");

  issueForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(issueForm);
    const formObject = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/resident/issueRaising", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formObject),
      });

      const result = await response.json();
      const issue = result.issue;

      if (response.ok) {
        const newdiv = document.createElement("div");
        newdiv.className = "issue-card";
        newdiv.setAttribute("data-id", result.issue._id);
        newdiv.innerHTML = `
          
                            <div class="issue-card-header">
                                <h5>${issue.title}</h5>
                                <span class="status-badge status-${issue.status.replace(/\s/g, "")} 
                                    ">
                                    ${issue.status}
                                </span>
                            </div>
                            <div class="issue-card-body">
                                <p><strong>Tracking ID:</strong> ${issue.issueID}</p>
                                <p><strong>Category:</strong> ${issue.title}</p>
                                <p><strong>Worker Assigned:</strong> ${issue.workerAssigned}</p>
                            </div>
                            <div class="issue-card-actions">

                                <button class="action-btn delete" data-id="${issue._id}" fdprocessedid="ixqtl5">
                                    <i class="bi bi-trash"></i>Cancel
                                </button>
                                
                            </div>
                        
        `
        document.getElementsByClassName("issues-grid")[0].appendChild(newdiv);
        notyf.success("Issue raised successfully!");
        closeForm("issue");
        issueForm.reset();
      } else {
        notyf.error(result.message);
      }
    } catch (error) {
      console.error("Error raising issue:", error);
      notyf.error("An error occurred while raising the issue.");
    }
  });

  document.getElementById("feedbackForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const formObject = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/resident/submitFeedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formObject),
      });
      const result = await response.json();

      if (result.success) {
        const button = document.querySelector(`.issue-card[data-id="${formObject.id}"] .action-btn.review-btn`);
        const card = document.querySelector(`.issue-card[data-id="${formObject.id}"] .status-badge`);

        if (card) {
          card.textContent = "Payment Pending";
          card.className = `status-badge status-Payment Pending paymentPending`;
        }

        
        if (button) {
          button.classList.remove("review-btn");
          button.classList.add("pay-btn");
          button.innerHTML = 'Pay';
        }
        notyf.success("Feedback submitted successfully!");
        closeFeedbackForm();
        this.reset();
      } else {
        notyf.error(result.message || "Failed to submit feedback.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      notyf.error("An error occurred while submitting feedback.");
    }

  })

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
            method: "POST",
          });

          const result = await response.json();

          if (result.success) {
            notyf.success("Issue cancelled successfully!");
            issueCard.remove();
          } else {
            notyf.error(result.error || "Failed to cancel issue.");
          }
        } catch (error) {
          console.error("Error cancelling issue:", error);
          notyf.error("Error cancelling issue. Please try again.");
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
     
      window.location.href = `/resident/payments`;
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
