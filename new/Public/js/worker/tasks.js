const notyf = new Notyf({
  duration: 3000,
  position: { x: "right", y: "top" },
  types: [
    {
      type: "success",
      background: "#3eb73eff",
    },
    {
      type: "error",
      background: "#d9534f",
    },
  ],
});



document.addEventListener("DOMContentLoaded", function () {
  const rows = document.querySelectorAll(".tasks-table tbody tr");

  rows.forEach((row, index) => {
    // Set initial state for animation
    row.style.opacity = "0";
    row.style.transform = "translateY(20px)";

    // Animate in with delay
    setTimeout(() => {
      row.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      row.style.opacity = "1";
      row.style.transform = "translateY(0)";
    }, 200 + index * 100);
  });

  // Add click handler for resolve buttons
  const resolveButtons = document.querySelectorAll(".action-btn");
  resolveButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const issueId = button.getAttribute("data-id");
      console.log(`Resolving issue with ID: ${issueId}`);
      const response = await fetch(
        `/worker/issueResolving/resolve/${issueId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        notyf.success("Issue resolved successfully!");
        const card = document.querySelector(`.task-card[data-id='${issueId}']`);
        if (card) {
          card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
          card.style.opacity = "0";
          card.style.transform = "translateY(20px)";
          setTimeout(() => {
            card.remove();
          }, 300);
          const cards = document.querySelectorAll(".task-card");
          if (cards.length === 0) {
            const table = document.querySelector(".tasks-container");
            if (table) {
            table.innerHTML = `
              <div class="empty-state">
                <i class="bi bi-clipboard-check"></i>
                <h3>No Assigned Tasks</h3>
                <p>Tasks assigned to you will appear here</p>
              </div>
            `;
                
            }
          }
        }
      } else {
        notyf.error("Failed to resolve issue.");
      }
    });
  });
});
