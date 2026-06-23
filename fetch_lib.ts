import https from "https";
import fs from "fs";

const folderId = "1If-lkjaiIgD3XPBdJog0-AR08q8hO3VG"; // lib folder ID
const url = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log(`lib folder ${folderId} status:`, res.statusCode);
    fs.writeFileSync("lib_folder.html", data);
    console.log("lib folder written to lib_folder.html");
  });
}).on("error", (err) => {
  console.error("Error fetching lib folder:", err);
});
