import fs from "fs";

const text = fs.readFileSync("src_scripts.txt", "utf-8");

// Look for a folder named "utils"
let lastIndex = 0;
while (true) {
  const index = text.indexOf("utils", lastIndex);
  if (index === -1) break;
  
  const prevQuote = text[index - 1];
  const nextQuote = text[index + 5];
  
  const isQuoted = (prevQuote === '"' && nextQuote === '"') ||
                   (text.slice(index - 4, index) === "\\x22" && text.slice(index + 5, index + 9) === "\\x22");
  
  if (isQuoted) {
    console.log(`\nQuoted "utils" found at index ${index}`);
    console.log("Snippet:");
    console.log(text.slice(Math.max(0, index - 200), Math.min(text.length, index + 200)));
  }
  lastIndex = index + 5;
}
