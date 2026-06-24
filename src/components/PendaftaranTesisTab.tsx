import React, { useState, useEffect } from "react";
import { 
 Plus, 
 CheckCircle, 
 XCircle, 
 Clock, 
 AlertCircle, 
 Upload, 
 Download, 
 Eye, 
 Edit3, 
 DollarSign, 
 Filter, 
 Search, 
 TrendingUp, 
 FileText, 
 Image, 
 CheckSquare, 
 ChevronRight,
 Settings,
 ClipboardList,
 FileDown,
 Printer
} from "lucide-react";
import { AppState, Pengguna, PendaftaranTesis, BiayaUjian } from "../types";

const renderFIKPsiFields = (peminatan?: string, noEtikKEPK?: string, similarityTurnitin?: number) => {
 if (!peminatan && !noEtikKEPK && (similarityTurnitin === undefined || similarityTurnitin === 0)) return null;
 return (
 <div className="mt-2 flex flex-wrap gap-1.5 items-center">
 {peminatan && (
 <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-md bg-[var(--brand-light)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20" title="Peminatan Bidang Riset Fakultas Ilmu Kesehatan dan Psikologi">
 🎓 {peminatan}
 </span>
 )}
 {noEtikKEPK && noEtikKEPK !== "-" && (
 <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/45 text-sky-800 dark:text-sky-305 border border-sky-200 dark:border-sky-900/40" title="Nomor Kelayakan Etik Penelitian Kesehatan (KEPK)">
 ⚖ Etik: {noEtikKEPK}
 </span>
 )}
 {similarityTurnitin !== undefined && similarityTurnitin > 0 && (
 <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md border ${
 similarityTurnitin <= 20 
 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-850 dark:text-emerald-305 border-emerald-250 dark:border-emerald-850" 
 : similarityTurnitin <= 30
 ? "bg-amber-50 dark:bg-amber-950/45 text-amber-705 dark:text-amber-400 border-amber-250"
 : "bg-rose-50 dark:bg-rose-950/40 text-rose-805 dark:text-rose-300 border-rose-250"
 }`} title="Turnitin Similarity Index">
 📊 Turnitin: {similarityTurnitin}%
 </span>
 )}
 </div>
 );
};

interface PendaftaranTesisTabProps {
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

// Fixed standard references of academic requirements for thesis stages
const PERSYARATAN_TEMPLATES = {
 "Seminar Proposal": [
 { id: "sp_persetujuan", label: "Lembar Persetujuan Seminar Proposal Tugas Akhir ditandatangani Pembimbing" },
 { id: "sp_bebasperpustakaan", label: "Bukti Surat Bebas Tunggakan Buku Perpustakaan" },
 ],
 "Seminar Hasil": [
 { id: "sh_revisisempro", label: "Berita Acara & Catatan Revisi Seminar Proposal yang sudah diperbaiki" },
 { id: "sh_draft", label: "Draf Naskah Bab 1 s.d Bab 4 Hasil Penelitian Tugas Akhir Lengkap" },
 { id: "sh_logbook", label: "Riwayat Bimbingan Logbook Elektronik (Minimal 8 kali pertemuan)" },
 { id: "sh_rekomendasi", label: "Rekomendasi tertulis Kelayakan Seminar Hasil dari kedua Pembimbing" },
 ],
 "Sidang Tugas Akhir": [
 { id: "sd_draftlengkap", label: "Naskah Tugas Akhir Lengkap (Bab 1 s.d Bab 5 beserta Lampiran lengkap)" },
 { id: "sd_persetujuan", label: "Lembar Pengesahan Kelayakan Sidang Pleno Tugas Akhir dari Pembimbing" },
 { id: "sd_turnitin", label: "Sertifikat Bebas Plagiarisme asli (Turnitin similarity index maksimal 25%)" },
 { id: "sd_toefl", label: "Sertifikat asli Kemampuan Bahasa Inggris (TOEFL score minimal 475)" },
 { id: "sd_publikasi", label: "Bukti Submit Publikasi Jurnal Ilmiah / LoA (Letter of Acceptance)" },
 ],
};

export function PendaftaranTesisTab({ currentUser, state, mutate, showToast }: PendaftaranTesisTabProps) {
 // Safe helper for exam fee values (use seeds if available, or default to standard fallback values)
 const getBiayaNominal = (stageId: string): number => {
 const list = state.biayaUjian || [];
 const found = list.find(b => b.id === stageId);
 if (found) return found.nominal;
 if (stageId === "sempro") return 500000;
 if (stageId === "semhas") return 750000;
 return 1500000; // default for sidang
 };

 const getBiayaujianList = (): BiayaUjian[] => {
 if (state.biayaUjian && state.biayaUjian.length > 0) {
 return state.biayaUjian;
 }
 return [
 { id: "sempro", nama: "Seminar Proposal", nominal: 500000 },
 { id: "semhas", nama: "Seminar Hasil", nominal: 750000 },
 { id: "sidang", nama: "Sidang Akhir Tugas Akhir", nominal: 1500000 }
 ];
 };

 const renderClearanceAndSignatures = (record: any) => {
 if (!record) return null;
 return (
 <div className="mt-3 pt-3 border-t border-[var(--border-color)] space-y-3 bg-[var(--bg-surface-hover)] p-2 rounded-lg">
 <div>
 <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
 Verifikasi Prasyarat Akademik:
 </span>
 <div className="grid grid-cols-2 gap-1.5">
 <div className="text-[10px] font-semibold">
 {record.statusTranskrip === "Lengkap" ? (
 <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
 ✓ Transkrip Di-ACC
 </span>
 ) : (
 <span className="text-rose-700 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
 ⚠ Transkrip Belum
 </span>
 )}
 </div>
 <div className="text-[10px] font-semibold">
 {record.statusKrs === "Lengkap" ? (
 <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
 ✓ KRS Di-ACC
 </span>
 ) : (
 <span className="text-rose-700 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
 ⚠ KRS Belum
 </span>
 )}
 </div>
 </div>
 </div>

 <div>
 <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
 ACC Pembimbing & Penguji:
 </span>
 <div className="grid grid-cols-2 gap-1.5">
 {record.accPembimbing1 !== "Tidak Ada" && (
 <div className="text-[9.5px] font-semibold text-[var(--text-main)] flex flex-col bg-[var(--bg-base)] border border-[var(--border-color)] p-1.5 rounded">
 <span className="text-[var(--text-muted)] font-bold block truncate">Pembimbing 1:</span>
 <span className={`font-extrabold mt-0.5 ${record.accPembimbing1 === "Disetujui" ? "text-emerald-600" : record.accPembimbing1 === "Ditolak" ? "text-rose-600" : "text-amber-600"}`}>
 {record.accPembimbing1 === "Disetujui" ? "✓ ACC" : record.accPembimbing1 === "Ditolak" ? "✕ Ditolak" : "• Menunggu"}
 </span>
 </div>
 )}
 {record.accPembimbing2 !== "Tidak Ada" && (
 <div className="text-[9.5px] font-semibold text-[var(--text-main)] flex flex-col bg-[var(--bg-base)] border border-[var(--border-color)] p-1.5 rounded">
 <span className="text-[var(--text-muted)] font-bold block truncate">Pembimbing 2:</span>
 <span className={`font-extrabold mt-0.5 ${record.accPembimbing2 === "Disetujui" ? "text-emerald-600" : record.accPembimbing2 === "Ditolak" ? "text-rose-600" : "text-amber-600"}`}>
 {record.accPembimbing2 === "Disetujui" ? "✓ ACC" : record.accPembimbing2 === "Ditolak" ? "✕ Ditolak" : "• Menunggu"}
 </span>
 </div>
 )}
 {record.accPenguji1 !== "Tidak Ada" && (
 <div className="text-[9.5px] font-semibold text-[var(--text-main)] flex flex-col bg-[var(--bg-base)] border border-[var(--border-color)] p-1.5 rounded">
 <span className="text-[var(--text-muted)] font-bold block truncate">Penguji 1:</span>
 <span className={`font-extrabold mt-0.5 ${record.accPenguji1 === "Disetujui" ? "text-emerald-600" : record.accPenguji1 === "Ditolak" ? "text-rose-600" : "text-amber-600"}`}>
 {record.accPenguji1 === "Disetujui" ? "✓ ACC" : record.accPenguji1 === "Ditolak" ? "✕ Ditolak" : "• Menunggu"}
 </span>
 </div>
 )}
 {record.accPenguji2 !== "Tidak Ada" && (
 <div className="text-[9.5px] font-semibold text-[var(--text-main)] flex flex-col bg-[var(--bg-base)] border border-[var(--border-color)] p-1.5 rounded">
 <span className="text-[var(--text-muted)] font-bold block truncate">Penguji 2:</span>
 <span className={`font-extrabold mt-0.5 ${record.accPenguji2 === "Disetujui" ? "text-emerald-600" : record.accPenguji2 === "Ditolak" ? "text-rose-600" : "text-amber-600"}`}>
 {record.accPenguji2 === "Disetujui" ? "✓ ACC" : record.accPenguji2 === "Ditolak" ? "✕ Ditolak" : "• Menunggu"}
 </span>
 </div>
 )}
 </div>
 </div>
 </div>
 );
 };

 // State managers
 const [activeStageTab, setActiveStageTab] = useState<"all" | "Seminar Proposal" | "Seminar Hasil" | "Sidang Tugas Akhir">("all");
 const [activeAdminTab, setActiveAdminTab] = useState<"overview" | "applications" | "fees">("overview");
 
 // Search and status filters
 const [searchQuery, setSearchQuery] = useState("");
 const [statusFilter, setStatusFilter] = useState("all");

 // Edit fee settings states
 const [isUpdatingFees, setIsUpdatingFees] = useState(false);
 const [feeSempro, setFeeSempro] = useState(() => getBiayaNominal("sempro"));
 const [feeSemhas, setFeeSemhas] = useState(() => getBiayaNominal("semhas"));
 const [feeSidang, setFeeSidang] = useState(() => getBiayaNominal("sidang"));

 // New Registration State
 const [isFormOpen, setIsFormOpen] = useState(false);
 const [targetRegisterStage, setTargetRegisterStage] = useState<"Seminar Proposal" | "Seminar Hasil" | "Sidang Tugas Akhir">("Seminar Proposal");
 const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
 const [draftTitle, setDraftTitle] = useState("");
 const [driveLink, setDriveLink] = useState("");
 const [catatanMhs, setCatatanMhs] = useState("");
 
 // Public Health Academic variables
 const [peminatan, setPeminatan] = useState("Epidemiologi Kesehatan");
 const [noEtikKEPK, setNoEtikKEPK] = useState("");
 const [similarityTurnitin, setSimilarityTurnitin] = useState("");

 // Turnitin Simulation States
 const [isSyncingTurnitin, setIsSyncingTurnitin] = useState(false);
 const [turnitinStatusMessage, setTurnitinStatusMessage] = useState("");
 const [turnitinReport, setTurnitinReport] = useState<{
 score: number;
 checkedAt: string;
 sources: { source: string; match: number; type: string }[];
 } | null>(null);

 const handleSimulateTurnitin = () => {
 setIsSyncingTurnitin(true);
 setTurnitinStatusMessage("Menghubungkan ke server repositori Turnitin API...");
 
 setTimeout(() => {
 setTurnitinStatusMessage("Mengekstrak teks bab & abstrak naskah proposal...");
 
 setTimeout(() => {
 setTurnitinStatusMessage("Membandingkan naskah dengan repositori Jurnal Kesehatan Pascasarjana...");
 
 setTimeout(() => {
 setTurnitinStatusMessage("Mencocokkan sidik jari kalimat dengan indeks iThenticate...");
 
 setTimeout(() => {
 const randomScore = Math.floor(Math.random() * (22 - 8 + 1)) + 8; // Score between 8% and 22%
 setSimilarityTurnitin(String(randomScore));
 setTurnitinReport({
 score: randomScore,
 checkedAt: new Date().toLocaleDateString("id-ID", {
 day: "numeric",
 month: "long",
 year: "numeric"
 }) + " " + new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) + " WIB",
 sources: [
 { source: "ejournal.fikes-ump.id/index.php/jkm", match: Math.floor(randomScore * 0.45), type: "Publikasi Jurnal Pasca" },
 { source: "Repository Universitas Diponegoro Semarang", match: Math.floor(randomScore * 0.3), type: "Tulisan Karya Student Study" },
 { source: "Internet Search & Garuda Kemendikbud", match: Math.floor(randomScore * 0.15), type: "Sumber Web Internet" }
 ]
 });
 setIsSyncingTurnitin(false);
 setTurnitinStatusMessage("");
 }, 900);
 }, 1000);
 }, 1000);
 }, 900);
 };

 const [uploadedReceipt, setUploadedReceipt] = useState<{ name: string; data: string } | null>(null);
 const [uploadedDoc, setUploadedDoc] = useState<{ name: string; data: string } | null>(null);
 const [previewFile, setPreviewFile] = useState<{ name: string; data: string } | null>(null);
 const [previewFileBlobUrl, setPreviewFileBlobUrl] = useState<string>("");

 // Helper helper to convert base64 to Object URL natively and asymptotically fast
 const base64ToBlobUrlLocal = async (dataUrl: string, mimeTypeFallback: string) => {
 try {
 if (!dataUrl) return "";
 if (!dataUrl.startsWith("data:")) return dataUrl; // fallback if already blobUrl or direct path

 // Leverage the browser's native C++ decoding thread by fetching the data URL as a Blob
 // This runs up to 100x faster than character-by-character Javascript loops!
 const response = await fetch(dataUrl);
 const blob = await response.blob();
 return URL.createObjectURL(blob);
 } catch (error) {
 console.error("Gagal mengubah base64 ke Object URL secara native, menggunakan fallback", error);
 // Lightweight sync fallback if fetch fails
 try {
 const parts = dataUrl.split(";base64,");
 if (parts.length < 2) return dataUrl;
 const mime = parts[0].split(":")[1] || mimeTypeFallback;
 const binary = atob(parts[1]);
 const array = new Uint8Array(binary.length);
 for (let i = 0; i < binary.length; i++) {
 array[i] = binary.charCodeAt(i);
 }
 const blob = new Blob([array], { type: mime });
 return URL.createObjectURL(blob);
 } catch (fallbackError) {
 console.error("Fallback base64 conversion failed:", fallbackError);
 return dataUrl;
 }
 }
 };

 useEffect(() => {
 let active = true;
 let createdUrl = "";

 const generateUrl = async () => {
 if (previewFile && (previewFile.data.startsWith("data:application/pdf") || previewFile.name.toLowerCase().endsWith(".pdf"))) {
 const url = await base64ToBlobUrlLocal(previewFile.data, "application/pdf");
 if (active) {
 createdUrl = url;
 setPreviewFileBlobUrl(url);
 }
 } else {
 if (active) {
 setPreviewFileBlobUrl("");
 }
 }
 };

 generateUrl();

 return () => {
 active = false;
 if (createdUrl && createdUrl.startsWith("blob:")) {
 URL.revokeObjectURL(createdUrl);
 }
 };
 }, [previewFile]);

 // Helper matching untuk mengambil pendaftaran siswa yang ada
 const myRegistrations = (state.pendaftaranTesis || []).filter(
 (p) => p.mahasiswaEmail === currentUser.email
 );

 const getLatestRegistrations = () => {
 return state.pendaftaranTesis || [];
 };

 // Helper formatting rupiah
 const formatRupiah = (val: number) => {
 return new Intl.NumberFormat("id-ID", {
 style: "currency",
 currency: "IDR",
 maximumFractionDigits: 0
 }).format(val);
 };

 // File loading helper to transform local files into Base64 format
 const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>, type: "receipt" | "doc") => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (type === "receipt") {
 const allowed = [".png", ".jpg", ".jpeg", ".pdf"];
 const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
 if (!allowed.includes(ext)) {
 showToast("Bukti pembayaran harus berupa gambar JPG/PNG atau dokumen PDF", "error");
 return;
 }
 } else {
 const allowed = [".pdf", ".doc", ".docx", ".zip", ".rar"];
 const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
 if (!allowed.includes(ext)) {
 showToast("Berkas persyaratan harus berupa file PDF, Word (.docx) atau Arsip ZIP/RAR", "error");
 return;
 }
 }

 const reader = new FileReader();
 reader.onload = (event) => {
 const base64 = event.target?.result as string;
 if (type === "receipt") {
 setUploadedReceipt({ name: file.name, data: base64 });
 } else {
 setUploadedDoc({ name: file.name, data: base64 });
 }
 };
 reader.readAsDataURL(file);
 };

 // Submit registration handler
 const handleRegisterSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (!draftTitle.trim()) {
 showToast("Format Isian Judul Tugas Akhir tidak boleh kosong", "warning");
 return;
 }

 const templates = PERSYARATAN_TEMPLATES[targetRegisterStage];
 const requiredCheckboxesCount = templates.length;
 const isCompleted = selectedCheckboxes.length === requiredCheckboxesCount;

 let costKey = "sidang";
 if (targetRegisterStage === "Seminar Proposal") costKey = "sempro";
 else if (targetRegisterStage === "Seminar Hasil") costKey = "semhas";

 const costApplied = getBiayaNominal(costKey);

 // Look up bimbingan record to see assigned supervisors and examiners
 const studentInfo = (state.mahasiswa || []).find((m) => m.email === currentUser.email);
 const studentBimbingan = studentInfo
 ? (state.bimbingan || []).find((b) => b.mahasiswaId === studentInfo.id)
 : null;

 const newPendaftaran: any = {
 id: `REG_${Date.now()}`,
 mahasiswaEmail: currentUser.email,
 namaMahasiswa: currentUser.nama,
 judul: draftTitle,
 linkProposal: driveLink,
 tanggal: new Date().toISOString().slice(0, 10),
 status: "Menunggu",
 jenisPendaftaran: targetRegisterStage,
 
 buktiPembayaran: uploadedReceipt?.data || "",
 buktiPembayaranNama: uploadedReceipt?.name || "",
 filePersyaratan: uploadedDoc?.data || "",
 filePersyaratanNama: uploadedDoc?.name || "",
 statusAdministrasi: isCompleted ? "Lengkap" : "Belum Lengkap",
 checklistSyarat: selectedCheckboxes,
 nominalBayar: costApplied,
 catatanAproval: "",

 // Auto-assign ACC requirements if supervisors exist
 accPembimbing1: studentBimbingan?.pembimbing1 ? "Menunggu" : "Tidak Ada",
 accPembimbing2: studentBimbingan?.pembimbing2 ? "Menunggu" : "Tidak Ada",
 accPenguji1: studentBimbingan?.penguji1 ? "Menunggu" : "Tidak Ada",
 accPenguji2: studentBimbingan?.penguji2 ? "Menunggu" : "Tidak Ada",

 // Admin clearance is default set to Belum Lengkap until Admin checks it
 statusTranskrip: "Belum Lengkap",
 statusKrs: "Belum Lengkap",

 // Public Health features
 peminatan: peminatan,
 noEtikKEPK: noEtikKEPK || "-",
 similarityTurnitin: similarityTurnitin ? Number(similarityTurnitin) : 0,
 };

 try {
 await mutate("pendaftaranTesis", "add", newPendaftaran, undefined, undefined, true);
 setIsFormOpen(false);
 // Reset form fields
 setDraftTitle("");
 setDriveLink("");
 setSelectedCheckboxes([]);
 setUploadedReceipt(null);
 setUploadedDoc(null);
 setCatatanMhs("");
 setPeminatan("Epidemiologi");
 setNoEtikKEPK("");
 setSimilarityTurnitin("");
 showToast(`Pendaftaran ${targetRegisterStage} sukses dikirim ke verifikator!`, "success");
 } catch (err) {
 showToast("Terjadi kendala saat mengirim form pendaftaran.", "error");
 }
 };

 // Save updated admin fees
 const handleSaveFees = async () => {
 try {
 // We will update the 3 fee structures in state.biayaUjian sequentially or in a simple mutate loop call
 const updatedList = [
 { id: "sempro", nama: "Seminar Proposal", nominal: Number(feeSempro) },
 { id: "semhas", nama: "Seminar Hasil", nominal: Number(feeSemhas) },
 { id: "sidang", nama: "Sidang Akhir Tugas Akhir", nominal: Number(feeSidang) }
 ];

 // Mutate can update these items. To keep it simple, since mutate is dynamic, 
 // we can update each key using update method or push entire list if the backend allows.
 // Better yet, we can do edit for each id dynamically
 for (const fee of updatedList) {
 const foundLocal = (state.biayaUjian || []).find((x) => x.id === fee.id);
 if (foundLocal) {
 await mutate("biayaUjian", "update", fee, "id", fee.id, true);
 } else {
 await mutate("biayaUjian", "add", fee, undefined, undefined, true);
 }
 }

 setIsUpdatingFees(false);
 showToast("Besaran Biaya Administrasi Ujian Tugas Akhir diperbarui!", "success");
 } catch (err) {
 showToast("Gagal menyimpan preferensi biaya baru.", "error");
 }
 };

 // Trigger download utilities for base64 files
 const downloadAttachedFile = (base64Data: string | undefined, originalName: string | undefined) => {
 if (!base64Data) {
 showToast("Tidak ada berkas yang dilampirkan atau format berkas corrupt.", "warning");
 return;
 }
 try {
 const link = document.createElement("a");
 link.href = base64Data;
 link.download = originalName || "download";
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 showToast(`Mengunduh berkas: ${originalName}`, "success");
 } catch (err) {
 showToast("Terjadi kegagalan mengunduh berkas lampiran.", "error");
 }
 };

 // Toggle checkbox helper
 const handleToggleCheckbox = (id: string) => {
 setSelectedCheckboxes(prev => 
 prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
 );
 };

 // Admin decision processes
 const handleAdminDecision = async (id: string, newStatus: "Disetujui" | "Ditolak") => {
 const defaultNote = newStatus === "Disetujui" 
 ? "Berkas lengkap dan pembayaran valid. Direkomendasikan untuk maju sidang uji kelayakan." 
 : prompt("Masukkan alasan penolakan berkas / kelengkapan:");

 if (newStatus === "Ditolak" && defaultNote === null) return; // user cancelled prompt

 try {
 await mutate("pendaftaranTesis", "update", {
 status: newStatus,
 catatanAproval: defaultNote || "Tidak ada catatan tambahan."
 }, "id", id, true);
 showToast(`Status pendaftaran berhasil dikonfirmasi sebagai: ${newStatus}`, "success");
 } catch (err) {
 showToast("Gagal mengkonfirmasi keputusan administrasi.", "error");
 }
 };

 // COMPUTE CUMULATIVE STATS (For Prodi/Admin infography progress)
 const statsTotalApp = (state.pendaftaranTesis || []).length;
 const statsSemproTotal = (state.pendaftaranTesis || []).filter(p => p.jenisPendaftaran === "Seminar Proposal").length;
 const statsSemproApproved = (state.pendaftaranTesis || []).filter(p => p.jenisPendaftaran === "Seminar Proposal" && p.status === "Disetujui").length;
 const statsSemproWaiting = (state.pendaftaranTesis || []).filter(p => p.jenisPendaftaran === "Seminar Proposal" && p.status === "Menunggu").length;

 const statsSemhasTotal = (state.pendaftaranTesis || []).filter(p => p.jenisPendaftaran === "Seminar Hasil").length;
 const statsSemhasApproved = (state.pendaftaranTesis || []).filter(p => p.jenisPendaftaran === "Seminar Hasil" && p.status === "Disetujui").length;
 const statsSemhasWaiting = (state.pendaftaranTesis || []).filter(p => p.jenisPendaftaran === "Seminar Hasil" && p.status === "Menunggu").length;

 const statsSidangTotal = (state.pendaftaranTesis || []).filter(p => p.jenisPendaftaran === "Sidang Tugas Akhir").length;
 const statsSidangApproved = (state.pendaftaranTesis || []).filter(p => p.jenisPendaftaran === "Sidang Tugas Akhir" && p.status === "Disetujui").length;
 const statsSidangWaiting = (state.pendaftaranTesis || []).filter(p => p.jenisPendaftaran === "Sidang Tugas Akhir" && p.status === "Menunggu").length;

 // Filter application dataset (using Search queries)
 const displayedApps = getLatestRegistrations().filter((app) => {
 // 1. Stage filter
 if (activeStageTab !== "all" && app.jenisPendaftaran !== activeStageTab) {
 return false;
 }
 // 2. Status filter
 if (statusFilter !== "all" && app.status !== statusFilter) {
 return false;
 }
 // 3. Search query filter
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 const matchName = app.namaMahasiswa.toLowerCase().includes(q);
 const matchEmail = app.mahasiswaEmail.toLowerCase().includes(q);
 const matchTitle = app.judul.toLowerCase().includes(q);
 if (!matchName && !matchEmail && !matchTitle) return false;
 }
 return true;
 }).reverse();

 // LECTURER (DOSEN) ACC PORTAL ENGINE
 if (currentUser.role === "Dosen") {
 // Find all pendaftaranTesis records where the student's bimbingan assigned this Dosen (as Pb1/Pb2/Penguji1/Penguji2)
 const myDosenApps = (state.pendaftaranTesis || []).filter((app) => {
 const studentBimbingan = (state.bimbingan || []).find((b) => {
 const mhs = (state.mahasiswa || []).find((m) => m.email === app.mahasiswaEmail);
 return mhs ? b.mahasiswaId === mhs.id : false;
 });
 if (!studentBimbingan) return false;

 const isPb1 = studentBimbingan.pembimbing1 === currentUser.email;
 const isPb2 = studentBimbingan.pembimbing2 === currentUser.email;
 const isPenguji1 = studentBimbingan.penguji1 === currentUser.email;
 const isPenguji2 = studentBimbingan.penguji2 === currentUser.email;

 return isPb1 || isPb2 || isPenguji1 || isPenguji2;
 }).reverse();

 // Stats for lecturers
 const pendingDosenAccCount = myDosenApps.filter((app) => {
 const studentBimbingan = (state.bimbingan || []).find((b) => {
 const mhs = (state.mahasiswa || []).find((m) => m.email === app.mahasiswaEmail);
 return mhs ? b.mahasiswaId === mhs.id : false;
 });
 if (!studentBimbingan) return false;

 const isPb1 = studentBimbingan.pembimbing1 === currentUser.email && app.accPembimbing1 === "Menunggu";
 const isPb2 = studentBimbingan.pembimbing2 === currentUser.email && app.accPembimbing2 === "Menunggu";
 const isPenguji1 = studentBimbingan.penguji1 === currentUser.email && app.accPenguji1 === "Menunggu";
 const isPenguji2 = studentBimbingan.penguji2 === currentUser.email && app.accPenguji2 === "Menunggu";

 return (isPb1 || isPb2 || isPenguji1 || isPenguji2) && app.status === "Menunggu";
 }).length;

 return (
 <div className="space-y-6 text-left">
 {/* Portal Header */}
 <div className="card shadow-sm border border-[var(--border-color)] p-6 rounded-xl bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-surface-hover)] to-[var(--bg-card)]">
 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
 <div>
 <span className="text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-2 py-1 rounded inline-block mb-2">
 Hak Otoritas & Tanda Tangan Digital
 </span>
 <h2 className="text-xl font-extrabold text-[var(--text-main)] flex items-center gap-2">
 ✍️ Portal ACC Seminar & Sidang Tugas Akhir Mahasiswa
 </h2>
 <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
 Berikan persetujuan kelayakan ujian mahasiswa bimbingan atau ujian Anda untuk melanjutkan ke verifikasi administrasi Program Studi.
 </p>
 </div>
 </div>
 </div>

 {/* Stats Blocks */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 <div className="card p-4 border border-[var(--border-color)] rounded-xl flex items-center gap-4">
 <span className="text-3xl">📥</span>
 <div>
 <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Menunggu ACC Anda</h4>
 <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingDosenAccCount} Mahasiswa</p>
 </div>
 </div>
 <div className="card p-4 border border-[var(--border-color)] rounded-xl flex items-center gap-4">
 <span className="text-3xl">👥</span>
 <div>
 <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Usulan Berkaitan</h4>
 <p className="text-2xl font-extrabold text-[var(--text-main)] mt-1">{myDosenApps.length} Pengajuan</p>
 </div>
 </div>
 <div className="card p-4 border border-[var(--border-color)] rounded-xl flex items-center gap-4">
 <span className="text-3xl">✓</span>
 <div>
 <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Sudah Anda Proses</h4>
 <p className="text-2xl font-extrabold text-emerald-600 mt-1">
 {myDosenApps.length - pendingDosenAccCount} Pengajuan
 </p>
 </div>
 </div>
 </div>

 {/* Table/List of student applications */}
 <div className="card shadow-sm border border-[var(--border-color)] rounded-xl">
 <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
 <h3 className="text-sm font-extrabold text-[var(--text-main)] flex items-center gap-2">
 📂 Daftar Pengajuan Ujian Mahasiswa
 </h3>
 </div>

 {myDosenApps.length === 0 ? (
 <div className="p-12 text-center text-xs text-[var(--text-muted)] font-bold">
 Tidak ada pengajuan aktif dari mahasiswa bimbingan atau pengujian Anda saat ini.
 </div>
 ) : (
 <div className="table-container">
 <table className="data-table text-left w-full">
 <thead>
 <tr>
 <th className="py-2.5 px-3">Mahasiswa</th>
 <th className="py-2.5 px-3">Tahap Ujian</th>
 <th className="py-2.5 px-3">Judul Tugas Akhir & Naskah</th>
 <th className="py-2.5 px-3">Status Admin</th>
 <th className="py-2.5 px-3">Status ACC Pembimbing & Penguji</th>
 <th className="py-2.5 px-3">Tindakan ACC Anda</th>
 </tr>
 </thead>
 <tbody>
 {myDosenApps.map((reg) => {
 const studentBimbingan = (state.bimbingan || []).find((b) => {
 const mhs = (state.mahasiswa || []).find((m) => m.email === reg.mahasiswaEmail);
 return mhs ? b.mahasiswaId === mhs.id : false;
 });

 // Determine lecturer's role(s) for this student
 const roles: string[] = [];
 const isPb1 = studentBimbingan?.pembimbing1 === currentUser.email;
 const isPb2 = studentBimbingan?.pembimbing2 === currentUser.email;
 const isPenguji1 = studentBimbingan?.penguji1 === currentUser.email;
 const isPenguji2 = studentBimbingan?.penguji2 === currentUser.email;

 if (isPb1) roles.push("Pembimbing 1");
 if (isPb2) roles.push("Pembimbing 2");
 if (isPenguji1) roles.push("Penguji 1");
 if (isPenguji2) roles.push("Penguji 2");

 // Check lecturer's current individual signature status
 let myCurrentAcc = "N/A";
 if (isPb1) myCurrentAcc = reg.accPembimbing1 || "Menunggu";
 else if (isPb2) myCurrentAcc = reg.accPembimbing2 || "Menunggu";
 else if (isPenguji1) myCurrentAcc = reg.accPenguji1 || "Menunggu";
 else if (isPenguji2) myCurrentAcc = reg.accPenguji2 || "Menunggu";

 return (
 <tr key={reg.id} className="hover:bg-[var(--bg-surface-hover)]">
 <td className="py-3 px-3">
 <div className="font-extrabold text-xs text-[var(--text-main)]">{reg.namaMahasiswa}</div>
 <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{reg.mahasiswaEmail}</div>
 <div className="mt-1 flex flex-wrap gap-1">
 {roles.map((r, i) => (
 <span key={i} className="text-[8.5px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-850/40 px-1 py-0.2 rounded">
 {r}
 </span>
 ))}
 </div>
 </td>
 <td className="py-3 px-3 font-bold text-xs text-[var(--text-main)]">
 {reg.jenisPendaftaran}
 <div className="text-[9px] text-[var(--text-muted)] font-semibold mt-0.5">Diajukan: {reg.tanggal}</div>
 </td>
 <td className="py-3 px-3 max-w-xs">
 <div className="text-xs font-semibold leading-relaxed text-[var(--text-main)] truncate" title={reg.judul}>{reg.judul}</div>
 {renderFIKPsiFields(reg.peminatan, reg.noEtikKEPK, reg.similarityTurnitin)}
 <div className="mt-1.5 flex flex-wrap gap-1.5">
 {reg.linkProposal && (
 <a
 href={reg.linkProposal}
 target="_blank"
 rel="noreferrer"
 className="bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100/50 dark:hover:bg-sky-900/10 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-900/40 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer no-underline"
 >
 🔗 Google Drive Draft
 </a>
 )}
 {reg.filePersyaratan && (
 <div className="flex gap-1.5">
 <button
 type="button"
 onClick={() => downloadAttachedFile(reg.filePersyaratan, reg.filePersyaratanNama)}
 className="bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/10 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-0.5"
 >
 📥 Berkas Gabungan
 </button>
 <button
 type="button"
 onClick={() => setPreviewFile({ data: reg.filePersyaratan!, name: reg.filePersyaratanNama || "Berkas_Persyaratan.pdf" })}
 className="bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100/50 text-amber-800 dark:text-amber-400 border border-amber-200 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-0.5"
 >
 👁 Pratinjau
 </button>
 </div>
 )}
 </div>
 </td>
 <td className="py-3 px-3">
 <div className="space-y-1">
 <div className="text-[10px] font-semibold">
 {reg.statusTranskrip === "Lengkap" ? (
 <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 px-1.5 py-0.5 rounded">✓ Transkrip Lengkap</span>
 ) : (
 <span className="text-rose-700 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 px-1.5 py-0.5 rounded">⚠ Transkrip Belum</span>
 )}
 </div>
 <div className="text-[10px] font-semibold">
 {reg.statusKrs === "Lengkap" ? (
 <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 px-1.5 py-0.5 rounded">✓ KRS Lengkap</span>
 ) : (
 <span className="text-rose-700 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 px-1.5 py-0.5 rounded">⚠ KRS Belum</span>
 )}
 </div>
 </div>
 </td>
 <td className="py-3 px-3">
 <div className="space-y-1 max-w-[150px]">
 {reg.accPembimbing1 !== "Tidak Ada" && (
 <div className="flex justify-between items-center text-[9px] font-semibold">
 <span className="text-slate-400">Pembimbing 1:</span>
 <span className={reg.accPembimbing1 === "Disetujui" ? "text-emerald-600 font-extrabold" : reg.accPembimbing1 === "Ditolak" ? "text-rose-600 font-extrabold" : "text-amber-600 font-extrabold"}>
 {reg.accPembimbing1 || "Menunggu"}
 </span>
 </div>
 )}
 {reg.accPembimbing2 !== "Tidak Ada" && (
 <div className="flex justify-between items-center text-[9px] font-semibold">
 <span className="text-slate-400">Pembimbing 2:</span>
 <span className={reg.accPembimbing2 === "Disetujui" ? "text-emerald-600 font-extrabold" : reg.accPembimbing2 === "Ditolak" ? "text-rose-600 font-extrabold" : "text-amber-600 font-extrabold"}>
 {reg.accPembimbing2 || "Menunggu"}
 </span>
 </div>
 )}
 {reg.accPenguji1 !== "Tidak Ada" && (
 <div className="flex justify-between items-center text-[9px] font-semibold">
 <span className="text-slate-400">Penguji 1:</span>
 <span className={reg.accPenguji1 === "Disetujui" ? "text-emerald-600 font-extrabold" : reg.accPenguji1 === "Ditolak" ? "text-rose-600 font-extrabold" : "text-amber-600 font-extrabold"}>
 {reg.accPenguji1 || "Menunggu"}
 </span>
 </div>
 )}
 {reg.accPenguji2 !== "Tidak Ada" && (
 <div className="flex justify-between items-center text-[9px] font-semibold">
 <span className="text-slate-400">Penguji 2:</span>
 <span className={reg.accPenguji2 === "Disetujui" ? "text-emerald-600 font-extrabold" : reg.accPenguji2 === "Ditolak" ? "text-rose-600 font-extrabold" : "text-amber-600 font-extrabold"}>
 {reg.accPenguji2 || "Menunggu"}
 </span>
 </div>
 )}
 </div>
 </td>
 <td className="py-3 px-3">
 {/* Interactive decisions for the logged lecturer */}
 <div className="flex flex-col gap-1 w-full min-w-[110px]">
 {myCurrentAcc === "Menunggu" ? (
 <>
 <button
 onClick={async () => {
 const updateObj: any = {};
 if (isPb1) updateObj.accPembimbing1 = "Disetujui";
 else if (isPb2) updateObj.accPembimbing2 = "Disetujui";
 else if (isPenguji1) updateObj.accPenguji1 = "Disetujui";
 else if (isPenguji2) updateObj.accPenguji2 = "Disetujui";

 // Auto-update student bimbingan validation status as beautiful UX synergy
 if (studentBimbingan) {
 if (reg.jenisPendaftaran === "Seminar Proposal" && isPb1) {
 await mutate("bimbingan", "update", { validasiProposal: "Disetujui" }, "id", studentBimbingan.id, true);
 } else if (reg.jenisPendaftaran === "Seminar Hasil" && isPb1) {
 await mutate("bimbingan", "update", { validasiSeminarHasil: "Disetujui" }, "id", studentBimbingan.id, true);
 }
 }

 await mutate("pendaftaranTesis", "update", updateObj, "id", reg.id, true);
 showToast("Berhasil memberikan ACC elektronik (Persetujuan)!", "success");
 }}
 className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1 px-2.5 rounded cursor-pointer leading-none text-center"
 >
 ✓ Setujui (ACC)
 </button>
 <button
 onClick={async () => {
 const updateObj: any = {};
 if (isPb1) updateObj.accPembimbing1 = "Ditolak";
 else if (isPb2) updateObj.accPembimbing2 = "Ditolak";
 else if (isPenguji1) updateObj.accPenguji1 = "Ditolak";
 else if (isPenguji2) updateObj.accPenguji2 = "Ditolak";

 await mutate("pendaftaranTesis", "update", updateObj, "id", reg.id, true);
 showToast("Berhasil menolak pengajuan ujian mahasiswa.", "warning");
 }}
 className="btn btn-secondary bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold py-1 px-2.5 rounded cursor-pointer leading-none text-center"
 >
 ✕ Tolak Pengajuan
 </button>
 </>
 ) : (
 <div className="flex flex-col items-center justify-center p-1.5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-center">
 <span className="text-[10px] text-[var(--text-muted)] font-bold block">Status Tindakan:</span>
 <span className={`text-[10.5px] font-extrabold mt-0.5 ${myCurrentAcc === "Disetujui" ? "text-emerald-700" : "text-rose-700"}`}>
 {myCurrentAcc === "Disetujui" ? "✓ APPROVED" : "✕ REJECTED"}
 </span>
 </div>
 )}
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
 }

 // STUDENT VIEW ENGINE
 if (currentUser.role === "Mahasiswa") {
 // Check if the student has got an approved title first before starting registration
 const hasApprovedTitle = (state.judul || []).some(
 (j) => j.mahasiswaEmail === currentUser.email && j.status === "Disetujui"
 );
 const activeStudentTitle = (state.judul || []).find(
 (j) => j.mahasiswaEmail === currentUser.email && j.status === "Disetujui"
 )?.judul || "Belum memiliki judul tugas akhir yang disahkan";

 return (
 <div className="space-y-6 text-left">
 {/* Portal Header */}
 <div className="card-header pb-4 border-b border-[var(--border-color)] flex flex-col md:flex-row justify-between md:items-center gap-4">
 <div>
 <h2 className="text-xl font-extrabold text-[var(--text-main)] flex items-center gap-2">
 📝 Pendaftaran & Verifikasi Ujian Tugas Akhir
 </h2>
 <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
 Portal pendaftaran resmi Seminar Proposal, Seminar Hasil, dan Sidang Akhir Tugas Akhir Anda
 </p>
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => {
 if (!hasApprovedTitle) {
 showToast("Anda tidak dapat mendaftar sebelum pengusulan judul disetujui Pembimbing/Prodi.", "warning");
 return;
 }
 setDraftTitle(activeStudentTitle);
 setTargetRegisterStage("Seminar Proposal");
 setSelectedCheckboxes([]);
 setIsFormOpen(true);
 }}
 className="btn bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-bold px-3 py-2 rounded flex items-center gap-1.5 cursor-pointer shadow-sm"
 >
 <Plus size={14} /> Daftar Ujian / Sidang
 </button>
 </div>
 </div>

 {/* TITLE BANNER CHECK */}
 {!hasApprovedTitle && (
 <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-[var(--radius-md)] flex items-start gap-3">
 <AlertCircle className="shrink-0 text-amber-600 mt-0.5" size={18} />
 <div className="text-xs font-semibold">
 <h4 className="font-extrabold text-amber-900 mb-0.5">Pengusulan Judul Belum Disetujui</h4>
 <p>Anda belum diizinkan mengajukan pendaftaran ujian Sempro, Semhas, atau Sidang sampai judul tugas akhir Anda resmi disetujui dan disahkan oleh Tim Pembimbing serta Pimpinan Program Studi di menu <b>Ajukan Judul</b>.</p>
 </div>
 </div>
 )}

 {/* INFOGRAPHIC STATUS BAR (Requirement Completion Wheels / Bento Matrix) */}
 <div>
 <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
 📊 Infografis Kesiapan Dokumen & Prasyarat Akademik Anda
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {/* 1. SEMINAR PROPOSAL CARD */}
 {(() => {
 const semproRecord = myRegistrations.find(r => r.jenisPendaftaran === "Seminar Proposal");
 const isApproved = semproRecord?.status === "Disetujui";
 const isPending = semproRecord?.status === "Menunggu";
 const isRejected = semproRecord?.status === "Ditolak";
 const percentFraction = semproRecord ? ((semproRecord.checklistSyarat || []).length / PERSYARATAN_TEMPLATES["Seminar Proposal"].length) * 100 : 0;

 return (
 <div className={`p-4 rounded-xl border transition-all ${
 isApproved ? "bg-emerald-50/50 border-emerald-200" : isPending ? "bg-amber-50/50 border-amber-200" : "bg-[var(--bg-surface-hover)] border-[var(--border-color)]"
 }`}>
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 rounded px-2 py-0.5">
 Tahap 1
 </span>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
 isApproved ? "bg-emerald-100 text-emerald-800" : isPending ? "bg-amber-100 text-amber-800" : isRejected ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800"
 }`}>
 {semproRecord ? semproRecord.status : "Belum Mendaftar"}
 </span>
 </div>
 <h4 className="text-sm font-bold text-[var(--text-main)] mb-1">Seminar Proposal (Sempro)</h4>
 <p className="text-[10px] text-[var(--text-muted)] font-semibold mb-3">Biaya administrasi: <b className="text-[var(--text-main)]">{formatRupiah(getBiayaNominal("sempro"))}</b></p>
 
 {/* Progress Line */}
 <div className="space-y-1 mb-4">
 <div className="flex justify-between text-[10px] text-slate-400 font-bold">
 <span>Kelengkapan Berkas</span>
 <span>{semproRecord ? `${(semproRecord.checklistSyarat || []).length}/${PERSYARATAN_TEMPLATES["Seminar Proposal"].length}` : "0/4"}</span>
 </div>
 <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
 <div className="bg-emerald-500 h-full transition-all" style={{ width: `${percentFraction}%` }}></div>
 </div>
 </div>

 {/* Criteria Checklist summary */}
 <div className="space-y-1.5 text-[10.5px] font-semibold text-[var(--text-muted)] mt-2">
 {PERSYARATAN_TEMPLATES["Seminar Proposal"].map((item) => {
 const isTicked = semproRecord ? (semproRecord.checklistSyarat || []).includes(item.id) : false;
 return (
 <div key={item.id} className="flex items-center gap-1.5">
 {isTicked ? (
 <CheckCircle size={12} className="text-emerald-600 shrink-0" />
 ) : (
 <Clock size={12} className="text-slate-300 shrink-0" />
 )}
 <span className={`${isTicked ? "text-[var(--text-main)]" : "text-slate-400"}`}>{item.label.substring(0, 38)}...</span>
 </div>
 );
 })}
 </div>
 {renderClearanceAndSignatures(semproRecord)}
 </div>
 );
 })()}

 {/* 2. SEMINAR HASIL CARD */}
 {(() => {
 const semhasRecord = myRegistrations.find(r => r.jenisPendaftaran === "Seminar Hasil");
 const isApproved = semhasRecord?.status === "Disetujui";
 const isPending = semhasRecord?.status === "Menunggu";
 const isRejected = semhasRecord?.status === "Ditolak";
 const percentFraction = semhasRecord ? ((semhasRecord.checklistSyarat || []).length / PERSYARATAN_TEMPLATES["Seminar Hasil"].length) * 100 : 0;

 return (
 <div className={`p-4 rounded-xl border transition-all ${
 isApproved ? "bg-emerald-50/50 border-emerald-200" : isPending ? "bg-amber-50/50 border-amber-200" : "bg-[var(--bg-surface-hover)] border-[var(--border-color)]"
 }`}>
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 rounded px-2 py-0.5">
 Tahap 2
 </span>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
 isApproved ? "bg-emerald-100 text-emerald-800" : isPending ? "bg-amber-100 text-amber-800" : isRejected ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800"
 }`}>
 {semhasRecord ? semhasRecord.status : "Belum Mendaftar"}
 </span>
 </div>
 <h4 className="text-sm font-bold text-[var(--text-main)] mb-1">Seminar Hasil (Semhas)</h4>
 <p className="text-[10px] text-[var(--text-muted)] font-semibold mb-3">Biaya administrasi: <b className="text-[var(--text-main)]">{formatRupiah(getBiayaNominal("semhas"))}</b></p>
 
 {/* Progress Line */}
 <div className="space-y-1 mb-4">
 <div className="flex justify-between text-[10px] text-slate-400 font-bold">
 <span>Kelengkapan Berkas</span>
 <span>{semhasRecord ? `${(semhasRecord.checklistSyarat || []).length}/${PERSYARATAN_TEMPLATES["Seminar Hasil"].length}` : "0/4"}</span>
 </div>
 <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
 <div className="bg-emerald-500 h-full transition-all" style={{ width: `${percentFraction}%` }}></div>
 </div>
 </div>

 {/* Criteria Checklist Summary */}
 <div className="space-y-1.5 text-[10.5px] font-semibold text-[var(--text-muted)] mt-2">
 {PERSYARATAN_TEMPLATES["Seminar Hasil"].map((item) => {
 const isTicked = semhasRecord ? (semhasRecord.checklistSyarat || []).includes(item.id) : false;
 return (
 <div key={item.id} className="flex items-center gap-1.5">
 {isTicked ? (
 <CheckCircle size={12} className="text-emerald-600 shrink-0" />
 ) : (
 <Clock size={12} className="text-slate-300 shrink-0" />
 )}
 <span className={`${isTicked ? "text-[var(--text-main)]" : "text-slate-400"}`}>{item.label.substring(0, 38)}...</span>
 </div>
 );
 })}
 </div>
 {renderClearanceAndSignatures(semhasRecord)}
 </div>
 );
 })()}

 {/* 3. SIDANG AKHIR TUGAS AKHIR CARD */}
 {(() => {
 const sidangRecord = myRegistrations.find(r => r.jenisPendaftaran === "Sidang Tugas Akhir");
 const isApproved = sidangRecord?.status === "Disetujui";
 const isPending = sidangRecord?.status === "Menunggu";
 const isRejected = sidangRecord?.status === "Ditolak";
 const percentFraction = sidangRecord ? ((sidangRecord.checklistSyarat || []).length / PERSYARATAN_TEMPLATES["Sidang Tugas Akhir"].length) * 100 : 0;

 return (
 <div className={`p-4 rounded-xl border transition-all ${
 isApproved ? "bg-emerald-50/50 border-emerald-200" : isPending ? "bg-amber-50/50 border-amber-200" : "bg-[var(--bg-surface-hover)] border-[var(--border-color)]"
 }`}>
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 rounded px-2 py-0.5">
 Tahap 3 (Akhir)
 </span>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
 isApproved ? "bg-emerald-100 text-emerald-800" : isPending ? "bg-amber-100 text-amber-800" : isRejected ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800"
 }`}>
 {sidangRecord ? sidangRecord.status : "Belum Mendaftar"}
 </span>
 </div>
 <h4 className="text-sm font-bold text-[var(--text-main)] mb-1">Sidang Akhir Tugas Akhir</h4>
 <p className="text-[10px] text-[var(--text-muted)] font-semibold mb-3">Biaya administrasi: <b className="text-[var(--text-main)]">{formatRupiah(getBiayaNominal("sidang"))}</b></p>
 
 {/* Progress Line */}
 <div className="space-y-1 mb-4">
 <div className="flex justify-between text-[10px] text-slate-400 font-bold">
 <span>Kelengkapan Berkas</span>
 <span>{sidangRecord ? `${(sidangRecord.checklistSyarat || []).length}/${PERSYARATAN_TEMPLATES["Sidang Tugas Akhir"].length}` : "0/5"}</span>
 </div>
 <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
 <div className="bg-emerald-500 h-full transition-all" style={{ width: `${percentFraction}%` }}></div>
 </div>
 </div>

 {/* Criteria Checklist Summary */}
 <div className="space-y-1.5 text-[10.5px] font-semibold text-[var(--text-muted)] mt-2">
 {PERSYARATAN_TEMPLATES["Sidang Tugas Akhir"].map((item) => {
 const isTicked = sidangRecord ? (sidangRecord.checklistSyarat || []).includes(item.id) : false;
 return (
 <div key={item.id} className="flex items-center gap-1.5">
 {isTicked ? (
 <CheckCircle size={12} className="text-emerald-600 shrink-0" />
 ) : (
 <Clock size={12} className="text-slate-300 shrink-0" />
 )}
 <span className={`${isTicked ? "text-[var(--text-main)]" : "text-slate-400"}`}>{item.label.substring(0, 38)}...</span>
 </div>
 );
 })}
 </div>
 {renderClearanceAndSignatures(sidangRecord)}
 </div>
 );
 })()}
 </div>
 </div>

 {/* LOG HISTORY TABLE OF APPLICATIONS */}
 <div className="card shadow-sm border border-[var(--border-color)]">
 <div className="p-4 border-b border-[var(--border-color)]">
 <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
 <ClipboardList size={16} className="text-[var(--brand-primary)]" />
 Riwayat Pendaftaran & Respon Akademik Anda
 </h3>
 </div>
 {myRegistrations.length === 0 ? (
 <div className="p-8 text-center text-xs font-semibold text-[var(--text-muted)]">
 Belum ada riwayat pendaftaran ujian/sidang tugas akhir yang diajukan. Anda dapat mengklik tombol "Daftar Ujian / Sidang" di kanan atas halaman untuk memulai pendaftaran.
 </div>
 ) : (
 <div className="table-container">
 <table className="data-table text-left">
 <thead>
 <tr>
 <th>Tahap Ujian</th>
 <th>Judul Tugas Akhir Diajukan</th>
 <th>Nominal Biaya</th>
 <th>Status Kelengkapan</th>
 <th>Status Verifikasi</th>
 <th>Lampiran File</th>
 <th>Tanggapan / Memo</th>
 </tr>
 </thead>
 <tbody>
 {myRegistrations.reverse().map((reg) => (
 <tr key={reg.id}>
 <td className="font-extrabold text-xs text-[var(--text-main)]">
 {reg.jenisPendaftaran}
 <div className="text-[10px] text-[var(--text-muted)] font-semibold mt-0.5">{reg.tanggal}</div>
 </td>
 <td className="text-xs max-w-xs font-semibold text-[var(--text-main)] leading-relaxed">
 <div className="font-semibold">{reg.judul}</div>
 {renderFIKPsiFields(reg.peminatan, reg.noEtikKEPK, reg.similarityTurnitin)}
 </td>
 <td className="text-xs font-bold text-[var(--text-main)]">
 {reg.nominalBayar ? formatRupiah(reg.nominalBayar) : "Gratis/Bebas"}
 </td>
 <td>
 <span className={`pill ${reg.statusAdministrasi === "Lengkap" ? "pill-success" : "pill-danger"}`}>
 {reg.statusAdministrasi}
 </span>
 </td>
 <td>
 <span className={`pill ${reg.status === "Disetujui" ? "pill-success" : reg.status === "Ditolak" ? "pill-danger" : "pill-warning"}`}>
 {reg.status}
 </span>
 </td>
 <td className="space-y-1.5 whitespace-nowrap">
 {reg.filePersyaratan && (
 <div className="flex gap-1 mb-1">
 <button
 type="button"
 onClick={() => downloadAttachedFile(reg.filePersyaratan, reg.filePersyaratanNama)}
 className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9.5px] font-bold px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-0.5 flex-1"
 title="Unduh Berkas Syarat"
 >
 <FileText size={10} /> Syarat Kelengkapan
 </button>
 <button
 type="button"
 onClick={() => setPreviewFile({ data: reg.filePersyaratan!, name: reg.filePersyaratanNama || "Berkas_Persyaratan.pdf" })}
 className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[9.5px] font-bold px-2 py-0.5 rounded cursor-pointer flex items-center justify-center shrink-0"
 title="Pratinjau Berkas"
 >
 <Eye size={10} />
 </button>
 </div>
 )}
 {reg.buktiPembayaran && (
 <div className="flex gap-1">
 <button
 type="button"
 onClick={() => downloadAttachedFile(reg.buktiPembayaran, reg.buktiPembayaranNama)}
 className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[9.5px] font-bold px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-0.5 flex-1"
 title="Unduh Bukti Pembayaran"
 >
 <FileDown size={10} /> Bukti Bayar
 </button>
 <button
 type="button"
 onClick={() => setPreviewFile({ data: reg.buktiPembayaran!, name: reg.buktiPembayaranNama || "Bukti_Pembayaran_Ujian" })}
 className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[9.5px] font-bold px-2 py-0.5 rounded cursor-pointer flex items-center justify-center shrink-0"
 title="Pratinjau Bukti Bayar"
 >
 <Eye size={10} />
 </button>
 </div>
 )}
 {reg.linkProposal && (
 <a 
 href={reg.linkProposal} 
 target="_blank" 
 rel="noreferrer"
 className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 w-full text-left"
 >
 <Eye size={10} /> Tautan Drive ↗
 </a>
 )}
 </td>
 <td className="text-xs text-[var(--text-muted)] font-semibold max-w-xs leading-relaxed italic">
 {reg.catatanAproval || "Menunggu tim verifikator menelaah berkas Anda..."}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* MODAL REGISTRATION ATTACHMENT FORM */}
 {isFormOpen && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
 <div className="bg-[var(--bg-surface)] w-full max-w-2xl rounded-[var(--radius-lg)] border border-[var(--border-color)] shadow-[var(--shadow-lg)] overflow-hidden animate-slide-entry">
 
 {/* Modal Header */}
 <div className="p-5 bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] flex justify-between items-center">
 <div>
 <h3 className="text-md font-bold tracking-tight text-[var(--text-main)]">
 Formulir Pendaftaran Sidang / Ujian Tugas Akhir
 </h3>
 <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-semibold">Tentukan tahapan ujian yang akan diikuti dan lengkapi berkas</p>
 </div>
 <button 
 onClick={() => setIsFormOpen(false)} 
 className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold cursor-pointer"
 >
 ×
 </button>
 </div>

 {/* Modal Content */}
 <form onSubmit={handleRegisterSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Select Stage */}
 <div>
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Tujuan Tahapan Ujian *</label>
 <select
 value={targetRegisterStage}
 onChange={(e) => {
 setTargetRegisterStage(e.target.value as any);
 setSelectedCheckboxes([]);
 }}
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2.5 font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 >
 <option value="Seminar Proposal">Seminar Proposal (Sempro)</option>
 <option value="Seminar Hasil">Seminar Hasil (Semhas)</option>
 <option value="Sidang Tugas Akhir">Sidang Akhir Tugas Akhir</option>
 </select>
 </div>
 
 {/* Title of Thesis */}
 <div>
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Judul Tugas Akhir yang Disahkan *</label>
 <input
 type="text"
 required
 value={draftTitle}
 onChange={(e) => setDraftTitle(e.target.value)}
 placeholder="Masukkan judul tugas akhir yang disetujui"
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2.5 font-semibold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--border-color)] pt-3">
 {/* Upload 1: Proof of payment PDF/JPG/PNG */}
 <div>
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
 Bukti Bayar (JPG / PNG / PDF) *
 </label>
 <p className="text-[10px] text-[var(--text-muted)] font-semibold mb-2">Biaya Administrasi: <span className="text-emerald-700 font-extrabold">{formatRupiah(getBiayaNominal(targetRegisterStage === "Seminar Proposal" ? "sempro" : targetRegisterStage === "Seminar Hasil" ? "semhas" : "sidang"))}</span></p>
 <div className="relative border-2 border-dashed border-[var(--border-color)] hover:border-[var(--brand-primary)] p-4 rounded text-center transition">
 <input 
 type="file" 
 required={!uploadedReceipt}
 onChange={(e) => handleFileLoad(e, "receipt")} 
 accept="image/*,application/pdf"
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 />
 {!uploadedReceipt ? (
 <div className="text-[10px] space-y-1">
 <Upload className="mx-auto text-[var(--brand-primary)]" size={20} />
 <p className="font-bold text-[var(--text-main)]">Pilih Bukti Pembayaran</p>
 </div>
 ) : (
 <div className="text-[10px] font-bold text-emerald-800 flex items-center justify-center gap-1 bg-emerald-50 p-1.5 rounded">
 <CheckSquare size={12} /> {uploadedReceipt.name}
 </div>
 )}
 </div>
 </div>

 {/* Upload 2: Docs Zip/Pdf */}
 <div>
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
 Dokumen Persyaratan Gabungan (PDF / ZIP) *
 </label>
 <p className="text-[10px] text-[var(--text-muted)] font-semibold mb-2">Satukan berkas prasyarat akademik dalam satu dokumen</p>
 <div className="relative border-2 border-dashed border-[var(--border-color)] hover:border-[var(--brand-primary)] p-4 rounded text-center transition">
 <input 
 type="file" 
 required={!uploadedDoc}
 onChange={(e) => handleFileLoad(e, "doc")} 
 accept=".pdf,.zip,.rar,.docx,.doc"
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 />
 {!uploadedDoc ? (
 <div className="text-[10px] space-y-1">
 <Upload className="mx-auto text-[var(--brand-primary)]" size={20} />
 <p className="font-bold text-[var(--text-main)]">Pilih File Persyaratan</p>
 </div>
 ) : (
 <div className="text-[10px] font-bold text-emerald-800 flex items-center justify-center gap-1 bg-emerald-50 p-1.5 rounded">
 <CheckSquare size={12} /> {uploadedDoc.name}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Supporting Link Google Drive */}
 <div>
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Tautan Tambahan Google Drive Draf Naskah (URL Opsional)</label>
 <input
 type="url"
 value={driveLink}
 onChange={(e) => setDriveLink(e.target.value)}
 placeholder="https://drive.google.com/drive/folders/..."
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2.5 font-semibold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 />
 </div>

 {/* Public Health & Research Academic Framework */}
 <div className="bg-[var(--brand-light)] p-4 rounded-xl border border-[var(--brand-primary)]/10 space-y-3.5">
 <div className="flex items-center gap-2 pb-2 border-b border-[var(--brand-primary)]/10">
 <span className="p-1 rounded bg-[var(--brand-primary)] text-white">
 <Settings size={14} />
 </span>
 <div>
 <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--brand-primary)]">
 Rangka Riset & Standar Integrasi Universitas Kelompok Atas (FIKPsi)
 </h4>
 <p className="text-[9px] text-[var(--text-muted)] font-bold">Standardisasi data Johns Hopkins Bloomberg & Harvard T.H. Chan</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
 {/* Peminatan dropdown */}
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-muted)] mb-1">
 Peminatan Bidang Riset *
 </label>
 <select
 value={peminatan}
 onChange={(e) => setPeminatan(e.target.value)}
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2 font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 >
 <option value="Kesehatan Lingkungan">Kesehatan Lingkungan</option>
 <option value="Promosi Kesehatan">Promosi Kesehatan</option>
 <option value="Epidemiologi Kesehatan">Epidemiologi Kesehatan</option>
 <option value="Gizi Kesehatan Masyarakat">Gizi Kesehatan Masyarakat</option>
 <option value="Keselamatan dan Kesehatan Kerja">Keselamatan dan Kesehatan Kerja</option>
 <option value="Kesehatan Reproduksi">Kesehatan Reproduksi</option>
 <option value="Kebijakan dan Manajemen Kesehatan">Kebijakan dan Manajemen Kesehatan</option>
 </select>
 </div>

 {/* Ethics Clearance protocol KEPK */}
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-muted)] mb-1">
 No. Protokol KEPK (Etik)
 </label>
 <input
 type="text"
 value={noEtikKEPK}
 onChange={(e) => setNoEtikKEPK(e.target.value)}
 placeholder="No. Surat KEPK / Lolos Etik"
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2 font-semibold text-[var(--text-main)] focus:outline-none"
 />
 </div>

 {/* Turnitin Similarity Index */}
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-muted)] mb-1">
 Similarity Turnitin (%)
 </label>
 <div className="flex gap-2">
 <input
 type="number"
 min="0"
 max="100"
 value={similarityTurnitin}
 onChange={(e) => setSimilarityTurnitin(e.target.value)}
 placeholder="E.g., 15"
 className="text-xs w-[80px] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2 font-semibold text-[var(--text-main)] focus:outline-none"
 />
 <button
 type="button"
 disabled={isSyncingTurnitin}
 onClick={handleSimulateTurnitin}
 className="flex-1 py-1 px-2.5 text-[10px] font-extrabold rounded flex items-center justify-center gap-1.5 cursor-pointer bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm transition-all"
 >
 <TrendingUp size={12} className={isSyncingTurnitin ? "animate-spin" : ""} />
 {isSyncingTurnitin ? "Memindai..." : "Cek Similarity Otomatis"}
 </button>
 </div>

 {/* Turnitin Progress Loading Animation */}
 {isSyncingTurnitin && (
 <div className="mt-2 text-[10px] font-bold text-amber-500 space-y-1 bg-amber-500/5 p-2 rounded-md border border-amber-500/10">
 <div className="flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
 <span className="uppercase tracking-wide text-[9px]">Menghubungkan Turnitin API...</span>
 </div>
 <div className="font-semibold text-slate-300 pl-3 leading-tight text-[9px]">{turnitinStatusMessage}</div>
 </div>
 )}

 {/* Turnitin Quality Report Box */}
 {turnitinReport && !isSyncingTurnitin && (
 <div className="mt-2 p-2 rounded border border-emerald-500/30 bg-emerald-500/5 text-[10px] text-slate-300 space-y-1.5">
 <div className="flex items-center justify-between border-b border-emerald-500/10 pb-1">
 <span className="font-extrabold text-emerald-400 uppercase tracking-wider text-[9px]">
 ✓ Lolos Turnitin (Clean)
 </span>
 <span className="text-[8px] text-slate-400 font-bold">{turnitinReport.checkedAt}</span>
 </div>

 <div className="grid grid-cols-2 gap-1.5 text-center bg-slate-900/35 p-1 rounded">
 <div>
 <div className="text-[8px] text-slate-400 font-bold uppercase">Skor</div>
 <div className="text-xs font-black text-emerald-400">{turnitinReport.score}% Match</div>
 </div>
 <div>
 <div className="text-[8px] text-slate-400 font-bold uppercase">Status</div>
 <span className="text-[8px] inline-block font-black text-emerald-400">
 AMAN (&lt; 25%)
 </span>
 </div>
 </div>

 <div className="space-y-0.5">
 {turnitinReport.sources.map((s, idx) => (
 <div key={idx} className="flex justify-between items-center text-[8px] text-slate-400">
 <span className="truncate max-w-[130px] font-medium">{s.source}</span>
 <span className="font-bold text-rose-300">{s.match}%</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Checklist Syarat - Referensinya */}
 <div className="bg-[var(--bg-surface-hover)] p-4 rounded border border-[var(--border-color)]">
 <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-main)] mb-2 flex items-center gap-1.5">
 <ClipboardList size={13} className="text-[var(--brand-primary)]" />
 Kuesioner Checklist Referensi Mandiri Bilangan Syarat:
 </h4>
 <p className="text-[10px] text-[var(--text-muted)] mb-3 font-semibold">Tandai kriteria kelayakan berkas akademik yang sudah Anda satukan ke dalam file usulan lampiran di atas:</p>
 
 <div className="space-y-2.5 text-[11px] font-semibold text-[var(--text-main)]">
 {PERSYARATAN_TEMPLATES[targetRegisterStage].map((item) => {
 const isChecked = selectedCheckboxes.includes(item.id);
 return (
 <label key={item.id} className="flex items-start gap-2.5 cursor-pointer selection:bg-transparent">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={() => handleToggleCheckbox(item.id)}
 className="mt-0.5 rounded border-slate-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] h-4.5 w-4.5"
 />
 <span className={isChecked ? "text-[var(--text-main)]" : "text-slate-400"}>
 {item.label}
 </span>
 </label>
 );
 })}
 </div>
 </div>

 {/* Modal Footer */}
 <div className="pt-3 border-t border-[var(--border-color)] flex justify-end gap-2 text-xs">
 <button
 type="button"
 onClick={() => setIsFormOpen(false)}
 className="btn btn-secondary cursor-pointer"
 >
 Batal
 </button>
 <button
 type="submit"
 className="btn btn-primary bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-5 py-2 font-bold rounded cursor-pointer"
 >
 Submit Dokumen Pendaftaran
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
 }

 // ADMIN / SUPERADMIN / PRODI VIEW ENGINE
 return (
 <div className="space-y-6 text-left">
 {/* Header Area */}
 <div className="card-header pb-4 border-b border-[var(--border-color)] flex flex-col md:flex-row justify-between md:items-center gap-4">
 <div>
 <h2 className="text-xl font-extrabold text-[var(--text-main)] flex items-center gap-2">
 📋 Pusat Pendaftaran & Progress Kelayakan Tugas Akhir
 </h2>
 <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
 Monitoring kelulusan prasyarat berkas pendaftaran Sempro, Semhas, serta Sidang Pleno Tugas Akhir Mahasiswa
 </p>
 </div>
 </div>

 {/* Sub menu controls for administrator page */}
 <div className="flex gap-1.5 border-b border-[var(--border-color)] pb-1">
 <button
 onClick={() => setActiveAdminTab("overview")}
 className={`px-3 py-1.5 text-xs font-bold tracking-tight rounded transition ${
 activeAdminTab === "overview" 
 ? "bg-[var(--brand-primary)] text-white" 
 : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-slate-100"
 }`}
 >
 📊 Ringkasan Progress & Matriks
 </button>
 <button
 onClick={() => setActiveAdminTab("applications")}
 className={`px-3 py-1.5 text-xs font-bold tracking-tight rounded transition ${
 activeAdminTab === "applications" 
 ? "bg-[var(--brand-primary)] text-white" 
 : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-slate-100"
 }`}
 >
 📥 Berkas Menunggu Verifikasi ({getLatestRegistrations().filter(p => p.status === "Menunggu").length})
 </button>
 <button
 onClick={() => setActiveAdminTab("fees")}
 className={`px-3 py-1.5 text-xs font-bold tracking-tight rounded transition ${
 activeAdminTab === "fees" 
 ? "bg-[var(--brand-primary)] text-white" 
 : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-slate-100"
 }`}
 >
 ⚙️ Atur Biaya Administrasi
 </button>
 </div>

 {/* VIEW: OVERVIEW MATH INFOGRAPH (CUMULATIVE STATS PROGRESS) */}
 {activeAdminTab === "overview" && (
 <div className="space-y-6">
 {/* Progress Infographics bento box */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
 <div className="p-4 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-xl">
 <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-extrabold block mb-1">
 Total Pendaftar Terarsip
 </span>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-extrabold text-[var(--text-main)]">{statsTotalApp}</span>
 <span className="text-xs text-sky-700 font-bold bg-sky-50 px-1 rounded">Mahasiswa</span>
 </div>
 <p className="text-[10.5px] text-[var(--text-muted)] mt-2 font-medium">Akumulasi seluruh gelombang dan pendaftaran usulan</p>
 </div>

 {/* Stage 1 Sempro */}
 <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-xl">
 <span className="text-[10px] text-sky-700 uppercase tracking-wider font-extrabold block mb-1">
 Seminar Proposal (Sempro)
 </span>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-extrabold text-sky-900">{statsSemproApproved} <span className="text-xs text-slate-400 font-normal">Lulus</span></span>
 {statsSemproWaiting > 0 && (
 <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
 <Clock size={9} /> {statsSemproWaiting} Baru
 </span>
 )}
 </div>
 <p className="text-[10.5px] text-sky-800 mt-2 font-semibold">Total Pendaftar tahapan ini: <b>{statsSemproTotal}</b> mahasiswa</p>
 </div>

 {/* Stage 2 Semhas */}
 <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-xl">
 <span className="text-[10px] text-purple-700 uppercase tracking-wider font-extrabold block mb-1">
 Seminar Hasil (Semhas)
 </span>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-extrabold text-purple-900">{statsSemhasApproved} <span className="text-xs text-slate-400 font-normal">Lulus</span></span>
 {statsSemhasWaiting > 0 && (
 <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
 <Clock size={9} /> {statsSemhasWaiting} Baru
 </span>
 )}
 </div>
 <p className="text-[10.5px] text-purple-800 mt-2 font-semibold">Total Pendaftar tahapan ini: <b>{statsSemhasTotal}</b> mahasiswa</p>
 </div>

 {/* Stage 3 Sidang Tugas Akhir */}
 <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl">
 <span className="text-[10px] text-amber-700 uppercase tracking-wider font-extrabold block mb-1">
 Sidang Akhir Tugas Akhir
 </span>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-extrabold text-amber-900">{statsSidangApproved} <span className="text-xs text-slate-400 font-normal">Lulus</span></span>
 {statsSidangWaiting > 0 && (
 <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
 <Clock size={9} /> {statsSidangWaiting} Baru
 </span>
 )}
 </div>
 <p className="text-[10.5px] text-amber-800 mt-2 font-semibold">Total Pendaftar tahapan ini: <b>{statsSidangTotal}</b> mahasiswa</p>
 </div>
 </div>

 {/* Table list of students progress */}
 <div className="card border border-[var(--border-color)]">
 <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
 <div>
 <h3 className="text-sm font-bold text-[var(--text-main)]">
 Progresif Belajar Layanan Tugas Akhir Mahasiswa Aktif
 </h3>
 <p className="text-xs text-[var(--text-muted)] font-medium">Log pelacakan ujian dan kelayakan berkas administratif</p>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => setActiveAdminTab("applications")}
 className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 cursor-pointer"
 >
 Buka Menu Verifikasi Berkas <ChevronRight size={12} />
 </button>
 </div>
 </div>

 {getLatestRegistrations().length === 0 ? (
 <div className="p-10 text-center text-xs font-semibold text-[var(--text-muted)]">
 Belum ada berkas pendaftaran terunggah atau log pendaftar yang masuk ke sistem.
 </div>
 ) : (
 <div className="table-container">
 <table className="data-table text-left">
 <thead>
 <tr>
 <th>Nama Mahasiswa</th>
 <th>Usulan Judul Tugas Akhir</th>
 <th>Seminar Proposal</th>
 <th>Seminar Hasil</th>
 <th>Sidang Akhir</th>
 </tr>
 </thead>
 <tbody>
 {/* Unique students in list */}
 {Array.from(new Set(getLatestRegistrations().map(p => p.mahasiswaEmail))).map((mEmail) => {
 const studentRecord = state.mahasiswa.find(m => m.email === mEmail);
 const studentName = studentRecord?.nama || getLatestRegistrations().find(p => p.mahasiswaEmail === mEmail)?.namaMahasiswa || mEmail;
 const sNim = studentRecord?.nim || "Tugas Akhir-Active";
 const sTitle = studentRecord?.judul || getLatestRegistrations().find(p => p.mahasiswaEmail === mEmail)?.judul || "-";

 const mRegs = getLatestRegistrations().filter(x => x.mahasiswaEmail === mEmail);
 
 const sempro = mRegs.find(x => x.jenisPendaftaran === "Seminar Proposal");
 const semhas = mRegs.find(x => x.jenisPendaftaran === "Seminar Hasil");
 const sidang = mRegs.find(x => x.jenisPendaftaran === "Sidang Tugas Akhir");

 const renderStagePill = (reg: PendaftaranTesis | undefined) => {
 if (!reg) return <span className="text-[10px] text-slate-300 font-bold">— Belum Terdaftar</span>;
 const isApp = reg.status === "Disetujui";
 const isPend = reg.status === "Menunggu";
 const isRej = reg.status === "Ditolak";

 return (
 <div className="space-y-1">
 <span className={`inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
 isApp ? "bg-emerald-100 text-emerald-800" : isPend ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
 }`}>
 {reg.status}
 </span>
 <div className="text-[9px] text-slate-400 font-semibold flex flex-col">
 <span>Tanggal: {reg.tanggal}</span>
 <span className="font-bold">Syarat: {reg.statusAdministrasi} ({(reg.checklistSyarat || []).length} Lampiran)</span>
 </div>
 </div>
 );
 };

 return (
 <tr key={mEmail}>
 <td>
 <b className="text-xs text-[var(--text-main)]">{studentName}</b>
 <div className="text-[10px] text-[var(--text-muted)] font-semibold">NIM: {sNim}</div>
 </td>
 <td className="text-xs max-w-xs font-semibold leading-relaxed text-slate-450 truncate" title={sTitle}>
 {sTitle}
 </td>
 <td>{renderStagePill(sempro)}</td>
 <td>{renderStagePill(semhas)}</td>
 <td>{renderStagePill(sidang)}</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 )}

 {/* VIEW: MAIN VERIFICATION TAB FOR APPLICATIONS */}
 {activeAdminTab === "applications" && (
 <div className="space-y-5">
 {/* Filtering panels */}
 <div className="p-3 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-lg flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
 <div className="flex gap-2">
 <button
 onClick={() => setActiveStageTab("all")}
 className={`px-2.5 py-1 text-xs font-extrabold rounded ${activeStageTab === "all" ? "bg-[var(--brand-primary)] text-white" : "border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
 >
 Semua Tahap
 </button>
 <button
 onClick={() => setActiveStageTab("Seminar Proposal")}
 className={`px-2.5 py-1 text-xs font-extrabold rounded ${activeStageTab === "Seminar Proposal" ? "bg-[var(--brand-primary)] text-white" : "border border-[var(--border-color)] text-[var(--text-muted)] md:bg-[var(--bg-surface)] hover:text-[var(--text-main)]"}`}
 >
 Sempro
 </button>
 <button
 onClick={() => setActiveStageTab("Seminar Hasil")}
 className={`px-2.5 py-1 text-xs font-extrabold rounded ${activeStageTab === "Seminar Hasil" ? "bg-[var(--brand-primary)] text-white" : "border border-[var(--border-color)] text-[var(--text-muted)] md:bg-[var(--bg-surface)] hover:text-[var(--text-main)]"}`}
 >
 Semhas
 </button>
 <button
 onClick={() => setActiveStageTab("Sidang Tugas Akhir")}
 className={`px-2.5 py-1 text-xs font-extrabold rounded ${activeStageTab === "Sidang Tugas Akhir" ? "bg-[var(--brand-primary)] text-white" : "border border-[var(--border-color)] text-[var(--text-muted)] md:bg-[var(--bg-surface)] hover:text-[var(--text-main)]"}`}
 >
 Sidang Tugas Akhir
 </button>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 {/* Search filter input */}
 <div className="relative flex-1 md:w-48 text-xs font-semibold">
 <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
 <input
 type="text"
 placeholder="Cari mahasiswa, NIM..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-7 pr-2.5 py-1.5 w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded font-semibold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 />
 </div>

 {/* Status Selector dropdown */}
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-1.5 font-bold text-[var(--text-main)] focus:outline-none"
 >
 <option value="all">Semua Status</option>
 <option value="Menunggu">Menunggu Verifikasi</option>
 <option value="Disetujui">Lulus Lolos Berkas</option>
 <option value="Ditolak">Draf Ditolak / Revisi</option>
 </select>
 </div>
 </div>

 {/* Master list application panel */}
 <div className="card shadow-sm border border-[var(--border-color)]">
 <div className="p-4 border-b border-[var(--border-color)]">
 <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
 Daftar Pendaftar Kelayakan Berkas Siswa Aktif ({displayedApps.length} Berkas)
 </h3>
 </div>
 {displayedApps.length === 0 ? (
 <div className="p-10 text-center text-xs font-semibold text-[var(--text-muted)]">
 Tidak ada data pendaftaran berkas yang memenuhi filter atau kueri Anda.
 </div>
 ) : (
 <div className="table-container">
 <table className="data-table text-left">
 <thead>
 <tr>
 <th>Mahasiswa & NIM</th>
 <th>Jenis Ujian</th>
 <th>Usulan Judul & Draft</th>
 <th>Status Berkas</th>
 <th>Aksi Download File</th>
 <th>Tindakan Konfirmasi</th>
 </tr>
 </thead>
 <tbody>
 {displayedApps.map((app) => {
 const studentRecord = state.mahasiswa.find((m) => m.email === app.mahasiswaEmail);
 const mNim = studentRecord?.nim || "Akademik-Active";

 return (
 <tr key={app.id}>
 <td>
 <b className="text-xs text-[var(--text-main)]">{app.namaMahasiswa}</b>
 <div className="text-[10px] text-[var(--text-muted)] font-semibold">Email: {app.mahasiswaEmail}</div>
 <div className="text-[10px] text-slate-400 font-extrabold">NIM: {mNim}</div>
 </td>
 <td className="font-extrabold text-xs text-[var(--text-main)]">
 {app.jenisPendaftaran}
 <div className="text-[9px] text-[var(--text-muted)] font-semibold mt-0.5">Diajukan: {app.tanggal}</div>
 {app.nominalBayar && (
 <div className="text-[10px] text-emerald-800 font-extrabold mt-0.5">{formatRupiah(app.nominalBayar)}</div>
 )}
 </td>
 <td className="max-w-[280px]">
 <div className="text-[11px] font-extrabold text-[var(--text-main)] leading-relaxed">{app.judul}</div>
 {renderFIKPsiFields(app.peminatan, app.noEtikKEPK, app.similarityTurnitin)}
 
 {/* Checklist Info */}
 <div className="mt-2 bg-slate-50 dark:bg-slate-900/10 p-2 rounded border border-slate-200 dark:border-slate-800">
 <span className="text-[9px] font-extrabold text-slate-450 block uppercase tracking-wider mb-1">Pernyataan Checklist Prasyarat:</span>
 <div className="flex flex-wrap gap-1">
 <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded ${app.statusAdministrasi === "Lengkap" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-red-50 text-red-800 border-red-300"}`}>
 {app.statusAdministrasi === "Lengkap" ? "✓ Kuesioner Lengkap" : "⚠ Kuesioner Belum Lengkap"} ({(app.checklistSyarat || []).length} Terpenuhi)
 </span>
 </div>
 </div>

 {/* Dosen ACC Status (Signatures verified) */}
 <div className="mt-2 bg-slate-50 dark:bg-slate-900/40 p-2 rounded border border-slate-200 dark:border-slate-800/60 text-[9.5px]">
 <span className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider mb-1">Status ACC Dosen (Sistem):</span>
 <div className="grid grid-cols-2 gap-1 font-semibold text-slate-600 dark:text-slate-300">
 {app.accPembimbing1 !== "Tidak Ada" && (
 <div className="flex justify-between gap-1 items-center bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-slate-100 dark:border-slate-800">
 <span>P1:</span>
 <span className={app.accPembimbing1 === "Disetujui" ? "text-emerald-600 font-extrabold" : app.accPembimbing1 === "Ditolak" ? "text-rose-600 font-extrabold" : "text-amber-500 font-extrabold"}>
 {app.accPembimbing1 || "Menunggu"}
 </span>
 </div>
 )}
 {app.accPembimbing2 !== "Tidak Ada" && (
 <div className="flex justify-between gap-1 items-center bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-slate-100 dark:border-slate-800">
 <span>P2:</span>
 <span className={app.accPembimbing2 === "Disetujui" ? "text-emerald-600 font-extrabold" : app.accPembimbing2 === "Ditolak" ? "text-rose-600 font-extrabold" : "text-amber-500 font-extrabold"}>
 {app.accPembimbing2 || "Menunggu"}
 </span>
 </div>
 )}
 {app.accPenguji1 !== "Tidak Ada" && (
 <div className="flex justify-between gap-1 items-center bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-slate-100 dark:border-slate-800">
 <span>Pj1:</span>
 <span className={app.accPenguji1 === "Disetujui" ? "text-emerald-600 font-extrabold" : app.accPenguji1 === "Ditolak" ? "text-rose-600 font-extrabold" : "text-amber-500 font-extrabold"}>
 {app.accPenguji1 || "Menunggu"}
 </span>
 </div>
 )}
 {app.accPenguji2 !== "Tidak Ada" && (
 <div className="flex justify-between gap-1 items-center bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-slate-100 dark:border-slate-800">
 <span>Pj2:</span>
 <span className={app.accPenguji2 === "Disetujui" ? "text-emerald-600 font-extrabold" : app.accPenguji2 === "Ditolak" ? "text-rose-600 font-extrabold" : "text-amber-500 font-extrabold"}>
 {app.accPenguji2 || "Menunggu"}
 </span>
 </div>
 )}
 </div>
 </div>
 </td>
 <td>
 <div className="space-y-1.5">
 <div>
 <span className={`pill ${app.status === "Disetujui" ? "pill-success" : app.status === "Ditolak" ? "pill-danger" : "pill-warning"}`}>
 {app.status}
 </span>
 </div>

 {app.catatanAproval && (
 <p className="text-[10px] text-[var(--text-muted)] font-semibold italic max-w-[150px] truncate" title={app.catatanAproval}>
 &ldquo;{app.catatanAproval}&rdquo;
 </p>
 )}

 {/* Clearance controls for Admin/Superadmin/Prodi */}
 <div className="p-2 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded space-y-1.5">
 <span className="text-[8.5px] font-extrabold text-[var(--text-muted)] block uppercase tracking-wider">
 Clearance Berkas:
 </span>
 
 <div className="flex gap-2 items-center text-[10px] justify-between">
 <span className="font-bold text-[var(--text-muted)]">Transkrip:</span>
 <button
 onClick={async () => {
 const nextVal = app.statusTranskrip === "Lengkap" ? "Belum Lengkap" : "Lengkap";
 await mutate("pendaftaranTesis", "update", { statusTranskrip: nextVal }, "id", app.id, true);
 showToast(`Status Transkrip mahasiswa diubah menjadi: ${nextVal}`, "success");
 }}
 className={`px-1.5 py-0.2 rounded text-[8.5px] font-extrabold cursor-pointer border ${
 app.statusTranskrip === "Lengkap" 
 ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200" 
 : "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-200"
 }`}
 >
 {app.statusTranskrip === "Lengkap" ? "Lengkap" : "Pending"}
 </button>
 </div>

 <div className="flex gap-2 items-center text-[10px] justify-between">
 <span className="font-bold text-[var(--text-muted)]">KRS:</span>
 <button
 onClick={async () => {
 const nextVal = app.statusKrs === "Lengkap" ? "Belum Lengkap" : "Lengkap";
 await mutate("pendaftaranTesis", "update", { statusKrs: nextVal }, "id", app.id, true);
 showToast(`Status KRS mahasiswa diubah menjadi: ${nextVal}`, "success");
 }}
 className={`px-1.5 py-0.2 rounded text-[8.5px] font-extrabold cursor-pointer border ${
 app.statusKrs === "Lengkap" 
 ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200" 
 : "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-200"
 }`}
 >
 {app.statusKrs === "Lengkap" ? "Lengkap" : "Pending"}
 </button>
 </div>
 </div>
 </div>
 </td>
 <td className="space-y-1.5 whitespace-nowrap">
 {app.filePersyaratan && (
 <div className="flex gap-1 mb-1">
 <button
 type="button"
 onClick={() => downloadAttachedFile(app.filePersyaratan, app.filePersyaratanNama)}
 className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9.5px] font-bold px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-0.5 flex-1"
 title="Unduh Berkas Syarat"
 >
 <Download size={10} /> Syarat Akademik
 </button>
 <button
 type="button"
 onClick={() => setPreviewFile({ data: app.filePersyaratan!, name: app.filePersyaratanNama || "Berkas_Persyaratan.pdf" })}
 className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[9.5px] font-bold px-2 py-0.5 rounded cursor-pointer flex items-center justify-center shrink-0"
 title="Pratinjau Berkas"
 >
 <Eye size={10} />
 </button>
 </div>
 )}
 {app.buktiPembayaran && (
 <div className="flex gap-1">
 <button
 type="button"
 onClick={() => downloadAttachedFile(app.buktiPembayaran, app.buktiPembayaranNama)}
 className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[9.5px] font-bold px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-0.5 flex-1"
 title="Unduh Bukti Pembayaran"
 >
 <Download size={10} /> Bukti Pembayaran
 </button>
 <button
 type="button"
 onClick={() => setPreviewFile({ data: app.buktiPembayaran!, name: app.buktiPembayaranNama || "Bukti_Pembayaran_Ujian" })}
 className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[9.5px] font-bold px-2 py-0.5 rounded cursor-pointer flex items-center justify-center shrink-0"
 title="Pratinjau Bukti Pembayaran"
 >
 <Eye size={10} />
 </button>
 </div>
 )}
 {app.linkProposal && (
 <a
 href={app.linkProposal}
 target="_blank"
 rel="noreferrer"
 className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-bold px-2 py-1 rounded inline-flex items-center gap-1 w-full text-left"
 >
 <Eye size={10} /> Link Drive ↗
 </a>
 )}
 </td>
 <td>
 {app.status === "Menunggu" ? (
 <div className="flex flex-col gap-1.5">
 <button
 onClick={() => handleAdminDecision(app.id, "Disetujui")}
 className="bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] py-1 font-bold tracking-tight cursor-pointer px-2"
 >
 ✓ Sahkan & Terima
 </button>
 <button
 onClick={() => handleAdminDecision(app.id, "Ditolak")}
 className="bg-red-650 hover:bg-red-700 text-white rounded text-[10px] py-1 font-bold tracking-tight cursor-pointer px-2"
 >
 ✕ Tolak / Perbaiki
 </button>
 </div>
 ) : (
 <div className="text-[10px] text-slate-400 font-extrabold">
 Terproses
 {currentUser.role !== "Prodi" && (
 <button
 onClick={() => {
 if (confirm("Ubah kembali status verifikasi berkas ini ke status Menunggu?")) {
 mutate("pendaftaranTesis", "update", { status: "Menunggu" }, "id", app.id);
 }
 }}
 className="block text-[9px] text-[var(--brand-primary)] hover:underline font-bold mt-1"
 >
 Reset Pilihan
 </button>
 )}
 </div>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 )}

 {/* VIEW: SETTINGS FOR ADMINISTRATIVE EXAM FEES */}
 {activeAdminTab === "fees" && (
 <div className="card max-w-2xl border border-[var(--border-color)]">
 <div className="p-4 border-b border-[var(--border-color)] mb-4">
 <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
 <Settings size={16} className="text-[var(--brand-primary)]" />
 Kelola Besaran Biaya Ujian Administratif (Biaya Admin)
 </h3>
 <p className="text-xs text-[var(--text-muted)] font-medium mt-1">Konfigurasikan tarif pendaftaran ujian tugas akhir yang berlaku untuk seluruh mahasiswa bimbingan</p>
 </div>

 <div className="p-4 space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div>
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Seminar Proposal (Sempro)</label>
 <div className="relative">
 <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
 <input
 type="number"
 disabled={!isUpdatingFees}
 value={feeSempro}
 onChange={(e) => setFeeSempro(Number(e.target.value))}
 className="pl-8 text-xs font-bold w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:outline-none focus:ring-1"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Seminar Hasil (Semhas)</label>
 <div className="relative">
 <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
 <input
 type="number"
 disabled={!isUpdatingFees}
 value={feeSemhas}
 onChange={(e) => setFeeSemhas(Number(e.target.value))}
 className="pl-8 text-xs font-bold w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:outline-none focus:ring-1"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Sidang Akhir Tugas Akhir</label>
 <div className="relative">
 <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
 <input
 type="number"
 disabled={!isUpdatingFees}
 value={feeSidang}
 onChange={(e) => setFeeSidang(Number(e.target.value))}
 className="pl-8 text-xs font-bold w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:outline-none focus:ring-1"
 />
 </div>
 </div>
 </div>

 <div className="pt-3 border-t border-[var(--border-color)] flex justify-end gap-2.5">
 {!isUpdatingFees ? (
 <button
 type="button"
 onClick={() => {
 setFeeSempro(getBiayaNominal("sempro"));
 setFeeSemhas(getBiayaNominal("semhas"));
 setFeeSidang(getBiayaNominal("sidang"));
 setIsUpdatingFees(true);
 }}
 className="btn btn-primary bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-bold px-4 py-2 cursor-pointer flex items-center gap-1"
 >
 <Edit3 size={12} /> Ubah Besaran Biaya Tarif
 </button>
 ) : (
 <>
 <button
 type="button"
 onClick={() => {
 setFeeSempro(getBiayaNominal("sempro"));
 setFeeSemhas(getBiayaNominal("semhas"));
 setFeeSidang(getBiayaNominal("sidang"));
 setIsUpdatingFees(false);
 }}
 className="btn btn-secondary text-xs rounded"
 >
 Batal
 </button>
 <button
 type="button"
 onClick={handleSaveFees}
 className="btn bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-bold px-4 py-2 cursor-pointer rounded flex items-center gap-1.5"
 >
 ✓ Simpan Tarif Preferensi
 </button>
 </>
 )}
 </div>
 </div>
 </div>
 )}

 {/* File Attachment Quick Preview Modal */}
 {previewFile && (
 <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-hidden animate-fade-in no-print">
 <div className="bg-[var(--bg-surface)] w-full max-w-4xl h-[85vh] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border-color)] overflow-hidden flex flex-col text-left">
 
 {/* Header */}
 <div className="p-4 bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
 <div className="flex items-center gap-2 overflow-hidden mr-4">
 <FileText className="text-[var(--brand-primary)] shrink-0" size={18} />
 <h3 className="text-xs font-bold text-[var(--text-main)] truncate" title={previewFile.name}>
 Pratinjau Berkas: {previewFile.name}
 </h3>
 </div>
 
 <div className="flex items-center gap-4 shrink-0">
 <button
 type="button"
 onClick={() => downloadAttachedFile(previewFile.data, previewFile.name)}
 className="px-3 py-1 bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition"
 >
 <Download size={11} /> Unduh
 </button>
 <button 
 type="button" 
 onClick={() => setPreviewFile(null)} 
 className="p-1 px-2.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs transition cursor-pointer w-8 h-8 flex items-center justify-center"
 >
 ×
 </button>
 </div>
 </div>

 {/* Display View Content area */}
 <div className="flex-1 bg-slate-900/20 p-4 flex items-center justify-center overflow-hidden">
 {previewFile.data.startsWith("data:image/") || 
 /\.(jpg|jpeg|png|gif|webp)$/i.test(previewFile.name) ? (
 <div className="max-w-full max-h-full overflow-auto flex items-center justify-center bg-stone-50 p-6 rounded-lg shadow-inner">
 <img 
 src={previewFile.data} 
 alt={previewFile.name} 
 className="max-w-full max-h-[65vh] object-contain rounded-md shadow-md"
 />
 </div>
 ) : previewFile.data.startsWith("data:application/pdf") || 
 previewFile.name.toLowerCase().endsWith(".pdf") ? (
 previewFileBlobUrl ? (
 <iframe 
 src={previewFileBlobUrl} 
 className="w-full h-full border-0 rounded-lg shadow bg-white" 
 title={previewFile.name} 
 />
 ) : (
 <div className="text-center font-semibold text-xs text-[var(--text-muted)] p-4 flex flex-col items-center gap-2">
 <div className="w-5 h-5 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
 Menyiapkan Pratinjau Dokumen...
 </div>
 )
 ) : (
 <div className="p-10 text-center max-w-sm space-y-3 bg-white dark:bg-slate-900 rounded-xl shadow border border-[var(--border-color)]">
 <FileText className="mx-auto text-amber-500 animate-bounce" size={40} />
 <p className="text-xs font-bold text-[var(--text-main)]">Tipe Berkas Tidak Didukung Pratinjau Langsung</p>
 <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
 Browser Anda tidak dapat merender berkas ini secara langsung karena pembatasan format (biasanya file Microsoft Word .doc/.docx). Silakan klik tombol 'Unduh' untuk membacanya pada aplikasi penampil berkas lokal Anda.
 </p>
 </div>
 )}
 </div>

 </div>
 </div>
 )}

 </div>
 );
}

