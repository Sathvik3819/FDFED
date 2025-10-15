const notyf = new Notyf({
    duration: 3000,
    position: { x: "center", y: "top" },
    dismissible: true,
});

let allIssues = [];
let isRefreshing = false;
let autoRefreshInterval;

function openForm(formType) {
    if (formType === "issue") {
        document.getElementById("issueFormPopup").style.display = "flex";
    }
}

function closeForm(formType) {
    if (formType === "issue") {
        document.getElementById("issueFormPopup").style.display = "none";
    }
}

function updateStats(issues) {
    const pendingCount = issues?.filter(i => i.status === 'Pending').length;
    const inProgressCount = issues?.filter(i => i.status === 'In Progress' || i.status === 'Assigned').length;
    const resolvedCount = issues?.filter(i => i.status === 'Resolved').length;

    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('inProgressCount').textContent = inProgressCount;
    document.getElementById('resolvedCount').textContent = resolvedCount;
}

function updateIssueCards(issues) {
    const container = document.querySelector(".issues-grid");
    container.innerHTML = ""; // Clear existing cards

    if (issues?.length === 0) {
        container.innerHTML = `
            <div class="no-bookings d-flex gap-3 justify-content-center align-items-center text-muted">
                <i class="bi bi-tools"></i>
                <p>No issues found</p>
            </div>`;
        return;
    }

    issues?.forEach(is => {
        let actionButton = '';
        if (is.status === "Pending") {
            actionButton = `<button class="action-btn delete"><i class="bi bi-trash"></i>Cancel</button>`;
        } else if (is.status === "Review Pending") {
            actionButton = `<button class="action-btn review-btn" data-id="${is._id}">Review</button>`;
        } else if (is.status === "Payment Pending") {
            actionButton = `<button class="action-btn pay-btn" data-id="${is._id}">Pay</button>`;
        }

        const card = `
            <div class="issue-card" data-id="${is._id}">
                <div class="issue-card-header">
                    <h5>${is.title}</h5>
                    <span class="status-badge status-${is.status.replace(/\s/g, "")} ${is.status === "Review Pending" ? "review" : ""} ${is.status === "Payment Pending" ? "paymentPending" : ""}">
                        ${is.status}
                    </span>
                </div>
                <div class="issue-card-body">
                    <p><strong>Tracking ID:</strong> ${is.issueID}</p>
                    <p><strong>Category:</strong> ${is.title}</p>
                    <p><strong>Worker Assigned:</strong> ${is.workerAssigned ? is.workerAssigned.name : "-"}</p>
                </div>
                <div class="issue-card-actions">
                    <button class="action-btn view" data-id="${is._id}">
                        <i class="bi bi-eye"></i>View
                    </button>
                    ${actionButton}
                </div>
            </div>`;
        container.insertAdjacentHTML("beforeend", card);
    });
}

async function refreshIssues() {
    if (isRefreshing) return;
    isRefreshing = true;

    const refreshBtn = document.getElementById('manualRefresh');
    const refreshStatus = document.getElementById('refreshStatus');

    refreshBtn?.classList.add('loading-indicator');
    refreshStatus.textContent = 'Refreshing...';
    refreshStatus.classList.add('show');

    try {
        const response = await fetch('/resident/api/issues',{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch issues');
        }
        const data = await response.json();
        allIssues = data.issues;
        console.log(data);
        

        updateIssueCards(allIssues);
        updateStats(allIssues);

        notyf.success('Issues updated!');
    } catch (error) {
        console.error('Refresh error:', error);
        notyf.error('Could not refresh issues.');
    } finally {
        isRefreshing = false;
        refreshBtn?.classList.remove('loading-indicator');
        setTimeout(() => {
            refreshStatus.classList.remove('show');
        }, 2000);
    }
}

function startAutoRefresh() {
    autoRefreshInterval = setInterval(refreshIssues, 30000); // Refresh every 30 seconds
}

function stopAutoRefresh() {
    clearInterval(autoRefreshInterval);
}


async function openIssuePopup(data) {
    try {
        const response = await fetch(`/resident/getIssueData/${data}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const issueData = await response.json();

        if (!response.ok) {
            console.error("Failed to fetch issue data:", issueData);
            return;
        }

        const progressLine = document.querySelector(".progress-indicator");
        const steps = document.querySelectorAll(".step");
        const status = issueData.status;

        // Reset progress line and steps
        progressLine.style.width = "0%";
        steps.forEach((step) => {
            step.querySelector(".step-icon").classList.remove("step-icon-completed");
        });
        // Update progress line and steps based on status
        if (status === "Pending") {
            progressLine.style.width = "0%";
            steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
        } else if (status === "In Progress") {
            progressLine.style.width = "28%";
            steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[1].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[2].querySelector(".step-icon").classList.add("step-icon-completed");
        } else if (status === "Assigned") {
            progressLine.style.width = "14%";
            steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[1].querySelector(".step-icon").classList.add("step-icon-completed");
        } else if (status === "Review Pending") {
            progressLine.style.width = "56%";
            steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[1].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[2].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[3].querySelector(".step-icon").classList.add("step-icon-completed");
        } else if (status === "Payment Pending") {
            progressLine.style.width = "84%";
            steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[1].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[2].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[3].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[4].querySelector(".step-icon").classList.add("step-icon-completed");
        } else if (status === "Resolved") {
            progressLine.style.width = "100%";
            steps[0].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[1].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[2].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[3].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[4].querySelector(".step-icon").classList.add("step-icon-completed");
            steps[5].querySelector(".step-icon").classList.add("step-icon-completed");
        }

        document.getElementById("popupTrackingId").textContent =
            issueData.issueID || "-";
        document.getElementById("popupTitle").textContent = issueData.title || "-";

        const popupStatusElement = document.getElementById("popupStatus");
        popupStatusElement.textContent = issueData.status || "-";
        popupStatusElement.className = `status-badge status-${issueData.status.replace(
      /\s/g,
      ""
    )}`;

        if (issueData.status === "Review Pending") {
            popupStatusElement.classList.add("review");
        } else if (issueData.status === "Payment Pending") {
            popupStatusElement.classList.add("paymentPending");
        }

        document.getElementById("popupDescription").textContent =
            issueData.description || "-";
        document.getElementById("popupDate").textContent =
            new Date(issueData.createdAt).toLocaleDateString() || "-";
        document.getElementById("popupDeadline").textContent =
            issueData.deadline ?
            new Date(issueData.deadline).toLocaleDateString() :
            "-";


        // Worker section
        const worker = issueData.workerAssigned;
        const workerSection = document.getElementById("workerDetails");

        if (worker && worker.name) {
            workerSection.style.display = "grid";
            document.getElementById("popupWorkerName").textContent =
                worker.name || "-";
            document.getElementById("popupWorkerContact").textContent =
                worker.contact || "-";
            document.getElementById("popupWorkerSpecialization").textContent =
                worker.jobRole || "-";
        } else {
            workerSection.style.display = "none";
        }

        // Payment section
        const paymentDetailsSection = document.querySelector(".payment-details");
        if (issueData.payment) {
            paymentDetailsSection.style.display = "grid";
            document.getElementById("popupAmount").textContent = issueData.payment.amount ?
                `₹${issueData.payment.amount}` :
                "-";
            const popupPaymentStatusElement =
                document.getElementById("popupPaymentStatus");
            popupPaymentStatusElement.textContent = issueData.payment.status || "-";
            popupPaymentStatusElement.className = `status-badge status-${issueData.payment?.status?.replace(
        /\s/g,
        ""
      )}`;
        } else {
            paymentDetailsSection.style.display = "none";
        }

        // Show cancel button only if status is Pending
        const cancelBtn = document.getElementById("cancelBtn");
        cancelBtn.style.display = issueData.status === "Pending" ? "block" : "none";
        // Set the issue ID for cancellation
        cancelBtn.setAttribute("data-id", issueData._id);

        // Show popup
        document.getElementById("issuePopup").style.display = "flex";
    } catch (error) {
        console.error("Error fetching issue:", error);
        alert("An error occurred while fetching issue details.");
    }
}

function closePopup() {
    document.getElementById("issuePopup").style.display = "none";
}

window.onclick = function (event) {
    const popup = document.getElementById("issuePopup");
    const issueFormPopup = document.getElementById("issueFormPopup");
    const feedbackCon = document.getElementById("feedbackCon");

    if (event.target === popup) {
        closePopup();
    }
    if (event.target === issueFormPopup) {
        closeForm("issue");
    }
    if (event.target === feedbackCon) {
        closeFeedbackForm();
    }
};

function closeFeedbackForm() {
    document.getElementById("feedbackCon").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
    const issuesGrid = document.querySelector(".issues-grid");
    const cancelFeedbackBtn = document.querySelector(".cancel-feedback");
    const cancelIssueBtnPopup = document.getElementById("cancelBtn");
    const issueForm = document.getElementById("issueForm");

    document.getElementById('manualRefresh')?.addEventListener('click', refreshIssues);
    startAutoRefresh();
    window.addEventListener('beforeunload', stopAutoRefresh);

    issueForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const formData = new FormData(issueForm);
        const formObject = Object.fromEntries(formData.entries());

        try {
            const response = await fetch("/resident/issueRaising", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formObject),
            });

            const result = await response.json();
            if (response.ok) {
                notyf.success("Issue raised successfully!");
                closeForm("issue");
                issueForm.reset();
                setTimeout(refreshIssues, 500);
            } else {
                notyf.error(result.message);
            }
        } catch (error) {
            console.error("Error raising issue:", error);
            notyf.error("An error occurred while raising the issue.");
        }
    });

    document.getElementById("feedbackForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        const formData = new FormData(this);
        const formObject = Object.fromEntries(formData.entries());

        try {
            const response = await fetch("/resident/submitFeedback", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formObject),
            });
            const result = await response.json();

            if (result.success) {
                notyf.success("Feedback submitted successfully!");
                closeFeedbackForm();
                this.reset();
                setTimeout(refreshIssues, 500);
            } else {
                notyf.error(result.message || "Failed to submit feedback.");
            }
        } catch (error) {
            console.error("Error submitting feedback:", error);
            notyf.error("An error occurred while submitting feedback.");
        }

    })

    issuesGrid.addEventListener("click", async function (event) {
        const issueCard = event.target.closest(".issue-card");
        if (!issueCard) return;

        const issueID = issueCard.getAttribute("data-id");

        const deleteBtn = event.target.closest(".action-btn.delete");
        if (deleteBtn) {
            if (confirm("Are you sure you want to cancel this issue?")) {
                try {
                    const response = await fetch(`/resident/deleteIssue/${issueID}`, {
                        method: "POST",
                    });
                    const result = await response.json();
                    if (result.success) {
                        notyf.success("Issue cancelled successfully!");
                        setTimeout(refreshIssues, 500);
                    } else {
                        notyf.error(result.error || "Failed to cancel issue.");
                    }
                } catch (error) {
                    console.error("Error cancelling issue:", error);
                    notyf.error("Error cancelling issue. Please try again.");
                }
            }
        }

        const viewBtn = event.target.closest(".action-btn.view");
        if (viewBtn) {
            openIssuePopup(issueID);
        }

        const reviewBtn = event.target.closest(".action-btn.review-btn");
        if (reviewBtn) {
            document.getElementById("feedbackCon").style.display = "flex";
            document.getElementById("issueId").value = issueID;
        }

        const payBtn = event.target.closest(".action-btn.pay-btn");
        if (payBtn) {
            window.location.href = `/resident/payments`;
        }
    });

    cancelFeedbackBtn.addEventListener("click", function () {
        closeFeedbackForm();
    });

    cancelIssueBtnPopup.addEventListener("click", async function () {
        const issueID = cancelIssueBtnPopup.getAttribute("data-id");
        if (confirm("Are you sure you want to cancel this issue?")) {
            try {
                const response = await fetch(`/resident/deleteIssue/${issueID}`, {
                    method: "DELETE",
                });
                const result = await response.json();
                if (response.ok) {
                    notyf.success("Issue cancelled successfully!");
                    closePopup();
                    setTimeout(refreshIssues, 500);
                } else {
                    notyf.error(result.error || "Failed to cancel issue.");
                }
            } catch (error) {
                console.error("Error cancelling issue:", error);
                notyf.error("Error cancelling issue. Please try again.");
            }
        }
    });
});