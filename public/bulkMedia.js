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
  let file = e.target.uploadfile;
  const contacts = e.target.contactfile.files[0];
  console.log(contacts);
  nodeArray = Array.from(file);
  file = nodeArray.map((singlefile) => {
    const imgWithCaption = {
      img: singlefile.files,
      caption:
        singlefile.parentElement.nextSibling.nextSibling.childNodes[2]
          .nextSibling.value,
    };
    return imgWithCaption;
  });
  console.log(file);
  const arrayOfNum = number.split(",");
  console.log(arrayOfNum);

  e.target.caption.value = "";
  e.target.number.value = "";
  // make all data as form
  const formData = new FormData();
  formData.append("contacts", contacts);
  formData.append("file", JSON.stringify(file));
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
