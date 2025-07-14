// Simple animation for cards on page load
document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".stat-card, .bookings-table");
  const buttons = document.querySelectorAll(".available-btn");
  const approve = document.querySelectorAll(".approve-btn");
  const reject = document.querySelectorAll(".reject-btn");

  // Animate cards
  cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";

    setTimeout(() => {
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 200 + index * 100);
  });

  // Add click handlers for availability buttons
  buttons.forEach((button) => {
    button.addEventListener("click", async function (e) {
      e.preventDefault();
      const id = button.getAttribute("data-id");
      console.log(id);
      const response = await fetch(
        `/manager/commonSpace/checkAvailability/${id}`,
        {
          method: "GET",
        }
      );
      const res = await response.json();
      alert(res.message);
      window.location.reload();
    });
  });

  approve.forEach((b) => {
    b.addEventListener("click", async () => {
      const id = b.getAttribute("data-id");
      console.log(id);
      const response = await fetch(`/manager/commonSpace/approve/${id}`, {
        method: "GET",
      });
      const res = await response.json();
      alert(res.message);
      window.location.reload();
    });
  });


  reject.forEach((b) => {
    b.addEventListener("click", async () => {
      const id = b.getAttribute("data-id");
      console.log(id);
      const response = await fetch(`/manager/commonSpace/reject/${id}`, {
        method: "GET",
      });
      const res = await response.json();
      alert(res.message);
      window.location.reload();
    });
  });

  // Search functionality
  const searchInput = document.querySelector(".search-bar input");
  const searchButton = document.querySelector(".search-bar button");

  searchButton.addEventListener("click", function () {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll("#bookingsTableBody tr");

    rows.forEach((row) => {
      const rowText = row.textContent.toLowerCase();
      if (rowText.includes(searchTerm)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });

  // Also trigger search on Enter key
  searchInput.addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
      searchButton.click();
    }
  });
});
