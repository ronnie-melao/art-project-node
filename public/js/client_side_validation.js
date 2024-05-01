// Client side validation here, JQuery is available.
let $search_input = $("#search-input");
$search_input.on("input", _ => {
  $("#search-button").prop("disabled", !$search_input.val());
});

let loginForm = document.getElementById("signin-form");

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let loginErrorDiv = document.getElementById("login_error");

    try {
      loginErrorDiv.hidden = true;

      // username input validation
      if (!username) throw "Username not found.";
      if (typeof (username) !== "string") throw "The username must be a string.";
      username = username.trim();
      if (username.length === 0) throw "The username cannot be just empty spaces.";
      if (username.length < 2) throw "The username must be at least 2 characters long.";
      if (username.length > 16) throw "The username must be at most 16 characters long.";
      if (username.includes(" ")) throw "The username cannot contain any spaces.";
      for (let char of username) {
        // Check if the character is not a letter or a number
        if (!((char >= "a" && char <= "z") ||
          (char >= "A" && char <= "Z") ||
          (char >= "0" && char <= "9") || char === "_")) {
          throw "The username must only contain letters and numbers.";
        }
      }

      // password input validation
      if (!password) throw "Password not found.";
      if (typeof (password) !== "string") throw "The password must be a string.";
      password = password.trim();
      if (password.length === 0) throw "The password cannot be just empty spaces.";
      if (password.includes(" ")) throw "The password cannot contain any spaces.";
      if (password.length < 8) throw "The password must be at least 8 characters long.";

      const specialCharacters = "!@#$%^&*();:.,?`~+/=<>\\|-";
      let containsSpecialCharacters = false;
      for (let i = 0; i < password.length; i++) {
        if (specialCharacters.includes(password[i])) {
          containsSpecialCharacters = true;
          break;
        }
      }
      if (!containsSpecialCharacters) throw "The password must contain at least one special character.";

      const numbers = "0123456789";
      let containsNumbers = false;
      for (let i = 0; i < password.length; i++) {
        if (numbers.includes(password[i])) {
          containsNumbers = true;
          break;
        }
      }
      if (!containsNumbers) throw "The password must contain at least one number.";

      const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let containsUppercaseLetters = false;
      for (let i = 0; i < password.length; i++) {
        if (uppercaseLetters.includes(password[i])) {
          containsUppercaseLetters = true;
          break;
        }
      }
      if (!containsUppercaseLetters) throw "The password must contain at least one uppercase letter.";

      loginForm.submit();

    } catch (e) {
      loginErrorDiv.hidden = false;
      loginErrorDiv.textContent = e;
    }
  });
}
;

let registerForm = document.getElementById("signup-form");

if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    let username = document.getElementById("username").value;
    let firstName = document.getElementById("firstName").value;
    let lastName = document.getElementById("lastName").value;
    let email = document.getElementById("email").value;
    let phoneNumber = document.getElementById("phoneNumber").value;
    let bio = document.getElementById("bio").value;
    let statement = document.getElementById("statement").value;
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirmPassword").value;
    let isArtist = document.getElementById("isArtist").value;
    let registrationErrorDiv = document.getElementById("registration_error");

    try {

      registrationErrorDiv.hidden = true;

      // converts isArtist to boolean
      isArtist = isArtist === "true";

      // username input validation
      if (!username) throw "Username not found.";
      if (typeof (username) !== "string") throw "The username must be a string.";
      username = username.trim();
      if (username.length === 0) throw "The username cannot be just empty spaces.";
      if (username.length < 2) throw "The username must be at least 2 characters long.";
      if (username.length > 16) throw "The username must be at most 16 characters long.";
      if (username.includes(" ")) throw "The username cannot contain any spaces.";
      for (let char of username) {
        // Check if the character is not a letter or a number
        if (!((char >= "a" && char <= "z") ||
          (char >= "A" && char <= "Z") ||
          (char >= "0" && char <= "9") || char === "_")) {
          throw "The username must only contain letters and numbers and underscores.";
        }
      }

      // password input validation
      if (!password) throw "Password not found.";
      if (typeof (password) !== "string") throw "The password must be a string.";
      password = password.trim();
      if (password.length === 0) throw "The password cannot be just empty spaces.";
      if (password.includes(" ")) throw "The password cannot contain any spaces.";
      if (password.length < 8) throw "The password must be at least 8 characters long.";

      const specialCharacters = "!@#$%^&*();:.,?`~+/=<>\\|-";
      let containsSpecialCharacters = false;
      for (let i = 0; i < password.length; i++) {
        if (specialCharacters.includes(password[i])) {
          containsSpecialCharacters = true;
          break;
        }
      }
      if (!containsSpecialCharacters) throw "The password must contain at least one special character.";

      const numbers = "0123456789";
      let containsNumbers = false;
      for (let i = 0; i < password.length; i++) {
        if (numbers.includes(password[i])) {
          containsNumbers = true;
          break;
        }
      }
      if (!containsNumbers) throw "The password must contain at least one number.";

      const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let containsUppercaseLetters = false;
      for (let i = 0; i < password.length; i++) {
        if (uppercaseLetters.includes(password[i])) {
          containsUppercaseLetters = true;
          break;
        }
      }
      if (!containsUppercaseLetters) throw "The password must contain at least one uppercase letter.";

      // firstName input validation
      if (!firstName) throw "First name not found.";
      if (typeof (firstName) !== "string") throw "Your first name must be a string.";
      firstName = firstName.trim();
      if (firstName.length === 0) throw "Your first name cannot be just empty spaces.";
      if (firstName.length < 2) throw "Your first name must be at least 2 characters long.";
      if (firstName.length > 16) throw "Your first name must be at most 16 characters long.";
      for (let i = 0; i < firstName.length; i++) {
        if (!isNaN(parseInt(firstName[i]))) throw "Your first name cannot include any numbers.";
      }
      ;

      // lastName input validation
      if (!lastName) throw "Last name not found.";
      if (typeof (lastName) !== "string") throw "Your last name must be a string.";
      lastName = lastName.trim();
      if (lastName.length === 0) throw "Your last name cannot be just empty spaces.";
      if (lastName.length < 2) throw "Your last name must be at least 2 characters long.";
      if (lastName.length > 16) throw "Your last name must be at most 16 characters long.";
      for (let i = 0; i < lastName.length; i++) {
        if (!isNaN(parseInt(lastName[i]))) throw "Your last name cannot include any numbers.";
      }
      ;

      // email input validation
      if (!email) throw "Email not found.";
      if (typeof (email) !== "string") throw "Your email must be a string.";
      email = email.trim();
      if (email.length === 0) throw "Your email cannot be just empty spaces.";
      const atIndex = email.indexOf("@");
      const dotIndex = email.lastIndexOf(".");
      if (!(atIndex > 0 && dotIndex > atIndex + 1 && dotIndex < email.length - 1)) throw "Your email is invalid.";

      // phoneNumber input validation
      if (!phoneNumber) throw "Phone number not found.";
      if (typeof (phoneNumber) !== "string") throw "Your phone number must be a string.";
      phoneNumber = phoneNumber.trim();
      if (phoneNumber.length === 0) throw "Your phone number cannot be just empty spaces.";
      const numericPhoneNumber = phoneNumber.replace(/\D/g, "");
      if (!numericPhoneNumber.length === 10) throw "The phone number must be 10 digits.";

      // bio input validation
      if (!bio) throw "Bio not found.";
      if (typeof (bio) !== "string") throw "Your bio must be a string.";
      bio = bio.trim();
      if (bio.length === 0) throw "Your bio cannot be just empty spaces.";

      // statement input validation
      if (!statement) throw "Statement not found.";
      if (typeof (statement) !== "string") throw "Your statement must be a string.";
      statement = statement.trim();
      if (statement.length === 0) throw "Your statement cannot be just empty spaces.";

      // isArtist input validation
      if (typeof (isArtist) !== "boolean") throw "You must designate whether you are an artist or a user.";

      // checking if password and confirm password match
      if (password.trim() !== confirmPassword.trim()) throw "You must confirm the same password!";

      registerForm.submit();

    } catch (e) {
      registrationErrorDiv.hidden = false;
      registrationErrorDiv.textContent = e;
    }
  });
}