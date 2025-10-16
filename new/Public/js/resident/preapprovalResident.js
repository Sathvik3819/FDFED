// POPUP HANDLERS
function openForm(type) {
  document.getElementById(`${type}FormPopup`).style.display = "flex";
}

function closeForm(type) {
  document.getElementById(`${type}FormPopup`).style.display = "none";
}

function closeQRModal() {
  document.getElementById("qrCodeModal").style.display = "none";
}

// Function to download QR code
function downloadQRCode() {
  const qrContainer = document.getElementById('qrCodeContainer');
  const img = qrContainer.querySelector('img'); // Your QR is rendered as <img src="data:image/png;base64,...">
  
  if (!img) {
    alert("QR Code not found!");
    return;
  }

  // Extract base64 data URL from image
  const imageSrc = img.src;
  const link = document.createElement('a');
  link.download = `preapproval-${Date.now()}.png`;
  link.href = imageSrc;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
    
  //fetch QR from backend
   await viewQRCode(result.preapproval._id);
    
    closeForm('preapproval');
    form.reset();
    
    // Refresh the list after showing QR code
  } catch (error) {
    console.error('Submission error:', error);
    alert(`Error: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

// Function to view existing QR code
// View existing QR from backend
async function viewQRCode(requestId) {
  try {
    const response = await fetch(`/resident/preapproval/qr/${requestId}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to fetch QR");
    }

    const data = await response.json();
    const qrContainer = document.getElementById('qrCodeContainer');
    qrContainer.innerHTML = ''; // clear old QR

    // Create image element
    const img = document.createElement('img');
    img.src = data.qrCodeBase64;
    img.alt = 'Pre-Approval QR';
    img.width = 200;
    img.height = 200;
    qrContainer.appendChild(img);

    // Show modal
    document.getElementById('qrCodeModal').style.display = 'flex';
  } catch (error) {
    console.error('QR view error:', error);
    alert(error.message);
  }
}

// Initialize event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Form handling
  document.getElementById("preApproveBtn")?.addEventListener("click", () => openForm("preapproval"));
  document.getElementById("preapprovalForm")?.addEventListener("submit", submitPreapprovalForm);
  document.getElementById("downloadQRBtn")?.addEventListener("click", downloadQRCode);

  // Modal closing handlers
  document.querySelectorAll(".popup").forEach(popup => {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) popup.style.display = "none";
    });
  });

  // QR code buttons
    document.querySelectorAll(".view-qr-btn").forEach(btn => {
    console.log("QR button found:", btn.dataset.id);
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      viewQRCode(btn.dataset.id);
    });
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