import fs from "fs";

const html = fs.readFileSync("drive_page.html", "utf-8");

// Google Drive embeds info in a script tag that contains window.bootstrapInfo or similar.
// It also has JSON arrays of the list of files.
// Let's search for typical file types or strings that could be filenames.
// Let's print out some matches or any string that might be a file.

// We can search for strings between double quotes that are 3 to 100 characters long
// and end with extensions like pdf, zip, xlsx, docx, png, jpg, or contain common keywords
// like "SITA", "Sistem", "Informasi", "Tugas Akhir", "Dosen", "Mahasiswa", "Pengajuan", "Proposal", etc.
const keywords = ["pdf", "docx", "xlsx", "zip", "png", "jpg", "SITA", "Sidang", "Proposal", "Skripsi", "Tugas", "Akhir", "Dosen", "Mahasiswa", "Akademik", "Pendaftaran", "Bimbingan", "Revisi"];

console.log("Searching for keywords in drive_page.html...");

const wordsInQuotes = html.match(/"[^"\\]*(?:\\.[^"\\]*)*"/g) || [];
console.log(`Found ${wordsInQuotes.length} quoted strings.`);

const matches = new Set<string>();
for (const word of wordsInQuotes) {
  const clean = word.slice(1, -1);
  if (clean.length > 3 && clean.length < 150) {
    if (keywords.some(kw => clean.toLowerCase().includes(kw.toLowerCase()))) {
      matches.add(clean);
    }
  }
}

console.log("Matching strings:");
Array.from(matches).slice(0, 50).forEach(m => console.log("- " + m));

// Also let's extract strings with high-level Indonesian academic terms if any
const indoKeywords = ["sistem", "informasi", "data", "admin", "login", "dashboard", "nilai", "skripsi", "tugas", "akhir", "sita", "panduan", "alur", "pendaftaran", "mahasiswa", "dosen", "prodi", "fakultas", "persetujuan", "surat", "berita", "acara", "jadwal", "persyaratan"];
const stateMatches = new Set<string>();
for (const word of wordsInQuotes) {
  const clean = word.slice(1, -1);
  if (clean.length > 4 && clean.length < 100) {
    if (indoKeywords.some(kw => clean.toLowerCase().includes(kw.toLowerCase()))) {
      stateMatches.add(clean);
    }
  }
}

console.log("\nMatching academic/Indonesian strings:");
Array.from(stateMatches).slice(0, 50).forEach(m => console.log("- " + m));
