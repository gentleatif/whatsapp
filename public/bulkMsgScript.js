const form = document.querySelector("form");
console.log(form);
const number = document.getElementById("number").value;
const message = document.getElementById("message").value;

const btn = document.getElementById("btn");

async function postData(url = "", formData) {
  const response = await fetch(url, {
    method: "POST",

    body: formData, // body data type must match "Content-Type" header
  });
  return response; // parses JSON response into native JavaScript objects
}

form.addEventListener("submit", function (e) {
  console.log("form submitted");

  e.preventDefault();
  const number = e.target.number.value;
  const message = e.target.messages.value;
  const file = e.target.uploadFile.files[0];
  // make numbers as array

  const arrayOfNum = number.split(",");
  console.log(arrayOfNum);

  e.target.messages.value = "";
  e.target.number.value = "";
  // make all data as form
  const formData = new FormData();

  formData.append("number", JSON.stringify(arrayOfNum));
  formData.append("message", message);
  formData.append("file", file);

  postData("http://localhost:8000/send-bulkmsg", formData).then((data) => {
    console.log(data); // JSON data parsed by `data.json()` call
    check(data);
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
  if (data) {
    successMessage();
  }
}
