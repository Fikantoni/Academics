import fs from "fs";

const text = fs.readFileSync("subfolder_scripts.txt", "utf-8");

// We want to find patterns of:
// ["<id>", "<name>", "<mimeType>", ...] or similar.
// In Google Drive list format, a folder's children are represented by entries.
// Let's look for instances of our known files in the script block.
// For example, "db.json", "index.html", "server.ts", "package.json", etc.

// Let's write a regex to find blocks of code containing these filenames.
const fileNames = [
  "db.json", "fix_db.cjs", "index.html", "metadata.json", "package-lock.json",
  "package.json", "server.ts", "tsconfig.json", "vercel.json", "vite.config.ts"
];

console.log("Searching for file IDs...");

// We can scan the text for occurrences of each filename and see what IDs are nearby in the JSON stream.
fileNames.forEach(name => {
  const index = text.indexOf(name);
  if (index !== -1) {
    const context = text.slice(Math.max(0, index - 300), Math.min(text.length, index + 300));
    console.log(`\n--- Context for "${name}" ---`);
    console.log(context);
  } else {
    console.log(`\n"${name}" not found in subfolder_scripts.txt`);
  }
});
