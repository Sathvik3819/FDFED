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

    document.getElementById("popupStatus").textContent =
      issueData.status || "-";
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

    // Show cancel button only if status is Pending
    const cancelBtn = document.getElementById("cancelBtn");
    cancelBtn.style.display = issueData.status === "Pending" ? "block" : "none";

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

  if (event.target === popup) {
    closePopup();
  }
};

document.addEventListener("DOMContentLoaded", function () {
  // Handle view buttons
  const viewButtons = document.querySelectorAll(".action-btn.view");
  viewButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const data = button.getAttribute("data-id");

      openIssuePopup(data); // Just open the overlay
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const table = document.querySelector("table");

  table.addEventListener("click", async function (event) {
    // Check if clicked element or its parent has the 'delete' class
    const deleteBtn = event.target.closest(".delete");

    if (deleteBtn) {
      const row = deleteBtn.closest("tr");
      const issueID = row.getAttribute("data-id");

      console.log("Deleting issue with ID:", issueID);

      if (confirm("Are you sure you want to delete this issue?")) {
        try {
          const response = await fetch(`/resident/deleteIssue/${issueID}`, {
            method: "DELETE",
          });

          const result = await response.json();

          if (response.ok) {
            alert("Issue deleted successfully!");
            row.remove(); // Remove the row from the table
          } else {
            alert(result.error || "Failed to delete issue.");
          }
        } catch (error) {
          console.error("Error deleting issue:", error);
          alert("Error deleting issue. Please try again.");
        }
      }
    }
  });

  const reviewBtn = document.querySelectorAll(".review-btn");
  const cancel = document.querySelector(".cancel-feedback");

  reviewBtn.forEach((button) => {
    button.addEventListener("click", function () {
      document.getElementById("feedbackCon").style.display = "flex";
      const issueId = button.getAttribute("data-id");
      document.getElementById("issueId").value = issueId;

      
    });
  });

  cancel.addEventListener("click", function () {
    document.getElementById("feedbackCon").style.display = "none";
  });
});
