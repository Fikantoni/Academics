import React, { useState, useEffect, useRef } from "react";
import { AppState, Pengguna, Mahasiswa, Dosen, Pengumuman, Bimbingan, Judul, Konsultasi, PesanSurat, JadwalSidang, PendaftaranTesis } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Login } from "./components/Login";
import { ProfileModal } from "./components/ProfileModal";
import { Dashboard } from "./components/Dashboard";
import { ChatRoom } from "./components/ChatRoom";
import { PrintLetter } from "./components/PrintLetter";
import { PrintConsultationCard } from "./components/PrintConsultationCard";
import { DokumenTesisTab } from "./components/DokumenTesisTab";
import { PendaftaranTesisTab } from "./components/PendaftaranTesisTab";
import PanduanSOPTab from "./components/PanduanSOPTab";
import BerkasMajuTab from "./components/BerkasMajuTab";
import { ScheduleForm } from "./components/ScheduleForm";
import { AIAssistantWidget } from "./components/AIAssistantWidget";
import WaReminderModal from "./components/WaReminderModal";
import ScheduleCalendar from "./components/ScheduleCalendar";
import DosenWorkloadEqualizer from "./components/DosenWorkloadEqualizer";
import { PublicRsvp } from "./components/PublicRsvp";
import { Plus, Edit, Trash2, CheckCircle, XCircle, RefreshCw, Upload, Eye, Search, X, Lock, Check, Award, Calendar, BookOpen, AlertCircle, HelpCircle, Video, Download } from "lucide-react";
import { initGoogleAuth, signInWithGoogle, logoutGoogle, getCachedAccessToken } from "./lib/googleCalendar";
import { safeStorage } from "./lib/safeStorage";

export default function App() {
 const [rsvpParams, setRsvpParams] = useState<{ id: string; role: string; name: string } | null>(() => {
 const params = new URLSearchParams(window.location.search);
 const rsvp = params.get("rsvp");
 const id = params.get("id");
 const role = params.get("role");
 const name = params.get("name");
 if (rsvp && id && role) {
 return { id, role, name: name || "" };
 }
 return null;
 });

 const [currentUser, setCurrentUser] = useState<Pengguna | null>(() => {
 const saved = safeStorage.getItem("simtesis_user");
 return saved ? JSON.parse(saved) : null;
 });
 const [token, setToken] = useState<string | null>(() => {
 return safeStorage.getItem("simtesis_token");
 });
 const [activeTab, setActiveTab] = useState<string>(() => {
 const saved = safeStorage.getItem("simtesis_active_tab");
 return saved || "dashboard";
 });
 const [searchVal, setSearchVal] = useState<string>("");
 const [searchUser, setSearchUser] = useState<string>("");
 const [searchMhs, setSearchMhs] = useState<string>("");
 const [theme, setTheme] = useState<"light" | "dark">(() => {
 const saved = safeStorage.getItem("simtesis_theme");
 return (saved === "light" || saved === "dark") ? saved : "light";
 });
 const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
 const [showProfileModal, setShowProfileModal] = useState(false);
 const [isSyncing, setIsSyncing] = useState(false);

 const [notifications, setNotifications] = useState<any[]>(() => {
 return [
 {
 id: "notif-1",
 pesan: "Selamat datang di sistem baru Academics v4.0. Tetap pantau progress dan update bimbingan Anda.",
 waktu: "1 jam yang lalu",
 dibaca: false,
 tipe: "success"
 },
 {
 id: "notif-2",
 pesan: "Sistem pendataan terjadwal mendeteksi progress bimbingan aktif berjalan normal.",
 waktu: "3 jam yang lalu",
 dibaca: false,
 tipe: "info"
 }
 ];
 });

 const handleMarkAllRead = () => {
 setNotifications(prev => prev.map(n => ({ ...n, dibaca: true })));
 };

 // Core Symmetrical State
 const [state, setState] = useState<AppState>({
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
 });
 
 // Floating Previews & Modals
 const [printData, setPrintData] = useState<PesanSurat | null>(null);
 const [printConsultation, setPrintConsultation] = useState<Konsultasi | null>(null);
 const [schedSubView, setSchedSubView] = useState<"daftar" | "kalender" | "beban">("daftar");
 const [toasts, setToasts] = useState<{ id: string; msg: string; type: "success" | "warning" | "error" }[]>([]);
 const [activeModal, setActiveModal] = useState<{
 id: string;
 title: string;
 content: React.ReactNode;
 footer?: React.ReactNode;
 } | null>(null);

 // Google OAuth States
 const [googleUser, setGoogleUser] = useState<any>(null);
 const [googleToken, setGoogleToken] = useState<string | null>(null);

 // States for Dean signatory configurations
 const [dekanNama, setDekanNama] = useState("");
 const [dekanNidn, setDekanNidn] = useState("");
 const [dekanJabatan, setDekanJabatan] = useState("");
 const [hasLoadedPejabat, setHasLoadedPejabat] = useState(false);

 // States for WhatsApp configurations
 const [waStatus, setWaStatus] = useState("Nonaktif");
 const [waGatewayProvider, setWaGatewayProvider] = useState("Fonnte");
 const [waToken, setWaToken] = useState("");
 const [waSenderNo, setWaSenderNo] = useState("");
 const [waTemplateMhs, setWaTemplateMhs] = useState("Yth. {nama}, Jadwal {kegiatan} Anda telah terbit. Tanggal: {tanggal}, Jam: {waktu} WIB, Ruang: {ruang}. Harap bersiap menghadapi ujian. Link Meet: {link}");
 const [waTemplateDosen, setWaTemplateDosen] = useState("Yth. Dr/Bapak/Ibu {nama}, Mohon kehadirannya selaku dewan penguji pada Jadwal {kegiatan} Mahasiswa {mahasiswa} ({nim}). Tanggal: {tanggal}, Jam: {waktu} WIB, Ruang: {ruang}. Link Meet: {link}");
 const [waTemplateAudiens, setWaTemplateAudiens] = useState("INFO PASCA: Hadirilah & saksikan Seminar/Sidang {kegiatan} Mahasiswa: {mahasiswa} pada Tanggal: {tanggal}, Jam: {waktu} WIB di {ruang} sebagai bekal persiapan ujian Anda!");
 const [hasLoadedWa, setHasLoadedWa] = useState(false);

 // Synchronize Dean & WhatsApp configurations from database
 useEffect(() => {
 if (state.pengaturan && state.pengaturan.length > 0) {
 if (!hasLoadedPejabat) {
 const nama = state.pengaturan.find(p => p.id === "dekan_nama")?.value || "";
 const nidn = state.pengaturan.find(p => p.id === "dekan_nidn")?.value || "";
 const jabatan = state.pengaturan.find(p => p.id === "dekan_jabatan")?.value || "";
 setDekanNama(nama);
 setDekanNidn(nidn);
 setDekanJabatan(jabatan);
 setHasLoadedPejabat(true);
 }
 if (!hasLoadedWa) {
 const status = state.pengaturan.find(p => p.id === "wa_status")?.value || "Nonaktif";
 const prov = state.pengaturan.find(p => p.id === "wa_gateway_provider")?.value || "Fonnte";
 const tok = state.pengaturan.find(p => p.id === "wa_token")?.value || "";
 const sender = state.pengaturan.find(p => p.id === "wa_sender_no")?.value || "";
 const mhsT = state.pengaturan.find(p => p.id === "wa_template_mhs")?.value || "Yth. {nama}, Jadwal {kegiatan} Anda telah terbit. Tanggal: {tanggal}, Jam: {waktu} WIB, Ruang: {ruang}. Harap bersiap menghadapi ujian. Link Meet: {link}";
 const dosT = state.pengaturan.find(p => p.id === "wa_template_dosen")?.value || "Yth. Dr/Bapak/Ibu {nama}, Mohon kehadirannya selaku dewan penguji pada Jadwal {kegiatan} Mahasiswa {mahasiswa} ({nim}). Tanggal: {tanggal}, Jam: {waktu} WIB, Ruang: {ruang}. Link Meet: {link}";
 const audT = state.pengaturan.find(p => p.id === "wa_template_audiens")?.value || "INFO PASCA: Hadirilah & saksikan Seminar/Sidang {kegiatan} Mahasiswa: {mahasiswa} pada Tanggal: {tanggal}, Jam: {waktu} WIB di {ruang} sebagai bekal persiapan ujian Anda!";
 
 setWaStatus(status);
 setWaGatewayProvider(prov);
 setWaToken(tok);
 setWaSenderNo(sender);
 setWaTemplateMhs(mhsT);
 setWaTemplateDosen(dosT);
 setWaTemplateAudiens(audT);
 setHasLoadedWa(true);
 }
 }
 }, [state.pengaturan, hasLoadedPejabat, hasLoadedWa]);

 // Hook Google authentication state changes
 useEffect(() => {
 const unsubscribe = initGoogleAuth(
 (user, token) => {
 setGoogleUser(user);
 setGoogleToken(token);
 },
 () => {
 setGoogleUser(null);
 setGoogleToken(null);
 }
 );
 return () => {
 if (unsubscribe) unsubscribe();
 };
 }, []);

 const handleConnectGoogle = async () => {
 try {
 const res = await signInWithGoogle();
 if (res) {
 setGoogleUser(res.user);
 setGoogleToken(res.accessToken);
 showToast("Google Calendar & Meet berhasil terintegrasi!", "success");
 }
 } catch (err: any) {
 showToast(`Gagal menghubungkan Google: ${err.message || err}`, "error");
 }
 };

 const handleManageGoogleMeet = () => {
 setActiveModal({
 id: "manage-google-meet",
 title: "Kelola Link Google Meet Dosen Pembimbing",
 content: (
 <div className="space-y-4">
 <p className="text-xs text-[var(--text-muted)] mb-4">
 Masukkan link Google Meet statis untuk tiap Dosen Pembimbing. Link ini akan otomatis digunakan oleh mahasiswa saat ingin bimbingan online dengan dosen yang bersangkutan.
 </p>
 <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
 {state.dosen && state.dosen.map((dsn) => (
 <form 
 key={dsn.id}
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const meetLink = (form.elements.namedItem("meetLink") as HTMLInputElement).value;
 mutate("dosen", "update", { meetLink }, "id", dsn.id);
 showToast(`Link Meet untuk ${dsn.nama} berhasil disimpan!`, "success");
 }}
 className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-[var(--radius-md)] flex flex-col sm:flex-row gap-3 items-start sm:items-center"
 >
 <div className="flex-1">
 <div className="text-xs font-bold text-[var(--text-main)]">{dsn.nama}</div>
 <div className="text-[10px] text-[var(--text-muted)]">{dsn.bidangKeahlian}</div>
 </div>
 <div className="flex-1 w-full sm:w-auto relative">
 <input 
 type="url" 
 name="meetLink" 
 defaultValue={dsn.meetLink || ""}
 placeholder="https://meet.google.com/xxx-xxxx-xxx"
 className="form-input text-xs w-full"
 />
 </div>
 <button type="submit" className="btn btn-primary btn-sm text-xs whitespace-nowrap">
 Simpan Link
 </button>
 </form>
 ))}
 {(!state.dosen || state.dosen.length === 0) && (
 <div className="p-4 text-center text-xs text-[var(--text-muted)]">
 Belum ada data dosen.
 </div>
 )}
 </div>
 </div>
 ),
 footer: (
 <div className="flex justify-end gap-2 p-4 pt-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">
 Tutup
 </button>
 </div>
 )
 });
 };

 const handleDisconnectGoogle = async () => {
 try {
 await logoutGoogle();
 setGoogleUser(null);
 setGoogleToken(null);
 showToast("Hubungan Google Calendar diputus.", "warning");
 } catch (err: any) {
 showToast("Gagal memutuskan hubungan Google.", "error");
 }
 };

 // Fetch full state on mount with automatic cloud recovery from client's browser backup
 const fetchState = async (silent = false) => {
 const activeToken = safeStorage.getItem("simtesis_token");
 if (!activeToken) {
 if (!silent) setIsSyncing(true);
 try {
 const publicRes = await fetch("/api/public-config");
 if (publicRes.ok) {
 const publicData = await publicRes.json();
 setState(prev => ({ ...prev, logo: publicData.logo }));
 }
 } catch (e) {
 console.error("Gagal memuat konfigurasi publik:", e);
 } finally {
 setIsSyncing(false);
 }
 return;
 }

 if (!silent) setIsSyncing(true);
 try {
 const res = await fetch("/api/db");
 if (res.ok) {
 const serverData = await res.json();
 
 // Auto-recovery mechanism from local client backup on fresh startup
 if (!silent) {
 try {
 const savedBackupStr = safeStorage.getItem("simtesis_db_backup");
 if (savedBackupStr) {
 const backupData = JSON.parse(savedBackupStr);
 
 const calcMetrics = (db: any) => {
 if (!db) return 0;
 const kLen = Array.isArray(db.konsultasi) ? db.konsultasi.length : 0;
 const pLen = Array.isArray(db.pendaftaranTesis) ? db.pendaftaranTesis.length : 0;
 const jLen = Array.isArray(db.judul) ? db.judul.length : 0;
 const actLen = Array.isArray(db.aktivitas) ? db.aktivitas.length : 0;
 return kLen + pLen + jLen + actLen;
 };

 const serverScore = calcMetrics(serverData);
 const backupScore = calcMetrics(backupData);

 // If browser local-backup contains significantly more user records than the reset server DB
 if (backupScore > serverScore) {
 console.log("Failsafe: Auto recovering cloud database from browser safe-backup...", { backupScore, serverScore });
 const restoreRes = await fetch("/api/db/restore", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(backupData)
 });
 if (restoreRes.ok) {
 const restoredDb = await restoreRes.json();
 if (restoredDb.success) {
 setState(restoredDb.db);
 showToast("Database Anda telah otomatis dipulihkan dengan aman dari cadangan browser!", "success");
 setIsSyncing(false);
 return;
 }
 }
 }
 }
 } catch (backupErr) {
 console.warn("Failsafe backup check failed:", backupErr);
 }
 }

 setState(serverData);
 }
 } catch (err) {
 console.error("Failed to fetch state from backend:", err);
 showToast("Gagal memuat database dari server.", "error");
 } finally {
 setIsSyncing(false);
 }
 };

 // Continuous background local persistence backup mirror
 useEffect(() => {
 if (state && state.pengguna && state.pengguna.length > 0) {
 const kLen = state.konsultasi?.length || 0;
 const pLen = state.pendaftaranTesis?.length || 0;
 const userLen = state.pengguna?.length || 0;
 // Ensure we don't backup an empty/unpopulated database state
 if (kLen > 0 || pLen > 0 || userLen > 8) {
 safeStorage.setItem("simtesis_db_backup", JSON.stringify(state));
 }
 }
 }, [state]);

 useEffect(() => {
 fetchState();

 // Set up auto background polling for multi-user real-time state synchronization
 const pollInterval = setInterval(() => {
 fetchState(true);
 }, 5000);

 // Pre-load theme preference
 const savedTheme = safeStorage.getItem("simtesis_theme") as "light" | "dark";
 if (savedTheme) {
 setTheme(savedTheme);
 document.documentElement.setAttribute("data-theme", savedTheme);
 } else {
 setTheme("light");
 document.documentElement.setAttribute("data-theme", "light");
 }

 return () => clearInterval(pollInterval);
 }, []);

 // Persist current session and current page tab dynamically
 useEffect(() => {
 if (currentUser) {
 safeStorage.setItem("simtesis_user", JSON.stringify(currentUser));
 } else {
 safeStorage.removeItem("simtesis_user");
 }
 }, [currentUser]);

 useEffect(() => {
 if (token) {
 safeStorage.setItem("simtesis_token", token);
 } else {
 safeStorage.removeItem("simtesis_token");
 }
 }, [token]);

 useEffect(() => {
 safeStorage.setItem("simtesis_active_tab", activeTab);
 }, [activeTab]);

 useEffect(() => {
 if (currentUser && state.pengguna && state.pengguna.length > 0) {
 const updated = state.pengguna.find((p) => p.email === currentUser.email);
 if (updated && (updated.fotoProfil !== currentUser.fotoProfil || updated.nama !== currentUser.nama)) {
 setCurrentUser(updated);
 }
 }
 }, [state.pengguna, currentUser]);

 // Secure Role-based Tab Access Validation
 useEffect(() => {
 if (currentUser && activeTab !== "dashboard") {
 const hasAccess = (role: string, tab: string): boolean => {
 switch (role) {
 case "Superadmin":
 return ["dashboard", "panduan-sop", "users", "pengumuman", "mahasiswa", "dosen", "assign", "review-judul", "jadwalsidang", "pendaftaran-admin", "surat", "pengaturan", "dokumen-tesis", "berkas-maju"].includes(tab);
 case "Admin":
 return ["dashboard", "panduan-sop", "pengumuman", "mahasiswa", "dosen", "assign", "review-judul", "jadwalsidang", "pendaftaran-admin", "surat", "pengaturan", "dokumen-tesis", "berkas-maju"].includes(tab);
 case "Dosen":
 return ["dashboard", "panduan-sop", "mhs-bimbingan", "review-judul", "jadwal-menguji", "konsultasi-dsn", "dokumen-tesis", "pendaftaran-admin"].includes(tab);
 case "Mahasiswa":
 return ["dashboard", "panduan-sop", "pendaftaran-mhs", "ajukan-judul", "jadwal-mhs", "konsultasi-mhs", "surat-mhs", "dokumen-tesis"].includes(tab);
 case "Prodi":
 return ["dashboard", "panduan-sop", "review-judul", "assign", "dokumen-tesis", "pendaftaran-admin", "jadwalsidang", "berkas-maju"].includes(tab);
 default:
 return false;
 }
 };

 if (!hasAccess(currentUser.role, activeTab)) {
 setActiveTab("dashboard");
 showToast("Akses fitur dibatasi untuk peran Anda.", "warning");
 }
 }
 }, [currentUser, activeTab]);

 const showToast = (msg: string, type: "success" | "warning" | "error" = "success") => {
 const id = `${Date.now()}-${Math.random()}`;
 setToasts((prev) => [...prev, { id, msg, type }]);
 setTimeout(() => {
 setToasts((prev) => prev.filter((t) => t.id !== id));
 }, 4000);
 };

 // Web Audio chime generator
 const playNotificationChime = () => {
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
 console.warn("AudioContext notification sound unblocked/error:", e);
 }
 };

 // Push system notification
 const triggerSysNotification = (title: string, body: string) => {
 playNotificationChime();
 
 if ("Notification" in window) {
 if (Notification.permission === "granted") {
 try {
 const notif = new Notification(title, {
 body,
 icon: state.logo || "/icon.png",
 tag: "simtesis-chat-notification",
 requireInteraction: false
 });
 notif.onclick = () => {
 window.focus();
 notif.close();
 };
 } catch (e) {
 console.warn("Failed to trigger native system notification:", e);
 }
 }
 }
 };

 // HTML5 System Notification setup and permission on mount
 useEffect(() => {
 if ("Notification" in window && Notification.permission === "default") {
 setTimeout(() => {
 Notification.requestPermission();
 }, 4000);
 }
 }, []);

 const prevKonsultasiRef = useRef<Konsultasi[]>([]);
 const isInitialLoadRef = useRef(true);

 // Auto real-time status monitoring for new messages with vibration/sounds
 useEffect(() => {
 if (!currentUser || !state.konsultasi || state.konsultasi.length === 0) {
 if (state.konsultasi && state.konsultasi.length > 0) {
 prevKonsultasiRef.current = state.konsultasi;
 isInitialLoadRef.current = false;
 }
 return;
 }

 if (isInitialLoadRef.current) {
 prevKonsultasiRef.current = state.konsultasi;
 isInitialLoadRef.current = false;
 return;
 }

 const prev = prevKonsultasiRef.current || [];
 
 state.konsultasi.forEach((currSession) => {
 const isMySession = currSession.mahasiswaEmail === currentUser.email || currSession.dosenEmail === currentUser.email;
 if (!isMySession) return;

 const prevSession = prev.find((p) => p.id === currSession.id);

 if (!prevSession) {
 // Checking initial message to avoid notifying our own newly created threads
 const lastMsg = currSession.riwayatChat && currSession.riwayatChat.length > 0 
 ? currSession.riwayatChat[0] 
 : null;
 
 const isNotByMe = lastMsg 
 ? lastMsg.pengirim !== currentUser.nama 
 : currSession.namaMahasiswa !== currentUser.nama;

 if (isNotByMe) {
 triggerSysNotification(
 `Kamar Konsultasi Baru: ${currSession.subjek}`,
 `Diajukan oleh: ${currSession.namaMahasiswa === currentUser.nama ? currSession.namaDosen : currSession.namaMahasiswa}`
 );
 }
 } else {
 const currChat = currSession.riwayatChat || [];
 const prevChat = prevSession.riwayatChat || [];

 if (currChat.length > prevChat.length) {
 const newMessages = currChat.slice(prevChat.length);
 newMessages.forEach((msg) => {
 if (msg.pengirim !== currentUser.nama) {
 triggerSysNotification(
 `Pesan/Revisi Baru dari ${msg.pengirim}`,
 msg.pesan
 );
 }
 });
 }
 }
 });

 prevKonsultasiRef.current = state.konsultasi;
 }, [state.konsultasi, currentUser]);

 // Perform a mutation request on back-end
 const mutate = async (table: string, action: "add" | "update" | "delete", data: any, keyCol?: string, keyVal?: any, silent = false) => {
 setIsSyncing(true);
 try {
 const response = await fetch("/api/mutate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ 
 table, 
 action, 
 data, 
 keyCol, 
 keyVal,
 user: currentUser ? { nama: currentUser.nama, email: currentUser.email, role: currentUser.role } : null
 }),
 });
 if (response.ok) {
 const result = await response.json();
 if (result.success) {
 setState(result.db);
 if (!silent) {
 const successMsg = 
 action === "add" ? "Data berhasil ditambahkan!" : 
 action === "update" ? "Data berhasil diperbarui!" : 
 "Data berhasil dihapus!";
 showToast(successMsg, "success");
 }
 } else {
 showToast(`Operasi gagal: ${result.error}`, "error");
 }
 } else {
 showToast("Kesalahan respons server.", "error");
 }
 } catch (err) {
 console.error("Mutation failed:", err);
 showToast("Koneksi gagal atau terputus.", "error");
 } finally {
 setIsSyncing(false);
 }
 };

 const handleUpdateLogo = async (logoUri: string | null) => {
 setIsSyncing(true);
 try {
 const response = await fetch("/api/logo", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ logo: logoUri }),
 });
 if (response.ok) {
 const result = await response.json();
 if (result.success) {
 setState((prev) => ({ ...prev, logo: result.logo }));
 showToast("Logo institusi berhasil diperbarui!");
 }
 }
 } catch (err) {
 console.error(err);
 showToast("Gagal memperbarui kustomisasi logo.", "error");
 } finally {
 setIsSyncing(false);
 }
 };

 const handleSaveDekanConfig = async () => {
 try {
 setIsSyncing(true);
 await mutate("pengaturan", "update", { value: dekanNama }, "id", "dekan_nama", true);
 await mutate("pengaturan", "update", { value: dekanNidn }, "id", "dekan_nidn", true);
 await mutate("pengaturan", "update", { value: dekanJabatan }, "id", "dekan_jabatan", false);
 setHasLoadedPejabat(false);
 showToast("Pengaturan pejabat penandatangan berhasil diperbarui!", "success");
 } catch (err) {
 console.error(err);
 showToast("Gagal menyimpan pengaturan pejabat.", "error");
 } finally {
 setIsSyncing(false);
 }
 };

 const handleSaveWaConfig = async () => {
 try {
 setIsSyncing(true);
 await mutate("pengaturan", "update", { value: waStatus }, "id", "wa_status", true);
 await mutate("pengaturan", "update", { value: waGatewayProvider }, "id", "wa_gateway_provider", true);
 await mutate("pengaturan", "update", { value: waToken }, "id", "wa_token", true);
 await mutate("pengaturan", "update", { value: waSenderNo }, "id", "wa_sender_no", true);
 await mutate("pengaturan", "update", { value: waTemplateMhs }, "id", "wa_template_mhs", true);
 await mutate("pengaturan", "update", { value: waTemplateDosen }, "id", "wa_template_dosen", true);
 await mutate("pengaturan", "update", { value: waTemplateAudiens }, "id", "wa_template_audiens", false);
 setHasLoadedWa(false);
 showToast("Sistem pengingat WhatsApp berhasil dikonfigurasi!", "success");
 } catch (err) {
 console.error(err);
 showToast("Gagal mengonfigurasi pengingat WhatsApp.", "error");
 } finally {
 setIsSyncing(false);
 }
 };

 const handleOpenWaReminderModal = (s: JadwalSidang) => {
 setActiveModal({
 id: "wa-reminders-modal",
 title: " Kirim Pengingat WhatsApp Resmi",
 content: (
 <WaReminderModal
 schedule={s}
 state={state}
 currentUser={currentUser}
 onClose={() => setActiveModal(null)}
 showToast={showToast}
 />
 ),
 });
 };

 const handleDownloadBackup = () => {
 try {
 const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
 const downloadAnchor = document.createElement("a");
 downloadAnchor.setAttribute("href", dataStr);
 downloadAnchor.setAttribute("download", `Backup_Academics_${new Date().toISOString().split('T')[0]}.json`);
 document.body.appendChild(downloadAnchor);
 downloadAnchor.click();
 downloadAnchor.remove();
 showToast("File backup database berhasil diunduh!", "success");
 } catch {
 showToast("Gagal memproses file backup.", "error");
 }
 };

 const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 
 const reader = new FileReader();
 reader.onload = async (event) => {
 try {
 const parsed = JSON.parse(event.target?.result as string);
 if (!parsed.pengguna || !Array.isArray(parsed.pengguna)) {
 showToast("Format file backup tidak valid. Harus mengandung data pengguna.", "error");
 return;
 }

 const confirmRestore = window.confirm("Apakah Anda yakin ingin memulihkan database dari file backup ini? Data saat ini di server akan ditimpa secara instan.");
 if (!confirmRestore) return;

 setIsSyncing(true);
 const res = await fetch("/api/db/restore", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(parsed)
 });

 if (res.ok) {
 const restoredDb = await res.json();
 if (restoredDb.success) {
 setState(restoredDb.db);
 safeStorage.setItem("simtesis_db_backup", JSON.stringify(restoredDb.db));
 showToast("Database berhasil dipulihkan sepenuhnya!", "success");
 } else {
 showToast(`Gagal memulihkan: ${restoredDb.error}`, "error");
 }
 } else {
 showToast("Gagal menghubungi server.", "error");
 }
 } catch (err) {
 showToast("Gagal membaca file JSON.", "error");
 } finally {
 setIsSyncing(false);
 }
 };
 reader.readAsText(file);
 };

 const handleResetDatabase = async () => {
 const confirmReset = window.confirm("PERINGATAN: Apakah Anda yakin ingin MERESET database ke setelan awal (default seed data)? Semua pesan bimbingan, chat, dokumen aktif, dan revisi yang telah dimasukkan secara online akan terhapus.");
 if (!confirmReset) return;

 setIsSyncing(true);
 try {
 const res = await fetch("/api/db/reset", { method: "POST" });
 if (res.ok) {
 const resetDb = await res.json();
 if (resetDb.success) {
 setState(resetDb.db);
 safeStorage.removeItem("simtesis_db_backup");
 showToast("Database berhasil direset kembali ke setelan bawaan akademik!", "success");
 }
 }
 } catch {
 showToast("Gagal mereset database ke setelan bawaan.", "error");
 } finally {
 setIsSyncing(false);
 }
 };

 const handleSaveProfile = async (updatedData: { nama: string; password?: string; fotoProfil?: string | null }) => {
 if (!currentUser) return;
 try {
 const email = currentUser.email;
 
 const payload: any = {
 nama: updatedData.nama,
 fotoProfil: updatedData.fotoProfil,
 };
 if (updatedData.password) {
 payload.password = updatedData.password;
 }

 await mutate(
 "pengguna",
 "update",
 payload,
 "email",
 email
 );

 // Mutate will auto-update state and update the db
 // We also sync referenced names in Mahasiswa and Dosen lists for consistency
 if (currentUser.role === "Mahasiswa") {
 const hasMhs = state.mahasiswa.some(m => m.email === email);
 if (hasMhs) {
 await mutate("mahasiswa", "update", { nama: updatedData.nama }, "email", email, true);
 }
 } else if (currentUser.role === "Dosen") {
 const hasDsn = state.dosen.some(d => d.email === email);
 if (hasDsn) {
 await mutate("dosen", "update", { nama: updatedData.nama }, "email", email, true);
 }
 }

 const nextUser = {
 ...currentUser,
 nama: updatedData.nama,
 fotoProfil: updatedData.fotoProfil || undefined,
 };
 setCurrentUser(nextUser);
 showToast("Profil Anda berhasil diperbarui!", "success");
 } catch (err) {
 console.error("Gagal memperbarui profil:", err);
 showToast("Gagal menyimpan perubahan profil.", "error");
 }
 };

 const handleToggleTheme = () => {
 const nextTheme = theme === "light" ? "dark" : "light";
 setTheme(nextTheme);
 document.documentElement.setAttribute("data-theme", nextTheme);
 safeStorage.setItem("simtesis_theme", nextTheme);
 };

 // Safe login handler
 const handleLoginSuccess = (user: Pengguna, userToken: string) => {
 setToken(userToken);
 setCurrentUser(user);
 setActiveTab("dashboard");
 showToast(`Selamat datang, ${user.nama}!`, "success");
 };

 const handleLogout = () => {
 setToken(null);
 setCurrentUser(null);
 safeStorage.removeItem("simtesis_active_tab");
 showToast("Anda berhasil keluar sistem.");
 };

 // Global search filters implementation
 const filterDataset = (arr: any[], fields: string[], customSearchVal?: string): any[] => {
 const val = typeof customSearchVal === "string" ? customSearchVal : searchVal;
 if (!val.trim()) return arr;
 const lower = val.toLowerCase();
 return arr.filter((item: any) =>
 fields.some((field) => String(item[field] || "").toLowerCase().includes(lower))
 );
 };

 // Dynamic Announcements running Marquee
 const activeAnnouncements = (state.pengumuman || []).filter((p) => p.aktif);

 if (rsvpParams) {
 return (
 <PublicRsvp
 scheduleId={rsvpParams.id}
 role={rsvpParams.role}
 name={rsvpParams.name}
 onClose={() => {
 const url = new URL(window.location.href);
 url.search = "";
 window.history.replaceState({}, document.title, url.toString());
 setRsvpParams(null);
 }}
 />
 );
 }

 return (
 <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] flex flex-col transition-colors duration-300 overflow-hidden relative">
 
 {/* SYNCHRONIZATION QUEUE INDICATION BOX */}
 <div className={`fixed bottom-6 left-6 bg-[var(--queue-bg)] text-[var(--queue-text)] px-4 py-3 rounded-full text-xs font-bold shadow-lg z-[999] flex items-center gap-3 transition-transform duration-300 ${isSyncing ? "translate-y-0" : "translate-y-24 pointer-events-none"}`}>
 <RefreshCw size={14} className="animate-spin text-[var(--brand-primary)]" />
 <span>SINKRONISASI DATABASE...</span>
 </div>

 {/* TOAST NOTIFICATION STACK */}
 <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[10000] no-print max-w-sm w-full p-4 pointer-events-none">
 {toasts.map((t) => (
 <div
 key={t.id}
 className={`pointer-events-auto bg-[var(--bg-surface)] text-[var(--text-main)] p-4 rounded-[var(--radius-md)] shadow-xl border-l-4 flex items-center gap-3.5 animate-slide-entry transition-all duration-300 ${
 t.type === "success"
 ? "border-[var(--brand-primary)]"
 : t.type === "warning"
 ? "border-[var(--accent-warning)]"
 : "border-[var(--accent-danger)]"
 }`}
 >
 <span className="text-xl">
 {t.type === "success" ? "" : t.type === "warning" ? "âš " : "âŒ"}
 </span>
 <div className="text-xs font-bold leading-normal">{t.msg}</div>
 </div>
 ))}
 </div>

 {/* RENDER LOGIN IF NOT LOGGED IN */}
 {!currentUser ? (
 <Login
 logo={state.logo}
 onLoginSuccess={handleLoginSuccess}
 />
 ) : (
 <div className="flex h-screen w-screen overflow-hidden relative">
 
 {/* SIDEBAR NAVIGATION PANE */}
 <Sidebar
 currentUser={currentUser}
 activeTab={activeTab}
 onTabChange={(id) => {
 setActiveTab(id);
 setSearchVal("");
 }}
 onLogout={handleLogout}
 logo={state.logo}
 state={state}
 mobileOpen={mobileSidebarOpen}
 onCloseMobile={() => setMobileSidebarOpen(false)}
 onProfileClick={() => setShowProfileModal(true)}
 />

 {/* MAIN AREA STAGE */}
 <div className="flex-1 flex flex-col overflow-hidden relative">
 
 {/* TOP BAR ACTION CONTROLS */}
 <Topbar
 title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("-", " ")}
 searchVal={searchVal}
 onSearchChange={setSearchVal}
 onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
 theme={theme}
 onToggleTheme={handleToggleTheme}
 currentUser={currentUser}
 googleUser={googleUser}
 onConnectGoogle={handleConnectGoogle}
 onDisconnectGoogle={handleDisconnectGoogle}
 onManageGoogleMeet={handleManageGoogleMeet}
 notifications={notifications}
 onMarkAllRead={handleMarkAllRead}
 onProfileClick={() => setShowProfileModal(true)}
 onLogout={handleLogout}
 breadcrumb={["Academics", currentUser.role, activeTab.replace("-", " ")]}
 />

 {/* MARQUEE RUNNING BAR - STRICTLY FOR DOSEN & MAHASISWA ROLE */}
 {(currentUser.role === "Dosen" || currentUser.role === "Mahasiswa") && activeAnnouncements.length > 0 && (
 <div className="bg-[var(--marquee-bg)] text-[var(--marquee-text)] py-2.5 px-6 font-semibold text-xs border-b border-[var(--border-color)] overflow-hidden whitespace-nowrap z-[5] no-print">
 <div className="inline-block animate-[marquee_30s_linear_infinite] whitespace-nowrap pl-[100%] hover:[animation-play-state:paused]">
 {activeAnnouncements.map((p, i) => (
 <span key={p.id}>
 {p.judul} &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;
 </span>
 ))}
 </div>
 </div>
 )}

 {/* CONTENT VIEWER SCROLL STAGE */}
 <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin relative">
 
 {/* RENDERING INDEPENDENT TAB PAGES */}

 {activeTab === "dashboard" && (
 <Dashboard
 currentUser={currentUser}
 state={state}
 onNavigate={(tab) => {
 setActiveTab(tab);
 setSearchVal("");
 }}
 />
 )}

 {/* 1. MANAJEMEN AKSES (SUPERADMIN ONLY) */}
 {activeTab === "users" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">Manajemen Hak Akses</h2>
 <p className="text-xs text-[var(--text-muted)]">Atur peran pengguna penanggung jawab Academics</p>
 </div>
 <button
 onClick={() => {
 setActiveModal({
 id: "add-user",
 title: "Daftarkan Pengguna Baru",
 content: (
 <form
 id="add-user-form"
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const nama = (form.elements.namedItem("nama") as HTMLInputElement).value;
 const email = (form.elements.namedItem("email") as HTMLInputElement).value;
 const role = (form.elements.namedItem("role") as HTMLSelectElement).value as any;
 const password = (form.elements.namedItem("password") as HTMLInputElement).value;
 const programStudi = (form.elements.namedItem("programStudi") as HTMLSelectElement).value || undefined;
 mutate("pengguna", "add", { nama, email, role, status: "Aktif", password, programStudi });
 if (role === "Mahasiswa") {
 mutate("mahasiswa", "add", { nim: "-", nama, email, judul: "-", status: "Aktif", peminatan: programStudi });
 } else if (role === "Dosen") {
 mutate("dosen", "add", { nidn: "-", nama, email, bidangKeahlian: "-", status: "Aktif" });
 }
 setActiveModal(null);
 showToast(`Pengguna baru ${nama} berhasil didaftarkan.`, "success");
 }}
 className="space-y-4"
 >
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Nama Lengkap</label>
 <input type="text" name="nama" required className="form-input text-xs font-semibold" placeholder="Nama Lengkap & Gelar" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Email Institusi (@um-pontianak.ac.id)</label>
 <input type="email" name="email" required className="form-input text-xs font-semibold" placeholder="user@um-pontianak.ac.id" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Role Akses</label>
 <select name="role" required className="form-input text-xs font-semibold">
 <option value="Admin">Admin Tesis</option>
 <option value="Superadmin">Super Admin</option>
 <option value="Prodi">Ketua Prodi</option>
 <option value="Dosen">Dosen Pembimbing</option>
 <option value="Mahasiswa">Mahasiswa</option>
 </select>
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Program Studi</label>
 <select name="programStudi" className="form-input text-xs font-semibold">
 <option value="">-- Tidak Ditentukan (Admin/Dosen) --</option>
 <option value="Ilmu Kesehatan Masyarakat">Prodi Ilmu Kesehatan Masyarakat (S1)</option>
 <option value="Psikologi">Prodi Psikologi (S1)</option>
 <option value="Magister Kesehatan Masyarakat">Prodi Magister Kesehatan Masyarakat (S2)</option>
 </select>
 <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">Pilihan wajib untuk akun Mahasiswa.</p>
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Kata Sandi Awal</label>
 <input type="text" name="password" required minLength={6} className="form-input text-xs font-semibold" placeholder="Kata sandi minimal 6 karakter" defaultValue="123456" />
 <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">Kata sandi default diset ke "123456".</p>
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">Batal</button>
 <button type="submit" form="add-user-form" className="btn btn-primary text-xs">Daftarkan</button>
 </div>
 ),
 });
 }}
 className="btn btn-primary text-xs flex items-center gap-1.5"
 >
 <Plus size={14} /> Tambah User
 </button>
 </div>

 {/* Dedicated search bar for user database */}
 <div className="relative max-w-sm">
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
 <Search size={14} />
 </span>
 <input
 type="text"
 placeholder="Cari nama, email, atau role pengguna..."
 value={searchUser}
 onChange={(e) => setSearchUser(e.target.value)}
 className="w-full pl-10 pr-9 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-disabled)] outline-none focus:border-[var(--brand-primary)] focus:ring-3 focus:ring-[rgba(15,110,86,0.08)] transition-all font-semibold"
 />
 {searchUser && (
 <button
 onClick={() => setSearchUser("")}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
 >
 <X size={14} />
 </button>
 )}
 </div>

 <div className="table-container">
 <table className="data-table">
 <thead>
 <tr>
 <th>Nama Pengguna</th>
 <th>Email Akun</th>
 <th>Role Pengguna</th>
 <th>Program Studi</th>
 <th>Status</th>
 <th>Tindakan</th>
 </tr>
 </thead>
 <tbody>
 {filterDataset(state.pengguna || [], ["nama", "email", "role", "programStudi"], searchUser).map((u) => (
 <tr key={u.id}>
 <td><b>{u.nama}</b></td>
 <td>{u.email}</td>
 <td>
 <span className={`pill ${u.role === "Superadmin" ? "pill-purple" : u.role === "Admin" ? "pill-info" : u.role === "Dosen" ? "pill-success" : "pill-warning"}`}>
 {u.role}
 </span>
 </td>
 <td>
 {u.programStudi ? (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 text-[9px] font-extrabold uppercase tracking-wide">
 {u.programStudi === "Ilmu Kesehatan Masyarakat" ? "IKM (S1)" : u.programStudi === "Psikologi" ? "Psikologi (S1)" : "MKM (S2)"}
 </span>
 ) : (
 <span className="text-[10px] text-[var(--text-disabled)] font-medium">"”</span>
 )}
 </td>
 <td>
 <span className={`pill ${u.status === "Aktif" ? "pill-success" : "pill-danger"}`}>
 {u.status}
 </span>
 </td>
 <td>
 <div className="flex flex-wrap gap-2">
 <button
 onClick={() => {
 mutate("pengguna", "update", { status: u.status === "Aktif" ? "Nonaktif" : "Aktif" }, "id", u.id);
 }}
 className="btn btn-secondary btn-sm text-xs font-bold"
 >
 {u.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
 </button>
 <button
 onClick={() => {
 setActiveModal({
 id: "change-password",
 title: `Ubah Kata Sandi: ${u.nama}`,
 content: (
 <form
 id="change-pwd-form"
 onSubmit={async (e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const newPwd = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
 if (newPwd.length < 6) {
 showToast("Kata sandi minimal berisi 6 karakter.", "warning");
 return;
 }
 try {
 await mutate("pengguna", "update", { password: newPwd }, "id", u.id, true);
 showToast(`Kata sandi untuk ${u.nama} berhasil diperbarui.`, "success");
 setActiveModal(null);
 } catch (err) {
 showToast("Gagal memperbarui kata sandi.", "error");
 }
 }}
 className="space-y-4 text-left animate-slide-entry"
 >
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">
 Kata Sandi Baru
 </label>
 <input
 type="text"
 name="newPassword"
 required
 minLength={6}
 className="form-input text-xs font-semibold"
 placeholder="Masukkan kata sandi baru (min 6 karakter)"
 defaultValue="123456"
 />
 <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">
 Masukkan kata sandi baru yang diinginkan untuk pengguna ini. Kata sandi ini akan langsung aktif.
 </p>
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">
 Batal
 </button>
 <button type="submit" form="change-pwd-form" className="btn btn-primary text-xs">
 Simpan Kata Sandi
 </button>
 </div>
 ),
 });
 }}
 className="btn btn-secondary btn-sm flex items-center gap-1 text-[var(--brand-primary)] border border-[var(--border-color)] hover:bg-[#f0fdfa] text-xs font-bold"
 title="Ganti/Set Kata Sandi"
 >
 <Lock size={12} className="shrink-0" />
 Ubah Sandi
 </button>
 <button
 onClick={() => mutate("pengguna", "delete", null, "id", u.id)}
 className="btn btn-sm text-[var(--accent-danger)] border border-[var(--border-color)] hover:bg-[var(--accent-danger-light)]"
 >
 <Trash2 size={13} />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* 2. PENGUMUMAN MARQUEE BAR MODUL */}
 {activeTab === "pengumuman" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">Kelola Pengumuman Banner</h2>
 <p className="text-xs text-[var(--text-muted)]">Informasi berjalan horizontal di layar pengguna</p>
 </div>
 <button
 onClick={() => {
 setActiveModal({
 id: "add-ann",
 title: "Buat Pengumuman Baru",
 content: (
 <form
 id="add-ann-form"
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const judul = (form.elements.namedItem("judul") as HTMLTextAreaElement).value;
 mutate("pengumuman", "add", { judul, tanggal: new Date().toISOString().slice(0, 10), aktif: true });
 setActiveModal(null);
 }}
 className="space-y-4"
 >
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Teks Pengumuman</label>
 <textarea name="judul" rows={3} required className="form-input text-xs font-semibold" placeholder="Tulis isi pengumuman penting di sini..." />
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">Batal</button>
 <button type="submit" form="add-ann-form" className="btn btn-primary text-xs">Terbitkan</button>
 </div>
 ),
 });
 }}
 className="btn btn-primary text-xs flex items-center gap-1.5"
 >
 <Plus size={14} /> Terbitkan Informasi
 </button>
 </div>

 <div className="table-container">
 <table className="data-table">
 <thead>
 <tr>
 <th>Isi Pengumuman</th>
 <th>Tanggal Rilis</th>
 <th>Status Tayang</th>
 <th>Modifikasi</th>
 </tr>
 </thead>
 <tbody>
 {filterDataset(state.pengumuman || [], ["judul"]).map((p) => (
 <tr key={p.id}>
 <td className="max-w-md font-medium">{p.judul}</td>
 <td>{p.tanggal}</td>
 <td>
 <span className={`pill ${p.aktif ? "pill-success" : "pill-danger"}`}>
 {p.aktif ? "Tampil" : "Draf"}
 </span>
 </td>
 <td>
 <div className="flex gap-2">
 <button
 onClick={() => mutate("pengumuman", "update", { aktif: !p.aktif }, "id", p.id)}
 className="btn btn-secondary btn-sm"
 >
 {p.aktif ? "Sembunyikan" : "Tampilkan"}
 </button>
 <button
 onClick={() => mutate("pengumuman", "delete", null, "id", p.id)}
 className="btn btn-sm text-[var(--accent-danger)] border border-[var(--border-color)] hover:bg-[var(--accent-danger-light)]"
 >
 <Trash2 size={13} />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* 3. DATA MAHASISWA MODUL */}
 {activeTab === "mahasiswa" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">Database Mahasiswa Magister</h2>
 <p className="text-xs text-[var(--text-muted)]">Informasi rekam akademis mahasiswa penulisan tesis</p>
 </div>
 {(currentUser.role === "Superadmin" || currentUser.role === "Admin") && (
 <button
 onClick={() => {
 setActiveModal({
 id: "add-mhs",
 title: "Daftarkan Mahasiswa",
 content: (
 <form
 id="add-mhs-form"
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const nim = (form.elements.namedItem("nim") as HTMLInputElement).value;
 const nama = (form.elements.namedItem("nama") as HTMLInputElement).value;
 const email = (form.elements.namedItem("email") as HTMLInputElement).value;
 const programStudi = (form.elements.namedItem("programStudi") as HTMLSelectElement).value;
 const peminatan = (form.elements.namedItem("peminatan") as HTMLSelectElement).value;
 mutate("mahasiswa", "add", { nim, nama, email, judul: "-", status: "Aktif", peminatan });
 if (!state.pengguna.find((u) => u.email === email)) {
 mutate("pengguna", "add", { nama, email, role: "Mahasiswa", status: "Aktif", programStudi });
 }
 setActiveModal(null);
 }}
 className="space-y-4"
 >
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">NIM</label>
 <input type="text" name="nim" required className="form-input text-xs font-semibold" placeholder="22100xxxx" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Nama Lengkap</label>
 <input type="text" name="nama" required className="form-input text-xs font-semibold" placeholder="Nama Mahasiswa" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Email</label>
 <input type="email" name="email" required className="form-input text-xs font-semibold" placeholder="mhs@um-pontianak.ac.id" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Program Studi</label>
 <select name="programStudi" required className="form-input text-xs font-bold select bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] w-full py-2 px-3 rounded-[var(--radius-md)] outline-none focus:border-[var(--brand-primary)]">
 <option value="Ilmu Kesehatan Masyarakat">Prodi Ilmu Kesehatan Masyarakat (S1)</option>
 <option value="Psikologi">Prodi Psikologi (S1)</option>
 <option value="Magister Kesehatan Masyarakat">Prodi Magister Kesehatan Masyarakat (S2)</option>
 </select>
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Peminatan / Konsentrasi</label>
 <select name="peminatan" className="form-input text-xs font-bold select bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] w-full py-2 px-3 rounded-[var(--radius-md)] outline-none focus:border-[var(--brand-primary)]">
 <option value="">-- Tidak Ada / Belum Ditentukan --</option>
 <option value="Kesehatan Lingkungan">Kesehatan Lingkungan</option>
 <option value="Promosi Kesehatan">Promosi Kesehatan</option>
 <option value="Epidemiologi Kesehatan">Epidemiologi Kesehatan</option>
 <option value="Gizi Kesehatan Masyarakat">Gizi Kesehatan Masyarakat</option>
 <option value="Keselamatan dan Kesehatan Kerja">Keselamatan dan Kesehatan Kerja</option>
 <option value="Kesehatan Reproduksi">Kesehatan Reproduksi</option>
 <option value="Kebijakan dan Manajemen Kesehatan">Kebijakan dan Manajemen Kesehatan</option>
 <option value="Klinis">Psikologi Klinis</option>
 <option value="Industri dan Organisasi">Psikologi Industri & Organisasi</option>
 </select>
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">Batal</button>
 <button type="submit" form="add-mhs-form" className="btn btn-primary text-xs">Simpan</button>
 </div>
 ),
 });
 }}
 className="btn btn-primary text-xs flex items-center gap-1.5"
 >
 <Plus size={14} /> Tambah Mahasiswa
 </button>
 )}
 </div>

 {/* Dedicated search bar for student database */}
 <div className="relative max-w-sm">
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
 <Search size={14} />
 </span>
 <input
 type="text"
 placeholder="Cari NIM, nama, atau email mahasiswa..."
 value={searchMhs}
 onChange={(e) => setSearchMhs(e.target.value)}
 className="w-full pl-10 pr-9 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-disabled)] outline-none focus:border-[var(--brand-primary)] focus:ring-3 focus:ring-[rgba(15,110,86,0.08)] transition-all font-semibold"
 />
 {searchMhs && (
 <button
 onClick={() => setSearchMhs("")}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
 >
 <X size={14} />
 </button>
 )}
 </div>

 <div className="table-container">
 <table className="data-table">
 <thead>
 <tr>
 <th>NIM</th>
 <th>Nama Lengkap</th>
 <th>Email Akun</th>
 <th>Program Studi / Peminatan</th>
 <th>Tindakan Rekomendasi</th>
 </tr>
 </thead>
 <tbody>
 {filterDataset(state.mahasiswa || [], ["nim", "nama", "email", "peminatan"], searchMhs).map((m) => (
 <tr key={m.id}>
 <td className="font-mono text-xs text-[var(--text-muted)] font-bold">{m.nim}</td>
 <td>
 <b>{m.nama}</b>
 {m.status === "Lulusan" && (
 <span className="ml-2 inline-block px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase border border-emerald-200">
 Graduated 
 </span>
 )}
 </td>
 <td>{m.email}</td>
 <td className="text-xs font-semibold text-[var(--text-muted)]">
 {(() => {
 const pengguna = state.pengguna.find(p => p.email === m.email);
 return (
 <div className="space-y-0.5">
 {pengguna?.programStudi && (
 <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 text-[9px] font-extrabold uppercase tracking-wide mb-0.5 block">
 {pengguna.programStudi === "Ilmu Kesehatan Masyarakat" ? "IKM (S1)" : pengguna.programStudi === "Psikologi" ? "Psikologi (S1)" : "MKM (S2)"}
 </div>
 )}
 <span>{m.peminatan || ""}</span>
 </div>
 );
 })()}
 </td>
 <td>
 <div className="flex gap-2">
 <button
 onClick={() => {
 setActiveModal({
 id: "edit-mhs",
 title: "Ubah Data Mahasiswa",
 content: (
 <form
 id="edit-mhs-form"
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const nameVal = (form.elements.namedItem("nama") as HTMLInputElement).value;
 const nimVal = (form.elements.namedItem("nim") as HTMLInputElement).value;
 const peminatanVal = (form.elements.namedItem("peminatan") as HTMLSelectElement).value;
 const programStudiVal = (form.elements.namedItem("programStudi") as HTMLSelectElement).value;
 mutate("mahasiswa", "update", { nama: nameVal, nim: nimVal, peminatan: peminatanVal }, "id", m.id);
 const penggunaMatch = state.pengguna.find(p => p.email === m.email);
 if (penggunaMatch && programStudiVal) {
 mutate("pengguna", "update", { programStudi: programStudiVal }, "id", penggunaMatch.id, true);
 }
 setActiveModal(null);
 }}
 className="space-y-4"
 >
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">NIM</label>
 <input type="text" name="nim" defaultValue={m.nim} required className="form-input text-xs font-semibold" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Nama Lengkap</label>
 <input type="text" name="nama" defaultValue={m.nama} required className="form-input text-xs font-semibold" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Program Studi</label>
 <select name="programStudi" defaultValue={state.pengguna.find(p => p.email === m.email)?.programStudi || "Magister Kesehatan Masyarakat"} className="form-input text-xs font-bold select bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] w-full py-2 px-3 rounded-[var(--radius-md)] outline-none focus:border-[var(--brand-primary)]">
 <option value="Ilmu Kesehatan Masyarakat">Prodi Ilmu Kesehatan Masyarakat (S1)</option>
 <option value="Psikologi">Prodi Psikologi (S1)</option>
 <option value="Magister Kesehatan Masyarakat">Prodi Magister Kesehatan Masyarakat (S2)</option>
 </select>
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Peminatan / Konsentrasi</label>
 <select name="peminatan" defaultValue={m.peminatan || ""} className="form-input text-xs font-bold select bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] w-full py-2 px-3 rounded-[var(--radius-md)] outline-none focus:border-[var(--brand-primary)]">
 <option value="">-- Tidak Ada / Belum Ditentukan --</option>
 <option value="Kesehatan Lingkungan">Kesehatan Lingkungan</option>
 <option value="Promosi Kesehatan">Promosi Kesehatan</option>
 <option value="Epidemiologi Kesehatan">Epidemiologi Kesehatan</option>
 <option value="Gizi Kesehatan Masyarakat">Gizi Kesehatan Masyarakat</option>
 <option value="Keselamatan dan Kesehatan Kerja">Keselamatan dan Kesehatan Kerja</option>
 <option value="Kesehatan Reproduksi">Kesehatan Reproduksi</option>
 <option value="Kebijakan dan Manajemen Kesehatan">Kebijakan dan Manajemen Kesehatan</option>
 <option value="Klinis">Psikologi Klinis</option>
 <option value="Industri dan Organisasi">Psikologi Industri & Organisasi</option>
 </select>
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">Batal</button>
 <button type="submit" form="edit-mhs-form" className="btn btn-primary text-xs">Simpan Perubahan</button>
 </div>
 ),
 });
 }}
 className="btn btn-secondary btn-sm"
 >
 Edit
 </button>
 <button
 onClick={() => mutate("mahasiswa", "delete", null, "id", m.id)}
 className="btn btn-sm text-[var(--accent-danger)] border border-[var(--border-color)] hover:bg-[var(--accent-danger-light)]"
 >
 <Trash2 size={13} />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* 4. DATA DOSEN MODUL */}
 {activeTab === "dosen" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">Direktori Dosen Pembimbing</h2>
 <p className="text-xs text-[var(--text-muted)]">Database Keahlian Bidang Dewan Pengajar S2</p>
 </div>
 {(currentUser.role === "Superadmin" || currentUser.role === "Admin") && (
 <button
 onClick={() => {
 setActiveModal({
 id: "add-dsn",
 title: "Daftarkan Dosen Baru",
 content: (
 <form
 id="add-dsn-form"
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const nidn = (form.elements.namedItem("nidn") as HTMLInputElement).value;
 const nama = (form.elements.namedItem("nama") as HTMLInputElement).value;
 const email = (form.elements.namedItem("email") as HTMLInputElement).value;
 const bidang = (form.elements.namedItem("bidang") as HTMLInputElement).value;
 mutate("dosen", "add", { nidn, nama, email, bidangKeahlian: bidang, status: "Aktif" });
 if (!state.pengguna.find((u) => u.email === email)) {
 mutate("pengguna", "add", { nama, email, role: "Dosen", status: "Aktif" });
 }
 setActiveModal(null);
 }}
 className="space-y-4"
 >
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">NIDN</label>
 <input type="text" name="nidn" required className="form-input text-xs font-semibold" placeholder="10xxxxxxxx" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Nama Dosen (Lengkap & Gelar)</label>
 <input type="text" name="nama" required className="form-input text-xs font-semibold" placeholder="Dr. xxxxx, M.PH" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Email</label>
 <input type="email" name="email" required className="form-input text-xs font-semibold" placeholder="dosen@um-pontianak.ac.id" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Fokus Keahlian Penelitian</label>
 <input type="text" name="bidang" required className="form-input text-xs font-semibold" placeholder="Epidemiologi / Kesling / K3" />
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">Batal</button>
 <button type="submit" form="add-dsn-form" className="btn btn-primary text-xs">Simpan</button>
 </div>
 ),
 });
 }}
 className="btn btn-primary text-xs flex items-center gap-1.5"
 >
 <Plus size={14} /> Tambah Dosen
 </button>
 )}
 </div>

 <div className="table-container">
 <table className="data-table">
 <thead>
 <tr>
 <th>NIDN</th>
 <th>Nama Dosen</th>
 <th>Bidang Keahlian</th>
 <th>Email</th>
 <th>Aksi</th>
 </tr>
 </thead>
 <tbody>
 {filterDataset(state.dosen || [], ["nidn", "nama", "email", "bidangKeahlian"]).map((d) => (
 <tr key={d.id}>
 <td className="font-mono text-xs font-bold text-[var(--text-muted)]">{d.nidn}</td>
 <td><b>{d.nama}</b></td>
 <td><span className="pill pill-success">{d.bidangKeahlian}</span></td>
 <td>{d.email}</td>
 <td>
 <div className="flex gap-2">
 <button
 onClick={() => {
 setActiveModal({
 id: "edit-dsn",
 title: "Ubah Data Pengajar",
 content: (
 <form
 id="edit-dsn-form"
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const updatedNama = (form.elements.namedItem("nama") as HTMLInputElement).value;
 const updatedBidang = (form.elements.namedItem("bidang") as HTMLInputElement).value;
 mutate("dosen", "update", { nama: updatedNama, bidangKeahlian: updatedBidang }, "id", d.id);
 setActiveModal(null);
 }}
 className="space-y-4"
 >
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Nama Lengkap</label>
 <input type="text" name="nama" defaultValue={d.nama} required className="form-input text-xs font-semibold" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Bidang Keahlian</label>
 <input type="text" name="bidang" defaultValue={d.bidangKeahlian} required className="form-input text-xs font-semibold" />
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">Batal</button>
 <button type="submit" form="edit-dsn-form" className="btn btn-primary text-xs">Simpan</button>
 </div>
 ),
 });
 }}
 className="btn btn-secondary btn-sm"
 >
 Edit
 </button>
 <button
 onClick={() => mutate("dosen", "delete", null, "id", d.id)}
 className="btn btn-sm text-[var(--accent-danger)] border border-[var(--border-color)] hover:bg-[var(--accent-danger-light)]"
 >
 <Trash2 size={13} />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* 5. ASSIGN PEMBIMBING MODUL */}
 {activeTab === "assign" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">Penunjukan Tim Pembimbing & Penguji</h2>
 <p className="text-xs text-[var(--text-muted)]">Otorisasi Pembimbing Akademik Tesis Mahasiswa</p>
 </div>
 <button
 onClick={() => {
 const unassigned = (state.mahasiswa || []).filter(
 (m) => !(state.bimbingan || []).some((b) => b.mahasiswaId === m.id)
 );
 if (unassigned.length === 0) {
 showToast("Semua mahasiswa aktif telah ter-assign pembimbing.", "warning");
 return;
 }
 setActiveModal({
 id: "add-bimb",
 title: "Tunjuk Tim Bimbingan",
 content: (
 <form
 id="add-bimb-form"
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const mId = (form.elements.namedItem("mhs") as HTMLSelectElement).value;
 const pb1 = (form.elements.namedItem("pb1") as HTMLSelectElement).value;
 const pb2 = (form.elements.namedItem("pb2") as HTMLSelectElement).value;
 mutate("bimbingan", "add", {
 mahasiswaId: mId,
 pembimbing1: pb1,
 pembimbing2: pb2,
 penguji1: "",
 penguji2: "",
 tanggalDiassign: new Date().toISOString().slice(0, 10),
 });
 setActiveModal(null);
 }}
 className="space-y-4"
 >
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Mahasiswa</label>
 <select name="mhs" required className="form-input text-xs font-semibold">
 {unassigned.map((m) => (
 <option key={m.id} value={m.id}>{m.nama} ({m.nim})</option>
 ))}
 </select>
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Pembimbing Utama (Pb 1)</label>
 <select name="pb1" required className="form-input text-xs font-semibold">
 {state.dosen.map((d) => (
 <option key={d.id} value={d.email}>{d.nama}</option>
 ))}
 </select>
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Pembimbing Pendamping (Pb 2)</label>
 <select name="pb2" className="form-input text-xs font-semibold">
 <option value="">-- Tidak Ada --</option>
 {state.dosen.map((d) => (
 <option key={d.id} value={d.email}>{d.nama}</option>
 ))}
 </select>
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">Batal</button>
 <button type="submit" form="add-bimb-form" className="btn btn-primary text-xs">Simpan Tim</button>
 </div>
 ),
 });
 }}
 className="btn btn-primary text-xs flex items-center gap-1.5"
 >
 <Plus size={14} /> Assign Baru
 </button>
 </div>

 <div className="table-container">
 <table className="data-table">
 <thead>
 <tr>
 <th>Mahasiswa</th>
 <th>Pembimbing 1 (Utama)</th>
 <th>Pembimbing 2 (Pendamping)</th>
 <th>Penguji 1 / 2</th>
 <th>Tindakan</th>
 </tr>
 </thead>
 <tbody>
 {(state.mahasiswa || []).map((m) => {
 const b = (state.bimbingan || []).find((x) => x.mahasiswaId === m.id);
 const getDosenName = (email: string) => (state.dosen || []).find((d) => d.email === email)?.nama || "-";

 return (
 <tr key={m.id}>
 <td>
 <b>{m.nama}</b>
 {m.status === "Lulusan" && (
 <span className="ml-2 inline-block px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase border border-emerald-200">
 Graduated 
 </span>
 )}
 <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">{m.nim}</div>
 </td>
 {b ? (
 <>
 <td className="font-semibold text-[var(--brand-primary)]">{getDosenName(b.pembimbing1)}</td>
 <td className="font-medium text-[var(--text-main)]">{b.pembimbing2 ? getDosenName(b.pembimbing2) : <span className="opacity-60">-</span>}</td>
 <td>
 <div className="text-[11px] font-semibold text-[var(--text-muted)]">
 1: {b.penguji1 ? getDosenName(b.penguji1) : <span className="opacity-50">Belum</span>}
 </div>
 <div className="text-[11px] font-semibold text-[var(--text-muted)]">
 2: {b.penguji2 ? getDosenName(b.penguji2) : <span className="opacity-50">Belum</span>}
 </div>
 </td>
 <td>
 <div className="flex gap-2">
 <button
 onClick={() => {
 setActiveModal({
 id: "edit-bimb",
 title: `Modifikasi Penguji/Akademik: ${m.nama}`,
 content: (
 <form
 id="edit-bimb-form"
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const d1 = (form.elements.namedItem("p1") as HTMLSelectElement).value;
 const d2 = (form.elements.namedItem("p2") as HTMLSelectElement).value;
 const x1 = (form.elements.namedItem("x1") as HTMLSelectElement).value;
 const x2 = (form.elements.namedItem("x2") as HTMLSelectElement).value;
 mutate("bimbingan", "update", {
 pembimbing1: d1,
 pembimbing2: d2,
 penguji1: x1,
 penguji2: x2,
 }, "id", b.id);
 setActiveModal(null);
 }}
 className="space-y-4"
 >
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Pembimbing 1</label>
 <select name="p1" defaultValue={b.pembimbing1} className="form-input text-xs font-semibold">
 {state.dosen.map((d) => (
 <option key={d.id} value={d.email}>{d.nama}</option>
 ))}
 </select>
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Pembimbing 2</label>
 <select name="p2" defaultValue={b.pembimbing2} className="form-input text-xs font-semibold">
 <option value="">-- Tidak Ada --</option>
 {state.dosen.map((d) => (
 <option key={d.id} value={d.email}>{d.nama}</option>
 ))}
 </select>
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Dosen Penguji 1</label>
 <select name="x1" defaultValue={b.penguji1} className="form-input text-xs font-semibold">
 <option value="">-- Belum Ditunjuk --</option>
 {state.dosen.map((d) => (
 <option key={d.id} value={d.email}>{d.nama}</option>
 ))}
 </select>
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Dosen Penguji 2</label>
 <select name="x2" defaultValue={b.penguji2} className="form-input text-xs font-semibold">
 <option value="">-- Belum Ditunjuk --</option>
 {state.dosen.map((d) => (
 <option key={d.id} value={d.email}>{d.nama}</option>
 ))}
 </select>
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">Batal</button>
 <button type="submit" form="edit-bimb-form" className="btn btn-primary text-xs">Terapkan</button>
 </div>
 ),
 });
 }}
 className="btn btn-secondary btn-sm"
 >
 Edit
 </button>
 <button
 onClick={() => mutate("bimbingan", "delete", null, "id", b.id)}
 className="btn btn-sm text-[var(--accent-danger)] border border-[var(--border-color)] hover:bg-[var(--accent-danger-light)] animate-fade-entry"
 >
 <Trash2 size={13} />
 </button>
 </div>
 </td>
 </>
 ) : (
 <td colSpan={4} className="text-center py-4">
 <span className="pill pill-warning">Belum diassign dosen pembimbing</span>
 </td>
 )}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* 6. JADWAL SEMINAR & SIDANG MODUL */}
 {activeTab === "jadwalsidang" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">Jadwal Seminar & Sidang Kelayakan</h2>
 <p className="text-xs text-[var(--text-muted)]">Pengaturan penyelenggaraan ujian seminar proposal, seminar hasil, dan sidang akhir tesis</p>
 </div>
 <button
 onClick={() => {
 setActiveModal({
 id: "add-sid",
 title: "Buat Agenda Seminar/Sidang Pelaksanaan",
 content: (
 <ScheduleForm
 state={state}
 currentUser={currentUser}
 isAdminMode={true}
 googleToken={googleToken}
 onConnectGoogle={handleConnectGoogle}
 onSubmit={(values) => {
 const targetM = state.mahasiswa.find((x) => x.id === values.mahasiswaId);
 mutate("jadwalsidang", "add", {
 mahasiswaId: values.mahasiswaId,
 namaMahasiswa: targetM?.nama || "-",
 tanggal: values.tanggal,
 waktu: values.waktu,
 ruang: values.ruang,
 penguji1: values.penguji1,
 penguji2: values.penguji2,
 status: "Dijadwalkan",
 jenisUjian: values.jenisUjian,
 diusulkanOleh: "Staf",
 accMahasiswa: "Menunggu",
 accPenguji1: values.isExternalPenguji1 ? "Disetujui" : (values.penguji1 ? "Menunggu" : "Tidak Ada"),
 accPenguji2: values.isExternalPenguji2 ? "Disetujui" : (values.penguji2 ? "Menunggu" : "Tidak Ada"),
 accProdi: "Disetujui",
 catatan: values.catatan,
 meetLink: values.meetLink,
 calendarEventId: values.calendarEventId,
 isExternalPenguji1: values.isExternalPenguji1,
 externalPenguji1Name: values.externalPenguji1Name,
 externalPenguji1Instansi: values.externalPenguji1Instansi,
 isExternalPenguji2: values.isExternalPenguji2,
 externalPenguji2Name: values.externalPenguji2Name,
 externalPenguji2Instansi: values.externalPenguji2Instansi,
 });
 setActiveModal(null);
 showToast("Agenda seminar/sidang baru berhasil diterbitkan!", "success");
 }}
 onClose={() => setActiveModal(null)}
 />
 ),
 });
 }}
 className="btn btn-primary text-xs flex items-center gap-1.5 font-bold"
 >
 <Plus size={14} /> Atur Jadwal Baru
 </button>
 </div>

 {/* Sub Views Switcher (Tab Buttons) */}
 <div className="flex border-b border-[var(--border-color)] pb-3 mb-4 gap-2 flex-wrap">
 <button
 onClick={() => setSchedSubView("daftar")}
 className={`py-2 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer ${
 schedSubView === "daftar"
 ? "bg-[var(--brand-primary)] text-white shadow-sm font-extrabold"
 : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-slate-50 dark:hover:bg-slate-900"
 }`}
 >
 Daftar Agenda (Tabel)
 </button>
 <button
 onClick={() => setSchedSubView("kalender")}
 className={`py-2 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer ${
 schedSubView === "kalender"
 ? "bg-[var(--brand-primary)] text-white shadow-sm font-extrabold"
 : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-slate-50 dark:hover:bg-slate-900"
 }`}
 >
 Kalender Bulanan (Interaktif)
 </button>
 {(currentUser.role === "Superadmin" || currentUser.role === "Admin" || currentUser.role === "Prodi") && (
 <button
 onClick={() => setSchedSubView("beban")}
 className={`py-2 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer ${
 schedSubView === "beban"
 ? "bg-[var(--brand-primary)] text-white shadow-sm font-extrabold"
 : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-slate-50 dark:hover:bg-slate-900"
 }`}
 >
 âš–  Pemerataan Beban Dosen
 </button>
 )}
 </div>

 {schedSubView === "daftar" && (
 <div className="table-container">
 <table className="data-table">
 <thead>
 <tr>
 <th>Mahasiswa / Pengusul</th>
 <th>Tipe & Agenda</th>
 <th>Dewan Penguji</th>
 <th>Status Persetujuan (Electronic Signature)</th>
 <th>Tindakan Operasional</th>
 </tr>
 </thead>
 <tbody>
 {filterDataset(state.jadwalSidang || [], ["namaMahasiswa", "ruang"]).map((s) => {
 const getLectName = (email: string, isExternal?: boolean, extName?: string, extInstansi?: string) => {
 if (isExternal && extName) {
 return `${extName} (Luar - ${extInstansi || "Instansi Lain"})`;
 }
 return state.dosen.find((d) => d.email === email)?.nama || email;
 };

 return (
 <tr key={s.id} className="text-left">
 <td>
 <div className="font-extrabold text-xs text-[var(--text-main)]">{s.namaMahasiswa}</div>
 <div className="mt-1 flex gap-1">
 {s.diusulkanOleh === "Mahasiswa" ? (
 <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
 Diusulkan Mahasiswa
 </span>
 ) : (
 <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
 Diajukan Prodi/Admin
 </span>
 )}
 </div>
 </td>
 <td>
 <div className="text-[10px] font-extrabold text-[var(--brand-primary)] uppercase bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-850/40 px-1.5 py-0.5 rounded inline-block mb-1">
 {s.jenisUjian || "Sidang Tesis"}
 </div>
 <div className="text-xs font-bold text-[var(--text-main)]">{s.tanggal}</div>
 <div className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">Jam {s.waktu} | {s.ruang}</div>
 {s.meetLink && (
 <div className="mt-1.5">
 <a 
 href={s.meetLink} 
 target="_blank" 
 rel="noopener noreferrer" 
 className="inline-flex items-center gap-1.5 text-[9.5px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
 >
 <Video size={11} className="text-emerald-500 animate-pulse shrink-0" /> Gabung Google Meet
 </a>
 </div>
 )}
 </td>
 <td>
 <div className="text-[10px] font-semibold text-[var(--text-muted)]">
 Penguji 1: <b className="text-[var(--text-main)]">{getLectName(s.penguji1, s.isExternalPenguji1, s.externalPenguji1Name, s.externalPenguji1Instansi)}</b>
 </div>
 <div className="text-[10px] font-semibold text-[var(--text-muted)] mt-0.5">
 Penguji 2: <b className="text-[var(--text-main)]">{getLectName(s.penguji2, s.isExternalPenguji2, s.externalPenguji2Name, s.externalPenguji2Instansi)}</b>
 </div>
 </td>
 <td>
 <div className="space-y-1 font-semibold text-[9.5px]">
 <div className="flex justify-between max-w-[170px] gap-2 border-b border-[var(--border-color)] pb-0.5">
 <span className="text-slate-400">Mahasiswa:</span>
 <span className={s.accMahasiswa === "Disetujui" ? "text-emerald-600 font-extrabold" : s.accMahasiswa === "Ditolak" ? "text-rose-600 font-bold" : "text-amber-500 font-medium"}>
 {s.accMahasiswa || "Menunggu"}
 </span>
 </div>
 <div className="flex justify-between max-w-[170px] gap-2 border-b border-[var(--border-color)] pb-0.5">
 <span className="text-slate-400">Penguji 1 (Dosen):</span>
 <span className={s.accPenguji1 === "Disetujui" ? "text-emerald-600 font-extrabold" : s.accPenguji1 === "Ditolak" ? "text-rose-600 font-bold" : "text-amber-500 font-medium"}>
 {s.accPenguji1 || "Menunggu"}
 </span>
 </div>
 <div className="flex justify-between max-w-[170px] gap-2 border-b border-[var(--border-color)] pb-0.5">
 <span className="text-slate-400">Penguji 2 (Dosen):</span>
 <span className={s.accPenguji2 === "Disetujui" ? "text-emerald-600 font-extrabold" : s.accPenguji2 === "Ditolak" ? "text-rose-600 font-bold" : "text-amber-500 font-medium"}>
 {s.accPenguji2 || "Menunggu"}
 </span>
 </div>
 <div className="flex justify-between max-w-[170px] gap-2">
 <span className="text-slate-400">Kajur/Prodi:</span>
 <span className={s.accProdi === "Disetujui" ? "text-emerald-600 font-extrabold" : s.accProdi === "Ditolak" ? "text-rose-600 font-bold" : "text-amber-500 font-medium"}>
 {s.accProdi || "Menunggu"}
 </span>
 </div>
 </div>
 </td>
 <td className="space-y-1.5">
 {s.accProdi === "Menunggu" && (
 <div className="flex gap-1.5">
 <button
 onClick={async () => {
 await mutate("jadwalsidang", "update", { accProdi: "Disetujui" }, "id", s.id);
 showToast("Berhasil menyetujui (ACC) usulan jadwal seminar/sidang!", "success");
 }}
 className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1 px-2 rounded cursor-pointer animate-pulse"
 >
 âœ“ Setujui Usulan
 </button>
 <button
 onClick={async () => {
 await mutate("jadwalsidang", "update", { accProdi: "Ditolak" }, "id", s.id);
 showToast("Sikap penolakan disimpan terhadap usulan jadwal.", "warning");
 }}
 className="btn btn-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold py-1 px-2 rounded cursor-pointer"
 >
 Tolak
 </button>
 </div>
 )}
 <div>
 <div className="flex flex-col sm:flex-row gap-1 border-t border-[var(--border-color)] pt-1.5 mt-1.5">
 <button
 onClick={() => handleOpenWaReminderModal(s)}
 className="btn btn-sm text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 text-[10px] font-extrabold py-1 px-2 rounded cursor-pointer flex items-center gap-1 justify-center shrink-0 w-full"
 >
 <span> Notifikasi WA</span>
 </button>
 <button
 onClick={() => {
 if(confirm("Apakah Anda yakin ingin menghapus agenda jadwal ini?")) {
 mutate("jadwalsidang", "delete", null, "id", s.id);
 showToast("Jadwal seminar/sidang berhasil dihapus.", "success");
 }
 }}
 className="btn btn-sm text-[var(--accent-danger)] border border-[var(--border-color)] hover:bg-[var(--accent-danger-light)] text-[10px] font-semibold py-1 px-2 rounded cursor-pointer w-full text-center"
 >
 Hapus
 </button>
 </div>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}

 {schedSubView === "kalender" && (
 <ScheduleCalendar
 schedules={state.jadwalSidang || []}
 state={state}
 currentUser={currentUser}
 onOpenWaModal={handleOpenWaReminderModal}
 onAddScheduleAtDate={(dateStr) => {
 setActiveModal({
 id: "add-sid",
 title: `Buat Agenda Seminar/Sidang Pelaksanaan (${dateStr})`,
 content: (
 <ScheduleForm
 state={state}
 currentUser={currentUser}
 isAdminMode={true}
 googleToken={googleToken}
 onConnectGoogle={handleConnectGoogle}
 initialValues={{ tanggal: dateStr }}
 onSubmit={(values) => {
 const targetM = state.mahasiswa.find((x) => x.id === values.mahasiswaId);
 mutate("jadwalsidang", "add", {
 mahasiswaId: values.mahasiswaId,
 namaMahasiswa: targetM?.nama || "-",
 tanggal: values.tanggal,
 waktu: values.waktu,
 ruang: values.ruang,
 penguji1: values.penguji1,
 penguji2: values.penguji2,
 status: "Dijadwalkan",
 jenisUjian: values.jenisUjian,
 diusulkanOleh: "Staf",
 accMahasiswa: "Menunggu",
 accPenguji1: values.isExternalPenguji1 ? "Disetujui" : (values.penguji1 ? "Menunggu" : "Tidak Ada"),
 accPenguji2: values.isExternalPenguji2 ? "Disetujui" : (values.penguji2 ? "Menunggu" : "Tidak Ada"),
 accProdi: "Disetujui",
 catatan: values.catatan,
 meetLink: values.meetLink,
 calendarEventId: values.calendarEventId,
 isExternalPenguji1: values.isExternalPenguji1,
 externalPenguji1Name: values.externalPenguji1Name,
 externalPenguji1Instansi: values.externalPenguji1Instansi,
 isExternalPenguji2: values.isExternalPenguji2,
 externalPenguji2Name: values.externalPenguji2Name,
 externalPenguji2Instansi: values.externalPenguji2Instansi,
 });
 setActiveModal(null);
 showToast("Agenda seminar/sidang baru berhasil diterbitkan!", "success");
 }}
 onClose={() => setActiveModal(null)}
 />
 ),
 });
 }}
 showToast={showToast}
 />
 )}

 {schedSubView === "beban" && (currentUser.role === "Superadmin" || currentUser.role === "Admin" || currentUser.role === "Prodi") && (
 <DosenWorkloadEqualizer
 state={state}
 showToast={showToast}
 />
 )}
 </div>
 )}

 {/* 7. VERIFIKASI PENDAFTARAN TESIS (ADMIN ONLY OR PRODI) */}
 {activeTab === "pendaftaran-admin" && (
 <div className="space-y-6 text-left">
 <PendaftaranTesisTab
 currentUser={currentUser!}
 state={state}
 mutate={mutate}
 showToast={showToast}
 />

 {/* ADMIN PRE-SCREENING FOR DRAFT TITLES */}
 {(currentUser.role === "Admin" || currentUser.role === "Superadmin" || currentUser.role === "Prodi") && (
 <div className="card shadow-sm border border-[var(--border-color)]">
 <div className="card-header pb-4 border-b border-[var(--border-color)] mb-4">
 <h2 className="text-md font-extrabold text-[var(--text-main)]">Pemeriksaan & Validasi Administrasi Usulan Judul Tesis</h2>
 <p className="text-xs text-[var(--text-muted)] font-medium">Validasi draf usulan judul yang telah disahkan Dosen Mandiri agar dapat diteruskan ke Ketua Program Studi</p>
 </div>

 <div className="table-container">
 <table className="data-table">
 <thead>
 <tr>
 <th>Mahasiswa</th>
 <th>Usulan Judul Tesis</th>
 <th>Status Usulan</th>
 <th>Tindakan Verifikasi</th>
 </tr>
 </thead>
 <tbody>
 {(() => {
 const filteredTitles = (state.judul || []).filter(j => j.status === "Disetujui" || j.status === "Menunggu");
 if (filteredTitles.length === 0) {
 return (
 <tr>
 <td colSpan={4} className="text-center text-xs py-6 text-[var(--text-muted)]">
 Tidak ada usulan judul tesis baru yang memerlukan draf screening administrasi saat ini.
 </td>
 </tr>
 );
 }
 return filteredTitles.reverse().map((j) => (
 <tr key={j.id}>
 <td>
 <b>{j.namaMahasiswa}</b>
 <div className="text-[10px] text-[var(--text-muted)] font-medium">{j.mahasiswaEmail}</div>
 </td>
 <td className="max-w-md">
 <div className="font-semibold text-xs leading-relaxed">{j.judul}</div>
 <div className="text-[10px] text-[var(--text-muted)] truncate max-w-sm mt-1">{j.abstrak}</div>
 </td>
 <td>
 <span className={`pill ${j.status === "Disetujui" ? "pill-success" : "pill-warning"}`}>
 {j.status === "Disetujui" ? "Disetujui Dosen" : "Menunggu Dosen"}
 </span>
 </td>
 <td>
 <button
 onClick={() => mutate("judul", "update", { status: "Telah Dicek Admin", catatan: "Kelayakan berkas lengkap, diteruskan ke Kaprodi." }, "id", j.id)}
 className="btn btn-primary text-[10px] py-1 px-2.5 font-bold flex items-center gap-1 cursor-pointer"
 >
 âœ“ Lengkap & Teruskan ke Prodi
 </button>
 </td>
 </tr>
 ));
 })()}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )}

 {/* 8. VERIFIKASI SURAT RESMI (ADMIN / SUPERADMIN) */}
 {activeTab === "surat" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4">
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">Panel Verifikasi Surat & Dokumen Izin</h2>
 <p className="text-xs text-[var(--text-muted)] font-medium">Pengesahan surat permohonan izin survei atau data awal mahasiswa</p>
 </div>

 <div className="table-container">
 <table className="data-table">
 <thead>
 <tr>
 <th>Tanggal</th>
 <th>Mahasiswa</th>
 <th>Program Studi</th>
 <th>Jenis & Instansi Sasaran</th>
 <th>Status Resmi</th>
 <th>Aksi Penerbitan</th>
 </tr>
 </thead>
 <tbody>
 {filterDataset(state.pesanSurat || [], ["namaMahasiswa", "jenisSurat", "tujuanSurat", "programStudi"]).reverse().map((surat) => (
 <tr key={surat.id}>
 <td className="text-xs text-[var(--text-muted)] font-bold">{surat.tanggal}</td>
 <td><b>{surat.namaMahasiswa}</b></td>
 <td>
 {surat.programStudi ? (
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 text-[9px] font-extrabold uppercase tracking-wide">
 {surat.programStudi === "Ilmu Kesehatan Masyarakat" ? "IKM (S1)" : surat.programStudi === "Psikologi" ? "Psikologi (S1)" : "MKM (S2)"}
 </span>
 ) : <span className="text-[10px] text-[var(--text-disabled)]"></span>}
 </td>
 <td>
 <div className="text-xs font-bold text-[var(--brand-primary)]">{surat.jenisSurat}</div>
 <div className="text-[11px] text-[var(--text-muted)] font-semibold mt-0.5">{surat.tujuanSurat}</div>
 </td>
 <td>
 <span className={`pill ${surat.status === "Disetujui" ? "pill-success" : surat.status === "Ditolak" ? "pill-danger" : "pill-warning"}`}>
 {surat.status}
 </span>
 </td>
 <td>
 {surat.status === "Menunggu" ? (
 <div className="flex gap-2">
 <button
 onClick={() => {
 setActiveModal({
 id: "issue-surat",
 title: "Konfirmasi Penerbitan Surat",
 content: (
 <form
 id="issue-surat-form"
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const sn = (form.elements.namedItem("nomor") as HTMLInputElement).value;
 mutate("pesanSurat", "update", { status: "Disetujui", nomorSurat: sn }, "id", surat.id);
 setActiveModal(null);
 }}
 className="space-y-4"
 >
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Tentukan Nomor Surat Keluar Resmi</label>
 <input type="text" name="nomor" required defaultValue={`098/II.3.AU.15/K/FIKPsi/${new Date().getFullYear()}`} className="form-input text-xs font-semibold" />
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">Batal</button>
 <button type="submit" form="issue-surat-form" className="btn btn-primary text-xs">Setujui & Terbitkan</button>
 </div>
 ),
 });
 }}
 className="btn btn-success btn-sm text-[11px]"
 >
 Terbitkan
 </button>
 <button
 onClick={() => mutate("pesanSurat", "update", { status: "Ditolak", catatan: "Data kurang spesifik" }, "id", surat.id)}
 className="btn btn-danger btn-sm text-[11px]"
 >
 Tolak
 </button>
 </div>
 ) : surat.status === "Disetujui" ? (
 <button
 onClick={() => setPrintData(surat)}
 className="btn btn-secondary btn-sm text-[11px] flex items-center gap-1"
 >
 Print Preview
 </button>
 ) : (
 <span className="text-xs text-[var(--text-disabled)] font-bold">Ditolak</span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* 9. PENGATURAN LOGO & GAS ENDPOINT (SUPERADMIN / ADMIN) */}
 {activeTab === "pengaturan" && (
 <div className="space-y-6 text-left max-w-2xl">
 <div className="card">
 <h2 className="text-lg font-extrabold text-[var(--text-main)] mb-1">Pengaturan Sistem</h2>
 <p className="text-xs text-[var(--text-muted)] mb-6">Kelola visual logo serta konfigurasi database Academics</p>

 {/* âœ   PENGATURAN PEJABAT DEKAN (ADMIN & SUPERADMIN) */}
 <div className="border-t border-[var(--border-color)] pt-5 mb-6">
 <h3 className="text-sm font-bold tracking-tight uppercase text-[var(--text-main)] mb-1">âœ   Pengaturan Pejabat Penandatangan</h3>
 <p className="text-xs text-[var(--text-muted)] mb-4">
 Sesuaikan nama, NIDN, dan nama jabatan Dekan atau pejabat berwenang yang bertandatangan di seluruh lembar berkas administrasi dan Surat Keputusan (SK).
 </p>
 
 <div className="space-y-4 max-w-md">
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Nama Lengkap Pejabat (beserta Gelar)</label>
 <input
 type="text"
 value={dekanNama}
 onChange={(e) => setDekanNama(e.target.value)}
 className="form-input text-xs font-semibold"
 placeholder="e.g. Ismael Saleh, S.K.M., M.Sc."
 />
 </div>

 <div className="form-group border-t border-dashed border-[var(--border-color)] pt-2 border-slate-200/55">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Status Kepegawaian (NIDN / NIP)</label>
 <input
 type="text"
 value={dekanNidn}
 onChange={(e) => setDekanNidn(e.target.value)}
 className="form-input text-xs font-semibold"
 placeholder="e.g. 0411030052"
 />
 </div>

 <div className="form-group border-t border-dashed border-[var(--border-color)] pt-2 border-slate-200/55">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Nama Jabatan / Fakultas</label>
 <input
 type="text"
 value={dekanJabatan}
 onChange={(e) => setDekanJabatan(e.target.value)}
 className="form-input text-xs font-semibold"
 placeholder="e.g. Dekan Fakultas Ilmu Kesehatan dan Psikologi"
 />
 </div>

 <button
 onClick={handleSaveDekanConfig}
 className="btn btn-primary text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 flex items-center gap-1 mt-2"
 >
 Simpan Pengaturan Pejabat
 </button>
 </div>
 </div>

 {/* PENGATURAN WHATSAPP GATEWAY REMINDER */}
 <div className="border-t border-[var(--border-color)] pt-5 mb-6">
 <div className="flex justify-between items-center mb-1">
 <h3 className="text-sm font-bold tracking-tight uppercase text-[var(--text-main)] flex items-center gap-1.5">
 <span> Sistem Pengingat WhatsApp</span>
 {waStatus === "Aktif" ? (
 <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-full">
 â—  Aktif
 </span>
 ) : (
 <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-extrabold px-1.5 py-0.5 rounded-full">
 â—‹ Nonaktif (Simulasi Sandbox)
 </span>
 )}
 </h3>
 </div>
 <p className="text-xs text-[var(--text-muted)] mb-5">
 Kirimkan berkas pengingat resmi secara otomatis atau manual kepada Mahasiswa yang akan sidang, Dosen penguji, hingga pengumuman audiens mahasiswa penonton seminar.
 </p>

 <div className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Status Integrasi</label>
 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => setWaStatus("Aktif")}
 className={`flex-1 py-1.5 px-3 text-xs font-extrabold text-center rounded border transition cursor-pointer select-none ${
 waStatus === "Aktif"
 ? "bg-emerald-600 border-emerald-600 text-white"
 : "bg-white dark:bg-slate-950 border-[var(--border-color)] hover:bg-slate-50 text-[var(--text-main)]"
 }`}
 >
 Aktif (Live API)
 </button>
 <button
 type="button"
 onClick={() => setWaStatus("Nonaktif")}
 className={`flex-1 py-1.5 px-3 text-xs font-extrabold text-center rounded border transition cursor-pointer select-none ${
 waStatus === "Nonaktif"
 ? "bg-rose-600 border-rose-600 text-white"
 : "bg-white dark:bg-slate-950 border-[var(--border-color)] hover:bg-slate-50 text-[var(--text-main)]"
 }`}
 >
 Nonaktif (Simulasi)
 </button>
 </div>
 </div>

 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Pilihan API Gateway</label>
 <select
 value={waGatewayProvider}
 onChange={(e) => setWaGatewayProvider(e.target.value)}
 className="form-input text-xs font-semibold"
 >
 <option value="Fonnte">Fonnte (fonnte.com)</option>
 <option value="Wablas">Wablas (wablas.com)</option>
 <option value="http://endpoint-custom-anda">Custom HTTP POST Webhook URL</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">API Token / Secret Key</label>
 <input
 type="password"
 value={waToken}
 onChange={(e) => setWaToken(e.target.value)}
 className="form-input text-xs font-semibold"
 placeholder="Masukkan token kueri autentikasi API"
 />
 </div>

 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Nomor Pengirim (Sender Number)</label>
 <input
 type="text"
 value={waSenderNo}
 onChange={(e) => setWaSenderNo(e.target.value)}
 className="form-input text-xs font-semibold"
 placeholder="e.g. 6281234567890"
 />
 </div>
 </div>

 {/* TEMPLATE EDITORS */}
 <div className="space-y-4 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl mt-3">
 <h4 className="text-xs font-extrabold text-[var(--text-main)] uppercase tracking-wider mb-2 text-indigo-700 dark:text-indigo-400">
 Format Template Notifikasi WhatsApp
 </h4>
 <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
 Aplikasi menggunakan dynamic merge tags otomatis: <code className="bg-indigo-50 dark:bg-slate-950 px-1 rounded text-indigo-800 font-extrabold font-mono">{`{nama}`}</code>, <code className="bg-indigo-50 dark:bg-slate-950 px-1 rounded text-indigo-800 font-extrabold font-mono">{`{kegiatan}`}</code>, <code className="bg-indigo-50 dark:bg-slate-950 px-1 rounded text-indigo-800 font-extrabold font-mono">{`{tanggal}`}</code>, <code className="bg-indigo-50 dark:bg-slate-950 px-1 rounded text-indigo-800 font-extrabold font-mono">{`{waktu}`}</code>, <code className="bg-indigo-50 dark:bg-slate-950 px-1 rounded text-indigo-800 font-extrabold font-mono">{`{ruang}`}</code>, <code className="bg-indigo-50 dark:bg-slate-950 px-1 rounded text-indigo-800 font-extrabold font-mono">{`{link}`}</code>, <code className="bg-indigo-50 dark:bg-slate-950 px-1 rounded text-indigo-800 font-extrabold font-mono">{`{mahasiswa}`}</code>, <code className="bg-indigo-50 dark:bg-slate-900 px-1 rounded text-indigo-850 font-extrabold font-mono">{`{nim}`}</code>.
 </p>

 <div className="form-group">
 <label className="block text-[11px] font-extrabold text-[var(--text-main)] mb-1">1. Template untuk Mahasiswa yang Ujian</label>
 <textarea
 value={waTemplateMhs}
 onChange={(e) => setWaTemplateMhs(e.target.value)}
 rows={2}
 className="form-input text-xs font-semibold leading-relaxed"
 />
 </div>

 <div className="form-group border-t border-[var(--border-color)] pt-3">
 <label className="block text-[11px] font-extrabold text-[var(--text-main)] mb-1">2. Template untuk Dewan Penguji / Pembimbing</label>
 <textarea
 value={waTemplateDosen}
 onChange={(e) => setWaTemplateDosen(e.target.value)}
 rows={2}
 className="form-input text-xs font-semibold leading-relaxed"
 />
 </div>

 <div className="form-group border-t border-[var(--border-color)] pt-3">
 <label className="block text-[11px] font-extrabold text-[var(--text-main)] mb-1">3. Template untuk Penonton / Audiens Seminar Mahasiswa</label>
 <textarea
 value={waTemplateAudiens}
 onChange={(e) => setWaTemplateAudiens(e.target.value)}
 rows={2}
 className="form-input text-xs font-semibold leading-relaxed"
 />
 </div>
 </div>

 <button
 onClick={handleSaveWaConfig}
 className="btn btn-primary text-xs text-white bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 flex items-center gap-1.5 mt-2"
 >
 Simpan Konfigurasi & Format WhatsApp
 </button>
 </div>
 </div>

 {currentUser.role === "Superadmin" && (
 <div className="space-y-6">
 <div className="border-t border-[var(--border-color)] pt-5">
 <h3 className="text-sm font-bold tracking-tight uppercase text-[var(--text-main)] mb-1">Kustomisasi Identitas Logo</h3>
 <p className="text-xs text-[var(--text-muted)] mb-4">Ganti logo standard "S" dengan file logo institusi Anda lintas UI login, sidebar, & kop surat.</p>
 
 <div className="form-group mb-4">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Pilih File Logo (Gambar JPG, PNG, atau WebP)</label>
 <input
 type="file"
 accept="image/*"
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (file) {
 const r = new FileReader();
 r.onload = (ev) => {
 const base64 = ev.target?.result as string;
 handleUpdateLogo(base64);
 };
 r.readAsDataURL(file);
 }
 }}
 className="form-input text-xs"
 />
 </div>

 <div className="flex gap-2">
 <button
 onClick={() => handleUpdateLogo(null)}
 className="btn btn-secondary text-xs text-[var(--accent-danger-hover)] hover:bg-[var(--accent-danger-light)]"
 >
 Reset Logo Default
 </button>
 </div>

 <div className="mt-4 p-4 bg-[var(--bg-base)] rounded-[var(--radius-md)] inline-block">
 <span className="text-xs font-bold text-[var(--text-muted)] block mb-2">Pratinjau Logo Saat Ini:</span>
 <div className="w-20 h-20 rounded-xl bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center font-extrabold text-2xl border border-[var(--border-color)] p-1.5">
 {state.logo ? (
 <img src={state.logo} alt="Preview" className="w-full h-full object-contain rounded-lg" />
 ) : (
 <span>S</span>
 )}
 </div>
 </div>
 </div>

 {/* Back-end cloud state database backup & restore functionality */}
 <div className="border-t border-[var(--border-color)] pt-6 mt-6">
 <h3 className="text-sm font-bold tracking-tight uppercase text-[var(--text-main)] mb-1">Manajemen Database & Backup Pemulihan</h3>
 <p className="text-xs text-[var(--text-muted)] mb-4">
 Academics dilengkapi sistem backup otomatis di browser Anda. Anda juga dapat mengekspor atau memulihkan seluruh data aplikasi Anda sewaktu-waktu secara manual.
 </p>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
 {/* Download panel */}
 <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between">
 <div>
 <h4 className="text-xs font-bold text-[var(--text-main)] mb-1">Ekspor Database (.JSON)</h4>
 <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mb-3">
 Ambil snapshot seluruh naskah, review dosen, mahasiswa, status bimbingan, dan riwayat chat ke file komputer Anda.
 </p>
 </div>
 <button 
 onClick={handleDownloadBackup}
 className="btn btn-primary btn-sm w-full text-xs flex items-center justify-center gap-1.5 text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
 >
 <Download size={14} /> Ekspor/Unduh Database
 </button>
 </div>

 {/* Upload panel */}
 <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between">
 <div>
 <h4 className="text-xs font-bold text-[var(--text-main)] mb-1">Impor / Pulihkan Database</h4>
 <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mb-3">
 Unggah kembali berkas cadangan bimbingan `.json` untuk memulihkan seluruh isi database ke server secara mutlak.
 </p>
 </div>
 <div className="relative">
 <input
 type="file"
 accept=".json"
 onChange={handleUploadBackup}
 className="form-input text-xs w-full py-1 px-2 cursor-pointer bg-white dark:bg-slate-950"
 title="Unggah berkas cadangan database .json"
 />
 </div>
 </div>
 </div>

 <div className="p-4 border border-rose-200/50 dark:border-rose-950/20 bg-rose-500/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
 <div className="flex-1">
 <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-0.5">âš   Menu Pembersihan Sistem</h4>
 <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
 Reset instan semua database dan riwayat obrolan kembali ke setelan awal pabrikan. Tindakan ini tidak dapat dibatalkan.
 </p>
 </div>
 <button
 onClick={handleResetDatabase}
 className="btn btn-secondary text-xs border-rose-300 dark:border-rose-950 hover:bg-rose-500 hover:text-white shrink-0 font-extrabold whitespace-nowrap text-rose-500 hover:border-transparent transition-all"
 >
 Reset Database Setelan Awal
 </button>
 </div>
 </div>
 </div>
 )}

 {/* MANAJEMEN TAHUN AKADEMIK & PERIODE PENDAFTARAN */}
 <div className="border-t border-[var(--border-color)] pt-6 mt-6">
 <h3 className="text-sm font-bold tracking-tight uppercase text-[var(--text-main)] mb-1 flex items-center gap-1.5">
 <span></span> Manajemen Tahun Akademik &amp; Periode Pendaftaran
 </h3>
 <p className="text-xs text-[var(--text-muted)] mb-4">
 Aktifkan atau tambahkan Tahun Akademik baru agar arsip pendaftaran tesis dan jadwal sidang mahasiswa dapat terpartisi secara historis dengan rapi.
 </p>
 
 <div className="space-y-4">
 {/* List of Academic Years */}
 <div className="border border-[var(--border-color)] rounded-xl bg-slate-50/50 dark:bg-slate-900/10 overflow-hidden">
 <div className="grid grid-cols-12 gap-2 bg-slate-100/60 dark:bg-slate-900/30 p-2.5 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-color)]">
 <div className="col-span-4 font-black">Tahun Akademik</div>
 <div className="col-span-3 font-black">Periode Pendaftaran</div>
 <div className="col-span-3 text-center font-black">Status</div>
 <div className="col-span-2 text-center font-black">Aksi</div>
 </div>
 
 <div className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-main)]">
 {(() => {
 const listTahun = state.tahunakademik || [];
 if (listTahun.length === 0) {
 return <div className="p-4 text-center text-[var(--text-muted)] font-semibold">Belum ada Tahun Akademik terdaftar.</div>;
 }
 return listTahun.map((t) => (
 <div key={t.id} className="grid grid-cols-12 gap-2 p-2.5 items-center">
 <div className="col-span-7 font-bold flex items-center gap-1.5">
 <span></span> {t.nama}
 </div>
 <div className="col-span-3 text-center">
 <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
 t.status === "Aktif"
 ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
 : "bg-slate-50 text-slate-500 border border-slate-100"
 }`}>
 {t.status === "Aktif" ? "Aktif" : "Arsip"}
 </span>
 </div>
 <div className="col-span-2 text-center">
 {t.status !== "Aktif" && (
 <button
 type="button"
 onClick={async () => {
 try {
 const updatedList = listTahun.map((item) => ({
 ...item,
 status: item.id === t.id ? ("Aktif" as const) : ("Arsip" as const)
 }));
 
 for (const item of updatedList) {
 await mutate("tahunakademik", "update", item, "id", item.id, true);
 }
 // Sync-up call for active item
 await mutate("tahunakademik", "update", updatedList.find(item => item.id === t.id), "id", t.id, false);
 showToast(`Tahun Akademik ${t.nama} berhasil diaktifkan!`, "success");
 } catch (e) {
 showToast("Gagal mengaktifkan Tahun Akademik.", "error");
 }
 }}
 className="text-[9px] bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 dark:text-slate-350 dark:bg-slate-800 font-extrabold px-2 py-1 rounded cursor-pointer transition-colors"
 >
 Aktifkan
 </button>
 )}
 </div>
 </div>
 ));
 })()}
 </div>
 </div>

 {/* Add New Academic Year Form */}
 {(currentUser.role === "Superadmin" || currentUser.role === "Admin" || currentUser.role === "Prodi") && (
 <div className="bg-slate-50/20 dark:bg-slate-900/5 p-4 rounded-xl border border-[var(--border-color)] text-left">
 <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] mb-3 flex items-center gap-1.5">
 <span>âž•</span> Tambah Tahun Akademik / Periode Baru
 </h4>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="form-group">
 <label className="block text-[10px] font-extrabold uppercase text-[var(--text-muted)] mb-1">Tahun Angkatan</label>
 <input
 type="text"
 id="newTahunInput"
 placeholder="Contoh: 2026/2027"
 className="form-input text-xs font-semibold"
 />
 </div>
 <div className="form-group">
 <label className="block text-[10px] font-extrabold uppercase text-[var(--text-muted)] mb-1">Semester / Periode</label>
 <select
 id="newSemesterInput"
 className="form-input text-xs font-semibold cursor-pointer"
 >
 <option value="Ganjil">Ganjil</option>
 <option value="Genap">Genap</option>
 <option value="Antara">Antara</option>
 </select>
 </div>
 </div>
 
 <button
 type="button"
 onClick={async () => {
 const tahunVal = (document.getElementById("newTahunInput") as HTMLInputElement)?.value;
 const semVal = (document.getElementById("newSemesterInput") as HTMLSelectElement)?.value;
 
 if (!tahunVal) {
 showToast("Tahun Angkatan wajib diisi!", "warning");
 return;
 }
 
 const newId = `TA_${Date.now()}`;
 const fullName = `${semVal} ${tahunVal}`;
 const payload = {
 id: newId,
 nama: fullName,
 status: "Arsip" as const
 };
 
 try {
 await mutate("tahunakademik", "add", payload);
 showToast(`Tahun Akademik ${fullName} berhasil ditambahkan!`, "success");
 if (document.getElementById("newTahunInput")) {
 (document.getElementById("newTahunInput") as HTMLInputElement).value = "";
 }
 } catch (e) {
 showToast("Gagal menyimpan tahun akademik baru.", "error");
 }
 }}
 className="text-xs bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold px-3 py-2 rounded-lg cursor-pointer transition-all w-full sm:w-auto mt-4"
 >
 Simpan Tahun Akademik Baru
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* 10. DOSEN: MAHASISWA BIMBINGAN (P1/P2) */}
 {activeTab === "mhs-bimbingan" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border-color)]">
 <div>
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">Daftar Mahasiswa Bimbingan Anda</h2>
 <p className="text-xs text-[var(--text-muted)] font-medium">
 Pantau kemajuan penelitian dan otorisasi milestone proposal, seminar hasil, hingga kelulusan naskah akhir mahasiswa.
 </p>
 </div>
 {/* Local Search Input inside Tab */}
 <div className="relative w-full md:w-64">
 <Search className="absolute left-2.5 top-2.5 text-[var(--text-muted)]" size={16} />
 <input
 type="text"
 placeholder="Cari nama atau NIM..."
 value={searchMhs}
 onChange={(e) => setSearchMhs(e.target.value)}
 className="input text-xs pl-9 py-1.5 w-full bg-[var(--bg-card)] border-[var(--border-color)] rounded-[var(--radius-md)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]"
 />
 {searchMhs && (
 <button onClick={() => setSearchMhs("")} className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)]">
 <X size={14} />
 </button>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6 mt-4">
 {(() => {
 const filteredBimb = (state.bimbingan || [])
 .filter((b) => b.pembimbing1 === currentUser.email || b.pembimbing2 === currentUser.email)
 .filter((b) => {
 const student = state.mahasiswa.find((m) => m.id === b.mahasiswaId);
 if (!student) return false;
 const term = searchMhs.toLowerCase();
 return student.nama.toLowerCase().includes(term) || student.nim.toLowerCase().includes(term);
 });

 if (filteredBimb.length === 0) {
 return (
 <div className="card p-12 text-center rounded-[var(--radius-lg)] border border-[var(--border-color)]">
 <span className="text-3xl block mb-2 opacity-60"></span>
 <h4 className="text-sm font-bold text-[var(--text-main)] mb-1">
 {searchMhs ? "Tidak ada hasil pencarian" : "Belum Ada Mahasiswa Bimbingan"}
 </h4>
 <p className="text-xs text-[var(--text-muted)]">
 {searchMhs 
 ? "Coba ganti kata kunci pencarian Anda untuk menemukan data..." 
 : "Anda belum ditetapkan sebagai pembimbing mahasiswa saat ini dalam sistem Academics."}
 </p>
 </div>
 );
 }

 return filteredBimb.map((b) => {
 const student = state.mahasiswa.find((m) => m.id === b.mahasiswaId);
 const myRole = b.pembimbing1 === currentUser.email ? "Pembimbing Utama (Pb 1)" : "Pembimbing Pendamping (Pb 2)";
 
 // Milestone definitions
 const valProposal = b.validasiProposal || "Belum";
 const valSemHas = b.validasiSeminarHasil || "Belum";
 const valSidang = b.persetujuanNilai || "Belum";

 // Step statuses: "Selesai" | "Aktif" | "Terkunci"
 const step1Status = valProposal === "Disetujui" ? "Selesai" : "Aktif";
 
 let step2Status = "Terkunci";
 if (valProposal === "Disetujui") {
 step2Status = valSemHas === "Disetujui" ? "Selesai" : "Aktif";
 }

 let step3Status = "Terkunci";
 if (valProposal === "Disetujui" && valSemHas === "Disetujui") {
 step3Status = valSidang === "Disetujui" ? "Selesai" : "Aktif";
 }

 // Auxiliary Stats from state logic
 const consultations = (state.konsultasi || []).filter(
 (c) => c.mahasiswaEmail === student?.email && c.dosenEmail === currentUser.email
 );
 
 const pendingCons = consultations.filter((c) => c.status === "Menunggu").length;

 const upSidang = (state.jadwalSidang || []).find(
 (s) => s.mahasiswaId === student?.id
 );

 return (
 <div key={b.id} className="card p-6 border-l-[6px] border-[var(--brand-primary)] bg-[var(--bg-card)] hover:shadow-lg transition-all duration-300">
 {/* Header details */}
 <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b border-[var(--border-color)]">
 <div className="space-y-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className={`px-2.5 py-0.5 text-[10px] uppercase font-extrabold rounded-full tracking-wider ${
 b.pembimbing1 === currentUser.email 
 ? "bg-[var(--brand-light)] text-[var(--brand-primary)]" 
 : "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
 }`}>
 {myRole}
 </span>
 {b.nilaiAkhir && (
 <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
 Nilai Akhir: {b.nilaiAkhir}
 </span>
 )}
 </div>
 <h3 className="text-base font-extrabold text-[var(--text-main)]">
 {student?.nama || "Tidak Ditemukan"}
 </h3>
 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] font-medium font-mono">
 <span>NIM: {student?.nim || "-"}</span>
 <span></span>
 <span>Email: {student?.email || "-"}</span>
 </div>
 </div>

 {/* Stats / Badges */}
 <div className="flex flex-wrap gap-2">
 <div className="flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-base)] text-[var(--text-muted)] text-[11px] font-semibold">
 <span></span>
 <span>{consultations.length} Konsultasi</span>
 {pendingCons > 0 && (
 <span className="scale-90 px-1.5 py-0.2 rounded-full bg-[var(--accent-warning-light)] text-[var(--accent-warning-hover)] text-[9px] animate-pulse font-bold">
 {pendingCons} Respon
 </span>
 )}
 </div>
 
 {upSidang && (
 <div className="flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-sm)] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:bg-amber-400 border border-amber-200/40 text-[11px] font-bold">
 <Calendar size={13} />
 <span>Sidang: {upSidang.tanggal} ({upSidang.status})</span>
 </div>
 )}
 </div>
 </div>

 {/* Thesis Title Box */}
 <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-[var(--radius-md)] mb-6 text-left">
 <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-extrabold block mb-1">
 Topik & Judul Tesis:
 </span>
 <p className="text-xs font-bold text-[var(--text-main)] italic">
 "{student?.judul || "Belum mengajukan draf judul tesis"}"
 </p>
 </div>

 {/* TIMELINE PROGRESS STEPPER */}
 <div className="mb-8 font-sans">
 <h4 className="text-xs uppercase tracking-widest font-extrabold text-[var(--text-muted)] mb-5 flex items-center gap-1.5">
 <Award className="text-[var(--brand-primary)]" size={14} />
 Timeline Kemajuan & Milestone Tesis
 </h4>
 
 <div className="relative flex flex-col md:flex-row justify-between items-center gap-y-8 md:gap-y-0 px-2">
 {/* Horizontal Progress Path bars in backgrounds (desktop only) */}
 <div className="hidden md:block absolute left-10 right-10 top-[18px] h-1 bg-[var(--border-color)] z-0 rounded-full" />
 
 {/* Path highlight for Step 1 -> Step 2 */}
 <div className={`hidden md:block absolute left-10 md:w-[40%] xl:w-[43%] top-[18px] h-1 z-0 transition-all duration-500 rounded-full ${
 valProposal === "Disetujui" ? "bg-[var(--brand-primary)]" : "bg-transparent"
 }`} />

 {/* Path highlight for Step 2 -> Step 3 */}
 <div className={`hidden md:block absolute left-[50%] md:w-[40%] xl:w-[43%] top-[18px] h-1 z-0 transition-all duration-500 rounded-full ${
 valSemHas === "Disetujui" ? "bg-[var(--brand-primary)]" : "bg-transparent"
 }`} />

 {/* Step 1: Proposal */}
 <div className="relative flex flex-row md:flex-col items-center gap-4 md:gap-2 text-left md:text-center z-10 w-full md:w-1/3">
 {/* Step Circle */}
 <div className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-xs ring-4 ring-[var(--bg-card)] transition-all duration-300 ${
 step1Status === "Selesai" 
 ? "bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-light)]"
 : "bg-[var(--bg-base)] border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] ring-inset shadow-inner animate-[pulse_2s_infinite]"
 }`}>
 {step1Status === "Selesai" ? <Check size={16} strokeWidth={3} /> : "1"}
 </div>
 <div>
 <div className="text-xs font-black text-[var(--text-main)] flex items-center md:justify-center gap-1">
 Seminar Proposal
 {step1Status === "Selesai" && <span className="text-emerald-500 text-[11px]">âœ“</span>}
 </div>
 <span className={`text-[10px] font-semibold ${
 step1Status === "Selesai" ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--brand-primary)]"
 }`}>
 {step1Status === "Selesai" ? "Persetujuan Disahkan" : "Sedang Berlangsung"}
 </span>
 </div>
 </div>

 {/* Step 2: Seminar Hasil */}
 <div className="relative flex flex-row md:flex-col items-center gap-4 md:gap-2 text-left md:text-center z-10 w-full md:w-1/3">
 {/* Step Circle */}
 <div className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-xs ring-4 ring-[var(--bg-card)] transition-all duration-300 ${
 step2Status === "Selesai" 
 ? "bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-light)]"
 : step2Status === "Aktif"
 ? "bg-[var(--bg-base)] border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] animate-[pulse_2s_infinite]"
 : "bg-[var(--bg-base)] border-2 border-[var(--border-color)] text-[var(--text-muted)]"
 }`}>
 {step2Status === "Selesai" ? (
 <Check size={16} strokeWidth={3} />
 ) : step2Status === "Terkunci" ? (
 <Lock size={13} className="opacity-60" />
 ) : (
 "2"
 )}
 </div>
 <div>
 <div className="text-xs font-black text-[var(--text-main)] flex items-center md:justify-center gap-1">
 Seminar Hasil
 {step2Status === "Selesai" && <span className="text-emerald-500 text-[11px]">âœ“</span>}
 {step2Status === "Terkunci" && <Lock size={10} className="text-[var(--text-muted)] inline" />}
 </div>
 <span className={`text-[10px] font-semibold ${
 step2Status === "Selesai" 
 ? "text-emerald-600 dark:text-emerald-400" 
 : step2Status === "Aktif" 
 ? "text-[var(--brand-primary)]" 
 : "text-[var(--text-muted)]"
 }`}>
 {step2Status === "Selesai" ? "Persetujuan Disahkan" : step2Status === "Aktif" ? "Milestone Aktif" : "Tahapan Terkunci"}
 </span>
 </div>
 </div>

 {/* Step 3: Sidang Akhir */}
 <div className="relative flex flex-row md:flex-col items-center gap-4 md:gap-2 text-left md:text-center z-10 w-full md:w-1/3">
 {/* Step Circle */}
 <div className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-xs ring-4 ring-[var(--bg-card)] transition-all duration-300 ${
 step3Status === "Selesai" 
 ? "bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-light)]"
 : step3Status === "Aktif"
 ? "bg-[var(--bg-base)] border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] animate-[pulse_2s_infinite]"
 : "bg-[var(--bg-base)] border-2 border-[var(--border-color)] text-[var(--text-muted)]"
 }`}>
 {step3Status === "Selesai" ? (
 <Check size={16} strokeWidth={3} />
 ) : step3Status === "Terkunci" ? (
 <Lock size={13} className="opacity-60" />
 ) : (
 "3"
 )}
 </div>
 <div>
 <div className="text-xs font-black text-[var(--text-main)] flex items-center md:justify-center gap-1">
 Sidang Tesis Akhir
 {step3Status === "Selesai" && <span className="text-emerald-500 text-[11px]">Lulus</span>}
 {step3Status === "Terkunci" && <Lock size={10} className="text-[var(--text-muted)] inline" />}
 </div>
 <span className={`text-[10px] font-semibold ${
 step3Status === "Selesai" 
 ? "text-indigo-600 dark:text-indigo-400 font-bold" 
 : step3Status === "Aktif" 
 ? "text-[var(--brand-primary)] font-bold animate-pulse" 
 : "text-[var(--text-muted)]"
 }`}>
 {step3Status === "Selesai" ? `Yudisium Selesai` : step3Status === "Aktif" ? "Menanti Penilaian" : "Tahapan Terkunci"}
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* INTERACTIVE CONTROLS FOR LECTURERS */}
 <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-[var(--radius-md)]">
 <h5 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
 Panel Otorisasi Progress Bimbingan Anda
 </h5>
 
 <div className="flex flex-wrap items-center gap-3">
 {/* Button for Step 1 Approval */}
 {step1Status === "Aktif" && (
 <button
 onClick={() => {
 mutate("bimbingan", "update", { validasiProposal: "Disetujui" }, "id", b.id);
 }}
 className="btn btn-primary text-xs flex items-center gap-1 cursor-pointer"
 >
 <Check size={14} /> Beri Persetujuan Seminar Proposal
 </button>
 )}

 {/* Button for Step 2 Approval */}
 {step2Status === "Aktif" && (
 <button
 onClick={() => {
 mutate("bimbingan", "update", { validasiSeminarHasil: "Disetujui" }, "id", b.id);
 }}
 className="btn btn-primary text-xs flex items-center gap-1 cursor-pointer"
 >
 <Check size={14} /> Beri Persetujuan Seminar Hasil
 </button>
 )}

 {/* Inputs and Actions for Step 3 Approval */}
 {step3Status === "Aktif" && (
 <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
 <div className="flex items-center gap-2">
 <label className="text-[11px] font-bold text-[var(--text-main)]">Grade Nilai Akhir:</label>
 <select
 id={`grade-select-${b.id}`}
 className="select text-xs py-1.5 px-3 bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] rounded-[var(--radius-sm)] cursor-pointer"
 defaultValue="A"
 >
 <option value="A">A (Sangat Memuaskan)</option>
 <option value="A-">A- (Memuaskan)</option>
 <option value="B+">B+ (Sangat Baik)</option>
 <option value="B">B (Baik)</option>
 </select>
 </div>
 <button
 onClick={() => {
 const selectDom = document.getElementById(`grade-select-${b.id}`) as HTMLSelectElement;
 const selectedGrade = selectDom ? selectDom.value : "A";
 mutate("bimbingan", "update", { persetujuanNilai: "Disetujui", nilaiAkhir: selectedGrade }, "id", b.id);
 }}
 className="btn text-xs text-white flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 cursor-pointer px-4 py-2 rounded font-bold"
 >
 Luluskan & Beri Nilai Akhir
 </button>
 </div>
 )}

 {/* Status indicators if all completed */}
 {valProposal === "Disetujui" && valSemHas === "Disetujui" && valSidang === "Disetujui" && (
 <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs py-1">
 <CheckCircle size={15} />
 <span>Seluruh tahapan tesis telah diselesaikan dan telah mendapat kelulusan resmi!</span>
 </div>
 )}

 {/* Revert / Reset Button for Dosen convenience */}
 {(valProposal === "Disetujui" || valSemHas === "Disetujui" || valSidang === "Disetujui") && (
 <button
 onClick={() => {
 if (confirm("Apakah Anda yakin ingin mengatur ulang status kualifikasi progress mahasiswa ini?")) {
 mutate("bimbingan", "update", { 
 validasiProposal: "Belum", 
 validasiSeminarHasil: "Belum", 
 persetujuanNilai: "Belum",
 nilaiAkhir: ""
 }, "id", b.id);
 }
 }}
 className="ml-auto text-[10px] text-[var(--accent-danger-hover)] hover:underline flex items-center gap-1 cursor-pointer font-bold"
 >
 <RefreshCw size={10} /> Atur Ulang Progres
 </button>
 )}
 </div>
 </div>
 </div>
 );
 });
 })()}
 </div>
 </div>
 )}

 {/* 11. DOSEN & PRODI: REVIEW JUDUL PROPOSAL MAHASISWA */}
 {activeTab === "review-judul" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--border-color)]">
 <div>
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">
 {currentUser.role === "Prodi" ? "Pengesahan Usulan Judul & Pembimbing" : "Tinjauan Pengajuan Judul Mahasiswa"}
 </h2>
 <p className="text-xs text-[var(--text-muted)] font-medium">
 {currentUser.role === "Prodi" 
 ? "Otorisasi pengesahan judul akhir serta penetapan tim Pembimbing Utama & Pembimbing Serta" 
 : "Verifikasi kelayakan draf perumusan masalah penelitian tesis mahasiswa"}
 </p>
 </div>
 </div>

 <div className="space-y-4">
 {(() => {
 const titles = (state.judul || []).filter((j) => {
 if (currentUser.role === "Prodi") {
 // Prodi can see all
 return true;
 }
 // Only show if the lecturer is assigned to this student
 const studentId = state.mahasiswa.find((m) => m.email === j.mahasiswaEmail)?.id;
 const assignment = state.bimbingan.find((b) => b.mahasiswaId === studentId);
 return assignment && (assignment.pembimbing1 === currentUser.email || assignment.pembimbing2 === currentUser.email);
 });

 if (titles.length === 0) {
 return (
 <div className="card p-8 text-center text-xs text-[var(--text-muted)]">
 Belum ada draf usulan judul tesis yang diajukan ke Anda saat ini.
 </div>
 );
 }

 return titles.reverse().map((j) => {
 const hasPref = j.pembimbingSatuPref || j.pembimbingDuaPref;
 const matchedMhs = state.mahasiswa.find((m) => m.email === j.mahasiswaEmail);
 
 return (
 <div key={j.id} className="card shadow-sm hover:border-[var(--brand-primary)] transition-all">
 <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-4 border-b border-[var(--border-color)] pb-3">
 <div>
 <h3 className="text-md font-extrabold text-[var(--text-main)]">{j.judul}</h3>
 <span className="text-xs text-[var(--text-muted)] font-bold mt-1 block">
 Oleh: <b className="text-[var(--text-main)]">{j.namaMahasiswa}</b> (NIM: {matchedMhs?.nim || "-"})
 </span>
 </div>
 <span className={`pill shrink-0 ${
 j.status === "Disetujui" ? "pill-success" : 
 j.status === "Telah Dicek Admin" ? "pill-info text-[var(--brand-primary)] bg-[var(--brand-light)] border-[var(--brand-primary)] font-bold" : 
 j.status === "Revisi" ? "pill-warning" : "pill-info"
 }`}>
 {j.status === "Telah Dicek Admin" ? "Siap Disahkan Prodi" : j.status}
 </span>
 </div>
 
 <p className="text-xs text-[var(--text-muted)] whitespace-pre-line leading-relaxed mb-4 font-medium">
 {j.abstrak}
 </p>

 {/* Show Preferred Advisors to help Dosen/Prodi */}
 {hasPref && (
 <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)] bg-[var(--bg-base)] p-3 rounded-lg border border-[var(--border-color)] animate-slide-entry">
 <span className="font-bold">Rekomendasi Pembimbing Mahasiswa:</span>
 {j.pembimbingSatuPref && (
 <span className="px-2 py-0.5 rounded bg-[var(--brand-light)] text-[var(--brand-primary)] font-semibold border border-[rgba(15,110,86,0.15)]">
 Pb 1: {state.dosen.find(ds => ds.email === j.pembimbingSatuPref)?.nama || j.pembimbingSatuPref}
 </span>
 )}
 {j.pembimbingDuaPref && (
 <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 font-semibold border border-[rgba(59,130,246,0.15)]">
 Pb 2: {state.dosen.find(ds => ds.email === j.pembimbingDuaPref)?.nama || j.pembimbingDuaPref}
 </span>
 )}
 </div>
 )}

 {/* Actions for Dosen */}
 {currentUser.role === "Dosen" && j.status === "Menunggu" && (
 <div className="flex gap-2">
 <button
 onClick={() => mutate("judul", "update", { status: "Disetujui", catatan: "Disetujui Dosen Pembimbing, lanjut administrasi berkas draf." }, "id", j.id)}
 className="btn btn-primary text-xs cursor-pointer"
 >
 Verifikasi & Sahkan Judul
 </button>
 <button
 onClick={() => {
 const ctt = prompt("Masukkan catatan revisi judul:");
 if (ctt) mutate("judul", "update", { status: "Revisi", catatan: ctt }, "id", j.id);
 }}
 className="btn btn-secondary text-xs cursor-pointer"
 >
 Minta Revisi
 </button>
 </div>
 )}

 {/* Actions for Prodi & Admin / Superadmin */}
 {(currentUser.role === "Prodi" || currentUser.role === "Admin" || currentUser.role === "Superadmin") && 
 (j.status === "Menunggu" || j.status === "Telah Dicek Admin" || j.status === "Revisi") && (
 <div className="flex flex-wrap gap-2">
 {hasPref && j.pembimbingSatuPref && (
 <button
 onClick={() => {
 const matchedM = state.mahasiswa.find((m) => m.email === j.mahasiswaEmail);
 if (!matchedM) {
 showToast("Mahasiswa tidak terdaftar aktif.", "error");
 return;
 }
 const existingBimb = state.bimbingan.find((b) => b.mahasiswaId === matchedM.id);

 // 1. Update status judul ke "Disetujui"
 mutate("judul", "update", { 
 status: "Disetujui", 
 catatan: `Disetujui & disahkan oleh ${currentUser.role === "Prodi" ? "Prodi" : "Admin"}. Pembimbing Rekomendasi diangkat resmi.` 
 }, "id", j.id);

 // 2. Buat atau update bimbingan
 if (existingBimb) {
 mutate("bimbingan", "update", {
 pembimbing1: j.pembimbingSatuPref,
 pembimbing2: j.pembimbingDuaPref || "",
 }, "id", existingBimb.id);
 } else {
 mutate("bimbingan", "add", {
 mahasiswaId: matchedM.id,
 pembimbing1: j.pembimbingSatuPref,
 pembimbing2: j.pembimbingDuaPref || "",
 penguji1: "",
 penguji2: "",
 tanggalDiassign: new Date().toISOString().slice(0, 10),
 });
 }

 // 3. Update judul tesis di data mahasiswa
 mutate("mahasiswa", "update", { judul: j.judul }, "id", matchedM.id);

 showToast("Judul Tesis & Rekomendasi Pembimbing telah disetujui!", "success");
 }}
 className="btn text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded px-3 py-1.5"
 >
 âœ“ Setujui Sesuai Rekomendasi
 </button>
 )}
 <button
 onClick={() => {
 const matchedM = state.mahasiswa.find((m) => m.email === j.mahasiswaEmail);
 if (!matchedM) {
 showToast("Mahasiswa tidak terdaftar aktif.", "error");
 return;
 }
 const existingBimb = state.bimbingan.find((b) => b.mahasiswaId === matchedM.id);

 setActiveModal({
 id: "kaprodi-decision",
 title: `Sahkan Judul & Assign Pembimbing Resmi: ${j.namaMahasiswa}`,
 content: (
 <form
 id="kaprodi-decision-form"
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const finalPb1 = (form.elements.namedItem("finalPb1") as HTMLSelectElement).value;
 const finalPb2 = (form.elements.namedItem("finalPb2") as HTMLSelectElement).value;
 
 // 1. Update status judul ke "Disetujui"
 mutate("judul", "update", { 
 status: "Disetujui", 
 catatan: "Judul dan Pembimbing resmi disahkan dan ditetapkan oleh Ketua Program Studi." 
 }, "id", j.id, true);

 // 2. Buat atau update bimbingan
 if (existingBimb) {
 mutate("bimbingan", "update", {
 pembimbing1: finalPb1,
 pembimbing2: finalPb2,
 }, "id", existingBimb.id, true);
 } else {
 mutate("bimbingan", "add", {
 mahasiswaId: matchedM.id,
 pembimbing1: finalPb1,
 pembimbing2: finalPb2,
 penguji1: "",
 penguji2: "",
 tanggalDiassign: new Date().toISOString().slice(0, 10),
 }, undefined, undefined, true);
 }

 // 3. Update judul kolom dalam data mahasiswa
 mutate("mahasiswa", "update", { judul: j.judul }, "id", matchedM.id, true);

 showToast("Judul Tesis & Pembimbing resmi disahkan!", "success");
 setActiveModal(null);
 }}
 className="space-y-4"
 >
 <div className="text-xs font-semibold px-4 py-3 bg-[var(--brand-light)] text-[var(--brand-primary)] border-l-4 border-[var(--brand-primary)] rounded-md mb-2">
   <b>Judul Usulan:</b> "{j.judul}"
 </div>
 
 <div className="form-group text-left">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Dosen Pembimbing 1 (Utama)</label>
 <select name="finalPb1" defaultValue={j.pembimbingSatuPref || ""} required className="form-input text-xs font-semibold">
 <option value="">-- Pilih Pembimbing Utama --</option>
 {state.dosen.map((ds) => (
 <option key={ds.id} value={ds.email}>{ds.nama} ({ds.bidangKeahlian})</option>
 ))}
 </select>
 </div>

 <div className="form-group text-left">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Dosen Pembimbing 2 (Pendamping)</label>
 <select name="finalPb2" defaultValue={j.pembimbingDuaPref || ""} className="form-input text-xs font-semibold">
 <option value="">-- Tanpa Pembimbing Serta --</option>
 {state.dosen.map((ds) => (
 <option key={ds.id} value={ds.email}>{ds.nama} ({ds.bidangKeahlian})</option>
 ))}
 </select>
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">Batal</button>
 <button type="submit" form="kaprodi-decision-form" className="btn btn-primary text-xs">Sahkan & Daftarkan Resmi</button>
 </div>
 )
 });
 }}
 className="btn btn-primary text-xs cursor-pointer flex items-center gap-1"
 >
 Sahkan & Tetapkan Tim
 </button>

 <button
 onClick={() => {
 const ctt = prompt("Masukkan alasan penolakan judul:");
 if (ctt !== null) {
 mutate("judul", "update", { 
 status: "Ditolak", 
 catatan: ctt ? `Ditolak Prodi/Admin: ${ctt}` : "Draf judul tidak disetujui / ditolak oleh pimpinan Prodi / Admin."
 }, "id", j.id);
 showToast("Pengajuan usulan judul ditolak.", "error");
 }
 }}
 className="btn text-xs font-bold shrink-0 cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1.5"
 >
 Tolak / Tidak Disetujui
 </button>

 <button
 onClick={() => {
 const ctt = prompt("Masukkan catatan revisi judul pimpinan Prodi/Admin:");
 if (ctt) {
 mutate("judul", "update", { status: "Revisi", catatan: `Revisi Prodi/Admin: ${ctt}` }, "id", j.id);
 }
 }}
 className="btn btn-secondary text-xs cursor-pointer"
 >
 Minta Revisi
 </button>
 </div>
 )}

 {j.catatan && (
 <div className="p-3 mt-3 bg-slate-50 dark:bg-slate-800 text-xs text-[var(--text-muted)] rounded border border-[var(--border-color)]">
 <b>Catatan Sebelumnya:</b> "{j.catatan}"
 </div>
 )}
 </div>
 );
 });
 })()}
 </div>
 </div>
 )}

 {/* 12. DOSEN: JADWAL MENGUJI SIDANG */}
 {activeTab === "jadwal-menguji" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4">
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">Agenda Penilaian (Menguji Sidang Tesis)</h2>
 <p className="text-xs text-[var(--text-muted)]">Daftar agenda pelaksanaan pengujian kelayakan tesis dewan panel penguji S2</p>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 {(state.jadwalSidang || []).filter((s) => s.penguji1 === currentUser.email || s.penguji2 === currentUser.email).map((s) => {
 const isP1 = s.penguji1 === currentUser.email;
 const peranUjian = isP1 ? "Ketua Dewan Penguji (Penguji 1)" : "Anggota Dewan Penguji (Penguji 2)";
 const statusSaya = isP1 ? (s.accPenguji1 || "Menunggu") : (s.accPenguji2 || "Menunggu");

 return (
 <div key={s.id} className="stat-card border-t-4 border-[var(--accent-warning)] bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-color)]">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] font-extrabold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 rounded">
 {s.jenisUjian || "Sidang Tesis"}
 </span>
 <span className="text-[9.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
 {peranUjian}
 </span>
 </div>
 <h4 className="text-sm font-extrabold text-[var(--text-main)] mt-1">{s.namaMahasiswa}</h4>
 <div className="space-y-1 text-xs text-[var(--text-muted)] font-semibold mt-3">
 <div> Tanggal: <b className="text-[var(--text-main)]">{s.tanggal}</b></div>
 <div>â ° Waktu: <b className="text-[var(--text-main)]">Pukul {s.waktu} WIB</b></div>
 <div> Ruangan: <b className="text-[var(--text-main)]">{s.ruang}</b></div>
 {s.meetLink && (
 <div className="pt-2">
 <a 
 href={s.meetLink} 
 target="_blank" 
 rel="noopener noreferrer" 
 className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all shadow-sm w-full justify-center text-center cursor-pointer"
 >
 <Video size={13} className="text-emerald-500 animate-pulse shrink-0" /> Gabung Sidang Online (Google Meet)
 </a>
 </div>
 )}
 </div>

 <div className="mt-4 pt-3 border-t border-[var(--border-color)] space-y-3">
 <div className="flex justify-between items-center text-xs">
 <span className="font-extrabold text-[var(--text-muted)] text-[10px] uppercase">Persetujuan Anda:</span>
 <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${statusSaya === "Disetujui" ? "bg-emerald-50 text-emerald-700 border border-emerald-300" : statusSaya === "Ditolak" ? "bg-rose-50 text-rose-700 border border-rose-300" : "bg-amber-50 text-amber-700 border border-amber-300"}`}>
 {statusSaya === "Disetujui" ? "DISETUJUI (ACC)" : statusSaya === "Ditolak" ? "DITOLAK" : "MENUNGGU RESPON"}
 </span>
 </div>

 {statusSaya === "Menunggu" && (
 <div className="flex gap-2.5">
 <button
 onClick={async () => {
 const updateObj: any = {};
 if (isP1) updateObj.accPenguji1 = "Disetujui";
 else updateObj.accPenguji2 = "Disetujui";

 await mutate("jadwalsidang", "update", updateObj, "id", s.id, true);
 showToast("Sikap persetujuan (ACC Jadwal) berhasil dikonfirmasi!", "success");
 }}
 className="btn btn-sm flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1 px-3 rounded leading-none text-center cursor-pointer"
 >
 âœ“ Setujui Jadwal
 </button>
 <button
 onClick={async () => {
 const updateObj: any = {};
 if (isP1) updateObj.accPenguji1 = "Ditolak";
 else updateObj.accPenguji2 = "Ditolak";

 await mutate("jadwalsidang", "update", updateObj, "id", s.id, true);
 showToast("Sikap penolakan jadwal seminar/sidang disimpan.", "warning");
 }}
 className="btn btn-sm flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold py-1 px-3 rounded leading-none text-center cursor-pointer"
 >
 Ajukan Keberatan
 </button>
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* 13. DOSEN & MAHASISWA: CHAT UI KONSULTASI */}
 {(activeTab === "konsultasi-dsn" || activeTab === "konsultasi-mhs") && (
 <ChatRoom
 consultations={state.konsultasi}
 currentUserEmail={currentUser.email}
 currentUserName={currentUser.nama}
 userRole={currentUser.role as any}
 lecturers={state.dosen}
 students={state.mahasiswa}
 googleToken={googleToken}
 onConnectGoogle={handleConnectGoogle}
 state={state}
 mutate={mutate}
 showToast={showToast}
 onReply={(id, text, lampiran) => {
 // Update conversation history by mutator
 const prevC = state.konsultasi.find((x) => x.id === id);
 if (!prevC) return;
 const cleanHistory = [...(prevC.riwayatChat || []), {
 pengirim: currentUser.nama,
 pesan: text,
 waktu: new Date().toISOString(),
 ...(lampiran || {})
 }];
 mutate("konsultasi", "update", {
 riwayatChat: cleanHistory,
 status: currentUser.role === "Dosen" ? "Dibalas" : "Menunggu"
 }, "id", id, true);
 }}
 onNewTopic={(dEmail, subj, msg) => {
 const matchedD = state.dosen.find((x) => x.email === dEmail);
 mutate("konsultasi", "add", {
 mahasiswaEmail: currentUser.email,
 namaMahasiswa: currentUser.nama,
 dosenEmail: dEmail,
 namaDosen: matchedD?.nama || dEmail,
 subjek: subj,
 pesan: msg,
 riwayatChat: [],
 tanggal: new Date().toISOString(),
 status: "Menunggu"
 });
 }}
 onExport={(session) => setPrintConsultation(session)}
 />
 )}

 {/* 14. MAHASISWA: DAFTAR SIDANG AKHIR */}
 {activeTab === "pendaftaran-mhs" && (
 <PendaftaranTesisTab
 currentUser={currentUser!}
 state={state}
 mutate={mutate}
 showToast={showToast}
 />
 )}

 {/* 15. MAHASISWA: AJUKAN JUDUL TESIS */}
 {activeTab === "ajukan-judul" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">Usulan Konsep Judul Tesis</h2>
 <p className="text-xs text-[var(--text-muted)] font-medium">Ajukan konsep rancangan naskah penelitian Anda kepada tim dosen pembimbing</p>
 </div>
 <button
 onClick={() => {
 setActiveModal({
 id: "propose-judul",
 title: "Ajukan Konsep Judul Tesis",
 content: (
 <form
 id="propose-judul-form"
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const jl = (form.elements.namedItem("judul") as HTMLInputElement).value;
 const ab = (form.elements.namedItem("abstrak") as HTMLTextAreaElement).value;
 const pb1 = (form.elements.namedItem("pembimbingSatuPref") as HTMLSelectElement).value;
 const pb2 = (form.elements.namedItem("pembimbingDuaPref") as HTMLSelectElement).value;
 mutate("judul", "add", {
 mahasiswaEmail: currentUser.email,
 namaMahasiswa: currentUser.nama,
 judul: jl,
 abstrak: ab,
 status: "Menunggu",
 tanggal: new Date().toISOString().slice(0, 10),
 catatan: "",
 pembimbingSatuPref: pb1,
 pembimbingDuaPref: pb2,
 });
 setActiveModal(null);
 }}
 className="space-y-4"
 >
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Usulan Judul Tesis *</label>
 <input type="text" name="judul" required className="form-input text-xs font-semibold" placeholder="Analisis prevalensi stunting terhadap balita..." />
 </div>
 <div className="form-group grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Rekomendasi Pembimbing 1 *</label>
 <select name="pembimbingSatuPref" required className="form-input text-xs font-semibold">
 <option value="">-- Pilih Urutan Pertama --</option>
 {state.dosen.map(d => (
 <option key={d.id} value={d.email}>{d.nama} ({d.bidangKeahlian})</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Rekomendasi Pembimbing 2 (Opsional)</label>
 <select name="pembimbingDuaPref" className="form-input text-xs font-semibold">
 <option value="">-- Pilih Urutan Kedua --</option>
 {state.dosen.map(d => (
 <option key={d.id} value={d.email}>{d.nama} ({d.bidangKeahlian})</option>
 ))}
 </select>
 </div>
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Uraian Ringkas Abstrak (Masalah & Metode) *</label>
 <textarea name="abstrak" rows={5} required className="form-input text-xs font-semibold" placeholder="Gambarkan latar belakang masalah primer, lokasi penelitian kualitatif/kuantitatif, serta metode observasif..." />
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">Batal</button>
 <button type="submit" form="propose-judul-form" className="btn btn-primary text-xs">Ajukan Draf</button>
 </div>
 ),
 });
 }}
 className="btn btn-primary text-xs flex items-center gap-1.5"
 >
 <Plus size={14} /> Ajukan Judul
 </button>
 </div>

 <div className="space-y-4">
 {(state.judul || []).filter((j) => j.mahasiswaEmail === currentUser.email).reverse().map((j) => (
 <div key={j.id} className="card">
 <div className="flex justify-between items-center mb-3">
 <span className="text-xs font-bold text-[var(--text-muted)]">Tanggal Pengusulan: {j.tanggal}</span>
 <span className={`pill ${
 j.status === "Disetujui" ? "pill-success" : 
 j.status === "Telah Dicek Admin" ? "pill-info text-[var(--brand-primary)] bg-[var(--brand-light)] border-[var(--brand-primary)]" : 
 j.status === "Revisi" ? "pill-warning" : "pill-info"
 }`}>
 {j.status}
 </span>
 </div>
 <h3 className="text-md font-extrabold text-[var(--text-main)] mb-1">{j.judul}</h3>
 <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3 whitespace-pre-line">{j.abstrak}</p>
 
 {(j.pembimbingSatuPref || j.pembimbingDuaPref) && (
 <div className="mb-4 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)] bg-[var(--bg-base)] p-2.5 rounded-lg border border-[var(--border-color)]">
 <span className="font-bold">Usulan Pembimbing:</span>
 {j.pembimbingSatuPref && (
 <span className="px-1.5 py-0.5 rounded bg-[var(--brand-light)] text-[var(--brand-primary)] font-semibold">
 Pb 1: {state.dosen.find(ds => ds.email === j.pembimbingSatuPref)?.nama || j.pembimbingSatuPref}
 </span>
 )}
 {j.pembimbingDuaPref && (
 <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 font-semibold">
 Pb 2: {state.dosen.find(ds => ds.email === j.pembimbingDuaPref)?.nama || j.pembimbingDuaPref}
 </span>
 )}
 </div>
 )}
 
 {j.catatan && (
 <div className="p-3 bg-[var(--accent-warning-light)] text-[var(--accent-warning-hover)] rounded-md border-l-4 border-[var(--accent-warning)] text-xs font-semibold">
 <b>Catatan Dosen/Prodi:</b> "{j.catatan}"
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* 16. MAHASISWA: CEK & AJUKAN JADWAL SEMINAR/SIDANG */}
 {activeTab === "jadwal-mhs" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4 flex flex-col sm:flex-row justify-between sm:items-start gap-4 border-b border-[var(--border-color)]">
 <div>
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">Agenda Seminar & Sidang Anda</h2>
 <p className="text-xs text-[var(--text-muted)] font-medium">Pengumuman jadwal, persetujuan dewan panel penguji S2, serta pengajuan mandiri</p>
 </div>
 {(() => {
 const studentId = state.mahasiswa.find((m) => m.email === currentUser.email)?.id || "";
 return (
 <button
 onClick={() => {
 setActiveModal({
 id: "add-mhs-sid",
 title: "Ajukan Usulan Jadwal Baru (Syarat Mandiri)",
 content: (
 <ScheduleForm
 state={state}
 currentUser={currentUser}
 isAdminMode={false}
 googleToken={googleToken}
 onConnectGoogle={handleConnectGoogle}
 onSubmit={(values) => {
 mutate("jadwalsidang", "add", {
 mahasiswaId: values.mahasiswaId,
 namaMahasiswa: currentUser.nama,
 tanggal: values.tanggal,
 waktu: values.waktu,
 ruang: values.ruang,
 penguji1: values.penguji1,
 penguji2: values.penguji2,
 status: "Dijadwalkan",
 jenisUjian: values.jenisUjian,
 diusulkanOleh: "Mahasiswa",
 accMahasiswa: "Disetujui",
 accPenguji1: values.isExternalPenguji1 ? "Disetujui" : (values.penguji1 ? "Menunggu" : "Tidak Ada"),
 accPenguji2: values.isExternalPenguji2 ? "Disetujui" : (values.penguji2 ? "Menunggu" : "Tidak Ada"),
 accProdi: "Menunggu",
 catatan: values.catatan,
 meetLink: values.meetLink,
 calendarEventId: values.calendarEventId,
 isExternalPenguji1: values.isExternalPenguji1,
 externalPenguji1Name: values.externalPenguji1Name,
 externalPenguji1Instansi: values.externalPenguji1Instansi,
 isExternalPenguji2: values.isExternalPenguji2,
 externalPenguji2Name: values.externalPenguji2Name,
 externalPenguji2Instansi: values.externalPenguji2Instansi,
 });
 setActiveModal(null);
 showToast("Permohonan usulan jadwal berhasil dikirim ke Prodi!", "success");
 }}
 onClose={() => setActiveModal(null)}
 />
 ),
 });
 }}
 className="btn btn-primary text-xs flex items-center gap-1.5 font-bold"
 >
 Ajukan Usulan Jadwal Mandiri
 </button>
 );
 })()}
 </div>

 {(() => {
 const studentId = state.mahasiswa.find((m) => m.email === currentUser.email)?.id;
 const mySchedules = (state.jadwalSidang || []).filter((s) => s.mahasiswaId === studentId);

 if (mySchedules.length === 0) {
 return (
 <div className="card text-center p-12 max-w-xl text-[var(--text-muted)]">
 <p className="text-sm font-semibold">Belum Ada Agenda Sidang Terdaftar.</p>
 <p className="text-xs text-[var(--text-disabled)] mt-2">
 Pastikan naskah draf final telah diselesaikan dan disahkan oleh P1 & P2 untuk mendaftar antrean dewan penguji prodi magister atau klik tombol di atas untuk mengusulkan mandiri.
 </p>
 </div>
 );
 }

 return (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 {mySchedules.map((j) => {
 const statusMahasiswa = j.accMahasiswa || "Menunggu";

 return (
 <div key={j.id} className="card border-l-[6px] border-[var(--brand-primary)] bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-color)]">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40 px-2 py-0.5 rounded">
 {j.jenisUjian || "Sidang Tesis"}
 </span>
 {j.diusulkanOleh === "Mahasiswa" ? (
 <span className="text-[9.5px] font-bold text-amber-600 block bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.2 border border-amber-200 rounded">
 Usulan Anda
 </span>
 ) : (
 <span className="text-[9.5px] font-bold text-emerald-600 block bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.2 border border-emerald-200 rounded">
 Resmi Prodi
 </span>
 )}
 </div>

 <div className="space-y-2 text-xs text-[var(--text-muted)] mt-4 font-semibold">
 <div> Hari & Tanggal: <b className="text-[var(--text-main)]">{j.tanggal}</b></div>
 <div>â° Jam Pelaksanaan: <b className="text-[var(--text-main)]">{j.waktu} WIB</b></div>
 <div> Tempat / Ruangan: <b className="text-[var(--text-main)]">{j.ruang}</b></div>
 {j.meetLink && (
 <div className="pt-2">
 <a 
 href={j.meetLink} 
 target="_blank" 
 rel="noopener noreferrer" 
 className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all shadow-sm w-full justify-center text-center cursor-pointer"
 >
 <Video size={13} className="text-emerald-500 animate-pulse shrink-0" /> Gabung Seminar/Sidang (Google Meet)
 </a>
 </div>
 )}
 </div>

 <div className="mt-4 pt-3 border-t border-[var(--border-color)] space-y-2 text-xs text-[var(--text-muted)] font-semibold">
 <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block tracking-wider">Anggota Dewan Penguji:</span>
 <div> Penguji 1: <b className="text-[var(--text-main)]">{state.dosen.find((d) => d.email === j.penguji1)?.nama || j.penguji1 || "-"}</b></div>
 <div> Penguji 2: <b className="text-[var(--text-main)]">{state.dosen.find((d) => d.email === j.penguji2)?.nama || j.penguji2 || "-"}</b></div>
 </div>

 {j.catatan && (
 <p className="mt-3 p-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded text-[10px] text-[var(--text-muted)] italic">
 Alasan usulan: &ldquo;{j.catatan}&rdquo;
 </p>
 )}

 {/* Multi-Party Signatures / Approvals list */}
 <div className="mt-4 pt-3 border-t border-[var(--border-color)] space-y-1 text-[9.5px] font-bold">
 <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Status Persv (Sistem):</span>
 <div className="grid grid-cols-2 gap-1 text-[9px] font-semibold">
 <div className="flex justify-between bg-slate-50 dark:bg-[var(--bg-surface-hover)] px-2 py-1 rounded">
 <span>Mhs:</span>
 <span className={j.accMahasiswa === "Disetujui" ? "text-emerald-600 font-extrabold" : j.accMahasiswa === "Ditolak" ? "text-rose-600 font-extrabold" : "text-amber-500 font-extrabold"}>
 {j.accMahasiswa || "Menunggu"}
 </span>
 </div>
 <div className="flex justify-between bg-slate-50 dark:bg-[var(--bg-surface-hover)] px-2 py-1 rounded">
 <span>Penguji 1:</span>
 <span className={j.accPenguji1 === "Disetujui" ? "text-emerald-600 font-extrabold" : j.accPenguji1 === "Ditolak" ? "text-rose-600 font-extrabold" : "text-amber-500 font-extrabold"}>
 {j.accPenguji1 || "Menunggu"}
 </span>
 </div>
 <div className="flex justify-between bg-slate-50 dark:bg-[var(--bg-surface-hover)] px-2 py-1 rounded">
 <span>Penguji 2:</span>
 <span className={j.accPenguji2 === "Disetujui" ? "text-emerald-600 font-extrabold" : j.accPenguji2 === "Ditolak" ? "text-rose-600 font-extrabold" : "text-amber-500 font-extrabold"}>
 {j.accPenguji2 || "Menunggu"}
 </span>
 </div>
 <div className="flex justify-between bg-slate-50 dark:bg-[var(--bg-surface-hover)] px-2 py-1 rounded">
 <span>Prodi/Akr:</span>
 <span className={j.accProdi === "Disetujui" ? "text-emerald-600 font-extrabold" : j.accProdi === "Ditolak" ? "text-rose-600 font-extrabold" : "text-amber-500 font-extrabold"}>
 {j.accProdi || "Menunggu"}
 </span>
 </div>
 </div>
 </div>

 {/* Student Interactive Actions */}
 {statusMahasiswa === "Menunggu" && (
 <div className="mt-4 pt-3 flex gap-2 border-t border-[var(--border-color)]">
 <button
 onClick={async () => {
 await mutate("jadwalsidang", "update", { accMahasiswa: "Disetujui" }, "id", j.id, true);
 showToast("Persiapan dan persetujuan jadwal Anda berhasil dikirim!", "success");
 }}
 className="btn btn-sm flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold py-1.5 cursor-pointer text-center"
 >
 âœ“ Setuju & Bersedia
 </button>
 <button
 onClick={async () => {
 await mutate("jadwalsidang", "update", { accMahasiswa: "Ditolak" }, "id", j.id, true);
 showToast("Sikap pengajuan keberatan jadwal berhasil direkam.", "warning");
 }}
 className="btn btn-sm flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold py-1.5 cursor-pointer text-center"
 >
 Ajukan Halangan
 </button>
 </div>
 )}
 </div>
 );
 })}
 </div>
 );
 })()}
 </div>
 )}

 {/* 17. MAHASISWA: PESAN SURAT RESMI */}
 {activeTab === "surat-mhs" && (
 <div className="space-y-6 text-left">
 <div className="card-header pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h2 className="text-lg font-extrabold text-[var(--text-main)]">Daftar Pengajuan Surat Izin Lapangan</h2>
 <p className="text-xs text-[var(--text-muted)] font-medium">Ajukan permohonan penerbitan surat izin penelitian untuk Dinas Kesehatan atau Puskesmas tujuan</p>
 </div>
 <button
 onClick={() => {
 setActiveModal({
 id: "order-surat",
 title: "Pesan Surat Izin Baru",
 content: (
 <form
 id="order-surat-form"
 onSubmit={(e) => {
 e.preventDefault();
 const form = e.target as HTMLFormElement;
 const jenis = (form.elements.namedItem("jenis") as HTMLSelectElement).value;
 const programStudi = (form.elements.namedItem("programStudi") as HTMLSelectElement).value;
 const tujuan = (form.elements.namedItem("tujuan") as HTMLInputElement).value;
 const keperluan = (form.elements.namedItem("keperluan") as HTMLInputElement).value;
 const data = (form.elements.namedItem("data") as HTMLInputElement).value;
 mutate("pesanSurat", "add", {
 mahasiswaEmail: currentUser.email,
 namaMahasiswa: currentUser.nama,
 jenisSurat: jenis,
 programStudi,
 tujuanSurat: tujuan,
 keperluan,
 dataDiperlukan: data,
 tanggal: new Date().toISOString().slice(0, 10),
 status: "Menunggu",
 catatan: "",
 nomorSurat: "",
 });
 setActiveModal(null);
 }}
 className="space-y-4"
 >
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Program Studi Pengaju</label>
 <select name="programStudi" required className="form-input text-xs font-semibold">
 <option value="Ilmu Kesehatan Masyarakat">Prodi Ilmu Kesehatan Masyarakat (S1)</option>
 <option value="Psikologi">Prodi Psikologi (S1)</option>
 <option value="Magister Kesehatan Masyarakat">Prodi Magister Kesehatan Masyarakat (S2)</option>
 </select>
 {(() => {
 const pengguna = state.pengguna.find(p => p.email === currentUser.email);
 if (pengguna?.programStudi) {
 return <p className="text-[10px] text-emerald-600 mt-1 font-semibold">âœ“ Terdeteksi dari profil akun: {pengguna.programStudi}</p>;
 }
 return null;
 })()}
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Jenis Surat Instansi</label>
 <select name="jenis" required className="form-input text-xs font-semibold">
 <option value="Surat Izin Penelitian">Surat Izin Penelitian Lapangan</option>
 <option value="Surat Permohonan Data Awal">Surat Permohonan Data Awal Pendahuluan</option>
 <option value="Surat Izin Observasi">Surat Izin Observasi Kuliah Lapangan</option>
 <option value="Surat Keterangan Aktif Kuliah">Surat Keterangan Aktif Kuliah</option>
 <option value="Surat Keterangan Mahasiswa">Surat Keterangan Mahasiswa</option>
 <option value="Surat Pengantar Magang">Surat Pengantar Magang / PKL</option>
 </select>
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Nama Instansi Penerima / Tujuan</label>
 <input type="text" name="tujuan" required className="form-input text-xs font-semibold" placeholder="Contoh: Kepala Puskesmas Kecamatan Pontianak Barat" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Keperluan Deskriptif</label>
 <input type="text" name="keperluan" required className="form-input text-xs font-semibold" placeholder="Contoh: Pengisian kuesioner stunting anak di wilayah kerja terkait" />
 </div>
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Data Spesifik Yang Dibutuhkan</label>
 <input type="text" name="data" required className="form-input text-xs font-semibold" placeholder="Contoh: Rekapitulasi prevalensi gizi buruk balita 3 tahun terakhir" />
 </div>
 </form>
 ),
 footer: (
 <div className="flex gap-2">
 <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">Batal</button>
 <button type="submit" form="order-surat-form" className="btn btn-primary text-xs">Ajukan Permohonan</button>
 </div>
 ),
 });
 }}
 className="btn btn-primary text-xs flex items-center gap-1.5"
 >
 <Plus size={14} /> Pesan Surat Baru
 </button>
 </div>

 <div className="space-y-4">
 {(state.pesanSurat || []).filter((p) => p.mahasiswaEmail === currentUser.email).reverse().map((surat) => (
 <div key={surat.id} className="card">
 <div className="flex justify-between items-center mb-3 border-b border-[var(--border-color)] pb-2.5">
 <div>
 <span className="text-xs font-bold text-[var(--brand-primary)] block">{surat.jenisSurat}</span>
 {surat.programStudi && (
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 text-[9px] font-extrabold uppercase tracking-wide mt-1 mb-0.5">
 {surat.programStudi === "Ilmu Kesehatan Masyarakat" ? "IKM (S1)" : surat.programStudi === "Psikologi" ? "Psikologi (S1)" : "MKM (S2)"}
 </span>
 )}
 <span className="text-[10px] text-[var(--text-muted)] font-semibold mt-1 block">Diajukan: {surat.tanggal}</span>
 </div>
 <span className={`pill ${surat.status === "Disetujui" ? "pill-success" : surat.status === "Ditolak" ? "pill-danger" : "pill-warning"}`}>
 {surat.status}
 </span>
 </div>
 <div className="space-y-2 text-xs font-semibold text-[var(--text-muted)] mb-4">
 <div> Instansi Tujuan: <b className="text-[var(--text-main)]">{surat.tujuanSurat}</b></div>
 <div> Keperluan Analisis: <b className="text-[var(--text-main)]">{surat.keperluan}</b></div>
 {surat.nomorSurat && <div> No Surat Pengesahan: <span className="font-mono text-[var(--brand-primary)] font-bold">{surat.nomorSurat}</span></div>}
 </div>

 {surat.status === "Disetujui" && (
 <button
 onClick={() => setPrintData(surat)}
 className="btn btn-success btn-sm text-[11px] flex items-center gap-1.5 mt-2"
 >
 Cetak Surat (PDF)
 </button>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === "dokumen-tesis" && (
 <DokumenTesisTab
 currentUser={currentUser}
 state={state}
 mutate={mutate}
 showToast={showToast}
 />
 )}

 {activeTab === "panduan-sop" && (
 <PanduanSOPTab
 currentUser={currentUser!}
 state={state}
 mutate={mutate}
 showToast={showToast}
 />
 )}

 {activeTab === "berkas-maju" && (
 <BerkasMajuTab
 currentUser={currentUser!}
 state={state}
 mutate={mutate}
 showToast={showToast}
 />
 )}

 </div>
 </div>
 </div>
 )}

 {/* WINDOW GENERAL ACTION MODAL OVERLAY */}
 {activeModal && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 no-print">
 <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border-color)] overflow-hidden animate-slide-entry text-left">
 <div className="p-5 bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] flex justify-between items-center">
 <h3 className="text-sm font-bold tracking-tight text-[var(--text-main)]">
 {activeModal.title}
 </h3>
 <button onClick={() => setActiveModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl cursor-pointer">Ã—</button>
 </div>
 <div className="p-5 max-h-[70vh] overflow-y-auto font-medium">
 {activeModal.content}
 </div>
 {activeModal.footer && (
 <div className="p-4 bg-[var(--bg-surface-hover)] border-t border-[var(--border-color)] flex justify-end">
 {activeModal.footer}
 </div>
 )}
 </div>
 </div>
 )}

 {/* INDEPENDENT PRINT PREVIEW OVERLAY MODAL */}
 {printData && (
 <PrintLetter
 surat={printData}
 logo={state.logo}
 mahasiswaList={state.mahasiswa}
 onClose={() => setPrintData(null)}
 />
 )}

 {printConsultation && (
 <PrintConsultationCard
 session={printConsultation}
 allSessions={state.konsultasi}
 logo={state.logo}
 mahasiswaList={state.mahasiswa}
 dosenList={state.dosen}
 onClose={() => setPrintConsultation(null)}
 showToast={showToast}
 />
 )}

 {showProfileModal && currentUser && (
 <ProfileModal
 currentUser={currentUser}
 onSave={handleSaveProfile}
 onClose={() => setShowProfileModal(false)}
 showToast={showToast}
 />
 )}
 
 {/* AI Assistant Widget */}
 {currentUser && (
 <AIAssistantWidget logo={state.logo} />
 )}

 </div>
 );
}


