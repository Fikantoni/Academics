import https from "https";
import fs from "fs";

const folderId = "1sFrtIybP8MDWIUAkGj5t2ClbYL4KMs5Y"; // components folder ID
const url = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log(`components folder ${folderId} status:`, res.statusCode);
    fs.writeFileSync("components_folder.html", data);
    console.log("components folder written to components_folder.html");
  });
}).on("error", (err) => {
  console.error("Error fetching components folder:", err);
});
