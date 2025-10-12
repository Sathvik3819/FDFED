const icon = document.querySelector("#img");
const pass = document.querySelector("#password");

icon.addEventListener("click", () => {
    console.log("clicked");

    if (pass.type === "password") {
        pass.type = "text";
        icon.src = "../imgs/showPass.svg";
    } else {
        pass.type = "password";
        icon.src = "../imgs/hidePass.svg";
    }
});
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("LoginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const userTypeSelect = document.getElementById("userType");
  const toggleImg = document.getElementById("img");

  // Email format validation (regex)
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Show / Hide Password Toggle
  toggleImg.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggleImg.src = "../imgs/showPass.svg";
    } else {
      passwordInput.type = "password";
      toggleImg.src = "../imgs/hidePass.svg";
    }
  });

  // Validation handler
  form.addEventListener("submit", (e) => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const userType = userTypeSelect.value;

    // Clear any previous error borders
    [emailInput, passwordInput, userTypeSelect].forEach((el) => {
      el.style.border = "1px solid #ccc";
    });

    let valid = true;
    let errorMsg = "";

    if (!isValidEmail(email)) {
      valid = false;
      errorMsg = "Please enter a valid email address.";
      emailInput.style.border = "2px solid red";
    } else if (password.length < 6) {
      valid = false;
      errorMsg = "Password must be at least 6 characters long.";
      passwordInput.style.border = "2px solid red";
    } else if (!userType) {
      valid = false;
      errorMsg = "Please select your role.";
      userTypeSelect.style.border = "2px solid red";
    }

    if (!valid) {
      e.preventDefault();
      showAlert(errorMsg);
    }
  });

  // Show alert message
  function showAlert(message) {
    let alertBox = document.querySelector(".alert");
    if (!alertBox) {
      alertBox = document.createElement("div");
      alertBox.className = "alert";
      alertBox.style.background = "#ffcccc";
      alertBox.style.color = "#900";
      alertBox.style.padding = "10px";
      alertBox.style.marginTop = "10px";
      alertBox.style.borderRadius = "5px";
      form.parentNode.insertBefore(alertBox, form);
    }
    alertBox.textContent = message;

    // Auto hide alert after 3 seconds
    setTimeout(() => {
      alertBox.remove();
    }, 3000);
  }
});
