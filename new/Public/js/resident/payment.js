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
    // Show loading state using your existing popup styles
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
    const response1 = await fetch("/resident/payment/community");
    if (!response1.ok) {
      throw new Error("Failed to fetch payment details");
    }

    const payment = payment1.payment;
    const community = (await response1.json());
    console.log(community)

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
      <span class="close-btn" onclick="closeForm('Receipt')" style="position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer; color: #666; z-index: 10;">&times;</span>
      <h3 class="form-title" style="margin-top: 0; margin-bottom: 25px; text-align: center; color: #333;">Payment Receipt</h3>
      
      <div class="receipt-container" id="printable-receipt">
        <div class="receipt-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #eee;">
          <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      opacity: 0.3;
      z-index: 0;
      pointer-events: none;">
      <img src="../../imgs/Logo copy.png" alt="Urban Ease Watermark" style="width: 800px; max-width: 90%;">
    </div>
          <div class="receipt-id" style="text-align: right;">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 1.1em;">RECEIPT</h3>
            <p style="margin: 3px 0; font-size: 0.9em;"><strong>Receipt No:</strong> ${payment._id}</p>
            <p style="margin: 3px 0; font-size: 0.9em;"><strong>Date:</strong> ${paymentDate}</p>
          </div>
        </div>
          
        
        <div class="receipt-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
          <div class="receipt-from">
            <h3 style="color: #666; font-size: 0.95em; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">PAYMENT FROM</h3>
            <p style="margin: 6px 0; font-size: 0.9em;"><strong>Name:</strong> ${payment.sender.residentFirstname} ${payment.sender.residentLastname}</p>
            <p style="margin: 6px 0; font-size: 0.9em;"><strong>Block/Flat:</strong> ${payment.sender.blockNo} ${payment.sender.flatNo}</p>
            <p style="margin: 6px 0; font-size: 0.9em;"><strong>Phone:</strong> ${payment.sender.contact}</p>
          </div>
          
          <div class="receipt-to">
            <h3 style="color: #666; font-size: 0.95em; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">PAYMENT TO ${community.name}</h3>
            <p style="margin: 6px 0; font-size: 0.9em;"><strong>Address:</strong> ${community.location}</p>
          </div>
        </div>
          
        
        <div class="payment-info" style="margin-bottom: 25px;">
          <h3 style="color: #666; font-size: 0.95em; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px;">PAYMENT DETAILS</h3>
          <div class="info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
            <div class="info-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #007bff;">
              <span class="info-label" style="font-weight: 600; color: #495057; font-size: 0.85em;">Payment For</span>
              <span class="info-value" style="color: #212529; font-size: 0.9em;">${payment.belongTo}</span>
            </div>
            <div class="info-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #007bff;">
              <span class="info-label" style="font-weight: 600; color: #495057; font-size: 0.85em;">Payment Method</span>
              <span class="info-value" style="color: #212529; font-size: 0.9em;">${payment.paymentMethod}</span>
            </div>
            <div class="info-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #007bff;">
              <span class="info-label" style="font-weight: 600; color: #495057; font-size: 0.85em;">Payment Date</span>
              <span class="info-value" style="color: #212529; font-size: 0.9em;">${paymentDate}</span>
            </div>
            <div class="info-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #007bff;">
              <span class="info-label" style="font-weight: 600; color: #495057; font-size: 0.85em;">Transaction ID</span>
              <span class="info-value" style="color: #212529; font-size: 0.9em;">${payment.transactionId || "N/A"}</span>
            </div>
            <div class="info-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #27ae60;">
              <span class="info-label" style="font-weight: 600; color: #495057; font-size: 0.85em;">Payment Status</span>
              <span class="info-value" style="color: #27ae60; font-weight: 600; font-size: 0.9em;">${payment.status}</span>
            </div>
          </div>
            
            <div class="amount-details" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <div class="amount-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                <span>Subtotal</span>
                <span style="font-weight: bold;">₹${payment.amount.toFixed(2)}</span>
              </div>
              
              ${processingFee > 0 ? `
              <div class="amount-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                <span>Processing Fee (2%)</span>
                <span style="font-weight: bold;">₹${processingFee.toFixed(2)}</span>
              </div>
              ` : ""}
              
              <div class="amount-row total-row" style="display: flex; justify-content: space-between; padding: 15px 0; font-size: 1.2em; font-weight: bold; color: #27ae60; border-top: 2px solid #27ae60; margin-top: 10px;">
                <span>Total Amount Paid</span>
                <span>₹${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div class="receipt-note" style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 0.9em;"><strong>Note:</strong> This receipt serves as official proof of payment. Please retain this document for your records. For any discrepancies, please contact our support team within 7 days of this transaction.</p>
          </div>
          
          <div class="receipt-footer" style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0; font-size: 0.9em;">Thank you for your payment.</p>
          </div>
          
          <div class="actions no-print" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
            <button class="btn primary print-receipt" style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1em;">
              Print Receipt
            </button>
            <button class="btn secondary" onclick="closeForm('Receipt')" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1em;">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    // Add print functionality with proper print styles
    const printButton = popupContent.querySelector('.print-receipt');
    if (printButton) {
      printButton.addEventListener('click', function() {
        printReceipt();
      });
    }

  } catch (error) {
    console.error("Error fetching payment details:", error);
    const popupContent = document.querySelector("#ReceiptPopup .popup-content");
    popupContent.innerHTML = `
      <span class="close-btn" onclick="closeForm('Receipt')" style="position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer; color: #dc3545;">&times;</span>
      <h3 class="form-title" style="color: #dc3545; margin-top: 0; text-align: center;">Error Loading Receipt</h3>
      <div class="alert alert-danger" style="background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%); color: #721c24; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; border-left: 4px solid #dc3545;">
        <strong>Failed to load receipt details.</strong><br>
        Please try again later or contact support if the issue persists.
      </div>
      <div style="text-align: center;">
        <button class="btn secondary" onclick="closeForm('Receipt')" style="padding: 12px 24px; background: linear-gradient(135deg, #6c757d 0%, #545b62 100%); color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 15px; font-weight: 600;">
          Close
        </button>
      </div>
    `;
  }
}

// Dedicated print function for receipt
function printReceipt() {
  const printContent = document.getElementById('printable-receipt');
  if (!printContent) {
    console.error('Printable receipt content not found');
    return;
  }

  const originalContent = document.body.innerHTML;
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          @media print {
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #000;
              background: white;
            }
            .no-print { display: none !important; }
            * { 
              -webkit-print-color-adjust: exact !important; 
              color-adjust: exact !important; 
            }
          }
          
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #000;
            background: white;
            line-height: 1.4;
          }
          
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            position: relative;
          }
          
          .receipt-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
          }
          
          .receipt-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 25px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 3px solid #007bff;
          }
          
          .amount-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
          }
          
          .amount-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .total-row {
            font-size: 1.2em;
            font-weight: bold;
            color: #27ae60;
            border-top: 2px solid #27ae60;
            margin-top: 10px;
            border-bottom: none;
          }
          
          .receipt-note {
            background: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #ffc107;
          }
          
          .receipt-footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          
          h3 {
            margin: 0 0 10px 0;
            color: #333;
          }
          
          p {
            margin: 6px 0;
            font-size: 0.9em;
          }
          
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${printContent.outerHTML}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.onload = function() {
    printWindow.print();
    
  };
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
