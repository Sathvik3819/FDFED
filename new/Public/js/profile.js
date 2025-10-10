const notyf = new Notyf({
  duration: 3000,
  position: { x: "center", y: "top" },
  types: [
    { type: "warning", background: "orange", icon: false },
    { type: "info", background: "blue", icon: false },
  ],
});

function showSection(sectionId, activeTabId) {
  // Hide all sections
  document.querySelectorAll(".form-section").forEach((section) => {
    section.classList.add("d-none");
  });

  // Show selected section
  document.getElementById(sectionId).classList.remove("d-none");

  // Remove active class from all tabs
  document.querySelectorAll(".toggle-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Add active class to clicked tab
  document.getElementById(activeTabId).classList.add("active");
}

// Initialize the page with profile section visible
document.addEventListener("DOMContentLoaded", () => {
  showSection("profileSection", "profileTab");

  // Add animation to form sections
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

      const cp = document.getElementById("currentPassword").value;
      const np = document.getElementById("newPassword").value;
      const cnp = document.getElementById("confirmPassword").value;

      if (np !== cnp) {
        alert("New Password and Confirm Password do not match.");
        return;
      }

      const response = await fetch(`/${type}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cp, np, cnp }),
      });

      const result = await response.json();
      if (result.success){
        notyf.success(result.message);
        document.getElementById("passwordForm").reset();
      }else{
        notyf.error(result.message);
      }
    });

  document
    .getElementById("profileForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();

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
