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