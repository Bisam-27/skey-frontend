const nav = document.getElementById("js-nav");
// const navBtn = document.getElementById("js-nav-hamburger");

// navBtn.addEventListener("click", toggleNav);
// function toggleNav() {
//   nav.classList.toggle("nav--expanded");
// }

/* const categoryEls = document.querySelectorAll(".js-nav-category");

categoryEls.forEach((el) => {
  el.addEventListener("click", toggleLowerNav);
});

function toggleLowerNav() {
  console.log("object");
  nav.classList.toggle("nav--expanded");
} */

document.querySelectorAll(".js-footer-title").forEach((icon) => {
  icon.addEventListener("click", toggleFooterList);
});

function toggleFooterList() {
  console.log("object");
  this.classList.toggle("footer__title--visible");
}

const footerInfo = document.getElementById("js-footer-info");
const footerLink = document.getElementById("js-footer-link");
footerLink.addEventListener("click", toggleFooterInfo);

function toggleFooterInfo() {
  if (footerInfo.classList.contains("footer__tagline-info-wrapper--visible")) {
    footerLink.innerText = "Read More";
  } else {
    footerLink.innerText = "Read Less";
  }

  footerInfo.classList.toggle("footer__tagline-info-wrapper--visible");
}

const elState = {};
// const page = fetchElement("[data-page]").dataset.page;
const page = "";

const classes = {
  inputError: "input__control--error",
  btnDisabled: "btn--disabled",
  navToggle: "nav--expanded",
  targetBtnClass: "js-btn-target",
};

/* ----------------------------- */
/* PAGE INTERACTIONS */
/* ----------------------------- */
switch (page) {
}

// CONTACT
function processContactForm(e) {
  e.preventDefault();

  const fullName = fetchById("js-full-name");
  const emailAddress = fetchById("js-email-address");
  const message = fetchById("js-message");

  if (verifyInput(fullName, "text") & verifyInput(emailAddress, "email")) {
    const payload = generatePayload({
      operation: "contact",
      fullName: fullName.value,
      emailAddress: emailAddress.value,
      message: message.value,
    });

    if (payload) {
      disableButtons(".btn");
      pushToServer(payload, "contact").then((response) => {
        if (response.success) {
          Toast.show(response.message, "success");
        } else {
          Toast.show(response.message, "error");
          enableButtons(".btn");
        }
      });
    }
  } else {
    Toast.show("Please enter all mandatory fields", "error");
  }
}

////////////////////////////////////////////////////////////////////////////
// 1 | HELPER FUNCTIONS
/*
 * 1.1 | Create FormData from object [generatePayload]
 * Desc: Pass in object. Returns FormData with key:value pair
 */
function generatePayload(obj) {
  const formData = new FormData();
  for (let key in obj) {
    formData.append(key, obj[key]);
  }
  return formData;
}

/*
 * 1.2 | Push data to server and redirect to callback function [pushToServer]
 * Desc: Push to PHP server and pass response to callback function
 */
async function pushToServer(payload, apiName, options = {}) {
  if (!options.method) {
    options.method = "POST";
  }

  var url = `php/apis/${apiName}.php`;

  const response = await fetch(url, {
    method: options.method,
    body: payload,
  });

  if (options.log) {
    console.log(await response.text());
    return;
  }

  return await response.json();
}

/*
 * 1.3 | Redirect [redirect]
 * Desc: Redirect to url
 */
function redirect(url) {
  window.location.href = url;
  return;
}

/*
 * 1.4 | Print entire Form Data [printFormData]
 * Desc: Redirect to url
 */
function printFormData(payload) {
  for (var pair of payload.entries()) {
    console.log(pair[0] + ", " + pair[1]);
  }
}

////////////////////////////////////////////////////////////////////////////
// 2 | BUTTON INTERACTIONS

/*
 * 2.1 | Disable and add loading animation to button [disableBtn]
 * Desc: Disable Buttons by class name
 */
function disableButtons(btnClass, options = {}) {
  const buttons = fetchElements(btnClass);

  if (options.el) {
    attachClass(options.el, classes.targetBtnClass);

    if (options.text) {
      options.el.innerText = options.text;
    }
  }

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
  }
}

/*
 * 2.2 | Enable Button
 * Desc: Companion call for disableButtons()
 */
function enableButtons(btnClass, options = {}) {
  const buttons = fetchElements(btnClass);

  const el = fetchElement(`${btnClass} + .${classes.targetBtnClass}`);

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = false;
  }

  if (el) {
    detachClass(el, classes.targetBtnClass);

    if (options.text) {
      el.innerText = options.text;
    }

    if (options.keepDisabled) {
      el.disabled = true;
    }
  }
}

////////////////////////////////////////////////////////////////////////////
// 3 | SELECTOR OPERATIONS

/*
 * 3.1 | Fetch Element by ID [fetchById]
 */
function fetchById(elString) {
  return document.getElementById(elString);
}

/*
 * 3.2 | Fetch Element by Selector / Class
 */
function fetchElement(elString, rootEl = document) {
  return rootEl.querySelector(elString);
}

/*
 * 3.3 | Fetch (many) Elements by Selector / Class
 */
function fetchElements(elString, src = document) {
  return src.querySelectorAll(elString);
}

////////////////////////////////////////////////////////////////////////////
// 4 | CLASS INTERACTIONS

/*
 * 4.1 | Add class to Element
 */
function attachClass(el, className) {
  el.classList.add(className);
}

/*
 * 4.2 | Remove class from Element
 */
function detachClass(el, className) {
  el.classList.remove(className);
}

/*
 * 4.3 | Check if element contains class
 */
function containsClass(el, className) {
  return el.classList.contains(className);
}

/**************************************************************************/

/*
 * 5.3 | Animate snackbar
 */
function displayErrSnackbar() {
  const snackbarEl = fetchById("snackbar");
  attachClass(snackbarEl, classes["snackbar-visible"]);

  snackbarEl.addEventListener("animationend", function () {
    detachClass(this, classes["snackbar-visible"]);
  });
}

////////////////////////////////////////////////////////////////////////////
// 6 | EVENT LISTENERS

/*
 * 6.1 | Attach event to single element
 */
function attachEvent(el, event, callback) {
  el.addEventListener(event, callback);
}

/*
 * 6.2 | Attach event to multiple elements
 */
function attachEventMultiple(elArr, event, callback) {
  for (let i = 0; i < elArr.length; i++) {
    attachEvent(elArr[i], event, callback);
  }
}

/**
 * 6.3 | Detach Event / Remove Event
 */
function detachEvent(el, event, callback) {
  el.removeEventListener(event, callback);
}

function addErrorClassToInput(el) {
  attachClass(el, classes.inputError);
}

function removeErrorClassFromInput(el) {
  detachClass(el, classes.inputError);
}

function validateEmail(email) {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function verifyInput(el, type = "text") {
  if (type == "email") {
    if (validateEmail(el.value)) {
      removeErrorClassFromInput(el);
      return true;
    } else {
      addErrorClassToInput(el);
      return false;
    }
  } else if (type == "text") {
    if (el.value.trim() != "") {
      removeErrorClassFromInput(el);
      return true;
    } else {
      addErrorClassToInput(el);
      return false;
    }
  } else if (type == "file") {
    if (el.value.trim() != "") {
      removeErrorClassFromInput(el);
      return true;
    } else {
      addErrorClassToInput(el);
      return false;
    }
  }
}

function verifyPassword(password1, password2) {
  if (password1.value.trim() == "") {
    addErrorClassToInput(password1);
    return false;
  } else {
    removeErrorClassFromInput(password1);
  }

  if (password1.value == password2.value) {
    removeErrorClassFromInput(password2);
    return true;
  } else {
    addErrorClassToInput(password2);
    return false;
  }
}

function loadStateCities() {
  const stateName = this.value;

  if (stateName) {
    const payload = createFormData({
      operation: "load-cities",
      stateName: stateName,
    });

    pushToServer(payload, loadStateCitiesResponse, "cities");
  }
}

function loadStateCitiesResponse(response) {
  if (response.success) {
    if (response.cities) {
      let html = ``;
      response.cities.forEach((city) => {
        html += `<option value="${city.name}">${city.name}</option>`;
      });

      fetchById("city").innerHTML = html;
    }
  }
}

function setInputFilter(textbox, inputFilter, errMsg) {
  [
    "input",
    "keydown",
    "keyup",
    "mousedown",
    "mouseup",
    "select",
    "contextmenu",
    "drop",
    "focusout",
  ].forEach(function (event) {
    textbox.addEventListener(event, function (e) {
      if (inputFilter(this.value)) {
        // Accepted value
        if (["keydown", "mousedown", "focusout"].indexOf(e.type) >= 0) {
          this.classList.remove("input-error");
          this.setCustomValidity("");
        }
        this.oldValue = this.value;
        this.oldSelectionStart = this.selectionStart;
        this.oldSelectionEnd = this.selectionEnd;
      } else if (this.hasOwnProperty("oldValue")) {
        // Rejected value - restore the previous one
        this.classList.add("input-error");
        this.setCustomValidity(errMsg);
        this.reportValidity();
        this.value = this.oldValue;
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      } else {
        // Rejected value - nothing to restore
        this.value = "";
      }
    });
  });
}
