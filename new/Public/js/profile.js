
const notyf = new Notyf({
  duration: 3000,
  position: { x: "center", y: "top" },
  types: [
    { type: "warning", background: "orange", icon: false },
    { type: "info", background: "blue", icon: false },
  ],
});

function showSection(sectionId, activeTabId) {
  
  document.querySelectorAll(".form-section").forEach((section) => {
    section.classList.add("d-none");
  });

  
  document.getElementById(sectionId).classList.remove("d-none");

  
  document.querySelectorAll(".toggle-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  
  document.getElementById(activeTabId).classList.add("active");
}

function validateForm() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName")?.value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address")?.value.trim();

  const nameRegex = /^[A-Za-z]+$/;
  if (!nameRegex.test(firstName) && lastName !== undefined) {
    notyf.error("First Name should contain only letters and no spaces.");
    return false;
  }

  if (lastName && !nameRegex.test(lastName)) {
    notyf.error("Last Name should contain only letters and no spaces.");
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    notyf.error("Please enter a valid email address.");
    return false;
  }

  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone)) {
    notyf.error("Phone number should be exactly 10 digits.");
    return false;
  }

  if (address !== undefined && address === "") {
    notyf.error("Address cannot be empty.");
    return false;
  }

  return true;
}

// Initialize the page with profile section visible
document.addEventListener("DOMContentLoaded", () => {
  showSection("profileSection", "profileTab");

  // Add animation 
  const sections = document.querySelectorAll(".form-section");
  sections.forEach((section, index) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(20px)";

    setTimeout(() => {
      section.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      section.style.opacity = "1";
      section.style.transform = "translateY(0)";
    }, index * 100);
  });

  document
    .getElementById("passwordForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const type = document
        .querySelector("#passwordForm")
        .getAttribute("type");

      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (newPassword !== confirmPassword) {
        notyf.error("New Password and Confirm Password do not match.");
        return;
      }

      if (newPassword.length < 8) {
        notyf.error("Password must be at least 8 characters long.");
        return;
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        notyf.error("All fields are required.");
        return;
      }

      try {
        const response = await fetch(`/${type}/profile/changePassword`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cp:currentPassword, np:newPassword }),
        });

        const result = await response.json();
        if (result.success || result.ok) {
          notyf.success(result.message);
          document.getElementById("passwordForm").reset();
        } else {
          notyf.error(result.message);
        }
      } catch (error) {
        console.error("Password change error:", error);
        notyf.error("Something went wrong while changing password.");
      }
    });

  document
    .getElementById("profileForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      const formData = new FormData(this);


      const type = document.querySelector("#profileForm").getAttribute("type");
      const url = `/${type}/profile`;
      const imageInput = document.getElementById("image");

      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        console.log("Profile update result:", result);

        if (result.success) {
          if (type === "resident") {
            document.getElementById("firstName").value =
              result.r.residentFirstname;
            document.getElementById("lastName").value =
              result.r.residentLastname;
            document.getElementById("email").value = result.r.email;
            document.getElementById("phone").value = result.r.contact;
            document.getElementById(
              "address"
            ).value = `${result.r.uCode}`;
          } else {
            document.getElementById("firstName").value = result.r.name;
            document.getElementById("email").value = result.r.email;
            document.getElementById("phone").value = result.r.contact;
          }

          const profileImg = document.querySelector(
            ".profile-image-container img"
          );
          if (result.r.image) {
            profileImg.src = `http://localhost:3000/${result.r.image.replace(
              /\\/g,
              "/"
            )}`;
          } else if (imageInput?.files[0]) {
            profileImg.src = URL.createObjectURL(imageInput?.files[0]);
          }

          notyf.success(result.message);
        } else {
          notyf.error(result.message);
        }
      } catch (err) {
        console.error("Profile update error:", err);
        notyf.error("Something went wrong while saving your profile.");
      }
    });
});
