// Function to open form popup
function openForm(type) {
  document.getElementById(`${type}FormPopup`).style.display = "flex";
}

// Function to close form popup
function closeForm(type) {
  document.getElementById(`${type}FormPopup`).style.display = "none";
}

// Function to close QR modal
function closeQRModal() {
  document.getElementById('qrCodeModal').style.display = 'none';
}

// Function to generate QR code
function generateQRCode(data) {
  const qrCodeContainer = document.getElementById('qrCodeContainer');
  qrCodeContainer.innerHTML = ''; // Clear previous QR code
  
  try {
    new QRCode(qrCodeContainer, {
      text: JSON.stringify(data),
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    document.getElementById('qrCodeModal').style.display = 'flex';
  } catch (error) {
    console.error('QR generation failed:', error);
    alert('Failed to generate QR code. Please try again.');
  }
}

// Function to download QR code
function downloadQRCode() {
  const canvas = document.querySelector('#qrCodeContainer canvas');
  if (canvas) {
    const link = document.createElement('a');
    link.download = `preapproval-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

async function submitPreapprovalForm(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Processing...';
    
    // Convert form data to URL-encoded format
    const formData = new URLSearchParams();
    formData.append('visitorName', form.visitorName.value);
    formData.append('contactNumber', form.contactNumber.value);
    formData.append('dateOfVisit', form.dateOfVisit.value);
    formData.append('timeOfVisit', form.timeOfVisit.value);
    formData.append('purpose', form.purpose.value);
    
    const response = await fetch('/resident/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Form submission failed');
    }
    
    const result = await response.json();
    
    generateQRCode({
      id: result.preapproval._id,
      visitorName: result.preapproval.visitorName,
      date: result.preapproval.dateOfVisit,
      time: result.preapproval.timeOfVisit,
      purpose: result.preapproval.purpose,
      status: 'approved'
    });
    
    closeForm('preapproval');
    form.reset();
    
    // Refresh the list after showing QR code
    setTimeout(() => window.location.reload(), 3000);
  } catch (error) {
    console.error('Submission error:', error);
    alert(`Error: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

// Function to view existing QR code
async function viewQRCode(requestId) {
  try {
    const card = document.querySelector(`.request-card [data-id="${requestId}"]`)?.closest('.request-card');
    if (!card) throw new Error('Card not found');
    
    const qrData = {
      id: requestId,
      visitorName: card.querySelector('.visitor-name')?.textContent.trim(),
      date: card.querySelectorAll('.detail-value')[1]?.textContent.trim(),
      time: card.querySelectorAll('.detail-value')[2]?.textContent.trim(),
      purpose: card.querySelectorAll('.detail-value')[3]?.textContent.trim(),
      status: 'approved'
    };
    
    generateQRCode(qrData);
  } catch (error) {
    console.error('QR view error:', error);
    alert('Failed to display QR code. Please try again.');
  }
}

// Initialize event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Form handling
  document.getElementById("preApproveBtn")?.addEventListener("click", () => openForm("preapproval"));
  document.getElementById("preapprovalForm")?.addEventListener("submit", submitPreapprovalForm);

  // Modal closing handlers
  document.querySelectorAll(".popup").forEach(popup => {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) popup.style.display = "none";
    });
  });

  // QR code buttons
  document.querySelectorAll(".view-qr-btn").forEach(btn => {
    btn.addEventListener("click", () => viewQRCode(btn.dataset.id));
  });

  // Status update buttons
  document.querySelectorAll(".action-btn.approve").forEach(btn => {
    btn.addEventListener("click", function() {
      const card = this.closest(".request-card");
      if (card) {
        card.querySelector(".status-badge").className = "status-badge status-approved";
        card.querySelector(".status-badge").textContent = "Approved";
        this.parentElement.remove();
      }
    });
  });

  document.querySelectorAll(".action-btn.reject").forEach(btn => {
    btn.addEventListener("click", function() {
      const card = this.closest(".request-card");
      if (card) {
        card.querySelector(".status-badge").className = "status-badge status-rejected";
        card.querySelector(".status-badge").textContent = "Rejected";
        this.parentElement.remove();
      }
    });
  });

  // Card animations
  document.querySelectorAll(".stat-card, .request-card").forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    setTimeout(() => {
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 200 + index * 100);
  });

  // Cancel buttons
  document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", async function() {
      const requestId = this.dataset.id;
      if (!confirm("Are you sure you want to cancel this request?")) return;
      
      try {
        const res = await fetch(`/resident/preapproval/cancel/${requestId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId })
        });
        
        if (!res.ok) throw new Error('Cancellation failed');
        
        this.closest(".request-card")?.remove();
      } catch (error) {
        console.error('Cancellation error:', error);
        alert("Failed to cancel request. Please try again.");
      }
    });
  });
});