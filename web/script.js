const form = document.getElementById("feedbackForm");
const feedbackList = document.getElementById("feedbackList");

const apiPost = "your-api-post"; // replace this
const apiGet = "your-api-get"; // replace this

async function loadFeedback() {
  feedbackList.innerHTML = "";
  const res = await fetch(apiGet);
  const data = await res.json();
  data.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${item.name}</strong><br><a href="${item.url}" target="_blank">Download/View Image</a>`;
    feedbackList.appendChild(li);
  });
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function () {
    const base64String = reader.result.split(",")[1]; // remove data:image/jpeg;base64,
    const fileType = file.type;

    const payload = {
      name,
      fileContent: base64String,
      fileType,
    };

    const res = await fetch(apiPost, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      form.reset();
      loadFeedback(); // Refresh
    } else {
      const err = await res.text();
      alert("Upload failed: " + err);
    }
  };
  reader.readAsDataURL(file);
});

loadFeedback();
