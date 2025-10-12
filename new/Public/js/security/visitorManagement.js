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
        const newdiv = document.createElement("div");
        newdiv.className = `visitor-card ${result.visitor.status}`;
        newdiv.innerHTML = `
  <div class="visitor-header">
    <div class="visitor-name">${result.visitor.name}</div>
    <div class="visitor-status status-${result.visitor.status}">
      ${result.visitor.status.charAt(0).toUpperCase() + result.visitor.status.slice(1)}
    </div>
  </div>

  <div class="visitor-details">
    <div class="detail-row">
      <div class="detail-label">Entry Type:</div>
      <div class="detail-value">
        <span class="entry-type-value">
          ${result.visitor.verifiedByResident 
            ? `<i class="bi bi-patch-check"></i> Pre-Approved ${result.visitor.approvedBy ? `<span class="approver">(by ${result.visitor.approvedBy})</span>` : ''}` 
            : `<i class="bi bi-person-x"></i> Direct Entry`}
        </span>
      </div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Purpose:</div>
      <div class="detail-value">${result.visitor.purpose}</div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Entry Date:</div>
      <div class="detail-value">
        ${new Date(result.visitor.entryDate).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        })}
      </div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Entry Time:</div>
      <div class="detail-value">
        ${new Date(result.visitor.entryTime).toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', hour12: true
        })}
      </div>
    </div>

    ${result.visitor.exitDate ? `
      <div class="detail-row">
        <div class="detail-label">Exit Date:</div>
        <div class="detail-value">
          ${new Date(result.visitor.exitDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-label">Exit Time:</div>
        <div class="detail-value">
          ${new Date(result.visitor.exitTime).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
          })}
        </div>
      </div>
    ` : ''}
  </div>

  <div class="visitor-actions">
    ${result.visitor.status === "active" ? `
      <button class="btn btn-secondary check-btn" data-id="${result.visitor._id}" data-action="checked-out">
        <i class="bi bi-box-arrow-right"></i> Check Out
      </button>
    ` : result.visitor.status === "pending" ? `
      <button class="btn btn-primary check-btn" data-id="${result.visitor._id}" data-action="checked-in">
        <i class="bi bi-box-arrow-in-right"></i> Check In
      </button>
    ` : ''}
  </div>
`;

      const container = document.getElementsByClassName("visitor-cards-container active")[0];
      container.prepend(newdiv);

      document.getElementById("totalvisitorlength").innerText = parseInt(document.getElementById("totalvisitorlength").innerText) + 1;

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
      document.getElementById(`${tabName}-visitors`).classList.add("active");
    });
  });

  const add = document.querySelectorAll(".add-visitor-section");

  add[0].addEventListener("click",()=>{
    openForm('visitor');
  })

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


document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.querySelector(".search-input");
  const searchButton = document.querySelector(".filter-btn");

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
      document.getElementById(`${tabName}-visitors`).classList.add("active");

      
      searchInput.value = "";
      performSearch();
    });
  });
});

