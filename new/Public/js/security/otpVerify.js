document.addEventListener('DOMContentLoaded', () => {
    // OTP input functionality
    const otpInputs = document.querySelectorAll('.otp-inputs input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        // Allow backspace to go to previous input
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && input.value === '' && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    

    // Handle window resize to adjust content layout if needed
    window.addEventListener('resize', () => {
        // Add any additional resize handling if needed
    });
});