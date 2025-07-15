// Function to show/hide tabs
function showTab(tabName) {
  // Hide all table-containers
  document.querySelectorAll(".table-container").forEach((container) => {
    container.style.display = "none";
  });

  // Show the selected tab
  document.getElementById(tabName).style.display = "block";

  // Update active button
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`.tab-btn[onclick="showTab('${tabName}')"]`)
    .classList.add("active");
}

// Function to open form popups
function openForm(type) {
  document.getElementById(type + "FormPopup").style.display = "flex";
}

// Function to close form popups
function closeForm(type) {
  document.getElementById(type + "FormPopup").style.display = "none";
}

// Initialize event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Add event listeners to each "Add" button
  document
    .getElementById("addResidentBtn")
    .addEventListener("click", () => openForm("resident"));
  document
    .getElementById("addSecurityBtn")
    .addEventListener("click", () => openForm("security"));
  document
    .getElementById("addWorkerBtn")
    .addEventListener("click", () => openForm("worker"));

  // Add event listeners to close forms when clicking outside
  document.querySelectorAll(".popup").forEach((popup) => {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        popup.style.display = "none";
      }
    });
  });

  // Animate cards on page load
  const cards = document.querySelectorAll(".info-card, .table-container");
  cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";

    setTimeout(() => {
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 200 + index * 100);
  });

  const re = document.querySelectorAll(".resident-edit");
  const we = document.querySelectorAll(".worker-edit");
  const se = document.querySelectorAll(".security-edit");

  re.forEach((r) => {
    r.addEventListener("click", async () => {
      document.getElementById("residentFormPopup").style.display = "flex";
      const id = r.getAttribute("data-id");
      const response = await fetch(`/manager/userManagement/resident/${id}`, {
        method: "GET",
      });
      const res = await response.json();
      const resident = res.r;

      console.log(resident);

      document.getElementById("Rid").value = resident._id;
      document.getElementById("residentFirstname").value =
        resident.residentFirstname;
      document.getElementById("residentLastname").value =
        resident.residentLastname;
      document.getElementById("residentEmail").value = resident.email;
      document.getElementById("residentContact").value = resident.contact;
      document.getElementById("residentBlock").value = resident.blockNo;
      document.getElementById("houseNumber").value = resident.flatNo;
    });
  });

  we.forEach((w) => {
    w.addEventListener("click", async () => {
      document.getElementById("workerFormPopup").style.display = "flex";
      const id = w.getAttribute("data-id");
      const response = await fetch(`/manager/userManagement/worker/${id}`, {
        method: "GET",
      });
      const res = await response.json();
      const worker = res.w;

      console.log(worker);

      document.getElementById("Wid").value = worker._id;
      document.getElementById("workerName").value = worker.name;
      document.getElementById("workerEmail").value = worker.email;
      document.getElementById("workerJobRole").value = worker.jobRole;
      document.getElementById("workerContact").value = worker.contact;
      document.getElementById("workerAddress").value = worker.address;
      document.getElementById("workerSalary").value = worker.salary;
      document.getElementById("workerAvailabilityStatus").value =
        worker.availabilityStatus;
    });
  });

  se.forEach((s) => {
    s.addEventListener("click", async () => {
      document.getElementById("securityFormPopup").style.display = "flex";
      const id = s.getAttribute("data-id");
      const response = await fetch(`/manager/userManagement/security/${id}`, {
        method: "GET",
      });
      const res = await response.json();
      const worker = res.r;

      console.log(worker);

      document.getElementById("Sid").value = worker._id;
      document.getElementById("Sid").value = worker._id;
      document.getElementById("securityName").value = worker.name;
      document.getElementById("securityEmail").value = worker.email;
      document.getElementById("securityContact").value = worker.contact;
      document.getElementById("securityAddress").value = worker.address;
      document.getElementById("securityShift").value = worker.Shift;
      document.getElementById("gate").value = worker.workplace;
    });
  });
});
