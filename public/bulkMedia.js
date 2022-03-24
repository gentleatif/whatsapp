const form = document.querySelector("form");
// const btn = document.getElementById("btn");

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
  const caption = e.target.caption.value;
  const file = e.target.uploadfile.files[0];
  const contacts = e.target.contactfile.files[0];
  // console.log(number, caption, file, contacts);
  // make numbers as array

  const arrayOfNum = number.split(",");
  console.log(arrayOfNum);

  e.target.caption.value = "";
  e.target.number.value = "";
  // make all data as form
  const formData = new FormData();
  formData.append("contacts", contacts);
  formData.append("file", file);
  formData.append("number", JSON.stringify(arrayOfNum));
  formData.append("caption", caption);

  postData("http://localhost:8000/send-media", formData).then((data) => {
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
