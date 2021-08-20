const login = document.getElementById('login');
const signup = document.getElementById('signup');

const loginuname = document.forms["login"]["uname"];

loginuname.addEventListener('focus', function () {
  login.getElementsByClassName("uname")[0].innerText = "*";
  loginuname.style.borderColor = "#ccc";
});

const loginpsw = document.forms["login"]["psw"];

loginpsw.addEventListener('focus', function () {
  login.getElementsByClassName("psw")[0].innerText = "*";
  loginpsw.style.borderColor = "#ccc";
});

const uname = document.forms["signup"]["uname"];

uname.addEventListener('blur', function () {
  if (!uname.value.match(/^[A-za-z][A-za-z0-9_-]{4,32}$/gm)) {
    signup.getElementsByClassName("uname")[0].innerText = "* Username should start with a letter and must be between 5-32 characters";
    uname.style.borderColor = "red";
  }
  else {
    signup.getElementsByClassName("uname")[0].innerText = "*";
  }
});

uname.addEventListener('focus', function () {
  uname.style.borderColor = "#ccc";
});

const email = document.forms["signup"]["email"];

email.addEventListener('blur', function () {
  if (!email.value.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gm)) {
    signup.getElementsByClassName("email")[0].innerText = "* Not an Email";
    email.style.borderColor = "red";
  }
  else {
    signup.getElementsByClassName("email")[0].innerText = "*";
  }
});

email.addEventListener('focus', function () {
  email.style.borderColor = "#ccc";
});

const region = document.forms["signup"]["region"];

region.addEventListener('blur', function () {
  if (region.value === '') {
    signup.getElementsByClassName("region")[0].innerText = "* Select a Region";
    region.style.borderColor = "red";
  }
  else {
    signup.getElementsByClassName("region")[0].innerText = "*";
  }
});

region.addEventListener('focus', function () {
  region.style.borderColor = "#555";
});

const psw = document.forms["signup"]["psw"];

psw.addEventListener('blur', function () {
  if (!psw.value.match(/^(?=.*[0-9])(?=.*[A-Za-z_.-]).{7,32}$/gm)) {
    signup.getElementsByClassName("psw")[0].innerText = "* Password should be made of letters, numbers and must be between 8-32 characters";
    psw.style.borderColor = "red";
  }
  else {
    signup.getElementsByClassName("psw")[0].innerText = "*";
    signup.getElementsByClassName("psw-repeat")[0].innerText = "*";
  }
});

psw.addEventListener('focus', function () {
  psw.style.borderColor = "#ccc";
});


const psw_repeat = document.forms["signup"]["psw-repeat"];

psw_repeat.addEventListener('blur', function () {
  if (psw.value !== psw_repeat.value) {
    psw_repeat.setCustomValidity('Passwords must match');
    signup.getElementsByClassName("psw-repeat")[0].innerText = "* Passwords must match";
    psw_repeat.style.borderColor = "red";
  }
  else {
    signup.getElementsByClassName("psw-repeat")[0].innerText = "*";
  }
});

psw_repeat.addEventListener('focus', function () {
  psw_repeat.setCustomValidity('');
  psw_repeat.style.borderColor = "#ccc";
});


login.addEventListener('submit', function (ev) {
  ev.preventDefault();
  const uname = document.forms["login"]["uname"],
    psw = document.forms["login"]["psw"];
  fetch('/login', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: uname.value,
      password: psw.value,
    })
  })
    .then(data => data.json())
    .then(response => {
      console.error(response.message);
      switch (response.message) {
        case 'User Not found.':
          login.getElementsByClassName("uname")[0].innerText = response.message;
          uname.style.borderColor = "red";
          break;
        case 'Invalid Password!':
          login.getElementsByClassName("psw")[0].innerText = response.message;
          psw.style.borderColor = "red";
          break;
        case 'Logged in successfully!': window.location.reload(); break;
        default: alert('An error ocurred. \nPlease try again later.');
      }
    })
    .catch(catchError);
});

signup.addEventListener('submit', function (ev) {
  ev.preventDefault();
  const fname = document.forms["signup"]["fname"],
    lname = document.forms["signup"]["lname"],
    uname = document.forms["signup"]["uname"],
    email = document.forms["signup"]["email"],
    region = document.forms["signup"]["region"],
    institution = document.forms["signup"]["institution"],
    psw = document.forms["signup"]["psw"];
  fetch('/signup', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firstname: fname.value,
      lastname: lname.value,
      username: uname.value,
      email: email.value,
      region: region.value,
      institution: institution.value,
      password: psw.value,
    })
  })
    .then(data => data.json())
    .then(response => {
      console.error(response.message);
      switch (response.message) {
        case 'Username pattern does not match':
          signup.getElementsByClassName("uname")[0].innerText = "* Username should start with a letter and must be between 5-32 characters";
          uname.style.borderColor = "red";
          break;
        case 'Email pattern does not match':
          signup.getElementsByClassName("email")[0].innerText = "* Not an Email";
          email.style.borderColor = "red";
          break;
        case 'Region not selected':
          signup.getElementsByClassName("region")[0].innerText = "* Select a region";
          region.style.borderColor = "red";
          break;
        case 'Password pattern does not match':
          signup.getElementsByClassName("psw")[0].innerText = "* Password should be made of letters, numbers and must be between 8-32 characters";
          psw.style.borderColor = "red";
          break;
        case 'Failed! Username is already in use!':
          signup.getElementsByClassName("uname")[0].innerText = response.message;
          uname.style.borderColor = "red";
          break;
        case 'Failed! Email is already in use!':
          signup.getElementsByClassName("email")[0].innerText = response.message;
          email.style.borderColor = "red";
          break;
        case 'Logged in successfully!': window.location.reload(); break;
        default: alert('An error ocurred. \nPlease try again later.');
      }
    })
    .catch(catchError);
});