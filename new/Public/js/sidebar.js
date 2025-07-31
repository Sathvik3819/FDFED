document.addEventListener("DOMContentLoaded", function () {
  const slides = document.querySelectorAll(".ad-slide");
  let current = 0;

  if (slides.length === 0) return; // No active ads

  // Show the first slide initially
  slides[current].classList.add("active");

  setInterval(() => {
    // Hide current
    slides[current].classList.remove("active");

    // Move to next
    current = (current + 1) % slides.length;

    // Show new
    slides[current].classList.add("active");
  }, 3000); // change every 3 seconds
});
