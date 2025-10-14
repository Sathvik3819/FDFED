function openForm(type) {
  document.getElementById(type + "Popup").style.display = "flex";
}


function closeForm(type) {
  if (type === "details") {
    document.getElementById("bookingDetailsPopup").style.display = "none";
  } else {
    document.getElementById(type + "Popup").style.display = "none";
  }
}



document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".visitor-tab");

  document.getElementById("visitorForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    console.log("clicked");


    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch("/security/addVisitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        alert("Visitor added successfully!");
        document.getElementById("visitorForm").reset();
        closeForm('visitor');

        // Trigger immediate refresh to show the new visitor
        await refreshVisitorData(false);

      } else {
        alert("Failed to add visitor.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while adding visitor.");
    }
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      
      tabs.forEach((t) => t.classList.remove("active"));

      
      this.classList.add("active");

      
      document
        .querySelectorAll(".visitor-cards-container")
        .forEach((container) => {
          container.classList.remove("active");
        });

      
      const tabName = this.getAttribute("data-tab");
      let containerId;
      if (tabName === "all") {
        containerId = "all-visitors";
      } else if (tabName === "active") {
        containerId = "active-visitors";
      } else if (tabName === "checked-out") {
        containerId = "checked-out-visitors";
      }
      document.getElementById(containerId).classList.add("active");
    });
  });

  const add = document.querySelectorAll(".add-visitor-section");

  add[0].addEventListener("click", () => {
    openForm('visitor');
  })

  const actionButtons = document.querySelectorAll(".check-btn");
  console.log(actionButtons);


  // ✅ Attach one global listener using event delegation
  document.addEventListener("click", async function (e) {
    // Check if the clicked element OR its parent has the 'check-btn' class
    const button = e.target.closest(".check-btn");
    if (!button) return; // Not a check button, ignore

    const visitorId = button.getAttribute("data-id");
    const action = button.getAttribute("data-action");

    console.log("Visitor ID:", visitorId, "Action:", action);

    try {
      const response = await fetch(`/security/visitorManagement/${action}/${visitorId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!result.success) {
        alert("Failed to update status.");
        return;
      }

      alert("Status updated successfully!");

      // Trigger immediate refresh to show updated visitor data
      await refreshVisitorData(false);
    } catch (err) {
      console.error("Error while updating visitor:", err);
    }
  });

});

// Auto-refresh functionality
let refreshInterval;

function startAutoRefresh() {
  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Set up new interval for every 10 seconds
  refreshInterval = setInterval(async () => {
    try {
      await refreshVisitorData(false); // false = no loading state for auto-refresh
    } catch (error) {
      console.error("Error during auto-refresh:", error);
    }
  }, 30000); // 10 seconds
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

async function refreshVisitorData(showLoading = false) {
  const refreshBtn = document.getElementById("refreshBtn");

  if (showLoading && refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refreshing...';
  }

  try {
    const response = await fetch("/security/visitorManagement/api/visitors", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch visitor data");
    }

    const result = await response.json();

    if (result.success) {
      updateVisitorCounters(result.stats);
      updateVisitorCards(result.visitors);

      if (showLoading && refreshBtn) {
        // Reset button to normal state
        refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
        refreshBtn.disabled = false;
      }
    }
  } catch (error) {
    console.error("Error refreshing visitor data:", error);

    if (showLoading && refreshBtn) {
      // Reset button to normal state
      refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
      refreshBtn.disabled = false;
    }
  }
}

function updateVisitorCounters(stats) {
  // Update counter elements
  const totalCount = document.getElementById("totalvisitorlength");
  const activeCount = document.getElementById("activevisitorlength");
  const checkedOutCount = document.getElementById("checkedoutvisitorlength");

  if (totalCount) totalCount.textContent = stats.total;
  if (activeCount) activeCount.textContent = stats.active;
  if (checkedOutCount) checkedOutCount.textContent = stats.checkedOut;
}

function updateVisitorCards(visitors) {
  // Get all visitor containers
  const allContainer = document.getElementById("all-visitors");
  const activeContainer = document.getElementById("active-visitors");
  const checkedOutContainer = document.getElementById("checked-out-visitors");

  // Clear existing cards (except empty states)
  [allContainer, activeContainer, checkedOutContainer].forEach(container => {
    if (container) {
      const existingCards = container.querySelectorAll(".visitor-card");
      existingCards.forEach(card => card.remove());
    }
  });

  // Generate and add new cards
  visitors.forEach(visitor => {
    const cardHTML = generateVisitorCardHTML(visitor);
    const cardElement = document.createElement("div");
    cardElement.className = `visitor-card ${visitor.status}`;
    cardElement.setAttribute("data-id", visitor._id);
    cardElement.innerHTML = cardHTML;

    // Add to appropriate containers
    if (allContainer) allContainer.appendChild(cardElement.cloneNode(true));

    if (visitor.status === "Active" && activeContainer) {
      activeContainer.appendChild(cardElement.cloneNode(true));
    } else if (visitor.status === "CheckedOut" && checkedOutContainer) {
      checkedOutContainer.appendChild(cardElement.cloneNode(true));
    }
  });

  // Show empty states if no visitors in specific containers
  showEmptyStatesIfNeeded();
}

function generateVisitorCardHTML(visitor) {
  const entryDate = visitor.checkInAt
    ? new Date(visitor.checkInAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '-';

  const exitDate = visitor.checkOutAt
    ? new Date(visitor.checkOutAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '-';

  const entryTypeHTML = visitor.verifiedByResident
    ? `<i class="bi bi-patch-check"></i> Pre-Approved ${visitor.approvedBy ? `<span class="approver">(by ${visitor.approvedBy})</span>` : ''}`
    : `<i class="bi bi-door-open"></i> Direct Entry`;

  const actionButtons = getActionButtonsHTML(visitor);

  return `
    <div class="visitor-header">
      <div class="visitor-name">${visitor.name}</div>
      <div class="visitor-status status-${visitor.status}">
        ${visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}
      </div>
    </div>

    <div class="visitor-details">
      <div class="detail-row">
        <div class="detail-label">Entry Type:</div>
        <div class="detail-value">
          <span class="entry-type-value">
            ${entryTypeHTML}
          </span>
        </div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Purpose:</div>
        <div class="detail-value">${visitor.purpose}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Entry Date:</div>
        <div class="detail-value">${entryDate}</div>
      </div>
      ${visitor.checkOutAt ? `
      <div class="detail-row">
        <div class="detail-label">Exit Date:</div>
        <div class="detail-value">${exitDate}</div>
      </div>
      ` : ''}
    </div>

    <div class="visitor-actions">
      ${actionButtons}
    </div>
  `;
}

function getActionButtonsHTML(visitor) {
  if (visitor.status === "Active") {
    return `
      <button class="btn btn-secondary check-btn" data-id="${visitor._id}" data-action="checked-out">
        <i class="bi bi-box-arrow-right"></i> Check Out
      </button>
    `;
  } else if (visitor.status === "Pending") {
    return `
      <button class="btn btn-primary check-btn" data-id="${visitor._id}" data-action="checked-in">
        <i class="bi bi-box-arrow-in-right"></i> Check In
      </button>
    `;
  }
  return '';
}

function showEmptyStatesIfNeeded() {
  const containers = [
    { id: "all-visitors", message: "No Visitors Found", subMessage: "Add new visitors to see them listed here" },
    { id: "active-visitors", message: "No Active Visitors", subMessage: "There are currently no active visitors" },
    { id: "checked-out-visitors", message: "No Checked Out Visitors", subMessage: "There are currently no checked out visitors" }
  ];

  containers.forEach(containerInfo => {
    const container = document.getElementById(containerInfo.id);
    if (!container) return;

    const hasCards = container.querySelectorAll(".visitor-card").length > 0;
    const existingEmptyState = container.querySelector(".empty-state");

    if (!hasCards && !existingEmptyState) {
      const emptyStateHTML = `
        <div class="empty-state">
          <i class="bi bi-person-x"></i>
          <h3>${containerInfo.message}</h3>
          <p>${containerInfo.subMessage}</p>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", emptyStateHTML);
    } else if (hasCards && existingEmptyState) {
      existingEmptyState.remove();
    }
  });
}

// Search functionality
document.addEventListener("DOMContentLoaded", function () {
  // Start auto-refresh when page loads
  startAutoRefresh();

  // Handle page visibility changes
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stopAutoRefresh();
    } else {
      startAutoRefresh();
    }
  });

  // Stop auto-refresh when page is about to unload
  window.addEventListener("beforeunload", function () {
    stopAutoRefresh();
  });

  const searchInput = document.querySelector(".search-input");
  const searchButton = document.querySelector(".filter-btn");
  const refreshButton = document.getElementById("refreshBtn");

  // Refresh button click handler
  if (refreshButton) {
    refreshButton.addEventListener("click", async function () {
      await refreshVisitorData(true); // true = show loading state
    });
  }

  // Function to perform search
  function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    // Get all visitor cards 
    const allVisitorCards = document.querySelectorAll(
      ".visitor-cards-container.active .visitor-card"
    );

    if (searchTerm === "") {
      // search is empty, show all cards
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

    
    const currentContainer = document.querySelector(
      ".visitor-cards-container.active"
    );
    const visibleCards = currentContainer.querySelectorAll(
      '.visitor-card[style="display: block"]'
    );

    
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

  
  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
      performSearch();
    }
  });

  
  const tabs = document.querySelectorAll(".visitor-tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      
      tabs.forEach((t) => t.classList.remove("active"));

      
      this.classList.add("active");

      
      document
        .querySelectorAll(".visitor-cards-container")
        .forEach((container) => {
          container.classList.remove("active");
        });

      
      const tabName = this.getAttribute("data-tab");
      let containerId;
      if (tabName === "all") {
        containerId = "all-visitors";
      } else if (tabName === "active") {
        containerId = "active-visitors";
      } else if (tabName === "checked-out") {
        containerId = "checked-out-visitors";
      }
      document.getElementById(containerId).classList.add("active");

      
      searchInput.value = "";
      performSearch();
    });
  });
});

