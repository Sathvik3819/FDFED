document.addEventListener("DOMContentLoaded", function () {
    const tasks = [
        { id: "UE-002", details: "Leaking kitchen faucet", location: "Block-A, flat no 202", date: "19-4-2025", status: "completed", rating: 5, feedbackDesc: "Quick and efficient service!" },
        { id: "UE-043", details: "AC not working", location: "Block-A, flat no 002", date: "16-4-2025", status: "completed", rating: 4, feedbackDesc: "Resolved issue, but took some time." },
        { id: "UE-096", details: "Sliding door track repair", location: "Block-C, flat no 024", date: "11-4-2025", status: "completed", rating: 5, feedbackDesc: "Great job, very professional!" },
        { id: "UE-116", details: "Window door repair", location: "Block-D, flat no 064", date: "12-4-2025", status: "completed", rating: 5, feedbackDesc: "Very well done!" },
        { id: "UE-143", details: "Door handle repair", location: "Block-C, flat no 023", date: "11-4-2025", status: "completed", rating: 4, feedbackDesc: "Satisfactory work, minor issues remain." },
        { id: "UE-232", details: "Sliding door track repair", location: "Block-B, flat no 089", date: "06-4-2025", status: "completed", rating: 5, feedbackDesc: "Smooth experience, no issues." },
        { id: "UE-321", details: "AC repair", location: "Block-C, flat no 051", date: "23-4-2025", status: "completed", rating: 5, feedbackDesc: "Perfect fix, highly recommended!" },
        { id: "UE-215", details: "Sliding door track repair", location: "Block-A, flat no 456", date: "14-4-2025", status: "completed", rating: 5, feedbackDesc: "Very polite and efficient team." }
    ];

    const tableBody = document.getElementById("taskTable");
    const detailsSection = document.getElementById("taskDetails");

    tasks.forEach(task => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${task.id}</td>
            <td>${task.details}</td>
            <td>${task.location}</td>
            <td>${task.date}</td>
            <td><span class="status">${task.status}</span></td>
            <td class="feedback">${getStars(task.rating)}</td>
        `;

        row.addEventListener("click", () => showTaskDetails(task));

        tableBody.appendChild(row);
    });

    function getStars(rating) {
        let stars = "";
        for (let i = 0; i < rating; i++) {
            stars += `<img src="../imgs/star.png" alt="star" height="20px" width="20px">`;
        }
        return stars;
    }

    function showTaskDetails(task) {
        document.getElementById("detailTaskId").textContent = task.id;
        document.getElementById("detailDetails").textContent = task.details;
        document.getElementById("detailLocation").textContent = task.location;
        document.getElementById("detailCompletedOn").textContent = task.date;
        document.getElementById("detailStatus").textContent = task.status;
        document.getElementById("detailFeedback").innerHTML = getStars(task.rating);
        document.getElementById("detailFeedbackDesc").textContent = task.feedbackDesc;

        detailsSection.style.display = "block";
    }
});
