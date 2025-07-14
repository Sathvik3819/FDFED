document.addEventListener('DOMContentLoaded', function () {
    const today = new Date();
    const dateInput = document.getElementById('visitDate');
    dateInput.valueAsDate = today;

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('visitTime').value = `${hours}:${minutes}`;

    const typeButtons = document.querySelectorAll('.type-button');
    typeButtons.forEach(button => {
        button.addEventListener('click', function () {
            typeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    

    document.getElementById('cancelBtn').addEventListener('click', function () {
        if (confirm('Are you sure you want to cancel?')) {
            form.reset();
            // Reset visitor type
            typeButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelector('[data-type="guest"]').classList.add('active');
            // Reset date and time
            dateInput.valueAsDate = today;
            document.getElementById('visitTime').value = `${hours}:${minutes}`;
        }
    });

    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', function () {
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

        });
    });
});