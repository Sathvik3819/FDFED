// Function to open payment form popup
function openPaymentForm() {
  document.getElementById("paymentFormPopup").style.display = "flex";
}

// Function to close payment form popup
function closePaymentForm() {
  document.getElementById("paymentFormPopup").style.display = "none";
}

// Initialize event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Add event listeners to close forms when clicking outside
  document.querySelectorAll(".popup").forEach((popup) => {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        popup.style.display = "none";
      }
    });
  });

  const rows = document.querySelectorAll(".receipt");

  rows.forEach((row) => {
    row.addEventListener("click", (e) => {
      const paymentId = row.getAttribute("data-id");

      if (paymentId) {
        window.location.href = `/resident/payment/receipt/${paymentId}`;
      } else {
        console.warn("Payment ID not found in row");
      }
    });
  });

  document.querySelectorAll(".pay").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      const paymentId = button.getAttribute("data-id");
      console.log("Payment ID:", paymentId);

      const response = await fetch(`/resident/payment/${paymentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const res = await response.json();
      console.log("Payment details:", res);

      document.getElementById("bill").value = res.payment.belongTo;
      document.getElementById("amount").value = res.payment.amount;
      document.getElementById("paymentId").value = res.payment._id;
    });
  });

  document
    .getElementById("paymentMethod")
    .addEventListener("change", function () {
      const cardFields = document.getElementById("cardFields");
      const selectedMethod = this.value;

      if (selectedMethod === "credit" || selectedMethod === "debit") {
        cardFields.style.display = "block";
      } else {
        cardFields.style.display = "none";
      }
    });

  // Animate cards on page load
  const cards = document.querySelectorAll(".stat-card, .table-container");
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
