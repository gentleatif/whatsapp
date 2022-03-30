const form = document.querySelector("form");
const number = document.getElementById("number").value;
const message = document.getElementById("message").value;

const btn = document.getElementById("btn");

async function postData(url = "", data = {}) {
  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

form.addEventListener("submit", function (e) {
  console.log("form submitted");
  e.preventDefault();
  const number = e.target.number.value;
  const message = e.target.messages.value;
  e.target.messages.value = "";
  e.target.number.value = "";
  console.log(number, message);

  postData("http://localhost:8000/send-message", {
    number: number,
    message: message,
  }).then((data) => {
    check(data);
    console.log(data); // JSON data parsed by `data.json()` call
  });
});

// remove success message after 3 second
function successMessage() {
  document.querySelector(".alert").classList.remove("hide");

  setTimeout(function () {
    document.querySelector(".alert").classList.add("hide");
  }, 5000);
}

function check(data) {
  const statusId = data.response.ack;
  if (statusId == 0) {
    successMessage();
  }
}
