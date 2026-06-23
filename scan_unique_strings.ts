import fs from "fs";

const text = fs.readFileSync("unique_strings.txt", "utf-8");
const lines = text.split("\n");

console.log("Checking for 'src' or components or file extensions:");
const matched = lines.filter(line => {
  return line.toLowerCase().includes("src") ||
         line.toLowerCase().includes("component") ||
         line.includes(".tsx") ||
         line.includes(".ts") ||
         line.includes(".css") ||
         line.includes(".html") ||
         line.includes(".png") ||
         line.includes(".svg");
});

matched.forEach(m => console.log("- " + m));
