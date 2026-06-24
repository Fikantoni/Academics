import React, { useState, useEffect } from "react";
import { Printer, FileText, User, UserCheck, CreditCard, Clipboard, Award, ShieldAlert, Users, ChevronRight, Check } from "lucide-react";
import { AppState, Pengguna, Mahasiswa, Dosen, JadwalSidang, Bimbingan } from "../types";
import { printElementById, downloadStandaloneHtml, downloadPdfFromElement, openInNewTabForPrint } from "../utils/printHelper";
import { Download, Loader2, ExternalLink } from "lucide-react";
import { safeStorage } from "../lib/safeStorage";

interface BerkasMajuTabProps {
 currentUser: Pengguna;
 state: AppState;
 mutate: (
 table: string,
 action: "add" | "update" | "delete",
 data: any,
 keyCol?: string,
 keyVal?: any,
 silent?: boolean
 ) => Promise<any>;
 showToast: (msg: string, type?: "success" | "warning" | "error") => void;
}

export default function BerkasMajuTab({ currentUser, state, mutate, showToast }: BerkasMajuTabProps) {
 // Dynamic signee info configured by admin in Settings tab
 const dekanNama = state.pengaturan?.find((p) => p.id === "dekan_nama")?.value || "Ismael Saleh, S.K.M., M.Sc.";
 const dekanNidn = state.pengaturan?.find((p) => p.id === "dekan_nidn")?.value || "0411030052";
 const dekanJabatan = state.pengaturan?.find((p) => p.id === "dekan_jabatan")?.value || "Dekan Fakultas Ilmu Kesehatan dan Psikologi";

 // Current Selector States
 const [selectedMhsId, setSelectedMhsId] = useState<string>("");
 const [jenisUjian, setJenisUjian] = useState<"Seminar Proposal" | "Seminar Hasil" | "Sidang Tugas Akhir">("Seminar Proposal");
 const [tanggalUjian, setTanggalUjian] = useState<string>("");
 const [waktuUjian, setWaktuUjian] = useState<string>("09:00 - 10:30 WIB");
 const [ruangUjian, setRuangUjian] = useState<string>("Ruang FIKPsi - Gd. C Lt. 2");
 
 // Custom interactive printable values
 const [nilaiAngka, setNilaiAngka] = useState<number>(85);
 const [hasilKelulusan, setHasilKelulusan] = useState<string>("Lulus dengan Perbaikan");
 const [nominalHonor, setNominalHonor] = useState<number>(500000);
 const [catatanSaran, setCatatanSaran] = useState<string>("1. Perjelas kerangka teori dan landasan empiris teori perilaku.\n2. Sesuaikan populasi dan ukuran sampel dengan rujukan teori slovin.\n3. Perbaiki ejaan dan format penulisan daftar pustaka Harvard style.");
 const [hariPerbaikan, setHariPerbaikan] = useState<number>(14);

 // Advanced manually editable fields (synchronized initially, then custom overrideable)
 const [overrideTitle, setOverrideTitle] = useState<string>("");
 const [pb1Name, setPb1Name] = useState<string>("");
 const [pb2Name, setPb2Name] = useState<string>("");
 const [pj1Name, setPj1Name] = useState<string>("");
 const [pj2Name, setPj2Name] = useState<string>("");

 const [pb1Nidn, setPb1Nidn] = useState<string>("");
 const [pb2Nidn, setPb2Nidn] = useState<string>("");
 const [pj1Nidn, setPj1Nidn] = useState<string>("");
 const [pj2Nidn, setPj2Nidn] = useState<string>("");

 // Active document viewing overlay state
 const [activeDocToPrint, setActiveDocToPrint] = useState<string | null>(null);

 // Track printed status of documents per student + exam stage
 const [printedDocsLocal, setPrintedDocsLocal] = useState<Record<string, any>>(() => {
 const saved = safeStorage.getItem("printed_docs_state");
 return saved ? JSON.parse(saved) : {};
 });

 const printedDocs = React.useMemo(() => {
 const combined: Record<string, any> = { ...printedDocsLocal };
 if (state.printedDocs && Array.isArray(state.printedDocs)) {
 state.printedDocs.forEach((rec) => {
 if (rec && rec.id) {
 combined[rec.id] = rec.printedAt;
 }
 });
 }
 return combined;
 }, [printedDocsLocal, state.printedDocs]);

 // Google digital transformation & printing custom settings
 const [useTTE, setUseTTE] = useState<boolean>(true);
 const [hideHeaderLogo, setHideHeaderLogo] = useState<boolean>(false);
 const [isDownloading, setIsDownloading] = useState<boolean>(false);

 const handleDownloadPDF = async () => {
 if (!activeStudent || !activeDocToPrint) return;
 setIsDownloading(true);
 showToast("Mempersiapkan render PDF berkas ujian...", "success");
 const safeName = activeStudent.nama.replace(/[^a-z0-9]/gi, "_").toLowerCase();
 const filename = `Berkas_${activeDocToPrint}_${safeName}.pdf`;
 const success = await downloadPdfFromElement("print-area", filename);
 if (success) {
 showToast("Berkas sidang PDF berhasil diunduh!", "success");
 } else {
 showToast("Gagal mengunduh berkas PDF. Coba gunakan alternatif cetak.", "error");
 }
 setIsDownloading(false);
 };

 const handleDownloadHTML = () => {
 if (!activeStudent || !activeDocToPrint) return;
 const safeName = activeStudent.nama.replace(/[^a-z0-9]/gi, "_").toLowerCase();
 const filename = `Berkas_${activeDocToPrint}_${safeName}.html`;
 const success = downloadStandaloneHtml("print-area", filename);
 if (success) {
 showToast("Lembar cetak HTML berhasil diunduh! Silakan buka file untuk cetak/print bebas hambatan.", "success");
 } else {
 showToast("Gagal mengunduh cetakan HTML.", "error");
 }
 };

 const handleOpenInNewTab = () => {
 if (!activeStudent || !activeDocToPrint) return;
 const docName = docTemplates.find((d) => d.id === activeDocToPrint)?.name || "Berkas Sidang";
 showToast("Membuka dokumen di tab mandiri...", "success");
 const success = openInNewTabForPrint("print-area", `${docName} - ${activeStudent.nama}`);
 if (success) {
 showToast("Dokumen dibuka di tab baru! Gunakan tombol Cetak atau Ctrl + P untuk menjadi PDF.", "success");
 } else {
 showToast("Gagal membuka tab baru. Silakan izinkan pop-up blocker di peramban Anda.", "error");
 }
 };

 // Sync parameters automatically when student changes or exam changes
 const activeStudent = state.mahasiswa?.find((m) => m.id === selectedMhsId);
 const studentBimbingan = state.bimbingan?.find((b) => b.mahasiswaId === selectedMhsId);
 const matchedSchedule = state.jadwalSidang?.find(
 (j) => j.mahasiswaId === selectedMhsId && j.jenisUjian === jenisUjian
 );

 useEffect(() => {
 if (activeStudent) {
 setOverrideTitle(activeStudent.judul || "Formulasi Strategi Manajemen Program Kesehatan");
 
 // Look up supervisor names from state.dosen
 const p1 = state.dosen?.find((d) => d.email === studentBimbingan?.pembimbing1);
 const p2 = state.dosen?.find((d) => d.email === studentBimbingan?.pembimbing2);
 const j1 = state.dosen?.find((d) => d.email === (matchedSchedule?.penguji1 || studentBimbingan?.penguji1));
 const j2 = state.dosen?.find((d) => d.email === (matchedSchedule?.penguji2 || studentBimbingan?.penguji2));

 setPb1Name(p1 ? p1.nama : StudentSupervisorMock(1));
 setPb1Nidn(p1 ? p1.nidn : "0412030091");
 setPb2Name(p2 ? p2.nama : StudentSupervisorMock(2));
 setPb2Nidn(p2 ? p2.nidn : "-");

 if (matchedSchedule?.isExternalPenguji1 && matchedSchedule.externalPenguji1Name) {
 setPj1Name(matchedSchedule.externalPenguji1Name);
 setPj1Nidn(matchedSchedule.externalPenguji1Instansi || "-");
 } else {
 setPj1Name(j1 ? j1.nama : (StudentExaminerMock(1)));
 setPj1Nidn(j1 ? j1.nidn : "0411030052");
 }

 if (matchedSchedule?.isExternalPenguji2 && matchedSchedule.externalPenguji2Name) {
 setPj2Name(matchedSchedule.externalPenguji2Name);
 setPj2Nidn(matchedSchedule.externalPenguji2Instansi || "-");
 } else {
 setPj2Name(j2 ? j2.nama : (StudentExaminerMock(2)));
 setPj2Nidn(j2 ? j2.nidn : "0405090013");
 }

 if (matchedSchedule) {
 setTanggalUjian(matchedSchedule.tanggal);
 setWaktuUjian(matchedSchedule.waktu || "09:00 - 10:30 WIB");
 setRuangUjian(matchedSchedule.ruang || "Ruang FIKPsi - Gd. C Lt. 2");
 } else {
 // Set default date as today
 setTanggalUjian(new Date().toISOString().substring(0, 10));
 }

 // Automatic honor estimates based on exam type
 if (jenisUjian === "Seminar Proposal") setNominalHonor(500000);
 else if (jenisUjian === "Seminar Hasil") setNominalHonor(500000);
 else setNominalHonor(750000);
 }
 }, [selectedMhsId, jenisUjian, activeStudent, studentBimbingan, matchedSchedule]);

 const StudentSupervisorMock = (num: number) => {
 if (num === 1) return "Andri Dwi Hernawan, S.K.M., M. Kes (Epid)";
 return "Dr. Linda Suwarni, S.K.M., M.P.H";
 };

 const StudentExaminerMock = (num: number) => {
 if (num === 1) return "Dr. Ismael Saleh, S.K.M., M.Sc.";
 return "Eka Kartika Untari, M.Sc., Apt.";
 };

 // Convert number to Indonesian Words "Terbilang"
 const integerToIndonesianWords = (num: number): string => {
 const words = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
 if (num < 12) return words[num];
 if (num < 20) return words[num - 10] + " Belas";
 if (num < 100) return words[Math.floor(num / 10)] + " Puluh " + words[num % 10];
 if (num < 200) return "Seratus " + integerToIndonesianWords(num % 100);
 if (num < 1000) return words[Math.floor(num / 100)] + " Ratus " + integerToIndonesianWords(num % 100);
 if (num < 2000) return "Seribu " + integerToIndonesianWords(num % 1000);
 if (num < 1000000) return integerToIndonesianWords(Math.floor(num / 1000)) + " Ribu " + integerToIndonesianWords(num % 1000);
 if (num < 1000000000) return integerToIndonesianWords(Math.floor(num / 1000000)) + " Juta " + integerToIndonesianWords(num % 1000000);
 return "";
 };

 const formatDateIndonesianByString = (dateStr: string) => {
 if (!dateStr) return "-";
 const d = new Date(dateStr);
 if (isNaN(d.getTime())) return dateStr;
 const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
 const months = [
 "Januari", "Februari", "Maret", "April", "Mei", "Juni",
 "Juli", "Agustus", "September", "Oktober", "November", "Desember"
 ];
 return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
 };

 const formatDateOnlyIndonesian = (dateStr: string) => {
 if (!dateStr) return "-";
 const d = new Date(dateStr);
 if (isNaN(d.getTime())) return dateStr;
 const months = [
 "Januari", "Februari", "Maret", "April", "Mei", "Juni",
 "Juli", "Agustus", "September", "Oktober", "November", "Desember"
 ];
 return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
 };

 const formatDateTimeIndonesian = (isoStr: any) => {
 if (!isoStr) return "-";
 if (isoStr === true) return "Sudah Cetak (Waktu tak tercatat)";
 const d = new Date(isoStr);
 if (isNaN(d.getTime())) return typeof isoStr === "string" ? isoStr : "-";
 const months = [
 "Januari", "Februari", "Maret", "April", "Mei", "Juni",
 "Juli", "Agustus", "September", "Oktober", "November", "Desember"
 ];
 const pad = (n: number) => n.toString().padStart(2, "0");
 return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
 };

 const getLetterGrade = (num: number) => {
 if (num >= 80) return "A";
 if (num >= 75) return "A-";
 if (num >= 70) return "B+";
 if (num >= 65) return "B";
 if (num >= 60) return "C";
 return "D";
 };

 const hasPembimbing1 = !!(studentBimbingan?.pembimbing1 && studentBimbingan?.pembimbing1 !== "");
 const hasPembimbing2 = !!(studentBimbingan?.pembimbing2 && studentBimbingan?.pembimbing2 !== "");
 const hasPenguji1 = !!((matchedSchedule?.penguji1 || studentBimbingan?.penguji1) && (matchedSchedule?.penguji1 || studentBimbingan?.penguji1) !== "");
 const hasPenguji2 = !!((matchedSchedule?.penguji2 || studentBimbingan?.penguji2) && (matchedSchedule?.penguji2 || studentBimbingan?.penguji2) !== "");

 const isAssignedComplete = hasPembimbing1 && hasPembimbing2 && hasPenguji1 && hasPenguji2;

 // List of documents the user can generate
 const docTemplates = [
 { id: "undangan-seminar", name: "Surat Undangan Ujian Seminar", icon: FileText, desc: "Surat undangan resmi perihal pelaksanaan ujian seminar proposal/hasil bagi tim pembimbing & penguji.", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" },
 { id: "sk-pembimbing", name: "SK Penetapan Pembimbing Tugas Akhir", icon: FileText, desc: "Surat Keputusan Dekan mengenai penetapan Tim Pembimbing Tugas Akhir Mahasiswa.", color: "text-[#0d9488] bg-emerald-50 dark:bg-emerald-950/20", requireAssign: true },
 { id: "sk-penguji", name: "SK Penetapan Dewan Penguji", icon: Award, desc: "Surat Keputusan Dekan mengenai tim Dewan Penguji Ujian Tugas Akhir.", color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20", requireAssign: true },
 { id: "berita-acara", name: "Berita Acara Ujian", icon: FileText, desc: "Surat ketetapan hasil ujian, kelulusan, dan nilai total.", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/20" },
 { id: "presensi", name: "Presensi Dosen Penguji & Pb", icon: UserCheck, desc: "Lembar tanda tangan kesaksian kehadiran tim penguji.", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
 { id: "kwitansi", name: "Kwitansi Honorarium Dosen", icon: CreditCard, desc: "Tanda terima bayar honor menguji sesuai nominal standar.", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
 { id: "saran", name: "Lembar Catatan & Saran", icon: Clipboard, desc: "Format masukan revisi naskah secara tertulis dari penguji.", color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" },
 { id: "penilaian", name: "Lembar Penilaian Rubrik", icon: Award, desc: "Kriteria penilaian akademik terbobot per elemen uji.", color: "text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/20" },
 { id: "pernyataan-perbaikan", name: "Kesediaan Penyerahan Perbaikan", icon: ShieldAlert, desc: "Pernyataan komitmen mahasiswa merevisi draf tepat waktu.", color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20" },
 { id: "daftar-penonton", name: "Daftar Hadir Penonton", icon: Users, desc: "Lembar absensi audiens menyaksikan jalannya presentasi.", color: "text-violet-500 bg-violet-50 dark:bg-violet-950/20" },
 ];

 const handlePrint = async () => {
 printElementById("print-area");
 if (selectedMhsId && activeDocToPrint) {
 const key = `${selectedMhsId}_${jenisUjian}_${activeDocToPrint}`;
 const nowStr = new Date().toISOString();

 // 1. Maintain local Storage and local state
 setPrintedDocsLocal((prev) => {
 const next = { ...prev, [key]: nowStr };
 safeStorage.setItem("printed_docs_state", JSON.stringify(next));
 return next;
 });

 // 2. Transmit to server database
 const payload = {
 id: key,
 studentId: selectedMhsId,
 examType: jenisUjian,
 docId: activeDocToPrint,
 printedAt: nowStr
 };

 const existsInCloud = state.printedDocs?.some(r => r.id === key);
 try {
 if (existsInCloud) {
 await mutate("printedDocs", "update", payload, "id", key, true);
 } else {
 await mutate("printedDocs", "add", payload, "id", key, true);
 }
 showToast("Status & durasi proses cetak berhasil disinkronkan!", "success");
 } catch (err) {
 console.error("Failed to sync print status to cloud database:", err);
 }
 }
 };

 // Calculate printed documents metrics for the chosen student and exam type
 const printedCount = docTemplates.filter((tpl) => {
 const key = `${selectedMhsId}_${jenisUjian}_${tpl.id}`;
 return printedDocs[key];
 }).length;
 const totalCount = docTemplates.length;
 const percentPrinted = Math.min(100, Math.round((printedCount / totalCount) * 100));

 return (
 <div className="space-y-6">
 {/* Page Title Context Header */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)]">
 <div>
 <span className="text-xs font-bold text-[var(--brand-primary)] uppercase tracking-wider block mb-1">
 Menu Administrasi (Admin Tugas Akhir)
 </span>
 <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
 Berkas Maju Ujian Akhir S2
 </h2>
 <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
 Layanan pencetakan dokumen resmi kelayakan, berita acara, absensi, serta kwitansi ujian mahasiswa secara otomatis.
 </p>
 </div>
 </div>

 {/* Primary Grid Workspace */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 
 {/* left controls: Select Mahasiswa, Jenis Ujian, and override values */}
 <div className="lg:col-span-4 space-y-6">
 <div className="card">
 <h3 className="text-sm font-extrabold text-[var(--text-main)] mb-4 flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
 <span>âš™</span> Parameter Dokumen
 </h3>
 
 <div className="space-y-4">
 {/* Select Mahasiswa */}
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">
 Pilih Mahasiswa Aktif
 </label>
 <select
 value={selectedMhsId}
 onChange={(e) => setSelectedMhsId(e.target.value)}
 className="form-input text-xs font-semibold"
 >
 <option value="">-- Pilih Mahasiswa --</option>
 {(state.mahasiswa || []).map((m) => (
 <option key={m.id} value={m.id}>
 {m.nama} ({m.nim})
 </option>
 ))}
 </select>
 <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">
 Sistem akan memetakan pembimbing & draf secara otomatis.
 </p>
 </div>

 {/* Select Jenis Ujian */}
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">
 Tahapan / Jenis Ujian
 </label>
 <select
 value={jenisUjian}
 onChange={(e) => setJenisUjian(e.target.value as any)}
 className="form-input text-xs font-semibold"
 disabled={!selectedMhsId}
 >
 <option value="Seminar Proposal">1. Seminar Proposal (Sempro)</option>
 <option value="Seminar Hasil">2. Seminar Hasil (Semhas)</option>
 <option value="Sidang Tugas Akhir">3. Ujian Sidang Akhir Tugas Akhir</option>
 </select>
 </div>

 {/* Status Schedule Alert */}
 {selectedMhsId && (
 <div className={`p-3 rounded-lg border text-[11px] font-semibold flex flex-col gap-1 ${
 matchedSchedule 
 ? "bg-purple-50/50 border-purple-100 text-purple-800"
 : "bg-amber-50/50 border-amber-100 text-amber-800"
 }`}>
 {matchedSchedule ? (
 <>
 <div className="flex items-center gap-1.5 font-extrabold uppercase text-[9.5px] text-purple-600">
 <Check size={11} className="stroke-[3]" /> Terjadwal dalam database
 </div>
 <p>Sesi ujian dikonfirmasi pada {formatDateOnlyIndonesian(matchedSchedule.tanggal)} pukul {matchedSchedule.waktu} di {matchedSchedule.ruang}.</p>
 </>
 ) : (
 <>
 <div className="font-bold uppercase text-[9.5px] text-amber-600">
 âš  Tidak Terjadwal Digital
 </div>
 <p>Mahasiswa belum memiliki jadwal rilis di sistem. Anda tetap dapat memasukkan tanggal manual & mencetak berkas.</p>
 </>
 )}
 </div>
 )}

 {/* Manual/Advanced Scheduler Settings */}
 {selectedMhsId && (
 <div className="pt-2 space-y-3 border-t border-dashed border-[var(--border-color)]">
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="text-[10px] font-extrabold text-[var(--text-muted)] block mb-1">Tgl Pelaksanaan</label>
 <input
 type="date"
 value={tanggalUjian}
 onChange={(e) => setTanggalUjian(e.target.value)}
 className="form-input text-xs font-semibold py-1.5"
 />
 </div>
 <div>
 <label className="text-[10px] font-extrabold text-[var(--text-muted)] block mb-1">Waktu Pelaksanaan</label>
 <input
 type="text"
 value={waktuUjian}
 onChange={(e) => setWaktuUjian(e.target.value)}
 className="form-input text-xs font-semibold py-1.5"
 placeholder="e.g. 09:00 - 10:30 WIB"
 />
 </div>
 </div>

 <div>
 <label className="text-[10px] font-extrabold text-[var(--text-muted)] block mb-1">Ruangan Ujian</label>
 <input
 type="text"
 value={ruangUjian}
 onChange={(e) => setRuangUjian(e.target.value)}
 className="form-input text-xs font-semibold py-1.5"
 />
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Interactive Document Tweaks */}
 {selectedMhsId && (
 <div className="card">
 <h3 className="text-sm font-extrabold text-[var(--text-main)] mb-4 flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
 <span></span> Tulis Nilai & Konten Cetak
 </h3>
 
 <div className="space-y-4 text-xs font-semibold text-[var(--text-muted)]">
 {/* Nilai & Kelulusan */}
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="text-[10px] font-bold block mb-1">Skor Nilai Angka</label>
 <input
 type="number"
 min={0}
 max={100}
 value={nilaiAngka}
 onChange={(e) => setNilaiAngka(Number(e.target.value))}
 className="form-input text-xs font-bold text-[var(--text-main)]"
 />
 </div>
 <div>
 <label className="text-[10px] font-bold block mb-1">Jenis Kelulusan</label>
 <select
 value={hasilKelulusan}
 onChange={(e) => setHasilKelulusan(e.target.value)}
 className="form-input text-xs text-[var(--text-main)]"
 >
 <option value="Lulus tanpa Perbaikan">Lulus tanpa Perbaikan</option>
 <option value="Lulus dengan Perbaikan">Lulus dengan Perbaikan</option>
 <option value="Mengulang Ujian">Mengulang Ujian</option>
 <option value="Ditangguhkan">Ditangguhkan / Ditunda</option>
 </select>
 </div>
 </div>

 {/* Honor Amount */}
 <div>
 <label className="text-[10px] font-bold block mb-1">Honorarium Penguji / Dosen (Rp)</label>
 <input
 type="number"
 step={50000}
 value={nominalHonor}
 onChange={(e) => setNominalHonor(Number(e.target.value))}
 className="form-input text-xs font-bold text-[var(--text-main)]"
 />
 </div>

 {/* Catatan / Saran Penulis */}
 <div>
 <label className="text-[10px] font-bold block mb-1">Masukan Catatan & Saran Ujian</label>
 <textarea
 rows={4}
 value={catatanSaran}
 onChange={(e) => setCatatanSaran(e.target.value)}
 className="form-input text-xs font-medium text-[var(--text-main)] font-mono leading-relaxed"
 />
 <span className="text-[9px] text-[var(--text-disabled)] font-normal block mt-1">
 Masukan di atas akan otomatis diisikan pada berkas Lembar Saran & Catatan.
 </span>
 </div>

 {/* Revision Due In Days */}
 <div>
 <label className="text-[10px] font-bold block mb-1">Batas Waktu Perbaikan (Hari)</label>
 <input
 type="number"
 value={hariPerbaikan}
 onChange={(e) => setHariPerbaikan(Number(e.target.value))}
 className="form-input text-xs font-bold text-[var(--text-main)]"
 />
 </div>
 </div>
 </div>
 )}

 {selectedMhsId && (
 <div className="card">
 <h3 className="text-sm font-extrabold text-[var(--text-main)] mb-3 flex items-center gap-2 pb-1 border-b border-[var(--border-color)]">
 <span>âš¡</span> Fitur Cetak & Verifikasi Digital
 </h3>
 <p className="text-[10px] text-[var(--text-muted)] font-normal mb-3">
 Ubah format lembaran dan sistem keaslian dokumen sesuai dengan standar administrasi modern:
 </p>
 <div className="space-y-3 text-xs font-semibold">
 <label className="flex items-center gap-2.5 p-2 bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-base)] border border-[var(--border-color)] rounded-lg cursor-pointer transition-colors">
 <input
 type="checkbox"
 checked={useTTE}
 onChange={(e) => setUseTTE(e.target.checked)}
 className="w-4 h-4 text-[var(--brand-primary)] accent-[#0d9488] rounded shrink-0"
 />
 <div>
 <span className="block text-[11px] font-bold text-[var(--text-main)]">Gunakan QR TTE Terverifikasi</span>
 <span className="block text-[9px] text-[var(--text-muted)] font-normal mt-0.5">Sematkan stempel validasi barcode elektronik sistem di ttd kelulusan & saran.</span>
 </div>
 </label>

 <label className="flex items-center gap-2.5 p-2 bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-base)] border border-[var(--border-color)] rounded-lg cursor-pointer transition-colors">
 <input
 type="checkbox"
 checked={hideHeaderLogo}
 onChange={(e) => setHideHeaderLogo(e.target.checked)}
 className="w-4 h-4 text-[var(--brand-primary)] accent-[#0d9488] rounded shrink-0"
 />
 <div>
 <span className="block text-[11px] font-bold text-[var(--text-main)]">Cetak Tanpa Kop Surat (Logo)</span>
 <span className="block text-[9px] text-[var(--text-muted)] font-normal mt-0.5">Sembunyikan gambar logo & teks Kop jika rilis langsung di kertas Kop fisik kantor.</span>
 </div>
 </label>
 </div>
 </div>
 )}

 {/* Verification Overrides */}
 {selectedMhsId && (
 <div className="card space-y-4">
 <h3 className="text-sm font-extrabold text-[var(--text-main)] flex items-center gap-2 pb-1 border-b border-[var(--border-color)]">
 <span></span> Anggota Penguji & Pembimbing
 </h3>
 
 {/* External Lecturer Info Notification */}
 <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] leading-relaxed text-indigo-300">
 <span className="font-extrabold block text-indigo-200">Mengakomodasi Dosen Luar Program Studi</span>
 Jika terdapat dosen penguji atau pembimbing dari <b>luar program studi</b> (atau instansi eksternal), Anda dapat langsung mengetikkan Nama dan NIDN/NIP/Afiliasi asal mereka pada isian di bawah. 
 <p className="mt-1 font-semibold text-neutral-300">
 Sistem akan mencetak nama dosen luar tersebut pada lembar penilaian fisik secara resmi, tanpa mengacaukan nama dosen internal prodi yang tersimpan di basis data sistem pusat.
 </p>
 </div>

 <div className="space-y-3">
 {/* Pembimbing 1 */}
 <div className="p-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-surface-hover)] space-y-2">
 <span className="text-[10px] font-extrabold tracking-wide uppercase text-[var(--brand-primary)] block">Pembimbing Utama (I)</span>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <div>
 <label className="text-[9px] font-bold uppercase block text-[var(--text-muted)] mb-0.5">Nama Lengkap & Gelar</label>
 <input type="text" value={pb1Name} onChange={(e) => setPb1Name(e.target.value)} className="form-input text-xs py-1" />
 </div>
 <div>
 <label className="text-[9px] font-bold uppercase block text-[var(--text-muted)] mb-0.5">NIDN / NIP / Asal Instansi</label>
 <input type="text" value={pb1Nidn} onChange={(e) => setPb1Nidn(e.target.value)} className="form-input text-xs py-1" placeholder="Misal: 0412030091" />
 </div>
 </div>
 </div>

 {/* Pembimbing 2 */}
 <div className="p-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-surface-hover)] space-y-2">
 <span className="text-[10px] font-extrabold tracking-wide uppercase text-[var(--brand-primary)] block">Pembimbing Pendamping (II)</span>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <div>
 <label className="text-[9px] font-bold uppercase block text-[var(--text-muted)] mb-0.5">Nama Lengkap & Gelar</label>
 <input type="text" value={pb2Name} onChange={(e) => setPb2Name(e.target.value)} className="form-input text-xs py-1" />
 </div>
 <div>
 <label className="text-[9px] font-bold uppercase block text-[var(--text-muted)] mb-0.5">NIDN / NIP / Asal Instansi</label>
 <input type="text" value={pb2Nidn} onChange={(e) => setPb2Nidn(e.target.value)} className="form-input text-xs py-1" placeholder="Misal: -" />
 </div>
 </div>
 </div>

 {/* Penguji 1 */}
 <div className="p-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-surface-hover)] space-y-2">
 <span className="text-[10px] font-extrabold tracking-wide uppercase text-amber-500 block">Ketua Sidang / Penguji I</span>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <div>
 <label className="text-[9px] font-bold uppercase block text-[var(--text-muted)] mb-0.5">Nama Lengkap & Gelar</label>
 <input type="text" value={pj1Name} onChange={(e) => setPj1Name(e.target.value)} className="form-input text-xs py-1" />
 </div>
 <div>
 <label className="text-[9px] font-bold uppercase block text-[var(--text-muted)] mb-0.5">NIDN / NIP / Asal Instansi</label>
 <input type="text" value={pj1Nidn} onChange={(e) => setPj1Nidn(e.target.value)} className="form-input text-xs py-1" placeholder="Misal: 0411030052" />
 </div>
 </div>
 </div>

 {/* Penguji 2 */}
 <div className="p-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-surface-hover)] space-y-2">
 <span className="text-[10px] font-extrabold tracking-wide uppercase text-amber-500 block">Anggota Penguji / Penguji II</span>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <div>
 <label className="text-[9px] font-bold uppercase block text-[var(--text-muted)] mb-0.5">Nama Lengkap & Gelar</label>
 <input type="text" value={pj2Name} onChange={(e) => setPj2Name(e.target.value)} className="form-input text-xs py-1" />
 </div>
 <div>
 <label className="text-[9px] font-bold uppercase block text-[var(--text-muted)] mb-0.5">NIDN / NIP / Asal Instansi</label>
 <input type="text" value={pj2Nidn} onChange={(e) => setPj2Nidn(e.target.value)} className="form-input text-xs py-1" placeholder="Misal: 0405090013" />
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Right workspace: templates list and live iframe/preview */}
 <div className="lg:col-span-8 space-y-6">
 {!selectedMhsId ? (
 <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl h-full min-h-[400px]">
 <div className="w-16 h-16 rounded-full bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center text-3xl font-extrabold mb-4">
 
 </div>
 <h4 className="text-base font-extrabold text-[var(--text-main)]">Belum Ada Mahasiswa Terpilih</h4>
 <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1.5 font-medium">
 Silakan pilih salah satu mahasiswa magister aktif dan tentukan tahapan ujian untuk memunculkan daftar dokumen kelayakan sidang yang siap cetak.
 </p>
 </div>
 ) : (
 <div className="space-y-6">
 
 {/* Printed Progress Banner */}
 <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-3.5">
 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
 <div>
 <h4 className="text-sm font-extrabold text-[var(--text-main)] flex items-center gap-1.5">
 Progres Cetak Dokumen {jenisUjian}
 </h4>
 <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
 Melacak kelengkapan cetak fisik berkas administrasi ujian untuk mahasiswa aktif.
 </p>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-900/30">
 {printedCount} / {totalCount} Selesai ({percentPrinted}%)
 </span>
 {printedCount > 0 && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 if (window.confirm("Apakah Anda yakin ingin mengatur ulang tanda cetak seluruh dokumen ujian ini?")) {
 setPrintedDocsLocal((prev) => {
 const next = { ...prev };
 docTemplates.forEach((tpl) => {
 const key = `${selectedMhsId}_${jenisUjian}_${tpl.id}`;
 delete next[key];
 });
 safeStorage.setItem("printed_docs_state", JSON.stringify(next));
 return next;
 });

 // Clear from cloud database
 docTemplates.forEach(async (tpl) => {
 const key = `${selectedMhsId}_${jenisUjian}_${tpl.id}`;
 const existsInCloud = state.printedDocs?.some(r => r.id === key);
 if (existsInCloud) {
 try {
 await mutate("printedDocs", "delete", {}, "id", key, true);
 } catch (err) {}
 }
 });
 showToast("Seluruh riwayat status cetak berhasil diset ulang!", "success");
 }
 }}
 className="text-[10px] text-rose-600 hover:text-rose-850 font-bold uppercase tracking-wider px-2 py-1 rounded border border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors duration-150"
 >
 Reset Status
 </button>
 )}
 </div>
 </div>

 {/* Progress bar container */}
 <div className="space-y-1.5">
 <div className="h-2.5 w-full bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border-color)]">
 <div 
 className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500 shadow-inner"
 style={{ width: `${percentPrinted}%` }}
 />
 </div>
 <div className="flex justify-between items-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
 <span>Mulai Cetak</span>
 <span>{percentPrinted === 100 ? " Seluruh Berkas Berhasil Dicetak!" : `${totalCount - printedCount} Berkas Tersisa`}</span>
 <span>100% Selesai</span>
 </div>
 </div>
 </div>

 {/* Document Lists Table */}
 <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
 <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-base)] flex justify-between items-center flex-wrap gap-2">
 <span className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider block">
 Arsip Dokumen Pelaksanaan Ujian (Siap Cetak)
 </span>
 <div className="text-[11px] text-[var(--text-muted)] font-medium">
 Klik baris dokumen untuk pratinjau berkas kelayakan & mencetak.
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-[var(--border-color)] bg-[var(--bg-base)]/50 text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-muted)]">
 <th className="py-3 px-4 w-[60px] text-center">Berkas</th>
 <th className="py-3 px-4">Nama Dokumen</th>
 <th className="py-3 px-4 hidden md:table-cell">Deskripsi</th>
 <th className="py-3 px-4">Status Cetak</th>
 <th className="py-3 px-4">Tanggal Terakhir Dicetak</th>
 <th className="py-3 px-4 text-center">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border-color)] text-xs">
 {docTemplates.map((tpl) => {
 const IconComp = tpl.icon;
 const key = `${selectedMhsId}_${jenisUjian}_${tpl.id}`;
 const isPrinted = !!printedDocs[key];
 const printTime = printedDocs[key];
 const isLocked = tpl.requireAssign && !isAssignedComplete;

 return (
 <tr
 key={tpl.id}
 onClick={() => setActiveDocToPrint(tpl.id)}
 className="hover:bg-[var(--bg-surface-hover)] group cursor-pointer transition-colors duration-150"
 >
 <td className="py-4 px-4 text-center">
 <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto ${tpl.color}`}>
 <IconComp size={16} />
 </div>
 </td>
 <td className="py-4 px-4 font-bold text-[var(--text-main)] group-hover:text-[var(--brand-primary)]">
 <div className="flex items-center gap-2">
 <span>{tpl.name}</span>
 {isPrinted && !isLocked && (
 <span className="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-purple-250 dark:border-purple-900/35">
 âœ“
 </span>
 )}
 {isLocked && (
 <span className="text-amber-500 bg-amber-50 dark:bg-amber-950/40 text-[10px] font-bold px-1 rounded border border-amber-200">
 
 </span>
 )}
 </div>
 <span className="block md:hidden text-[10px] text-[var(--text-muted)] font-medium mt-1 leading-relaxed">
 {tpl.desc}
 </span>
 </td>
 <td className="py-4 px-4 text-[var(--text-muted)] leading-relaxed font-medium max-w-sm hidden md:table-cell">
 {tpl.desc}
 </td>
 <td className="py-4 px-4 whitespace-nowrap">
 {isLocked ? (
 <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-widest font-mono">
 Belum Lengkap
 </span>
 ) : isPrinted ? (
 <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/30 uppercase tracking-widest font-mono">
 <Check size={8} className="stroke-[3]" /> Sudah Dicetak
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-400 border border-neutral-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700 uppercase tracking-widest font-mono">
 Belum Dicetak
 </span>
 )}
 </td>
 <td className="py-4 px-4 text-[11px] font-mono font-medium text-[var(--text-muted)] whitespace-nowrap">
 {isLocked ? (
 <span className="text-amber-500/85 italic font-sans font-medium text-[10px]">Menunggu Kaprodi</span>
 ) : isPrinted ? (
 <div className="space-y-0.5">
 <span className="text-[var(--text-main)] font-semibold font-sans block">
 {formatDateTimeIndonesian(printTime)}
 </span>
 {printTime && printTime !== true && (
 <span className="text-[9px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider block">
 Terdaftar Otomatis
 </span>
 )}
 </div>
 ) : (
 <span className="text-neutral-350 dark:text-neutral-600 italic font-sans">- Belum dicetak -</span>
 )}
 </td>
 <td className="py-4 px-4 text-center whitespace-nowrap">
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setActiveDocToPrint(tpl.id);
 }}
 className={isLocked 
 ? "px-2.5 py-1 text-[10px] font-extrabold uppercase text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200/50 cursor-pointer"
 : "px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--brand-primary)] bg-[var(--brand-light)] hover:bg-[var(--brand-primary)] hover:text-white rounded border border-[var(--brand-primary)]/20 transition-all duration-150 cursor-pointer"
 }
 >
 {isLocked ? "Cek Syarat" : "Cetak"}
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {/* Instant Help Tips Box */}
 <div className="bg-[#f0f9f6] dark:bg-[#0c3c2f]/20 border border-[#cbebe0] p-4 rounded-xl flex items-start gap-4">
 <span className="text-lg leading-none mt-0.5"></span>
 <div>
 <h5 className="text-xs font-bold text-[#0f766e]">Sistem Sinkronisasi Kertas Tanda Terima & Absensi</h5>
 <p className="text-[10.5px] text-[#126b54] leading-relaxed mt-1 font-semibold">
 Setiap dokumen diformat sesuai standar format Microsoft Word / PDF Universitas. 
 Anda dapat mencetaknya langsung menggunakan printer lokal Anda, atau memilih opsi <b>"Simpan sebagai PDF"</b> di browser untuk mengarsipkan berkas digital mahasiswa.
 </p>
 </div>
 </div>

 </div>
 )}
 </div>

 </div>

 {/* OVERLAY PRINT VIEW */}
 {activeDocToPrint && activeStudent && (
 <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-[9999] flex flex-col items-center justify-start p-4 md:p-8 overflow-y-auto print-modal">
 
 {/* Floating Actions Panel */}
 <div className="bg-[var(--bg-surface)] w-full max-w-[21cm] p-4 rounded-xl border border-[var(--border-color)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shadow-lg no-print">
 <div>
 <span className="text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-wider block mb-1">
 Preview Berkas: {jenisUjian}
 </span>
 <h4 className="text-sm font-extrabold text-[var(--text-main)]">
 {docTemplates.find((d) => d.id === activeDocToPrint)?.name} - {activeStudent.nama}
 </h4>
 </div>
 <div className="flex flex-wrap gap-2">
 <button
 onClick={handleOpenInNewTab}
 className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer transition-all animate-pulse hover:animate-none"
 title="Rekomendasi Utama: Buka di tab baru mandiri untuk mencetak atau mengunduh PDF secara mulus tanpa terhalang keamanan iFrame"
 >
 <ExternalLink size={13} />
 <span>Buka di Tab Baru (Disarankan)</span>
 </button>

 <button
 onClick={handlePrint}
 className="btn btn-primary text-xs flex items-center gap-1.5 font-bold cursor-pointer"
 title="Mencetak berkas ini melalui printer sistem browser (bisa terblokir oleh iFrame)"
 >
 <Printer size={13} /> Cetak Langsung
 </button>

 <button
 onClick={handleDownloadPDF}
 disabled={isDownloading}
 className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
 title="Unduh Berkas Sidang sebagai fail PDF langsung lewat html2canvas browser"
 >
 {isDownloading ? (
 <>
 <Loader2 size={13} className="animate-spin" />
 <span>Rendering...</span>
 </>
 ) : (
 <>
 <Download size={13} />
 <span>Unduh PDF</span>
 </>
 )}
 </button>

 <button
 onClick={handleDownloadHTML}
 className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
 title="Unduh file cetakan HTML mandiri"
 >
 <Download size={13} />
 <span>Unduh HTML</span>
 </button>

 <button
 onClick={() => setActiveDocToPrint(null)}
 className="px-3 py-1.5 border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-base)] rounded-lg transition-colors cursor-pointer"
 >
 Tutup Preview
 </button>
 </div>
 </div>

 {/* Sandbox Warning Helper Banner */}
 <div className="bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs rounded-xl p-3.5 max-w-[21cm] w-full mb-6 flex items-start gap-2.5 no-print line-clamp-none">
 <ShieldAlert size={15} className="text-amber-400 shrink-0 mt-0.5" />
 <div className="leading-normal">
 <span className="font-extrabold block text-amber-300">Mengalami Kendala Unduhan PDF / Cetak?</span>
 <p className="mt-0.5 opacity-90 text-[11.5px]">
 Karena sistem pratinjau (preview) di Google AI Studio berjalan di dalam <b>Sandbox iFrame</b>, peramban (browser) membatasi perintah unduh berkas secara langsung demi keamanan. 
 Sangat disarankan untuk mengeklik tombol berwarna biru ungu <b>"Buka di Tab Baru (Disarankan)"</b> di atas. Dokumen Anda akan terbuka di tab baru dengan kualitas ketajaman tulisan terbaik, di mana Anda dapat menekan tombol <b>Ctrl + P</b> atau memilih <b>"Simpan sebagai PDF (Save as PDF)"</b> dengan 100% lancar dan tanpa ada bagian halaman yang terpotong!
 </p>
 </div>
 </div>

 {/* HTML A4 SHEET DRAFT - IDENTIFIED FOR PRINTING */}
 <div
 id="print-area"
 className={
 activeDocToPrint === "penilaian"
 ? "w-full max-w-[21.5cm] text-left relative space-y-8"
 : "bg-white text-black p-[1.8cm] w-full max-w-[21.5cm] min-h-[33cm] shadow-2xl rounded-sm border border-neutral-300 text-left relative"
 }
 style={{ 
 color: "#000", 
 fontFamily: "'Times New Roman', Times, serif",
 ...(activeDocToPrint !== "penilaian" ? { background: "#fff" } : {})
 }}
 >
 {/* Kop Surat Header */}
 {(!hideHeaderLogo && activeDocToPrint !== "penilaian") ? (
 <div 
 className="relative flex items-center justify-center border-b-4 border-double border-black pb-3 mb-6 min-h-[105px]"
 style={{ fontFamily: "'Times New Roman', Times, serif" }}
 >
 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[95px] h-[95px] flex items-center justify-center">
 {state.logo ? (
 <img src={state.logo} alt="Logo" className="w-[90px] h-[90px] object-contain" referrerPolicy="no-referrer" />
 ) : (
 <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-300 flex items-center justify-center text-2xl font-extrabold text-[#0d9488]">
 UM
 </div>
 )}
 </div>
 <div className="text-center px-16">
 <h1 className="text-[15px] md:text-[17px] font-bold uppercase tracking-wide leading-tight text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 UNIVERSITAS MUHAMMADIYAH PONTIANAK
 </h1>
 <h2 className="text-[12px] md:text-[13px] font-bold uppercase tracking-wide leading-tight mt-0.5 text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI
 </h2>
 <h2 className="text-[11px] md:text-[12px] font-bold uppercase tracking-wide leading-tight mt-0.5 text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 PROGRAM STUDI FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI (S2)
 </h2>
 <p className="text-[9.5px] md:text-[10px] leading-snug mt-1 italic text-black font-medium" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 Alamat: Jl. Jend. Ahmad Yani No. 111, Pontianak, Kalimantan Barat 78124<br />
 Email: fikpsi@unmuhpnk.ac.id | Telp: (0561) 764571 | Website: fikpsi.unmuhpnk.ac.id
 </p>
 </div>
 </div>
 ) : (
 activeDocToPrint !== "penilaian" && (
 <div className="h-[3.6cm] w-full border-b border-dashed border-gray-200 invisible print:visible print:border-none" /> /* Margin placeholder for physical paper kop letterhead */
 )
 )}

 {/* DOCUMENT RENDERING BRANCH ON TARGET TEMPLATE */}
 {activeDocToPrint === "undangan-seminar" && (
 <div className="space-y-4 text-[13px] leading-relaxed text-justify">
 {/* Metadata panel */}
 <div className="flex justify-between items-start mb-6 text-xs font-semibold">
 <div className="space-y-1">
 <p>Nomor&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {activeStudent.nim.substring(activeStudent.nim.length - 4)}/II.3.AU.15/A/{new Date().getFullYear()}</p>
 <p>Lampiran&nbsp;&nbsp;: 1 (satu) Berkas Draf Tugas Akhir</p>
 <p>Hal&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <b>Undangan Maju {jenisUjian}</b></p>
 </div>
 <div className="text-right">
 <p>Pontianak, {formatDateOnlyIndonesian(tanggalUjian)}</p>
 </div>
 </div>

 {/* Kepada Yth */}
 <div className="mb-6 text-xs">
 <p className="font-bold">Kepada Yth. Bapak/Ibu Tim Pembimbing & Penguji:</p>
 <ol className="list-decimal pl-5 mt-2 space-y-1 font-semibold text-xs">
 <li><b>{pj1Name}</b> (Ketua Tim Penguji / Penguji I)</li>
 <li><b>{pj2Name}</b> (Anggota Penguji / Penguji II)</li>
 <li><b>{pb1Name}</b> (Dosen Pembimbing I)</li>
 {pb2Name && pb2Name !== "-" && <li><b>{pb2Name}</b> (Dosen Pembimbing II)</li>}
 </ol>
 <p className="mt-2.5 font-bold">Di -</p>
 <p className="pl-6 font-semibold">Tempat (Pontianak)</p>
 </div>

 {/* Assalamu'alaikum */}
 <p className="italic font-semibold my-3 text-xs">Assalamu'alaikum Wr. Wb.</p>

 <p className="text-xs leading-relaxed">
 Sehubungan dengan kesiapan draf penulisan dan pemenuhan syarat akademik kelayakan bimbingan tugas akhir, kami dari Program Studi Pascasarjana Fakultas Ilmu Kesehatan dan Psikologi Universitas Muhammadiyah Pontianak dengan hormat mengundang Bapak/Ibu Dewan Penguji & Pembimbing untuk hadir sebagai tim penilai dan pendamping dalam pelaksanaan ujian mahasiswa:
 </p>

 {/* Student identification table */}
 <div className="pl-6 space-y-1.5 my-4 border-l-2 border-[var(--brand-primary)] bg-neutral-50/50 py-2 text-xs">
 <div className="flex">
 <span className="w-36 font-semibold shrink-0">Nama Lengkap</span>
 <span>: <b>{activeStudent.nama}</b></span>
 </div>
 <div className="flex">
 <span className="w-36 font-semibold shrink-0">N I M</span>
 <span>: {activeStudent.nim}</span>
 </div>
 <div className="flex text-justify">
 <span className="w-36 font-semibold shrink-0">Judul Tugas Akhir</span>
 <span>: "{overrideTitle}"</span>
 </div>
 </div>

 <p className="text-xs">Adapun jadwal pelaksanaan agenda ujian dewan juri tersebut direncanakan pada:</p>

 {/* Schedule detail table */}
 <div className="pl-6 space-y-1.5 my-4 font-semibold text-xs bg-slate-50/70 p-3 rounded-lg border border-neutral-300">
 <div className="flex">
 <span className="w-36">Hari / Tanggal</span>
 <span>: {formatDateIndonesianByString(tanggalUjian)}</span>
 </div>
 <div className="flex">
 <span className="w-36">Waktu Sidang</span>
 <span>: <b>{waktuUjian} - Selesai</b></span>
 </div>
 <div className="flex">
 <span className="w-36">Ruangan / Tempat</span>
 <span>: {ruangUjian}</span>
 </div>
 </div>

 <p className="text-xs leading-relaxed">
 Meningat pentingnya penetapan objektivitas evaluasi akademik bagi kredibilitas kelululusan draf usulan tugas akhir mahasiswa kami, kami mengharapkan kehadiran Bapak/Ibu Dewan Penguji tepat waktu sesuai jadwal demi tertib administrasi Pascasarjana.
 </p>

 <p className="mt-3 text-xs leading-relaxed">
 Demikian surat undangan ini kami sampaikan dengan tulus. Atas perhatian, kesediaan, dan bimbingan berharga bagi keberhasilan studi mahasiswa, kami mengucapkan jazakumullah khairan katsiran.
 </p>

 <p className="italic font-semibold mt-4 text-xs">Wassalamu'alaikum Wr. Wb.</p>

 {/* Signatures */}
 <div className="grid grid-cols-2 gap-4 mt-8 text-xs font-semibold">
 <div>
 <span className="text-gray-500 italic font-normal mb-2 block">Catatan Tambahan:</span>
 <ul className="list-disc pl-4 text-[10.5px] leading-relaxed text-neutral-600 font-normal space-y-1">
 <li>Tanda terima honor menguji (Kwitansi) disiapkan di tempat</li>
 <li>Borang penilaian & rubrik dapat diedit terintegrasi</li>
 <li>Naskah berkas tugas akhir digital telah dikirim via email</li>
 </ul>
 </div>
 <div className="text-center">
 <p>Hormat Kami,</p>
 <p className="font-bold underline mt-1 mb-14 text-neutral-800">Ketua Program Studi FIKPsi</p>
 
 <p className="font-bold underline">Andri Dwi Hernawan, S.K.M., M. Kes (Epid)</p>
 <p className="text-[10px]">NIK: 1234.110.086</p>
 {/* {useTTE && (
 <div className="mt-2 mx-auto w-40 p-1.5 border border-purple-400 rounded bg-purple-50/50 flex items-center gap-1.5 text-left text-[8px] text-purple-800 leading-tight">
 <svg className="w-8 h-8 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
 <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 3h3v3h-3v-3zm3 3h3v-2h-3v2zm-3-5h2v2h-2v-2zm5 5h1v1h-1v-1zm-1-3h1v1h-1v-1zm-3-3h1v1h-1v-1zm5 1h1v1h-1v-1zm-8 4h2v1h-2v-1zm3 0h1v1h-1v-1zm1 2h2v1h-2v-1z" />
 </svg>
 <div>
 <p className="font-extrabold uppercase tracking-wide">TTE TERVERIFIKASI</p>
 <p className="font-normal text-neutral-600 font-mono">ID: FIKPsi-{activeStudent.nim}-UDG</p>
 <p className="font-normal text-neutral-500">UM PONTIANAK SISTEM</p>
 </div>
 </div>
 )} */}
 </div>
 </div>
 </div>
 )}

 {/* SK PEMBIMBING RENDERING */}
 {activeDocToPrint === "sk-pembimbing" && (
 <div className="space-y-4 text-[13px] leading-relaxed relative min-h-[500px]">
 {!isAssignedComplete ? (
 <div className="flex flex-col items-center justify-center p-8 text-center h-[500px] border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50/20">
 <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 border border-amber-200 mb-4 text-2xl font-bold animate-pulse">
 âš 
 </div>
 <h4 className="text-base font-extrabold text-neutral-800 uppercase tracking-wide">SK Penetapan Pembimbing Belum Terbentuk</h4>
 <p className="text-[11px] text-neutral-500 max-w-md mt-2 leading-relaxed font-semibold">
 Dokumen Surat Keputusan baru akan otomatis tercipta setelah **Pembimbing 1, Pembimbing 2, Penguji 1, dan Penguji 2** lengkap ditetapkan oleh Ketua Program Studi di menu utama bimbingan.
 </p>
 <div className="mt-5 p-4 bg-white/70 dark:bg-zinc-900/40 rounded-xl text-left text-xs gap-y-2 grid grid-cols-2 gap-4 text-neutral-700 border border-neutral-100 shadow-sm w-full max-w-sm">
 <div className="flex items-center gap-1.5 font-medium">
 <span className={hasPembimbing1 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>{hasPembimbing1 ? "âœ”" : "âœ˜"}</span>
 <span>Pembimbing I: {hasPembimbing1 ? "Ready" : "Missing"}</span>
 </div>
 <div className="flex items-center gap-1.5 font-medium">
 <span className={hasPembimbing2 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>{hasPembimbing2 ? "âœ”" : "âœ˜"}</span>
 <span>Pembimbing II: {hasPembimbing2 ? "Ready" : "Missing"}</span>
 </div>
 <div className="flex items-center gap-1.5 font-medium">
 <span className={hasPenguji1 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>{hasPenguji1 ? "âœ”" : "âœ˜"}</span>
 <span>Penguji I: {hasPenguji1 ? "Ready" : "Missing"}</span>
 </div>
 <div className="flex items-center gap-1.5 font-medium">
 <span className={hasPenguji2 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>{hasPenguji2 ? "âœ”" : "âœ˜"}</span>
 <span>Penguji II: {hasPenguji2 ? "Ready" : "Missing"}</span>
 </div>
 </div>
 </div>
 ) : (
 <div className="text-justify text-xs space-y-4">
 <div className="text-center mb-6 space-y-1">
 <h3 className="text-sm font-extrabold uppercase tracking-wider text-black underline">
 SURAT KEPUTUSAN {dekanJabatan.toUpperCase()}
 </h3>
 <h3 className="text-[12px] font-black uppercase tracking-wider text-black">
 UNIVERSITAS MUHAMMADIYAH PONTIANAK
 </h3>
 <p className="text-[10px] font-bold text-neutral-800">
 Nomor: {150 + Math.floor(activeStudent.nim.charCodeAt(activeStudent.nim.length - 1) * 2.5)}/II.3.AU.15/KEP/{new Date().getFullYear()}
 </p>
 <div className="pt-2">
 <p className="text-xs font-bold uppercase tracking-wider">TENTANG</p>
 <p className="text-xs font-extrabold uppercase tracking-widest max-w-[500px] mx-auto text-center">
 PENETAPAN DOSEN PEMBIMBING TUGAS AKHIR MAHASISWA PROGRAM STUDI FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI
 </p>
 </div>
 </div>

 <div className="space-y-4">
 <div className="grid grid-cols-[100px_20px_1fr] gap-1 items-start text-justify">
 <span className="font-bold">Menimbang</span>
 <span>:</span>
 <div className="space-y-1.5">
 <p>a. bahwa untuk kelancaran penyusunan draf serta penyelesaian akhir Tugas Akhir bagi mahasiswa Program Studi Fakultas Ilmu Kesehatan dan Psikologi, perlu menunjuk dan menetapkan Dosen Pembimbing;</p>
 <p>b. bahwa mereka yang namanya tercantum dalam lampiran keputusan ini dipandang mampu, layak, dan memenuhi persyaratan akademik untuk diserahi tugas bimbingan tersebut;</p>
 <p>c. bahwa berdasarkan pertimbangan sebagaimana dimaksud dalam huruf a dan b di atas, perlu diterbitkan Surat Keputusan Dekan sebagai landasan hukum pelaksanaannya.</p>
 </div>
 </div>

 <div className="grid grid-cols-[100px_20px_1fr] gap-1 items-start text-justify">
 <span className="font-bold">Mengingat</span>
 <span>:</span>
 <div className="space-y-1.5">
 <p>1. Undang-Undang RI Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;</p>
 <p>2. Undang-Undang RI Nomor 14 Tahun 2005 tentang Guru dan Dosen;</p>
 <p>3. Undang-Undang RI Nomor 12 Tahun 2012 tentang Pendidikan Tinggi;</p>
 <p>4. Statuta Universitas Muhammadiyah Pontianak;</p>
 <p>5. Keputusan Pimpinan Pusat Muhammadiyah Majelis Pendidikan Tinggi Penelitian dan Pengembangan.</p>
 </div>
 </div>

 <div className="border-t border-black my-4"></div>

 <div className="text-center font-bold tracking-widest uppercase my-2 text-xs">
 MEMUTUSKAN
 </div>

 <div className="grid grid-cols-[100px_20px_1fr] gap-1 items-start text-justify">
 <span className="font-bold">Menetapkan</span>
 <span>:</span>
 <div><b>KEPUTUSAN DEKAN FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI UNIVERSITAS MUHAMMADIYAH PONTIANAK TENTANG PENETAPAN DOSEN PEMBIMBING TUGAS AKHIR MAHASISWA.</b></div>
 </div>

 <div className="grid grid-cols-[100px_20px_1fr] gap-1 items-start text-justify">
 <span className="font-bold">PERTAMA</span>
 <span>:</span>
 <div>
 Menunjuk dan mengangkat nama-nama Dosen yang tercantum di bawah ini sebagai Pembimbing Tugas Akhir bagi mahasiswa:
 <table className="w-full mt-2 border-collapse border border-neutral-300 text-xs">
 <tbody>
 <tr className="border-b border-neutral-300">
 <td className="p-2 w-32 font-semibold bg-neutral-50 border-r border-neutral-300">Nama Lengkap</td>
 <td className="p-2 font-bold">{activeStudent.nama}</td>
 </tr>
 <tr className="border-b border-neutral-300">
 <td className="p-2 font-semibold bg-neutral-50 border-r border-neutral-300">NIM</td>
 <td className="p-2 font-bold">{activeStudent.nim}</td>
 </tr>
 <tr className="border-b border-neutral-300">
 <td className="p-2 font-semibold bg-neutral-50 border-r border-neutral-300">Judul Tugas Akhir</td>
 <td className="p-2 italic">"{overrideTitle}"</td>
 </tr>
 <tr className="border-b border-neutral-300">
 <td className="p-2 font-semibold bg-neutral-50 border-r border-neutral-300">Pembimbing I</td>
 <td className="p-2">
 <b>{pb1Name}</b> <span className="text-neutral-500 text-[10px] ml-1">(NIDN: {pb1Nidn})</span>
 </td>
 </tr>
 {pb2Name && pb2Name !== "-" && (
 <tr className="border-b border-neutral-300">
 <td className="p-2 font-semibold bg-neutral-50 border-r border-neutral-300">Pembimbing II</td>
 <td className="p-2">
 <b>{pb2Name}</b> <span className="text-neutral-500 text-[10px] ml-1">(NIDN: {pb2Nidn})</span>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 <div className="grid grid-cols-[100px_20px_1fr] gap-1 items-start text-justify">
 <span className="font-bold">KEDUA</span>
 <span>:</span>
 <div>Tugas Pembimbing Tugas Akhir adalah mengarahkan, menguji akurasi teoretis & metodologis mahasiswa secara intensif sejak penyusunan proposal draf penelitian hingga selesai Sidang Tugas Akhir dipertahankan.</div>
 </div>

 <div className="grid grid-cols-[100px_20px_1fr] gap-1 items-start text-justify">
 <span className="font-bold">KETIGA</span>
 <span>:</span>
 <div>Keputusan ini mulai berlaku pada tanggal ditetapkan, dengan ketentuan apabila dikemudian hari terdapat kekeliruan, akan diperbaiki sebagaimana mestinya.</div>
 </div>
 </div>

 {/* Signatures */}
 <div className="grid grid-cols-2 gap-4 mt-8 text-xs font-semibold">
 <div>
 <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-bold mb-2">Tembusan Kepada Yth :</p>
 <ul className="list-decimal pl-4 text-[10px] leading-relaxed text-neutral-500 font-normal">
 <li>Rektor UM Pontianak</li>
 <li>Direktur Pascasarjana</li>
 <li>Ketua Program Studi FIKPsi</li>
 <li>Dosen Pembimbing Bersangkutan</li>
 <li>Arsip Administrasi Prodi</li>
 </ul>
 </div>
 <div className="text-center space-y-1">
 <p>Ditetapkan di : Pontianak</p>
 <p>Pada Tanggal : {formatDateOnlyIndonesian(tanggalUjian)}</p>
 <p className="font-bold underline mt-1 mb-14 text-neutral-800">{dekanJabatan}</p>
 
 <p className="font-bold underline">{dekanNama}</p>
 <p className="text-[10px]">{dekanNidn.toUpperCase().includes("NIDN") || dekanNidn.toUpperCase().includes("NIP") ? dekanNidn : `NIDN: ${dekanNidn}`}</p>
 {/* {useTTE && (
 <div className="mt-2 mx-auto w-40 p-1.5 border border-purple-400 rounded bg-purple-50/50 flex items-center gap-1.5 text-left text-[8px] text-purple-800 leading-tight">
 <svg className="w-8 h-8 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
 <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 3h3v3h-3v-3zm3 3h3v-2h-3v2zm-3-5h2v2h-2v-2zm5 5h1v1h-1v-1zm-1-3h1v1h-1v-1zm-3-3h1v1h-1v-1zm5 1h1v1h-1v-1zm-8 4h2v1h-2v-1zm3 0h1v1h-1v-1zm1 2h2v1h-2v-1z" />
 </svg>
 <div>
 <p className="font-extrabold uppercase tracking-wide">TTE DEKAN TERVERIFIKASI</p>
 <p className="font-normal text-neutral-600 font-mono">ID: FIKPsi-{activeStudent.nim}-SK-PB</p>
 <p className="font-normal text-neutral-500 font-sans">UM PONTIANAK SISTEM</p>
 </div>
 </div>
 )} */}
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {/* SK PENGUJI RENDERING */}
 {activeDocToPrint === "sk-penguji" && (
 <div className="space-y-4 text-[13px] leading-relaxed relative min-h-[500px]">
 {!isAssignedComplete ? (
 <div className="flex flex-col items-center justify-center p-8 text-center h-[500px] border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50/20">
 <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 border border-amber-200 mb-4 text-2xl font-bold animate-pulse">
 âš 
 </div>
 <h4 className="text-base font-extrabold text-neutral-800 uppercase tracking-wide">SK Penetapan Dewan Penguji Belum Terbentuk</h4>
 <p className="text-[11px] text-neutral-500 max-w-md mt-2 leading-relaxed font-semibold">
 Dokumen Surat Keputusan baru akan otomatis tercipta setelah **Pembimbing 1, Pembimbing 2, Penguji 1, dan Penguji 2** lengkap ditetapkan oleh Ketua Program Studi di menu utama bimbingan.
 </p>
 <div className="mt-5 p-4 bg-white/70 dark:bg-zinc-900/40 rounded-xl text-left text-xs gap-y-2 grid grid-cols-2 gap-4 text-neutral-700 border border-neutral-100 shadow-sm w-full max-w-sm">
 <div className="flex items-center gap-1.5 font-medium">
 <span className={hasPembimbing1 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>{hasPembimbing1 ? "âœ”" : "âœ˜"}</span>
 <span>Pembimbing I: {hasPembimbing1 ? "Ready" : "Missing"}</span>
 </div>
 <div className="flex items-center gap-1.5 font-medium">
 <span className={hasPembimbing2 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>{hasPembimbing2 ? "âœ”" : "âœ˜"}</span>
 <span>Pembimbing II: {hasPembimbing2 ? "Ready" : "Missing"}</span>
 </div>
 <div className="flex items-center gap-1.5 font-medium">
 <span className={hasPenguji1 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>{hasPenguji1 ? "âœ”" : "âœ˜"}</span>
 <span>Penguji I: {hasPenguji1 ? "Ready" : "Missing"}</span>
 </div>
 <div className="flex items-center gap-1.5 font-medium">
 <span className={hasPenguji2 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>{hasPenguji2 ? "âœ”" : "âœ˜"}</span>
 <span>Penguji II: {hasPenguji2 ? "Ready" : "Missing"}</span>
 </div>
 </div>
 </div>
 ) : (
 <div className="text-justify text-xs space-y-4">
 <div className="text-center mb-6 space-y-1">
 <h3 className="text-sm font-extrabold uppercase tracking-wider text-black underline">
 SURAT KEPUTUSAN {dekanJabatan.toUpperCase()}
 </h3>
 <h3 className="text-[12px] font-black uppercase tracking-wider text-black">
 UNIVERSITAS MUHAMMADIYAH PONTIANAK
 </h3>
 <p className="text-[10px] font-bold text-neutral-800">
 Nomor: {180 + Math.floor(activeStudent.nim.charCodeAt(activeStudent.nim.length - 1) * 2.8)}/II.3.AU.15/KEP/{new Date().getFullYear()}
 </p>
 <div className="pt-2">
 <p className="text-xs font-bold uppercase tracking-wider">TENTANG</p>
 <p className="text-xs font-extrabold uppercase tracking-widest max-w-[500px] mx-auto text-center">
 PENETAPAN DEWAN PENGUJI UJIAN SIDANG WALAHASIL / TUGAS AKHIR PROGRAM STUDI FIKPsi
 </p>
 </div>
 </div>

 <div className="space-y-4">
 <div className="grid grid-cols-[100px_20px_1fr] gap-1 items-start text-justify">
 <span className="font-bold">Menimbang</span>
 <span>:</span>
 <div className="space-y-1.5">
 <p>a. bahwa dalam rangka mengevaluasi kemampuan, kriteria keilmuan, dan pertanggungjawaban akademis draf tugas akhir, perlu diselenggarakan Ujian {jenisUjian} bagi mahasiswa bersangkutan;</p>
 <p>b. bahwa untuk keabsahan, ketertiban umum, dan objektivitas evaluasi akademik, perlu ditetapkan Susunan Dewan Penguji Ujian Tugas Akhir;</p>
 <p>c. bahwa dosen yang namanya tercantum dalam lampiran Surat Keputusan ini dipandang memenuhi syarat keilmuan untuk melaksanakan kewajiban penguji tersebut.</p>
 </div>
 </div>

 <div className="grid grid-cols-[100px_20px_1fr] gap-1 items-start text-justify">
 <span className="font-bold">Mengingat</span>
 <span>:</span>
 <div className="space-y-1.5">
 <p>1. Undang-Undang RI Nomor 12 Tahun 2012 tentang Pendidikan Tinggi;</p>
 <p>2. Undang-Undang RI Nomor 14 Tahun 2005 tentang Guru dan Dosen;</p>
 <p>3. Statuta Universitas Muhammadiyah Pontianak;</p>
 <p>4. Kurikulum Terpadu Program Studi Pascasajarna Fakultas Ilmu Kesehatan dan Psikologi UM Pontianak.</p>
 </div>
 </div>

 <div className="border-t border-black my-4"></div>

 <div className="text-center font-bold tracking-widest uppercase my-2 text-xs">
 MEMUTUSKAN
 </div>

 <div className="grid grid-cols-[100px_20px_1fr] gap-1 items-start text-justify">
 <span className="font-bold">Menetapkan</span>
 <span>:</span>
 <div><b>KEPUTUSAN DEKAN TENTANG PENETAPAN DEWAN PENGUJI UJIAN TIM SIDANG {jenisUjian.toUpperCase()} TUGAS AKHIR MAHASISWA FIKPsi.</b></div>
 </div>

 <div className="grid grid-cols-[100px_20px_1fr] gap-1 items-start text-justify">
 <span className="font-bold">PERTAMA</span>
 <span>:</span>
 <div>
 Menunjuk dan menugaskan Bapak/Ibu dosen di bawah ini sebagai Tim Dewan Penguji Ujian {jenisUjian} Tugas Akhir atas nama mahasiswa:
 <table className="w-full mt-2 border-collapse border border-neutral-300 text-xs">
 <tbody>
 <tr className="border-b border-neutral-300">
 <td className="p-2 w-32 font-semibold bg-neutral-50 border-r border-neutral-300">Nama / NIM</td>
 <td className="p-2 font-bold">{activeStudent.nama} <span className="font-normal text-neutral-500 ml-1">({activeStudent.nim})</span></td>
 </tr>
 <tr className="border-b border-neutral-300">
 <td className="p-2 font-semibold bg-neutral-50 border-r border-neutral-300">Judul Penelitian Tugas Akhir</td>
 <td className="p-2 italic">"{overrideTitle}"</td>
 </tr>
 <tr className="border-b border-neutral-300">
 <td className="p-2 font-semibold bg-neutral-50 border-r border-neutral-300">Ketua Penguji</td>
 <td className="p-2">
 <b>{pb1Name}</b> <span className="text-neutral-500 text-[10px] ml-1">(Dosen Pembimbing I)</span>
 </td>
 </tr>
 {pb2Name && pb2Name !== "-" && (
 <tr className="border-b border-neutral-300">
 <td className="p-2 font-semibold bg-neutral-50 border-r border-neutral-300">Anggota Penguji I</td>
 <td className="p-2">
 <b>{pb2Name}</b> <span className="text-neutral-500 text-[10px] ml-1">(Dosen Pembimbing II)</span>
 </td>
 </tr>
 )}
 <tr className="border-b border-neutral-300">
 <td className="p-2 font-semibold bg-neutral-50 border-r border-neutral-300">Penguji Utama I</td>
 <td className="p-2">
 <b>{pj1Name}</b> <span className="text-neutral-500 text-[10px] ml-1">(NIDN: {pj1Nidn})</span>
 </td>
 </tr>
 <tr className="border-b border-neutral-300">
 <td className="p-2 font-semibold bg-neutral-50 border-r border-neutral-300">Penguji Utama II</td>
 <td className="p-2">
 <b>{pj2Name}</b> <span className="text-neutral-500 text-[10px] ml-1">(NIDN: {pj2Nidn})</span>
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 <div className="grid grid-cols-[100px_20px_1fr] gap-1 items-start text-justify">
 <span className="font-bold">KEDUA</span>
 <span>:</span>
 <div>Pelaksanaan agenda pengujian sesuai dengan jadwal resmi yang telah disepakati, bertempat di Ruang Sidang Pascasarjana Gedung C Universitas Muhammadiyah Pontianak.</div>
 </div>

 <div className="grid grid-cols-[100px_20px_1fr] gap-1 items-start text-justify">
 <span className="font-bold">KETIGA</span>
 <span>:</span>
 <div>Biaya penyelenggaraan dan honorarium Tim Penguji dibebankan pada Anggaran Penerimaan Belanja FIKPsi sesuai peraturan biro keuangan Universitas.</div>
 </div>
 </div>

 {/* Signatures */}
 <div className="grid grid-cols-2 gap-4 mt-8 text-xs font-semibold">
 <div>
 <p className="text-neutral-550 text-[10px] uppercase tracking-wider font-bold mb-2">Tembusan Kepada Yth :</p>
 <ul className="list-decimal pl-4 text-[10px] leading-relaxed text-neutral-500 font-normal">
 <li>Direktur Pascasarjana UM Pontianak</li>
 <li>Kepala Biro Keuangan</li>
 <li>Tim Penguji yang Ditetapkan</li>
 <li>Mahasiswa Terkait</li>
 </ul>
 </div>
 <div className="text-center space-y-1">
 <p>Ditetapkan di : Pontianak</p>
 <p>Pada Tanggal : {formatDateOnlyIndonesian(tanggalUjian)}</p>
 <p className="font-bold underline mt-1 mb-14 text-neutral-800">{dekanJabatan}</p>
 
 <p className="font-bold underline">{dekanNama}</p>
 <p className="text-[10px]">{dekanNidn.toUpperCase().includes("NIDN") || dekanNidn.toUpperCase().includes("NIP") ? dekanNidn : `NIDN: ${dekanNidn}`}</p>
 {/* {useTTE && (
 <div className="mt-2 mx-auto w-40 p-1.5 border border-purple-400 rounded bg-purple-50/50 flex items-center gap-1.5 text-left text-[8px] text-purple-800 leading-tight">
 <svg className="w-8 h-8 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
 <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 3h3v3h-3v-3zm3 3h3v-2h-3v2zm-3-5h2v2h-2v-2zm5 5h1v1h-1v-1zm-1-3h1v1h-1v-1zm-3-3h1v1h-1v-1zm5 1h1v1h-1v-1zm-8 4h2v1h-2v-1zm3 0h1v1h-1v-1zm1 2h2v1h-2v-1z" />
 </svg>
 <div>
 <p className="font-extrabold uppercase tracking-wide">TTE DEKAN TERVERIFIKASI</p>
 <p className="font-normal text-neutral-600 font-mono">ID: FIKPsi-{activeStudent.nim}-SK-PJ</p>
 <p className="font-normal text-neutral-500">UM PONTIANAK SISTEM</p>
 </div>
 </div>
 )} */}
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {/* DOCUMENT RENDERING BRANCH ON TARGET TEMPLATE */}
 {activeDocToPrint === "berita-acara" && (
 <div className="space-y-4 text-[13px] leading-relaxed relative min-h-[500px]">
 {/* Translucent Gray Watermark Background Logo */}
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-[0.06] filter grayscale">
 {state.logo ? (
 <img
 src={state.logo}
 alt="Watermark Logo"
 className="w-[280px] h-[280px] object-contain"
 referrerPolicy="no-referrer"
 />
 ) : (
 <div className="text-[120px] font-extrabold text-neutral-400">UM</div>
 )}
 </div>

 <div className="relative z-10 space-y-4">
 <div className="text-center mb-6">
 <h3 className="text-sm font-extrabold uppercase underline tracking-wider">
 BERITA ACARA {jenisUjian.toUpperCase()}
 </h3>
 <p className="text-[12px] font-semibold mt-1">
 Nomor: {100 + Math.floor(Math.random() * 900)}/II.3.AU.15/A/{new Date().getFullYear()}
 </p>
 </div>

 <p className="text-justify">
 Pada hari ini, <b>{formatDateIndonesianByString(tanggalUjian)}</b> bertempat di <b>{ruangUjian}</b> Universitas Muhammadiyah Pontianak, telah dilaksanakan ujian {jenisUjian} bagi mahasiswa Fakultas Ilmu Kesehatan dan Psikologi:
 </p>

 {/* Identity Table */}
 <div className="pl-6 space-y-1.5">
 <div className="flex">
 <span className="w-40 font-semibold">Nama Mahasiswa</span>
 <span>: {activeStudent.nama}</span>
 </div>
 <div className="flex">
 <span className="w-40 font-semibold">NIM Mahasiswa</span>
 <span>: {activeStudent.nim}</span>
 </div>
 <div className="flex">
 <span className="w-40 font-semibold">Program Studi</span>
 <span>: Fakultas Ilmu Kesehatan dan Psikologi (S2)</span>
 </div>
 <div className="flex">
 <span className="w-40 font-semibold">Judul Tugas Akhir</span>
 <span>: "{overrideTitle}"</span>
 </div>
 </div>

 <p className="mt-4">
 Berdasarkan hasil penilaian naskah komprehensif, pemaparan ilmiah, serta kemampuan argumentasi di hadapan Dewan Pembimbing dan Tim Penguji, maka Tim Sepakat mengambil kesimpulan sbb:
 </p>

 {/* Verdict Panel */}
 <div className="border border-black p-4 rounded-sm bg-neutral-50 flex flex-col gap-2">
 <div className="flex justify-between">
 <span>1. Skor Nilai Akhir (Angka)</span>
 <span className="font-extrabold">: {nilaiAngka}</span>
 </div>
 <div className="flex justify-between">
 <span>2. Konversi Nilai Huruf</span>
 <span className="font-extrabold">: {getLetterGrade(nilaiAngka)}</span>
 </div>
 <div className="flex justify-between">
 <span>3. Keputusan Tim Penguji</span>
 <span className="font-extrabold uppercase underline text-emerald-800">: {hasilKelulusan}</span>
 </div>
 </div>

 <p className="mt-4 text-justify font-medium">
 Catatan revisi dan perbaikan bersifat mutlak serta dicatatkan di bawah lembar terpisah, draf wajib diserahkan kembali kepada prodi selambat-lambatnya <b>{hariPerbaikan} hari kalender</b> setelah berita acara disahkan.
 </p>

 <p className="mt-2 text-justify">
 Demikianlah berita acara pelaksanaan ujian Fakultas Ilmu Kesehatan dan Psikologi ini dibuat untuk dipergunakan seperlunya.
 </p>

 {/* Tim Penguji Signature Grid */}
 <div className="mt-10">
 <p className="font-bold underline mb-4 text-xs tracking-wider uppercase">DEWAN PEMBIMBING & TIM PENGUJI:</p>
 
 <table className="w-full border border-black text-xs text-left" style={{ borderCollapse: "collapse" }}>
 <thead>
 <tr className="border-b border-black bg-neutral-100">
 <th className="p-2 border-r border-black w-24">Kedudukan</th>
 <th className="p-2 border-r border-black">Nama Lengkap Tim</th>
 <th className="p-2 w-32 text-center">Tanda Tangan</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-b border-black">
 <td className="p-2 border-r border-black font-semibold">Pembimbing I</td>
 <td className="p-2 border-r border-black font-semibold">{pb1Name}</td>
 <td className="p-2 text-center h-12 italic text-neutral-400">1. .............................</td>
 </tr>
 {pb2Name && pb2Name !== "-" && (
 <tr className="border-b border-black">
 <td className="p-2 border-r border-black font-semibold">Pembimbing II</td>
 <td className="p-2 border-r border-black font-semibold">{pb2Name}</td>
 <td className="p-2 text-center h-12 italic text-neutral-400">2. .............................</td>
 </tr>
 )}
 <tr className="border-b border-black">
 <td className="p-2 border-r border-black font-semibold">Penguji I (Ketua)</td>
 <td className="p-2 border-r border-black font-semibold">{pj1Name}</td>
 <td className="p-2 text-center h-12 italic text-neutral-400">3. .............................</td>
 </tr>
 <tr className="border-b border-black">
 <td className="p-2 border-r border-black font-semibold">Penguji II</td>
 <td className="p-2 border-r border-black font-semibold">{pj2Name}</td>
 <td className="p-2 text-center h-12 italic text-neutral-400">4. .............................</td>
 </tr>
 </tbody>
 </table>
 </div>

 {/* Bottom signatures */}
 <div className="grid grid-cols-2 gap-4 mt-8 pt-4">
 <div>
 <p className="italic text-[10px] text-neutral-500">Lembaran salinan wajib didistribusikan ke:<br />
 1. Dekanat Magister<br />
 2. Program Studi FIKPsi<br />
 3. Mahasiswa Terkait</p>
 </div>
 <div className="text-center text-xs">
 <p>Mengesahkan,</p>
 <p className="font-bold">Ketua Fakultas Ilmu Kesehatan dan Psikologi</p>
 <p className="mb-14 font-semibold uppercase text-[10px]">FIKPsi UM PONTIANAK</p>
 
 <p className="font-bold underline">Andri Dwi Hernawan, S.K.M., M. Kes (Epid)</p>
 <p className="text-[10px]">NIK: 1234.110.086</p>
 {/* {useTTE && (
 <div className="mt-2 mx-auto w-40 p-1.5 border border-purple-400 rounded bg-purple-50/50 flex items-center gap-1.5 text-left text-[8px] text-purple-800 leading-tight">
 <svg className="w-8 h-8 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
 <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 3h3v3h-3v-3zm3 3h3v-2h-3v2zm-3-5h2v2h-2v-2zm5 5h1v1h-1v-1zm-1-3h1v1h-1v-1zm-3-3h1v1h-1v-1zm5 1h1v1h-1v-1zm-8 4h2v1h-2v-1zm3 0h1v1h-1v-1zm1 2h2v1h-2v-1z" />
 </svg>
 <div>
 <p className="font-extrabold uppercase tracking-wide">TTE TERVERIFIKASI</p>
 <p className="font-normal text-neutral-600">ID: FIKPsi-{activeStudent.nim}-BA</p>
 <p className="font-normal text-neutral-500">UM PONTIANAK SISTEM</p>
 </div>
 </div>
 )} */}
 </div>
 </div>
 </div>
 </div>
 )}

 {activeDocToPrint === "presensi" && (
 <div className="space-y-4 text-[13px] leading-relaxed">
 <div className="text-center mb-6">
 <h3 className="text-sm font-extrabold uppercase underline tracking-wider">
 DAFTAR HADIR / PRESENSI DOSEN PENGUJI & PEMBIMBING
 </h3>
 <h4 className="text-[12px] font-extrabold tracking-wide uppercase mt-1">
 PELAKSANAAN UJIAN {jenisUjian.toUpperCase()} FIKPsi
 </h4>
 </div>

 <div className="border border-neutral-300 p-4 rounded-sm space-y-2 mb-6">
 <div>
 <span className="inline-block w-36 font-semibold">Nama Mahasiswa</span>
 <span>: {activeStudent.nama} ({activeStudent.nim})</span>
 </div>
 <div>
 <span className="inline-block w-36 font-semibold">Tahap Ujian</span>
 <span>: <b>{jenisUjian}</b></span>
 </div>
 <div>
 <span className="inline-block w-36 font-semibold">Judul Tugas Akhir</span>
 <span>: "{overrideTitle}"</span>
 </div>
 <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-200 mt-2">
 <div>
 <span className="font-semibold block text-[11px]">Hari/Tanggal Ujian:</span>
 <p className="font-bold text-neutral-800">{formatDateIndonesianByString(tanggalUjian)}</p>
 </div>
 <div>
 <span className="font-semibold block text-[11px]">Ruang & Waktu:</span>
 <p className="font-bold text-neutral-800">{ruangUjian} | {waktuUjian}</p>
 </div>
 </div>
 </div>

 <p className="text-justify mb-4">
 Daftar di bawah ini mencatat nama dan tanda tangan kehadiran dosen yang bertugas menguji serta membimbing dalam jalannya sidang mahasiswa di atas:
 </p>

 {/* Attendance table layout */}
 <table className="w-full border border-black text-xs text-left text-neutral-900" style={{ borderCollapse: "collapse" }}>
 <thead>
 <tr className="border-b border-black bg-neutral-100 text-center font-bold">
 <th className="p-3 border-r border-black w-10">No</th>
 <th className="p-3 border-r border-black">Nama Lengkap & NIDN</th>
 <th className="p-3 border-r border-black w-40">Kedudukan / Jabatan Sidang</th>
 <th className="p-3 w-40">Tanda Tangan Kehadiran</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-b border-black">
 <td className="p-3 border-r border-black text-center font-bold">1</td>
 <td className="p-3 border-r border-black">
 <p className="font-bold">{pj1Name}</p>
 <p className="text-[10px] text-neutral-600">NIDN/NIP: {pj1Nidn}</p>
 </td>
 <td className="p-3 border-r border-black font-semibold">Ketua Tim Penguji / Penguji I</td>
 <td className="p-3 italic h-16 text-neutral-400">1. .............................</td>
 </tr>
 <tr className="border-b border-black">
 <td className="p-3 border-r border-black text-center font-bold">2</td>
 <td className="p-3 border-r border-black">
 <p className="font-bold">{pj2Name}</p>
 <p className="text-[10px] text-neutral-600">NIDN/NIP: {pj2Nidn}</p>
 </td>
 <td className="p-3 border-r border-black font-semibold">Anggota Penguji / Penguji II</td>
 <td className="p-3 italic h-16 text-neutral-400 text-right">2. .............................</td>
 </tr>
 <tr className="border-b border-black">
 <td className="p-3 border-r border-black text-center font-bold">3</td>
 <td className="p-3 border-r border-black">
 <p className="font-bold">{pb1Name}</p>
 <p className="text-[10px] text-neutral-600">NIDN/NIP: {pb1Nidn}</p>
 </td>
 <td className="p-3 border-r border-black font-semibold">Pembimbing Utama (I)</td>
 <td className="p-3 italic h-16 text-neutral-400">3. .............................</td>
 </tr>
 {pb2Name && pb2Name !== "-" && (
 <tr className="border-b border-black">
 <td className="p-3 border-r border-black text-center font-bold">4</td>
 <td className="p-3 border-r border-black">
 <p className="font-bold">{pb2Name}</p>
 <p className="text-[10px] text-neutral-600">NIDN/NIP: {pb2Nidn}</p>
 </td>
 <td className="p-3 border-r border-black font-semibold">Pembimbing Pendamping (II)</td>
 <td className="p-3 italic h-16 text-neutral-400 text-right">4. .............................</td>
 </tr>
 )}
 </tbody>
 </table>

 {/* Bottom validation info */}
 <div className="grid grid-cols-2 gap-4 mt-8 pt-4">
 <div className="text-xs text-neutral-500 italic">
 * Berkas presensi ini menjadi syarat kelengkapan pelaporan honorarium menguji kepada Biro Keuangan Universitas.
 </div>
 <div className="text-center text-xs">
 <p>Pontianak, {formatDateOnlyIndonesian(tanggalUjian)}</p>
 <p className="font-bold">Ketua Fakultas Ilmu Kesehatan dan Psikologi</p>
 <p className="mb-14 font-semibold uppercase text-[10px]">FIKPsi UM PONTIANAK</p>
 
 <p className="font-bold underline">Andri Dwi Hernawan, S.K.M., M. Kes (Epid)</p>
 <p className="text-[10px]">NIK: 1234.110.086</p>
 {/* {useTTE && (
 <div className="mt-2 mx-auto w-40 p-1.5 border border-purple-400 rounded bg-purple-50/50 flex items-center gap-1.5 text-left text-[8px] text-purple-800 leading-tight">
 <svg className="w-8 h-8 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
 <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 3h3v3h-3v-3zm3 3h3v-2h-3v2zm-3-5h2v2h-2v-2zm5 5h1v1h-1v-1zm-1-3h1v1h-1v-1zm-3-3h1v1h-1v-1zm5 1h1v1h-1v-1zm-8 4h2v1h-2v-1zm3 0h1v1h-1v-1zm1 2h2v1h-2v-1z" />
 </svg>
 <div>
 <p className="font-extrabold uppercase tracking-wide">TTE TERVERIFIKASI</p>
 <p className="font-normal text-neutral-600">ID: FIKPsi-{activeStudent.nim}-PR</p>
 <p className="font-normal text-neutral-500">UM PONTIANAK SISTEM</p>
 </div>
 </div>
 )} */}
 </div>
 </div>
 </div>
 )}

 {activeDocToPrint === "kwitansi" && (
 <div className="space-y-6 text-[13px] leading-relaxed">
 {/* Standard Receipt Header style */}
 <div className="border border-black p-4 rounded-sm space-y-4">
 <div className="flex justify-between items-start border-b border-black pb-2.5">
 <div>
 <h4 className="font-bold text-sm tracking-wide">UNIVERSITAS MUHAMMADIYAH PONTIANAK</h4>
 <p className="text-[10px] font-semibold text-neutral-700">Fakultas Ilmu Kesehatan & Psikologi | FIKPsi</p>
 </div>
 <div className="border-l border-black pl-4 text-right">
 <span className="font-extrabold text-[#0f766e] text-[13px]">BUKTI PENGELUARAN</span>
 <p className="text-[9px] text-neutral-500">No. Voucher: FIKPsi / {Math.floor(1000 + Math.random() * 9000)}</p>
 </div>
 </div>

 {/* Receipt main terms */}
 <div className="space-y-3 pt-2 text-[12.5px]">
 <div className="grid grid-cols-12 gap-1.5">
 <span className="col-span-3 font-semibold text-gray-700">Sudah Terima Dari</span>
 <div className="col-span-9 font-bold">: Bendahara Pengeluaran Fakultas Ilmu Kesehatan dan Psikologi UM Pontianak</div>
 </div>
 <div className="grid grid-cols-12 gap-1.5">
 <span className="col-span-3 font-semibold text-gray-700">Uang Sejumlah</span>
 <div className="col-span-9 bg-neutral-100 p-2 border border-dashed border-neutral-400 font-bold italic">
 : " # {integerToIndonesianWords(nominalHonor)} Rupiah # "
 </div>
 </div>
 <div className="grid grid-cols-12 gap-1.5">
 <span className="col-span-3 font-semibold text-gray-700">Untuk Pembayaran</span>
 <div className="col-span-9 leading-relaxed">
 : <b>Honorarium Menguji & Membimbing Akhir {jenisUjian}</b> atas nama Mahasiswa : <b>{activeStudent.nama}</b> NIM: <b>{activeStudent.nim}</b> dengan Judul Tugas Akhir: <i>"{overrideTitle}"</i>.
 </div>
 </div>
 </div>

 {/* Nominal with double border */}
 <div className="flex justify-between items-center pt-4 border-t border-black">
 <div className="border-4 border-double border-black px-6 py-2 bg-neutral-50 text-base font-extrabold">
 Rp. {nominalHonor.toLocaleString("id-ID")},-
 </div>
 <div className="text-right text-[11px] font-bold text-neutral-600">
 Pontianak, {formatDateOnlyIndonesian(tanggalUjian)}
 </div>
 </div>

 {/* Signatures */}
 <div className="grid grid-cols-3 gap-2 text-center text-xs pt-4 font-semibold text-neutral-800">
 <div>
 <p>Menyetujui & Membayar,</p>
 <p className="font-bold mt-1">Bendahara Prodi</p>
 <p className="mb-12 text-[10px] text-neutral-500">(Kasir FIKPsi)</p>
 <p className="font-bold underline text-[11px]">Wahyuni S.E.</p>
 </div>
 <div>
 <p>Mengetahui,</p>
 <p className="font-bold mt-1">Ketua Program Studi</p>
 <p className="mb-12 text-[10px] text-neutral-500"></p>
 <p className="font-bold underline text-[11px]">Andri Dwi Hernawan, M.Kes</p>
 </div>
 <div>
 <p>Penerima Honorarium,</p>
 <p className="font-bold mt-1">Dosen Terkait</p>
 <p className="mb-12 text-[10px] text-neutral-500">(Tanda Tangan Penerima)</p>
 <p className="font-bold text-[11px] underline">({pj1Name})</p>
 </div>
 </div>
 </div>

 <div className="border border-dashed border-neutral-400 pt-3 text-[10px] text-neutral-500 italic">
 * Catatan: Dokumen ini dicetak otomatis 1 (satu) lembar untuk tiap tim penguji dan pembimbing guna pencatatan rekap pengeluaran kas operasional prodi.
 </div>
 </div>
 )}

 {activeDocToPrint === "saran" && (
 <div className="space-y-4 text-[13px] leading-relaxed">
 <div className="text-center mb-6">
 <h3 className="text-sm font-extrabold uppercase underline tracking-wider">
 LEMBAR SARAN, MASUKAN DAN PERBAIKAN {jenisUjian.toUpperCase()}
 </h3>
 <h4 className="text-[12px] font-bold uppercase tracking-wider text-neutral-700 mt-1">
 PROGRAM FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI
 </h4>
 </div>

 <div className="border border-neutral-300 p-4 rounded-sm space-y-1 my-4">
 <div className="grid grid-cols-12">
 <span className="col-span-3 font-semibold">Nama Mahasiswa</span>
 <span className="col-span-9">: <b>{activeStudent.nama}</b> ({activeStudent.nim})</span>
 </div>
 <div className="grid grid-cols-12">
 <span className="col-span-3 font-semibold">Ujian Pelaksanaan</span>
 <span className="col-span-9">: {jenisUjian} / Magister S2</span>
 </div>
 <div className="grid grid-cols-12">
 <span className="col-span-3 font-semibold">Judul Tugas Akhir</span>
 <span className="col-span-9">: "{overrideTitle}"</span>
 </div>
 <div className="grid grid-cols-12 pt-1.5 border-t border-neutral-200 mt-1.5 text-[11px] font-bold text-neutral-600">
 <span className="col-span-6">Hari / Tanggal Ujian : {formatDateIndonesianByString(tanggalUjian)}</span>
 <span className="col-span-6 text-right">Ruangan: {ruangUjian}</span>
 </div>
 </div>

 <p className="font-bold uppercase tracking-wide text-xs underline mb-2 mt-4 text-neutral-900">CATATAN & SARAN PERBAIKAN DOSEN PEMBIMBING/PENGUJI:</p>

 {/* Predefined or Blank lined space for comments */}
 <div className="border border-black p-4 min-h-[300px] leading-relaxed rounded-sm font-mono text-[12px] bg-white text-justify whitespace-pre-wrap leading-loose">
 {catatanSaran || "Silakan penguji / pembimbing menuliskan perbaikan secara manual pada kolom ini..."}
 </div>

 <p className="text-[11px] text-neutral-600 italic leading-snug mt-2 text-justify">
 * Untuk kelayakan perbaikan draf tugas akhir mhs, lembar saran ini harap ditandatangani oleh dosen penguji terkait sebagai instrumen kesediaan/syarat ACC sebelum ujian lanjutan dilangsungkan.
 </p>

 {/* Bottom Signature */}
 <div className="grid grid-cols-2 gap-4 mt-12 pt-4 text-xs font-semibold">
 <div>
 <span className="text-gray-500 block italic font-normal">Sikap ACC Dosen:</span>
 <div className="mt-1 flex items-center gap-1.5 font-bold text-neutral-700">
 <div className="w-4 h-4 border border-black rounded-sm flex items-center justify-center font-extrabold text-[10px]">â˜‘</div>
 <span>Setuju untuk perbaikan draf</span>
 </div>
 </div>
 <div className="text-center">
 <p>Pontianak, {formatDateOnlyIndonesian(tanggalUjian)}</p>
 <p className="font-bold underline mt-1 mb-16">Dosen Penilai / Penguji</p>
 
 <p className="font-bold">{pj1Name}</p>
 <p className="text-[10px] text-neutral-500">NIDN/NIP: {pj1Nidn}</p>
 {/* {useTTE && (
 <div className="mt-2 mx-auto w-40 p-1.5 border border-purple-400 rounded bg-purple-50/50 flex items-center gap-1.5 text-left text-[8px] text-purple-800 leading-tight">
 <svg className="w-8 h-8 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
 <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 3h3v3h-3v-3zm3 3h3v-2h-3v2zm-3-5h2v2h-2v-2zm5 5h1v1h-1v-1zm-1-3h1v1h-1v-1zm-3-3h1v1h-1v-1zm5 1h1v1h-1v-1zm-8 4h2v1h-2v-1zm3 0h1v1h-1v-1zm1 2h2v1h-2v-1z" />
 </svg>
 <div>
 <p className="font-extrabold uppercase tracking-wide">TTE TERVERIFIKASI</p>
 <p className="font-normal text-neutral-600 font-mono">ID: FIKPsi-{activeStudent.nim}-SR</p>
 <p className="font-normal text-neutral-500">UM PONTIANAK SISTEM</p>
 </div>
 </div>
 )} */}
 </div>
 </div>
 </div>
 )}

 {activeDocToPrint === "penilaian" && (() => {
 const assessors = [];
 assessors.push({
 name: pb1Name || "Andri Dwi Hernawan, S.K.M., M. Kes (Epid)",
 nidn: pb1Nidn || "0412030091",
 title: "Dosen Pembimbing Utama / Pembimbing I",
 role: "Pembimbing 1"
 });
 
 if (pb2Name && pb2Name !== "-" && pb2Name !== "") {
 assessors.push({
 name: pb2Name,
 nidn: pb2Nidn || "-",
 title: "Dosen Pembimbing Pendamping / Pembimbing II",
 role: "Pembimbing 2"
 });
 } else if (jenisUjian === "Seminar Hasil" || jenisUjian === "Seminar Proposal" || jenisUjian === "Sidang Tugas Akhir") {
 // Ensure second supervisor exists
 assessors.push({
 name: "Dosen Pembimbing Kedua",
 nidn: "-",
 title: "Dosen Pembimbing Pendamping / Pembimbing II",
 role: "Pembimbing 2"
 });
 }

 if (jenisUjian !== "Seminar Hasil") {
 assessors.push({
 name: pj1Name || "Dosen Penguji I",
 nidn: pj1Nidn || "0411030052",
 title: "Dosen Penilai Utama / Penguji I",
 role: "Penguji 1"
 });
 assessors.push({
 name: pj2Name || "Dosen Penilai Pendamping / Penguji II",
 nidn: pj2Nidn || "0405090013",
 title: "Dosen Penilai Pendamping / Penguji II",
 role: "Penguji 2"
 });
 }

 return (
 <div className="space-y-8 print:space-y-0">
 {/* Dedicated styling inside print-area to prevent double padding and split sheet margins strictly */}
 <style>{`
 @media print {
 #print-area {
 padding: 0 !important;
 margin: 0 !important;
 background: transparent !important;
 box-shadow: none !important;
 border: none !important;
 width: 100% !important;
 max-width: 100% !important;
 }
 .printable-sheet {
 padding: 1.8cm !important;
 margin: 0 !important;
 width: 100% !important;
 max-width: 100% !important;
 min-height: 0 !important;
 background: #ffffff !important;
 color: #000000 !important;
 box-shadow: none !important;
 border: none !important;
 page-break-after: always !important;
 break-after: page !important;
 box-sizing: border-box !important;
 }
 .printable-sheet:last-child {
 page-break-after: avoid !important;
 break-after: avoid !important;
 }
 }
 `}</style>
 {assessors.map((assessor, idx) => (
 <div 
 key={idx} 
 className="printable-sheet bg-white text-black p-[1.8cm] w-full max-w-[21.5cm] min-h-[33cm] shadow-2xl rounded-sm border border-neutral-300 text-left relative"
 style={idx < assessors.length - 1 ? { pageBreakAfter: "always", breakAfter: "page" } : {}}
 >
 {/* Kop Surat Header */}
 {!hideHeaderLogo ? (
 <div 
 className="relative flex items-center justify-center border-b-4 border-double border-black pb-3 mb-6 min-h-[105px]"
 style={{ fontFamily: "'Times New Roman', Times, serif" }}
 >
 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[95px] h-[95px] flex items-center justify-center">
 {state.logo ? (
 <img src={state.logo} alt="Logo" className="w-[90px] h-[90px] object-contain" referrerPolicy="no-referrer" />
 ) : (
 <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-300 flex items-center justify-center text-2xl font-extrabold text-[#0d9488]">
 UM
 </div>
 )}
 </div>
 <div className="text-center px-16">
 <h1 className="text-[15px] md:text-[17px] font-bold uppercase tracking-wide leading-tight text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 UNIVERSITAS MUHAMMADIYAH PONTIANAK
 </h1>
 <h2 className="text-[12px] md:text-[13px] font-bold uppercase tracking-wide leading-tight mt-0.5 text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI
 </h2>
 <h2 className="text-[11px] md:text-[12px] font-bold uppercase tracking-wide leading-tight mt-0.5 text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 PROGRAM STUDI FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI (S2)
 </h2>
 <p className="text-[9.5px] md:text-[10px] leading-snug mt-1 italic text-black font-medium" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 Alamat: Jl. Jend. Ahmad Yani No. 111, Pontianak, Kalimantan Barat 78124<br />
 Email: fikpsi@unmuhpnk.ac.id | Telp: (0561) 764571 | Website: fikpsi.unmuhpnk.ac.id
 </p>
 </div>
 </div>
 ) : (
 <div className="h-[3.6cm] w-full border-b border-dashed border-gray-200 invisible print:visible print:border-none mb-6" />
 )}

 <div className="text-center mb-6">
 <h3 className="text-sm font-extrabold uppercase underline tracking-wider">
 LEMBAR PENILAIAN AKADEMIK {jenisUjian.toUpperCase()}
 </h3>
 <h4 className="text-[12px] font-bold uppercase tracking-wider text-neutral-600 mt-0.5">
 FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI
 </h4>
 </div>

 <div className="border-y border-neutral-300 py-3 my-4 space-y-1.5 text-xs">
 <div className="grid grid-cols-2">
 <div><b>Nama Mahasiswa :</b> {activeStudent.nama}</div>
 <div className="text-right"><b>NIM Mahasiswa :</b> {activeStudent.nim}</div>
 </div>
 <div><b>Judul Penulisan Tugas Akhir :</b> "{overrideTitle}"</div>
 <div className="grid grid-cols-2">
 <div><b>Tanggal Ujian :</b> {formatDateOnlyIndonesian(tanggalUjian)}</div>
 <div className="text-right"><b>Forum Waktu / Ruang :</b> {waktuUjian} | {ruangUjian}</div>
 </div>
 </div>

 <p className="text-justify mb-2">
 Komponen penilaian kelayakan draf Tugas Akhir mhs ditentukan berdasarkan rentang standar evaluasi rubrik akademik Magister S2 di bawah ini:
 </p>

 {/* Rubric evaluation table */}
 <table className="w-full border border-black text-xs text-left" style={{ borderCollapse: "collapse" }}>
 <thead>
 <tr className="border-b border-black bg-neutral-100 text-center font-bold">
 <th className="p-2 border-r border-black w-8">No</th>
 <th className="p-2 border-r border-black">Aspek / Parameter Penilaian</th>
 <th className="p-2 border-r border-black w-14">Bobot</th>
 <th className="p-2 border-r border-black w-24">Skor (0-100)</th>
 <th className="p-2 w-28 text-center">Nilai Terbobot</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-b border-black">
 <td className="p-2 border-r border-black text-center">1</td>
 <td className="p-2 border-r border-black">
 <b>Penyusunan Latar Belakang & Identifikasi Masalah Utama</b><br />
 <span className="text-[10px] text-gray-600">Kelayakan telaah pustaka dan orisinalitas analisis empiris.</span>
 </td>
 <td className="p-2 border-r border-black text-center font-bold">25%</td>
 <td className="p-2 border-r border-black font-semibold text-center">{nilaiAngka - 2}</td>
 <td className="p-2 text-center font-bold">{((nilaiAngka - 2) * 0.25).toFixed(1)}</td>
 </tr>
 <tr className="border-b border-black">
 <td className="p-2 border-r border-black text-center">2</td>
 <td className="p-2 border-r border-black">
 <b>Desain Metodologi Penelitian & Pemilihan Ukuran Sampel</b><br />
 <span className="text-[10px] text-gray-600">Instrumen analisis statistik, etika penelitian riset kesehatan.</span>
 </td>
 <td className="p-2 border-r border-black text-center font-bold">30%</td>
 <td className="p-2 border-r border-black font-semibold text-center">{nilaiAngka + 1}</td>
 <td className="p-2 text-center font-bold">{((nilaiAngka + 1) * 0.30).toFixed(1)}</td>
 </tr>
 <tr className="border-b border-black">
 <td className="p-2 border-r border-black text-center">3</td>
 <td className="p-2 border-r border-black">
 <b>Penguasaan Presentasi & Argumentasi Dewan Penguji</b><br />
 <span className="text-[10px] text-gray-600">Ketepatan menjawab masukan riset dan wawasan akademik.</span>
 </td>
 <td className="p-2 border-r border-black text-center font-bold">25%</td>
 <td className="p-2 border-r border-black font-semibold text-center">{nilaiAngka}</td>
 <td className="p-2 text-center font-bold">{(nilaiAngka * 0.25).toFixed(1)}</td>
 </tr>
 <tr className="border-b border-black">
 <td className="p-2 border-r border-black text-center">4</td>
 <td className="p-2 border-r border-black">
 <b>Ketepatan Penulisan, Format, & Ejaan Naskah (SOP)</b><br />
 <span className="text-[10px] text-gray-600">Kelayakan referensi perpustakaan digital terkini.</span>
 </td>
 <td className="p-2 border-r border-black text-center font-bold">20%</td>
 <td className="p-2 border-r border-black font-semibold text-center">{nilaiAngka - 1}</td>
 <td className="p-2 text-center font-bold">{((nilaiAngka - 1) * 0.20).toFixed(1)}</td>
 </tr>
 {/* Sum details */}
 <tr className="border-t border-black bg-neutral-50 uppercase font-bold">
 <td className="p-2 border-r border-black text-center" colSpan={2}><b>Total Kumulatif Nilai Terbobot</b></td>
 <td className="p-2 border-r border-black text-center">100%</td>
 <td className="p-2 border-r border-black text-center font-extrabold text-neutral-800 bg-neutral-100">Lulus</td>
 <td className="p-2 text-center font-extrabold text-neutral-900 border-2 border-black">{nilaiAngka} / {getLetterGrade(nilaiAngka)}</td>
 </tr>
 </tbody>
 </table>

 {/* Evaluation standards info */}
 <div className="p-2.5 rounded-sm bg-neutral-50 border border-neutral-300 text-[10px] text-neutral-600 leading-relaxed">
 <b>Catatan Rentang Grade Kelulusan:</b><br />
 80 - 100 = A (Sangat Memuaskan) | 70 - 79.9 = B (Kompeten / Baik) | 60 - 69.9 = C (Cukup / Bersyarat) | &lt; 60 = D / Tidak Lulus.
 </div>

 {/* Bottom Signature evaluator */}
 <div className="grid grid-cols-2 gap-4 mt-8 pt-4">
 <div className="text-center font-semibold text-xs">
 <p className="mb-14 text-neutral-400">Paraf Penguji Penanggung Jawab,</p>
 <p className="font-bold text-slate-800 underline">............................................</p>
 <p className="text-[10px] text-neutral-500">NIDN / NIP</p>
 </div>
 <div className="text-center text-xs font-semibold pb-1">
 <p className="mb-1">Pontianak, {formatDateOnlyIndonesian(tanggalUjian)}</p>
 <p className="font-bold">{assessor.title}</p>
 <p className="mb-14 text-[10px] uppercase text-neutral-500"></p>
 
 <p className="font-bold underline text-slate-800">{assessor.name}</p>
 <p className="text-[10px] text-neutral-500">NIDN/NIP: {assessor.nidn}</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 );
 })()}

 {activeDocToPrint === "pernyataan-perbaikan" && (
 <div className="space-y-4 text-[13px] leading-relaxed text-justify">
 <div className="text-center mb-6">
 <h3 className="text-sm font-extrabold uppercase underline tracking-wider">
 SURAT PERNYATAAN KESEDIAAN PENYERAHAN PERBAIKAN DAN DRAF REVISI
 </h3>
 <h4 className="text-[11px] font-extrabold tracking-wide uppercase mt-1">
 UJIAN {jenisUjian.toUpperCase()} PROGRAM STUDI PASCASARJANA
 </h4>
 </div>

 <p>Saya yang bertandatangan di bawah ini selaku mahasiswa magister aktif:</p>

 {/* Identity table */}
 <div className="pl-6 space-y-1.5 my-4">
 <div className="flex">
 <span className="w-40 font-semibold">Nama Lengkap Mahasiswa</span>
 <span>: <b>{activeStudent.nama}</b></span>
 </div>
 <div className="flex">
 <span className="w-40 font-semibold">Nomor Induk Mahasiswa (NIM)</span>
 <span>: <b>{activeStudent.nim}</b></span>
 </div>
 <div className="flex">
 <span className="w-40 font-semibold">Konsentrasi Akademik</span>
 <span>: Fakultas Ilmu Kesehatan dan Psikologi (FIKPsi)</span>
 </div>
 <div className="flex text-justify">
 <span className="w-40 font-semibold flex-shrink-0">Judul Tugas Akhir Pertahanan</span>
 <span>: "{overrideTitle}"</span>
 </div>
 </div>

 <p>
 Dengan ini menyatakan dengan sadar dan penuh tanggung jawab bahwa saya <b>BERSEDIA, SANGGUP DAN BERKOMITMEN PENUH</b> untuk melakukan revisi dan perbaikan draf tugas akhir hasil dewan penguji pada ujian {jenisUjian} hari ini:
 </p>

 <div className="p-4 border border-rose-400 bg-rose-50/20 rounded-sm font-bold text-rose-900 leading-relaxed text-xs">
 Wajib menyerahkan berkas revisi yang telah di-ACC oleh Tim Penguji & Pembimbing dalam waktu paling lambat {hariPerbaikan} (empat belas) hari kalender terhitung sejak hari pelaksanaan ujian, yaitu pada atau sebelum tanggal: <span className="underline">{formatDateOnlyIndonesian(new Date(new Date(tanggalUjian).getTime() + hariPerbaikan * 24 * 60 * 60 * 1000).toISOString())}</span>.
 </div>

 <p>
 Apabila saya tidak dapat memenui tenggat penyerahan revisi draf tugas akhir magister beserta lampiran perbaikannya di atas tanpa konfirmasi berhalangan tetap secara layak kepada prodi, maka saya bersedia menerima konsekuensi hukum akademik sebagai berikut:
 </p>
 <ol className="list-decimal pl-6 space-y-1 text-slate-800">
 <li>Pembatalan atau penurunan status kelayakan nilai akhir kelulusan sidang saya secara sepihak.</li>
 <li>Draf digolongkan gugur dan wajib mengajukan permohonan ujian ulang atau denda administrasi.</li>
 <li>Penundaan pendaftaran prosesi Wisuda / Yudisium resmi ke semester tahun berikutnya.</li>
 </ol>

 <p className="mt-4">
 Demikianlah lembar komitmen kesediaan perbaikan tugas akhir ini saya tandatangani dengan sukarela untuk dipergunakan sebagaimana mestinya.
 </p>

 {/* Signature panels */}
 <div className="grid grid-cols-2 gap-4 mt-12 text-xs font-semibold">
 <div className="text-center flex flex-col items-center">
 <p className="mb-3 text-neutral-500">Mengetahui/Menyetujui,</p>
 <p className="font-bold underline leading-none mb-14 text-neutral-800">Ketua Sidang Tim Penguji</p>
 
 <p className="font-bold underline text-slate-800">{pj1Name}</p>
 <p className="text-[10px] text-neutral-500">NIDN: {pj1Nidn}</p>
 </div>
 <div className="text-center flex flex-col items-center">
 <p className="mb-3">Pontianak, {formatDateOnlyIndonesian(tanggalUjian)}</p>
 <p className="font-bold underline leading-none mb-14 text-neutral-800">Pembuat Pernyataan (Mahasiswa)</p>
 
 {/* Materai placeholder box */}
 <div className="relative border border-dashed border-gray-400 w-24 h-11 flex items-center justify-center text-[8px] text-gray-500 font-bold rotate-[-3deg] absolute translate-y-[-70px] uppercase bg-slate-50">
 Materai 10.000
 </div>
 
 <p className="font-bold underline text-slate-800">{activeStudent.nama}</p>
 <p className="text-[10px] text-neutral-500">NIM: {activeStudent.nim}</p>
 </div>
 </div>
 </div>
 )}

 {activeDocToPrint === "daftar-penonton" && (
 <div className="space-y-4 text-[13px] leading-relaxed">
 <div className="text-center mb-6">
 <h3 className="text-sm font-extrabold uppercase underline tracking-wider">
 DAFTAR HADIR AUDIENS / PENONTON SEMINAR MAHASISWA
 </h3>
 <h4 className="text-[12px] font-bold uppercase tracking-wider text-neutral-700 mt-1">
 PROGRAM STUDI S2 FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI
 </h4>
 </div>

 <div className="border border-neutral-300 p-4 rounded-sm space-y-1 mb-4 text-xs font-semibold">
 <div><b>Nama Penyaji (Mahasiswa) :</b> {activeStudent.nama} ({activeStudent.nim})</div>
 <div><b>Tahapan Pelaksanaan :</b> {jenisUjian} / S2 Magister</div>
 <div><b>Hari / Tanggal Ujian :</b> {formatDateIndonesianByString(tanggalUjian)}</div>
 <div><b>Waktu & Ruang Sidang :</b> {waktuUjian} | {ruangUjian}</div>
 <div><b>Judul Penulisan Tugas Akhir :</b> "{overrideTitle}"</div>
 </div>

 <p className="text-justify mb-2 text-xs">
 Kehadiran audiens menyaksikan pertahanan naskah seminar diatur sebagai prasyarat wajib kepustakaan / literasi bagi peningkatan pemahaman riset mahasiswa magister aktif lainnya:
 </p>

 {/* Empty table matrix for handwritten signatures */}
 <table className="w-full border border-black text-xs text-left" style={{ borderCollapse: "collapse" }}>
 <thead>
 <tr className="border-b border-black bg-neutral-100 text-center font-bold">
 <th className="p-2 border-r border-black w-10">No</th>
 <th className="p-2 border-r border-black w-60">Nama Lengkap Mahasiswa Penonton</th>
 <th className="p-2 border-r border-black w-36 text-center">NIM Mahasiswa</th>
 <th className="p-2 text-center">Tanda Tangan Kehadiran</th>
 </tr>
 </thead>
 <tbody>
 {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
 <tr key={num} className="border-b border-black h-8.5">
 <td className="p-2 border-r border-black text-center font-semibold bg-neutral-50/50">{num}</td>
 <td className="p-2 border-r border-black"></td>
 <td className="p-2 border-r border-black"></td>
 <td className="p-2 text-left italic text-[10px] text-gray-400 pl-4">
 {num % 2 !== 0 ? `${num}. ..............................` : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A5 ${num}. ..............................`}
 </td>
 </tr>
 ))}
 </tbody>
 </table>

 {/* Bottom approval validation */}
 <div className="grid grid-cols-2 gap-4 mt-8 pt-4 font-semibold text-xs">
 <div>
 <span className="text-gray-500 italic block font-normal">Ketentuan Kehadiran Penonton:</span>
 <p className="text-[10px] text-neutral-600 leading-relaxed text-justify mt-1.5">
 Sesuai SOP Pascasarjana, lembar kehadiran ini diserahkan kepada administrasi prodi usai presentasi ditutup sebagai arsip resmi kriteria kebulatan seminar penyaji.
 </p>
 </div>
 <div className="text-center">
 <p>Pontianak, {formatDateOnlyIndonesian(tanggalUjian)}</p>
 <p className="font-bold underline mt-1 mb-14">Ketua Sidang Tim Penguji</p>
 
 <p className="font-bold">{pj1Name}</p>
 <p className="text-[10px] text-neutral-500">NIDN: {pj1Nidn}</p>
 </div>
 </div>
 </div>
 )}

 </div>

 </div>
 )}

 </div>
 );
}


