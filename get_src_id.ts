import fs from "fs";

const text = fs.readFileSync("subfolder_scripts.txt", "utf-8");

// Let's search for instances of "src" or any subfolder with "src" as name.
// Google Drive folders are listed in arrays.
// For example: \x5b\x22<ID>\x22,\x5b\x22<PARENT_ID>\x22\x5d,\x22src\x22 or ["<ID>", ["<PARENT_ID>"], "src"]

// Let's find "src" using index search and print context around it.
let lastIndex = 0;
while (true) {
  const index = text.indexOf("src", lastIndex);
  if (index === -1) break;
  // Let's look for "\x22src\x22" (escaped quotes) or `"src"`
  const prevQuote = text[index - 1];
  const nextQuote = text[index + 3];
  
  // If it's indeed '"src"' or '\x22src\x22'
  const isQuoted = (prevQuote === '"' && nextQuote === '"') ||
                   (text.slice(index - 4, index) === "\\x22" && text.slice(index + 3, index + 7) === "\\x22");
  
  if (isQuoted) {
    console.log(`\nQuoted "src" found at index ${index}`);
    console.log("Snippet:");
    console.log(text.slice(Math.max(0, index - 200), Math.min(text.length, index + 200)));
  }
  lastIndex = index + 3;
}
