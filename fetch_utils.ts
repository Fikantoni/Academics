import https from "https";
import fs from "fs";

const folderId = "1T5zgySC7p4XttY22InLVX4wgy6LYwpEh"; // utils folder ID
const url = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log(`utils folder ${folderId} status:`, res.statusCode);
    fs.writeFileSync("utils_folder.html", data);
    console.log("utils folder written to utils_folder.html");
  });
}).on("error", (err) => {
  console.error("Error fetching utils folder:", err);
});
