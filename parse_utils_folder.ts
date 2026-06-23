import fs from "fs";

const html = fs.readFileSync("utils_folder.html", "utf-8");

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match;
let count = 0;

const matches: string[] = [];
while ((match = scriptRegex.exec(html)) !== null) {
  const content = match[1];
  if (content.includes("AF_initDataCallback") || content.includes("_DRIVE_ivd")) {
    matches.push(content);
  }
}

if (matches.length > 0) {
  const allText = matches.join("\n");
  const stringsInQuotes = allText.match(/"[^"\\]*(?:\\.[^"\\]*)*"/g) || [];
  const uniqueStrings = Array.from(new Set(stringsInQuotes.map(s => s.slice(1, -1))));
  
  const items = uniqueStrings.filter(s => {
    return s.length > 2 && !s.includes("/") && !s.includes("\\") && (
      s.endsWith(".ts") || s.endsWith(".tsx") || s.endsWith(".js")
    );
  });
  
  console.log("Files inside 'src/utils' folder:");
  items.forEach(item => {
    const idx = allText.indexOf(`\\x22${item}\\x22`);
    if (idx !== -1) {
      const nearText = allText.slice(Math.max(0, idx - 150), idx);
      const idMatch = nearText.match(/\\x22([a-zA-Z0-9_-]{25,})\\x22/);
      if (idMatch) {
         console.log(`- ${item}: id="${idMatch[1]}"`);
      } else {
         const normalIdx = allText.indexOf(`"${item}"`);
         const normalNear = allText.slice(Math.max(0, normalIdx - 150), normalIdx);
         const normalIdMatch = normalNear.match(/"([a-zA-Z0-9_-]{25,})"/);
         if (normalIdMatch) {
           console.log(`- ${item}: id="${normalIdMatch[1]}"`);
         } else {
           console.log(`- ${item}: id=NOT_FOUND`);
         }
      }
    } else {
      const normalIdx = allText.indexOf(`"${item}"`);
      if (normalIdx !== -1) {
         const normalNear = allText.slice(Math.max(0, normalIdx - 150), normalIdx);
         const normalIdMatch = normalNear.match(/"([a-zA-Z0-9_-]{25,})"/);
         if (normalIdMatch) {
           console.log(`- ${item}: id="${normalIdMatch[1]}"`);
         } else {
           console.log(`- ${item}: id=NOT_FOUND`);
         }
      } else {
         console.log(`- ${item}: id=NOT_FOUND_AT_ALL`);
      }
    }
  });
} else {
  console.log("No scripts found in utils_folder.html.");
}
