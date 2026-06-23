import https from "https";
import fs from "fs";

const url = "https://drive.google.com/drive/folders/1YMXUo5WiyaG0_fbhuIErNvdSWfreSoRO?usp=sharing";

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log("Analyzing HTML...");
    fs.writeFileSync("drive_page.html", data);
    console.log("Drive page written to drive_page.html");
  });
}).on("error", (err) => {
  console.error("Error:", err);
});
