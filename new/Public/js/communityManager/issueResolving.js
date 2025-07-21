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
      }
    });
  });

  // Issue Details Popup functionality
  const bookingDetailsPopup = document.getElementById("bookingDetailsPopup");
  const viewDetailButtons = document.querySelectorAll(".view-btn");

  viewDetailButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const issueMongoId = event.target.dataset.id;

      try {
        const response = await fetch(
          `/manager/issueResolving/${issueMongoId}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const i = await response.json();
        const issue = i.issue
        

        // Set Issue ID
        document.getElementById("detail-id").textContent = issue.issueID || "-";

        // Set Status and class
        const statusElement = document.getElementById("detail-status");
        if (issue.status) {
          statusElement.textContent = issue.status;
          statusElement.className = `detail-value status-${issue.status.replace(
            /\s+/g,
            "-"
          )}`;
        } else {
          statusElement.textContent = "-";
          statusElement.className = "detail-value";
        }

        // Other fields
        document.getElementById("detail-facility").textContent =
          issue.title || "-";
        document.getElementById("detail-date").textContent = issue.resolvedAt
          ? new Date(issue.resolvedAt).toLocaleDateString()
          : "-";
        document.getElementById("detail-time").textContent =
          issue.workerAssigned?.name || "-";
        document.getElementById("detail-created").textContent =
          issue.description || "-";

        // Handle feedback and rating
        const ratingContainer = document.getElementById("detail-rating");
        const feedbackText = document.getElementById("detail-feedback");

        if (issue.feedback?.rating) {
          ratingContainer.innerHTML = "";
          const rating = issue.feedback.rating;

          for (let i = 0; i < 5; i++) {
            const starIcon = document.createElement("i");
            starIcon.classList.add(
              "bi",
              i < rating ? "bi-star-fill" : "bi-star"
            );
            ratingContainer.appendChild(starIcon);
          }

          feedbackText.textContent =
            issue.feedback.comment || "No feedback comment provided.";
        } else {
          ratingContainer.innerHTML =
            '<span class="text-muted">No rating provided</span>';
          feedbackText.textContent = "No feedback available.";
        }

        // Show the popup
        bookingDetailsPopup.style.display = "flex";
      } catch (error) {
        console.error("Error fetching issue details:", error);
        alert("Failed to load issue details. Please try again.");
      }
    });
  });

  // Function to close the popup
  window.closeForm = (type) => {
    if (type === "details") {
      bookingDetailsPopup.style.display = "none";
    }
  };

  // Close popup if clicked outside content
  bookingDetailsPopup.addEventListener("click", (event) => {
    if (event.target === bookingDetailsPopup) {
      closeForm("details");
    }
  });
});
