document.addEventListener("DOMContentLoaded", function () {
  const slides = document.querySelectorAll(".ad-slide");
  let currentSlide = 0;

  if (slides.length > 0) {
    slides[currentSlide].classList.add("active");

    setInterval(() => {
      slides[currentSlide].classList.remove("active");
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add("active");
    }, 3000);
  }

  const logOut = document.querySelector(".log-out");

  logOut.addEventListener("click", async () => {
    try {
      const res = await fetch("/logout", {
        method: "GET",
      });

      const response = await res.json();

      if (response.success) {
        // If the server responds with a redirect, follow it manually
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  });
});

document.addEventListener("DOMContentLoaded", async function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", function () {
      mobileMenu.classList.toggle("show");

      // Change the icon based on menu state
      const icon = this.querySelector("i");
      if (mobileMenu.classList.contains("show")) {
        icon.classList.remove("bi-list");
        icon.classList.add("bi-x");
      } else {
        icon.classList.remove("bi-x");
        icon.classList.add("bi-list");
      }
    });

    // Close menu when clicking on a link (optional)
    const menuLinks = mobileMenu.querySelectorAll("a");
    menuLinks.forEach((link) => {
      link.addEventListener("click", function () {
        mobileMenu.classList.remove("show");
        const icon = menuToggle.querySelector("i");
        icon.classList.remove("bi-x");
        icon.classList.add("bi-list");
      });
    });
  }

  const notification = document.querySelector(".notification");
  const nottip = document.querySelector(".notif-tooltip");
  const notc = document.querySelector(".notif-count");
  let o = 0;
  if (notification) {
    notification.addEventListener("click", async function () {
      
      if (!o) {
        nottip.style.display = "flex";
        o = 1;
      } else {
        nottip.style.display = "none";
        console.log("clearing");
        o = 0;
      }
    });
  }
});

  // const response = await fetch("/resident/clearNotification", {
  //         method: "GET",
  //       });
  //       const res = await response.json();
  //       if (!res.ok) {
  //         alert("error in clearing notifications");
  //       }
