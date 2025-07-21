document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".visitor-tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));

      // Add active class to clicked tab
      this.classList.add("active");

      // Hide all containers
      document
        .querySelectorAll(".visitor-cards-container")
        .forEach((container) => {
          container.classList.remove("active");
        });

      // Show the selected container
      const tabName = this.getAttribute("data-tab");
      document.getElementById(`${tabName}-visitors`).classList.add("active");
    });
  });

  const actionButtons = document.querySelectorAll(".check-btn");

  actionButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const visitorId = this.getAttribute("data-id");
      const action = this.getAttribute("data-action");

      console.log("Visitor ID:", visitorId, "Action:", action);

      fetch(`/security/visitorManagement/${action}/${visitorId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert("Status updated successfully!");
            location.reload();
          } else {
            alert("Failed to update status.");
          }
        })
        .catch((err) => {
          console.error("Error:", err);
          alert("An error occurred while updating status.");
        });
    });
  });
});

// Search functionality
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.querySelector(".search-input");
  const searchButton = document.querySelector(".filter-btn");

  // Function to perform search
  function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    // Get all visitor cards from all containers
    const allVisitorCards = document.querySelectorAll(
      ".visitor-cards-container.active .visitor-card"
    );

    if (searchTerm === "") {
      // If search is empty, show all cards
      allVisitorCards.forEach((card) => {
        card.style.display = "block";
      });
      return;
    }

    // Filter cards based on search term
    allVisitorCards.forEach((card) => {
      const name = card
        .querySelector(".visitor-name")
        .textContent.toLowerCase();
      const purpose = card
        .querySelector(".detail-row:nth-child(1) .detail-value")
        .textContent.toLowerCase();
      const date = card
        .querySelector(".detail-row:nth-child(2) .detail-value")
        .textContent.toLowerCase();
      const status = card
        .querySelector(".visitor-status")
        .textContent.toLowerCase();

      if (
        name.includes(searchTerm) ||
        purpose.includes(searchTerm) ||
        date.includes(searchTerm) ||
        status.includes(searchTerm)
      ) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });

    // Check if any cards are visible in the current tab
    const currentContainer = document.querySelector(
      ".visitor-cards-container.active"
    );
    const visibleCards = currentContainer.querySelectorAll(
      '.visitor-card[style="display: block"]'
    );

    // Show empty state if no cards match the search
    const emptyState = currentContainer.querySelector(".empty-state");
    if (visibleCards.length === 0) {
      if (!emptyState) {
        const emptyStateHTML = `
                    <div class="empty-state">
                        <i class="bi bi-search"></i>
                        <h3>No Matching Visitors Found</h3>
                        <p>No visitors match your search criteria</p>
                    </div>
                `;
        currentContainer.insertAdjacentHTML("beforeend", emptyStateHTML);
      }
    } else if (emptyState) {
      emptyState.remove();
    }
  }

  // Event listeners for search
  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
      performSearch();
    }
  });

  // Tab switching functionality (updated to include search reset)
  const tabs = document.querySelectorAll(".visitor-tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));

      // Add active class to clicked tab
      this.classList.add("active");

      // Hide all containers
      document
        .querySelectorAll(".visitor-cards-container")
        .forEach((container) => {
          container.classList.remove("active");
        });

      // Show the selected container
      const tabName = this.getAttribute("data-tab");
      document.getElementById(`${tabName}-visitors`).classList.add("active");

      // Reset search when switching tabs
      searchInput.value = "";
      performSearch();
    });
  });
});
