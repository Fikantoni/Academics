import fs from "fs";

const text = fs.readFileSync("src_scripts.txt", "utf-8");

// Look for a folder named "lib"
// In Google Drive JS payload, folders look like:
// \x5b\x22<ID>\x22,\x5b\x22<PARENT_ID>\x22\x5d,\x22lib\x22 or ["<ID>", ["<PARENT_ID>"], "lib"]

let lastIndex = 0;
while (true) {
  const index = text.indexOf("lib", lastIndex);
  if (index === -1) break;
  
  const prevQuote = text[index - 1];
  const nextQuote = text[index + 3];
  
  const isQuoted = (prevQuote === '"' && nextQuote === '"') ||
                   (text.slice(index - 4, index) === "\\x22" && text.slice(index + 3, index + 7) === "\\x22");
  
  if (isQuoted) {
    console.log(`\nQuoted "lib" found at index ${index}`);
    console.log("Snippet:");
    console.log(text.slice(Math.max(0, index - 200), Math.min(text.length, index + 200)));
  }
  lastIndex = index + 3;
}
