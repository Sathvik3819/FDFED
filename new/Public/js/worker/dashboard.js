// Sample data for tasks
const tasks = [
    {
        id: 'UE-002',
        details: 'Leaking kitchen faucet',
        location: 'Block-A , flat no 202',
        dueDate: '19-4-2025',
        status: 'In progress'
    },
    {
        id: 'UE-043',
        details: 'AC not working',
        location: 'Block-A , flat no 002',
        dueDate: '16-4-2025',
        status: 'In progress'
    },
    {
        id: 'UE-002',
        details: 'sliding door track repair',
        location: 'Block-C , flat no 024',
        dueDate: '11-4-2025',
        status: 'In progress'
    }
];

// Function to populate the tasks table
function populateTasksTable() {
    const tableBody = document.getElementById('tasksTableBody');
    tableBody.innerHTML = '';

    tasks.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.id}</td>
            <td>${task.details}</td>
            <td>${task.location}</td>
            <td>${task.dueDate}</td>
            <td><div class="status-badge">${task.status}</div></td>
        `;
        tableBody.appendChild(row);
    });
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    populateTasksTable();

});

