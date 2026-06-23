import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "simtesis_sec_jwt_key_2026_super_secure_98765";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.VERCEL || process.env.RACK_ENV === 'production' 
  ? path.join("/tmp", "db.json") 
  : path.join(process.cwd(), "db.json");

// Define robust custom security headers middleware (clickjacking protection, XSS blockers, MIME sniffing, etc.)
app.use((req, res, next) => {
  res.setHeader("X-Custom-Shield", "SIMTESIS-SECURE-SHIELD_v1.0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; frame-ancestors *; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https: wss:;"
  );
  next();
});

// Lightweight In-Memory Sliding Window Rate Limiter for secure DDoS & Scraping protection
const clientRequestLogs: Map<string, { count: number; resetTime: number }> = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 300; // limit to 300 requests/minute per client IP

app.use("/api", (req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] as string || "unknown-ip";
  const now = Date.now();
  const log = clientRequestLogs.get(ip);

  if (!log || now > log.resetTime) {
    clientRequestLogs.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    next();
  } else {
    log.count += 1;
    if (log.count > MAX_REQUESTS_PER_WINDOW) {
      res.status(429).json({
        error: "Too Many Requests",
        message: "Sistem mendeteksi aktivitas mencurigakan dari IP Anda dalam waktu singkat. Akses dibatasi sementara demi menjaga stabilitas dan keamanan aplikasi."
      });
    } else {
      next();
    }
  }
});

// Middleware to parse JSON
app.use(express.json({ limit: "50mb" }));

// Helper seed data in case db.json is missing or corrupted
const DEFAULT_SEED_DATA = {
  logo: null,
  pengguna: [
    {
      "id": "U001",
      "nama": "Super Admin",
      "email": "superadmin@um-pontianak.ac.id",
      "role": "Superadmin",
      "status": "Aktif"
    },
    {
      "id": "U999",
      "nama": "Fikes Borneo",
      "email": "fikesborneo@gmail.com",
      "role": "Superadmin",
      "status": "Aktif"
    },
    {
      "id": "U002",
      "nama": "Admin Tugas Akhir",
      "email": "admin@um-pontianak.ac.id",
      "role": "Admin",
      "status": "Aktif"
    },
    {
      "id": "U008",
      "nama": "Ketua Program Studi S2",
      "email": "prodi@um-pontianak.ac.id",
      "role": "Prodi",
      "status": "Aktif"
    },
    {
      "id": "U003",
      "nama": "Dr. Budi Santoso, M.Kes",
      "email": "dosen1@um-pontianak.ac.id",
      "role": "Dosen",
      "status": "Aktif"
    },
    {
      "id": "U004",
      "nama": "Dr. Siti Aminah, M.PH",
      "email": "dosen2@um-pontianak.ac.id",
      "role": "Dosen",
      "status": "Aktif"
    },
    {
      "id": "U005",
      "nama": "Andi Pratama",
      "email": "mhs1@um-pontianak.ac.id",
      "role": "Mahasiswa",
      "status": "Aktif"
    },
    {
      "id": "U006",
      "nama": "Rina Melati",
      "email": "mhs2@um-pontianak.ac.id",
      "role": "Mahasiswa",
      "status": "Aktif"
    }
  ],
  mahasiswa: [
    {
      "id": "M001",
      "nim": "221001",
      "nama": "Andi Pratama",
      "email": "mhs1@um-pontianak.ac.id",
      "judul": "Pengaruh Sanitasi terhadap Stunting",
      "status": "Aktif"
    },
    {
      "id": "M002",
      "nim": "221002",
      "nama": "Rina Melati",
      "email": "mhs2@um-pontianak.ac.id",
      "judul": "Evaluasi Program Posyandu",
      "status": "Aktif"
    }
  ],
  dosen: [
    {
      "id": "D001",
      "nidn": "1001001",
      "nama": "Dr. Budi Santoso, M.Kes",
      "email": "dosen1@um-pontianak.ac.id",
      "bidangKeahlian": "Epidemiologi",
      "status": "Aktif"
    },
    {
      "id": "D002",
      "nidn": "1001002",
      "nama": "Dr. Siti Aminah, M.PH",
      "email": "dosen2@um-pontianak.ac.id",
      "bidangKeahlian": "Kesehatan Lingkungan",
      "status": "Aktif"
    }
  ],
  pengumuman: [
    {
      "id": "PENG01",
      "judul": "Pendaftaran Sidang Tugas Akhir Gelombang 1 Pekan Ini Telah Resmi Dibuka",
      "tanggal": "2026-06-01",
      "aktif": true
    }
  ],
  bimbingan: [
    {
      "id": "BIMB01",
      "mahasiswaId": "M001",
      "pembimbing1": "dosen1@um-pontianak.ac.id",
      "pembimbing2": "dosen2@um-pontianak.ac.id",
      "penguji1": "dosen1@um-pontianak.ac.id",
      "penguji2": "dosen2@um-pontianak.ac.id",
      "tanggalDiassign": "2026-06-01"
    }
  ],
  judul: [
    {
      "id": "JUD01",
      "mahasiswaEmail": "mhs1@um-pontianak.ac.id",
      "namaMahasiswa": "Andi Pratama",
      "judul": "Pengaruh Sanitasi terhadap Stunting di Pontianak",
      "abstrak": "Penelitian ini bertujuan untuk mengevaluasi dampak kelayakan sanitasi dasar terhadap kasus stunting balita di wilayah kerja puskesmas.",
      "status": "Disetujui",
      "tanggal": "2462-06-01",
      "catatan": "Lanjutkan ke penyusunan proposal Bab 1-3"
    }
  ],
  konsultasi: [],
  pesanSurat: [],
  jadwalSidang: [],
  pendaftaranTesis: [],
  aktivitas: [],
  dokumenTesis: [],
  biayaUjian: [
    { "id": "sempro", "nama": "Seminar Proposal", "nominal": 500000 },
    { "id": "semhas", "nama": "Seminar Hasil", "nominal": 750000 },
    { "id": "sidang", "nama": "Sidang Akhir Tugas Akhir", "nominal": 1500000 }
  ],
  panduanSOP: [
    {
      "id": "PAND01",
      "judul": "Buku Pedoman Penulisan Tugas Akhir S2 Pascasarjana",
      "kategori": "Panduan",
      "subKategori": "Sistematika Penulisan",
      "deskripsi": "Buku panduan resmi format penulisan draf proposal, tugas akhir, teknik sitasi Harvard style, layout margin, ukuran font, serta tata letak abstrak dwi-bahasa Inggris & Indonesia.",
      "fileNama": "Pedoman_Penulisan_Tugas_Akhir_Pasca_v2.pdf",
      "fileData": "Sistem menyimpannya sebagai file template referensi resmi akademik.",
      "tanggalInput": "2026-06-01",
      "diunggahOleh": "Admin Tugas Akhir"
    },
    {
      "id": "SOP01",
      "judul": "SOP Alur Bimbingan & Konsultasi Tugas Akhir Berkala",
      "kategori": "SOP",
      "subKategori": "Bimbingan",
      "deskripsi": "Standard Operating Procedure (SOP) pelaksanaan bimbingan tugas akhir digital maupun luring. Minimal pertemuan bimbingan draf divalidasi pembimbing adalah sebanyak 8 kali konsultasi terdokumentasi di Kartu Kendali Tesis.",
      "fileNama": "SOP_Alur_Bimbingan_Mahasiswa_S2.pdf",
      "fileData": "Sistem menyimpannya sebagai file template referensi resmi akademik.",
      "tanggalInput": "2026-06-01",
      "diunggahOleh": "Ketua Program Studi S2"
    },
    {
      "id": "SOP02",
      "judul": "SOP Pendaftaran Kelayakan Sidang Akhir Tugas Akhir",
      "kategori": "SOP",
      "subKategori": "Sidang Tugas Akhir",
      "deskripsi": "SOP proses operasional dan berkas persetujuan syarat maju Sidang Akhir Tugas Akhir meliputi penyerahan berkas bebas pustaka, bukti ACC Pembimbing 1 dan Pembimbing 2, draf lolos turnitin maksimal 25%, dan slip bukti lunas pendaftaran ujian.",
      "fileNama": "SOP_Pendaftaran_Sidang_Tugas_Akhir_S2.pdf",
      "fileData": "Sistem menyimpannya sebagai file template referensi resmi akademik.",
      "tanggalInput": "2026-06-03",
      "diunggahOleh": "Admin Tugas Akhir"
    }
  ],
  "printedDocs": [],
  "pengaturan": [
    {
      "id": "dekan_nama",
      "value": "Ismael Saleh, S.K.M., M.Sc."
    },
    {
      "id": "dekan_nidn",
      "value": "0411030052"
    },
    {
      "id": "dekan_jabatan",
      "value": "Dekan Fakultas Ilmu Kesehatan dan Psikologi"
    },
    {
      "id": "wa_status",
      "value": "Nonaktif"
    },
    {
      "id": "wa_gateway_provider",
      "value": "Fonnte"
    },
    {
      "id": "wa_token",
      "value": ""
    },
    {
      "id": "wa_sender_no",
      "value": ""
    },
    {
      "id": "wa_template_mhs",
      "value": "Yth. {nama}, Jadwal {kegiatan} Anda telah terbit. Tanggal: {tanggal}, Jam: {waktu} WIB, Ruang: {ruang}. Harap bersiap menghadapi ujian. Link Meet: {link}"
    },
    {
      "id": "wa_template_dosen",
      "value": "Yth. Dr/Bapak/Ibu {nama}, Mohon kehadirannya selaku dewan penguji pada Jadwal {kegiatan} Mahasiswa {mahasiswa} ({nim}). Tanggal: {tanggal}, Jam: {waktu} WIB, Ruang: {ruang}. Link Meet: {link}"
    },
    {
      "id": "wa_template_audiens",
      "value": "INFO PASCA: Hadirilah & saksikan Seminar/Sidang {kegiatan} Mahasiswa: {mahasiswa} pada Tanggal: {tanggal}, Jam: {waktu} WIB di {ruang} sebagai bekal persiapan ujian Anda!"
    },
    {
      "id": "link_akademik_s1_psikologi",
      "value": ""
    },
    {
      "id": "link_akademik_s1_kesmas",
      "value": ""
    },
    {
      "id": "link_akademik_s2_kesmas",
      "value": ""
    },
    {
      "id": "link_ta_s1_psikologi",
      "value": ""
    },
    {
      "id": "link_ta_s1_kesmas",
      "value": ""
    },
    {
      "id": "link_ta_s2_kesmas",
      "value": ""
    },
    {
      "id": "link_magang_s1_psikologi",
      "value": ""
    },
    {
      "id": "link_magang_s1_kesmas",
      "value": ""
    },
    {
      "id": "link_magang_s2_kesmas",
      "value": ""
    },
    {
      "id": "link_pbl1_s1_kesmas",
      "value": ""
    },
    {
      "id": "link_pbl2_s1_kesmas",
      "value": ""
    }
  ],
  "helpdeskTiket": [
    {
      "id": "TKT_001",
      "mahasiswaEmail": "mhs1@um-pontianak.ac.id",
      "namaMahasiswa": "Andi Pratama",
      "kategori": "Sistem",
      "subjek": "Gagal unggah draf proposal tugas akhir",
      "deskripsi": "Ketika mencoba mengunggah draf proposal berukuran 8MB, sistem menunjukkan Putus Koneksi / Error. Apakah ada batas ukuran file?",
      "urgensi": "Tinggi",
      "tanggal": "2026-06-05",
      "status": "Selesai",
      "tanggapan": "Halo Andi, batas upload adalah 10MB. File Anda berhasil kami terima melalui verifikasi manual admin. Solusi: Hubungi helpdesk jika masih terus berulang.",
      "tanggapanOleh": "superadmin@um-pontianak.ac.id",
      "tanggalTanggapan": "2026-06-06"
    },
    {
      "id": "TKT_002",
      "mahasiswaEmail": "mhs2@um-pontianak.ac.id",
      "namaMahasiswa": "Rina Melati",
      "kategori": "Administrasi",
      "subjek": "Tanya batas waktu validasi nilai bimbingan",
      "deskripsi": "Saya sudah mengirim draf perbaikan, tetapi paraf persetujuan nilai akhir di dasbor masih Menunggu. Berapa lama durasinya?",
      "urgensi": "Sedang",
      "tanggal": "2026-06-11",
      "status": "Terbuka"
    }
  ],
  "tahunAkademik": [
    {
      "id": "TA_01",
      "nama": "Ganjil 2025/2026",
      "status": "Aktif",
      "tanggalMulai": "2025-09-01",
      "tanggalSelesai": "2026-02-28"
    },
    {
      "id": "TA_02",
      "nama": "Genap 2024/2025",
      "status": "Arsip",
      "tanggalMulai": "2025-03-01",
      "tanggalSelesai": "2025-08-31"
    }
  ],
  "arsipSurat": [
    {
      "id": "ARS_001",
      "nomorSurat": "005/II.3.AU.15/F/FIKPsi/2026",
      "judulSurat": "Surat Undangan Rapat Kerja Fakultas",
      "jenis": "Masuk",
      "pengirimOrPenerima": "Rektorat Universitas Muhammadiyah Pontianak",
      "tanggalSurat": "2026-06-10",
      "tanggalArsip": "2026-06-11",
      "kategori": "Undangan",
      "keterangan": "Rapat koordinasi kurikulum fakultas di Aula Gedung B."
    },
    {
      "id": "ARS_002",
      "nomorSurat": "120/II.3.AU.15/K/FIKPsi/2026",
      "judulSurat": "Surat Tugas Dosen Pembimbing Lapangan",
      "jenis": "Keluar",
      "pengirimOrPenerima": "Puskesmas Kecamatan Pontianak Selatan",
      "tanggalSurat": "2026-06-15",
      "tanggalArsip": "2026-06-15",
      "kategori": "Tugas",
      "keterangan": "Surat tugas pendampingan magang mahasiswa."
    }
  ],
  "nomorSuratKeluar": [
    {
      "id": "NOM_001",
      "nomorUrut": 1,
      "nomorSuratLengkap": "001/II.3.AU.15/K/FIKPsi/2026",
      "perihal": "Surat Pengantar Magang",
      "tujuan": "Dinas Kesehatan Kota Pontianak",
      "tanggalPembuatan": "2026-01-05",
      "pembuat": "Admin Tugas Akhir",
      "kategori": "Surat Pengantar"
    },
    {
      "id": "NOM_002",
      "nomorUrut": 2,
      "nomorSuratLengkap": "002/II.3.AU.15/K/FIKPsi/2026",
      "perihal": "Surat Keterangan Aktif Kuliah",
      "tujuan": "Bank Kalbar Cabang Syariah",
      "tanggalPembuatan": "2026-01-10",
      "pembuat": "Admin Tugas Akhir",
      "kategori": "Surat Keterangan"
    }
  ],
  "peminjamanAlat": [
    {
      "id": "PIN_001",
      "mahasiswaEmail": "mhs1@um-pontianak.ac.id",
      "namaMahasiswa": "Andi Pratama",
      "nimMahasiswa": "221001",
      "namaAlat": "Mikroskop Binokuler Olympus CX23",
      "jumlah": 2,
      "tanggalPinjam": "2026-06-12",
      "tanggalKembali": "2026-06-16",
      "tujuanPenggunaan": "Penelitian sampel bakteri air bersih untuk tugas akhir.",
      "status": "Dikembalikan",
      "catatan": "Kondisi lensa bersih dan lengkap.",
      "petugasApprove": "Admin Tugas Akhir"
    },
    {
      "id": "PIN_002",
      "mahasiswaEmail": "mhs2@um-pontianak.ac.id",
      "namaMahasiswa": "Rina Melati",
      "nimMahasiswa": "221002",
      "namaAlat": "Timbangan Analitik Shimadzu",
      "jumlah": 1,
      "tanggalPinjam": "2026-06-20",
      "tanggalKembali": "2026-06-25",
      "tujuanPenggunaan": "Praktikum uji kadar kelembaban sampel tanah.",
      "status": "Menunggu",
      "catatan": ""
    }
  ]
};

// Persistent cache variables to ensure high performance and strict serialized writes
let cachedDbState: any = null;
let writeQueuePromise: Promise<void> = Promise.resolve();

// Helper to automatically repair truncated JSON strings (e.g. truncated base64 data)
function repairJSON(str: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') {
        stack.push('}');
      } else if (char === '[') {
        stack.push(']');
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '}') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === ']') {
          stack.pop();
        }
      }
    }
  }

  let result = str;
  if (inString) {
    let backslashCount = 0;
    let idx = result.length - 1;
    while (idx >= 0 && result[idx] === '\\') {
      backslashCount++;
      idx--;
    }
    if (backslashCount % 2 !== 0) {
      result = result.slice(0, -1);
    }
    result += '"';
  }

  let trimmedResult = result.trim();
  while (trimmedResult.endsWith(',') || trimmedResult.endsWith(':')) {
    trimmedResult = trimmedResult.slice(0, -1).trim();
  }
  result = trimmedResult;

  while (stack.length > 0) {
    const closing = stack.pop();
    result += closing;
  }

  return result;
}

// Safely writes cached state to the file system using an atomic temporary rename
function atomicWriteDisk(data: any): Promise<void> {
  return new Promise<void>((resolve) => {
    const tempPath = DB_PATH + ".tmp";
    fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8", (err) => {
      if (err) {
        console.error(`Error in async write queue for ${tempPath}:`, err);
        // Fallback to synchronous rewrite direct to target
        try {
          fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
        } catch (syncErr) {
          console.error(`Fallback synchronous write also failed during queue flush:`, syncErr);
        }
        resolve();
        return;
      }
      fs.rename(tempPath, DB_PATH, (renameErr) => {
        if (renameErr) {
          console.error(`Error during atomic rename of database file:`, renameErr);
          // Fallback
          try {
            fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
          } catch (syncErr) {
            console.error(`Fallback write after rename exception failed:`, syncErr);
          }
        }
        resolve();
      });
    });
  });
}

// Helper to read database once into the in-memory cache, normalization, mapping and seeding database
function readDB() {
  if (cachedDbState) {
    return cachedDbState;
  }

  try {
    let parsed: any = {};
    if (!fs.existsSync(DB_PATH)) {
      console.log("db.json not found, creating from default robust seeds...");
      parsed = DEFAULT_SEED_DATA;
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), "utf-8");
      } catch (writeErr) {
        console.error("Failed to write initial seed file, serving in-memory only:", writeErr);
      }
    } else {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      try {
        parsed = JSON.parse(data);
      } catch (parseErr) {
        console.warn("db.json parsing failed (it might be truncated/corrupt). Attempting auto-repair...", parseErr);
        try {
          const repairedStr = repairJSON(data);
          parsed = JSON.parse(repairedStr);
          console.log("SUCCESS: db.json was successfully repaired and parsed!");
          try {
            fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), "utf-8");
          } catch (writeErr) {
            console.error("Failed to save repaired database to disk:", writeErr);
          }
        } catch (repairErr) {
          console.error("CRITICAL: Auto-repair failed. Resetting to DEFAULT_SEED_DATA.", repairErr);
          parsed = DEFAULT_SEED_DATA;
          try {
            fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), "utf-8");
          } catch (writeErr) {
            console.error("Failed to save default state to disk:", writeErr);
          }
        }
      }
    }

    const canonicalDb: any = {
      logo: null,
      pengguna: [],
      mahasiswa: [],
      dosen: [],
      pengumuman: [],
      bimbingan: [],
      judul: [],
      konsultasi: [],
      pesanSurat: [],
      jadwalSidang: [],
      pendaftaranTesis: [],
      aktivitas: [],
      dokumenTesis: [],
      biayaUjian: [],
      panduanSOP: [],
      printedDocs: [],
      pengaturan: [],
      helpdeskTiket: [],
      tahunAkademik: [],
      arsipSurat: [],
      nomorSuratKeluar: [],
      peminjamanAlat: [],
    };

    const mapping: Record<string, string> = {
      logo: "logo",
      pengguna: "pengguna",
      mahasiswa: "mahasiswa",
      dosen: "dosen",
      pengumuman: "pengumuman",
      bimbingan: "bimbingan",
      judul: "judul",
      konsultasi: "konsultasi",
      pesansurat: "pesanSurat",
      jadwalsidang: "jadwalSidang",
      pendaftarantesis: "pendaftaranTesis",
      aktivitas: "aktivitas",
      dokumentesis: "dokumenTesis",
      biayaujian: "biayaUjian",
      panduansop: "panduanSOP",
      printeddocs: "printedDocs",
      pengaturan: "pengaturan",
      helpdesktiket: "helpdeskTiket",
      tahunakademik: "tahunAkademik",
      arsipsurat: "arsipSurat",
      nomorsuratkeluar: "nomorSuratKeluar",
      peminjamanalat: "peminjamanAlat",
    };

    for (const key of Object.keys(parsed)) {
      const lowerKey = key.toLowerCase();
      const canonicalKey = mapping[lowerKey];
      if (canonicalKey) {
        if (canonicalKey === "logo") {
          canonicalDb.logo = parsed[key];
        } else if (Array.isArray(parsed[key])) {
          const existingArray = canonicalDb[canonicalKey] || [];
          const newArray = parsed[key] || [];
          newArray.forEach((item: any) => {
            if (item && item.id) {
              const duplicate = existingArray.find((ex: any) => ex && String(ex.id) === String(item.id));
              if (!duplicate) {
                existingArray.push(item);
              }
            } else if (item) {
              existingArray.push(item);
            }
          });
          canonicalDb[canonicalKey] = existingArray;
        }
      }
    }

    if (!canonicalDb.pengguna || canonicalDb.pengguna.length === 0) {
      canonicalDb.pengguna = DEFAULT_SEED_DATA.pengguna;
    }

    let hasPlaintext = false;
    if (canonicalDb.pengguna && Array.isArray(canonicalDb.pengguna)) {
      canonicalDb.pengguna = canonicalDb.pengguna.map((u: any) => {
        if (!u.password) {
          u.password = bcrypt.hashSync("123456", 10);
          hasPlaintext = true;
        } else if (!u.password.startsWith("$2a$") && !u.password.startsWith("$2b$")) {
          u.password = bcrypt.hashSync(u.password, 10);
          hasPlaintext = true;
        }
        return u;
      });
    }

    if (hasPlaintext) {
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(canonicalDb, null, 2), "utf-8");
      } catch (err) {
        console.error("Error auto-hashing database passwords:", err);
      }
    }

    if (!canonicalDb.panduanSOP || canonicalDb.panduanSOP.length === 0) {
      canonicalDb.panduanSOP = DEFAULT_SEED_DATA.panduanSOP;
    }

    if (!canonicalDb.pengaturan || canonicalDb.pengaturan.length === 0) {
      canonicalDb.pengaturan = DEFAULT_SEED_DATA.pengaturan;
    }

    if (!canonicalDb.helpdeskTiket || canonicalDb.helpdeskTiket.length === 0) {
      canonicalDb.helpdeskTiket = DEFAULT_SEED_DATA.helpdeskTiket;
    }

    if (!canonicalDb.tahunAkademik || canonicalDb.tahunAkademik.length === 0) {
      canonicalDb.tahunAkademik = DEFAULT_SEED_DATA.tahunAkademik;
    }

    cachedDbState = canonicalDb;
    return cachedDbState;
  } catch (err) {
    console.error("Error loading and parsing db.json, returning fallback seeds in memory:", err);
    cachedDbState = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA));
    return cachedDbState;
  }
}

// Low-latency memory-cached write queue that updates state immediately and enqueues safe execution on disk
function writeDB(data: any) {
  // Update state in active memory instantly so that readers immediately get the updated state
  cachedDbState = data;

  // Add file persistence task to our lock-free promise chain
  writeQueuePromise = writeQueuePromise.then(() => {
    return atomicWriteDisk(data);
  }).catch((queueErr) => {
    console.error("Error in serialized async disk writer queue step:", queueErr);
  });
}

// ========== AUTH MIDDLEWARE ==========

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Akses ditolak. Token autentikasi tidak ditemukan." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Sesi Anda telah berakhir. Silakan login kembali." });
    }
    req.user = decoded;
    next();
  });
}

// ========== API ROUTES ==========

// Public login endpoint
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan kata sandi wajib diisi." });
  }

  const db = readDB();
  const matchedUser = db.pengguna.find(
    (u: any) => u.email.toLowerCase() === email.trim().toLowerCase()
  );

  if (!matchedUser) {
    return res.status(401).json({ error: "Email tidak terdaftar di sistem SIMTESIS." });
  }

  if (matchedUser.status === "Nonaktif") {
    return res.status(403).json({ error: "Akun ini sedang dinonaktifkan." });
  }

  // Check password with support for plaintext seeds and hashed bcrypt entries
  const isHash = matchedUser.password.startsWith("$2a$") || matchedUser.password.startsWith("$2b$");
  const passwordValid = isHash
    ? bcrypt.compareSync(password, matchedUser.password)
    : matchedUser.password === password;

  if (!passwordValid) {
    return res.status(401).json({ error: "Kata sandi yang Anda masukkan salah." });
  }

  // Securely auto-hash password if it was still in plaintext
  if (!isHash) {
    matchedUser.password = bcrypt.hashSync(password, 10);
    writeDB(db);
  }

  // Sign JWT
  const token = jwt.sign(
    { id: matchedUser.id, email: matchedUser.email, role: matchedUser.role, nama: matchedUser.nama },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  const { password: _, ...userWithoutPassword } = matchedUser;
  res.json({
    success: true,
    user: userWithoutPassword,
    token
  });
});

// Configure endpoint for public non-sensitive settings (like logo)
app.get("/api/public-config", (req, res) => {
  const db = readDB();
  res.json({
    logo: db.logo || null
  });
});

// GET Public schedule RSVP info
app.get("/api/rsvp-info", (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "ID jadwal diperlukan." });
  }

  const db = readDB();
  const schedule = (db.jadwalSidang || []).find((s: any) => String(s.id) === String(id));
  if (!schedule) {
    return res.status(404).json({ error: "Jadwal sidang tidak ditemukan." });
  }

  // Find student thesis details
  const student = (db.mahasiswa || []).find((m: any) => String(m.id) === String(schedule.mahasiswaId) || m.nama === schedule.namaMahasiswa);
  
  res.json({
    id: schedule.id,
    namaMahasiswa: schedule.namaMahasiswa,
    nim: student?.nim || "-",
    tanggal: schedule.tanggal,
    waktu: schedule.waktu,
    ruang: schedule.ruang,
    jenisUjian: schedule.jenisUjian || "Sidang Tugas Akhir",
    penguji1: schedule.penguji1,
    penguji2: schedule.penguji2,
    accPenguji1: schedule.accPenguji1 || "Menunggu",
    accPenguji2: schedule.accPenguji2 || "Menunggu",
    catatan: schedule.catatan || ""
  });
});

// POST Public schedule RSVP response
app.post("/api/rsvp-public", (req, res) => {
  const { id, role, status } = req.body;
  if (!id || !role || !status) {
    return res.status(400).json({ error: "Parameter id, role, dan status wajib dikirim." });
  }

  if (status !== "Disetujui" && status !== "Ditolak") {
    return res.status(400).json({ error: "Status harus Disetujui atau Ditolak" });
  }

  const db = readDB();
  const scheduleIndex = (db.jadwalSidang || []).findIndex((s: any) => String(s.id) === String(id));
  
  if (scheduleIndex === -1) {
    return res.status(404).json({ error: "Jadwal sidang tidak ditemukan." });
  }

  const schedule = db.jadwalSidang[scheduleIndex];
  let examinerEmail = "";
  
  if (role === "penguji1") {
    schedule.accPenguji1 = status;
    examinerEmail = schedule.penguji1 || "Penguji 1";
  } else if (role === "penguji2") {
    schedule.accPenguji2 = status;
    examinerEmail = schedule.penguji2 || "Penguji 2";
  } else {
    return res.status(400).json({ error: "Role tidak valid. Gunakan penguji1 atau penguji2." });
  }

  // Update pendaftaranTesis if there is a match
  const pendaftaranIndex = (db.pendaftaranTesis || []).findIndex((p: any) => 
    (p.mahasiswaEmail === examinerEmail || p.namaMahasiswa === schedule.namaMahasiswa) && p.status === "Menunggu"
  );
  if (pendaftaranIndex !== -1) {
    if (role === "penguji1") {
      db.pendaftaranTesis[pendaftaranIndex].accPenguji1 = status;
    } else {
      db.pendaftaranTesis[pendaftaranIndex].accPenguji2 = status;
    }
  }

  // Log in audit trail (AktivitasLog)
  const logId = `ACT_${Date.now()}`;
  db.aktivitas.unshift({
    id: logId,
    nama: examinerEmail,
    email: examinerEmail,
    role: "Dosen",
    tindakan: "Edit",
    tabel: "Jadwal Sidang",
    deskripsi: `RSVP Kehadiran Umum / Cepat: Mengubah status kehadiran Penguji (${role}) pada ujian mahasiswa "${schedule.namaMahasiswa}" menjadi "${status}"`,
    tanggal: new Date().toISOString()
  });

  writeDB(db);

  res.json({
    success: true,
    message: `Terimakasih! Konfirmasi kehadiran Anda (${status}) telah tersimpan ke dalam basis data sistem SIMTESIS.`,
    schedule
  });
});

// Get full database (secured)
app.get("/api/db", authenticateToken, (req, res) => {
  const db = readDB();
  // Strip sensitive passwords out of the database before passing it to frontend clients
  if (db.pengguna && Array.isArray(db.pengguna)) {
    db.pengguna = db.pengguna.map((u: any) => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
  }
  res.json(db);
});

// Update or reset logo (secured)
app.post("/api/logo", authenticateToken, (req, res) => {
  const { logo } = req.body;
  const db = readDB();
  db.logo = logo || null;
  writeDB(db);
  res.json({ success: true, logo: db.logo });
});

// AI Assistant endpoint (secured)
app.post("/api/ai/generate", authenticateToken, async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
            systemInstruction: "Nama Anda adalah Inotna, Asisten Akademik AI SIMTA (Sistem Informasi Manajemen Tugas Akhir) Universitas Muhammadiyah Pontianak. Anda sangat profesional, ramah, dan solutif. Tugas Anda adalah membantu dosen dan mahasiswa terkait penyusunan tugas akhir, tata bahasa, struktur usulan penelitian, judul tugas akhir, dan administrasi akademik. Berikan jawaban yang terstruktur dan mudah dipahami dalam Bahasa Indonesia."
        }
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// Helper functions for action logging (Audit Trail)
function getTableFriendlyName(table: string): string {
  const mapping: Record<string, string> = {
    pengguna: "Pengguna",
    mahasiswa: "Mahasiswa",
    dosen: "Dosen",
    pengumuman: "Pengumuman",
    bimbingan: "Bimbingan",
    judul: "Usulan Judul Tugas Akhir",
    konsultasi: "Konsultasi Bimbingan",
    pesansurat: "Permohonan Surat",
    jadwalsidang: "Jadwal Sidang",
    pendaftarantesis: "Pendaftaran Tugas Akhir",
    panduansop: "Panduan & SOP",
    printeddocs: "Riwayat Cetak Berkas",
    arsipsurat: "Arsip Surat",
    nomorsuratkeluar: "Nomor Surat Keluar",
    peminjamanalat: "Peminjaman Alat Laboratorium"
  };
  return mapping[table.toLowerCase()] || table;
}

function labelOfItem(table: string, item: any): string {
  if (!item) return "";
  if (table === "judul") return item.judul || "";
  if (table === "pengumuman") return item.judul || "";
  if (table === "pengguna" || table === "mahasiswa" || table === "dosen") return item.nama || "";
  if (table === "bimbingan") return `Bimbingan Mhs ID ${item.mahasiswaId || ""}`;
  if (table === "pesansurat") return item.jenisSurat || "";
  if (table === "konsultasi") return item.subjek || "";
  if (table === "pendaftarantesis") return item.judul || "";
  if (table === "panduansop") return item.judul || "";
  if (table === "arsipsurat") return item.judulSurat || "";
  if (table === "nomorsuratkeluar") return item.nomorSuratLengkap || "";
  if (table === "peminjamanalat") return `${item.namaMahasiswa} - ${item.namaAlat}`;
  return "";
}

function generateDescription(table: string, action: string, data: any, existingItem?: any): string {
  const friendlyTable = getTableFriendlyName(table);
  const lowercaseTable = table.toLowerCase();
  
  let actionPrefix = "";
  if (action === "add") actionPrefix = "Menambahkan";
  else if (action === "update") actionPrefix = "Memperbarui";
  else if (action === "delete") actionPrefix = "Menghapus";

  let detail = "";
  if (action === "add") {
    if (data) {
      if (lowercaseTable === "judul") {
        detail = `usulan judul baru "${data.judul || ""}" untuk mahasiswa ${data.namaMahasiswa || data.mahasiswaEmail || ""}`;
      } else if (lowercaseTable === "pengumuman") {
        detail = `pengumuman baru "${data.judul || ""}"`;
      } else if (lowercaseTable === "pengguna") {
        detail = `akun pengguna baru "${data.nama || ""}" (${data.email || ""}) dengan role ${data.role || ""}`;
      } else if (lowercaseTable === "mahasiswa") {
        detail = `mahasiswa baru "${data.nama || ""}" (NIM: ${data.nim || ""})`;
      } else if (lowercaseTable === "dosen") {
        detail = `dosen baru "${data.nama || ""}" (NIDN: ${data.nidn || ""})`;
      } else if (lowercaseTable === "bimbingan") {
        detail = `plot bimbingan mahasiswa ID ${data.mahasiswaId || ""}`;
      } else if (lowercaseTable === "jadwalsidang") {
        detail = `jadwal sidang baru untuk mahasiswa "${data.namaMahasiswa || ""}" pada tanggal ${data.tanggal || ""}`;
      } else if (lowercaseTable === "pendaftarantesis") {
        detail = `pendaftaran seminar/tugas akhir baru untuk mahasiswa "${data.namaMahasiswa || ""}"`;
      } else if (lowercaseTable === "pesansurat") {
        detail = `permohonan surat jenis "${data.jenisSurat || ""}" untuk keperluan "${data.keperluan || ""}"`;
      } else if (lowercaseTable === "konsultasi") {
        detail = `konsultasi bimbingan baru dengan subjek "${data.subjek || ""}"`;
      } else if (lowercaseTable === "arsipsurat") {
        detail = `arsip surat "${data.judulSurat || ""}" (${data.nomorSurat || ""})`;
      } else if (lowercaseTable === "nomorsuratkeluar") {
        detail = `nomor surat keluar "${data.nomorSuratLengkap || ""}" perihal "${data.perihal || ""}"`;
      } else if (lowercaseTable === "peminjamanalat") {
        detail = `peminjaman alat "${data.namaAlat || ""}" oleh ${data.namaMahasiswa || ""}`;
      } else {
        detail = `data pada tabel ${friendlyTable}`;
      }
    }
  } else if (action === "update") {
    const item = existingItem || data || {};
    const label = item.nama || item.judul || item.namaMahasiswa || item.subjek || item.nim || labelOfItem(lowercaseTable, item) || `ID ${item.id || ""}`;
    
    if (lowercaseTable === "judul" && data.status) {
      detail = `status usulan judul "${label}" menjadi "${data.status}"`;
    } else if (lowercaseTable === "pendaftarantesis" && data.status) {
      detail = `status pendaftaran tugas akhir "${label}" menjadi "${data.status}"`;
    } else if (lowercaseTable === "pesansurat" && data.status) {
      detail = `status permohonan surat "${label}" menjadi "${data.status}"`;
    } else if (lowercaseTable === "konsultasi" && data.status) {
      detail = `status konsultasi "${label}" divalidasi/dibalas`;
    } else if (data.status) {
      detail = `status "${friendlyTable}" "${label}" menjadi "${data.status}"`;
    } else {
      detail = `data ${friendlyTable} "${label}"`;
    }
  } else if (action === "delete") {
    const item = existingItem || {};
    const label = item.nama || item.judul || item.namaMahasiswa || item.subjek || item.nim || labelOfItem(lowercaseTable, item) || "";
    detail = `data ${friendlyTable} ${label ? `"${label}"` : ""}`;
  }

  return `${actionPrefix} ${detail}`.trim();
}

// Unified mutate endpoint for CRUD on state tables
app.post("/api/mutate", authenticateToken, (req, res) => {
  const { table, action, data, keyCol, keyVal, user } = req.body;
  
  if (!table) {
    res.status(400).json({ error: "Table name is required" });
    return;
  }
  
  const db = readDB();
  const lowercaseTable = table.toLowerCase();
  
  const mapping: Record<string, string> = {
    pengguna: "pengguna",
    mahasiswa: "mahasiswa",
    dosen: "dosen",
    pengumuman: "pengumuman",
    bimbingan: "bimbingan",
    judul: "judul",
    konsultasi: "konsultasi",
    pesansurat: "pesanSurat",
    jadwalsidang: "jadwalSidang",
    pendaftarantesis: "pendaftaranTesis",
    aktivitas: "aktivitas",
    dokumentesis: "dokumenTesis",
    biayaujian: "biayaUjian",
    panduansop: "panduanSOP",
    printeddocs: "printedDocs",
    pengaturan: "pengaturan",
    arsipsurat: "arsipSurat",
    nomorsuratkeluar: "nomorSuratKeluar",
    peminjamanalat: "peminjamanAlat"
  };
  
  const actualTableKey = mapping[lowercaseTable];
  
  if (!actualTableKey) {
    res.status(403).json({ error: "Akses ditolak. Nama tabel tidak valid atau tidak memiliki izin akses." });
    return;
  }
  
  if (!(actualTableKey in db)) {
    db[actualTableKey] = [];
  }
  
  const collection = db[actualTableKey];
  
  // Find existing object for update or delete logging
  let existingItem = null;
  if (action === "update" || action === "delete") {
    if (keyCol && keyVal !== undefined) {
      existingItem = collection.find((item: any) => String(item[keyCol]) === String(keyVal));
    }
  }
  
  if (action === "add") {
    // Generate a secure, sequential-like pseudo-ID if missing
    if (!data.id) {
      data.id = `${table.substring(0, 3).toUpperCase()}_${Date.now()}`;
    }
    // Automatically hash users passwords if they are being added
    if (actualTableKey === "pengguna") {
      if (data.password) {
        data.password = bcrypt.hashSync(data.password, 10);
      } else {
        data.password = bcrypt.hashSync("123456", 10);
      }
    }
    collection.push(data);
  } else if (action === "update") {
    if (!keyCol || keyVal === undefined) {
      res.status(400).json({ error: "keyCol and keyVal are required for updating" });
      return;
    }
    const index = collection.findIndex((item: any) => String(item[keyCol]) === String(keyVal));
    if (index >= 0) {
      // Automatically hash user passwords if being updated
      if (actualTableKey === "pengguna" && data.password) {
        if (!data.password.startsWith("$2a$") && !data.password.startsWith("$2b$")) {
          data.password = bcrypt.hashSync(data.password, 10);
        }
      }
      collection[index] = { ...collection[index], ...data };
    } else {
      res.status(404).json({ error: "Item not found to update" });
      return;
    }
  } else if (action === "delete") {
    if (!keyCol || keyVal === undefined) {
      res.status(400).json({ error: "keyCol and keyVal are required for deleting" });
      return;
    }
    db[actualTableKey] = collection.filter((item: any) => String(item[keyCol]) !== String(keyVal));
  } else {
    res.status(400).json({ error: `Invalid action: ${action}` });
    return;
  }
  
  // Audit Logging
  if (user) {
    const deskripsiLog = generateDescription(table, action, data, existingItem);
    const logId = `LOG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const logEntry = {
      id: logId,
      nama: user.nama || "Sistem",
      email: user.email || "-",
      role: user.role || "User",
      tindakan: action === "add" ? "Tambah" : action === "update" ? "Edit" : "Hapus",
      tabel: getTableFriendlyName(table),
      deskripsi: deskripsiLog,
      tanggal: new Date().toISOString()
    };
    if (!db.aktivitas) {
      db.aktivitas = [];
    }
    db.aktivitas.unshift(logEntry); // push to front of array so recent logs are first
    
    // limit local db.aktivitas to 200 logs to keep db size reasonable
    if (db.aktivitas.length > 200) {
      db.aktivitas = db.aktivitas.slice(0, 200);
    }
  }
  
  writeDB(db);
  res.json({ success: true, db: readDB() });
});

// Endpoint to handle sending WhatsApp reminders with support for both simulation and real API Gateway integration
app.post("/api/wa/send", authenticateToken, async (req, res) => {
  const { phone, message, recipientName, role, user } = req.body;
  
  if (!phone || !message) {
    res.status(400).json({ error: "Nomor handphone dan pesan WA wajib diisi" });
    return;
  }
  
  const db = readDB();
  const settings = db.pengaturan || [];
  
  const waStatus = settings.find((p: any) => p.id === "wa_status")?.value || "Nonaktif";
  const waProvider = settings.find((p: any) => p.id === "wa_gateway_provider")?.value || "Fonnte";
  const waToken = settings.find((p: any) => p.id === "wa_token")?.value || "";
  const waSenderNo = settings.find((p: any) => p.id === "wa_sender_no")?.value || "";

  // Format phone number to clean digits (remove symbols, replace leading 0 with 62)
  let cleanPhone = phone.replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.substring(1);
  }

  const logEntry = {
    id: `LOG_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    nama: user?.nama || "Sistem Pengingat",
    email: user?.email || "-",
    role: user?.role || "System",
    tindakan: "Kirim WA",
    tabel: "Notifikasi WA",
    deskripsi: `Mengirim pengingat WhatsApp ke ${recipientName} (${role}) di nomor ${phone}. Status: `,
    tanggal: new Date().toISOString()
  };

  if (waStatus === "Nonaktif") {
    // Mode Simulasi (Sandbox) because status is off
    logEntry.deskripsi += `[Mode Simulasi Sandboxed] "${message.substring(0, 60)}..."`;
    if (!db.aktivitas) db.aktivitas = [];
    db.aktivitas.unshift(logEntry);
    writeDB(db);
    
    res.json({
      success: true,
      simulated: true,
      message: `Pesan ke ${recipientName} diproses sukses via Sandbox (WhatsApp dinonaktifkan di pengaturan).`,
      details: {
        phone: cleanPhone,
        recipient: recipientName,
        messageText: message,
        status: "Terkirim (Simulasi)"
      },
      db: readDB()
    });
    return;
  }

  // Real Integration Mode!
  try {
    let gatewayUrl = "https://api.fonnte.com/send";
    let headers: Record<string, string> = {
      "Authorization": waToken
    };
    let body: any = {};

    if (waProvider === "Fonnte") {
      gatewayUrl = "https://api.fonnte.com/send";
      headers = {
        "Authorization": waToken
      };
      // For application/x-www-form-urlencoded or json
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({
        target: cleanPhone,
        message: message,
        countryCode: "62"
      });
    } else if (waProvider === "Wablas") {
      gatewayUrl = "https://api.wablas.com/api/send-message";
      headers = {
        "Authorization": waToken,
        "Content-Type": "application/json"
      };
      body = JSON.stringify({
        phone: cleanPhone,
        message: message
      });
    } else {
      // General custom or custom HTTP endpoint url
      gatewayUrl = waProvider.startsWith("http") ? waProvider : "https://api.fonnte.com/send";
      headers = {
        "Content-Type": "application/json",
        "Authorization": waToken ? `Bearer ${waToken}` : ""
      };
      body = JSON.stringify({
        target: cleanPhone,
        message: message,
        sender: waSenderNo
      });
    }

    // Call external service securely from server side
    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: headers,
      body: body
    });

    const isOk = response.ok;
    const resText = await response.text();

    if (isOk) {
      logEntry.deskripsi += `[Berhasil Terkirim via ${waProvider}] "${message.substring(0, 60)}..."`;
      if (!db.aktivitas) db.aktivitas = [];
      db.aktivitas.unshift(logEntry);
      writeDB(db);

      res.json({
        success: true,
        simulated: false,
        message: `Pesan ke ${recipientName} berhasil dikirim melalui ${waProvider} API Gateway!`,
        apiResponse: resText,
        db: readDB()
      });
    } else {
      // API Gateway error (e.g. invalid token)
      logEntry.deskripsi += `[Gagal Kirim - API Error] "${message.substring(0, 60)}..."`;
      if (!db.aktivitas) db.aktivitas = [];
      db.aktivitas.unshift(logEntry);
      writeDB(db);

      res.status(502).json({
        success: false,
        simulated: false,
        error: `Provider ${waProvider} mengembalikan error (Status ${response.status}): ${resText}`,
        db: readDB()
      });
    }
  } catch (err: any) {
    // Network / timeout error
    logEntry.deskripsi += `[Gagal Kirim - Kesalahan Jaringan Server: ${err.message}]`;
    if (!db.aktivitas) db.aktivitas = [];
    db.aktivitas.unshift(logEntry);
    writeDB(db);

    res.status(500).json({
      success: false,
      simulated: false,
      error: `Kesalahan jaringan server saat memanggil gateway WhatsApp: ${err.message}`,
      db: readDB()
    });
  }
});

// Endpoint to restore database fully
app.post("/api/db/restore", authenticateToken, (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Invalid payload format" });
  }
  
  if (!payload.pengguna || !Array.isArray(payload.pengguna)) {
    return res.status(400).json({ error: "Payload missing required 'pengguna' array" });
  }

  writeDB(payload);
  console.log("Database successfully restored from client request!");
  res.json({ success: true, db: readDB() });
});

// Endpoint to reset database to default seeds
app.post("/api/db/reset", authenticateToken, (req, res) => {
  writeDB(DEFAULT_SEED_DATA);
  console.log("Database successfully reset to default academic seeds!");
  res.json({ success: true, db: readDB() });
});

// ========== VITE MIDDLEWARE CONFIGURATION ==========

function serveStaticFiles() {
  console.log("Starting server in PRODUCTION/STATIC mode.");
  
  // Find where dist/index.html is located with fallback mechanisms for different cwd and bundlers
  let distPath = path.join(process.cwd(), "dist");
  if (!fs.existsSync(path.join(distPath, "index.html"))) {
    // Try relative to __dirname (which resolves to dist folder when bundled as dist/server.cjs)
    const relativeDist = path.join(__dirname, "../dist");
    if (fs.existsSync(path.join(relativeDist, "index.html"))) {
      distPath = relativeDist;
    } else {
      const sameDirDist = path.join(__dirname);
      if (fs.existsSync(path.join(sameDirDist, "index.html"))) {
        distPath = sameDirDist;
      }
    }
  }

  console.log("Serving static assets from:", distPath);
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    // Prevent matching API routes
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ error: "API Route Not Found" });
      return;
    }
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Error: SIMTESIS index.html not found. Please ensure build is completed.");
    }
  });
}

async function startServer() {
  // Let's check if the current file path starts/ends with cjs or is running from dist packaging
  const isCjsBundle = typeof __filename !== "undefined" && (__filename.endsWith(".cjs") || __filename.includes("dist"));
  const isProduction = process.env.NODE_ENV === "production" || isCjsBundle;

  if (!isProduction) {
    try {
      console.log("Starting server in DEVELOPMENT mode with Vite Middleware.");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (viteError) {
      console.error("Vite server failed to start, falling back to static:", viteError);
      serveStaticFiles();
    }
  } else {
    // Only serve static files if not on Vercel (Vercel handles static routing via vercel.json)
    if (!process.env.VERCEL) {
      serveStaticFiles();
    }
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

// Start server unless we are running in Vercel serverless environment
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}

// Export for Vercel and generic use
export default app;
