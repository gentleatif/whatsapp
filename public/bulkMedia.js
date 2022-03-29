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
  const file1 = e.target.file1.files[0];
  const file2 = e.target.file2.files[0];
  const file3 = e.target.file3.files[0];
  const file4 = e.target.file4.files[0];
  const caption1 = e.target.caption1.value;
  const caption2 = e.target.caption2.value;
  const caption3 = e.target.caption3.value;
  const caption4 = e.target.caption4.value;
  console.log(caption1, caption2, caption3, caption4);
  const contacts = e.target.contactfile.files[0];

  const arrayOfNum = number.split(",");
  console.log(arrayOfNum);

  e.target.caption1.value = "";
  e.target.caption2.value = "";
  e.target.caption3.value = "";
  e.target.caption4.value = "";
  e.target.number.value = "";
  // make all data as form
  const formData = new FormData();
  formData.append("contacts", contacts);
  formData.append("file1", file1);
  formData.append("file2", file2);
  formData.append("file3", file3);
  formData.append("file4", file4);
  formData.append("caption1", caption1);
  formData.append("caption2", caption2);
  formData.append("caption3", caption3);
  formData.append("caption4", caption4);
  formData.append("number", JSON.stringify(arrayOfNum));

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
