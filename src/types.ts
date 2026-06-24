export interface Pengguna {
  id: string;
  nama: string;
  email: string;
  role: "Superadmin" | "Admin" | "Dosen" | "Mahasiswa" | "Prodi";
  status: "Aktif" | "Nonaktif";
  password?: string;
  fotoProfil?: string;
  programStudi?: "Ilmu Kesehatan Masyarakat" | "Psikologi" | "Magister Kesehatan Masyarakat";
}

export interface Mahasiswa {
  id: string;
  nim: string;
  nama: string;
  email: string;
  judul: string;
  status: "Aktif" | "Lulus" | "Lulusan";
  peminatan?: string;
}

export interface Dosen {
  id: string;
  nidn: string;
  nama: string;
  email: string;
  bidangKeahlian: string;
  status: "Aktif" | "Cuti";
  meetLink?: string;
}

export interface Pengumuman {
  id: string;
  judul: string;
  tanggal: string;
  aktif: boolean;
}

export interface Bimbingan {
  id: string;
  mahasiswaId: string;
  pembimbing1: string; // email of Dosen
  pembimbing2: string; // email of Dosen, can be empty
  penguji1: string;    // email of Dosen
  penguji2: string;    // email of Dosen
  tanggalDiassign: string;
  validasiProposal?: "Belum" | "Disetujui";
  validasiSeminarHasil?: "Belum" | "Disetujui";
  validasiSks?: "Belum" | "Disetujui";
  persetujuanPublikasi?: "Belum" | "Disetujui";
  persetujuanNilai?: "Belum" | "Disetujui";
  nilaiAkhir?: string;
}

export interface Judul {
  id: string;
  mahasiswaEmail: string;
  namaMahasiswa: string;
  judul: string;
  abstrak: string;
  status: "Menunggu" | "Telah Dicek Admin" | "Disetujui" | "Revisi" | "Ditolak";
  tanggal: string;
  catatan?: string;
  pembimbingSatuPref?: string; // email of Dosen
  pembimbingDuaPref?: string; // email of Dosen
}

export interface ChatMessage {
  pengirim: string;
  pesan: string;
  waktu: string;
  lampiranData?: string;
  lampiranNama?: string;
  lampiranTipe?: "Word" | "PDF" | "Image";
  isKoreksi?: boolean;
  annotations?: string; // JSON string of page drawings
  comments?: string;    // JSON string of comments
}

export interface Konsultasi {
  id: string;
  mahasiswaEmail: string;
  namaMahasiswa: string;
  dosenEmail: string;
  namaDosen: string;
  subjek: string;
  pesan: string;
  balasan?: string;
  riwayatChat: ChatMessage[];
  tanggal: string;
  status: "Menunggu" | "Dibalas";
  meetLink?: string;
  calendarEventId?: string;
}

export interface PesanSurat {
  id: string;
  mahasiswaEmail: string;
  namaMahasiswa: string;
  jenisSurat: string;
  tujuanSurat: string;
  keperluan: string;
  dataDiperlukan: string;
  tanggal: string;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  catatan?: string;
  nomorSurat?: string;
  programStudi?: string;
}

export interface JadwalSidang {
  id: string;
  mahasiswaId: string;
  namaMahasiswa: string;
  tanggal: string;
  waktu: string;
  ruang: string;
  penguji1: string; // email
  penguji2: string; // email
  status: "Dijadwalkan" | "Selesai" | "Ditunda";
  jenisUjian?: "Seminar Proposal" | "Seminar Hasil" | "Sidang Tugas Akhir";
  accMahasiswa?: "Menunggu" | "Disetujui" | "Ditolak";
  accPenguji1?: "Menunggu" | "Disetujui" | "Ditolak" | "Tidak Ada";
  accPenguji2?: "Menunggu" | "Disetujui" | "Ditolak" | "Tidak Ada";
  accProdi?: "Menunggu" | "Disetujui" | "Ditolak";
  diusulkanOleh?: "Staf" | "Mahasiswa";
  catatan?: string;
  meetLink?: string;
  calendarEventId?: string;
  isExternalPenguji1?: boolean;
  externalPenguji1Name?: string;
  externalPenguji1Instansi?: string;
  isExternalPenguji2?: boolean;
  externalPenguji2Name?: string;
  externalPenguji2Instansi?: string;
}

export interface PendaftaranTesis {
  id: string;
  mahasiswaEmail: string;
  namaMahasiswa: string;
  judul: string;
  linkProposal: string;
  tanggal: string;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  jenisPendaftaran?: "Seminar Proposal" | "Seminar Hasil" | "Sidang Tugas Akhir" | "Yudisium";
  
  // New requirements & payment fields
  buktiPembayaran?: string; // Base64 image/pdf contents
  buktiPembayaranNama?: string; // File name
  filePersyaratan?: string; // Base64 document
  filePersyaratanNama?: string; // File name
  statusAdministrasi?: "Lengkap" | "Belum Lengkap";
  checklistSyarat?: string[]; // Array of checkbox IDs that the student ticked
  catatanAproval?: string; // Optional response note from admin/prodi
  nominalBayar?: number; // Fee charged at register time

  // Electronic signatures for advisors & examiners
  accPembimbing1?: "Menunggu" | "Disetujui" | "Ditolak" | "Tidak Ada";
  accPembimbing2?: "Menunggu" | "Disetujui" | "Ditolak" | "Tidak Ada";
  accPenguji1?: "Menunggu" | "Disetujui" | "Ditolak" | "Tidak Ada";
  accPenguji2?: "Menunggu" | "Disetujui" | "Ditolak" | "Tidak Ada";

  // Academic clearance statuses managed by admins
  statusTranskrip?: "Lengkap" | "Belum Lengkap";
  statusKrs?: "Lengkap" | "Belum Lengkap";

  // Public Health Academic System integrations
  peminatan?: string; // e.g., "Epidemiologi", "Kesehatan Lingkungan", "AKK", etc.
  noEtikKEPK?: string; // Ethics Clearance Protocol Number
  similarityTurnitin?: number; // Turnitin Plagiarism similarity percentage
}

export interface BiayaUjian {
  id: string; // "sempro" | "semhas" | "sidang"
  nama: string;
  nominal: number;
}

export interface AktivitasLog {
  id: string;
  nama: string;
  email: string;
  role: string;
  tindakan: string; // 'Tambah' | 'Edit' | 'Hapus'
  tabel: string;
  deskripsi: string;
  tanggal: string;
}

export interface DokumenTesis {
  id: string;
  mahasiswaEmail: string;
  namaMahasiswa: string;
  judulTesis: string;
  namaFile: string;
  tipeFile: "Word" | "PDF";
  ukuranFile: string;
  fileData: string; // Base64 or descriptive string
  pengirimRole: "Mahasiswa" | "Dosen" | "Admin" | "Prodi" | "Superadmin";
  pengirimNama: string;
  penerimaEmail: string; // Target email, or "Pembimbing & Penguji" or "Mahasiswa" or "Semua"
  tanggal: string;
  catatan?: string;
  catatanReview?: string;
  reviewOleh?: string;
  tanggalReview?: string;
  statusReview?: "Belum Direview" | "Perlu Revisi" | "Disetujui";
  isPerbaikanTesis?: boolean;
  dosenReceivedNama?: string;
  dosenReceivedTanggal?: string;
}

export interface PanduanSOP {
  id: string;
  judul: string;
  kategori: "Panduan" | "SOP";
  subKategori: string; // e.g., "Sistematika Penulisan", "Administrasi", "Bimbingan", "Sidang Tesis"
  deskripsi: string;
  linkDownload?: string; // or base64 data
  fileNama?: string;
  fileData?: string; // base64 string
  tanggalInput: string;
  diunggahOleh: string;
}

export interface PrintedDocRecord {
  id: string; // Format: selectedMhsId_jenisUjian_tplId
  studentId: string;
  examType: string;
  docId: string;
  printedAt: string; // ISO string timestamp
}

export interface HelpdeskTiket {
  id: string;
  mahasiswaEmail: string;
  namaMahasiswa: string;
  kategori: string; // e.g., "Sistem", "Administrasi", "Bimbingan", "Lainnya"
  subjek: string;
  deskripsi: string;
  urgensi: "Rendah" | "Sedang" | "Tinggi";
  tanggal: string;
  status: "Terbuka" | "Diproses" | "Selesai";
  tanggapan?: string;
  tanggapanOleh?: string;
  tanggalTanggapan?: string;
}

export interface TahunAkademik {
  id: string;
  nama: string; // e.g., "Ganjil 2025/2026", "Genap 2024/2025"
  status: "Aktif" | "Arsip";
  tanggalMulai?: string;
  tanggalSelesai?: string;
}

export interface ArsipSurat {
  id: string;
  nomorSurat: string;
  judulSurat: string;
  jenis: "Masuk" | "Keluar";
  pengirimOrPenerima: string;
  tanggalSurat: string;
  tanggalArsip: string;
  fileNama?: string;
  fileData?: string;
  kategori?: string;
  keterangan?: string;
}

export interface NomorSuratKeluar {
  id: string;
  nomorUrut: number;
  nomorSuratLengkap: string;
  perihal: string;
  tujuan: string;
  tanggalPembuatan: string;
  pembuat: string;
  kategori: string;
}

export interface PeminjamanAlat {
  id: string;
  mahasiswaEmail: string;
  namaMahasiswa: string;
  nimMahasiswa: string;
  namaAlat: string;
  jumlah: number;
  tanggalPinjam: string;
  tanggalKembali: string;
  tujuanPenggunaan: string;
  status: "Menunggu" | "Disetujui" | "Ditolak" | "Dikembalikan";
  catatan?: string;
  petugasApprove?: string;
}

export interface AppState {
  logo: string | null;
  pengguna: Pengguna[];
  mahasiswa: Mahasiswa[];
  dosen: Dosen[];
  pengumuman: Pengumuman[];
  bimbingan: Bimbingan[];
  judul: Judul[];
  konsultasi: Konsultasi[];
  pesanSurat: PesanSurat[];
  jadwalSidang: JadwalSidang[];
  pendaftaranTesis: PendaftaranTesis[];
  aktivitas?: AktivitasLog[];
  dokumenTesis?: DokumenTesis[];
  biayaUjian?: BiayaUjian[];
  panduanSOP?: PanduanSOP[];
  printedDocs?: PrintedDocRecord[];
  pengaturan?: { id: string; value: string }[];
  helpdesktiket?: HelpdeskTiket[];
  tahunakademik?: TahunAkademik[];
  arsipSurat?: ArsipSurat[];
  nomorSuratKeluar?: NomorSuratKeluar[];
  peminjamanAlat?: PeminjamanAlat[];
}
