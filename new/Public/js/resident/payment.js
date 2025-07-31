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
  document.querySelectorAll(".popup").forEach((popup) => {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        popup.style.display = "none";
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
      document.getElementById("Pdeadline").value = new Date(res.payment.paymentDeadline).toLocaleDateString("en-GB");
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


async function openReceiptPopup(paymentId) {
  try {
    // Show loading state
    document.getElementById("ReceiptPopup").style.display = "flex";
    const popupContent = document.querySelector("#ReceiptPopup .popup-content");
    popupContent.innerHTML =
      '<div style="text-align: center; padding: 50px;"><i class="bi bi-arrow-repeat spin" style="font-size: 2rem;"></i><p>Loading receipt...</p></div>';

    // Fetch payment details from server
    const response = await fetch(`/resident/payment/${paymentId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch payment details");
    }

    const payment1 = await response.json();
    const payment = payment1.payment;
    console.log(payment);

    // Format dates
    const paymentDate = payment.paymentDate
      ? new Date(payment.paymentDate).toLocaleDateString("en-GB")
      : "-";
    const deadlineDate = payment.paymentDeadline
      ? new Date(payment.paymentDeadline).toLocaleDateString("en-GB")
      : "-";

    // Calculate processing fee (2% for credit cards)
    const processingFee =
      payment.paymentMethod === "Credit" ? payment.amount * 0.02 : 0;
    const totalAmount = payment.amount + processingFee;

    // Update popup content with payment details
    popupContent.innerHTML = `
      <span class="close-btn" onclick="closeForm('Receipt')">&times;</span>
      <h3 class="form-title">Payment Receipt</h3>
      
      <div class="receipt-container">
        <div class="receipt-header">
          <div class="logo">
            <img src="../../imgs/Logo copy.png" alt="Urban Ease" height="35px" width="150px">
          </div>
          <div class="receipt-id">
            <h3>RECEIPT</h3>
            <p><strong>Receipt No:</strong> ${payment._id}</p>
            <p><strong>Date:</strong> ${paymentDate}</p>
          </div>
        </div>
        
        <div class="receipt-title">
          <h1>Payment Receipt</h1>
        </div>
        
        <div class="receipt-details">
          <div class="receipt-from">
            <h3>PAYMENT FROM</h3>
            <p><strong>Name:</strong> ${payment.sender.residentFirstname} ${
      payment.sender.residentLastname
    }</p>
            <p><strong>Block/Flat:</strong> ${payment.sender.blockNo} ${
      payment.sender.flatNo
    }</p>
            <p><strong>Email:</strong> ${payment.sender.email}</p>
            <p><strong>Phone:</strong> ${payment.sender.contact}</p>
          </div>
          
          <div class="receipt-to">
            <h3>PAYMENT TO</h3>
            <p><strong>Name:</strong> Urban Ease Management</p>
            <p><strong>Address:</strong> 123 Management Plaza, City Center</p>
            <p><strong>Email:</strong> payments@urbanease.com</p>
            <p><strong>Phone:</strong> +1 (555) 123-4567</p>
          </div>
        </div>
        
        <div class="payment-info">
          <h3>PAYMENT DETAILS</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Payment For</span>
              <span class="info-value">${payment.belongTo}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Payment Method</span>
              <span class="info-value">${payment.paymentMethod}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Payment Date</span>
              <span class="info-value">${paymentDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Transaction ID</span>
              <span class="info-value">${payment.transactionId || "N/A"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Payment Status</span>
              <span class="info-value" style="color: #27ae60">${
                payment.status
              }</span>
            </div>
          </div>
          
          <div class="amount-details">
            <div class="amount-row">
              <span>Subtotal</span>
              <span>₹${payment.amount.toFixed(2)}</span>
            </div>
            
            ${
              processingFee > 0
                ? `
            <div class="amount-row">
              <span>Processing Fee (2%)</span>
              <span>₹${processingFee.toFixed(2)}</span>
            </div>
            `
                : ""
            }
            
            <div class="amount-row total-row">
              <span>Total Amount Paid</span>
              <span>₹${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div class="receipt-note">
          <p><strong>Note:</strong> This receipt serves as official proof of payment. Please retain this document for your records. For any discrepancies, please contact our support team within 7 days of this transaction.</p>
        </div>
        
        <div class="receipt-footer">
          <p>Thank you for your payment. For any questions regarding this receipt, please contact:</p>
          <p><strong>Email:</strong> support@urbanease.com | <strong>Phone:</strong> +1 (555) 987-6543</p>
        </div>
        
        <div class="actions">
          <button class="btn primary print-reciept">
            Print Receipt
          </button>
          <button class="btn secondary" onclick="closeForm('Receipt')">
            Close
          </button>
        </div>
      </div>
    `;

  } catch (error) {
    console.error("Error fetching payment details:", error);
    document.querySelector("#ReceiptPopup .popup-content").innerHTML = `
      <span class="close-btn" onclick="closeForm('Receipt')">&times;</span>
      <h3 class="form-title">Error</h3>
      <div class="alert alert-danger">
        Failed to load receipt details. Please try again later.
      </div>
      <button class="btn secondary" onclick="closeForm('Receipt')" style="margin-top: 20px;">
        Close
      </button>
    `;
  }
}

// Close popup function
function closeForm(type) {
  document.getElementById(`${type}Popup`).style.display = "none";
}

// Add event listeners to receipt buttons
document.addEventListener("DOMContentLoaded", function () {
  const receiptButtons = document.querySelectorAll(".payment-btn.receipt");

  receiptButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const paymentId = this.getAttribute("data-id");
      openReceiptPopup(paymentId);
    });
  });

  // Add spinner class for loading animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .spin {
      animation: spin 1s linear infinite;
    }
  `;
  document.head.appendChild(style);
});
