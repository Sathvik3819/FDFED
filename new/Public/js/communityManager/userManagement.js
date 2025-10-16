const notyf = new Notyf({
  duration: 3000,
  position: { x: "center", y: "top" },
  types: [
    { type: "warning", background: "orange", icon: false },
    { type: "info", background: "blue", icon: false },
  ],
});


function openForm(formType, data = {}) {
  let formPopupId;
  let formTitle;
  let formAction;
  let formId;
  if (formType === "resident") {
    formPopupId = "residentFormPopup";
    formTitle = "Add Resident";
    formAction = "/manager/userManagement/resident";
    formId = "residentForm";
    console.log(data);

    if (data._id) {
      formTitle = "Edit Resident";
      document.getElementById("Rid").value = data._id;
      document.getElementById("residentFirstname").value =
        data.residentFirstname || "";
      document.getElementById("residentLastname").value =
        data.residentLastname || "";
      document.getElementById("residentEmail").value = data.email || "";
      document.getElementById("uCode").value = data.uCode || "";
      document.getElementById("residentContact").value = data.contact || "";
    } else {
      document.getElementById("Rid").value = "";
      document.getElementById("residentForm").reset();
    }
  } else if (formType === "security") {
    formPopupId = "securityFormPopup";
    formTitle = "Add Security";
    formAction = "/manager/userManagement/security";
    formId = "securityForm";
    if (data._id) {
      formTitle = "Edit Security";
      document.getElementById("Sid").value = data._id;
      document.getElementById("securityName").value = data.name || "";
      document.getElementById("securityEmail").value = data.email || "";
      document.getElementById("securityContact").value = data.contact || "";
      document.getElementById("securityAddress").value = data.address || "";
      document.getElementById("securityShift").value = data.Shift || "";
      document.getElementById("gate").value = data.workplace || "";
    } else {
      document.getElementById("Sid").value = "";
      document.getElementById("securityForm").reset();
    }
  } else if (formType === "worker") {
    formPopupId = "workerFormPopup";
    formTitle = "Add Worker";
    formAction = "/manager/userManagement/worker";
    formId = "workerForm";
    if (data._id) {
      formTitle = "Edit Worker";
      document.getElementById("Wid").value = data._id;
      document.getElementById("workerName").value = data.name || "";
      document.getElementById("workerEmail").value = data.email || "";
      document.getElementById("workerJobRole").value = data.jobRole || "";
      document.getElementById("workerContact").value = data.contact || "";
      document.getElementById("workerAddress").value = data.address || "";
    } else {
      document.getElementById("Wid").value = "";
      document.getElementById("workerForm").reset();
    }
  }
  document.getElementById(formPopupId).style.display = "flex";
}

document.querySelectorAll(".close").forEach((button) => {
  button.addEventListener("click", () => {
    button.closest(".popup").style.display = "none";
  });
});

document.querySelectorAll(".popup").forEach((popup) => {
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.style.display = "none";
    }
  });
});

function closeForm(formType) {
  if (formType === "resident") {
    document.getElementById("residentFormPopup").style.display = "none";
  } else if (formType === "security") {
    document.getElementById("securityFormPopup").style.display = "none";
  } else if (formType === "worker") {
    document.getElementById("workerFormPopup").style.display = "none";
  }
}

function showTab(tabId) {
  const tabs = document.querySelectorAll(".cards-container");
  tabs.forEach((tab) => {
    tab.style.display = "none";
  });
  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.style.display = "block";
  }
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`.tab-btn[onclick="showTab('${tabId}')"]`)
    .classList.add("active");
}


function validateResidentForm() {
  const uCode = document.getElementById("uCode").value.trim();
  if (!uCode) {
    notyf.error("Please enter a valid flat number.");
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", function () {
  showTab("residents");
  document
    .getElementById("addResidentBtn")
    .addEventListener("click", function () {
      
      openForm("resident");
    });
  document
    .getElementById("addSecurityBtn")
    .addEventListener("click", function () {
      openForm("security");
    });
  document
    .getElementById("addWorkerBtn")
    .addEventListener("click", function () {
      openForm("worker");
    });
  const cardGrids = document.querySelectorAll(".card-grid");
  const infoCards = document.querySelectorAll(".info-card");
  cardGrids.forEach((grid) => {
    grid.addEventListener("click", async function (event) {
      const editBtn = event.target.closest(".action-btn.edit");
      const deleteBtn = event.target.closest(".action-btn.delete");
      const card = event.target.closest(".info-card");
      if (!card) return;
      const id = card.getAttribute("data-id");
      let formType = "";
      let endpoint = "";
      if (card.parentElement.id === "residentCardGrid") {
        formType = "resident";
        endpoint = `/manager/userManagement/resident/${id}`;
      } else if (card.parentElement.id === "securityCardGrid") {
        formType = "security";
        endpoint = `/manager/userManagement/security/${id}`;
      } else if (card.parentElement.id === "workerCardGrid") {
        formType = "worker";
        endpoint = `/manager/userManagement/worker/${id}`;
      }
      if (editBtn) {
        try {
          const response = await fetch(endpoint, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          const data = await response.json();
          if (response.ok) {
            openForm(formType, data.r);
          } else {
            notyf.error(data.error || `Failed to fetch ${formType} data`);
          }
        } catch (error) {
          notyf.error(`Error fetching ${formType} data`);
        }
      } else if (deleteBtn) {
        if (confirm(`Are you sure you want to delete this ${formType}?`)) {
          try {
            const response = await fetch(endpoint, { method: "DELETE" });
            const result = await response.json();
            if (response.ok) {
              notyf.success(`${formType} deleted successfully`);
              card.remove();
              if (grid.children.length === 0) {
                const emptyState = document.createElement("div");
                emptyState.className = "empty text-muted";
                emptyState.innerText = `No ${formType} found.`;
                grid.appendChild(emptyState);
              }
            } else {
              notyf.error(result.error || `Failed to delete ${formType}`);
            }
          } catch (error) {
            notyf.error(`Error deleting ${formType}. Please try again`);
          }
        }
      }
    });
  });

  document
    .getElementById("residentForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const submitBtn = document.getElementsByClassName("form-button")[0];
      submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
      submitBtn.disabled = true;
      const Rid = document.getElementById("Rid").value;
      const firstname = document.getElementById("residentFirstname").value;
      const lastname = document.getElementById("residentLastname").value;
      const email = document.getElementById("residentEmail").value;
      const uCode = document.getElementById("uCode").value;
      const contact = document.getElementById("residentContact").value;
      const cardgrid = document.getElementById("residentCardGrid");
      const emptyState = cardgrid.querySelector(".empty");

      if (!firstname || !lastname || !email || !uCode || !contact) {
        notyf.open({
          type: "warning",
          message: "Please fill in all required fields.",
        });
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        notyf.open({
          type: "warning",
          message: "Please enter a valid email address.",
        });
        return;
      }
      if (!/^\d{10}$/.test(contact)) {
        notyf.open({
          type: "warning",
          message: "Please enter a valid 10-digit contact number.",
        });
        return;
      }
      const formData = {
        residentFirstname: firstname,
        residentLastname: lastname,
        email: email,
        uCode: uCode,
        contact: contact,
        Rid: Rid,
      };

      const response = await fetch("/manager/userManagement/resident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        if (result.isUpdate) {
          const existingCard = cardgrid.querySelector(
            `.info-card[data-id='${result.resident._id}']`
          );
          if (existingCard) {
            existingCard.querySelector(
              ".card-title"
            ).innerText = `${result.resident.residentFirstname} ${result.resident.residentLastname}`;
            existingCard.querySelector(
              ".card-body"
            ).innerHTML = `<p><strong>Email:</strong> ${result.resident.email}</p>
              <p><strong>Unit Code:</strong> ${result.resident.uCode}</p>
              <p><strong>Contact:</strong> ${result.resident.contact}</p>`;

            notyf.success("Resident updated successfully!");
          } else {
            notyf.error("No resident found.");
          }
        } else {
          const newCard = document.createElement("div");
          newCard.className = "info-card";
          newCard.setAttribute("data-id", result.resident._id);
          newCard.innerHTML = `
            <div class="card-header">
              <div class="card-title">
                ${result.resident.residentFirstname} ${
            result.resident.residentLastname
          }
              </div>
              <span class="card-id">#${result.resident._id
                .toString()
                .substring(0, 8)}</span>
            </div>
            <div class="card-body">
              <p><strong>Email:</strong> ${result.resident.email}</p>
              <p><strong>Unit Code:</strong> ${result.resident.uCode}</p>
              <p><strong>Contact:</strong> ${result.resident.contact}</p>
            </div>
            <div class="card-actions">
              <button class="action-btn resident-edit edit" data-id="${
                result.resident._id
              }">
                <i class="bi bi-pencil"></i>Edit
              </button>
              <button class="action-btn resident-delete delete" data-id="${
                result.resident._id
              }">
                <i class="bi bi-trash"></i>Delete
              </button>
            </div>
          `;

          if (emptyState) emptyState.remove();
          cardgrid.appendChild(newCard);

          notyf.success("Resident added successfully!");
        }
        closeForm("resident");
      } else {
        notyf.error(result.error || "Failed to add/update resident.");
      }

      submitBtn.innerHTML = "Submit";
      submitBtn.disabled = false;
    });

  document
    .getElementById("securityForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const submitBtn = document.getElementsByClassName("form-button")[1];
      submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
      submitBtn.disabled = true;
      const name = document.getElementById("securityName").value;
      const email = document.getElementById("securityEmail").value;
      const contact = document.getElementById("securityContact").value;
      const address = document.getElementById("securityAddress").value;
      const Shift = document.getElementById("securityShift").value;
      const workplace = document.getElementById("gate").value;
      const cardgrid = document.getElementById("securityCardGrid");
      const emptyState = cardgrid.querySelector(".empty");

      if (!name || !email || !contact || !address || !Shift || !workplace) {
        notyf.open({
          type: "warning",
          message: "Please fill in all required fields.",
        });
        return;
      }

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        notyf.open({
          type: "warning",
          message: "Please enter a valid email address.",
        });
        return;
      }

      if (!/^\d{10}$/.test(contact)) {
        notyf.open({
          type: "warning",
          message: "Please enter a valid 10-digit contact number.",
        });
        return;
      }

      const formData = {
        securityName: name,
        securityEmail: email,
        securityContact: contact,
        securityAddress: address,
        securityShift: Shift,
        gate: workplace,
        Sid: document.getElementById("Sid").value,
      };

      const response = await fetch("/manager/userManagement/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log(result);
      

      if (result.success) {
        if (result.isUpdate) {
          console.log(result.security);
          const existingCard = cardgrid.querySelector(
            `.info-card[data-id='${result.security._id}']`
          );
          if (existingCard) {
            existingCard.querySelector(
              ".card-title"
            ).innerText = result.security.name;
            existingCard.querySelector(
              ".card-body"
            ).innerHTML = `<p><strong>Email:</strong> ${result.security.email}</p>
              <p><strong>Contact:</strong> ${result.security.contact}</p>
              <p><strong>Address:</strong> ${result.security.address}</p>
              <p><strong>Shift:</strong> ${result.security.Shift}</p>
              <p><strong>Gate:</strong> ${result.security.workplace}</p>`;

              closeForm("security");
            notyf.success("Security updated successfully!");
          } else {
            notyf.error("No security found.");
          }
        } else {
          const newCard = document.createElement("div");
          newCard.className = "info-card";
          newCard.setAttribute("data-id", result.security._id);
          newCard.innerHTML = `
            <div class="card-header">
              <div class="card-title">
                ${result.security.name}
              </div>
              <span class="card-id">#${result.security._id
                .toString()
                .substring(0, 8)}</span>
            </div>
            <div class="card-body">
              <p><strong>Email:</strong> ${result.security.email}</p>
              <p><strong>Contact:</strong> ${result.security.contact}</p>
              <p><strong>Address:</strong> ${result.security.address}</p>
              <p><strong>Shift:</strong> ${result.security.Shift}</p>
              <p><strong>Gate:</strong> ${result.security.workplace}</p>
            </div>
            <div class="card-actions">
              <button class="action-btn security-edit edit" data-id="${
                result.security._id
              }">
                <i class="bi bi-pencil"></i>Edit
              </button>
              <button class="action-btn security-delete delete" data-id="${
                result.security._id
              }">
                <i class="bi bi-trash"></i>Delete
              </button>
            </div>
        `;    

          if (emptyState) emptyState.remove();

          cardgrid.appendChild(newCard);
          closeForm("security");
          notyf.success("Security added successfully!");
        }
        
      } else {
        notyf.error(result.error || "Failed to update security settings.");
      }

      submitBtn.innerHTML = "Submit";
      submitBtn.disabled = false;
    });

  document
    .getElementById("workerForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const submitBtn = document.getElementsByClassName("form-button")[2];
      submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
      submitBtn.disabled = true;
      const name = document.getElementById("workerName").value;
      const email = document.getElementById("workerEmail").value;
      const jobRole = document.getElementById("workerJobRole").value;
      const contact = document.getElementById("workerContact").value;
      const address = document.getElementById("workerAddress").value;
      const salary = document.getElementById("workerSalary").value;
      const Wid = document.getElementById("Wid").value;

      const cardgrid = document.getElementById("workerCardGrid");
      const emptyState = cardgrid.querySelector(".empty");
      if (!name || !email || !jobRole || !contact || !address || !salary) {
        notyf.open({
          type: "warning",
          message: "Please fill in all required fields.",
        });
        return;
      }

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        notyf.open({
          type: "warning",
          message: "Please enter a valid email address.",
        });
        return;
      }

      if (!/^\d{10}$/.test(contact)) {
        notyf.open({
          type: "warning",
          message: "Please enter a valid 10-digit contact number.",
        });
        return;
      }

      const formData = {
        workerName: name,
        workerEmail: email,
        workerJobRole: jobRole,
        workerContact: contact,
        workerAddress: address,
        workerSalary: salary,
        Wid: Wid,
      };

      const response = await fetch("/manager/userManagement/worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        if (result.isUpdate) {
          const existingCard = cardgrid.querySelector(
            `.info-card[data-id='${result.worker._id}']`
          );

          if (existingCard) {
            existingCard.innerHTML = `
              <div class="card-header">
                <div class="card-title">
                  ${result.worker.name}
                </div>
                <span class="card-id">#${result.worker._id
                  .toString()
                  .substring(0, 8)}</span>
              </div>
              <div class="card-body">
                <p><strong>Email:</strong> ${result.worker.email}</p>
                <p><strong>Job Role:</strong> ${result.worker.jobRole}</p>
                <p><strong>Contact:</strong> ${result.worker.contact}</p>
                <p><strong>Address:</strong> ${result.worker.address}</p>
              </div>
              <div class="card-actions">
                <button class="action-btn worker-edit edit" data-id="${
                  result.worker._id
                }">
                  <i class="bi bi-pencil"></i>Edit
                </button>
                <button class="action-btn worker-delete delete" data-id="${
                  result.worker._id
                }">
                  <i class="bi bi-trash"></i>Delete
                </button>
              </div>
            `;
            closeForm("worker");
            notyf.success("Worker updated successfully!");
          } else {
            notyf.error("No worker found.");
          }
        } else {
          const newCard = document.createElement("div");
        newCard.className = "info-card";
        newCard.setAttribute("data-id", result.worker._id);
        newCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">
            ${result.worker.name}
          </div>
          <span class="card-id">#${result.worker._id
            .toString()
            .substring(0, 8)}</span>
        </div>
        <div class="card-body">
          <p><strong>Email:</strong> ${result.worker.email}</p>
          <p><strong>Job Role:</strong> ${result.worker.jobRole}</p>
          <p><strong>Contact:</strong> ${result.worker.contact}</p>
          <p><strong>Address:</strong> ${result.worker.address}</p>
        </div>
        <div class="card-actions">
          <button class="action-btn worker-edit edit" data-id="${
            result.worker._id
          }">
            <i class="bi bi-pencil"></i>Edit
          </button>
          <button class="action-btn worker-delete delete" data-id="${
            result.worker._id
          }">
            <i class="bi bi-trash"></i>Delete
          </button>
        </div>
      `;

        if (emptyState) emptyState.remove();

        cardgrid.appendChild(newCard);
        closeForm("worker");
        notyf.success("Worker added successfully!");
        }
      } else {
        notyf.error(result.error || "Failed to update worker settings.");
      }

      submitBtn.innerHTML = "Submit";
      submitBtn.disabled = false;
    });
});
