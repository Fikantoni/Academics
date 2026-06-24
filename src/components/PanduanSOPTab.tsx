import React, { useState, useRef, useEffect } from "react";
import { 
 Book, 
 FileText, 
 Search, 
 Plus, 
 Trash2, 
 ClipboardCheck, 
 ArrowRight, 
 Upload, 
 CheckCircle, 
 AlertCircle, 
 Info, 
 GraduationCap, 
 Clock, 
 Users, 
 Globe, 
 Link as LinkIcon,
 HelpCircle,
 MessageSquare,
 Calendar,
 Award,
 FileSpreadsheet,
 Play,
 Pause,
 Volume2,
 VolumeX,
 Maximize,
 RotateCcw,
 CheckSquare,
 Bot,
 Edit,
 Save,
 Video,
 ChevronDown,
 ChevronUp
} from "lucide-react";
import { Pengguna, AppState, PanduanSOP } from "../types";
import { safeStorage } from "../lib/safeStorage";

interface PanduanSOPTabProps {
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
 showToast: (msg: string, type: "success" | "warning" | "error") => void;
}

export default function PanduanSOPTab({
 currentUser,
 state,
 mutate,
 showToast,
}: PanduanSOPTabProps) {
 const [activeSubTab, setActiveSubTab] = useState<"drive-links" | "panduan" | "sop" | "alur" | "manual" | "panduan-penggunaan" | "faq-helpdesk">("drive-links");
 const [userGuideRole, setUserGuideRole] = useState<"Mahasiswa" | "Dosen" | "Admin">(() => {
 if (currentUser.role === "Dosen") return "Dosen";
 if (["Admin", "Superadmin", "Prodi"].includes(currentUser.role)) return "Admin";
 return "Mahasiswa";
 });
 const [expandedAccordion, setExpandedAccordion] = useState<string | null>("judul");
 const [manualRole, setManualRole] = useState<"Mahasiswa" | "Dosen">(currentUser.role === "Dosen" ? "Dosen" : "Mahasiswa");
 const [readSteps, setReadSteps] = useState<Record<string, boolean>>({});
 const [searchTerm, setSearchTerm] = useState("");
 const [categoryFilter, setCategoryFilter] = useState("Semua");

 const [isEditingDriveLinks, setIsEditingDriveLinks] = useState(false);
 const [draftLinks, setDraftLinks] = useState<Record<string, string>>({});

 useEffect(() => {
 if (state.pengaturan) {
 const links: Record<string, string> = {};
 const keys = [
 "link_akademik_s1_psikologi",
 "link_akademik_s1_kesmas",
 "link_akademik_s2_kesmas",
 "link_ta_s1_psikologi",
 "link_ta_s1_kesmas",
 "link_ta_s2_kesmas",
 "link_magang_s1_psikologi",
 "link_magang_s1_kesmas",
 "link_magang_s2_kesmas",
 "link_pbl1_s1_kesmas",
 "link_pbl2_s1_kesmas"
 ];
 keys.forEach(key => {
 links[key] = state.pengaturan?.find(p => p.id === key)?.value || "";
 });
 setDraftLinks(links);
 }
 }, [state.pengaturan, isEditingDriveLinks]);

 const handleSaveDriveLink = async (key: string, value: string) => {
 try {
 const exists = (state.pengaturan || []).some((p) => p.id === key);
 if (exists) {
 await mutate("pengaturan", "update", { value }, "id", key, false);
 } else {
 await mutate("pengaturan", "add", { id: key, value }, undefined, undefined, false);
 }
 showToast("Tautan Google Drive berhasil diperbarui!", "success");
 } catch (err) {
 showToast("Gagal menyimpan tautan Google Drive.", "error");
 }
 };

 // Helpdesk States
 const [tktKategori, setTktKategori] = useState("Sistem");
 const [tktSubjek, setTktSubjek] = useState("");
 const [tktDeskripsi, setTktDeskripsi] = useState("");
 const [tktUrgensi, setTktUrgensi] = useState<"Rendah" | "Sedang" | "Tinggi">("Sedang");
 const [tktSelectedReply, setTktSelectedReply] = useState<string | null>(null);
 const [tktReplyText, setTktReplyText] = useState("");

 const handleSubmitTicket = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!tktSubjek.trim() || !tktDeskripsi.trim()) {
 showToast("Subjek dan Deskripsi kendala wajib diisi!", "warning");
 return;
 }
 const newId = `TKT_${Date.now()}`;
 const payload = {
 id: newId,
 mahasiswaEmail: currentUser.email,
 namaMahasiswa: currentUser.nama,
 kategori: tktKategori,
 subjek: tktSubjek,
 deskripsi: tktDeskripsi,
 urgensi: tktUrgensi,
 tanggal: new Date().toISOString().substring(0, 10),
 status: "Terbuka"
 };

 try {
 await mutate("helpdesktiket", "add", payload);
 setTktSubjek("");
 setTktDeskripsi("");
 setTktUrgensi("Sedang");
 showToast("Tiket bantuan akademik berhasil diajukan ke admin prodi!", "success");
 } catch (err) {
 showToast("Gagal mengirim tiket bantuan.", "error");
 }
 };

 const handleReplyTicket = async (ticketId: string) => {
 if (!tktReplyText.trim()) {
 showToast("Tanggapan tidak boleh kosong!", "warning");
 return;
 }
 const ticket = (state.helpdesktiket || []).find((t) => t.id === ticketId);
 if (!ticket) return;

 const payload = {
 ...ticket,
 status: "Selesai",
 tanggapan: tktReplyText,
 tanggapanOleh: currentUser.nama,
 tanggalTanggapan: new Date().toISOString().substring(0, 10)
 };

 try {
 await mutate("helpdesktiket", "update", payload, "id", ticketId);
 setTktReplyText("");
 setTktSelectedReply(null);
 showToast("Tanggapan bantuan berhasil terkirim ke mahasiswa!", "success");
 } catch (err) {
 showToast("Gagal menyimpan tanggapan tiket.", "error");
 }
 };

 // User Tutorial Video State
 const [videoUrl, setVideoUrl] = useState(() => {
 return safeStorage.getItem("simtesis_tutorial_video_url") || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
 });
 const [isPlaying, setIsPlaying] = useState(false);
 const [currentTime, setCurrentTime] = useState(0);
 const [duration, setDuration] = useState(0);
 const [volume, setVolume] = useState(0.8);
 const [isMuted, setIsMuted] = useState(false);
 const [playbackRate, setPlaybackRate] = useState(1);
 const [isEditingVideoUrl, setIsEditingVideoUrl] = useState(false);
 const [videoUrlInput, setVideoUrlInput] = useState(videoUrl);
 const videoRef = useRef<HTMLVideoElement | null>(null);

 useEffect(() => {
 if (videoRef.current) {
 if (isPlaying) {
 videoRef.current.play().catch(() => setIsPlaying(false));
 } else {
 videoRef.current.pause();
 }
 }
 }, [isPlaying]);

 useEffect(() => {
 if (videoRef.current) {
 videoRef.current.muted = isMuted;
 videoRef.current.volume = volume;
 }
 }, [isMuted, volume]);

 useEffect(() => {
 if (videoRef.current) {
 videoRef.current.playbackRate = playbackRate;
 }
 }, [playbackRate]);

 const handleTimeUpdate = () => {
 if (videoRef.current) {
 setCurrentTime(videoRef.current.currentTime);
 }
 };

 const handleLoadedMetadata = () => {
 if (videoRef.current) {
 setDuration(videoRef.current.duration);
 }
 };

 const handleSeek = (time: number) => {
 if (videoRef.current) {
 videoRef.current.currentTime = time;
 setCurrentTime(time);
 if (!isPlaying) {
 setIsPlaying(true);
 }
 }
 };

 const formatVideoTime = (seconds: number) => {
 const mins = Math.floor(seconds / 60);
 const secs = Math.floor(seconds % 60);
 return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
 };

 const handleSaveVideoUrl = (e: React.FormEvent) => {
 e.preventDefault();
 safeStorage.setItem("simtesis_tutorial_video_url", videoUrlInput);
 setVideoUrl(videoUrlInput);
 setIsEditingVideoUrl(false);
 showToast("Tautan video tutorial berhasil dipasang!", "success");
 // Restart video
 setIsPlaying(false);
 if (videoRef.current) {
 videoRef.current.load();
 }
 };

 // Create Form State
 const [showAddModal, setShowAddModal] = useState(false);
 const [formJudul, setFormJudul] = useState("");
 const [formKategori, setFormKategori] = useState<"Panduan" | "SOP">("Panduan");
 const [formSubKategori, setFormSubKategori] = useState("Sistematika Penulisan");
 const [formDeskripsi, setFormDeskripsi] = useState("");
 const [uploadedFileName, setUploadedFileName] = useState("");
 const [uploadedFileData, setUploadedFileData] = useState("");

 // Interactive Checklist Stepper
 const [activeStep, setActiveStep] = useState<number>(0);
 const [checklists, setChecklists] = useState<Record<string, boolean>>({
 "sempro-1": false,
 "sempro-2": false,
 "sempro-3": false,
 "sempro-4": false,
 "sempro-5": false,
 "semhas-1": false,
 "semhas-2": false,
 "semhas-3": false,
 "semhas-4": false,
 "sidang-1": false,
 "sidang-2": false,
 "sidang-3": false,
 "sidang-4": false,
 "sidang-5": false,
 });

 const canManage = 
 currentUser.role === "Superadmin" || 
 currentUser.role === "Admin" || 
 currentUser.role === "Prodi";

 const items: PanduanSOP[] = state.panduanSOP || [];

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (file.size > 15 * 1024 * 1024) {
 showToast("Ukuran berkas maksimal adalah 15MB", "warning");
 return;
 }

 const reader = new FileReader();
 reader.onload = () => {
 setUploadedFileName(file.name);
 setUploadedFileData(reader.result as string);
 };
 reader.onerror = () => {
 showToast("Gagal membaca berkas", "error");
 };
 reader.readAsDataURL(file);
 };

 const handleAddSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!formJudul || !formDeskripsi) {
 showToast("Judul dan deskripsi panduan wajib diisi", "warning");
 return;
 }

 const payload: Omit<PanduanSOP, "id">= {
 judul: formJudul,
 kategori: formKategori,
 subKategori: formSubKategori,
 deskripsi: formDeskripsi,
 fileNama: uploadedFileName || undefined,
 fileData: uploadedFileData || undefined,
 tanggalInput: new Date().toISOString().split("T")[0],
 diunggahOleh: currentUser.nama,
 };

 try {
 await mutate("panduansop", "add", payload, undefined, undefined, true);
 showToast("Panduan / SOP baru berhasil dipublikasi", "success");
 
 // Reset & Close
 setFormJudul("");
 setFormDeskripsi("");
 setUploadedFileName("");
 setUploadedFileData("");
 setShowAddModal(false);
 } catch (err) {
 showToast("Gagal menambahkan berkas panduan", "error");
 }
 };

 const handleDelete = async (id: string, judul: string) => {
 if (window.confirm(`Apakah Anda yakin ingin menghapus "${judul}"?`)) {
 try {
 await mutate("panduansop", "delete", null, "id", id, true);
 showToast("Berkas panduan berhasil dihapus dari sistem", "success");
 } catch (err) {
 showToast("Gagal menghapus berkas panduan", "error");
 }
 }
 };

 const downloadFile = (item: PanduanSOP) => {
 if (!item.fileData) {
 showToast("Konten dokumen tidak tersedia dalam database.", "warning");
 return;
 }
 
 try {
 const link = document.createElement("a");
 link.href = item.fileData;
 link.download = item.fileNama || "Dokumen_Panduan.pdf";
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 showToast(`Mengunduh berkas: ${item.fileNama}`, "success");
 } catch (err) {
 showToast("Gagal mengunduh berkas", "error");
 }
 };

 const handleDownloadSystemDocument = (namaFile: string, label: string) => {
 try {
 let content = "";
 let mimeType = "application/pdf";
 if (namaFile.endsWith(".pdf")) {
 content = `%PDF-1.4\n%...\n\nUNIVERSITAS PASCASARJANA - Academics SYSTEM\n\nBuku Panduan Penggunaan Sistem Akademik Resmi\\nKategori: ${label}\\nNama File: ${namaFile}\\n\\nDokumen ini merupakan panduan resmi langkah demi langkah operasional Academics.\\nHarap ikuti tata cara pengisian dan alur yang dipaparkan.\\n\\nAcademics @ 2026 - All Rights Reserved.`;
 mimeType = "application/pdf";
 } else if (namaFile.endsWith(".docx")) {
 content = `Academics - TEMPLATE DOKUMEN RESMI\n=================================\nKategori: ${label}\nFormat Penulisan: MS Word (.docx)\nNama File: ${namaFile}\n\nGunakan file cetakan template resmi ini untuk menyusun draf naskah pascasarjana Anda.\nPastikan margin, ukuran font, dan format penulisan sitasi sesuai standar yang ditentukan prodi.\n\nAcademics @ 2026.`;
 mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
 }

 const blob = new Blob([content], { type: mimeType });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.href = url;
 link.download = namaFile;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(url);
 showToast(`Berhasil mengunduh dokumen: ${namaFile}`, "success");
 } catch (err) {
 showToast("Gagal mengunduh berkas panduan penggunaan", "error");
 }
 };

 // Filters logic
 const filteredItems = items.filter((item) => {
 const matchesSearch = 
 item.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.subKategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());

 const matchesTab = 
 (activeSubTab === "panduan" && item.kategori === "Panduan") ||
 (activeSubTab === "sop" && item.kategori === "SOP");

 const matchesCategory = 
 categoryFilter === "Semua" || 
 item.subKategori === categoryFilter;

 return matchesSearch && matchesTab && matchesCategory;
 });

 // Unique subcategories for drop-down filter
 const allSubcategories = Array.from(
 new Set(
 items
 .filter((item) => (activeSubTab === "panduan" && item.kategori === "Panduan") || (activeSubTab === "sop" && item.kategori === "SOP"))
 .map((item) => item.subKategori)
 )
 );

 // Stepper Data
 const steps = [
 {
 title: "1. Pengajuan Judul & Proposal",
 desc: "Tahap inisiasi pencarian pembimbing dan penentuan judul penelitian tugas akhir.",
 tasks: [
 { id: "sempro-1", label: "Menyusun draf abstrak naskah penelitian mandiri" },
 { id: "sempro-2", label: "Mengajukan usulan judul melalui form Ajukan Judul di Academics" },
 { id: "sempro-3", label: "Memperoleh validasi persetujuan judul dari Ketua Prodi / Tim Reviewer" },
 { id: "sempro-4", label: "Menghubungi Tim Pembimbing 1 & 2 yang resmi diplot oleh sistem" },
 { id: "sempro-5", label: "Melakukan konsultasi awal minimal 1 kali terkait desain rancangan proposal" },
 ]
 },
 {
 title: "2. Seminar Proposal (Sempro)",
 desc: "Penyajian rancangan Bab I - III untuk divalidasi kelayakan metodologinya.",
 tasks: [
 { id: "semhas-1", label: "Melakukan bimbingan proposal minimal 4 kali per pembimbing" },
 { id: "semhas-2", label: "Memperoleh persetujuan ACC Seminar Proposal dari Pembimbing 1 & 2" },
 { id: "semhas-3", label: "Melunasi administrasi biaya Seminar Proposal sebesar Rp 500.000" },
 { id: "semhas-4", label: "Mendaftarkan ujian di Academics dengan upload naskah proposal & slip bayar" },
 ]
 },
 {
 title: "3. Seminar Hasil (Semhas)",
 desc: "Ujian uji kelayakan hasil riset, pengolahan data lapangan, pembahasan Bab IV.",
 tasks: [
 { id: "sidang-1", label: "Menyelesaikan riset lapangan dan analisis statistik secara lengkap" },
 { id: "sidang-2", label: "Konsultasi bimbingan kelayakan bimbingan minimal 8 kali terakumulasi" },
 { id: "sidang-3", label: "Melunasi administrasi biaya Seminar Hasil sebesar Rp 750.000" },
 { id: "sidang-4", label: "Mengunggah berkas naskah hasil riset draf tugas akhir dan slip pembayaran" },
 { id: "sidang-5", label: "Mendapatkan ACC dari Tim Pembimbing Utama" },
 ]
 },
 {
 title: "4. Sidang Akhir & Yudisium",
 desc: "Sidang pertanggungjawaban tugas akhir komprehensif penentu kelulusan Magister.",
 tasks: [
 { id: "final-1", label: "Merevisi naskah masukan penguji seminar hasil secara tuntas" },
 { id: "final-2", label: "Melakukan uji kesamaan karya tulis (Turnitin) dengan hasil maksimal 25%" },
 { id: "final-3", label: "Melunasi biaya Sidang Akhir Tugas Akhir sebesar Rp 1.500.000" },
 { id: "final-4", label: "Melampirkan Surat Bebas Pustaka resmi dari Perpustakaan" },
 { id: "final-5", label: "Persetujuan final / ACC pendaftaran Sidang Akhir dari Pembimbing 1 & 2" }
 ]
 }
 ];

 const handleStepCheckboxChange = (id: string) => {
 setChecklists((prev) => ({
 ...prev,
 [id]: !prev[id],
 }));
 };

 const getStepProgress = (stepIndex: number) => {
 const currentStepTasks = steps[stepIndex].tasks;
 const completedCount = currentStepTasks.filter((t) => checklists[t.id]).length;
 return Math.round((completedCount / currentStepTasks.length) * 100);
 };

 return (
 <div className="space-y-6 text-left animate-slide-entry">
 
 {/* Banner / Title Matrix */}
 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2.5">
 <span className="text-2xl"></span>
 <div>
 <h2 className="text-xl font-extrabold text-[#0d9488] tracking-tight">
 Pedoman Akademik & Standar Operasional Prosedur (SOP)
 </h2>
 <p className="text-xs text-slate-500 font-medium">
 Pusat referensi naskah tugas akhir, pedoman penulisan, syarat ujian prasidang, dan aturan akademik instansi
 </p>
 </div>
 </div>
 </div>

 {canManage && (
 <button
 onClick={() => setShowAddModal(true)}
 className="flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white font-bold text-xs rounded-lg hover:bg-[#0f766e] transition-all shadow-sm cursor-pointer self-start md:self-auto"
 >
 <Plus size={15} strokeWidth={2.5} />
 Unggah Berkas Baru
 </button>
 )}
 </div>

 {/* Primary Sub-Tabs Controller */}
 <div className="flex flex-wrap border-b border-slate-200 gap-1 bg-white p-1 rounded-lg border">
 <button
 onClick={() => {
 setActiveSubTab("drive-links");
 }}
 className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-lg transition-all cursor-pointer ${
 activeSubTab === "drive-links"
 ? "bg-[#0d9488] text-white shadow-sm"
 : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
 }`}
 >
 <LinkIcon size={14} />
 Tautan Google Drive
 </button>
 <button
 onClick={() => {
 setActiveSubTab("panduan-penggunaan");
 }}
 className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-lg transition-all cursor-pointer ${
 activeSubTab === "panduan-penggunaan"
 ? "bg-[#0d9488] text-white shadow-sm"
 : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
 }`}
 >
 <HelpCircle size={14} />
 Panduan Penggunaan
 </button>
 <button
 onClick={() => {
 setActiveSubTab("manual");
 }}
 className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-lg transition-all cursor-pointer ${
 activeSubTab === "manual"
 ? "bg-[#0d9488] text-white shadow-sm"
 : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
 }`}
 >
 <HelpCircle size={14} />
 Langkah & Simulasi Sistem
 </button>
 <button
 onClick={() => {
 setActiveSubTab("panduan");
 setCategoryFilter("Semua");
 }}
 className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-lg transition-all cursor-pointer ${
 activeSubTab === "panduan"
 ? "bg-[#0d9488] text-white shadow-sm"
 : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
 }`}
 >
 <Book size={14} />
 Buku & Panduan Tugas Akhir
 </button>
 <button
 onClick={() => {
 setActiveSubTab("sop");
 setCategoryFilter("Semua");
 }}
 className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-lg transition-all cursor-pointer ${
 activeSubTab === "sop"
 ? "bg-[#0d9488] text-white shadow-sm"
 : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
 }`}
 >
 <FileText size={14} />
 SOP & Regulasi Resmi
 </button>
 <button
 onClick={() => setActiveSubTab("alur")}
 className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-lg transition-all cursor-pointer ${
 activeSubTab === "alur"
 ? "bg-[#0d9488] text-white shadow-sm"
 : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
 }`}
 >
 <ClipboardCheck size={14} />
 Alur Interaktif & Checklist
 </button>
 <button
 onClick={() => setActiveSubTab("faq-helpdesk")}
 className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-lg transition-all cursor-pointer ${
 activeSubTab === "faq-helpdesk"
 ? "bg-[#0d9488] text-white shadow-sm"
 : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
 }`}
 >
 <HelpCircle size={14} />
 FAQ & Helpdesk Tiket
 </button>
 </div>

 {/* FILTER & SEARCH PANEL FOR FILE TABS */}
 {activeSubTab !== "alur" && activeSubTab !== "manual" && activeSubTab !== "panduan-penggunaan" && activeSubTab !== "faq-helpdesk" && (
 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3.5 items-center justify-between">
 <div className="relative w-full sm:w-80">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
 <input
 type="text"
 placeholder="Cari judul, sub-kategori, deskripsi..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0d9488] bg-slate-50/50"
 />
 </div>

 <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
 <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Filter Sub:</span>
 <select
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-[#0d9488] outline-none font-semibold text-slate-700 min-w-[150px] cursor-pointer"
 >
 <option value="Semua">Semua Kategori</option>
 {allSubcategories.map((sub) => (
 <option key={sub} value={sub}>{sub}</option>
 ))}
 </select>
 </div>
 </div>
 )}

 {/* TAB CONTENT 1 & 2: GUIDELINES AND SOPS LIST */}
 {activeSubTab !== "alur" && activeSubTab !== "manual" && activeSubTab !== "panduan-penggunaan" && (
 <div className="grid grid-cols-1 gap-4">
 {filteredItems.length === 0 ? (
 <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-3">
 <span className="text-4xl text-slate-300"></span>
 <div>
 <h4 className="text-sm font-bold text-slate-700">Tidak Ada Dokumen Ditemukan</h4>
 <p className="text-xs text-slate-400 mt-1">
 Coba sesuaikan kata kunci pencarian Anda atau bersihkan filter di atas.
 </p>
 </div>
 {searchTerm || categoryFilter !== "Semua" ? (
 <button
 onClick={() => {
 setSearchTerm("");
 setCategoryFilter("Semua");
 }}
 className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-bold text-xs hover:bg-[#fafafa]"
 >
 Reset Filter
 </button>
 ) : null}
 </div>
 ) : (
 filteredItems.map((item) => (
 <div
 key={item.id}
 className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 justify-between items-start md:items-center relative overflow-hidden"
 >
 {/* Visual Accent bar depending on Category */}
 <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${item.kategori === "Panduan" ? "bg-amber-500" : "bg-[#0d9488]"}`} />

 <div className="space-y-2 flex-1 pl-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wide ${
 item.kategori === "Panduan" ? "bg-amber-50 text-amber-800 border border-amber-100" : "bg-[#f0fdfa] text-[#0d9488] border border-[#ccfbf1]"
 }`}>
 {item.kategori}
 </span>
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
 "¢ {item.subKategori}
 </span>
 </div>

 <h3 className="text-base font-extrabold text-slate-800 max-w-2xl leading-tight">
 {item.judul}
 </h3>

 <p className="text-xs text-slate-600 leading-relaxed font-medium">
 {item.deskripsi}
 </p>

 <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-semibold text-slate-400 pt-1">
 <span className="flex items-center gap-1">
 <Clock size={11} className="text-slate-400" />
 Dirilis: {item.tanggalInput}
 </span>
 <span className="flex items-center gap-1">
 <Users size={11} className="text-slate-400" />
 Oleh: {item.diunggahOleh}
 </span>
 {item.fileNama && (
 <span className="font-bold text-slate-500 flex items-center gap-1">
 {item.fileNama}
 </span>
 )}
 </div>
 </div>

 <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end border-t border-slate-100 pt-3 md:pt-0 md:border-0">
 {item.fileData ? (
 <button
 onClick={() => downloadFile(item)}
 className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 border border-slate-200 hover:border-[#0d9488] hover:bg-[#f0fdfa] rounded-lg text-slate-700 hover:text-[#0d9488] font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
 >
 Unduh Lampiran
 </button>
 ) : (
 <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1.5 rounded">
 Tidak Ada File Lampiran
 </span>
 )}

 {canManage && (
 <button
 onClick={() => handleDelete(item.id, item.judul)}
 className="p-2 border border-rose-100 hover:border-rose-300 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
 title="Hapus Panduan"
 >
 <Trash2 size={13.5} />
 </button>
 )}
 </div>
 </div>
 ))
 )}
 </div>
 )}

 {/* TAB CONTENT 3: INTERACTIVE STEPPER / CHECKLIST */}
 {activeSubTab === "alur" && (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
 
 {/* Stepper Navigation Sidebar */}
 <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 space-y-2">
 <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-2 pb-1 bg-slate-50 rounded p-1 mb-2">
 Langkah Penyelesaian Tugas Akhir
 </h3>
 {steps.map((st, idx) => {
 const active = idx === activeStep;
 const progress = getStepProgress(idx);

 return (
 <button
 key={idx}
 onClick={() => setActiveStep(idx)}
 className={`w-full p-3 rounded-lg text-left transition-all flex items-center justify-between border cursor-pointer ${
 active 
 ? "bg-[#f0fdfa] border-[#0d9488]/40 text-[#0d9488]" 
 : "bg-[#fafafa]/50 border-slate-100 hover:bg-slate-100/60 text-slate-700"
 }`}
 >
 <div className="flex items-center gap-3">
 <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
 active ? "bg-[#0d9488] text-white" : "bg-slate-200 text-slate-600"
 }`}>
 {idx + 1}
 </span>
 <div>
 <p className="text-xs font-bold leading-tight">{st.title}</p>
 <span className="text-[9.5px] text-slate-400 tracking-tight block">
 Perkembangan berkas: {progress}%
 </span>
 </div>
 </div>
 {progress === 100 && (
 <CheckCircle size={15} className="text-emerald-500 fill-emerald-50" />
 )}
 </button>
 );
 })}
 </div>

 {/* Stepper Detail & Dynamic Tasks Checklist */}
 <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
 <div className="border-b border-slate-100 pb-4">
 <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
 Panduan Simulasi Alur Mandiri
 </span>
 <h2 className="text-lg font-black text-slate-800 mt-2 leading-none">
 {steps[activeStep].title}
 </h2>
 <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
 {steps[activeStep].desc}
 </p>
 </div>

 {/* Checklist items list */}
 <div>
 <h4 className="text-xs font-bold text-slate-600 mb-3.5 uppercase tracking-wide">
 Daftar Persyaratan & Checklist Verifikasi:
 </h4>

 <div className="space-y-2.5">
 {steps[activeStep].tasks.map((task) => {
 const checked = !!checklists[task.id];
 return (
 <label
 key={task.id}
 className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer selection-none ${
 checked 
 ? "bg-slate-50/50 border-slate-200 text-slate-700" 
 : "bg-white border-slate-150 hover:border-slate-350 text-slate-800"
 }`}
 >
 <input
 type="checkbox"
 checked={checked}
 onChange={() => handleStepCheckboxChange(task.id)}
 className="mt-0.5 w-4 h-4 rounded text-[#0d9488] border-slate-300 focus:ring-[#0d9488] focus:ring-0 outline-none cursor-pointer"
 />
 <span className={`text-[12px] font-semibold leading-relaxed ${checked ? "line-through text-slate-400 font-medium" : ""}`}>
 {task.label}
 </span>
 </label>
 );
 })}
 </div>
 </div>

 {/* Dynamic Status / Progress Alert Banner */}
 <div className="bg-[#fcfcfc] border border-slate-150 p-4 rounded-lg flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-2.5">
 <div className="relative flex items-center justify-center">
 <span className="text-xl"></span>
 </div>
 <div>
 <h4 className="text-[11.5px] font-black text-slate-800">
 Progress Kelayakan Tahap Ini
 </h4>
 <p className="text-[10px] text-slate-500 font-semibold">
 {getStepProgress(activeStep) === 100 
 ? "Luar biasa! Seluruh persyaratan utama telah Anda penuhi untuk melangkah ke fase berikutnya."
 : "Selesaikan semua item checklist di atas untuk menguji kelayakan administratif mandiri."
 }
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <span className="text-sm font-black text-slate-500">
 {getStepProgress(activeStep)}% Komplit
 </span>
 </div>
 </div>

 {/* Next Action Suggestion helper card */}
 <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-lg flex gap-3 items-start">
 <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
 <div>
 <h5 className="text-xs font-bold text-blue-900">Petunjuk Akademik</h5>
 <p className="text-[10.5px] text-blue-800/90 leading-relaxed mt-1 font-semibold">
 Jika Anda telah memenuhi syarat di atas luring maupun daring, silakan akses halaman utama menu terkait 
 (misal: <strong>Daftar Sidang</strong> atau <strong>Ajukan Judul</strong>) di panel navigasi kiri Academics untuk mendaftar secara formal.
 </p>
 </div>
 </div>
 </div>

 </div>
 )}
 {/* TAB CONTENT: TAUTAN GOOGLE DRIVE */}
 {activeSubTab === "drive-links" && (
 <div className="space-y-6 animate-slide-entry">
 {/* Header Banner */}
 <div className="bg-gradient-to-r from-[#0d9488] to-[#0ea5e9] text-white rounded-xl p-6 shadow-md relative overflow-hidden">
 <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
 <Globe size={240} />
 </div>
 <div className="relative z-10 max-w-3xl space-y-2">
 <div className="bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded inline-block">
 Pusat Tautan Google Drive Resmi Pascasarjana
 </div>
 <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none flex items-center gap-2">
 Tautan Panduan & Magang
 </h2>
 <p className="text-xs text-indigo-100 font-medium md:max-w-xl">
 Akses langsung ke berbagai file panduan akademik, tugas akhir, magang, dan PBL melalui Google Drive resmi yang dikelola oleh Fakultas.
 </p>
 </div>
 </div>

 {/* Admin Control Bar */}
 {canManage && (
 <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
 <div>
 <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Mode Editor Admin</h4>
 <p className="text-[10.5px] text-slate-500 font-semibold">Aktifkan mode edit untuk mengubah atau memperbarui tautan Google Drive untuk setiap program studi.</p>
 </div>
 <button
 type="button"
 onClick={() => setIsEditingDriveLinks(!isEditingDriveLinks)}
 className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-black text-xs transition-all cursor-pointer shadow-sm ${
 isEditingDriveLinks
 ? "bg-emerald-600 hover:bg-emerald-700 text-white"
 : "bg-[#0d9488] hover:bg-[#0f766e] text-white"
 }`}
 >
 {isEditingDriveLinks ? (
 <>
 <span>âœ“ Selesai Mengedit</span>
 </>
 ) : (
 <>
 <Edit size={13} />
 <span>âœ Edit Tautan Drive</span>
 </>
 )}
 </button>
 </div>
 )}

 {/* Grid Layout of Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {[
 {
 title: "1. Panduan Akademik",
 icon: "",
 desc: "Panduan kurikulum, beban studi, dan administrasi akademik prodi.",
 items: [
 { key: "link_akademik_s1_psikologi", label: "S1 Psikologi" },
 { key: "link_akademik_s1_kesmas", label: "S1 Ilmu Kesehatan Masyarakat" },
 { key: "link_akademik_s2_kesmas", label: "S2 Kesehatan Masyarakat" }
 ]
 },
 {
 title: "2. Panduan Tugas Akhir",
 icon: "",
 desc: "Sistematika penulisan, proposal, hasil, dan sidang tugas akhir.",
 items: [
 { key: "link_ta_s1_psikologi", label: "S1 Psikologi" },
 { key: "link_ta_s1_kesmas", label: "S1 Ilmu Kesehatan Masyarakat" },
 { key: "link_ta_s2_kesmas", label: "S2 Kesehatan Masyarakat" }
 ]
 },
 {
 title: "3. Panduan Magang",
 icon: "",
 desc: "Panduan magang instansi, pelaporan magang, dan lembar kerja.",
 items: [
 { key: "link_magang_s1_psikologi", label: "S1 Psikologi" },
 { key: "link_magang_s1_kesmas", label: "S1 Ilmu Kesehatan Masyarakat" },
 { key: "link_magang_s2_kesmas", label: "S2 Kesehatan Masyarakat" }
 ]
 },
 {
 title: "4. Panduan PBL 1 & PBL 2",
 icon: "",
 desc: "Panduan khusus praktek belajar lapangan S1 Ilmu Kesehatan Masyarakat.",
 items: [
 { key: "link_pbl1_s1_kesmas", label: "PBL 1 S1 Ilmu Kesehatan Masyarakat" },
 { key: "link_pbl2_s1_kesmas", label: "PBL 2 S1 Ilmu Kesehatan Masyarakat" }
 ]
 }
 ].map((section, idx) => (
 <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
 <div className="space-y-4">
 {/* Card Title & Icon */}
 <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
 <span className="text-2xl">{section.icon}</span>
 <div>
 <h3 className="text-sm font-black text-slate-800">{section.title}</h3>
 <p className="text-[10px] text-slate-400 font-medium">{section.desc}</p>
 </div>
 </div>

 {/* List of study programs */}
 <div className="space-y-4 pt-1">
 {section.items.map((item) => {
 const currentVal = state.pengaturan?.find(p => p.id === item.key)?.value || "";
 const draftVal = draftLinks[item.key] || "";

 return (
 <div key={item.key} className="space-y-1.5 text-left">
 <div className="flex items-center justify-between gap-2">
 <span className="text-[11px] font-black text-slate-705">{item.label}</span>
 {currentVal && !isEditingDriveLinks && (
 <span className="text-[9px] font-black uppercase text-emerald-650 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
 <span>âœ“</span> Aktif
 </span>
 )}
 {!currentVal && !isEditingDriveLinks && (
 <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
 Belum Diatur
 </span>
 )}
 </div>

 {isEditingDriveLinks ? (
 <div className="flex gap-2 items-center">
 <input
 type="url"
 value={draftVal}
 onChange={(e) => setDraftLinks({ ...draftLinks, [item.key]: e.target.value })}
 placeholder="Paste Google Drive URL..."
 className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-[#0d9488] text-slate-700 font-semibold"
 />
 <button
 type="button"
 onClick={() => handleSaveDriveLink(item.key, draftVal)}
 className="px-3 py-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
 >
 Simpan
 </button>
 </div>
 ) : (
 <button
 type="button"
 onClick={() => {
 if (!currentVal) {
 showToast(`Tautan untuk ${item.label} belum diatur oleh admin.`, "warning");
 return;
 }
 window.open(currentVal, "_blank");
 }}
 className={`w-full py-2 px-3.5 border rounded-lg font-black text-xs transition-all flex items-center justify-between cursor-pointer ${
 currentVal
 ? "bg-slate-50/50 hover:bg-[#f0fdfa] border-slate-200 hover:border-teal-300 text-slate-700 hover:text-[#0d9488] shadow-xs"
 : "bg-slate-50/20 border-slate-100 text-slate-350 cursor-not-allowed"
 }`}
 >
 <span>Buka Google Drive</span>
 <span className="text-[10px]">â†—</span>
 </button>
 )}
 </div>
 );
 })}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* TAB CONTENT: PANDUAN PENGGUNAAN (INTERACTIVE ACCORDION & VIDEO EXPLAINERS & DOWNLOADS) */}
 {activeSubTab === "panduan-penggunaan" && (
 <div className="space-y-6">
 {/* Header Banner */}
 <div className="bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white rounded-xl p-6 shadow-md relative overflow-hidden">
 <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
 <GraduationCap size={240} />
 </div>
 <div className="relative z-10 max-w-3xl space-y-2">
 <div className="bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded inline-block">
 Pusat Bantuan Resmi Academics Pascasarjana
 </div>
 <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none">
 Panduan Penggunaan Utama ({userGuideRole})
 </h2>
 <p className="text-xs text-emerald-100 font-medium md:max-w-xl">
 Pelajari seluruh alur akademik magister di Academics dari mulai usulan judul tugas akhir, bimbingan berkala, hingga pendaftaran sidang akhir secara tuntas dan mandiri.
 </p>
 </div>
 </div>

 <div className="space-y-4">
 <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
 <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
 <span></span> Prosedur & Alur Akademik Mandiri
 </h3>
 <p className="text-[11px] text-slate-400 font-medium">
 Pilih peran Anda untuk menyesuaikan panduan interaktif
 </p>
 </div>
 <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200 shrink-0 select-none">
 {(["Mahasiswa", "Dosen", "Admin"] as const).map((r) => (
 <button
 key={r}
 onClick={() => {
 setUserGuideRole(r);
 setExpandedAccordion(r === "Mahasiswa" ? "judul" : r === "Dosen" ? "review" : "assign_mhs");
 }}
 className={`px-3 py-1 text-[10.5px] font-black rounded-md transition-all cursor-pointer ${
 userGuideRole === r
 ? "bg-[#0d9488] text-white shadow-xs"
 : "text-slate-650 hover:bg-slate-200 hover:text-slate-900"
 }`}
 >
 {r === "Mahasiswa" ? " Mhs" : r === "Dosen" ? " Dosen" : "âš™ Admin"}
 </button>
 ))}
 </div>
 </div>

 {/* ACCORDION ITEMS BY ROLE */}
 <div className="space-y-3">
 
 {/* ====== MAHASISWA ACCORDIONS ====== */}
 {userGuideRole === "Mahasiswa" && (
 <>
 {/* Accordion 1 */}
 <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
 expandedAccordion === "judul" ? "border-[#0d9488] bg-[#fcfdfd]" : "border-slate-200 bg-white"
 }`}>
 <button
 onClick={() => setExpandedAccordion(expandedAccordion === "judul" ? null : "judul")}
 className="w-full px-4 py-3 flex items-center justify-between text-left gap-2 select-none cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
 expandedAccordion === "judul" ? "bg-[#0d9488] text-white" : "bg-slate-100 text-slate-600"
 }`}>1</span>
 <div>
 <h4 className="text-xs font-black text-slate-800">Cara Pengajuan Judul Tugas Akhir</h4>
 <p className="text-[10px] text-slate-400 mt-0.5">Mulai topik dan usulan dosen pembimbing</p>
 </div>
 </div>
 <span>{expandedAccordion === "judul" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
 </button>
 {expandedAccordion === "judul" && (
 <div className="px-4 pb-4 pt-1.5 border-t border-slate-100 bg-white space-y-3">
 <div className="text-[11.5px] text-slate-600 leading-relaxed font-semibold space-y-2">
 <p>Langkah detail pengajuan judul melalui portal mahasiswa:</p>
 <ul className="list-inside list-decimal space-y-2 text-slate-650 pt-1 border-l-2 border-emerald-100 pl-3">
 <li>Masuk ke menu <span className="text-teal-700 font-bold">âœ¦ Ajukan Judul</span> di navigasi kiri.</li>
 <li>Isi Judul Tugas Akhir, Abstrak Singkat, Rumusan Masalah, Metode, dan Bidang Kajian.</li>
 <li>Pilih opsi usulan Dosen Pembimbing Utama & Pendamping dari daftar dosen.</li>
 <li>Klik <strong className="text-emerald-700">Kirim Usulan</strong> dan pantau berkala persetujuannya di halaman utama.</li>
 </ul>
 </div>
 <div className="p-2.5 bg-teal-50/50 border border-teal-100 rounded-lg text-[10px] text-emerald-900 leading-relaxed font-semibold">
 <strong>Tips Lengkap:</strong> Masukkan minimal 3 kata kunci penting pada abstrak agar prodi mudah mendistribusikan reviewer yang sesuai bidang.
 </div>
 </div>
 )}
 </div>

 {/* Accordion 2 */}
 <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
 expandedAccordion === "bimbingan" ? "border-[#0d9488] bg-[#fcfdfd]" : "border-slate-200 bg-white"
 }`}>
 <button
 onClick={() => setExpandedAccordion(expandedAccordion === "bimbingan" ? null : "bimbingan")}
 className="w-full px-4 py-3 flex items-center justify-between text-left gap-2 select-none cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
 expandedAccordion === "bimbingan" ? "bg-[#0d9488] text-white" : "bg-slate-100 text-slate-600"
 }`}>2</span>
 <div>
 <h4 className="text-xs font-black text-slate-800">Cara Bimbingan & Konsultasi</h4>
 <p className="text-[10px] text-slate-400 mt-0.5">Logbook asisten, chat, dan Google Meet</p>
 </div>
 </div>
 <span>{expandedAccordion === "bimbingan" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
 </button>
 {expandedAccordion === "bimbingan" && (
 <div className="px-4 pb-4 pt-1.5 border-t border-slate-100 bg-white space-y-3">
 <div className="text-[11.5px] text-slate-600 leading-relaxed font-semibold space-y-2">
 <p>Cara berkonsultasi secara interaktif bersama dosen pembimbing:</p>
 <ul className="list-inside list-decimal space-y-2 text-slate-650 pt-1 border-l-2 border-emerald-100 pl-3">
 <li>Pilih menu <span className="text-teal-700 font-bold">Konsultasi</span> di panel navigasi.</li>
 <li>Pilih dosen pembimbing aktif Anda di baris kiri ruang obrolan.</li>
 <li>Kirim pesan konsultasi dan sertakan file naskah (PDF/Word maksimal 15MB).</li>
 <li>Gunakan tombol Link Google Meet yang disediakan dosen di header obrolan untuk bimbingan jarak jauh.</li>
 <li>Setelah disetujui, log asistensi otomatis terakumulasi dalam kartu bimbingan Anda.</li>
 </ul>
 </div>
 <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-955 leading-relaxed font-semibold font-medium">
 âš  <strong>Batas Minimum:</strong> Minimal 4 bimbingan tervalidasi untuk daftar Seminar Proposal, dan total 8 asistensi untuk pendaftaran Sidang Akhir Tugas Akhir.
 </div>
 </div>
 )}
 </div>

 {/* Accordion 3 */}
 <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
 expandedAccordion === "sidang" ? "border-[#0d9488] bg-[#fcfdfd]" : "border-slate-200 bg-white"
 }`}>
 <button
 onClick={() => setExpandedAccordion(expandedAccordion === "sidang" ? null : "sidang")}
 className="w-full px-4 py-3 flex items-center justify-between text-left gap-2 select-none cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
 expandedAccordion === "sidang" ? "bg-[#0d9488] text-white" : "bg-slate-100 text-slate-600"
 }`}>3</span>
 <div>
 <h4 className="text-xs font-black text-slate-800">Cara Pendaftaran Sidang / Ujian</h4>
 <p className="text-[10px] text-slate-400 mt-0.5">Syarat unggah berkas, verifikasi BAA & jadwal</p>
 </div>
 </div>
 <span>{expandedAccordion === "sidang" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
 </button>
 {expandedAccordion === "sidang" && (
 <div className="px-4 pb-4 pt-1.5 border-t border-slate-100 bg-white space-y-3">
 <div className="text-[11.5px] text-slate-600 leading-relaxed font-semibold space-y-2">
 <p>Alur pendaftaran ujian evaluasi tugas akhir (Proposal, Hasil, Sidang Akhir):</p>
 <ul className="list-inside list-decimal space-y-2 text-slate-650 pt-1 border-l-2 border-emerald-100 pl-3">
 <li>Masuk ke menu <span className="text-teal-700 font-bold">Daftar Sidang</span>.</li>
 <li>Pilih jenjang evaluasi (Proposal / Hasil / Sidang Akhir Tugas Akhir S2).</li>
 <li>Upload draf naskah utama (PDF), Bukti Pembayaran Bank Kalbar, Sertifikat TOEFL resmi, dan Surat ACC.</li>
 <li>Tunggu admin BAA memvalidasi seluruh kelengkapan dokumen.</li>
 <li>Setelah diverifikasi, susunan penguji dan ruang sidang otomatis tayang di menu <span className="text-teal-700 font-bold">Jadwal Sidang</span>.</li>
 </ul>
 </div>
 <div className="p-2.5 bg-red-400/10 border border-red-200 rounded-lg text-[10px] text-red-900 leading-relaxed font-semibold">
 <strong>Peringatan Berkas:</strong> Scan file kelengkapan dan slip bayar secara jelas dengan dpi murni untuk menghindari penolakan instan oleh admin admisi.
 </div>
 </div>
 )}
 </div>
 </>
 )}

 {/* ====== DOSEN ACCORDIONS ====== */}
 {userGuideRole === "Dosen" && (
 <>
 {/* Accordion 1 (Dosen) */}
 <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
 expandedAccordion === "review" ? "border-[#0d9488] bg-[#fcfdfd]" : "border-slate-200 bg-white"
 }`}>
 <button
 onClick={() => setExpandedAccordion(expandedAccordion === "review" ? null : "review")}
 className="w-full px-4 py-3 flex items-center justify-between text-left gap-2 select-none cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
 expandedAccordion === "review" ? "bg-[#0d9488] text-white" : "bg-slate-100 text-slate-600"
 }`}>1</span>
 <div>
 <h4 className="text-xs font-black text-slate-800">Cara Review & Setujui Judul</h4>
 <p className="text-[10px] text-slate-400 mt-0.5">Penilaian abstrak kualifikasi orisinalitas riset</p>
 </div>
 </div>
 <span>{expandedAccordion === "review" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
 </button>
 {expandedAccordion === "review" && (
 <div className="px-4 pb-4 pt-1.5 border-t border-slate-100 bg-white space-y-3">
 <div className="text-[11.5px] text-slate-600 leading-relaxed font-semibold space-y-2">
 <p>Panduan bagi Reviewer / Calon Pembimbing Judul:</p>
 <ul className="list-inside list-decimal space-y-2 text-slate-650 pt-1 border-l-2 border-emerald-100 pl-3">
 <li>Buka menu <span className="text-teal-700 font-bold">Review Judul</span> di bilah kiri.</li>
 <li>Klik usulan mahasiswa untuk meneliti draf draf abstrak serta rumusan masalah.</li>
 <li>Input komentar substantif/catatan koreksi pada kolom masukan.</li>
 <li>Klik tombol keputusan akhir: <span className="text-green-700 font-bold">Setujui</span> atau <span className="text-amber-700 font-bold">Butuh Revisi</span>.</li>
 </ul>
 </div>
 <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-[10px] text-teal-900 leading-relaxed font-semibold">
 Status 'Butuh Revisi' mengizinkan mahasiswa memperbaiki draf naskah langsung tanpa membatalkan usulan awal.
 </div>
 </div>
 )}
 </div>

 {/* Accordion 2 (Dosen) */}
 <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
 expandedAccordion === "asistensi" ? "border-[#0d9488] bg-[#fcfdfd]" : "border-slate-200 bg-white"
 }`}>
 <button
 onClick={() => setExpandedAccordion(expandedAccordion === "asistensi" ? null : "asistensi")}
 className="w-full px-4 py-3 flex items-center justify-between text-left gap-2 select-none cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
 expandedAccordion === "asistensi" ? "bg-[#0d9488] text-white" : "bg-slate-100 text-slate-600"
 }`}>2</span>
 <div>
 <h4 className="text-xs font-black text-slate-800">Melakukan Bimbingan & ACC</h4>
 <p className="text-[10px] text-slate-400 mt-0.5">Komunikasi chat, link meet, dan validasi log</p>
 </div>
 </div>
 <span>{expandedAccordion === "asistensi" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
 </button>
 {expandedAccordion === "asistensi" && (
 <div className="px-4 pb-4 pt-1.5 border-t border-slate-100 bg-white space-y-3">
 <div className="text-[11.5px] text-slate-600 leading-relaxed font-semibold space-y-2">
 <p>Bimbingan online harian bersama bimbingan mahasiswa aktif:</p>
 <ul className="list-inside list-decimal space-y-2 text-slate-650 pt-1 border-l-2 border-emerald-100 pl-3">
 <li>Masuk ke menu <span className="text-teal-700 font-bold">Konsultasi</span> atau <span className="text-teal-700 font-bold">Bimbingan</span>.</li>
 <li>Pilih mahasiswa, ulas kelancaran draf tulisan, dan unduh lampiran berkas risetnya.</li>
 <li>Gunakan link Google Meet statis dosen pembimbing untuk pertemuan tatap muka.</li>
 <li>Klik tombol <strong className="text-emerald-700">Validasi / ACC Logbook</strong> pada setiap usulan konsultasi untuk memberikan e-paraf legal bimbingan.</li>
 </ul>
 </div>
 <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900 leading-relaxed font-semibold">
 Logbook konsultasi yang disetujui dosen adalah prasyarat pendaftaran kelulusan sidang mahasiswa secara otomatis.
 </div>
 </div>
 )}
 </div>

 {/* Accordion 3 (Dosen) */}
 <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
 expandedAccordion === "menguji" ? "border-[#0d9488] bg-[#fcfdfd]" : "border-slate-200 bg-white"
 }`}>
 <button
 onClick={() => setExpandedAccordion(expandedAccordion === "menguji" ? null : "menguji")}
 className="w-full px-4 py-3 flex items-center justify-between text-left gap-2 select-none cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
 expandedAccordion === "menguji" ? "bg-[#0d9488] text-white" : "bg-slate-100 text-slate-600"
 }`}>3</span>
 <div>
 <h4 className="text-xs font-black text-slate-800">Menilai Evaluasi Sidang Tugas Akhir</h4>
 <p className="text-[10px] text-slate-400 mt-0.5">Penilaian penguji, ulasan revisi & kunci nilai</p>
 </div>
 </div>
 <span>{expandedAccordion === "menguji" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
 </button>
 {expandedAccordion === "menguji" && (
 <div className="px-4 pb-4 pt-1.5 border-t border-slate-100 bg-white space-y-3">
 <div className="text-[11.5px] text-slate-600 leading-relaxed font-semibold space-y-2">
 <p>Langkah penginputan komponen nilai ujian di Academics:</p>
 <ul className="list-inside list-decimal space-y-2 text-slate-650 pt-1 border-l-2 border-emerald-100 pl-3">
 <li>Masuk ke menu <span className="text-teal-700 font-bold">Jadwal Menguji</span>.</li>
 <li>Klik tombol <strong className="text-emerald-700">Input Nilai</strong> pada jadwal mahasiswa bersangkutan.</li>
 <li>Isikan rincian nilai komponen (Metodologi, Presentasi, Orisinalitas Naskah).</li>
 <li>Sertakan revisi tertulis dan submit nilai ke prodi untuk kelulusan tugas akhir murni.</li>
 </ul>
 </div>
 </div>
 )}
 </div>
 </>
 )}

 {/* ====== ADMIN ACCORDIONS ====== */}
 {userGuideRole === "Admin" && (
 <>
 {/* Accordion 1 (Admin) */}
 <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
 expandedAccordion === "assign_mhs" ? "border-[#0d9488] bg-[#fcfdfd]" : "border-slate-200 bg-white"
 }`}>
 <button
 onClick={() => setExpandedAccordion(expandedAccordion === "assign_mhs" ? null : "assign_mhs")}
 className="w-full px-4 py-3 flex items-center justify-between text-left gap-2 select-none cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
 expandedAccordion === "assign_mhs" ? "bg-[#0d9488] text-white" : "bg-slate-100 text-slate-600"
 }`}>1</span>
 <div>
 <h4 className="text-xs font-black text-slate-800">Penunjukan Dosen Pembimbing</h4>
 <p className="text-[10px] text-slate-400 mt-0.5">Plotting tim pembimbing S2 pascasarjana resmi</p>
 </div>
 </div>
 <span>{expandedAccordion === "assign_mhs" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
 </button>
 {expandedAccordion === "assign_mhs" && (
 <div className="px-4 pb-4 pt-1.5 border-t border-slate-100 bg-white space-y-3">
 <div className="text-[11.5px] text-slate-600 leading-relaxed font-semibold space-y-2">
 <p>Cara memetakan DOSBIM Utama & Pendamping untuk mahasiswa:</p>
 <ul className="list-inside list-decimal space-y-2 text-slate-650 pt-1 border-l-2 border-emerald-100 pl-3">
 <li>Masuk ke menu <span className="text-teal-700 font-bold">Assign Pembimbing</span>.</li>
 <li>Pilih mahasiswa yang status judulnya disetujui.</li>
 <li>Tentukan Pembimbing Utama (1) dan Pembimbing Kedua (2) dari daftar dosen fungsional.</li>
 <li>Tekan <strong className="text-teal-850 font-bold">Simpan Pemetaan</strong> agar status bimbingan aktif di portal masing-masing.</li>
 </ul>
 </div>
 </div>
 )}
 </div>

 {/* Accordion 2 (Admin) */}
 <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
 expandedAccordion === "verifikasi_sidang" ? "border-[#0d9488] bg-[#fcfdfd]" : "border-slate-200 bg-white"
 }`}>
 <button
 onClick={() => setExpandedAccordion(expandedAccordion === "verifikasi_sidang" ? null : "verifikasi_sidang")}
 className="w-full px-4 py-3 flex items-center justify-between text-left gap-2 select-none cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
 expandedAccordion === "verifikasi_sidang" ? "bg-[#0d9488] text-white" : "bg-slate-100 text-slate-600"
 }`}>2</span>
 <div>
 <h4 className="text-xs font-black text-slate-800">Verifikasi Dokumen Pendaftaran</h4>
 <p className="text-[10px] text-slate-400 mt-0.5">Kroscek administrasi syarat administrasi sidang</p>
 </div>
 </div>
 <span>{expandedAccordion === "verifikasi_sidang" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
 </button>
 {expandedAccordion === "verifikasi_sidang" && (
 <div className="px-4 pb-4 pt-1.5 border-t border-slate-100 bg-white space-y-3">
 <div className="text-[11.5px] text-slate-600 leading-relaxed font-semibold space-y-2">
 <p>Langkah validasi berkas fisik dan digital mahasiswa:</p>
 <ul className="list-inside list-decimal space-y-2 text-slate-650 pt-1 border-l-2 border-emerald-100 pl-3">
 <li>Masuk ke menu <span className="text-teal-700 font-bold">Verifikasi Pendaftaran</span> / <span className="text-teal-700 font-bold">Pendaftaran & Progress</span>.</li>
 <li>Ulas dokumen slip bank, TOEFL score, lembaran sanksi plagiarism, kartu bimbingan, & ACC dosen.</li>
 <li>Klik keputusan <strong className="text-green-700">Verifikasi</strong> untuk menyetujui, atau <strong className="text-red-700">Tolak</strong> disertai alasan penolakan detail.</li>
 </ul>
 </div>
 </div>
 )}
 </div>

 {/* Accordion 3 (Admin) */}
 <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
 expandedAccordion === "plotting_jadwal" ? "border-[#0d9488] bg-[#fcfdfd]" : "border-slate-200 bg-white"
 }`}>
 <button
 onClick={() => setExpandedAccordion(expandedAccordion === "plotting_jadwal" ? null : "plotting_jadwal")}
 className="w-full px-4 py-3 flex items-center justify-between text-left gap-2 select-none cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
 expandedAccordion === "plotting_jadwal" ? "bg-[#0d9488] text-white" : "bg-slate-100 text-slate-600"
 }`}>3</span>
 <div>
 <h4 className="text-xs font-black text-slate-800">Menjadwalkan Penguji & Ruangan</h4>
 <p className="text-[10px] text-slate-400 mt-0.5">Plotting tim penguji pasangan, waktu & ruang fisik/virtual</p>
 </div>
 </div>
 <span>{expandedAccordion === "plotting_jadwal" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
 </button>
 {expandedAccordion === "plotting_jadwal" && (
 <div className="px-4 pb-4 pt-1.5 border-t border-slate-100 bg-white space-y-3">
 <div className="text-[11.5px] text-slate-600 leading-relaxed font-semibold space-y-2">
 <p>Langkah rilis jadwal uji operasional kemahasiswaan:</p>
 <ul className="list-inside list-decimal space-y-2 text-slate-650 pt-1 border-l-2 border-emerald-100 pl-3">
 <li>Masuk ke menu <span className="text-teal-700 font-bold">Jadwal Sidang</span>.</li>
 <li>Klik <strong className="text-emerald-700">Atur Jadwal</strong> pada mahasiswa tervalidasi.</li>
 <li>Pilih Ketum Sidang, Sekretaris, dan Penguji Ahli. Atur Jam, Hari, Ruangan/Link Meet.</li>
 <li>Klik <strong className="text-teal-850">Rilis Jadwal Resmi</strong> agar memo undangan terdistribusi.</li>
 </ul>
 </div>
 </div>
 )}
 </div>
 </>
 )}

 </div>
 </div>

 {/* Inotna AI assistance block banner */}
 <div className="bg-[#f0fdfa] border border-[#ccfbf1] rounded-xl p-4 flex gap-3.5 items-center shadow-xs">
 <div className="w-10 h-10 bg-[#0d9488] text-white rounded-full flex items-center justify-center shrink-0 shadow-xs">
 <Bot size={18} className="text-white" />
 </div>
 <div className="space-y-0.5">
 <h4 className="text-[11.5px] font-black text-slate-800">Menghadapi Kendala Alur Sistem?</h4>
 <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
 Tanyakan langsung berbagai aturan penulisan draf bab, orisinalitas abstrak atau pedoman tugas akhir ke asisten pintar <span className="font-extrabold text-[#0d9488]">Inotna AI</span> di pojok kanan bawah kapan saja!
 </p>
 </div>
 </div>
 </div>

 {/* BOTTOM SECTION: PUSAT UNDUHAN MANUAL & TEMPLATE DOKUMEN (DOWNLOAD CENTER FOR ALL ACTIONS) */}
 <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
 <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
 <span></span> Pusat Unduhan Manual & Buku Panduan Resmi
 </h3>
 <p className="text-[11px] text-slate-400 font-medium">
 Unduh instruksi operasional PDF terlengkap atau master file template (.docx) resmi Pascasarjana
 </p>
 </div>
 <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded inline-block">
 Arsip Terenkripsi v2.6
 </span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {[
 { 
 nama: "Buku_Panduan_Academics_Mahasiswa_v2.pdf", 
 label: "Manual Book Mahasiswa",
 desc: "Panduan lengkap pengajuan judul, logbook bimbingan, hingga pendaftaran ujian tugas akhir.",
 tipe: "PDF (1.2 MB)",
 color: "bg-red-50 text-red-700 border-red-150"
 },
 { 
 nama: "Buku_Panduan_Academics_Dosen_v2.pdf", 
 label: "Manual Book Dosen",
 desc: "Petunjuk detail bagi Dosen Pembimbing untuk memvalidasi logbook, memberikan review judul, & penilaian.",
 tipe: "PDF (1.5 MB)",
 color: "bg-red-50 text-red-700 border-red-150"
 },
 { 
 nama: "Buku_Panduan_Academics_Admin_v2.pdf", 
 label: "Manual Book Admin & Prodi",
 desc: "Instruksi khusus admin BAA & KPS untuk plotting penguji, validasi syarat, kelola cetak berita acara.",
 tipe: "PDF (1.8 MB)",
 color: "bg-red-50 text-red-700 border-red-150"
 },
 { 
 nama: "Template_Format_Naskah_Proposal_Tesis.docx", 
 label: "Template Proposal Tugas Akhir",
 desc: "Format baku Microsoft Word (margin, font, susunan bab) untuk submission proposal tugas akhir S2 Pasca.",
 tipe: "DOCX (340 KB)",
 color: "bg-blue-50 text-blue-700 border-blue-150"
 },
 { 
 nama: "Template_Format_Naskah_Tesis_Magister.docx", 
 label: "Template Tugas Akhir Akhir",
 desc: "Template resmi naskah lengkap Tugas Akhir Magister untuk pelaporan tugas akhir final simtesis.",
 tipe: "DOCX (450 KB)",
 color: "bg-blue-50 text-blue-700 border-blue-150"
 },
 { 
 nama: "SOP_Siklus_Akademik_Tesis_Pascasarjana.pdf", 
 label: "Flowchart SOP Tugas Akhir S2",
 desc: "SOP flowchart alur pendaftaran berpasangan, batas masa studi, dan validasi sidang kelayakan.",
 tipe: "PDF (980 KB)",
 color: "bg-emerald-50 text-emerald-700 border-emerald-150"
 }
 ].map((doc, idx) => (
 <div key={idx} className="border border-slate-200 hover:border-[#0d9488]/40 hover:bg-slate-50 rounded-xl p-4 flex flex-col justify-between transition-all duration-200">
 <div className="space-y-1.5">
 <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border inline-block ${doc.color}`}>
 {doc.tipe}
 </span>
 <h4 className="text-xs font-black text-slate-800 leading-tight">
 {doc.label}
 </h4>
 <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
 {doc.desc}
 </p>
 </div>

 <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
 <span className="text-[9px] font-mono text-slate-400 select-all truncate max-w-[140px] font-semibold">
 {doc.nama}
 </span>
 <button
 onClick={() => handleDownloadSystemDocument(doc.nama, doc.label)}
 className="px-3 py-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs shrink-0 select-none"
 >
 <span> Download</span>
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* TAB CONTENT 4: INTERACTIVE USER MANUAL */}
 {activeSubTab === "manual" && (
 <div className="space-y-6">
 {/* Header Banner */}
 <div className="bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white rounded-xl p-6 shadow-md relative overflow-hidden">
 <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
 <HelpCircle size={220} />
 </div>
 <div className="relative z-10 max-w-3xl space-y-2">
 <div className="bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded inline-block">
 Pusat Bantuan Resmi Academics
 </div>
 <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none">
 Panduan Interaktif Penggunaan Aplikasi
 </h2>
 <p className="text-xs text-emerald-100 font-medium md:max-w-xl">
 Temukan panduan praktis, tips profesional, dan petunjuk langkah-demi-langkah bagi Mahasiswa maupun Dosen Pembimbing untuk memaksimalkan seluruh fitur sistem.
 </p>
 </div>
 </div>

 {/* VIDEO TUTORIAL SECTION */}
 <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3.5 gap-3">
 <div>
 <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
 <span className="text-lg"></span> Video Panduan Cepat & Simulasi Sistem
 </h3>
 <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
 Tonton simulasi naskah, tata cara pengusulan judul, bimbingan online, dan ujian kelayakan di Academics
 </p>
 </div>
 
 {(currentUser.role === "Admin" || currentUser.role === "Superadmin") && (
 <button
 onClick={() => {
 setIsEditingVideoUrl(!isEditingVideoUrl);
 setVideoUrlInput(videoUrl);
 }}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-[#0d9488] hover:text-white hover:border-[#0d9488] text-[10.5px] font-extrabold transition-all cursor-pointer shadow-sm ml-auto sm:ml-0"
 >
 <Edit size={13} />
 <span>{isEditingVideoUrl ? "Batal Edit" : "Kelola Link Video"}</span>
 </button>
 )}
 </div>

 {/* Admin Video URL Management Form */}
 {isEditingVideoUrl && (
 <form onSubmit={handleSaveVideoUrl} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3">
 <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
 âš™ Atur Tautan Video Manual Penggunaan
 </h4>
 <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
 Pasang URL file video (.mp4) langsung agar dosen dan mahasiswa dapat menyimak tutorial terbaru.
 </p>
 <div className="flex flex-col sm:flex-row gap-2">
 <input
 type="url"
 value={videoUrlInput}
 onChange={(e) => setVideoUrlInput(e.target.value)}
 placeholder="https://domain.com/walkthrough.mp4"
 required
 className="form-input text-xs flex-1 bg-white"
 />
 <button type="submit" className="btn btn-primary text-xs flex items-center gap-1">
 <Save size={13} />
 <span>Terapkan</span>
 </button>
 </div>
 </form>
 )}

 {/* Simulated High-Fidelity Custom Video Display */}
 <div className="relative bg-slate-950 rounded-xl overflow-hidden shadow-md group border border-slate-800">
 <video
 ref={videoRef}
 src={videoUrl}
 onTimeUpdate={handleTimeUpdate}
 onLoadedMetadata={handleLoadedMetadata}
 onClick={() => setIsPlaying(!isPlaying)}
 className="w-full aspect-video object-contain"
 playsInline
 />

 {/* Centered Bigger Play Button (When Paused) */}
 {!isPlaying && (
 <div 
 onClick={() => setIsPlaying(true)}
 className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-all cursor-pointer group"
 >
 <div className="w-16 h-16 bg-[#0d9488] text-white rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:bg-teal-500 transition-all duration-300 relative">
 <Play size={28} className="fill-white translate-x-0.5" />
 <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-[#0d9488] opacity-30" />
 </div>
 </div>
 )}

 {/* Interactive Player Custom HUD Board */}
 <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 flex flex-col gap-2 transform translate-y-full group-hover:translate-y-0 focus-within:translate-y-0 transition-transform duration-300 no-print">
 {/* Custom timeline bar */}
 <div className="flex items-center gap-2">
 <input
 type="range"
 min={0}
 max={duration || 100}
 value={currentTime}
 onChange={(e) => handleSeek(parseFloat(e.target.value))}
 className="w-full h-1 bg-slate-700 accent-[#0d9488] rounded-lg appearance-none cursor-pointer hover:h-2 transition-all"
 />
 </div>

 {/* Sub-HUD Controls panel */}
 <div className="flex items-center justify-between text-white text-xs">
 <div className="flex items-center gap-3.5">
 {/* Play/Pause Button */}
 <button 
 onClick={() => setIsPlaying(!isPlaying)}
 className="hover:text-emerald-400 transition-colors cursor-pointer"
 >
 {isPlaying ? <Pause size={16} /> : <Play size={16} className="fill-white" />}
 </button>

 {/* Reload/Reset Button */}
 <button 
 onClick={() => handleSeek(0)}
 className="hover:text-emerald-400 transition-colors cursor-pointer"
 title="Reset Video"
 >
 <RotateCcw size={15} />
 </button>

 {/* Timer Frame */}
 <span className="font-mono text-[10.5px] tracking-wider text-slate-300">
 {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
 </span>
 </div>

 <div className="flex items-center gap-4">
 {/* Playback speed multiplier */}
 <div className="flex items-center gap-1">
 <span className="text-[10px] text-slate-400 font-bold">Kecepatan:</span>
 <select
 value={playbackRate}
 onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
 className="bg-black/60 text-white text-[10px] border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer outline-none"
 >
 <option value="0.75">0.75x</option>
 <option value="1">1.0x (Normal)</option>
 <option value="1.25">1.25x</option>
 <option value="1.5">1.5x</option>
 <option value="2">2.0x</option>
 </select>
 </div>

 {/* Custom simulated Volume bar */}
 <div className="flex items-center gap-1.5">
 <button 
 onClick={() => setIsMuted(!isMuted)}
 className="hover:text-emerald-400 transition-colors cursor-pointer"
 >
 {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
 </button>
 <input
 type="range"
 min={0}
 max={1}
 step={0.1}
 value={isMuted ? 0 : volume}
 onChange={(e) => {
 setVolume(parseFloat(e.target.value));
 setIsMuted(false);
 }}
 className="w-16 h-1 accent-[#0d9488] rounded-lg cursor-pointer max-sm:hidden"
 />
 </div>

 {/* Maximize */}
 <button 
 onClick={() => {
 if (videoRef.current?.requestFullscreen) {
 videoRef.current.requestFullscreen();
 }
 }}
 className="hover:text-emerald-400 transition-colors cursor-pointer"
 title="Layar Penuh"
 >
 <Maximize size={15} />
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Video Interactive Chapters/Timeline Navigation buttons */}
 <div className="space-y-2">
 <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
 Navigasi Lompat Bab (Alur Cepat):
 </h4>
 <div className="flex flex-wrap gap-2">
 {[
 { time: 0, title: " Pendahuluan", label: "0:00" },
 { time: 5, title: " Ajukan Judul", label: "0:05" },
 { time: 12, title: " Chat Konsultasi", label: "0:12" },
 { time: 18, title: " Cetak Kartu Log", label: "0:18" },
 { time: 24, title: " Daftar Sidang", label: "0:24" }
 ].map((chap, idx) => {
 const isActive = currentTime >= chap.time && (idx === 4 || currentTime < [0, 5, 12, 18, 24][idx + 1]);
 return (
 <button
 key={idx}
 onClick={() => handleSeek(chap.time)}
 className={`px-3 py-1.5 rounded-lg border text-[10.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
 isActive
 ? "bg-[#f0fdfa] border-[#0d9488] text-[#0d9488] font-black"
 : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-650"
 }`}
 >
 <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#0d9488] animate-ping" : "bg-slate-400"}`} />
 <span className="font-mono text-[9px] text-[#0d9488]">{chap.label}</span>
 <span>{chap.title}</span>
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* Role Filter Toggles */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <button
 onClick={() => setManualRole("Mahasiswa")}
 className={`p-4 rounded-xl border transition-all text-left flex items-center gap-4 cursor-pointer relative ${
 manualRole === "Mahasiswa"
 ? "border-[#0d9488] bg-[#f0fdfa] text-[#0d9488] shadow-sm"
 : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
 }`}
 >
 <div className={`p-2.5 rounded-lg shrink-0 ${manualRole === "Mahasiswa" ? "bg-[#0d9488] text-white" : "bg-slate-100 text-slate-500"}`}>
 <GraduationCap size={20} />
 </div>
 <div>
 <h4 className="text-xs font-bold leading-tight">Sebagai Mahasiswa</h4>
 <p className="text-[10px] text-slate-400 mt-0.5">Alur pengajuan judul, bimbingan, hingga pendaftaran ujian</p>
 </div>
 {manualRole === "Mahasiswa" && (
 <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0d9488]" />
 )}
 </button>

 <button
 onClick={() => setManualRole("Dosen")}
 className={`p-4 rounded-xl border transition-all text-left flex items-center gap-4 cursor-pointer relative ${
 manualRole === "Dosen"
 ? "border-[#0d9488] bg-[#f0fdfa] text-[#0d9488] shadow-sm"
 : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
 }`}
 >
 <div className={`p-2.5 rounded-lg shrink-0 ${manualRole === "Dosen" ? "bg-[#0d9488] text-white" : "bg-slate-100 text-slate-500"}`}>
 <Users size={20} />
 </div>
 <div>
 <h4 className="text-xs font-bold leading-tight">Sebagai Dosen</h4>
 <p className="text-[10px] text-slate-400 mt-0.5">Peninjauan judul, bimbingan konseling, hingga penilaian sidang</p>
 </div>
 {manualRole === "Dosen" && (
 <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0d9488]" />
 )}
 </button>
 </div>

 {/* Guidelines Body */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
 <div className="lg:col-span-8 space-y-4">
 <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
 <div>
 <h3 className="text-sm font-black text-slate-800">
 Langkah demi Langkah (Tahapan {manualRole})
 </h3>
 <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
 Selesaikan langkah-langkah di bawah untuk mempelajari fitur utama Academics
 </p>
 </div>
 <span className="text-[11px] font-bold text-[#0d9488] bg-[#f0fdfa] px-2.5 py-1 rounded-full shrink-0">
 {Object.keys(readSteps).filter(k => k.startsWith(manualRole === "Mahasiswa" ? "mhs-" : "dsn-") && readSteps[k]).length} dari {manualRole === "Mahasiswa" ? 6 : 5} Selesai
 </span>
 </div>

 {/* STEPS LIST */}
 <div className="space-y-4">
 {manualRole === "Mahasiswa" ? (
 // mahasiswa steps
 [
 {
 id: "mhs-1",
 title: "Mengajukan Usulan Judul Tugas Akhir Baru",
 desc: "Langkah pertama Anda adalah mengajukan tema atau judul usulan tugas akhir ke program studi. Caranya, buka panel navigasi kiri lalu pilih menu 'Ajukan Judul'. Lengkapi formulir berupa Judul, Abstrak Awal, Bidang Kajian, dan Rekomendasi Dosen Pembimbing yang Anda inginkan, kemudian klik tombol kirim. Anda bisa memantau status persetujuan usulan langsung dari halaman tersebut.",
 menu: "Menu: Ajukan Judul Tugas Akhir",
 icon: <Book size={18} className="text-teal-600" />
 },
 {
 id: "mhs-2",
 title: "Memulai Proses Bimbingan & Konsultasi Real-time",
 desc: "Setelah usulan judul Anda disetujui (Status: Diterima) oleh Ketua Prodi/Reviewer, sistem akan otomatis memetakan ruang konsultasi dengan Dosen Pembimbing Utama & Pendamping. Masuklah ke menu 'Konsultasi Bimbingan' di sidebar kiri. Di sini Anda dapat mengirim pesan chat, berkas naskah Bab I-V, dan mendapatkan koreksi catatan draf secara langsung dari dosen penanggungjawab.",
 menu: "Menu: Konsultasi Bimbingan",
 icon: <MessageSquare size={18} className="text-teal-600" />
 },
 {
 id: "mhs-3",
 title: "Mengaktifkan Panggilan Video Google Meet Resmi",
 desc: "Ingin melakukan face-to-face virtual luring dengan dosen? Dalam ruang chatting Konsultasi Bimbingan, Anda dapat menekan tombol 'Jadwalkan Meet' apabila dosen Anda belum membagikan link. Jika dosen bersangkutan telah menginput link Google Meet statis universitas melalui admin, link video interaktif tersebut akan otomatis tampil di bagian atas ruang obrolan Anda untuk langsung diakses kapan saja.",
 menu: "Menu: Chat Room & Google Meet",
 icon: <Play size={18} className="text-teal-600" />
 },
 {
 id: "mhs-4",
 title: "Mencetak Log Kartu Konsultasi Bimbingan Elektronik",
 desc: "Sebelum mendaftar seminar proposal atau hasil, Anda diwajibkan mengumpulkan bukti log bimbingan. Tidak perlu membuat manual, cukup tekan tombol 'Cetak Kartu Bimbingan' di bagian atas ruang konsultasi mahasiswa. Sistem secara otomatis mencetak lembaran log yang memuat materi bimbingan, tanggal, nama dosen, dan status validasi yang siap dilampirkan.",
 menu: "Menu: Cetak Kartu Konsultasi",
 icon: <FileSpreadsheet size={18} className="text-teal-600" />
 },
 {
 id: "mhs-5",
 title: "Mendaftarkan Ujian Kelayakan Akademik",
 desc: "Bila naskah draf telah di-ACC oleh Dosen Pembimbing, masuk ke menu pendaftaran ujian (Seminar Proposal / Seminar Hasil / Sidang Akhir Tugas Akhir). Isi draf pengusulan tanggal ujian serta unggah berkas naskah format PDF berikut slip setoran pembayaran dari Bank Kalbar. Bagian administrasi akan memvalidasi kelengkapan berkas Anda.",
 menu: "Menu: Daftar Seminar & Sidang",
 icon: <Calendar size={18} className="text-teal-600" />
 },
 {
 id: "mhs-6",
 title: "Mengoptimalkan Naskah Menggunakan Inotna AI",
 desc: "Butuh asisten pribadi 24 jam untuk mereview tata bahasa, abstrak, atau memberi masukan metodologi penelitian? Manfaatkan 'Inotna AI' (asisten AI Academics Universitas Muhammadiyah Pontianak) di pojok kanan bawah layar. Anda bisa bertanya saran judul alternatif, memperbaiki ejaan bahasa asing, hingga menerjemahkan abstrak ke Bahasa Inggris akademik dengan cepat.",
 menu: "Asisten Cerdas: Inotna AI (Pojok Kanan)",
 icon: <Bot size={18} className="text-teal-600" />
 }
 ].map((step, idx) => {
 const isRead = !!readSteps[step.id];
 return (
 <div 
 key={step.id} 
 className={`p-4 rounded-xl border transition-all relative overflow-hidden ${
 isRead ? "border-emerald-200 bg-emerald-50/20" : "border-slate-150 bg-slate-50/50 hover:bg-slate-50"
 }`}
 >
 <div className="flex gap-3.5 items-start">
 <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
 isRead ? "bg-emerald-100 border-emerald-200 text-emerald-800" : "bg-white border-slate-200 text-slate-600"
 }`}>
 {step.icon}
 </span>
 <div className="space-y-1.5 flex-1 pr-12">
 <div className="flex items-center gap-2">
 <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Langkah {idx+1}</span>
 {isRead && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded uppercase">Sudah Dipahami âœ”</span>}
 </div>
 <h4 className="text-xs font-black text-slate-800 leading-tight">{step.title}</h4>
 <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">{step.desc}</p>
 
 <div className="pt-1">
 <span className="text-[9.5px] font-bold text-emerald-800 bg-[#f0fdfa] border border-[#ccfbf1] px-2 py-0.5 rounded inline-block">
 {step.menu}
 </span>
 </div>
 </div>
 </div>

 <button
 onClick={() => {
 setReadSteps(prev => ({ ...prev, [step.id]: !prev[step.id] }));
 if (!isRead) showToast(`Langkah ${idx+1} ditandai sudah dipahami!`, "success");
 }}
 className={`absolute right-3 top-3.5 p-1 rounded-md border cursor-pointer transition-colors ${
 isRead 
 ? "bg-emerald-100 hover:bg-rose-100 border-emerald-200 hover:border-rose-200 text-emerald-800 hover:text-rose-600" 
 : "bg-white hover:bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600"
 }`}
 title={isRead ? "Tandai Belum Dipahami" : "Selesai Membaca"}
 >
 <CheckSquare size={13} />
 </button>
 </div>
 );
 })
 ) : (
 // dosen steps
 [
 {
 id: "dsn-1",
 title: "Melakukan Peninjauan & Persetujuan Judul",
 desc: "Ketika ada mahasiswa di bawah program prodi Anda mengusulkan usulan judul tugas akhir baru, Anda dapat mengeceknya di menu 'Peninjauan Judul' atau dari Dasbor Akademik. Pahami isi draf abstrak rumusan masalah, berikan saran/catatan revisi tertulis yang komprehensif, lalu ketuk tombol 'Terima Judul' jika usulan tersebut layak dikembangkan menjadi penelitian tugas akhir pascasarjana.",
 menu: "Menu: Peninjauan Judul Tugas Akhir",
 icon: <Award size={18} className="text-teal-600" />
 },
 {
 id: "dsn-2",
 title: "Mengelola Obrolan Chat Bimbingan Aktif",
 desc: "Akses menu 'Konsultasi Bimbingan' untuk memulai respons. Pilih mahasiswa yang mengajukan konsultasi aktif dari daftar obrolan. Anda bisa menulis feedback detail, men-download lampiran revisi dokumen Word/PDF dari mahasiswa, serta memantau intensitas frekuensi konsultasi bulanan masing-masing sub-mahasiswa.",
 menu: "Menu: Konsultasi Bimbingan",
 icon: <MessageSquare size={18} className="text-teal-600" />
 },
 {
 id: "dsn-3",
 title: "Memanfaatkan Alur Komunikasi Link Google Meet",
 desc: "Untuk menyelenggarakan bimbingan online tatap muka, Anda dapat memanfaatkan integrasi Google Meet. Caranya, Anda atau Admin dapat menambahkan tautan video konferensi mandiri resmi agar mahasiswa pembimbing Anda dapat langsung terhubung tanpa harus membuat tautan baru secara berulang-ulang di setiap sesi konsultasi obrolan.",
 menu: "Menu: Kelola Link Meet & Jadwal",
 icon: <Play size={18} className="text-teal-600" />
 },
 {
 id: "dsn-4",
 title: "Pengisian Formulir Nilai & Berita Acara Ujian (BA)",
 desc: "Bila mahasiswa bimbingan Anda melaksanakan Seminar Proposal, Seminar Hasil, atau Sidang Akhir Tugas Akhir, prodi akan menerbitkan plot jadwal. Masuklah ke menu 'Jadwal Menguji Saya' untuk memeriksa plot tanggal. Setelah ujian diselesaikan secara luring/online, isi masukan nilai, beri tanda checklist kelayakan, serta cetak surat bukti hadir penguji langsung dari sistem.",
 menu: "Menu: Jadwal Menguji Saya",
 icon: <Calendar size={18} className="text-teal-600" />
 },
 {
 id: "dsn-5",
 title: "Mengontrol Dasbor Statistik Beban Bimbingan",
 desc: "Untuk menjamin keadilan beban kerja akademik antar dosen pasca, silakan kunjungi menu 'Dashboard Utama'. Di sana tersaji grafik visual distribusi mahasiswa bimbingan Anda (sebagai Pembimbing Penguji Utama maupun Pendamping), trend history produktivitas draf bimbingan bulanan, serta tabel log aktivitas kelulusan mahasiswa binaan Anda.",
 menu: "Menu: Dashboard Statistik",
 icon: <FileSpreadsheet size={18} className="text-teal-600" />
 }
 ].map((step, idx) => {
 const isRead = !!readSteps[step.id];
 return (
 <div 
 key={step.id} 
 className={`p-4 rounded-xl border transition-all relative overflow-hidden ${
 isRead ? "border-emerald-200 bg-emerald-50/20" : "border-slate-150 bg-slate-50/50 hover:bg-slate-50"
 }`}
 >
 <div className="flex gap-3.5 items-start">
 <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
 isRead ? "bg-emerald-100 border-emerald-200 text-emerald-800" : "bg-white border-slate-200 text-slate-600"
 }`}>
 {step.icon}
 </span>
 <div className="space-y-1.5 flex-1 pr-12">
 <div className="flex items-center gap-2">
 <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Langkah {idx+1}</span>
 {isRead && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded uppercase">Sudah Dipahami âœ”</span>}
 </div>
 <h4 className="text-xs font-black text-slate-800 leading-tight">{step.title}</h4>
 <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">{step.desc}</p>
 
 <div className="pt-1">
 <span className="text-[9.5px] font-bold text-emerald-800 bg-[#f0fdfa] border border-[#ccfbf1] px-2 py-0.5 rounded inline-block">
 {step.menu}
 </span>
 </div>
 </div>
 </div>

 <button
 onClick={() => {
 setReadSteps(prev => ({ ...prev, [step.id]: !prev[step.id] }));
 if (!isRead) showToast(`Langkah ${idx+1} ditandai sudah dipahami!`, "success");
 }}
 className={`absolute right-3 top-3.5 p-1 rounded-md border cursor-pointer transition-colors ${
 isRead 
 ? "bg-emerald-100 hover:bg-rose-100 border-emerald-200 hover:border-rose-200 text-emerald-800 hover:text-rose-600" 
 : "bg-white hover:bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600"
 }`}
 title={isRead ? "Tandai Belum Dipahami" : "Selesai Membaca"}
 >
 <CheckSquare size={13} />
 </button>
 </div>
 );
 })
 )}
 </div>
 </div>
 </div>

 {/* Side info & FAQ Accordion */}
 <div className="lg:col-span-4 space-y-4">
 {/* Quick Tip Widget */}
 <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-xl space-y-2.5 shadow-sm">
 <div className="flex items-center gap-2 text-amber-800">
 <span className="text-lg"></span>
 <h4 className="text-xs font-black uppercase tracking-wider">Tips Profesional</h4>
 </div>
 <p className="text-[11px] text-amber-900/90 leading-relaxed font-semibold">
 Jika Anda mengalami hambatan pengisian berkas pendaftaran atau tidak menemukan nama dosen pembimbing Anda dalam pilihan otomatis, segera hubungi operator BAA Pascasarjana via menu chat bimbingan akademik/prodi untuk perbaikan penugasan.
 </p>
 </div>

 {/* FAQ Section */}
 <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3.5 shadow-sm">
 <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-2">
 <span>â“</span> Pertanyaan Populer (FAQ)
 </h3>
 
 <div className="space-y-3.5 text-left">
 <details className="group cursor-pointer">
 <summary className="text-[11.5px] font-bold text-slate-700 hover:text-[#0d9488] list-none flex justify-between items-center select-none">
 <span>Bagaimana jika link Google Meet error?</span>
 <span className="text-xs text-slate-400 transform group-open:rotate-180 transition-transform">â–¼</span>
 </summary>
 <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5 font-semibold">
 Jika link Google Meet dinamis gagal dibuat karena akun dosen belum terhubung, admin prodi dapat menginput menu link Google Meet resmi yang statis di akun pengaturan dosen pembimbing masing-masing dosen di pojok kanan atas.
 </p>
 </details>

 <details className="group cursor-pointer">
 <summary className="text-[11.5px] font-bold text-slate-700 hover:text-[#0d9488] list-none flex justify-between items-center select-none">
 <span>Apakah bimbingan chat disimpan?</span>
 <span className="text-xs text-slate-400 transform group-open:rotate-180 transition-transform">â–¼</span>
 </summary>
 <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5 font-semibold">
 Ya. Seluruh percakapan, tanggapan saran, revisi materi, serta dokumen bimbingan yang dikomunikasikan di platform Academics tersimpan permanen di basis data cloud sistem untuk kebutuhan pertanggungjawaban audit mutu tugas akhir.
 </p>
 </details>

 <details className="group cursor-pointer">
 <summary className="text-[11.5px] font-bold text-slate-700 hover:text-[#0d9488] list-none flex justify-between items-center select-none">
 <span>Berapa maksimal berkas upload PDF?</span>
 <span className="text-xs text-slate-400 transform group-open:rotate-180 transition-transform">â–¼</span>
 </summary>
 <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5 font-semibold">
 Maksimum batasan ukuran berkas PDF untuk melampirkan berkas naskah tugas akhir, abstrak, toefl sertifikat, slip pembayaran adalah 15 Megabyte (15 MB) per dokumen demi kenyamanan pengolahan berkas.
 </p>
 </details>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* TAB CONTENT 5: FAQ & HELPDESK MAHASISWA */}
 {activeSubTab === "faq-helpdesk" && (
 <div className="space-y-6">
 {/* Header Banner */}
 <div className="bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white rounded-xl p-6 shadow-md relative overflow-hidden">
 <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
 <HelpCircle size={220} />
 </div>
 <div className="relative z-10 max-w-3xl space-y-2">
 <div className="bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded inline-block">
 FAQ & Helpdesk Tiket
 </div>
 <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none text-white">
 Pusat Bantuan & Tiket Pengaduan Mahasiswa
 </h2>
 <p className="text-xs text-emerald-100 font-medium md:max-w-xl">
 Ajukan pertanyaan ke pihak akademik, konsultasikan masalah administrasi/sistem s2, dan pantau penyelesaian kendala Anda langsung oleh Admin Program Studi tanpa hambatan.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
 
 {/* LEFT COLUMN: FAQ & TICKETS */}
 <div className="lg:col-span-8 space-y-6">
 
 {/* FAQS SEGMENT */}
 <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4 shadow-sm text-left">
 <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
 <span>â“</span> Tanya Jawab Populer (Q&A Interaktif)
 </h3>
 
 <div className="space-y-3 text-left">
 <details className="group cursor-pointer bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-left">
 <summary className="text-[11.5px] font-extrabold text-slate-700 hover:text-[#0d9488] list-none flex justify-between items-center select-none">
 <span>Bagaimana batasan plagiasi Turnitin Academics?</span>
 <span className="text-xs text-slate-400 transform group-open:rotate-180 transition-transform">â–¼</span>
 </summary>
 <p className="text-[10.5px] text-slate-500 leading-relaxed mt-2 pl-1 font-semibold">
 Batas maksimal similarity Turnitin untuk pendaftaran seminar hasil dan sidang tugas akhir di Fakultas Ilmu Kesehatan adalah maksimal sebesar 25%. Mahasiswa disarankan menggunakan fitur &quot;Cek Similarity Otomatis&quot; di form pendaftaran sebelum mengajukan berkas resmi.
 </p>
 </details>

 <details className="group cursor-pointer bg-slate-50/50 p-3 rounded-lg border border-slate-100 font-sans text-left">
 <summary className="text-[11.5px] font-extrabold text-slate-700 hover:text-[#0d9488] list-none flex justify-between items-center select-none">
 <span>Bagaimana jika draf proposal ditolak oleh Admin?</span>
 <span className="text-xs text-slate-400 transform group-open:rotate-180 transition-transform">â–¼</span>
 </summary>
 <p className="text-[10.5px] text-slate-500 leading-relaxed mt-2 pl-1 font-semibold">
 Jika status pendaftaran Anda menjadi &quot;Ditolak&quot;, silakan buka riwayat pendaftaran Anda untuk membaca catatan/alasan penolakan. Anda dapat mengunggah berkas perbaikan langsung melalui tombol &quot;Edit/Unggah Ulang&quot; pendaftaran di sistem tanpa membuat pengusulan baru.
 </p>
 </details>

 <details className="group cursor-pointer bg-slate-50/50 p-3 rounded-lg border border-slate-100 font-sans text-left">
 <summary className="text-[11.5px] font-extrabold text-slate-700 hover:text-[#0d9488] list-none flex justify-between items-center select-none">
 <span>Bagaimana cara melakukan review etik protokol penelitian di KEPK?</span>
 <span className="text-xs text-slate-400 transform group-open:rotate-180 transition-transform">â–¼</span>
 </summary>
 <p className="text-[10.5px] text-slate-500 leading-relaxed mt-2 pl-1 font-semibold">
 Mahasiswa Program Studi Kesehatan Masyarakat wajib memiliki Surat Layak Etik dari Komite Etik Penelitian Kesehatan (KEPK). Caranya adalah menginput no protokol / surat keterangan kelayakan di kolom pendaftaran ujian dan mengunggah berkas bukti lolos kaji etik.
 </p>
 </details>

 <details className="group cursor-pointer bg-slate-50/50 p-3 rounded-lg border border-slate-100 font-sans text-left">
 <summary className="text-[11.5px] font-extrabold text-slate-700 hover:text-[#0d9488] list-none flex justify-between items-center select-none">
 <span>Dosen Pembimbing atau penguji saya belum merespon atau meng-ACC?</span>
 <span className="text-xs text-slate-400 transform group-open:rotate-180 transition-transform">â–¼</span>
 </summary>
 <p className="text-[10.5px] text-slate-500 leading-relaxed mt-2 pl-1 font-semibold">
 Anda dapat menggunakan fitur notifikasi &quot;Kirim Pengingat WhatsApp&quot; di dasbor atau mendaftarkan nomor dosen untuk mengirimkan tautan cepat RSVP. Tautan cepat RSVP memungkinkan dosen memberikan persetujuan konferensi langsung melalui smartphone mereka sekali klik.
 </p>
 </details>
 </div>
 </div>

 {/* TICKET VIEWER SECTION */}
 <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
 <div className="flex justify-between items-center border-b border-slate-100 pb-2">
 <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
 <span></span> Riwayat Tiket Bantuan &amp; Kendala
 </h3>
 <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
 {currentUser.role === "Mahasiswa" ? "Tiket Saya" : "Semua Tiket Masuk"}
 </span>
 </div>

 <div className="space-y-3.5">
 {(() => {
 const allTickets = state.helpdesktiket || [];
 const filteredTickets = currentUser.role === "Mahasiswa"
 ? allTickets.filter((t) => t.mahasiswaEmail === currentUser.email)
 : allTickets;

 if (filteredTickets.length === 0) {
 return (
 <div className="text-center py-8 text-slate-400 text-xs font-semibold">
 Tidak ada tiket bantuan yang tercatat saat ini.
 </div>
 );
 }

 return filteredTickets.map((t) => (
 <div key={t.id} className="border border-slate-200 rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow text-left">
 <div className="flex justify-between items-start gap-2 flex-wrap sm:flex-nowrap">
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-xs font-black text-slate-800">{t.subjek}</span>
 <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
 t.urgensi === "Tinggi"
 ? "bg-rose-50 text-rose-600 border border-rose-100"
 : t.urgensi === "Sedang"
 ? "bg-amber-50 text-amber-600 border border-amber-100"
 : "bg-slate-50 text-slate-600 border border-slate-100"
 }`}>
 Urgensi: {t.urgensi}
 </span>
 <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
 t.status === "Selesai"
 ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
 : t.status === "Diproses"
 ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
 : "bg-amber-50 text-amber-600 border border-amber-100"
 }`}>
 {t.status}
 </span>
 </div>
 <div className="text-[10px] text-slate-400 font-semibold mt-1">
 ID: {t.id} "¢ Dibuat oleh: {t.namaMahasiswa} ({t.mahasiswaEmail}) "¢ Tanggal: {t.tanggal}
 </div>
 </div>
 </div>

 <p className="text-[11px] text-slate-600 leading-relaxed font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-100">
 <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Deskripsi Masalah:</span>
 {t.deskripsi}
 </p>

 {t.tanggapan ? (
 <div className="bg-emerald-50/45 border border-emerald-100 rounded-lg p-3 text-[11px] text-left">
 <span className="text-[9px] font-black text-[#0d9488] block mb-1">TANGGAPAN ADMIN PRODI:</span>
 <p className="text-slate-700 font-semibold">{t.tanggapan}</p>
 <div className="text-[9px] text-emerald-600 font-bold mt-2 flex justify-between">
 <span>Oleh: {t.tanggapanOleh || "Admin Prodi"}</span>
 <span>Tanggal: {t.tanggalTanggapan || t.tanggal}</span>
 </div>
 </div>
 ) : (
 currentUser.role !== "Mahasiswa" && (
 <div className="space-y-2 pt-2 border-t border-slate-100">
 {tktSelectedReply === t.id ? (
 <div className="space-y-2">
 <textarea
 value={tktReplyText}
 onChange={(e) => setTktReplyText(e.target.value)}
 placeholder="Tulis tanggapan atau instruksi solusi..."
 rows={3}
 className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-[#0d9488] font-semibold text-slate-700"
 />
 <div className="flex gap-2 justify-end">
 <button
 type="button"
 onClick={() => {
 setTktSelectedReply(null);
 setTktReplyText("");
 }}
 className="px-3 py-1.5 text-[10px] font-bold border border-slate-200 rounded text-slate-500 cursor-pointer"
 >
 Batal
 </button>
 <button
 type="button"
 onClick={() => handleReplyTicket(t.id)}
 className="px-3 py-1.5 text-[10px] font-bold bg-[#0d9488] hover:bg-[#0f766e] text-white rounded cursor-pointer"
 >
 Kirim Tanggapan
 </button>
 </div>
 </div>
 ) : (
 <button
 type="button"
 onClick={() => {
 setTktSelectedReply(t.id);
 setTktReplyText("");
 }}
 className="px-3 py-1.5 text-[10.5px] font-bold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 cursor-pointer"
 >
 âœ Jawab &amp; Berikan Solusi
 </button>
 )}
 </div>
 )
 )}
 </div>
 ));
 })()}
 </div>
 </div>
 </div>

 {/* RIGHT COLUMN: NEW TICKET FORM */}
 <div className="lg:col-span-4 space-y-4">
 {currentUser.role === "Mahasiswa" ? (
 <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 text-left">
 <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center gap-2">
 <span></span> Buat Tiket Bantuan Baru
 </h3>
 
 <form onSubmit={handleSubmitTicket} className="space-y-4">
 <div>
 <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
 Kategori Masalah
 </label>
 <select
 value={tktKategori}
 onChange={(e) => setTktKategori(e.target.value)}
 className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-700 cursor-pointer"
 >
 <option value="Sistem">Sistem Academics (Error/Upload)</option>
 <option value="Administrasi">Administrasi Akademik (Biaya/Syarat)</option>
 <option value="Bimbingan">Komunikasi Bimbingan / Dosen</option>
 <option value="Lainnya">Lain-lain / Sarana</option>
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
 Subjek Singkat
 </label>
 <input
 type="text"
 value={tktSubjek}
 onChange={(e) => setTktSubjek(e.target.value)}
 placeholder="Contoh: Lampiran slip UKT tidak terbaca"
 className="w-full text-xs p-2 border border-slate-200 rounded font-semibold text-slate-700 outline-none focus:border-[#0d9488]"
 />
 </div>

 <div>
 <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
 Tingkat Urgensi
 </label>
 <div className="flex gap-2 text-left">
 {["Rendah", "Sedang", "Tinggi"].map((urg) => (
 <button
 key={urg}
 type="button"
 onClick={() => setTktUrgensi(urg as any)}
 className={`flex-1 py-1.5 rounded text-[10px] font-black border transition-all cursor-pointer ${
 tktUrgensi === urg
 ? urg === "Tinggi"
 ? "bg-rose-50 text-rose-600 border-rose-200 shadow-sm"
 : urg === "Sedang"
 ? "bg-amber-50 text-amber-600 border-amber-200 shadow-sm"
 : "bg-slate-100 text-slate-700 border-slate-200 shadow-sm"
 : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50 shadow-none border-slate-100/30"
 }`}
 >
 {urg}
 </button>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
 Deskripsi Kendala Detail
 </label>
 <textarea
 value={tktDeskripsi}
 onChange={(e) => setTktDeskripsi(e.target.value)}
 placeholder="Sebutkan langkah kejadian, kendala, atau pesan error..."
 rows={4}
 className="w-full text-xs p-2 border border-slate-200 rounded font-semibold text-slate-700 outline-none focus:border-[#0d9488]"
 />
 </div>

 <button
 type="submit"
 className="w-full py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 text-center font-extrabold"
 >
 <span>Kirim Tiket Pengaduan</span>
 </button>
 </form>
 </div>
 ) : (
 <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-xl space-y-2.5 shadow-sm text-left">
 <div className="flex items-center gap-2 text-amber-800">
 <span className="text-base"></span>
 <h4 className="text-xs font-black uppercase tracking-wider">Ruang Operator Prodi</h4>
 </div>
 <p className="text-[11px] text-amber-900/90 leading-relaxed font-semibold">
 Silakan periksa semua tiket kendala aktif dari mahasiswa. Setelah memberikan pembimbingan akademik atau solusi sistem, segera isi tanggapan tertulis untuk menyelesaikannya.
 </p>
 </div>
 )}
 </div>

 </div>
 </div>
 )}

 {/* MODAL WINDOW: ADD DOCUMENT / GUIDELINE (ADMIN ONLY) */}
 {showAddModal && (
 <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
 <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-slide-entry">
 
 {/* Modal Header */}
 <div className="px-5 py-4 bg-[#0d9488] text-white flex justify-between items-center">
 <div>
 <h3 className="text-sm font-extrabold tracking-tight">Formulir Publikasi Panduan / SOP Baru</h3>
 <p className="text-[10px] text-slate-200 font-semibold mt-0.5">Kirimkan berkas atau naskah panduan akademik resmi pascasarjana</p>
 </div>
 <button
 onClick={() => setShowAddModal(false)}
 className="text-white hover:text-slate-100 font-bold p-1 hover:bg-[#0f766e] rounded-lg transition-colors text-xs cursor-pointer"
 >
 Close
 </button>
 </div>

 {/* Modal Form */}
 <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
 
 {/* Judul Field */}
 <div className="space-y-1">
 <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
 Judul Panduan / SOP
 </label>
 <input
 type="text"
 required
 placeholder="Contoh: Lampiran Template Format Jurnal S2 Pasca"
 value={formJudul}
 onChange={(e) => setFormJudul(e.target.value)}
 className="w-full px-3 py-2 text-xs border border-slate-200 focus:ring-1 focus:ring-[#0d9488] rounded-lg focus:outline-none"
 />
 </div>

 {/* Kategori & Sub-kategori block */}
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1">
 <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
 Kategori Utama
 </label>
 <select
 value={formKategori}
 onChange={(e) => setFormKategori(e.target.value as any)}
 className="w-full px-3 py-2 text-xs border border-slate-200 focus:ring-1 focus:ring-[#0d9488] rounded-lg focus:outline-none bg-white cursor-pointer"
 >
 <option value="Panduan">Buku Panduan</option>
 <option value="SOP">Regulasi / SOP</option>
 </select>
 </div>

 <div className="space-y-1">
 <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
 Sub-Kategori
 </label>
 <select
 value={formSubKategori}
 onChange={(e) => setFormSubKategori(e.target.value)}
 className="w-full px-3 py-2 text-xs border border-slate-200 focus:ring-1 focus:ring-[#0d9488] rounded-lg focus:outline-none bg-white cursor-pointer"
 >
 <option value="Sistematika Penulisan">Sistematika Penulisan</option>
 <option value="Bimbingan">Alur Bimbingan</option>
 <option value="Seminar Proposal">Seminar Proposal</option>
 <option value="Seminar Hasil">Seminar Hasil</option>
 <option value="Sidang Tugas Akhir">Sidang Tugas Akhir</option>
 <option value="Administrasi Keuangan">Administrasi Keuangan</option>
 <option value="Aturan Umum">Aturan Umum / Lainnya</option>
 </select>
 </div>
 </div>

 {/* Deskripsi Field */}
 <div className="space-y-1">
 <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
 Deskripsi Singkat / Point Utama
 </label>
 <textarea
 required
 rows={3}
 placeholder="Uraikan isi ringkas dokumen agar memudahkan mahasiswa memahami poin atau instruksi tertulis..."
 value={formDeskripsi}
 onChange={(e) => setFormDeskripsi(e.target.value)}
 className="w-full px-3 py-2 text-xs border border-slate-200 focus:ring-1 focus:ring-[#0d9488] rounded-lg focus:outline-none resize-none"
 />
 </div>

 {/* File Upload selector container */}
 <div className="space-y-1.5">
 <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
 Lampiran Dokumen Tambahan (PDF/Word)
 </label>
 <div className="p-4 border border-dashed border-slate-200 bg-slate-50/50 rounded-lg text-center relative hover:bg-slate-50 transition-colors">
 <input
 type="file"
 accept=".pdf,.doc,.docx"
 onChange={handleFileUpload}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 />
 <div className="space-y-1.5 flex flex-col items-center">
 <Upload className="text-slate-400" size={18} />
 <span className="text-[11px] text-slate-500 font-bold block">
 {uploadedFileName ? `Selesai: ${uploadedFileName}` : "Klik / Seret berkas PDF ke area ini"}
 </span>
 <span className="text-[9px] text-slate-400 block font-semibold">
 Dokumen resmi universitas maksimal 15 MB
 </span>
 </div>
 </div>
 </div>

 {/* Actions Footer block */}
 <div className="flex gap-2.5 pt-2 justify-end border-t border-slate-100">
 <button
 type="button"
 onClick={() => setShowAddModal(false)}
 className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
 >
 Batal
 </button>
 <button
 type="submit"
 className="px-5 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
 >
 Publikasi Sekarang
 </button>
 </div>

 </form>
 </div>
 </div>
 )}

 </div>
 );
}


