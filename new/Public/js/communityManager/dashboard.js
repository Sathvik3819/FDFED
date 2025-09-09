
document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".info-card");

  cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";

    setTimeout(() => {
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 200 + index * 100);
  });

  const addMember = document.querySelector(".add-member-section");
  if (addMember) {
    addMember.addEventListener("click", function () {
      alert("Redirecting to member registration form...");
    });
  }

  const ctx = document.getElementById("financialChart").getContext("2d");
  const financialChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["January", "February", "March", "April", "May", "June"],
      datasets: [
        {
          label: "Payments Received",
          data: [12000, 1000, 13000, 170000, 16000, 18000],
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        }
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
});
