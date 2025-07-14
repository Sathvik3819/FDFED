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
});
