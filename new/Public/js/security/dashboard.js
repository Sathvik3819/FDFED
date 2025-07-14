// const activityData = [
//     { visitor: "Likith Grandhe", purpose: "Meeting", time: "4:30 PM", status: "active" },
//     { visitor: "Likith Grandhe", purpose: "Meeting", time: "4:30 PM", status: "active" },
//     { visitor: "Likith Grandhe", purpose: "Meeting", time: "4:30 PM", status: "checked" },
//     { visitor: "Likith Grandhe", purpose: "Meeting", time: "4:30 PM", status: "pending" }
// ];

// // Stats counters
// let totalVisitors = 20;
// let pendingApprovals = 3;
// let activeVisitors = 13;

// // DOM elements
// const totalVisitorsEl = document.getElementById('total-visitors');
// const pendingApprovalsEl = document.getElementById('pending-approvals');
// const activeVisitorsEl = document.getElementById('active-visitors');
// const activityTable = document.getElementById('activity-table');
// const addVisitorBtn = document.getElementById('add-visitor-btn');

// // Initialize the dashboard
// function initDashboard() {
//     // Update stats
//     updateStats();

//     // Populate activity table
//     populateActivityTable();


//     // Handle window resize
//     window.addEventListener('resize', handleResize);
// }

// // Handle window resize
// function handleResize() {
//     // Add any additional resize handling if needed
// }

// // Update stats display
// function updateStats() {
//     totalVisitorsEl.textContent = totalVisitors;
//     pendingApprovalsEl.textContent = pendingApprovals;
//     activeVisitorsEl.textContent = activeVisitors;
// }

// // Populate activity table with data
// function populateActivityTable() {
//     const tbody = activityTable.querySelector('tbody');
//     tbody.innerHTML = '';

//     activityData.forEach(activity => {
//         const row = document.createElement('tr');

//         // Create visitor cell
//         const visitorCell = document.createElement('td');
//         visitorCell.textContent = activity.visitor;

//         // Create purpose cell
//         const purposeCell = document.createElement('td');
//         purposeCell.textContent = activity.purpose;

//         // Create time cell
//         const timeCell = document.createElement('td');
//         timeCell.textContent = activity.time;

//         // Create status cell with badge
//         const statusCell = document.createElement('td');
//         const statusBadge = document.createElement('span');
//         statusBadge.textContent = capitalizeFirstLetter(activity.status);
//         statusBadge.classList.add('status-badge', `status-${activity.status}`);
//         statusCell.appendChild(statusBadge);

//         // Append cells to row
//         row.appendChild(visitorCell);
//         row.appendChild(purposeCell);
//         row.appendChild(timeCell);
//         row.appendChild(statusCell);

//         // Append row to table body
//         tbody.appendChild(row);
//     });
// }

// // Add new visitor function (mock implementation)
// function addNewVisitor() {
//     // In a real application, this would open a form or modal
//     // For this demo, we'll just add a new visitor to the table
//     const newVisitor = {
//         visitor: "New Visitor",
//         purpose: "Interview",
//         time: getCurrentTime(),
//         status: "active"
//     };

//     // Add to activity data
//     activityData.unshift(newVisitor);

//     // Update stats
//     totalVisitors++;
//     activeVisitors++;

//     // Update UI
//     updateStats();
//     populateActivityTable();

//     // Show confirmation
//     alert("New visitor added successfully!");
// }

// // Helper function to get current time
// function getCurrentTime() {
//     const now = new Date();
//     let hours = now.getHours();
//     const minutes = now.getMinutes();
//     const ampm = hours >= 12 ? 'PM' : 'AM';

//     hours = hours % 12;
//     hours = hours ? hours : 12; // the hour '0' should be '12'

//     return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
// }

// // Helper function to capitalize first letter
// function capitalizeFirstLetter(string) {
//     return string.charAt(0).toUpperCase() + string.slice(1);
// }

// // Initialize the dashboard when the DOM is loaded
// document.addEventListener('DOMContentLoaded', initDashboard);