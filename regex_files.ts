import fs from "fs";

const text = fs.readFileSync("subfolder_scripts.txt", "utf-8");

// Let's parse all JSON-like arrays or string lists in the text.
// Google Drive typically outputs elements as arrays like:
// ["ID", "FILE_NAME", "MIME_TYPE", ...]
// Let's find every string snippet in quotes that is followed or preceded by a mime-type.
// Or simply extract all strings that are between 3 and 100 characters and write them to a file for analysis.

const stringsInQuotes = text.match(/"[^"\\]*(?:\\.[^"\\]*)*"/g) || [];
const uniqueStrings = Array.from(new Set(stringsInQuotes.map(s => s.slice(1, -1))));

console.log(`Found ${uniqueStrings.length} unique strings.`);

// Let's filter out strings containing typical folder structure or Indonesian labels
// Let's write them to a file to examine.
fs.writeFileSync("unique_strings.txt", uniqueStrings.join("\n"));
console.log("Wrote unique strings to unique_strings.txt");

// Let's print out specifically strings that contain Indonesian terms or file-like shapes.
const suspectWords = [
  "skripsi", "tugas", "akhir", "sita", "mahasiswa", "dosen", "panduan", "buku",
  "pedoman", "alur", "form", "proposal", "sidang", "revisi", "nilai", "akademik",
  "pendaftaran", "bimbingan", "peserta", "persetujuan", "berita", "acara", "jadwal",
  "persyaratan", "prodi"
];

const matches = uniqueStrings.filter(s => {
  const containsSuspect = suspectWords.some(w => s.toLowerCase().includes(w));
  const isWebFile = s.includes(".") && ["json", "js", "ts", "tsx", "css", "html", "png", "jpg", "svg", "pdf", "docx", "xlsx", "zip"].some(ext => s.toLowerCase().endsWith(ext));
  return s.length > 2 && (containsSuspect || isWebFile) && !s.includes("/") && !s.includes("\\");
});

console.log("Suspect strings without slashes/backslashes:");
matches.forEach(m => console.log("- " + m));
