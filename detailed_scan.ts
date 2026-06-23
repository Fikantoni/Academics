import fs from "fs";

const html = fs.readFileSync("drive_page.html", "utf-8");

// Google Drive embeds files or folder entries in some JS variables.
// Let's find all script tags.
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match;
let count = 0;

console.log("Scanning script blocks...");

const matches: string[] = [];
while ((match = scriptRegex.exec(html)) !== null) {
  const content = match[1];
  if (content.includes("SITA") || content.includes("2027") || content.includes("Universitas")) {
    matches.push(content);
    console.log(`Found script block ${count++} with length ${content.length}`);
  }
}

// Let's inspect these script blocks and see if they contain files.
// Let's write them to a file or search for strings that look like a list of files or folders.
if (matches.length > 0) {
  fs.writeFileSync("script_blocks.txt", matches.join("\n\n==========================================\n\n"));
  console.log("Wrote matching script blocks to script_blocks.txt");
  
  // Let's search inside the script blocks for typical file types.
  // We'll search for things that are typical of academic systems or have extensions.
  const allText = matches.join("\n");
  const extensionRegex = /"[^"]+\.(?:pdf|docx|xlsx|png|zip|jpg|pptx|txt|csv|svg|html|js|css)"/gi;
  const filesFound = allText.match(extensionRegex) || [];
  console.log(`\nFound ${filesFound.length} file-like strings inside script blocks:`);
  Array.from(new Set(filesFound)).slice(0, 100).forEach(f => console.log("- " + f));
} else {
  console.log("No scripts matching found.");
}
