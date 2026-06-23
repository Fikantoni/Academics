import https from "https";

const url = "https://drive.google.com/drive/folders/1YMXUo5WiyaG0_fbhuIErNvdSWfreSoRO?usp=sharing";

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log("Status Code:", res.statusCode);
    console.log("Headers:", JSON.stringify(res.headers, null, 2));
    console.log("Data Length:", data.length);
    console.log("Snippet:", data.substring(0, 1000));
  });
}).on("error", (err) => {
  console.error("Error:", err);
});
