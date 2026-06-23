import https from "https";
import fs from "fs";

const subfolderId = "1Y6mueUJdITYUqUJZQEUlLIJoHaaA5pZQ";
const url = `https://drive.google.com/drive/folders/${subfolderId}?usp=sharing`;

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log(`Subfolder ${subfolderId} status:`, res.statusCode);
    fs.writeFileSync("subfolder.html", data);
    console.log("Subfolder written to subfolder.html");
  });
}).on("error", (err) => {
  console.error("Error fetching subfolder:", err);
});
