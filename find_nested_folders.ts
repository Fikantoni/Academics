import fs from "fs";

const text = fs.readFileSync("subfolder_scripts.txt", "utf-8");

// Google Drive folder mimetype is "application/vnd.google-apps.folder"
// Let's search for folder declarations.
// In the Javascript payload, folders look like:
// \x5b\x22<ID>\x22,\x5b\x22<PARENT_ID>\x22\x5d,\x22<FOLDER_NAME>\x22,\x22application\/vnd.google-apps.folder\x22
// Or ["ID", ["PARENT_ID"], "FOLDER_NAME", "application/vnd.google-apps.folder"]

const regex = /(?:\\x5b|\[)"([a-zA-Z0-9_-]{15,})"(?:,\\x5b|,\[)"([a-zA-Z0-9_-]{15,})"(?:\\x5d|\]),(?:\\x22|")([^"\\]+)(?:\\x22|"),(?:\\x22|")application\/(?:vnd\.google-apps\.folder|folder)(?:\\x22|")/g;

console.log("Searching for nested folders...");
let match;
while ((match = regex.exec(text)) !== null) {
  console.log(`Folder Found: Name="${match[3]}", ID="${match[1]}", ParentID="${match[2]}"`);
}

// Let's also do a search with simple string index search for "src" or other folder names.
const srcIndex = text.indexOf("src");
if (srcIndex !== -1) {
  console.log("\nFound 'src' in text. Snippet:");
  console.log(text.slice(Math.max(0, srcIndex - 100), Math.min(text.length, srcIndex + 300)));
} else {
  console.log("\nLiteral string 'src' not found in subfolder_scripts.txt.");
}

// Let's also see if there is another JS file that contains "src" or files in the src folder.
// Let's write a script to extract ALL elements that look like:
// ["ID", ["PARENT"], "NAME", "MIMETYPE" ...]
// Let's do a general find for anything with an ID from the script.
const generalItemRegex = /(?:\\x5b|\[)"([a-zA-Z0-9_-]{20,})"(?:,\\x5b|,\[)"([a-zA-Z0-9_-]{15,})"(?:\\x5d|\]),(?:\\x22|")([^"\\]+)(?:\\x22|"),(?:\\x22|")([^"\\]+)(?:\\x22|")/g;
console.log("\nGeneral items found:");
let count = 0;
while ((match = generalItemRegex.exec(text)) !== null) {
  if (count++ < 100) {
    console.log(`- Item Name: "${match[3]}", ID: "${match[1]}", Parent: "${match[2]}", Mime: "${match[4]}"`);
  }
}
