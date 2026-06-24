import React, { useState, useEffect, useRef } from "react";
import { 
 Send, 
 ChevronRight, 
 MessageSquare, 
 Plus, 
 Printer,
 FolderOpen,
 FileText,
 Download,
 UploadCloud,
 Trash2,
 Calendar,
 X,
 Paperclip,
 CheckCircle,
 HelpCircle,
 Video,
 Eye,
 Image as ImageIcon,
 Sparkles,
 Loader2,
 Maximize2,
 Minimize2,
 Bell,
 Volume2
} from "lucide-react";
import { Konsultasi, ChatMessage, Dosen, Mahasiswa, AppState, DokumenTesis } from "../types";
import { createGoogleCalendarEvent } from "../lib/googleCalendar";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { FileReviewModal } from "./FileReviewModal";

interface ChatRoomProps {
 consultations: Konsultasi[];
 currentUserEmail: string;
 currentUserName: string;
 userRole: "Dosen" | "Mahasiswa";
 lecturers: Dosen[];
 students: Mahasiswa[];
 onReply: (id: string, messageText: string, lampiran?: {lampiranData: string, lampiranNama: string, lampiranTipe: "Word"|"PDF", isKoreksi?: boolean}) => void;
 onNewTopic: (dosenEmail: string, subjek: string, pesanAwal: string) => void;
 onExport?: (session: Konsultasi) => void;
 state?: AppState;
 mutate?: (
 table: string, 
 action: "add" | "update" | "delete", 
 data: any, 
 keyCol?: string, 
 keyVal?: any
 ) => Promise<any>;
 showToast?: (msg: string, type?: "success" | "warning" | "error") => void;
 googleToken?: string | null;
 onConnectGoogle?: () => void;
}

export function ChatRoom({
 consultations,
 currentUserEmail,
 currentUserName,
 userRole,
 lecturers,
 students,
 onReply,
 onNewTopic,
 onExport,
 state,
 mutate,
 showToast,
 googleToken,
 onConnectGoogle,
}: ChatRoomProps) {
 const [activeSession, setActiveSession] = useState<Konsultasi | null>(null);
 const [replyText, setReplyText] = useState("");
 const [newTopicModal, setNewTopicModal] = useState(false);
 const [isExpanded, setIsExpanded] = useState(false);
 const [notifPermission, setNotifPermission] = useState<string>("Notification" in window ? Notification.permission : "unsupported");

 const handleTestNotification = () => {
 try {
 const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
 if (audioCtx.state === 'suspended') {
 audioCtx.resume();
 }
 
 const osc1 = audioCtx.createOscillator();
 const gain1 = audioCtx.createGain();
 
 osc1.type = "sine";
 osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
 gain1.gain.setValueAtTime(0, audioCtx.currentTime);
 gain1.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
 gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
 
 osc1.connect(gain1);
 gain1.connect(audioCtx.destination);
 
 const osc2 = audioCtx.createOscillator();
 const gain2 = audioCtx.createGain();
 
 osc2.type = "sine";
 osc2.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.1); // D6
 gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.1);
 gain2.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.13);
 gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
 
 osc2.connect(gain2);
 gain2.connect(audioCtx.destination);
 
 osc1.start();
 osc1.stop(audioCtx.currentTime + 1.5);
 
 osc2.start(audioCtx.currentTime + 0.1);
 osc2.stop(audioCtx.currentTime + 1.5);
 } catch (e) {
 console.warn("Audio Context alert sound test warning/unblocked:", e);
 }

 if ("Notification" in window) {
 if (Notification.permission !== "granted") {
 Notification.requestPermission().then((perm) => {
 setNotifPermission(perm);
 if (perm === "granted") {
 try {
 new Notification("Notifikasi Aktif!", {
 body: "Sistem alarm suara & banner pemberitahuan telah berhasil terhubung di peramban Anda.",
 tag: "simtesis-test"
 });
 } catch (err) {
 console.warn("Could not construct native Notification on this client device directly:", err);
 }
 if (showToast) showToast("Akses Notifikasi Sistem Berhasil Diaktifkan!", "success");
 } else {
 if (showToast) showToast("Akses Notifikasi ditolak oleh peramban.", "warning");
 }
 });
 } else {
 try {
 new Notification("Uji Suara & Notifikasi", {
 body: "Sinyal bimbingan standby: Berjalan lancar dan responsif!",
 tag: "simtesis-test"
 });
 } catch (err) {
 console.warn("Could not construct native Notification on this client device directly:", err);
 }
 if (showToast) showToast("Uji nada & notifikasi push berhasil dikirim!", "success");
 }
 } else {
 if (showToast) showToast("Keamanan browser membatasi Web Notification API.", "error");
 }
 };

 const [isReadingFile, setIsReadingFile] = useState(false);

 // Quick Academic Reply Suggestions (Bantuan Template Akademik)
 const quickTemplates = userRole === "Dosen" ? [
 { label: "Minta Perbaikan Bab", text: "Silakan perbaiki sistematika penulisan, sesuaikan perumusan masalah, serta lengkapi referensi sitasi minimal 10 tahun terakhir." },
 { label: "Konfirmasi Lanjut", text: "Secara keseluruhan substansi pembahasan pada bab ini sudah memadai. Silakan buat lanjutan draf bab berikutnya." },
 { label: "Rekomendasi Sidang", text: "Draf berkas tugas akhir ini telah disetujui. Silakan lanjut mendaftarkan berkas pada menu Administrasi Pendaftaran untuk seminar/sidang." },
 { label: "Saran Judul/Fokus", text: "Judul/fokus ini kurang tajam. Harap formulasikan kembali variabel penelitian agar memiliki kebaruan ilmiah (novelty) yang kuat." }
 ] : [
 { label: "Mohon Ulasan", text: "Selamat pagi Bapak/Ibu Dosen Pembimbing, mohon kesediaannya untuk meninjau draf bab tugas akhir terbaru yang telah saya unggah di sini. Terima kasih banyak." },
 { label: "Sudah Direvisi", text: "Berikut draf yang telah saya revisi dan sesuaikan sepenuhnya dengan masukan serta arahan Bapak/Ibu pada diskusi sebelumnya." },
 { label: "Izin Konsultasi", text: "Mohon izin bertanya Bapak/Ibu, apakah ada waktu luang minggu ini untuk mendiskusikan penentuan instrumen metodologi penelitian secara tatap muka?" }
 ];
 
 // Sidebar state for Documents
 const [showDocsSidebar, setShowDocsSidebar] = useState(true);
 const [previewDoc, setPreviewDoc] = useState<DokumenTesis | null>(null);
 const [previewAttachment, setPreviewAttachment] = useState<ChatMessage | null>(null);

 // Scheduling Google Meet Consultation
 const [showScheduleMeetForm, setShowScheduleMeetForm] = useState(false);
 const [meetDate, setMeetDate] = useState("");
 const [meetTime, setMeetTime] = useState("");
 const [meetDuration, setMeetDuration] = useState("60");
 const [isCreatingMeet, setIsCreatingMeet] = useState(false);

 // Inotna AI chat intelligence
 const [isQueryingChatAI, setIsQueryingChatAI] = useState(false);

 const handleGetChatAISuggestion = async () => {
 if (!activeSession) return;
 setIsQueryingChatAI(true);
 try {
 const subject = activeSession.subjek;
 const initialMessage = activeSession.pesan;
 const historyText = (activeSession.riwayatChat || [])
 .map(entry => `${entry.pengirim}: ${entry.pesan}`)
 .join("\n\n");

 const prompt = `Sebagai Inotna AI, Asisten Akademik Academics Universitas Muhammadiyah Pontianak, berikan draf balasan atau ulasan cerdas dan konstruktif (masukan/saran ilmiah) untuk membantu pengguna dengan peran "${userRole}" dalam menyusun tugas akhir ini.
Topik Tugas Akhir: "${subject}"
Pesan Khusus/Draf: "${initialMessage}"
Riwayat Percakapan Konsultasi:
${historyText || "(Belum ada jawaban konsultasi)"}

Tuliskan saran revisi, masukan metodologi, perbaikan tata bahasa, referensi, ataupun respons bimbingan yang sangat praktis, bersahabat, dan akademis. Jawab dengan draf respons siap-pakai secara langsung tanpa imbuhan pembuka formalitas panjang di awal (seperti "Berikut draf balasan Anda:") sehingga pengguna dapat langsung mengulas, merevisi kecil, dan mengirimkannya.`;

 const res = await fetch("/api/ai/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ prompt })
 });

 if (res.ok) {
 const data = await res.json();
 setReplyText(data.result.trim());
 if (showToast) showToast("Google AI berhasil merumuskan draf respons akademis!", "success");
 } else {
 if (showToast) showToast("Gagal memanggil asisten Google.", "error");
 }
 } catch (err) {
 console.error(err);
 if (showToast) showToast("Gagal menghubungi server AI.", "error");
 } finally {
 setIsQueryingChatAI(false);
 }
 };

 const handleCreateMeet = async () => {
 if (!meetDate || !meetTime) {
 if (showToast) showToast("Mohon tentukan tanggal dan waktu konsultasi.", "error");
 return;
 }
 
 setIsCreatingMeet(true);
 
 // Check if Dosen has static Meet Link configured by Admin
 const targetDosen = lecturers.find(d => d.email === activeSession?.dosenEmail);
 const staticMeetLink = targetDosen?.meetLink;
 
 if (staticMeetLink) {
 // Use assigned Meet Link from Admin
 try {
 if (mutate && activeSession) {
 await mutate("konsultasi", "update", {
 meetLink: staticMeetLink
 }, "id", activeSession.id);
 
 setActiveSession({
 ...activeSession,
 meetLink: staticMeetLink
 });
 }
 
 const invitationCard = `?? UNDANGAN KONSULTASI ONLINE (GOOGLE MEET)\n\nRapat video konsultasi bimbingan telah dijadwalkan pada:\n?? Tanggal: ${meetDate}\n? Waktu: ${meetTime} WIB\n? Durasi: ${meetDuration} Menit\n\nGabung langsung via tautan aman Google Meet (Link Dosen Resmi) berikut:\n?? ${staticMeetLink}`;

 onReply(activeSession!.id, invitationCard);
 
 setShowScheduleMeetForm(false);
 setMeetDate("");
 setMeetTime("");
 if (showToast) showToast("Jadwal Konsultasi berhasil dibuat menggunakan Link Dosen!", "success");
 } catch (err: any) {
 if (showToast) showToast(`Kesalahan: ${err.message || err}`, "error");
 } finally {
 setIsCreatingMeet(false);
 }
 return;
 }

 // Fallback to Dynamic Google Calendar integration if no static link
 if (!googleToken) {
 setIsCreatingMeet(false);
 if (showToast) showToast("Dosen ini belum memiliki referensi Link Meet. Silakan hubungkan akun Google Anda di bar atas untuk membuat link dinamis.", "warning");
 if (onConnectGoogle) onConnectGoogle();
 return;
 }
 
 try {
 const attendees = [activeSession?.mahasiswaEmail || "", activeSession?.dosenEmail || ""];
 const eventRes = await createGoogleCalendarEvent(googleToken, {
 summary: `Konsultasi Online Academics: ${activeSession?.subjek}`,
 description: `Rapat konsultasi terintegrasi antara Mahasiswa (${activeSession?.namaMahasiswa}) dan Dosen (${activeSession?.namaDosen}).\nSubjek: ${activeSession?.subjek}\nPesan bimbingan: ${activeSession?.pesan}`,
 tanggal: meetDate,
 waktu: meetTime,
 durationMinutes: parseInt(meetDuration),
 ruangan: "Google Meet",
 attendees: attendees
 });
 
 if (eventRes.meetLink) {
 if (mutate && activeSession) {
 await mutate("konsultasi", "update", {
 meetLink: eventRes.meetLink,
 calendarEventId: eventRes.id
 }, "id", activeSession.id);
 
 setActiveSession({
 ...activeSession,
 meetLink: eventRes.meetLink,
 calendarEventId: eventRes.id
 });
 }
 
 const invitationCard = `?? UNDANGAN KONSULTASI ONLINE (GOOGLE MEET)\n\nRapat video konsultasi bimbingan telah dijadwalkan pada:\n?? Tanggal: ${meetDate}\n? Waktu: ${meetTime} WIB\n? Durasi: ${meetDuration} Menit\n\nGabung langsung via tautan aman Google Meet berikut:\n?? ${eventRes.meetLink}`;

 onReply(activeSession!.id, invitationCard);
 
 setShowScheduleMeetForm(false);
 setMeetDate("");
 setMeetTime("");
 if (showToast) showToast("Google Meet video conference berhasil dijadwalkan!", "success");
 } else {
 if (showToast) showToast("Google Meet dibuat, tetapi link video gagal diambil. Hubungi admin.", "warning");
 }
 } catch (err: any) {
 console.error(err);
 if (showToast) showToast(`Kesalahan Google Calendar: ${err.message || err}`, "error");
 } finally {
 setIsCreatingMeet(false);
 }
 };

 // States for new topic form
 const [newDosenEmail, setNewDosenEmail] = useState("");
 const [newSubject, setNewSubject] = useState("");
 const [newFirstMessage, setNewFirstMessage] = useState("");

 // States for quick uploading from chat
 const [uploadedFile, setUploadedFile] = useState<{
 data: string;
 name: string;
 type: "Word" | "PDF";
 size: string;
 } | null>(null);
 const [catatanInput, setCatatanInput] = useState("");
 const [isUploading, setIsUploading] = useState(false);

 const chatContainerRef = useRef<HTMLDivElement>(null);

 // Filter consultations based on current user (including shared supervisor access)
 const mySessions = consultations.filter((c) => {
 if (userRole === "Mahasiswa") {
 return c.mahasiswaEmail.toLowerCase() === currentUserEmail.toLowerCase();
 } else {
 // Direct recipient of this consultation thread
 if (c.dosenEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
 return true;
 }
 // Shared Supervisor Access (Co-Pembimbing): If current lecturer is Pembimbing 1 or 2 for this student
 const studentObj = students.find((s) => s.email.toLowerCase() === c.mahasiswaEmail.toLowerCase());
 if (studentObj && state?.bimbingan) {
 const studentBimbingan = state.bimbingan.find((b) => b.mahasiswaId === studentObj.id);
 if (studentBimbingan) {
 const isPb1 = studentBimbingan.pembimbing1?.toLowerCase() === currentUserEmail.toLowerCase();
 const isPb2 = studentBimbingan.pembimbing2?.toLowerCase() === currentUserEmail.toLowerCase();
 if (isPb1 || isPb2) {
 return true;
 }
 }
 }
 return false;
 }
 });

 // Sync active session from latest polled consultations or select the first session as active initially
 useEffect(() => {
 if (mySessions.length > 0) {
 if (!activeSession) {
 setActiveSession(mySessions[0]);
 } else {
 const latestSessionState = mySessions.find((s) => s.id === activeSession.id);
 if (latestSessionState && JSON.stringify(latestSessionState) !== JSON.stringify(activeSession)) {
 setActiveSession(latestSessionState);
 }
 }
 } else if (activeSession) {
 setActiveSession(null);
 }
 }, [mySessions]);

 // Keep chat scrolled down
 useEffect(() => {
 if (chatContainerRef.current) {
 chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
 }
 }, [activeSession, activeSession?.riwayatChat?.length]);

 const handleSendReply = (e: React.FormEvent) => {
 e.preventDefault();
 if ((!replyText.trim() && !uploadedFile) || !activeSession) return;
 
 let lampiranD: any = undefined;
 if (uploadedFile) {
 lampiranD = {
 lampiranData: uploadedFile.data,
 lampiranNama: uploadedFile.name,
 lampiranTipe: uploadedFile.type,
 isKoreksi: userRole === "Dosen" && uploadedFile.name.toLowerCase().includes("koreksi") ? true : (userRole === "Dosen" ? true : false) // simple auto tag
 };
 }

 onReply(activeSession.id, replyText.trim() || (lampiranD ? "Mengirimkan lampiran dokumen." : ""), lampiranD);
 setReplyText("");
 setUploadedFile(null);
 
 // Optimistic local state update for activeSession
 const updatedHistory: ChatMessage[] = [
 ...(activeSession.riwayatChat || []),
 {
 pengirim: currentUserName,
 pesan: replyText.trim() || (lampiranD ? "Mengirimkan lampiran dokumen." : ""),
 waktu: new Date().toISOString(),
 ...(lampiranD || {})
 }
 ];
 setActiveSession({
 ...activeSession,
 riwayatChat: updatedHistory,
 status: userRole === "Dosen" ? "Dibalas" : "Menunggu"
 });

 // Instant viewport scroll adjustment
 setTimeout(() => {
 if (chatContainerRef.current) {
 chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
 }
 }, 40);
 };

 const handleDeleteMessage = (waktu: string) => {
 if (!activeSession || !mutate) return;
 
 const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus pesan bimbingan ini?");
 if (!confirmDelete) return;

 const filteredChat = (activeSession.riwayatChat || []).filter(msg => msg.waktu !== waktu);
 
 mutate("konsultasi", "update", {
 riwayatChat: filteredChat
 }, "id", activeSession.id);

 setActiveSession({
 ...activeSession,
 riwayatChat: filteredChat
 });

 if (showToast) {
 showToast("Pesan bimbingan berhasil dihapus.", "success");
 }
 };

 const handleStartNewTopic = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newDosenEmail || !newSubject.trim() || !newFirstMessage.trim()) return;

 onNewTopic(newDosenEmail, newSubject.trim(), newFirstMessage.trim());
 
 // Reset forms
 setNewDosenEmail("");
 setNewSubject("");
 setNewFirstMessage("");
 setNewTopicModal(false);
 };

 const formatChatTime = (isoString: string) => {
 const d = new Date(isoString);
 if (isNaN(d.getTime())) return isoString;
 return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
 };

 const getLawanBicaraLabel = (session: Konsultasi) => {
 return userRole === "Mahasiswa" ? session.namaDosen : session.namaMahasiswa;
 };

 // Get active student documents
 const activeStudentEmail = activeSession?.mahasiswaEmail?.toLowerCase();
 const relatedDocuments = (state?.dokumenTesis || []).filter((doc) => {
 if (!activeStudentEmail) return false;
 return doc.mahasiswaEmail.toLowerCase() === activeStudentEmail;
 }).reverse(); // Latest first

 // Handle local file reading
 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 const isDoc = file.name.endsWith(".doc") || file.name.endsWith(".docx");
 const isPdf = file.name.endsWith(".pdf");

 if (!isDoc && !isPdf) {
 if (showToast) {
 showToast("Berkas harus berupa file PDF atau Word (.doc, .docx)", "error");
 }
 return;
 }

 const sizeKb = (file.size / 1024).toFixed(1);
 const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
 const formattedSize = parseFloat(sizeMb) > 0.9 ? `${sizeMb} MB` : `${sizeKb} KB`;

 setIsReadingFile(true);

 const reader = new FileReader();
 reader.onload = (event) => {
 const base64Data = event.target?.result as string;
 setUploadedFile({
 data: base64Data,
 name: file.name,
 type: isPdf ? "PDF" : "Word",
 size: formattedSize
 });
 setIsReadingFile(false);
 // reset input value so they can select again if needed
 e.target.value = "";
 if (showToast) {
 showToast(`Berkas "${file.name}" berhasil diproses & siap dikirim!`, "success");
 }
 };
 reader.onerror = () => {
 setIsReadingFile(false);
 if (showToast) {
 showToast("Gagal membaca berkas.", "error");
 }
 };
 reader.readAsDataURL(file);
 };

 // Quick file upload submit handler inside ChatRoom context
 const handleQuickUploadSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!uploadedFile || !activeSession || !mutate || !showToast) return;

 setIsUploading(true);

 const studentInfo = students.find((s) => s.email.toLowerCase() === activeSession.mahasiswaEmail.toLowerCase());
 const judulTesis = studentInfo?.judul || "Penyusunan Tugas Akhir";

 // Receivers configuration:
 const isMhs = userRole === "Mahasiswa";
 const recipientEmail = isMhs ? activeSession.dosenEmail : activeSession.mahasiswaEmail;

 const newDoc: DokumenTesis = {
 id: `DOC_${Date.now()}`,
 mahasiswaEmail: activeSession.mahasiswaEmail,
 namaMahasiswa: activeSession.namaMahasiswa,
 judulTesis: judulTesis,
 namaFile: uploadedFile.name,
 tipeFile: uploadedFile.type,
 ukuranFile: uploadedFile.size,
 fileData: uploadedFile.data,
 pengirimRole: userRole,
 pengirimNama: currentUserName,
 penerimaEmail: recipientEmail,
 tanggal: new Date().toISOString().replace("T", " ").substring(0, 16),
 catatan: catatanInput || `Dokumen lampiran dalam sesi diskusi: ${activeSession.subjek}`
 };

 try {
 await mutate("dokumenTesis", "add", newDoc);
 setUploadedFile(null);
 setCatatanInput("");
 showToast("Dokumen berhasil diunggah and diarsip dalam konsultasi ini!", "success");
 } catch (err) {
 showToast("Gagal mengunggah berkas lampiran.", "error");
 } finally {
 setIsUploading(false);
 }
 };

 const triggerDownload = (doc: DokumenTesis) => {
 try {
 const link = document.createElement("a");
 link.href = doc.fileData;
 link.download = doc.namaFile;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 if (showToast) showToast(`Mengunduh berkas: ${doc.namaFile}`, "success");
 } catch (err) {
 if (showToast) showToast("Gagal mengunduh berkas.", "error");
 }
 };

 const handleDeleteDoc = async (id: string, fileName: string) => {
 if (confirm(`Apakah Anda yakin ingin menghapus dokumen "${fileName}" dari arsip?`)) {
 try {
 if (mutate) {
 await mutate("dokumenTesis", "delete", {}, "id", id);
 if (showToast) showToast("Dokumen berhasil dihapus dari arsip.", "success");
 }
 } catch (err) {
 if (showToast) showToast("Gagal menghapus dokumen.", "error");
 }
 }
 };

 const showLeftDir = !isExpanded || !activeSession;

 return (
 <div className={`flex flex-col lg:flex-row gap-6 text-left transition-all duration-300 ${isExpanded ? "h-[calc(100vh-90px)] min-h-[550px]" : "h-[calc(100vh-140px)]"}`}>
 
 {/* LEFT: SESSIONS DIRECTORY */}
 {showLeftDir && (
 <div className="w-full lg:w-[320px] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[var(--radius-lg)] flex flex-col overflow-hidden h-[245px] lg:h-auto shrink-0 shadow-sm animate-slide-entry">
 <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-surface-hover)]">
 <span className="font-extrabold text-sm text-[var(--text-main)]">Direktori Konsultasi</span>
 {userRole === "Mahasiswa" && (
 <button
 onClick={() => setNewTopicModal(true)}
 className="p-1 px-2.5 rounded-[var(--radius-sm)] bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
 >
 <Plus size={12} /> Baru
 </button>
 )}
 </div>

 <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
 {mySessions.length === 0 ? (
 <div className="p-8 text-center text-xs text-[var(--text-disabled)] font-medium">
 Belum ada riwayat bimbingan.
 </div>
 ) : (
 mySessions.map((session) => {
 const isActive = activeSession?.id === session.id;
 const isPendingMe = userRole === "Dosen" && session.status === "Menunggu";

 // Determine relationship badge (Pb 1 vs Pb 2 vs Co-Monitor)
 let relationshipBadge = null;
 try {
 const studentObj = students.find((s) => s.email.toLowerCase() === session.mahasiswaEmail.toLowerCase());
 if (userRole === "Dosen") {
 const isDirectRecipient = session.dosenEmail.toLowerCase() === currentUserEmail.toLowerCase();
 const studentBimbingan = studentObj && state?.bimbingan?.find((b) => b.mahasiswaId === studentObj.id);

 if (studentBimbingan) {
 const isPb1 = studentBimbingan.pembimbing1?.toLowerCase() === currentUserEmail.toLowerCase();
 const isPb2 = studentBimbingan.pembimbing2?.toLowerCase() === currentUserEmail.toLowerCase();

 const isThreadWithPb1 = session.dosenEmail.toLowerCase() === studentBimbingan.pembimbing1?.toLowerCase();
 const isThreadWithPb2 = session.dosenEmail.toLowerCase() === studentBimbingan.pembimbing2?.toLowerCase();

 if (isDirectRecipient) {
 if (isPb1) {
 relationshipBadge = (
 <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
 Pembimbing 1
 </span>
 );
 } else if (isPb2) {
 relationshipBadge = (
 <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
 Pembimbing 2
 </span>
 );
 }
 } else {
 if (isThreadWithPb1) {
 relationshipBadge = (
 <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase" title="Anda memantau sesi Pembimbing Utama">
 Sesi Pb 1 (Co-Monitor)
 </span>
 );
 } else if (isThreadWithPb2) {
 relationshipBadge = (
 <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase" title="Anda memantau sesi Pembimbing Pendamping">
 Sesi Pb 2 (Co-Monitor)
 </span>
 );
 }
 }
 }
 } else if (userRole === "Mahasiswa" && state?.bimbingan) {
 const myBimbingan = studentObj && state.bimbingan.find((b) => b.mahasiswaId === studentObj.id);
 if (myBimbingan) {
 const isThreadWithPb1 = session.dosenEmail.toLowerCase() === myBimbingan.pembimbing1?.toLowerCase();
 const isThreadWithPb2 = session.dosenEmail.toLowerCase() === myBimbingan.pembimbing2?.toLowerCase();
 if (isThreadWithPb1) {
 relationshipBadge = (
 <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 uppercase border border-emerald-200">
 Pembimbing 1
 </span>
 );
 } else if (isThreadWithPb2) {
 relationshipBadge = (
 <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 uppercase border border-blue-200">
 Pembimbing 2
 </span>
 );
 }
 }
 }
 } catch (e) {
 console.error("Error drawing relationship badge:", e);
 }

 return (
 <div
 key={session.id}
 onClick={() => setActiveSession(session)}
 className={`p-4 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
 isActive
 ? "bg-[var(--brand-light)] border-l-4 border-[var(--brand-primary)]"
 : "hover:bg-[var(--bg-surface-hover)]"
 }`}
 >
 <div className="overflow-hidden flex-1">
 <div className="flex items-center gap-2 mb-1">
 <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
 session.status === "Dibalas" ? "pill-success" : "pill-warning"
 }`}>
 {session.status}
 </span>
 {isPendingMe && (
 <span className="w-2 h-2 rounded-full bg-[var(--accent-danger)] animate-pulse" />
 )}
 {relationshipBadge}
 </div>
 <h4 className="text-xs font-bold text-[var(--text-main)] text-truncate">
 {session.subjek}
 </h4>
 <span className="text-[10px] text-[var(--text-muted)] font-medium block mt-0.5 text-truncate">
 {getLawanBicaraLabel(session)}
 </span>
 </div>
 <ChevronRight size={14} className="text-[var(--text-disabled)]" />
 </div>
 );
 })
 )}
 </div>
 </div>
 )}
 <div className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[var(--radius-lg)] flex flex-col overflow-hidden h-[calc(100vh-420px)] lg:h-auto text-left">
 {activeSession ? (
 <>
 {/* Active Header */}
 <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-surface-hover)] flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-left">
 <div>
 <h3 className="text-sm font-extrabold text-[var(--text-main)]">
 {activeSession.subjek}
 </h3>
 <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
 Sesi bersama: <b>{getLawanBicaraLabel(activeSession)}</b>
 </p>
 </div>
 <div className="flex flex-wrap gap-2 shrink-0">
 <button
 type="button"
 onClick={() => setShowScheduleMeetForm(!showScheduleMeetForm)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-[11px] font-bold border transition-all cursor-pointer shadow-sm ${
 showScheduleMeetForm 
 ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 font-extrabold" 
 : "bg-[var(--bg-card)] text-amber-700 dark:text-amber-400 border-[var(--border-color)] hover:bg-amber-50 dark:hover:bg-amber-950/20 font-extrabold"
 }`}
 title="Jadwalkan panggilan video Google Meet resmi"
 >
 <Video size={13} className="text-amber-500" />
 Jadwalkan Meet
 </button>
 {onExport && (
 <button
 onClick={() => onExport(activeSession)}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--brand-primary)] text-[11px] font-bold rounded-[var(--radius-sm)] transition-colors cursor-pointer shadow-sm"
 >
 <Printer size={13} /> Cetak Kartu
 </button>
 )}
 <button
 type="button"
 onClick={handleTestNotification}
 className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-[var(--radius-sm)] text-[11px] font-extrabold transition-all cursor-pointer shadow-sm ${
 notifPermission === "granted"
 ? "bg-slate-50 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50/40"
 : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-950/40 hover:bg-amber-100/50"
 }`}
 title="Aktifkan atau uji bunyi/bel notifikasi sistem saat beralih tab standby"
 >
 <Bell size={13} className={notifPermission === "granted" ? "text-emerald-600 animate-bounce" : "text-amber-500 animate-pulse"} />
 <span>{notifPermission === "granted" ? "Notif & Suara Aktif" : "Aktifkan Suara Notif"}</span>
 </button>
 <button
 type="button"
 onClick={() => setIsExpanded(!isExpanded)}
 className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-[var(--radius-sm)] text-[11px] font-extrabold transition-all cursor-pointer shadow-sm ${
 isExpanded 
 ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 active:bg-emerald-800" 
 : "bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]"
 }`}
 title={isExpanded ? "Kembalikan ke ukuran beralur standar" : "Perluas modul ruang chat (Workspace Besar)"}
 >
 {isExpanded ? (
 <>
 <Minimize2 size={13} />
 <span>Tampilan Standar</span>
 </>
 ) : (
 <>
 <Maximize2 size={13} className="text-emerald-600 animate-pulse" />
 <span>Perluas Ruang Chat</span>
 </>
 )}
 </button>
 </div>
 </div>

 {/* Google Meet Event Scheduler Form */}
 {showScheduleMeetForm && (
 <div className="p-4 bg-amber-500/5 dark:bg-amber-950/10 border-b border-[var(--border-color)] text-xs font-semibold space-y-3.5 text-left">
 <div className="flex justify-between items-center">
 <p className="text-[11px] font-extrabold uppercase tracking-wide text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
 ??? Atur Rencana Rapat Google Meet & Calendar
 </p>
 <button 
 onClick={() => setShowScheduleMeetForm(false)}
 className="text-amber-700 hover:text-amber-900 font-bold"
 >
 �
 </button>
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
 <div>
 <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Tanggal Rapat</label>
 <input 
 type="date"
 value={meetDate}
 onChange={(e) => setMeetDate(e.target.value)}
 className="w-full p-2.5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-main)] text-xs outline-none focus:border-amber-400 font-semibold"
 />
 </div>
 <div>
 <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Jam Mulai (WIB)</label>
 <input 
 type="time"
 value={meetTime}
 onChange={(e) => setMeetTime(e.target.value)}
 className="w-full p-2.5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-main)] text-xs outline-none focus:border-amber-400 font-semibold"
 />
 </div>
 <div>
 <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Durasi Rapat</label>
 <select 
 value={meetDuration}
 onChange={(e) => setMeetDuration(e.target.value)}
 className="w-full p-2.5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-main)] text-xs outline-none focus:border-amber-400 font-semibold"
 >
 <option value="30">30 Menit</option>
 <option value="60">1 Jam</option>
 <option value="90">1.5 Jam</option>
 <option value="120">2 Jam</option>
 </select>
 </div>
 </div>

 <div className="flex justify-between items-center pt-2 border-t border-[var(--border-color)]/50">
 <p className="text-[10px] text-amber-600/90 font-medium">
 {!googleToken ? "?? Hubungkan akun Google di bar atas dahulu untuk menjadwalkan." : "? Akun Google Workspace terhubung."}
 </p>
 <div className="flex gap-2">
 <button 
 type="button" 
 onClick={() => setShowScheduleMeetForm(false)}
 className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[var(--text-main)] font-semibold rounded text-[11px]"
 >
 Batal
 </button>
 <button 
 type="button" 
 disabled={isCreatingMeet}
 onClick={handleCreateMeet}
 className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold rounded text-[11px] disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
 >
 {isCreatingMeet ? "Menghubungi Google..." : "Buat Agenda & Link Meet"}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Google Meet active connection status banner */}
 {activeSession.meetLink && (
 <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-500/5 border-b border-emerald-500/20 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 text-left">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 relative">
 <Video size={15} />
 <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
 </div>
 <div>
 <h4 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 leading-tight">
 Sesi Video Konsultasi Google Meet Aktif
 </h4>
 <p className="text-[10.5px] text-emerald-600/90 dark:text-emerald-400/90 font-medium mt-0.5">
 Rapat video disinkronkan ke kalender. Anda dapat bergabung melalui: <a href={activeSession.meetLink} target="_blank" rel="noopener noreferrer" className="underline text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]">{activeSession.meetLink}</a>
 </p>
 </div>
 </div>
 <a 
 href={activeSession.meetLink} 
 target="_blank" 
 rel="noopener noreferrer" 
 className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded font-extrabold text-[11px] shadow transition-colors text-center inline-block cursor-pointer whitespace-nowrap"
 >
 Gabung Rapat Video
 </a>
 </div>
 )}

 {/* Split View Containment */}
 <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
 
 {/* LEFT COLUMN: Messages Thread */}
 <div className="flex-1 flex flex-col overflow-hidden relative border-r border-[var(--border-color)]">
 {/* Chat Messages Log */}
 <div
 ref={chatContainerRef}
 className="flex-1 p-5 overflow-y-auto bg-[var(--bg-base)] space-y-4 flex flex-col scrollbar-thin"
 >
 {/* Shared Supervisor Synergy Banner */}
 <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-slate-700 font-semibold mb-2 flex items-start gap-2.5 shadow-sm animate-slide-entry">
 <span className="text-sm shrink-0">??</span>
 <div className="space-y-1">
 <p className="font-extrabold text-blue-900 leading-tight">Sinergi Kolaborasi Pembimbing Aktif</p>
 <p className="leading-relaxed font-semibold text-slate-600">
 Sesi konsultasi tugas akhir ini bersifat terbuka dan terhubung secara transparan bagi seluruh Tim Pembimbing (Pembimbing 1 & Pembimbing 2) untuk menyelaraskan bimbingan akademis Anda.
 </p>
 </div>
 </div>

 {/* Render the initial message of topic creator */}
 <div
 className={`max-w-[85%] p-4 rounded-2xl flex flex-col shadow-sm border ${
 activeSession.namaMahasiswa === currentUserName
 ? "bg-[var(--brand-primary)] text-white border-transparent self-end rounded-br-[4px]"
 : "bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-color)] self-start rounded-bl-[4px]"
 }`}
 >
 <div className="text-[11px] font-bold opacity-80 mb-1 leading-none">
 {activeSession.namaMahasiswa} (Mahasiswa)
 </div>
 <p className="text-[13px] leading-relaxed font-semibold whitespace-pre-line">
 {activeSession.pesan}
 </p>
 <span className="text-[10px] opacity-75 self-end mt-1.5 font-medium">
 {formatChatTime(activeSession.tanggal)}
 </span>
 </div>

 {/* Render following historical thread lines */}
 {activeSession.riwayatChat && activeSession.riwayatChat.map((msg, index) => {
 const isMe = msg.pengirim === currentUserName;
 
 return (
 <div
 key={index}
 className={`max-w-[85%] p-4 rounded-2xl flex flex-col shadow-sm border ${
 isMe
 ? "bg-[var(--brand-primary)] text-white border-transparent self-end rounded-br-[4px]"
 : "bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-color)] self-start rounded-bl-[4px]"
 }`}
 >
 <div className="text-[11px] font-bold opacity-85 mb-1 leading-none">
 {msg.pengirim}
 </div>
 <p className="text-[13px] leading-relaxed font-semibold whitespace-pre-line">
 {msg.pesan}
 </p>
 
 {/* Inline Attachment Rendering */}
 {msg.lampiranNama && (
 <div className={`mt-3 p-2 rounded border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isMe ? "bg-white/10 border-white/20" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}>
 <div className="flex items-center gap-2 overflow-hidden w-full">
 <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${msg.lampiranTipe === "Word" ? "bg-blue-100 text-blue-700" : msg.lampiranTipe === "Image" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
 {msg.lampiranTipe === "Image" ? <ImageIcon size={16} /> : <FileText size={16} />}
 </div>
 <div className="overflow-hidden flex-1">
 <h4 className="text-[11px] font-bold truncate" title={msg.lampiranNama}>
 {msg.lampiranNama}
 </h4>
 <span className={`text-[9.5px] font-medium opacity-80 uppercase flex items-center gap-1 ${msg.isKoreksi ? "text-amber-400" : ""}`}>
 {msg.lampiranTipe} {msg.isKoreksi && "� Hasil Koreksi Dosen"}
 </span>
 </div>
 </div>
 <div className="flex gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap justify-end">
 <button
 onClick={() => setPreviewAttachment(msg)}
 className={`px-3 py-1.5 rounded flex items-center justify-center gap-1.5 text-[10px] font-extrabold transition-colors flex-1 sm:flex-none ${userRole === "Dosen" ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-sky-500 hover:bg-sky-600 text-white"} shadow-sm`}
 >
 <Eye size={12} /> {userRole === "Dosen" ? "View, Koreksi & Catat" : "Ulas Catatan & Tanggapi"}
 </button>
 <button
 onClick={() => {
 const link = document.createElement("a");
 link.href = msg.lampiranData as string;
 link.download = msg.lampiranNama as string;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 }}
 className={`px-3 py-1.5 rounded flex items-center justify-center gap-1.5 text-[10px] font-extrabold transition-colors flex-1 sm:flex-none ${isMe ? "bg-white text-[var(--brand-primary)] hover:bg-emerald-50" : "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]"}`}
 >
 <Download size={12} /> Unduh
 </button>
 </div>
 </div>
 )}

 <div className="flex items-center gap-2 self-end mt-2 text-[10px] opacity-75 font-medium select-none">
 <span>{formatChatTime(msg.waktu)}</span>
 {(isMe || userRole === "Dosen" || currentUserEmail === "fikesborneo@gmail.com") && (
 <button
 onClick={() => handleDeleteMessage(msg.waktu)}
 className="text-red-400 hover:text-red-500 transition-colors p-0.5 rounded cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center"
 title="Hapus pesan bimbingan"
 >
 <Trash2 size={11} />
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>

 {/* Message Reply Input Controls */}
 <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
 {isReadingFile && (
 <div className="mb-3 p-2.5 bg-emerald-50/55 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/40 rounded flex items-center justify-between animate-pulse">
 <div className="flex items-center gap-2">
 <Loader2 size={16} className="animate-spin text-emerald-600 dark:text-emerald-400" />
 <div>
 <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Memproses berkas dokumen...</div>
 <div className="text-[9px] text-emerald-600 dark:text-emerald-500 font-medium">Bypass caching optimal untuk pengiriman instan</div>
 </div>
 </div>
 </div>
 )}

 {uploadedFile && (
 <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded flex items-center justify-between">
 <div className="flex items-center gap-2 overflow-hidden">
 <FileText size={16} className={uploadedFile.type === "Word" ? "text-blue-600" : "text-red-600"} />
 <div className="overflow-hidden">
 <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{uploadedFile.name}</div>
 <div className="text-[9px] text-slate-500 font-medium">{uploadedFile.size} � Siap Kirim</div>
 </div>
 </div>
 <button onClick={() => setUploadedFile(null)} className="p-1 text-slate-400 hover:text-red-500"><X size={14}/></button>
 </div>
 )}

 {/* Google AI Chat Assistance Pill */}
 <div className="flex items-center justify-between px-1 mb-2">
 <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
 <Sparkles size={11} className="text-emerald-500 animate-pulse" />
 <span>Saran balasan bimbingan dari asisten AI?</span>
 </div>
 <button
 type="button"
 onClick={handleGetChatAISuggestion}
 disabled={isQueryingChatAI}
 className="text-[10px] font-extrabold text-[var(--brand-primary)] hover:text-emerald-800 flex items-center gap-1 bg-emerald-550/5 bg-emerald-550/10 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/40 transition duration-150 disabled:opacity-50 cursor-pointer"
 >
 {isQueryingChatAI ? (
 <>
 <Loader2 size={10} className="animate-spin text-[var(--brand-primary)]" />
 <span>Menganalisis draf...</span>
 </>
 ) : (
 <>
 <Sparkles size={10} className="text-emerald-600 animate-pulse" />
 <span>Minta Masukan Google AI</span>
 </>
 )}
 </button>
 </div>

 {/* Quick Academic Reply Suggestions (New Addition) */}
 <div className="flex items-center gap-2 mb-3.5 px-1 overflow-hidden">
 <span className="text-[9px] uppercase tracking-wider font-extrabold text-[var(--text-muted)] shrink-0 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Draf Cepat:</span>
 <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1 max-w-full sm:pr-16 pr-14">
 {quickTemplates.map((tpl, i) => (
 <button
 key={i}
 type="button"
 onClick={() => {
 setReplyText(tpl.text);
 if (showToast) showToast(`Menggunakan draf: ${tpl.label}`, "success");
 }}
 className="text-[9.5px] font-bold px-2 py-1 rounded bg-slate-50 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
 title={tpl.text}
 >
 ?? {tpl.label}
 </button>
 ))}
 </div>
 </div>

 <form onSubmit={handleSendReply} className="flex gap-2 md:gap-3 items-end sm:pr-16 pr-14">
 <div className="relative">
 <input
 type="file"
 accept=".pdf,.doc,.docx"
 onChange={handleFileChange}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 title="Lampirkan Dokumen (Word/PDF)"
 />
 <button
 type="button"
 className="p-3 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-[var(--radius-sm)] flex items-center justify-center transition-colors shadow-sm"
 title="Upload Lampiran Dokumen"
 >
 <Paperclip size={18} />
 </button>
 </div>
 
 <textarea
 rows={isExpanded ? 4 : 2}
 placeholder={uploadedFile && userRole === "Dosen" ? "Tulis catatan revisi/koreksi..." : "Tulis balasan konsultasi bimbingan..."}
 value={replyText}
 onChange={(e) => setReplyText(e.target.value)}
 className="flex-1 p-3 border border-[var(--border-color)] rounded-[var(--radius-md)] text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-surface)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[rgba(15,110,86,0.06)] transition-all resize-none shadow-sm font-medium"
 />
 <button
 type="submit"
 disabled={(!replyText.trim() && !uploadedFile)}
 className="p-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-sm)] flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
 title="Kirim Pesan"
 >
 <Send size={18} />
 </button>
 </form>
 </div>
 </div>
 </div>

 {/* END OF CHAT UI */}
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]">
 <MessageSquare size={36} className="text-[var(--text-disabled)] mb-3" />
 <h4 className="text-sm font-extrabold text-[var(--text-main)]">
 Tidak Ada Percakapan Terpilih
 </h4>
 <p className="text-xs text-[var(--text-disabled)] max-w-xs mt-1.5">
 Pilih salah satu direktori bimbingan di sebelah kiri untuk meninjau log chat bimbingan.
 </p>
 </div>
 )}
 </div>

 {/* MODAL: SUBMISSION NEW CONVERSATION */}
 {newTopicModal && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
 <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border-color)] overflow-hidden scale-entry text-left">
 
 <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-surface-hover)] flex justify-between items-center">
 <h3 className="text-sm font-bold tracking-tight text-[var(--text-main)]">
 Mulai Sesi Konsultasi Baru
 </h3>
 <button
 onClick={() => setNewTopicModal(false)}
 className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl cursor-pointer"
 >
 �
 </button>
 </div>

 <form onSubmit={handleStartNewTopic}>
 <div className="p-5 space-y-4">
 <div className="form-group">
 <label className="block text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] mb-2">
 Dosen Pembimbing Sasaran
 </label>
 <select
 required
 value={newDosenEmail}
 onChange={(e) => setNewDosenEmail(e.target.value)}
 className="w-full p-3 rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] font-semibold text-xs outline-none focus:border-[var(--brand-primary)]"
 >
 <option value="">-- Pilih Pembimbing --</option>
 {lecturers.map((d) => (
 <option key={d.id} value={d.email}>
 {d.nama} ({d.bidangKeahlian})
 </option>
 ))}
 </select>
 </div>

 <div className="form-group">
 <label className="block text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] mb-2">
 Subjek Diskusi (Topik/Bab)
 </label>
 <input
 type="text"
 required
 placeholder="Contoh: Revisi Bab II Tinjauan Pustaka"
 value={newSubject}
 onChange={(e) => setNewSubject(e.target.value)}
 className="w-full p-3 rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] font-semibold text-xs outline-none focus:border-[var(--brand-primary)]"
 />
 </div>

 <div className="form-group">
 <label className="block text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] mb-2">
 Isi Pesan Atau Deskripsi Masalah
 </label>
 <textarea
 rows={4}
 required
 placeholder="Tulis draf kronologis diskusi atau pertanyaan bimbingan Anda secara terperinci..."
 value={newFirstMessage}
 onChange={(e) => setNewFirstMessage(e.target.value)}
 className="w-full p-3 rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] font-semibold text-xs outline-none focus:border-[var(--brand-primary)]"
 />
 </div>
 </div>

 <div className="p-4 bg-[var(--bg-surface-hover)] border-t border-[var(--border-color)] flex justify-end gap-3">
 <button
 type="button"
 onClick={() => setNewTopicModal(false)}
 className="btn btn-secondary text-xs"
 >
 Batal
 </button>
 <button type="submit" className="btn btn-primary text-xs">
 Kirim Pengajuan
 </button>
 </div>
 </form>

 </div>
 </div>
 )}

 {/* Document Review Preview Modal Overlay */}
 {previewDoc && mutate && showToast && (
 <DocumentPreviewModal
 doc={previewDoc}
 currentUser={{
 email: currentUserEmail,
 nama: currentUserName,
 role: userRole
 } as any}
 onClose={() => setPreviewDoc(null)}
 mutate={mutate}
 showToast={showToast}
 />
 )}

 {/* File Review Modal via Canvas Annotations Overlay */}
 {previewAttachment && showToast && activeSession && (
 <FileReviewModal
 msg={previewAttachment}
 currentUserRole={userRole}
 onClose={() => setPreviewAttachment(null)}
 onSaveKoreksi={(annotatedUrl) => {
 const lampiranD: any = {
 lampiranData: annotatedUrl,
 lampiranNama: `Koreksi_Dosen_${previewAttachment.lampiranNama?.replace(".pdf", ".jpg").replace(".doc", ".jpg").replace(".docx", ".jpg") || Date.now() + ".jpg"}`,
 lampiranTipe: "Image",
 isKoreksi: true
 };
 onReply(activeSession.id, "Berkas hasil koreksi telah siap. Silakan diulas oleh mahasiswa.", lampiranD);
 
 // Optimistic local state update
 const updatedHistory: ChatMessage[] = [
 ...(activeSession.riwayatChat || []),
 {
 pengirim: currentUserName,
 pesan: "Berkas hasil koreksi telah siap. Silakan diulas oleh mahasiswa.",
 waktu: new Date().toISOString(),
 ...lampiranD
 }
 ];
 setActiveSession({
 ...activeSession,
 riwayatChat: updatedHistory,
 status: userRole === "Dosen" ? "Dibalas" : "Menunggu"
 });
 }}
 showToast={showToast}
 activeSession={activeSession}
 mutate={mutate}
 onReply={onReply}
 />
 )}

 </div>
 );
}

