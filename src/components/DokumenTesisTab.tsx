import React, { useState, useEffect } from "react";
import { 
 FileText, 
 UploadCloud, 
 Download, 
 Trash2, 
 Search, 
 Plus, 
 Send, 
 Users, 
 Calendar, 
 Paperclip,
 CheckCircle,
 FileDown,
 Info,
 Eye
} from "lucide-react";
import { AppState, Pengguna, DokumenTesis } from "../types";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

interface DokumenTesisTabProps {
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

export function DokumenTesisTab({ currentUser, state, mutate, showToast }: DokumenTesisTabProps) {
 const [searchQuery, setSearchQuery] = useState("");
 const [filterRole, setFilterRole] = useState("all");
 const [filterType, setFilterType] = useState("all");
 const [activeSubTab, setActiveSubTab] = useState<"received" | "sent" | "perbaikan" | "all">(() => {
 if (currentUser.role === "Admin" || currentUser.role === "Superadmin" || currentUser.role === "Prodi") {
 return "all";
 }
 return "received";
 });

 // State variables for Perbaikan Tugas Akhir & Gemini suggestion
 const [perbaikanDosen, setPerbaikanDosen] = useState("");
 const [perbaikanCatatan, setPerbaikanCatatan] = useState("");
 const [perbaikanFile, setPerbaikanFile] = useState<{
 data: string;
 name: string;
 size: string;
 } | null>(null);
 const [geminiSuggestion, setGeminiSuggestion] = useState<string>("");
 const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);

 // Active checklist for Yudisium and graduation procedure
 const [checklistSteps, setChecklistSteps] = useState<{ id: string; label: string; completed: boolean }[]>(() => {
 const saved = localStorage.getItem(`yudisium_checklist_${currentUser.email}`);
 if (saved) {
 try { return JSON.parse(saved); } catch (e) {}
 }
 return [
 { id: "step1", label: "Penyusunan & Penggabungan Berkas Tugas Akhir Lengkap", completed: false },
 { id: "step2", label: "Unggah Dokumen Perbaikan (PDF Final Tugas Akhir) Pasca Sidang", completed: false },
 { id: "step3", label: "Verifikasi & Validasi ACC Kelayakan Kelulusan oleh Pembimbing", completed: false },
 { id: "step4", label: "Urus Bebas Pinjam Perpustakaan & Penyerahan Salinan Hardcopy", completed: false },
 { id: "step5", label: "Unggah Jurnal Penelitian ke SINTA / Repositori Institusi Magister", completed: false },
 { id: "step6", label: "Pendaftaran Berkas Yudisium & Persyaratan Wisuda Resmi", completed: false }
 ];
 });

 // Sync state database with checklist
 useEffect(() => {
 if (currentUser.role === "Mahasiswa") {
 const myDoc = (state.dokumenTesis || []).find(
 (doc) => doc.isPerbaikanTesis && doc.mahasiswaEmail === currentUser.email
 );
 setChecklistSteps((prev) =>
 prev.map((s) => {
 if (s.id === "step1" || s.id === "step2") {
 return { ...s, completed: !!myDoc };
 }
 if (s.id === "step3") {
 return { ...s, completed: myDoc?.statusReview === "Disetujui" };
 }
 return s;
 })
 );
 }
 }, [state.dokumenTesis, currentUser.role, currentUser.email]);

 // Persist local checklist state modifications
 useEffect(() => {
 localStorage.setItem(`yudisium_checklist_${currentUser.email}`, JSON.stringify(checklistSteps));
 }, [checklistSteps, currentUser.email]);

 const toggleChecklistStep = (id: string) => {
 // Prevent manual toggling for database synced stages (step1, step2, step3)
 if (id === "step1" || id === "step2" || id === "step3") {
 showToast("Langkah ini otomatis terverifikasi sistem berdasarkan berkas unggahan Anda.", "warning");
 return;
 }
 setChecklistSteps((prev) =>
 prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
 );
 showToast("Progress langkah Yudisium berhasil diperbarui!", "success");
 };

 const handlePerbaikanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (!file.name.endsWith(".pdf")) {
 showToast("Berkas perbaikan harus berformat PDF (.pdf)!", "warning");
 return;
 }

 const sizeKb = (file.size / 1024).toFixed(1);
 const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
 const formattedSize = parseFloat(sizeMb) > 0.9 ? `${sizeMb} MB` : `${sizeKb} KB`;

 const reader = new FileReader();
 reader.onload = (event) => {
 const base64Data = event.target?.result as string;
 setPerbaikanFile({
 data: base64Data,
 name: file.name,
 size: formattedSize
 });
 };
 reader.readAsDataURL(file);
 };

 const handlePerbaikanSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!perbaikanFile) {
 showToast("Silakan pilih dokumen PDF perbaikan Tugas Akhir terlebih dahulu.", "warning");
 return;
 }
 if (!perbaikanDosen) {
 showToast("Silakan tentukan Dosen Pembimbing untuk memverifikasi berkas.", "warning");
 return;
 }

 const currentStudent = (state.mahasiswa || []).find((m) => m.email === currentUser.email);
 const mhsJudul = currentStudent?.judul || "Judul Tugas Akhir";

 const newDoc: DokumenTesis = {
 id: `CORR_${Date.now()}`,
 mahasiswaEmail: currentUser.email,
 namaMahasiswa: currentUser.nama,
 judulTesis: mhsJudul,
 namaFile: perbaikanFile.name,
 tipeFile: "PDF",
 ukuranFile: perbaikanFile.size,
 fileData: perbaikanFile.data,
 pengirimRole: "Mahasiswa",
 pengirimNama: currentUser.nama,
 penerimaEmail: perbaikanDosen,
 tanggal: new Date().toISOString().replace("T", " ").substring(0, 16),
 catatan: perbaikanCatatan || "Dokumen revisi pasca sidang tugas akhir selesai.",
 isPerbaikanTesis: true,
 statusReview: "Belum Direview"
 };

 try {
 // 1. Add final document
 await mutate("dokumenTesis", "add", newDoc, undefined, undefined, true);
 
 // 2. Automate student status to "Lulusan"
 if (currentStudent) {
 const updatedStudent = { ...currentStudent, status: "Lulusan" as const };
 await mutate("mahasiswa", "update", updatedStudent, "id", currentStudent.id, true);
 }

 setPerbaikanFile(null);
 setPerbaikanCatatan("");
 setPerbaikanDosen("");
 showToast("Dokumen Perbaikan TUGAS AKHIR berhasil dikirim! Status Anda kini terdaftar sebagai LULUSAN ??", "success");
 } catch (err) {
 showToast("Gagal menyimpan dokumen perbaikan.", "error");
 }
 };

 // Upload state
 const [isUploadOpen, setIsUploadOpen] = useState(false);
 const [uploadedFile, setUploadedFile] = useState<{
 data: string;
 name: string;
 type: "Word" | "PDF";
 size: string;
 } | null>(null);
 const [previewDoc, setPreviewDoc] = useState<DokumenTesis | null>(null);

 // Form selections and parameters
 const [judulTesisInput, setJudulTesisInput] = useState("");
 const [penerimaEmailInput, setPenerimaEmailInput] = useState("");
 const [catatanInput, setCatatanInput] = useState("");
 const [targetMhsEmailInput, setTargetMhsEmailInput] = useState("");

 // Helper matching to identify student's supervisors/examiners
 const getStudentBimbingan = (mhsEmail: string) => {
 const student = (state.mahasiswa || []).find((m) => m.email === mhsEmail);
 if (!student) return null;
 return (state.bimbingan || []).find((b) => b.mahasiswaId === student.id);
 };

 const getDosenName = (email: string) => {
 const d = (state.dosen || []).find((lect) => lect.email === email);
 return d ? d.nama : email;
 };

 const getStudentName = (email: string) => {
 const m = (state.mahasiswa || []).find((stud) => stud.email === email);
 return m ? m.nama : email;
 };

 // Helper to check if a lecturer assists a given student
 const isLecturerForStudent = (lecturerEmail: string, studentEmail: string) => {
 const bimb = getStudentBimbingan(studentEmail);
 if (!bimb) return false;
 return (
 bimb.pembimbing1 === lecturerEmail ||
 bimb.pembimbing2 === lecturerEmail ||
 bimb.penguji1 === lecturerEmail ||
 bimb.penguji2 === lecturerEmail
 );
 };

 // Find supervisors list for currently logged in student
 const myAssignedLecturers = () => {
 if (currentUser.role !== "Mahasiswa") return [];
 const bimb = getStudentBimbingan(currentUser.email);
 if (!bimb) return [];
 const list = [];
 if (bimb.pembimbing1) list.push({ email: bimb.pembimbing1, role: "Pembimbing 1", nama: getDosenName(bimb.pembimbing1) });
 if (bimb.pembimbing2) list.push({ email: bimb.pembimbing2, role: "Pembimbing 2", nama: getDosenName(bimb.pembimbing2) });
 if (bimb.penguji1) list.push({ email: bimb.penguji1, role: "Penguji 1", nama: getDosenName(bimb.penguji1) });
 if (bimb.penguji2) list.push({ email: bimb.penguji2, role: "Penguji 2", nama: getDosenName(bimb.penguji2) });
 return list;
 };

 // Find students list assigned to currently logged in lecturer
 const myAssignedStudents = () => {
 if (currentUser.role !== "Dosen") return [];
 return (state.bimbingan || [])
 .filter((b) => 
 b.pembimbing1 === currentUser.email || 
 b.pembimbing2 === currentUser.email || 
 b.penguji1 === currentUser.email || 
 b.penguji2 === currentUser.email
 )
 .map((b) => {
 const student = (state.mahasiswa || []).find((m) => m.id === b.mahasiswaId);
 return student ? { email: student.email, nama: student.nama, nim: student.nim, judul: student.judul } : null;
 })
 .filter(Boolean) as { email: string; nama: string; nim: string; judul: string }[];
 };

 // File loading helper to read local file into Base64 format
 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 const allowedExtensions = [".pdf", ".doc", ".docx"];
 const isDoc = file.name.endsWith(".doc") || file.name.endsWith(".docx");
 const isPdf = file.name.endsWith(".pdf");

 if (!isDoc && !isPdf) {
 showToast("Berkas harus berupa file PDF atau Word (.doc, .docx)", "error");
 return;
 }

 const sizeKb = (file.size / 1024).toFixed(1);
 const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
 const formattedSize = parseFloat(sizeMb) > 0.9 ? `${sizeMb} MB` : `${sizeKb} KB`;

 const reader = new FileReader();
 reader.onload = (event) => {
 const base64Data = event.target?.result as string;
 setUploadedFile({
 data: base64Data,
 name: file.name,
 type: isPdf ? "PDF" : "Word",
 size: formattedSize
 });
 };
 reader.readAsDataURL(file);
 };

 // Download trigger
 const triggerDownload = (doc: DokumenTesis) => {
 try {
 const link = document.createElement("a");
 link.href = doc.fileData;
 link.download = doc.namaFile;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 showToast(`Mengunduh berkas: ${doc.namaFile}`, "success");
 } catch (err) {
 showToast("Gagal mengunduh berkas.", "error");
 }
 };

 // Perform upload dispatch
 const handleUploadSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!uploadedFile) {
 showToast("Silakan pilih dokumen Word / PDF terlebih dahulu.", "warning");
 return;
 }

 let finalRecipientEmail = penerimaEmailInput;
 let finalStudentEmail = "";
 let finalStudentName = "";
 let finalJudul = judulTesisInput;

 if (currentUser.role === "Mahasiswa") {
 finalStudentEmail = currentUser.email;
 finalStudentName = currentUser.nama;
 const matchingMhsRecord = state.mahasiswa.find((m) => m.email === currentUser.email);
 finalJudul = matchingMhsRecord?.judul || "Penyusunan Tugas Akhir";
 if (!finalRecipientEmail) {
 showToast("Silakan tentukan dosen penerima dokumen.", "warning");
 return;
 }
 } else if (currentUser.role === "Dosen") {
 if (!targetMhsEmailInput) {
 showToast("Silakan pilih mahasiswa tujuan.", "warning");
 return;
 }
 finalRecipientEmail = targetMhsEmailInput;
 finalStudentEmail = targetMhsEmailInput;
 finalStudentName = getStudentName(targetMhsEmailInput);
 const mRecord = state.mahasiswa.find((m) => m.email === targetMhsEmailInput);
 finalJudul = mRecord?.judul || judulTesisInput || "Bimbingan Tugas Akhir";
 } else {
 // Admin / Superadmin / Prodi
 if (!targetMhsEmailInput) {
 showToast("Silakan tentukan mahasiswa terkait untuk dokumen ini.", "warning");
 return;
 }
 finalStudentEmail = targetMhsEmailInput;
 finalStudentName = getStudentName(targetMhsEmailInput);
 const mRecord = state.mahasiswa.find((m) => m.email === targetMhsEmailInput);
 finalJudul = mRecord?.judul || judulTesisInput || "Dokumen Akademik Tugas Akhir";
 finalRecipientEmail = penerimaEmailInput || targetMhsEmailInput;
 }

 const newDoc: DokumenTesis = {
 id: `DOC_${Date.now()}`,
 mahasiswaEmail: finalStudentEmail,
 namaMahasiswa: finalStudentName,
 judulTesis: finalJudul,
 namaFile: uploadedFile.name,
 tipeFile: uploadedFile.type,
 ukuranFile: uploadedFile.size,
 fileData: uploadedFile.data,
 pengirimRole: currentUser.role,
 pengirimNama: currentUser.nama,
 penerimaEmail: finalRecipientEmail,
 tanggal: new Date().toISOString().replace("T", " ").substring(0, 16),
 catatan: catatanInput || "Tidak ada catatan pengantar."
 };

 try {
 await mutate("dokumenTesis", "add", newDoc, undefined, undefined, true);
 setIsUploadOpen(false);
 setUploadedFile(null);
 setCatatanInput("");
 setPenerimaEmailInput("");
 setTargetMhsEmailInput("");
 setJudulTesisInput("");
 showToast("Dokumen tugas akhir berhasil dikirim dan diarsipkan!", "success");
 } catch (err) {
 showToast("Gagal mengunggah dokumen.", "error");
 }
 };

 const handleDeleteDoc = async (id: string, fileName: string) => {
 if (confirm(`Apakah Anda yakin ingin menghapus dokumen "${fileName}" dari arsip?`)) {
 try {
 await mutate("dokumenTesis", "delete", {}, "id", id, true);
 showToast("Dokumen berhasil dihapus.", "success");
 } catch (err) {
 showToast("Gagal menghapus dokumen.", "error");
 }
 }
 };

 const RenderPerbaikanTesisView = () => {
 if (currentUser.role === "Mahasiswa") {
 const myPerbaikanDoc = (state.dokumenTesis || []).find(
 (doc) => doc.isPerbaikanTesis && doc.mahasiswaEmail === currentUser.email
 );
 const currentStudent = (state.mahasiswa || []).find((m) => m.email === currentUser.email);
 const mhsJudul = currentStudent?.judul || "-";

 return (
 <div className="space-y-6">
 {/* Main Card */}
 <div className="card p-6 border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-[var(--radius-lg)]">
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[var(--border-color)]">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-4xl shadow-sm border border-emerald-100">
 ??
 </div>
 <div>
 <h3 className="text-lg font-extrabold text-[var(--text-main)] flex items-center gap-2">
 Dokumen Perbaikan Tugas Akhir Pasca Sidang
 </h3>
 <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
 Ajukan revisi draf final tugas akhir Anda yang telah disidangkan untuk kelayakan proses Yudisium formal.
 </p>
 </div>
 </div>

 {currentStudent?.status === "Lulusan" || myPerbaikanDoc ? (
 <span className="px-4 py-2 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold tracking-wider uppercase rounded-full shadow-sm">
 ?? STATUS: LULUSAN (GRADUATED)
 </span>
 ) : (
 <span className="px-4 py-2 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-extrabold tracking-wider uppercase rounded-full shadow-sm">
 ? STATUS: AKTIF (MENUNGGU VERIFIKASI SELESAI)
 </span>
 )}
 </div>

 {/* Visual Milestones / Checklist Progress Bar */}
 <div className="my-6 p-5 bg-gradient-to-r from-emerald-50 to-teal-50/25 border border-emerald-100 rounded-[var(--radius-lg)]">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
 <div>
 <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
 ?? Alur & Proses Persiapan Yudisium Kelulusan
 </h4>
 <p className="text-[11px] text-slate-500 font-semibold leading-normal">
 Pantau tahapan kelulusan Anda. Langkah awal wajib disinkronkan oleh verifikasi sistem, sementara langkah administratif lainnya dapat Anda checklist mandiri setelah dikerjakan.
 </p>
 </div>
 <div className="text-right shrink-0">
 <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full whitespace-nowrap">
 Selesai: {checklistSteps.filter(s => s.completed).length} dari {checklistSteps.length} Langkah ({Math.round((checklistSteps.filter(s => s.completed).length / checklistSteps.length) * 100)}%)
 </span>
 </div>
 </div>

 {/* Progress Line */}
 <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-5">
 <div 
 className="bg-emerald-600 h-full transition-all duration-500 ease-out"
 style={{ width: `${(checklistSteps.filter(s => s.completed).length / checklistSteps.length) * 100}%` }}
 />
 </div>

 {/* Steps grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
 {checklistSteps.map((step, idx) => {
 const isAutomatic = ["step1", "step2", "step3"].includes(step.id);
 return (
 <div 
 key={step.id}
 onClick={() => toggleChecklistStep(step.id)}
 className={`p-3.5 border rounded-lg transition-all text-left font-semibold text-xs cursor-pointer select-none flex items-start gap-2.5 ${
 step.completed 
 ? "bg-white border-emerald-300 shadow-sm" 
 : "bg-white/60 border-slate-200 hover:border-slate-300 text-slate-600"
 }`}
 >
 <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-extrabold ${
 step.completed
 ? "bg-emerald-100 text-emerald-800"
 : "bg-slate-100 text-slate-500"
 }`}>
 {step.completed ? "?" : idx + 1}
 </div>
 <div className="flex-1 space-y-1">
 <p className={`font-bold leading-snug ${step.completed ? "text-slate-900 line-through decoration-slate-400" : "text-slate-700"}`}>
 {step.label}
 </p>
 <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
 isAutomatic 
 ? "bg-blue-50 text-blue-700" 
 : "bg-amber-50 text-amber-700"
 }`}>
 {isAutomatic ? "? Sinkron Sistem" : "? Checklist Mandiri"}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* If Student Already Uploaded */}
 {myPerbaikanDoc ? (
 <div className="pt-6 space-y-6">
 <div className="p-5 bg-emerald-50/50 border border-emerald-200/60 rounded-[var(--radius-lg)] space-y-4">
 <div className="flex items-start gap-4">
 <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
 <CheckCircle size={24} />
 </div>
 <div className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed flex-1">
 <h4 className="text-base font-extrabold text-emerald-950">Berkas Perbaikan Berhasil Diunggah!</h4>
 <p className="text-xs text-emerald-800 mt-1">
 Sistem telah mendeteksi dokumen akhir PDF Tugas Akhir Anda. Status pendaftaran kelulusan Anda di Academics saat ini telah bertransformasi sepenuhnya menjadi <b>Lulusan</b>.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs border-t border-emerald-100 font-semibold text-emerald-900">
 <div>
 <span className="text-emerald-700/80 font-bold block mb-1">Nama File PDF Tugas Akhir:</span>
 <span className="text-emerald-950 font-extrabold flex items-center gap-1.5 break-all">
 ?? {myPerbaikanDoc.namaFile} ({myPerbaikanDoc.ukuranFile})
 </span>
 </div>
 <div>
 <span className="text-emerald-700/80 font-bold block mb-1">Dosen Reviewer/Validator:</span>
 <span className="text-emerald-950 font-extrabold">
 ????? {getDosenName(myPerbaikanDoc.penerimaEmail)}
 </span>
 </div>
 <div>
 <span className="text-emerald-700/80 font-bold block mb-1">Tanggal Pengiriman:</span>
 <span className="text-emerald-950 font-extrabold">
 ?? {myPerbaikanDoc.tanggal} WIB
 </span>
 </div>
 <div>
 <span className="text-emerald-700/80 font-bold block mb-1">Verifikasi Pembimbing:</span>
 {myPerbaikanDoc.statusReview === "Disetujui" ? (
 <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1">
 ? DISETUJUI & DIVALIDASI oleh {myPerbaikanDoc.dosenReceivedNama} pada {myPerbaikanDoc.dosenReceivedTanggal}
 </span>
 ) : (
 <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1">
 ? MENUNGGU DI-ACC OLEH DOSEN PEMBIMBING
 </span>
 )}
 </div>
 </div>

 <div className="flex gap-2.5 justify-end pt-2">
 <button
 onClick={() => triggerDownload(myPerbaikanDoc)}
 className="btn bg-[var(--brand-primary)] hover:bg-[#4338ca] text-white text-xs px-4 py-1.5 rounded flex items-center gap-1 font-bold cursor-pointer transition"
 >
 <Download size={13} /> Unduh Berkas Final Anda
 </button>
 </div>
 </div>

 {/* Gemini Recommendation Section */}
 <div className="p-6 bg-slate-50 border border-slate-200 rounded-[var(--radius-lg)] space-y-4">
 <div className="flex items-center gap-2 text-[var(--text-main)]">
 <span className="text-lg">??</span>
 <h4 className="text-sm font-extrabold text-slate-900">
 Saran Prosedur & Kelayakan Yudisium - Gemini AI Smart Advisor
 </h4>
 </div>
 <p className="text-xs text-slate-600 font-medium leading-relaxed">
 Umpan balik personal dari kecerdasan buatan Gemini mengenai administrasi wisuda, tips upload jurnal SINTA, dan perlengkapan bebas perpustakaan pasca sidang Magister Universitas Muhammadiyah Pontianak berdasarkan topik tugas akhir Anda:
 </p>

 {geminiSuggestion ? (
 <div className="p-4 bg-white border border-slate-200 rounded-md shadow-inner text-xs leading-relaxed text-slate-800 overflow-y-auto max-h-[300px] whitespace-pre-wrap text-left font-medium">
 {geminiSuggestion}
 </div>
 ) : (
 <div className="pt-2 text-left">
 <button
 type="button"
 onClick={async () => {
 setIsGeneratingSuggestion(true);
 try {
 const p = `Mahasiswa Magister bernama ${currentUser.nama} (Judul Tugas Akhir: '${mhsJudul}') telah mengupload Dokumen Perbaikan Tugas Akhir Akhir pasca-sidang. Mohon berikan saran terstruktur (4 poin penting) bagi mahasiswa ini terkait apa saja berkas atau tahapan setelah bebas revisi ini agar siap mendaftar Yudisium / Wisuda (seperti bebas perpustakaan, unggah repository institusi, format metadata artikel jurnal SINTA, dll.). Sampaikan dengan bahasa ramah, mendalam, dan profesional dalam Bahasa Indonesia.`;
 const response = await fetch("/api/ai/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ prompt: p }),
 });
 const data = await response.json();
 if (data.result) {
 setGeminiSuggestion(data.result);
 } else {
 showToast("Gagal memanggil asisten Gemini.", "error");
 }
 } catch (err) {
 showToast("Kesalahan memanggil model.", "error");
 } finally {
 setIsGeneratingSuggestion(false);
 }
 }}
 disabled={isGeneratingSuggestion}
 className="btn bg-[var(--brand-primary)] hover:bg-[#4338ca] text-white text-xs px-4 py-2 rounded font-bold cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
 >
 {isGeneratingSuggestion ? "Memformulasikan Saran..." : "?? Hubungi Gemini AI: Hasilkan Saran Prosedur Yudisium"}
 </button>
 </div>
 )}
 </div>
 </div>
 ) : (
 /* If Student NOT Uploaded yet */
 <form onSubmit={handlePerbaikanSubmit} className="pt-6 space-y-5 text-left">
 <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-xs font-semibold text-amber-900 leading-relaxed">
 ?? <b>Ketentuan Penting:</b> Sebelum menekan tombol unggah, pastikan berkas Tugas Akhir lengkap Anda sudah disatukan dalam satu kesatuan dokumen utuh (termasuk naskah lengkap dari Cover sampai Lampiran, berformat PDF) dan telah disetujui reviewer sidang tugas akhir Anda. Setelah mengklik simpan, status Anda otomatis disetarakan sebagai <b>LULUSAN</b>.
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">
 Draf Tugas Akhir Lengkap Akhir (Format PDF) *
 </label>
 <div className="p-6 border-2 border-dashed border-[var(--border-color)] hover:border-[var(--brand-primary)] rounded-[var(--radius-md)] text-center transition-all duration-200 relative bg-[var(--bg-surface-hover)]">
 <input
 type="file"
 accept=".pdf"
 onChange={handlePerbaikanFileChange}
 required
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 />
 {!perbaikanFile ? (
 <div className="space-y-1">
 <UploadCloud className="mx-auto text-[var(--brand-primary)] animate-pulse" size={32} />
 <p className="text-xs font-bold text-[var(--text-main)]">
 Klik atau seret file PDF Anda ke sini
 </p>
 <p className="text-[10px] text-[var(--text-muted)] font-medium">
 Hanya mendukung dokumen PDF (.pdf) bebas proteksi
 </p>
 </div>
 ) : (
 <div className="flex items-center justify-center gap-2">
 <div className="p-2 rounded bg-red-100 text-red-700">
 <FileText size={24} />
 </div>
 <div className="text-left overflow-hidden">
 <p className="text-xs font-bold text-[var(--text-main)] max-w-[200px] truncate">
 {perbaikanFile.name}
 </p>
 <p className="text-[10px] text-slate-400 font-bold">
 {perbaikanFile.size} (Acrobat PDF)
 </p>
 </div>
 </div>
 )}
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">
 Dosen Pembimbing Penanggung Jawab *
 </label>
 <select
 value={perbaikanDosen}
 onChange={(e) => setPerbaikanDosen(e.target.value)}
 required
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2.5 font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 >
 <option value="">-- Pilih Dosen Pembimbing Utama/Pendamping --</option>
 {myAssignedLecturers().map((lect) => (
 <option key={lect.email} value={lect.email}>
 {lect.nama} ({lect.role})
 </option>
 ))}
 </select>
 </div>
 </div>

 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">
 Judul Tugas Akhir Terkait
 </label>
 <input
 type="text"
 disabled
 value={mhsJudul}
 className="text-xs w-full bg-slate-100 border border-[var(--border-color)] rounded p-2.5 font-semibold text-slate-500 cursor-not-allowed"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">
 Catatan Singkat / Ringkasan Revisi
 </label>
 <textarea
 rows={4}
 placeholder="Misalnya: 'Tugas Akhir sudah selesai diperbaiki sesuai saran penguji 1 (Bapak Dr. A) dan penguji 2 (Ibu B). Lembar pengesahan fungsional sudah dimasukkan.'"
 value={perbaikanCatatan}
 onChange={(e) => setPerbaikanCatatan(e.target.value)}
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2.5 font-semibold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
 />
 </div>
 </div>
 </div>

 <div className="pt-3 border-t border-[var(--border-color)] flex justify-end">
 <button
 type="submit"
 className="btn bg-[var(--brand-primary)] hover:bg-[#4338ca] text-white text-xs font-bold px-6 py-2.5 flex items-center gap-2 rounded shadow-md cursor-pointer transition duration-150"
 >
 <Send size={13} /> Kirim PDF Perbaikan & Daftarkan Kelulusan (Lulusan)
 </button>
 </div>
 </form>
 )}
 </div>
 </div>
 );
 }

 if (currentUser.role === "Dosen") {
 const perbaikanDocsForMe = (state.dokumenTesis || []).filter(
 (doc) => doc.isPerbaikanTesis && doc.penerimaEmail === currentUser.email
 );

 return (
 <div className="space-y-6">
 <div className="card p-6 border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-[var(--radius-lg)]">
 <div className="pb-4 border-b border-[var(--border-color)]">
 <h3 className="text-lg font-extrabold text-[var(--text-main)] flex items-center gap-2">
 Tanda Terima & Verifikasi Dokumen Perbaikan Tugas Akhir
 </h3>
 <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
 Berikut adalah draf final tugas akhir (PDF) pasca sidang dari mahasiswa magister bimbingan Anda. Silakan verifikasi, unduh naskah, dan validasi status kelulusan mereka.
 </p>
 </div>

 {perbaikanDocsForMe.length === 0 ? (
 <div className="p-12 text-center text-slate-400 font-bold bg-slate-50/50 rounded-lg border border-dashed border-slate-200 mt-6">
 ?? Belum ada mahasiswa bimbingan yang mengirim draf perbaikan tugas akhir.
 </div>
 ) : (
 <div className="space-y-4 mt-6">
 {perbaikanDocsForMe.map((doc) => {
 return (
 <div
 key={doc.id}
 className="p-5 border border-slate-200 rounded-lg hover:shadow-sm bg-white transition space-y-4 text-left font-semibold text-slate-800"
 >
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-3">
 <div>
 <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
 ?? {doc.namaMahasiswa}
 </h4>
 <span className="text-[10px] bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded text-slate-600">
 Email: {doc.mahasiswaEmail}
 </span>
 </div>
 <div>
 {doc.statusReview === "Disetujui" ? (
 <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
 ? VERIFIKASI SELESAI
 </span>
 ) : (
 <span className="px-2.5 py-1 bg-amber-100 border border-amber-200 text-amber-800 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
 ? MENUNGGU DI-ACC
 </span>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
 <div>
 <p className="text-slate-400 font-bold">Judul Tugas Akhir:</p>
 <p className="text-slate-900 leading-relaxed font-extrabold">{doc.judulTesis}</p>
 </div>
 <div>
 <p className="text-slate-400 font-bold">Nama Dokumen Tugas Akhir (PDF):</p>
 <p className="text-emerald-950 underline break-all font-extrabold flex items-center gap-1">
 ?? {doc.namaFile} ({doc.ukuranFile})
 </p>
 </div>
 <div className="md:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
 <p className="text-slate-400 font-bold block mb-1">Catatan Pengantar Mahasiswa:</p>
 <p className="text-slate-700 italic font-medium leading-relaxed">&ldquo;{doc.catatan}&rdquo;</p>
 </div>
 </div>

 <div className="flex flex-wrap gap-2 justify-between items-center pt-2 border-t border-slate-100">
 <div className="text-[10px] text-slate-400 font-bold">
 ?? Dikirim: {doc.tanggal}
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => triggerDownload(doc)}
 className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs py-1.5 px-3 rounded flex items-center gap-1 cursor-pointer font-bold"
 >
 <Download size={12} /> Unduh Naskah PDF
 </button>

 {doc.statusReview !== "Disetujui" && (
 <button
 onClick={async () => {
 if (confirm(`Apakah Anda yakin ingin memverifikasi draf tugas akhir final dari ${doc.namaMahasiswa}?`)) {
 try {
 const updatePayload = {
 statusReview: "Disetujui" as const,
 dosenReceivedNama: currentUser.nama,
 dosenReceivedTanggal: new Date().toISOString().replace("T", " ").substring(0, 10)
 };
 await mutate("dokumenTesis", "update", updatePayload, "id", doc.id, false);
 showToast(`Tanda terima tugas akhir kelulusan ${doc.namaMahasiswa} berhasil divalidasi!`, "success");
 } catch (err) {
 showToast("Gagal memproses verifikasi.", "error");
 }
 }
 }}
 className="bg-[var(--brand-primary)] hover:bg-[#4338ca] text-white text-xs py-1.5 px-3 rounded flex items-center gap-1 cursor-pointer font-extrabold shadow-sm"
 >
 ? Terima & Validasi Kelulusan
 </button>
 )}
 </div>
 </div>

 {/* Gemini abstract review suggestions card for Lecturers */}
 <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-200/60 rounded-md font-semibold text-xs space-y-3">
 <div className="flex items-center justify-between">
 <span className="flex items-center gap-1.5 font-extrabold text-emerald-900">
 ?? Gemini AI Academic Reviewer
 </span>
 </div>
 <div className="text-[11px] leading-relaxed font-semibold text-emerald-800">
 Gunakan asisten kecerdasan buatan Gemini untuk mengulas kesesuaian abstract, relevansi bibliografi, dan rekomendasi target jurnal kesehatan bereputasi untuk tugas akhir ini.
 </div>

 {geminiSuggestion && geminiSuggestion.includes(doc.id) ? (
 <div className="p-3 bg-white border border-emerald-200 rounded shadow-inner text-slate-800 font-medium whitespace-pre-wrap max-h-[250px] overflow-y-auto">
 {geminiSuggestion.replace(doc.id, "")}
 </div>
 ) : (
 <button
 type="button"
 onClick={async () => {
 setIsGeneratingSuggestion(true);
 try {
 const promptStr = `Reviewer Akademis Gemini, Dosen Pembimbing Utama bernama ${currentUser.nama} membutuhkan usulan tinjauan dan pedoman publikasi/abstract ilmiah dari naskah tugas akhir berjudul '${doc.judulTesis}' pasca-sidang di bidang Kesehatan Masyarakat. Berikan draf ringkas 3 pedoman penulisan jurnal dan 2 rekomendasi nama jurnal nasional SINTA 2 atau internasional yang sangat cocok untuk judul tugas akhir ini. Tulis dengan singkat, terstruktur, dan ilmiah.`;
 const resp = await fetch("/api/ai/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ prompt: promptStr }),
 });
 const dat = await resp.json();
 if (dat.result) {
 setGeminiSuggestion(`${doc.id}${dat.result}`);
 } else {
 showToast("Gagal memanggil Gemini AI.", "error");
 }
 } catch (e) {
 showToast("Gagal menghubungi layanan kecerdasan buatan.", "error");
 } finally {
 setIsGeneratingSuggestion(false);
 }
 }}
 disabled={isGeneratingSuggestion}
 className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] px-3 py-1.5 rounded font-bold cursor-pointer transition border border-emerald-800 flex items-center gap-1 disabled:opacity-60"
 >
 {isGeneratingSuggestion ? "Menganalisis..." : "?? Minta Rekomendasi Jurnal dari Gemini AI"}
 </button>
 )}
 </div>

 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 );
 }

 if (currentUser.role === "Admin" || currentUser.role === "Superadmin" || currentUser.role === "Prodi") {
 const allPerbaikanDocs = (state.dokumenTesis || []).filter(
 (doc) => doc.isPerbaikanTesis
 );

 return (
 <div className="space-y-6">
 <div className="card p-6 border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-[var(--radius-lg)]">
 <div className="pb-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h3 className="text-lg font-extrabold text-[var(--text-main)] flex items-center gap-2">
 Monitoring Berkas Perbaikan Tugas Akhir & Yudisium
 </h3>
 <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
 Pantau seluruh berkas perbaikan tugas akhir PDF yang dikirim oleh mahasiswa pasca sidang, lengkap dengan verifikasi pembimbing utama untuk prasyarat kelulusan.
 </p>
 </div>

 {allPerbaikanDocs.length > 0 && (
 <button
 type="button"
 onClick={async () => {
 setIsGeneratingSuggestion(true);
 try {
 const titles = allPerbaikanDocs.map(d => `- ${d.namaMahasiswa}: "${d.judulTesis}"`).join("\n");
 const promptStr = `Buat kelolaan ringkasan eksekutif riset lulusan magister (Yudisium) Universitas Muhammadiyah Pontianak berdasarkan judul tugas akhir berikut ini:\n${titles}\n\nBerikan 3 statistik tren riset mahasiswa akhir, peta kecenderungan rujukan teoretikal (Epidemiologis vs AKK vs Kesling), dan 1 saran metodologi kesehatan masyarakat modern. Buat dalam format formal yang elegan, bernada optimis, dan ringkas.`;
 const res = await fetch("/api/ai/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ prompt: promptStr }),
 });
 const rObj = await res.json();
 if (rObj.result) {
 setGeminiSuggestion(`global_${rObj.result}`);
 } else {
 showToast("Gagal memanggil Gemini AI.", "error");
 }
 } catch (e) {
 showToast("Progres analisis gagal dikoneksikan.", "error");
 } finally {
 setIsGeneratingSuggestion(false);
 }
 }}
 disabled={isGeneratingSuggestion}
 className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-1.5 shadow"
 >
 ?? Hasilkan Ringkasan Laporan Lulusan Magister (Gemini AI)
 </button>
 )}
 </div>

 {/* Global Gemini suggest frame for Admin/Prodi */}
 {geminiSuggestion && geminiSuggestion.startsWith("global_") && (
 <div className="mt-5 p-5 bg-teal-50 border border-teal-200 rounded-lg text-slate-800 text-xs space-y-4">
 <div className="flex justify-between items-center pb-2 border-b border-teal-100">
 <span className="font-extrabold text-teal-900 flex items-center gap-1.5">
 ?? Laporan Analitik Riset Lulusan yang Dihasilkan Gemini AI
 </span>
 <button
 onClick={() => setGeminiSuggestion("")}
 className="text-slate-400 hover:text-slate-700 text-sm font-bold"
 >
 Tutup
 </button>
 </div>
 <div className="font-medium leading-relaxed whitespace-pre-wrap max-h-[250px] overflow-y-auto">
 {geminiSuggestion.replace("global_", "")}
 </div>
 </div>
 )}

 {allPerbaikanDocs.length === 0 ? (
 <div className="p-12 text-center text-slate-400 font-bold bg-slate-50/50 rounded-lg border border-dashed border-slate-200 mt-6">
 ?? Belum ada data berkas perbaikan tugas akhir terunggah di database prodi.
 </div>
 ) : (
 <div className="table-container mt-6">
 <table className="data-table">
 <thead>
 <tr>
 <th>Mahasiswa (NIM)</th>
 <th>Dosen Validator</th>
 <th>Hasil Validasi</th>
 <th>Detail Dokumen</th>
 <th>Tindakan / Audit</th>
 </tr>
 </thead>
 <tbody>
 {allPerbaikanDocs.map((doc) => {
 const matchingMhs = (state.mahasiswa || []).find(m => m.email === doc.mahasiswaEmail);
 return (
 <tr key={doc.id}>
 <td>
 <p className="font-bold text-slate-950">{doc.namaMahasiswa}</p>
 <span className="font-mono text-[10px] text-slate-400 font-bold">NIM: {matchingMhs?.nim || "-"}</span>
 </td>
 <td>
 <p className="text-xs text-slate-700 font-semibold">{getDosenName(doc.penerimaEmail)}</p>
 </td>
 <td>
 {doc.statusReview === "Disetujui" ? (
 <span className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block">
 Disetujui oleh {doc.dosenReceivedNama}
 </span>
 ) : (
 <span className="bg-amber-50 border border-amber-300 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block">
 Menunggu Verifikasi
 </span>
 )}
 </td>
 <td>
 <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[170px]" title={doc.judulTesis}>
 <b>Topik:</b> "{doc.judulTesis}"
 </p>
 <p className="text-[10px] text-slate-400 font-bold break-all">
 <b>File:</b> {doc.namaFile}
 </p>
 </td>
 <td>
 <button
 onClick={() => triggerDownload(doc)}
 className="bg-[var(--brand-primary)] hover:bg-[#4338ca] text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm inline-flex items-center gap-1"
 >
 <Download size={11} /> Unduh PDF
 </button>
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

 return null;
 };

 // Main filtration logic
 const allDocs = state.dokumenTesis || [];

 const filteredDocs = allDocs.filter((doc) => {
 if (doc.isPerbaikanTesis) return false;

 // 1. Role-based view limitations
 const isSender = doc.mahasiswaEmail === currentUser.email || doc.pengirimNama === currentUser.nama;
 
 let passesAccessControl = false;

 if (currentUser.role === "Superadmin" || currentUser.role === "Admin" || currentUser.role === "Prodi") {
 // Admins and Prodi have complete access to all documents
 passesAccessControl = true;
 } else if (currentUser.role === "Mahasiswa") {
 // Students see what they sent, or what is explicitly sent to them
 const isTargeted = doc.penerimaEmail === currentUser.email || doc.penerimaEmail === "Semua" || doc.penerimaEmail === "Semua Mahasiswa";
 passesAccessControl = isSender || isTargeted;
 } else if (currentUser.role === "Dosen") {
 // Lecturers see what they sent, or what is explicitly sent to them or sent to "Semua Dosen" or "Pembimbing & Penguji" of a student they assist
 const isExplicitTarget = doc.penerimaEmail === currentUser.email || doc.penerimaEmail === "Semua" || doc.penerimaEmail === "Semua Dosen";
 const isMyStudentDoc = isLecturerForStudent(currentUser.email, doc.mahasiswaEmail);
 const isMyStudentGenericTarget = isMyStudentDoc && doc.penerimaEmail === "Pembimbing & Penguji";

 passesAccessControl = isSender || isExplicitTarget || isMyStudentGenericTarget || (isMyStudentDoc && doc.penerimaEmail === currentUser.email);
 }

 if (!passesAccessControl) return false;

 // 2. Sub-tab state splits
 if (activeSubTab === "received") {
 if (doc.pengirimNama === currentUser.nama) return false; // exclude ones I sent
 } else if (activeSubTab === "sent") {
 if (doc.pengirimNama !== currentUser.nama) return false; // only ones I sent
 }

 // 3. Search query filters
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 const matchFile = doc.namaFile.toLowerCase().includes(q);
 const matchMhs = doc.namaMahasiswa.toLowerCase().includes(q);
 const matchSender = doc.pengirimNama.toLowerCase().includes(q);
 const matchJudul = doc.judulTesis.toLowerCase().includes(q);
 const matchCatatan = doc.catatan?.toLowerCase().includes(q) || false;
 if (!matchFile && !matchMhs && !matchSender && !matchJudul && !matchCatatan) return false;
 }

 // 4. Role category filters
 if (filterRole !== "all") {
 if (doc.pengirimRole.toLowerCase() !== filterRole.toLowerCase()) return false;
 }

 // 5. File type filters
 if (filterType !== "all") {
 if (doc.tipeFile.toLowerCase() !== filterType.toLowerCase()) return false;
 }

 return true;
 }).reverse(); // Latest uploads first

 return (
 <div className="space-y-6 text-left">
 {/* Dynamic Header */}
 <div className="card-header pb-4 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-[var(--border-color)]">
 <div>
 <h2 className="text-xl font-extrabold text-[var(--text-main)] flex items-center gap-2">
 ?? Portal Dokumen Tugas Akhir
 </h2>
 <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
 Media pertukaran, bimbingan, and pengerjaan draf dokumen tugas akhir (Format PDF & Word) terintegrasi
 </p>
 </div>
 <div>
 <button
 onClick={() => setIsUploadOpen(true)}
 className="btn bg-[var(--brand-primary)] hover:bg-[#0b5440] text-white text-xs font-bold px-4 py-2 flex items-center gap-2 rounded shadow-sm cursor-pointer"
 >
 <Plus size={16} /> Unggah Dokumen Baru
 </button>
 </div>
 </div>

 {/* Info notice banner inside page */}
 <div className="p-4 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-[var(--radius-md)] flex items-start gap-3">
 <Info className="text-[var(--brand-primary)] shrink-0 mt-0.5" size={18} />
 <div className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed">
 <p className="text-[var(--text-main)] font-extrabold mb-0.5">Petunjuk Hak Akses Dokumen:</p>
 {currentUser.role === "Mahasiswa" && (
 <span>Semua dokumen draf tugas akhir yang Anda unggah otomatis dapat diakses dan direspon oleh Dosen Pembimbing Utama, Pembimbing Serta, Tim Penguji Sidang Anda, Kaprodi, serta jajaran Admin Layanan Tugas Akhir.</span>
 )}
 {currentUser.role === "Dosen" && (
 <span>Anda dapat memilih Mahasiswa bimbingan Anda sebagai penerima. Dokumen pengantar yang Anda lampirkan juga akan otomatis terlihat oleh jajaran Pimpinan Prodi & Administrasi Akademik untuk kebutuhan monitoring.</span>
 )}
 {(currentUser.role === "Prodi" || currentUser.role === "Admin" || currentUser.role === "Superadmin") && (
 <span>Sebagai {currentUser.role}, Anda memiliki wewenang penuh untuk memonitor, mengunduh, dan meninjau seluruh log berkas tugas akhir yang dikirimkan oleh mahasiswa maupun tim penguji/pembimbing.</span>
 )}
 </div>
 </div>

 {/* Navigation Filter Matrix */}
 <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-[var(--bg-surface-hover)] p-3 rounded-[var(--radius-md)] border border-[var(--border-color)]">
 {/* Navigation Tabs */}
 <div className="flex gap-1.5 border-b border-transparent flex-wrap">
 {(currentUser.role !== "Admin" && currentUser.role !== "Superadmin" && currentUser.role !== "Prodi") && (
 <>
 <button
 onClick={() => setActiveSubTab("received")}
 className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
 activeSubTab === "received"
 ? "bg-[var(--brand-primary)] text-white shadow-sm"
 : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)]"
 }`}
 >
 ?? Dokumen Diterima
 </button>
 <button
 onClick={() => setActiveSubTab("sent")}
 className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
 activeSubTab === "sent"
 ? "bg-[var(--brand-primary)] text-white shadow-sm"
 : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)]"
 }`}
 >
 ?? Riwayat Kiriman Saya
 </button>
 </>
 )}

 <button
 onClick={() => setActiveSubTab("perbaikan")}
 className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
 activeSubTab === "perbaikan"
 ? "bg-[var(--brand-primary)] text-white shadow-sm"
 : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)]"
 }`}
 >
 ?? {currentUser.role === "Mahasiswa" ? "Perbaikan Tugas Akhir & Kelulusan" : currentUser.role === "Dosen" ? "Verifikasi Kelulusan Mhs" : "Monitoring Perbaikan & Yudisium"}
 </button>

 <button
 onClick={() => setActiveSubTab("all")}
 className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
 activeSubTab === "all"
 ? "bg-[var(--brand-primary)] text-white shadow-sm"
 : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)]"
 }`}
 >
 ??? {currentUser.role === "Mahasiswa" || currentUser.role === "Dosen" ? "Semua Berkas Terkait" : "Semua Dokumen Program Studi"}
 </button>
 </div>

 {/* Dynamic Filters Form */}
 {activeSubTab !== "perbaikan" && (
 <div className="flex flex-wrap items-center gap-3">
 {/* Text Search input */}
 <div className="relative min-w-[200px] flex-1 sm:flex-initial">
 <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
 <Search size={14} />
 </span>
 <input
 type="text"
 placeholder="Cari nama file, mhs, judul..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="text-xs pl-8 pr-3 py-1.5 w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded focus:outline-none focus:border-[var(--brand-primary)] font-semibold text-[var(--text-main)]"
 />
 </div>

 {/* Filter sender role */}
 <select
 value={filterRole}
 onChange={(e) => setFilterRole(e.target.value)}
 className="text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded px-2.5 py-1.5 font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 >
 <option value="all">Semua Pengirim</option>
 <option value="mahasiswa">Siswa / Mahasiswa</option>
 <option value="dosen">Dosen Pembimbing/Penguji</option>
 <option value="prodi">Program Studi / Kaprodi</option>
 <option value="admin">Staf Admin</option>
 </select>

 {/* Filter File Type */}
 <select
 value={filterType}
 onChange={(e) => setFilterType(e.target.value)}
 className="text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded px-2.5 py-1.5 font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 >
 <option value="all">Semua Tipe File</option>
 <option value="pdf">Acrobat PDF (.pdf)</option>
 <option value="word">Microsoft Word (.docx)</option>
 </select>
 </div>
 )}
 </div>

 {/* Main Grid Collection of Documents */}
 {activeSubTab === "perbaikan" ? (
 RenderPerbaikanTesisView()
 ) : filteredDocs.length === 0 ? (
 <div className="p-12 text-center bg-[var(--bg-surface)] border border-dashed border-[var(--border-color)] rounded-[var(--radius-lg)]">
 <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-hover)] flex items-center justify-center text-4xl mx-auto mb-4">
 ??
 </div>
 <h4 className="text-sm font-bold text-[var(--text-main)]">Tidak ada dokumen ditemukan</h4>
 <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-2 font-medium">
 Belum ada berkas atau lampiran dokumen tugas akhir terunggah yang memenuhi kriteria pencarian dan kontrol filter Anda.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredDocs.map((doc) => {
 const isMyOwnFile = doc.pengirimNama === currentUser.nama;
 const isWord = doc.tipeFile === "Word";

 return (
 <div 
 key={doc.id}
 className="card hover:shadow-md transition-all duration-200 border border-[var(--border-color)] flex flex-col justify-between"
 >
 <div>
 {/* Card Header Area */}
 <div className="flex items-start justify-between gap-4 mb-3 pb-2 border-b border-[var(--border-color)]">
 <div className="flex items-center gap-2.5 overflow-hidden">
 <div className={`w-9 h-9 rounded flex items-center justify-center font-bold text-lg shrink-0 ${isWord ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
 <FileText size={20} />
 </div>
 <div className="overflow-hidden">
 <span className="text-[10px] font-bold tracking-wider uppercase bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-muted)] rounded px-1.5 py-0.5 inline-block">
 {doc.tipeFile}
 </span>
 <h4 className="text-xs font-bold text-[var(--text-main)] truncate mt-1" title={doc.namaFile}>
 {doc.namaFile}
 </h4>
 </div>
 </div>
 <span className="text-[10px] text-[var(--text-muted)] font-semibold shrink-0">
 {doc.ukuranFile}
 </span>
 </div>

 {/* Card Content parameters */}
 <div className="space-y-2 text-xs font-semibold mb-4 text-[var(--text-muted)]">
 <div>
 <span className="text-slate-400">Pengirim:</span>{" "}
 <span className="text-[var(--text-main)] font-extrabold">{doc.pengirimNama}</span>{" "}
 <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-1">{doc.pengirimRole}</span>
 </div>

 <div className="truncate">
 <span className="text-slate-400">Terkait Mhs:</span>{" "}
 <span className="text-[var(--text-main)]" title={doc.namaMahasiswa}>{doc.namaMahasiswa}</span>
 </div>

 <div className="line-clamp-2" title={doc.judulTesis}>
 <span className="text-slate-400">Judul Tugas Akhir:</span>{" "}
 <span className="text-[var(--text-main)] text-[11px] leading-relaxed">{doc.judulTesis}</span>
 </div>

 <div className="bg-[var(--bg-surface-hover)] p-2 rounded border border-[var(--border-color)] text-[11px]">
 <span className="text-slate-400 font-bold block mb-1">Catatan Pengantar:</span>
 <p className="text-[var(--text-main)] italic whitespace-pre-wrap leading-relaxed">
 &ldquo;{doc.catatan}&rdquo;
 </p>
 </div>
 </div>
 </div>

 {/* Footer and controls */}
 <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between mt-auto">
 <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-semibold">
 <Calendar size={11} />
 {doc.tanggal}
 </div>

 <div className="flex gap-2">
 {/* Delete capability if it belongs to the uploader */}
 {isMyOwnFile && (
 <button
 onClick={() => handleDeleteDoc(doc.id, doc.namaFile)}
 className="p-1 px-2.5 rounded bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition cursor-pointer text-xs"
 title="Hapus berkas dari arsip"
 >
 <Trash2 size={13} />
 </button>
 )}

 <button
 onClick={() => setPreviewDoc(doc)}
 className="btn bg-amber-500 hover:bg-amber-600 text-white text-xs px-2.5 py-1 flex items-center gap-1 cursor-pointer font-extrabold rounded"
 title="Pelajari berkas, baca pratinjau, dan tulis Koreksi/Review resmi"
 >
 <Eye size={12} /> Review
 </button>

 <button
 onClick={() => triggerDownload(doc)}
 className="btn bg-[var(--brand-primary)] hover:bg-[#4338ca] text-white text-xs px-2.5 py-1 flex items-center gap-1 cursor-pointer font-bold rounded"
 >
 <Download size={12} /> Unduh
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Upload document Modal layout overlay */}
 {isUploadOpen && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
 <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border-color)] overflow-hidden animate-slide-entry text-left">
 
 {/* Modal Header */}
 <div className="p-5 bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] flex justify-between items-center">
 <h3 className="text-sm font-bold tracking-tight text-[var(--text-main)] flex items-center gap-1.5">
 <UploadCloud size={16} className="text-[var(--brand-primary)]" />
 Unggah & Kirim Dokumen Tugas Akhir
 </h3>
 <button 
 onClick={() => {
 setIsUploadOpen(false);
 setUploadedFile(null);
 }} 
 className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl cursor-pointer font-bold"
 >
 �
 </button>
 </div>

 {/* Modal Body form */}
 <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
 {/* Attachment Drag-and-drop / selector area */}
 <div>
 <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">
 Lampiran Berkas *
 </label>
 <div className="p-5 border-2 border-dashed border-[var(--border-color)] hover:border-[var(--brand-primary)] rounded-[var(--radius-md)] text-center transition-all duration-200 relative">
 <input
 type="file"
 accept=".pdf,.doc,.docx"
 onChange={handleFileChange}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 />
 {!uploadedFile ? (
 <div className="space-y-1">
 <UploadCloud className="mx-auto text-[var(--brand-primary)]" size={32} />
 <p className="text-xs font-bold text-[var(--text-main)]">
 Klik atau seret file ke area ini
 </p>
 <p className="text-[10px] text-[var(--text-muted)]">
 Mendukung ekstensi PDF (.pdf) atau Word (.doc, .docx)
 </p>
 </div>
 ) : (
 <div className="flex items-center justify-center gap-2">
 <div className={`p-2 rounded ${uploadedFile.type === "Word" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
 <FileText size={24} />
 </div>
 <div className="text-left">
 <p className="text-xs font-bold text-[var(--text-main)] max-w-[200px] truncate">
 {uploadedFile.name}
 </p>
 <p className="text-[10px] text-slate-400 font-semibold">
 {uploadedFile.size} ({uploadedFile.type})
 </p>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Destination inputs based on Role */}

 {/* 1. STUDENT VIEW INPUTS */}
 {currentUser.role === "Mahasiswa" && (
 <div>
 <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
 Dosen Penerima Ditargetkan *
 </label>
 <p className="text-[10px] text-[var(--text-muted)] mb-1.5 font-semibold">
 Kirim draf kelayakan tugas akhir Anda ke dosen pembimbing atau reviewer penguji
 </p>
 <select
 value={penerimaEmailInput}
 onChange={(e) => setPenerimaEmailInput(e.target.value)}
 required
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2 font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 >
 <option value="">-- Pilih Tim Dosen Penerima --</option>
 <option value="Pembimbing & Penguji">Semua Pembimbing & Penguji Sidang</option>
 {myAssignedLecturers().map((lect) => (
 <option key={lect.email} value={lect.email}>
 {lect.nama} ({lect.role})
 </option>
 ))}
 </select>
 </div>
 )}

 {/* 2. LECTURER VIEW INPUTS */}
 {currentUser.role === "Dosen" && (
 <div>
 <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">
 Mahasiswa Tujuan Bimbingan Anda *
 </label>
 {myAssignedStudents().length === 0 ? (
 <p className="text-xs text-red-500 font-bold">
 ?? Anda belum memiliki mahasiswa bimbingan yang aktif di-assign. Hubungi Admin / Prodi.
 </p>
 ) : (
 <select
 value={targetMhsEmailInput}
 onChange={(e) => setTargetMhsEmailInput(e.target.value)}
 required
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2 font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 >
 <option value="">-- Pilih Mahasiswa Bimbingan --</option>
 {myAssignedStudents().map((stud) => (
 <option key={stud.email} value={stud.email}>
 {stud.nama} (NIM: {stud.nim})
 </option>
 ))}
 </select>
 )}
 </div>
 )}

 {/* 3. PRODI & ADMIN VIEW INPUTS */}
 {(currentUser.role === "Prodi" || currentUser.role === "Admin" || currentUser.role === "Superadmin") && (
 <div className="space-y-3">
 <div>
 <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
 Mahasiswa Terkait Dokumen Ini *
 </label>
 <select
 value={targetMhsEmailInput}
 onChange={(e) => setTargetMhsEmailInput(e.target.value)}
 required
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2 font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 >
 <option value="">-- Hubungkan dengan Mahasiswa --</option>
 {(state.mahasiswa || []).map((stud) => (
 <option key={stud.email} value={stud.email}>
 {stud.nama} (NIM: {stud.nim})
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
 Target Pengiriman Tambahan (Opsional)
 </label>
 <select
 value={penerimaEmailInput}
 onChange={(e) => setPenerimaEmailInput(e.target.value)}
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2 font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 >
 <option value="Semua">Semua (Seluruh Akses Publik & Prodi)</option>
 <option value="Pembimbing & Penguji">Pembimbing & Penguji Mahasiswa Terpilih</option>
 <option value="Semua Dosen">Semua Staf Dosen</option>
 <option value="Semua Mahasiswa">Semua Mahasiswa Aktif</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
 Judul / Topik Tugas Akhir (Opsional jika tidak memilih template mahasiswa)
 </label>
 <input
 type="text"
 placeholder="Masukkan judul tugas akhir khusus atau draf akademik"
 value={judulTesisInput}
 onChange={(e) => setJudulTesisInput(e.target.value)}
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2 font-semibold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)]"
 />
 </div>
 </div>
 )}

 {/* Note / Catatan Input Area */}
 <div>
 <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
 Catatan Ringkas / Pesan Pengantar
 </label>
 <textarea
 rows={3}
 placeholder="Misalnya: 'Mohon tinjau Bab 1 & Bab 2 revisi hasil bimbingan pekan lalu...'"
 value={catatanInput}
 onChange={(e) => setCatatanInput(e.target.value)}
 className="text-xs w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-2 font-semibold text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
 />
 </div>

 {/* Modal Footer Area */}
 <div className="pt-3 border-t border-[var(--border-color)] flex justify-end gap-2.5">
 <button
 type="button"
 onClick={() => {
 setIsUploadOpen(false);
 setUploadedFile(null);
 }}
 className="btn btn-secondary text-xs cursor-pointer rounded font-bold px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200"
 >
 Batal
 </button>
 <button
 type="submit"
 className="btn bg-[var(--brand-primary)] hover:bg-[#4338ca] text-white text-xs font-bold px-4 py-1.5 rounded flex items-center gap-1.5 cursor-pointer shadow"
 >
 <Send size={12} /> Kirim Dokumen
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Document Review Preview Modal Overlay */}
 {previewDoc && (
 <DocumentPreviewModal
 doc={previewDoc}
 currentUser={currentUser}
 onClose={() => setPreviewDoc(null)}
 mutate={mutate}
 showToast={showToast}
 />
 )}

 </div>
 );
}

