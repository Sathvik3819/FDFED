// Simple animation for cards on page load

function closeForm(type) {
  if (type === "details") {
    document.getElementById("bookingDetailsPopup").style.display = "none";
  } else {
    document.getElementById("FormPopup").style.display = "none";
  }
}

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
      window.location.reload();
    });
  });

  reject.forEach((b) => {
    b.addEventListener("click", async () => {
      const id = b.getAttribute("data-id");
      document.getElementById("FormPopup").style.display = "flex";
      document
        .getElementById("bookingForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault(); // Stop default form submission

          const textarea = document.getElementById("notes");
          const purpose = textarea.value.trim();

          if (!purpose) {
            alert("Please provide a reason.");
            return;
          }

          try {
            const response = await fetch(`/manager/commonSpace/reject/${id}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ purpose }),
            });

            const res = await response.json();

            if (response.ok) {
              alert(res.message || "Booking rejected.");
              window.location.reload();
            } else {
              alert(res.error || "Something went wrong.");
            }
          } catch (error) {
            console.error("Error submitting rejection:", error);
            alert("Network error. Try again.");
          }
        });
    });
  });

  // Search functionality
  const searchInput = document.querySelector(".search-bar input");
  const searchButton = document.querySelector(".search-bar button");

  searchButton.addEventListener("click", function () {
    const searchTerm = searchInput.value.toLowerCase();
    const bookingCards = document.querySelectorAll(".booking-card");

    bookingCards.forEach((card) => {
      const cardText = card.textContent.toLowerCase();
      if (cardText.includes(searchTerm)) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });

    // Show empty state if no cards match
    const visibleCards = document.querySelectorAll(
      '.booking-card[style="display: block;"]'
    );
    const emptyState = document.querySelector(".empty-state");

    if (visibleCards.length === 0) {
      if (!emptyState) {
        const bookingsContainer = document.getElementById("bookingsContainer");
        const emptyStateHTML = `
        <div class="empty-state" style="width:100%;">
          <i class="bi bi-search"></i>
          <h3>No matching bookings found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      `;
        bookingsContainer.insertAdjacentHTML("beforeend", emptyStateHTML);
      }
    } else {
      if (emptyState) {
        emptyState.remove();
      }
    }
  });

  // Also trigger search on Enter key
  searchInput.addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
      searchButton.click();
    }
  });
});
