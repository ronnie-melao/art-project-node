import { validateUsername, validatePassword } from "../../data/validators.js"

let loginForm = document.getElementById('signin-form');

// Client side validation here, JQuery is available.
let $search_input = $("#search-input");
$search_input.on("input", _ => {
  $("#search-button").prop("disabled", !$search_input.val());
});

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    try {
      username = validateUsername(username);
      password = validatePassword(password);

      loginForm.submit();
  } catch (e) {
      let login_error = document.getElementById("login_error");
      login_error.textContent = "Error: " + e;
      login_error.style.display = 'block';
  }
  });
};