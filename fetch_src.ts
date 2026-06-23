import https from "https";
import fs from "fs";

const folderId = "1LLxrx1AN5zAqLywDnmtL5c3OjOW1oIp2";
const url = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log(`src folder ${folderId} status:`, res.statusCode);
    fs.writeFileSync("src_folder.html", data);
    console.log("src folder written to src_folder.html");
  });
}).on("error", (err) => {
  console.error("Error fetching src folder:", err);
});
