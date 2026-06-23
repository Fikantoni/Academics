import fs from "fs";

const html = fs.readFileSync("src_folder.html", "utf-8");

// Scan for script tags.
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match;
let count = 0;

console.log("Scanning src_folder script blocks...");

const matches: string[] = [];
while ((match = scriptRegex.exec(html)) !== null) {
  const content = match[1];
  if (content.includes("AF_initDataCallback") || content.includes("_DRIVE_ivd")) {
    matches.push(content);
    console.log(`Found script block ${count++} with length ${content.length}`);
  }
}

if (matches.length > 0) {
  fs.writeFileSync("src_scripts.txt", matches.join("\n\n==========================================\n\n"));
  
  // Let's search inside the script blocks for typical file/folder lists
  const allText = matches.join("\n");
  
  const stringsInQuotes = allText.match(/"[^"\\]*(?:\\.[^"\\]*)*"/g) || [];
  const uniqueStrings = Array.from(new Set(stringsInQuotes.map(s => s.slice(1, -1))));
  
  fs.writeFileSync("src_unique_strings.txt", uniqueStrings.join("\n"));
  console.log("Wrote unique strings in src to src_unique_strings.txt");
  
  // Find all file and folder structures.
  // Pattern: ["ID", ["PARENT_ID"], "NAME", "MIMETYPE"]
  // Search for anything with an extension like .tsx, .ts, .css, or folder without extension (could be components, assets)
  const items = uniqueStrings.filter(s => {
    return s.length > 2 && !s.includes("/") && !s.includes("\\") && (
      s.endsWith(".tsx") || s.endsWith(".ts") || s.endsWith(".css") || s === "components"
    );
  });
  
  console.log("\nItems inside 'src' folder:");
  items.forEach(item => {
    // Let's find its ID using a direct regex or string search
    const idx = allText.indexOf(`\\x22${item}\\x22`);
    if (idx !== -1) {
      // Find the ID near it. The ID occurs before the item name in Google Drive payload format.
      // E.g. \x5b\x22<ID>\x22,\x5b\x221LLxrx1AN5zAqLywDnmtL5c3OjOW1oIp2\x22\x5d,\x22<item_name>\x22
      const nearText = allText.slice(Math.max(0, idx - 150), idx);
      const idMatch = nearText.match(/\\x22([a-zA-Z0-9_-]{25,})\\x22/);
      if (idMatch) {
         console.log(`- ${item}: ID="${idMatch[1]}"`);
      } else {
         // Try with normal quotes
         const normalIdx = allText.indexOf(`"${item}"`);
         const normalNear = allText.slice(Math.max(0, normalIdx - 150), normalIdx);
         const normalIdMatch = normalNear.match(/"([a-zA-Z0-9_-]{25,})"/);
         if (normalIdMatch) {
           console.log(`- ${item}: ID="${normalIdMatch[1]}"`);
         } else {
           console.log(`- ${item}: ID=NOT_FOUND`);
         }
      }
    } else {
      // Try normal quotes
      const normalIdx = allText.indexOf(`"${item}"`);
      if (normalIdx !== -1) {
         const normalNear = allText.slice(Math.max(0, normalIdx - 150), normalIdx);
         const normalIdMatch = normalNear.match(/"([a-zA-Z0-9_-]{25,})"/);
         if (normalIdMatch) {
           console.log(`- ${item}: ID="${normalIdMatch[1]}"`);
         } else {
           console.log(`- ${item}: ID=NOT_FOUND`);
         }
      } else {
         console.log(`- ${item}: ID=NOT_FOUND_AT_ALL`);
      }
    }
  });
  
} else {
  console.log("No scripts found in src_folder.html.");
}
