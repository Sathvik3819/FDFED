// Simple animation for table rows on page load
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
        alert("Issue resolved successfully!");
      } else {
        alert("Failed to resolve issue. Please try again.");
      }
    });
  });
});
