document.addEventListener("DOMContentLoaded", function () {
  // Search functionality
  const searchBtn = document.querySelector(".filter-btn");
  const searchInput = document.querySelector(".search-input");
  const allRows = document.querySelectorAll("#tab-all tbody tr");

  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim().toLowerCase();

    allRows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? "" : "none";
    });
  });

  const checkOut = document.querySelectorAll(".check-btn");
  console.log(checkOut);

  checkOut.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const visitorId = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");

      console.log(visitorId, action);

      try {
        const response = await fetch(
          `/security/visitorManagement/${action}/${visitorId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (result.success) {
          alert(result.message);
          window.location.reload();
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while processing your request.");
      }
    });
  });

  const exportBtn = document.querySelector(".export-btn");

  exportBtn.addEventListener("click", () => {
    const activeTabId = document
      .querySelector(".visitor-tab.active")
      .getAttribute("data-tab");
    const table = document.querySelector(`#tab-${activeTabId} table`);
    if (!table) return;

    const rows = Array.from(table.querySelectorAll("tr"))
      .map((row) =>
        Array.from(row.querySelectorAll("th, td"))
          .map((cell) => `"${cell.innerText.trim()}"`)
          .join(",")
      )
      .join("\n");

    const csvBlob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(csvBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `visitors-${activeTabId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Tab switching functionality
  const tabs = document.querySelectorAll(".visitor-tab");
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

  // Simple animation for cards on page load
  const cards = document.querySelectorAll(".stat-card");
  cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";

    setTimeout(() => {
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 200 + index * 100);
  });
});
