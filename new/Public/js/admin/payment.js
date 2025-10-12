// Global variables
let currentPage = 1;
let currentFilters = {};
let allTransactions = [];
let revenueChart, paymentsPieChart;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
});

// Initialize dashboard
async function initializeDashboard() {
    try {
        showLoading();
        await loadTransactions();
        await initializeCharts();
        hideLoading();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // Status filter tabs
    document.querySelectorAll('#statusTabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', handleStatusTabClick);
    });

    // Date filter tabs
    document.querySelectorAll('#dateTabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', handleDateTabClick);
    });

    // Plan filter dropdown
    document.getElementById('planFilter').addEventListener('change', handlePlanFilterChange);

    // Time period tabs for revenue chart
    document.querySelectorAll('.chart-card .tab-btn').forEach(btn => {
        btn.addEventListener('click', handleChartTabClick);
    });

    // Modal close on backdrop click
    document.getElementById('paymentModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Handle status tab click
function handleStatusTabClick(event) {
    const clickedTab = event.target;
    const status = clickedTab.getAttribute('data-status');
    
    // Remove active class from all status tabs
    document.querySelectorAll('#statusTabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked tab
    clickedTab.classList.add('active');
    
    // Update filter
    if (status) {
        currentFilters.status = status;
    } else {
        delete currentFilters.status;
    }
    
    currentPage = 1;
    loadTransactions(currentPage);
}

// Handle date tab click
function handleDateTabClick(event) {
    const clickedTab = event.target;
    const period = clickedTab.getAttribute('data-period');
    
    // Remove active class from all date tabs
    document.querySelectorAll('#dateTabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked tab
    clickedTab.classList.add('active');
    
    // Update filter
    setDateFilter(period);
    
    currentPage = 1;
    loadTransactions(currentPage);
}

// Handle plan filter change
function handlePlanFilterChange(event) {
    const value = event.target.value;
    
    if (value) {
        currentFilters.planType = value;
    } else {
        delete currentFilters.planType;
    }
    
    currentPage = 1;
    loadTransactions(currentPage);
}

// Handle chart tab click
function handleChartTabClick(event) {
    const clickedTab = event.target;
    const timePeriod = clickedTab.getAttribute('data-period');
    
    // Get parent chart card to update only its tabs
    const chartCard = clickedTab.closest('.chart-card');
    
    // Remove active class from tabs in this chart only
    chartCard.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked tab
    clickedTab.classList.add('active');
    
    // Update revenue chart
    updateRevenueChart(timePeriod);
}

// Load transactions with filters
async function loadTransactions(page = 1) {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: 50,
            ...currentFilters
        });

        const response = await fetch(`/admin/api/payments/transactions?${params}`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        
        const data = await response.json();
        
        if (data.success) {
            allTransactions = data.transactions;
            updateTransactionsTable(data.transactions);
            
            updateStatistics(data.summary);
        } else {
            throw new Error(data.error || 'Failed to load transactions');
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        showError('Failed to load transactions');
    }
}

// Update statistics cards
function updateStatistics(summary = null) {
    if (summary) {
        document.getElementById('totalRevenue').textContent = `₹${formatCurrency(summary.totalAmount)}`;
        document.getElementById('totalTransactions').textContent = summary.completedCount;
        document.getElementById('pendingPayments').textContent = summary.pendingCount;
        document.getElementById('failedPayments').textContent = summary.failedCount;
    } else {
        // Calculate from current transactions if summary not provided
        const completed = allTransactions.filter(t => t.status === 'completed');
        const pending = allTransactions.filter(t => t.status === 'pending');
        const failed = allTransactions.filter(t => t.status === 'failed');
        
        const totalRevenue = completed.reduce((sum, t) => sum + t.amount, 0);
        
        document.getElementById('totalRevenue').textContent = `₹${formatCurrency(totalRevenue)}`;
        document.getElementById('totalTransactions').textContent = completed.length;
        document.getElementById('pendingPayments').textContent = pending.length;
        document.getElementById('failedPayments').textContent = failed.length;
    }
}

// Update transactions table
function updateTransactionsTable(transactions) {
    const tbody = document.getElementById('paymentsTableBody');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    No transactions found
                </td>
            </tr>
        `;
        return;
    }

    // Show only first 10 transactions
    const limitedTransactions = transactions.slice(0, 10);

    limitedTransactions.forEach(transaction => {
        const row = createTransactionRow(transaction);
        tbody.appendChild(row);
    });
}

// Create transaction table row
function createTransactionRow(transaction) {
    const row = document.createElement('tr');
    
    const statusClass = `status-${transaction.status}`;
    const planClass = `plan-${transaction.planType}`;
    
    row.innerHTML = `
        <td>
            <div style="font-weight: 500;">${escapeHtml(transaction.communityName)}</div>
            <div style="font-size: 12px; color: #666;">${escapeHtml(transaction.managerName)}</div>
        </td>
        <td>
            <code style="font-size: 12px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">
                ${transaction.transactionId || transaction._id}
            </code>
        </td>
        <td>
            <span class="status-badge plan-${transaction.planType}">${transaction.planType}</span>
        </td>
        <td style="font-weight: 600;">₹${formatCurrency(transaction.amount)}</td>
        <td>${transaction.paymentMethod || 'N/A'}</td>
        <td>${formatDate(transaction.paymentDate)}</td>
        <td>
            <span class="status-badge ${statusClass}">${transaction.status}</span>
        </td>
        <td>
            <div class="table-actions">
                
                ${transaction.status !== 'completed' ? `
                    <button class="btn btn-sm" onclick="updatePaymentStatus('${transaction.communityId}', '${transaction._id}', 'completed')">
                        Complete
                    </button>
                ` : ''}
            </div>
        </td>
    `;
    
    return row;
}

// View payment details modal
async function viewPaymentDetails(communityId, transactionId) {
    try {
        showLoading();
        
        const response = await fetch(`/admin/api/payments/community/${communityId}`);
        if (!response.ok) throw new Error('Failed to fetch payment details');
        
        const data = await response.json();
        
        if (data.success) {
            const transaction = data.subscriptionHistory.find(t => t._id === transactionId);
            if (transaction) {
                showPaymentModal(data.community, transaction, data);
            } else {
                showError('Transaction not found');
            }
        } else {
            throw new Error(data.error || 'Failed to load payment details');
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error loading payment details:', error);
        showError('Failed to load payment details');
        hideLoading();
    }
}

// Show payment details modal
function showPaymentModal(community, transaction, fullData) {
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div style="margin-bottom: 24px;">
            <h4 style="margin-bottom: 16px; color: #333;">Community Information</h4>
            <div class="detail-row">
                <span class="detail-label">Community Name:</span>
                <span class="detail-value">${escapeHtml(community.name)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${escapeHtml(community.email)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Manager:</span>
                <span class="detail-value">${escapeHtml(community.communityManager?.name || 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Current Plan:</span>
                <span class="detail-value">
                    <span class="status-badge plan-${community.subscriptionPlan}">${community.subscriptionPlan}</span>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Plan Status:</span>
                <span class="detail-value">
                    <span class="status-badge status-${community.subscriptionStatus}">${community.subscriptionStatus}</span>
                </span>
            </div>
        </div>
        
        <div style="margin-bottom: 24px;">
            <h4 style="margin-bottom: 16px; color: #333;">Transaction Details</h4>
            <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">
                    <code style="font-size: 12px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">
                        ${transaction.transactionId || transaction._id}
                    </code>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value" style="font-weight: 600; font-size: 16px;">₹${formatCurrency(transaction.amount)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Plan Type:</span>
                <span class="detail-value">
                    <span class="status-badge plan-${transaction.planType}">${transaction.planType}</span>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">${transaction.paymentMethod || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">${formatDate(transaction.paymentDate)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                    <span class="status-badge status-${transaction.status}">${transaction.status}</span>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Plan Duration:</span>
                <span class="detail-value">${formatDate(transaction.planStartDate)} - ${formatDate(transaction.planEndDate)}</span>
            </div>
        </div>
        
        <div style="margin-bottom: 24px;">
            <h4 style="margin-bottom: 16px; color: #333;">Payment Summary</h4>
            <div class="detail-row">
                <span class="detail-label">Total Revenue:</span>
                <span class="detail-value" style="font-weight: 600;">₹${formatCurrency(fullData.totalRevenue)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Transactions:</span>
                <span class="detail-value">${fullData.totalTransactions}</span>
            </div>
        </div>
        
        ${transaction.status !== 'completed' ? `
            <div style="padding-top: 20px; border-top: 1px solid #eee;">
                <h4 style="margin-bottom: 16px; color: #333;">Actions</h4>
                <div style="display: flex; gap: 12px;">
                    <button class="btn" onclick="updatePaymentStatus('${community._id}', '${transaction._id}', 'completed')">
                        ✅ Mark as Completed
                    </button>
                    <button class="btn btn-secondary" onclick="updatePaymentStatus('${community._id}', '${transaction._id}', 'failed')">
                        ❌ Mark as Failed
                    </button>
                </div>
            </div>
        ` : ''}
    `;
    
    document.getElementById('paymentModal').classList.add('show');
}

// Update payment status
async function updatePaymentStatus(communityId, transactionId, status) {
    if (!confirm(`Are you sure you want to mark this payment as ${status}?`)) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`/admin/api/payments/transaction/${communityId}/${transactionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: status,
                notes: `Status updated by admin on ${new Date().toLocaleString()}`
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(`Payment status updated to ${status}`);
            closeModal();
            await loadTransactions(currentPage);
        } else {
            throw new Error(data.error || 'Failed to update payment status');
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error updating payment status:', error);
        showError('Failed to update payment status');
        hideLoading();
    }
}

// Handle search
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        currentFilters.search = searchTerm;
    } else {
        delete currentFilters.search;
    }
    currentPage = 1;
    loadTransactions(currentPage);
}

// Set date filter
function setDateFilter(period) {
    const now = new Date();
    let startDate = null;
    
    switch(period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            delete currentFilters.startDate;
            delete currentFilters.endDate;
            return;
    }
    
    currentFilters.startDate = startDate.toISOString().split('T')[0];
    currentFilters.endDate = now.toISOString().split('T')[0];
}

// Update revenue chart with new time period
async function updateRevenueChart(timePeriod) {
    if (revenueChart) {
        const chartData = await fetchRevenueData(timePeriod);
        
        revenueChart.data.labels = chartData.labels;
        revenueChart.data.datasets[0].data = chartData.data;
        
        revenueChart.update();
    }
}

// Fetch revenue data from API
async function fetchRevenueData(timePeriod) {
    try {
        const response = await fetch(`/admin/api/payments/revenue-chart?timePeriod=${timePeriod}`);
        if (!response.ok) throw new Error('Failed to fetch revenue data');
        
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.error || 'Failed to load revenue data');
        }
    } catch (error) {
        console.error('Error fetching revenue data:', error);
        // Fallback to local data generation
        return generateRevenueData(timePeriod);
    }
}


// Change page
function changePage(page) {
    currentPage = page;
    loadTransactions(page);
}

// Initialize charts
async function initializeCharts() {
    await initializeRevenueChart();
    await initializePaymentsPieChart();
}

// Initialize revenue chart
async function initializeRevenueChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Get data from API based on current active tab
    const activeTab = document.querySelector('.chart-card .tab-btn.active');
    const timePeriod = activeTab ? activeTab.getAttribute('data-period') : 'monthly';
    const chartData = await fetchRevenueData(timePeriod);
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Revenue (₹)',
                data: chartData.data,
                borderColor: '#151A2D',
                backgroundColor: 'rgba(21, 26, 45, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#151A2D',
                pointBorderColor: '#151A2D',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Revenue: ₹' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Initialize payments pie chart
async function initializePaymentsPieChart() {
    const ctx = document.getElementById('paymentsPieChart').getContext('2d');
    
    // Get payment status data
    const pieData = generatePaymentsPieData();
    
    paymentsPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: pieData.labels,
            datasets: [{
                data: pieData.data,
                backgroundColor: [
                    '#16a34a',
                    '#f59e0b',
                    '#dc2626'
                ],
                borderColor: [
                    '#16a34a',
                    '#f59e0b',
                    '#dc2626'
                ],
                borderWidth: 2,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Generate revenue data based on time period
function generateRevenueData(timePeriod) {
    const now = new Date();
    let labels = [];
    let data = [];
    
    switch(timePeriod) {
        case 'weekly':
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                labels.push(dayName);
                
                const dayRevenue = allTransactions
                    .filter(t => {
                        const tDate = new Date(t.paymentDate);
                        return tDate.toDateString() === date.toDateString() && t.status === 'completed';
                    })
                    .reduce((sum, t) => sum + t.amount, 0);
                
                data.push(dayRevenue);
            }
            break;
            
        case 'monthly':
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                labels.push(monthName);
                
                const monthRevenue = allTransactions
                    .filter(t => {
                        const tDate = new Date(t.paymentDate);
                        return tDate.getFullYear() === date.getFullYear() && 
                               tDate.getMonth() === date.getMonth() &&
                               t.status === 'completed';
                    })
                    .reduce((sum, t) => sum + t.amount, 0);
                
                data.push(monthRevenue);
            }
            break;
            
        case 'yearly':
            // Last 5 years
            for (let i = 4; i >= 0; i--) {
                const year = now.getFullYear() - i;
                labels.push(year.toString());
                
                const yearRevenue = allTransactions
                    .filter(t => {
                        const tDate = new Date(t.paymentDate);
                        return tDate.getFullYear() === year && t.status === 'completed';
                    })
                    .reduce((sum, t) => sum + t.amount, 0);
                
                data.push(yearRevenue);
            }
            break;
    }
    
    return { labels, data };
}

// Generate payments pie chart data
function generatePaymentsPieData() {
    const completed = allTransactions.filter(t => t.status === 'completed').length;
    const pending = allTransactions.filter(t => t.status === 'pending').length;
    const failed = allTransactions.filter(t => t.status === 'failed').length;
    
    return {
        labels: ['Completed', 'Pending', 'Failed'],
        data: [completed, pending, failed]
    };
}

// Close modal
function closeModal() {
    document.getElementById('paymentModal').classList.remove('show');
}

// Refresh data
async function refreshData() {
    currentPage = 1;
    currentFilters = {};
    
    // Reset filters
    document.getElementById('searchInput').value = '';
    document.getElementById('planFilter').value = '';
    
    // Reset status tabs
    document.querySelectorAll('#statusTabs .tab-btn').forEach((btn, index) => {
        if (index === 0) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Reset date tabs
    document.querySelectorAll('#dateTabs .tab-btn').forEach((btn, index) => {
        if (index === 0) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    await loadTransactions(1);
    
    // Refresh charts
    if (revenueChart) {
        revenueChart.destroy();
        await initializeRevenueChart();
    }
    if (paymentsPieChart) {
        paymentsPieChart.destroy();
        await initializePaymentsPieChart();
    }
    
    showSuccess('Data refreshed successfully');
}

// Export data
function exportData() {
    const csvContent = generateCSV(allTransactions);
    downloadCSV(csvContent, 'payment_transactions.csv');
}

// Generate CSV from transactions
function generateCSV(transactions) {
    const headers = [
        'Community Name',
        'Manager Name',
        'Transaction ID',
        'Plan Type',
        'Amount',
        'Payment Method',
        'Payment Date',
        'Status',
        'Plan Start Date',
        'Plan End Date'
    ];
    
    const rows = transactions.map(t => [
        t.communityName,
        t.managerName,
        t.transactionId || t._id,
        t.planType,
        t.amount,
        t.paymentMethod || '',
        formatDate(t.paymentDate),
        t.status,
        formatDate(t.planStartDate),
        formatDate(t.planEndDate)
    ]);
    
    return [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
}

// Download CSV file
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN').format(amount);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading() {
    let loader = document.getElementById('loadingOverlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loadingOverlay';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-size: 18px;
            color: #333;
        `;
        loader.innerHTML = '🔄 Loading...';
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.style.display = 'none';
    }
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
    `;
    
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#4caf50';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            break;
        default:
            notification.style.backgroundColor = '#2196f3';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}