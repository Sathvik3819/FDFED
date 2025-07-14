document.addEventListener('DOMContentLoaded', function () {
    // Tabs and content sections
    const tabs = document.querySelectorAll('.tab');
    const profileContent = document.getElementById('profileContent');
    const passwordContent = document.getElementById('passwordContent');
    const accountContent = document.getElementById('accountContent'); // Might not exist in current HTML

    // Set default visible content
    if (profileContent) profileContent.style.display = 'block';
    if (passwordContent) passwordContent.style.display = 'none';
    if (accountContent) accountContent.style.display = 'none';

    // Handle tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding tab content
            const selectedTab = this.getAttribute('data-tab');
            if (profileContent) profileContent.style.display = (selectedTab === 'profile') ? 'block' : 'none';
            if (passwordContent) passwordContent.style.display = (selectedTab === 'password') ? 'block' : 'none';
            if (accountContent) accountContent.style.display = (selectedTab === 'account') ? 'block' : 'none';
        });
    });

    

    // Profile picture upload preview
    const uploadInput = document.getElementById('upload');
    const profileIcon = document.querySelector('.profile-icon');

    if (uploadInput && profileIcon) {
        uploadInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    profileIcon.style.backgroundImage = `url(${e.target.result})`;
                    profileIcon.style.backgroundSize = 'cover';
                    profileIcon.textContent = ''; // Remove icon emoji
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Sidebar toggle (for mobile)
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar'); // Make sure sidebar has class="sidebar"

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
});
