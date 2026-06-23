import fs from "fs";

const html = fs.readFileSync("subfolder.html", "utf-8");

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match;
let count = 0;

console.log("Scanning subfolder script blocks...");

const matches: string[] = [];
while ((match = scriptRegex.exec(html)) !== null) {
  const content = match[1];
  if (content.includes("AF_initDataCallback") || content.includes("_DRIVE_ivd")) {
    matches.push(content);
    console.log(`Found script block ${count++} with length ${content.length}`);
  }
}

if (matches.length > 0) {
  fs.writeFileSync("subfolder_scripts.txt", matches.join("\n\n==========================================\n\n"));
  console.log("Wrote matching script blocks to subfolder_scripts.txt");
  
  // Let's search inside the script blocks for common Indonesian keywords or file links
  const allText = matches.join("\n");
  
  // Find all matches of file names or folder names
  // In Google Drive JS payload, names of files are often followed by their mime types, or they look like ["1abc...", "File Name.ext", "application/..."]
  // Let's look for combinations of a name string and a Google mimetype or extension
  const mimeTypes = [
    "application/vnd.google-apps.document", // Doc
    "application/vnd.google-apps.spreadsheet", // Sheet
    "application/vnd.google-apps.presentation", // Slide
    "application/vnd.google-apps.form", // Form
    "application/vnd.google-apps.folder", // Folder
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument",
    "application/zip"
  ];
  
  // Let's grab all occurrences of typical filenames or Indonesian academic terms
  const terms = ["Skripsi", "Tugas", "SITA", "Sistem", "Informasi", "Dosen", "Mahasiswa", "Data", "Prodi", "Panduan", "Buku", "Pedoman", "Alur", "Form", "Proposal", "Sidang", "Revisi", "Nilai", "Akademik"];
  
  // Let's write a simple regex to capture strings in the vicinity of standard mimetypes, or let's scan double-quoted strings.
  const doubleQuoted = allText.match(/"[^"\\]*(?:\\.[^"\\]*)*"/g) || [];
  const uniqueStrings = Array.from(new Set(doubleQuoted.map(s => s.slice(1, -1))));
  
  console.log("Filtered strings:");
  uniqueStrings.filter(s => {
    return s.length > 3 && s.length < 150 && (
      terms.some(t => s.toLowerCase().includes(t.toLowerCase())) ||
      s.includes(".") && ["pdf", "docx", "xlsx", "png", "zip", "jpg"].some(ext => s.toLowerCase().endsWith(ext))
    );
  }).forEach(s => console.log("- " + s));
} else {
  console.log("No scripts matching found.");
}
