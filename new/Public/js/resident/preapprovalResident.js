// Function to open form popup
function openForm(type) {
  document.getElementById(type + "FormPopup").style.display = "flex";
}

// Function to close form popup
function closeForm(type) {
  document.getElementById(type + "FormPopup").style.display = "none";
}

// Initialize event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Add event listener to pre-approve button
  document
    .getElementById("preApproveBtn")
    .addEventListener("click", () => openForm("preapproval"));

  // Add event listeners to close forms when clicking outside
  document.querySelectorAll(".popup").forEach((popup) => {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        popup.style.display = "none";
      }
    });
  });


  // Add click handlers for approve/reject buttons
  document.querySelectorAll(".action-btn.approve").forEach((btn) => {
    btn.addEventListener("click", function () {
      const card = this.closest(".request-card");
      card.querySelector(".status-badge").className =
        "status-badge status-approved";
      card.querySelector(".status-badge").textContent = "Approved";
      this.parentElement.remove();
    });
  });

  document.querySelectorAll(".action-btn.reject").forEach((btn) => {
    btn.addEventListener("click", function () {
      const card = this.closest(".request-card");
      card.querySelector(".status-badge").className =
        "status-badge status-rejected";
      card.querySelector(".status-badge").textContent = "Rejected";
      this.parentElement.remove();
    });
  });

  // Animate cards on page load
  const cards = document.querySelectorAll(".stat-card, .request-card");
  cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";

    setTimeout(() => {
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 200 + index * 100);
  });

  document.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const requestId = this.getAttribute("data-id");
      
      const response = confirm("Are you sure you want to cancel this request?");
      if (!response) {
        return; 
      }else{
        const res = await fetch(`/resident/preapproval/cancel/${requestId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ requestId })
        });
        if (!res.ok) {
          alert("Failed to cancel the request. Please try again.");
          return;
        }else{
          const data = await res.json();  
          this.closest(".request-card").remove();
        }

      }

     
    });
  });


});



