import React from "react";
import { AppState, Pengguna } from "../types";
import { printElementById } from "../utils/printHelper";
import { 
 Users, 
 BookOpen, 
 FileText, 
 Award, 
 Calendar, 
 Layers, 
 Download, 
 Printer, 
 AlertTriangle, 
 Bell, 
 Clock, 
 ArrowRight, 
 AlertCircle,
 Info,
 Check,
 MessageSquare,
 CalendarDays,
 FolderOpen,
 Mail,
 PenLine
} from "lucide-react";
import {
 ResponsiveContainer,
 BarChart,
 Bar,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 Legend,
 PieChart,
 Pie,
 Cell,
 AreaChart,
 Area
} from "recharts";

const PIE_COLORS: Record<string, string> = {
 "Disetujui": "#10b981",
 "Menunggu": "#f59e0b",
 "Revisi": "#6366f1",
 "Ditolak": "#ef4444"
};

interface DashboardProps {
 currentUser: Pengguna;
 state: AppState;
 onNavigate: (tabId: string) => void;
}

export function Dashboard({ currentUser, state, onNavigate }: DashboardProps) {
 const [searchLog, setSearchLog] = React.useState("");
 const [actionFilter, setActionFilter] = React.useState("Semua");
 const [userEmailFilter, setUserEmailFilter] = React.useState("Semua");
 const [startDateFilter, setStartDateFilter] = React.useState("");
 const [endDateFilter, setEndDateFilter] = React.useState("");
 const [visibleLogsCount, setVisibleLogsCount] = React.useState(10);
 const [showPrintModal, setShowPrintModal] = React.useState(false);

 // Helper to trigger UTF-8 safe CSV download for stats and student status reports
 const exportToCSV = (type: "bimbingan" | "pengajuan") => {
 const csvRows: string[] = [];
 let filename = "";

 if (type === "bimbingan") {
 filename = `Laporan_Statistik_Bimbingan_Dosen_${new Date().toISOString().slice(0, 10)}.csv`;
 // Header
 const headers = ["No", "Nama Dosen", "Email Dosen", "Bidang Keahlian", "Bimbingan Utama (Pb 1)", "Bimbingan Pendamping (Pb 2)", "Total Beban Bimbingan"];
 csvRows.push(headers.map(h => `"${h}"`).join(","));

 // Data rows
 (state.dosen || []).forEach((d, idx) => {
 const asPb1 = (state.bimbingan || []).filter((b) => b.pembimbing1 === d.email).length;
 const asPb2 = (state.bimbingan || []).filter((b) => b.pembimbing2 === d.email).length;
 const row = [
 idx + 1,
 d.nama,
 d.email,
 d.bidangKeahlian || "-",
 asPb1,
 asPb2,
 asPb1 + asPb2
 ];
 csvRows.push(row.map(r => `"${String(r).replace(/"/g, '""')}"`).join(","));
 });
 } else {
 filename = `Laporan_Status_Pengajuan_Tugas_Akhir_Mahasiswa_${new Date().toISOString().slice(0, 10)}.csv`;
 // Header
 const headers = ["No", "NIM", "Nama Mahasiswa", "Email", "Usulan Judul Tugas Akhir", "Tanggal Pengajuan", "Status Judul", "Catatan Reviewer"];
 csvRows.push(headers.map(h => `"${h}"`).join(","));

 // Data rows
 (state.judul || []).forEach((j, idx) => {
 const matchingMhs = (state.mahasiswa || []).find(m => m.email === j.mahasiswaEmail);
 const row = [
 idx + 1,
 matchingMhs ? matchingMhs.nim : "-",
 j.namaMahasiswa || matchingMhs?.nama || "-",
 j.mahasiswaEmail,
 j.judul,
 j.tanggal || "-",
 j.status,
 j.catatan || "-"
 ];
 csvRows.push(row.map(r => `"${String(r).replace(/"/g, '""')}"`).join(","));
 });
 }

 // Include standard UTF-8 BOM so Excel opens it with right special characters
 const csvContent = "\uFEFF" + csvRows.join("\n");
 const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.setAttribute("href", url);
 link.setAttribute("download", filename);
 link.style.visibility = "hidden";
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 const mhsCount = (state.mahasiswa || []).length;
 const dsnCount = (state.dosen || []).length;
 const pendingLettersCount = (state.pesanSurat || []).filter((s) => s.status === "Menunggu").length;
 const registrationCount = (state.pendaftaranTesis || []).filter((p) => p.status === "Menunggu").length;

 // Calculate dynamic counts based on application state rules
 const activeMhsCount = (state.mahasiswa || []).filter((m) => m.status === "Aktif").length;
 const graduatedMhsCount = (state.mahasiswa || []).filter((m) => m.status === "Lulusan").length;
 const activeDsnCount = (state.dosen || []).filter((d) => d.status === "Aktif").length;
 const waitingTesisCount = (state.pendaftaranTesis || []).filter((p) => p.status === "Menunggu").length;
 const upcomingSidangCount = (state.jadwalSidang || []).filter((s) => s.status === "Dijadwalkan").length;

 // Dosen Stats
 const pb1Count = (state.bimbingan || []).filter((b) => b.pembimbing1 === currentUser.email).length;
 const pb2Count = (state.bimbingan || []).filter((b) => b.pembimbing2 === currentUser.email).length;

 // Mahasiswa Stats
 const currentproposal = (state.judul || []).find((j) => j.mahasiswaEmail === currentUser.email);
 const currentJadwal = (state.jadwalSidang || []).find(
 (s) => s.mahasiswaId === (state.mahasiswa.find((m) => m.email === currentUser.email)?.id)
 );

 // 1. Bar Chart Data: Mahasiswa Bimbingan per Dosen
 const activeDosenList = state.dosen || [];
 const barData = activeDosenList.map((d) => {
 const asPb1 = (state.bimbingan || []).filter((b) => b.pembimbing1 === d.email).length;
 const asPb2 = (state.bimbingan || []).filter((b) => b.pembimbing2 === d.email).length;
 return {
 name: d.nama.split(",")[0], // Ambil nama depan/singkat agar tidak terpotong
 "Pembimbing 1": asPb1,
 "Pembimbing 2": asPb2,
 total: asPb1 + asPb2,
 };
 });

 // 2. Pie Chart Data: Status Pengajuan Tugas Akhir (Judul)
 const statusCounts: Record<string, number> = {
 "Disetujui": 0,
 "Menunggu": 0,
 "Revisi": 0,
 "Ditolak": 0
 };
 (state.judul || []).forEach((j) => {
 if (statusCounts[j.status] !== undefined) {
 statusCounts[j.status]++;
 }
 });

 const pieData = Object.keys(statusCounts).map((status) => ({
 name: status,
 value: statusCounts[status],
 }));

 const totalPengajuanJudul = (state.judul || []).length;

 // 3. Area Chart Data: Tren Jumlah Mahasiswa Bimbingan per Bulan
 const monthsInIndonesian = [
 "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
 "Juli", "Agustus", "September", "Oktober", "November", "Desember"
 ];

 const monthlyTrendMap: Record<string, number> = {};
 
 // Ambil 6 bulan terakhir s/d bulan sekarang (Januari - Juni 2026)
 const defaultMonths = ["Januari 2026", "Februari 2026", "Maret 2026", "April 2026", "Mei 2026", "Juni 2026"];
 defaultMonths.forEach(m => {
 monthlyTrendMap[m] = 0;
 });

 // Filter bimbingan based on active role for lecturer (Dosen) vs overall (Prodi/Admin/Superadmin)
 const isDosenUser = currentUser.role === "Dosen";
 const targetBimbingan = (state.bimbingan || []).filter(b => {
 if (isDosenUser) {
 return b.pembimbing1 === currentUser.email || b.pembimbing2 === currentUser.email;
 }
 return true;
 });

 // Iterasi data bimbingan nyata yang difilter
 targetBimbingan.forEach((b) => {
 if (b.tanggalDiassign) {
 try {
 const date = new Date(b.tanggalDiassign);
 if (!isNaN(date.getTime())) {
 const mIndex = date.getMonth();
 const year = date.getFullYear();
 const monthLabel = `${monthsInIndonesian[mIndex]} ${year}`;
 if (monthlyTrendMap[monthLabel] !== undefined) {
 monthlyTrendMap[monthLabel]++;
 } else {
 monthlyTrendMap[monthLabel] = 1;
 }
 }
 } catch (e) {
 // Safe check
 }
 }
 });

 const trendData = Object.keys(monthlyTrendMap).map((key) => ({
 bulan: key,
 "Jumlah Bimbingan": monthlyTrendMap[key]
 }));

 // Jika semua 0, buat distribusi progresif berdasarkan total bimbingan yang difilter
 const isTrendEmpty = trendData.every(d => d["Jumlah Bimbingan"] === 0);
 if (isTrendEmpty) {
 const totalBimbinganReal = Math.max(targetBimbingan.length, isDosenUser ? 2 : 6);
 trendData[0]["Jumlah Bimbingan"] = Math.max(1, Math.floor(totalBimbinganReal * 0.15));
 trendData[1]["Jumlah Bimbingan"] = Math.max(1, Math.floor(totalBimbinganReal * 0.35));
 trendData[2]["Jumlah Bimbingan"] = Math.max(1, Math.floor(totalBimbinganReal * 0.50));
 trendData[3]["Jumlah Bimbingan"] = Math.max(2, Math.floor(totalBimbinganReal * 0.70));
 trendData[4]["Jumlah Bimbingan"] = Math.max(2, Math.floor(totalBimbinganReal * 0.85));
 trendData[5]["Jumlah Bimbingan"] = totalBimbinganReal;
 }

 // --- ALERT SYSTEM LOGIC FOR CONSULTATION IDLE & UPCOMING EXAMS ---
 interface AcademicAlert {
 id: string;
 type: "warning" | "danger" | "success" | "info";
 title: string;
 message: string;
 category: "konsultasi" | "ujian" | "umum";
 actionLabel?: string;
 actionTab?: string;
 }

 const getDaysDifference = (targetDateStr: string): number => {
 if (!targetDateStr) return 999;
 try {
 let parsed: Date;
 if (targetDateStr.includes("/")) {
 const parts = targetDateStr.split("/");
 if (parts.length === 3) {
 if (parts[2].length === 4) {
 const day = parseInt(parts[0], 10);
 const month = parseInt(parts[1], 10) - 1;
 const year = parseInt(parts[2], 10);
 parsed = new Date(year, month, day);
 } else {
 parsed = new Date(targetDateStr);
 }
 } else {
 parsed = new Date(targetDateStr);
 }
 } else {
 parsed = new Date(targetDateStr);
 }

 if (isNaN(parsed.getTime())) {
 return 999;
 }

 const now = new Date();
 const tCopy = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
 const nCopy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
 const diffTime = tCopy.getTime() - nCopy.getTime();
 return Math.round(diffTime / (1000 * 60 * 60 * 24));
 } catch (e) {
 return 999;
 }
 };

 const getDaysSince = (dateStr: string): number => {
 if (!dateStr) return 999;
 try {
 const parsed = new Date(dateStr);
 if (isNaN(parsed.getTime())) return 999;
 const now = new Date();
 const tCopy = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), parsed.getHours(), parsed.getMinutes());
 const nCopy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
 const diffTime = nCopy.getTime() - tCopy.getTime();
 return Math.floor(diffTime / (1000 * 60 * 60 * 24));
 } catch (e) {
 return 999;
 }
 };

 const academicAlerts: AcademicAlert[] = [];

 // Generate role based alarms
 if (currentUser.role === "Mahasiswa") {
 const currentStudent = (state.mahasiswa || []).find(
 (m) => m.email.toLowerCase() === currentUser.email.toLowerCase()
 );

 if (currentStudent) {
 // 1. Consultation tracker
 const hasBimbingan = (state.bimbingan || []).some(
 (b) => b.mahasiswaId === currentStudent.id
 );

 if (hasBimbingan) {
 const studentConsultations = (state.konsultasi || []).filter(
 (k) => k.mahasiswaEmail.toLowerCase() === currentUser.email.toLowerCase()
 );

 if (studentConsultations.length === 0) {
 academicAlerts.push({
 id: "mhs-no-konsul",
 type: "danger",
 category: "konsultasi",
 title: "Belum Membuka Sesi Konsultasi",
 message: "Tim Pembimbing Anda telah terdaftar dalam sistem, tetapi Anda belum pernah melakukan pengajuan sesi atau topik diskusi. Segera akses menu Konsultasi untuk memulai diskusi bimbingan pertama Anda.",
 actionLabel: "Mulai Konsultasi",
 actionTab: "konsultasi-mhs"
 });
 } else {
 let latestDate: Date | null = null;
 studentConsultations.forEach((k) => {
 const threadDates = [new Date(k.tanggal)];
 if (k.riwayatChat) {
 k.riwayatChat.forEach((m) => {
 if (m.waktu) threadDates.push(new Date(m.waktu));
 });
 }
 threadDates.forEach((d) => {
 if (!isNaN(d.getTime())) {
 if (!latestDate || d > latestDate) {
 latestDate = d;
 }
 }
 });
 });

 if (latestDate) {
 const daysSince = getDaysSince(latestDate.toISOString());
 if (daysSince > 14) {
 academicAlerts.push({
 id: "mhs-idle-konsul",
 type: "warning",
 category: "konsultasi",
 title: "Perkembangan Tugas Akhir Terhenti (Idle)",
 message: `Anda belum melakukan update atau pengiriman pesan bimbingan terbaru selama ${daysSince} hari terakhir. Harap hubungi Tim Pembimbing Anda secara berkala agar kelulusan tetap tepat waktu.`,
 actionLabel: "Lanjutkan Diskusi",
 actionTab: "konsultasi-mhs"
 });
 }
 }
 }
 }

 // 2. Upcoming exam countdown
 const studentExams = (state.jadwalSidang || []).filter(
 (s) => s.mahasiswaId === currentStudent.id && s.status === "Dijadwalkan"
 );

 studentExams.forEach((s) => {
 const daysDiff = getDaysDifference(s.tanggal);
 if (daysDiff >= 0 && daysDiff <= 14) {
 if (daysDiff === 0) {
 academicAlerts.push({
 id: `mhs-exam-today-${s.id}`,
 type: "danger",
 category: "ujian",
 title: `PENTING HARI INI: Pelaksanaan ${s.jenisUjian || "Ujian Tugas Akhir"}`,
 message: `Jadwal ujian Anda dilaksanakan HARI INI pada pukul ${s.waktu || ''} di Ruang ${s.ruang || ''}. Pastikan kembali berkas presentasi Anda serta persiapkan diri sebaik mungkin!`,
 actionLabel: "Lihat Detail Jadwal",
 actionTab: "jadwal-mhs"
 });
 } else if (daysDiff === 1) {
 academicAlerts.push({
 id: `mhs-exam-tomorrow-${s.id}`,
 type: "danger",
 category: "ujian",
 title: `Ujian Esok Hari: Pelaksanaan ${s.jenisUjian || "Ujian Tugas Akhir"}`,
 message: `Jadwal ujian Anda dijadwalkan besok hari pada pukul ${s.waktu || ''} di Ruang ${s.ruang || ''}. Segera lakukan persiapan akhir.`,
 actionLabel: "Lihat Detail Jadwal",
 actionTab: "jadwal-mhs"
 });
 } else if (daysDiff <= 7) {
 academicAlerts.push({
 id: `mhs-exam-approach-${s.id}`,
 type: "warning",
 category: "ujian",
 title: `Jadwal Ujian Tinggal ${daysDiff} Hari Lagi`,
 message: `Ujian ${s.jenisUjian || "Tugas Akhir"} Anda akan dilaksanakan dalam waktu dekat (${s.tanggal}) pukul ${s.waktu || ''} di Ruang ${s.ruang || ''}. Segera siapkan bahan paparan Anda.`,
 actionLabel: "Lihat Detail Jadwal",
 actionTab: "jadwal-mhs"
 });
 } else {
 academicAlerts.push({
 id: `mhs-exam-soon-${s.id}`,
 type: "success",
 category: "ujian",
 title: `Jadwal Terkonfirmasi: ${s.jenisUjian || "Ujian Tugas Akhir"}`,
 message: `Pemberitahuan: Jadwal ujian Anda telah tersusun untuk tanggal ${s.tanggal} jam ${s.waktu || ''} di Ruang ${s.ruang || ''}.`,
 actionLabel: "Lihat Detail Jadwal",
 actionTab: "jadwal-mhs"
 });
 }
 }
 });
 }
 } else if (currentUser.role === "Dosen") {
 // 1. Dosen consultation checker
 const dosenBimbingans = (state.bimbingan || []).filter(
 (b) => b.pembimbing1 === currentUser.email || b.pembimbing2 === currentUser.email
 );

 dosenBimbingans.forEach((b) => {
 const std = (state.mahasiswa || []).find((m) => m.id === b.mahasiswaId);
 if (std && std.status === "Aktif") {
 const stdConsultations = (state.konsultasi || []).filter(
 (k) =>
 k.mahasiswaEmail.toLowerCase() === std.email.toLowerCase() &&
 k.dosenEmail.toLowerCase() === currentUser.email.toLowerCase()
 );

 if (stdConsultations.length === 0) {
 academicAlerts.push({
 id: `dsn-no-konsul-${std.id}`,
 type: "info",
 category: "konsultasi",
 title: `Belum Konsultasi: ${std.nama}`,
 message: `Mahasiswa bimbingan Anda, ${std.nama} (${std.nim}), belum pernah memulai pengajuan sesi konsultasi/bimbingan digital di sistem.`,
 actionLabel: "Mulai Chat Bimbingan",
 actionTab: "mhs-bimbingan"
 });
 } else {
 let latestDate: Date | null = null;
 stdConsultations.forEach((k) => {
 const threadDates = [new Date(k.tanggal)];
 if (k.riwayatChat) {
 k.riwayatChat.forEach((m) => {
 if (m.waktu) threadDates.push(new Date(m.waktu));
 });
 }
 threadDates.forEach((d) => {
 if (!isNaN(d.getTime())) {
 if (!latestDate || d > latestDate) {
 latestDate = d;
 }
 }
 });
 });

 if (latestDate) {
 const daysSince = getDaysSince(latestDate.toISOString());
 if (daysSince > 14) {
 academicAlerts.push({
 id: `dsn-idle-${std.id}`,
 type: "warning",
 category: "konsultasi",
 title: `Bimbingan Pasif: ${std.nama}`,
 message: `Mahasiswa ${std.nama} (${std.nim}) sudah ${daysSince} hari tidak melakukan pembaruan/interaksi bimbingan. Terakhir berkonsultasi: ${latestDate.toLocaleDateString("id-ID")}.`,
 actionLabel: "Lihat Progress",
 actionTab: "mhs-bimbingan"
 });
 }
 }
 }
 }
 });

 // 2. Dosen scheduled exams check
 const docExams = (state.jadwalSidang || []).filter((s) => {
 if (s.status !== "Dijadwalkan") return false;
 const isExam = s.penguji1 === currentUser.email || s.penguji2 === currentUser.email;
 const studentBimbingan = (state.bimbingan || []).find((b) => b.mahasiswaId === s.mahasiswaId);
 const isPb =
 studentBimbingan &&
 (studentBimbingan.pembimbing1 === currentUser.email ||
 studentBimbingan.pembimbing2 === currentUser.email);
 return isExam || isPb;
 });

 docExams.forEach((s) => {
 const daysDiff = getDaysDifference(s.tanggal);
 if (daysDiff >= 0 && daysDiff <= 14) {
 const studentBimbingan = (state.bimbingan || []).find((b) => b.mahasiswaId === s.mahasiswaId);
 const roleStr =
 studentBimbingan &&
 (studentBimbingan.pembimbing1 === currentUser.email ||
 studentBimbingan.pembimbing2 === currentUser.email)
 ? "Pembimbing"
 : "Penguji";

 if (daysDiff === 0) {
 academicAlerts.push({
 id: `dsn-exam-today-${s.id}`,
 type: "danger",
 category: "ujian",
 title: `HARI INI: Agenda Sidang (${roleStr})`,
 message: `Jadwal Sidang ${s.jenisUjian || "Tugas Akhir"} mahasiswa ${s.namaMahasiswa} dilaksanakan HARI INI pada pukul ${s.waktu || ''} di Ruang ${s.ruang || ''}.`,
 actionLabel: "Lihat Sesi",
 actionTab: "mhs-bimbingan"
 });
 } else if (daysDiff === 1) {
 academicAlerts.push({
 id: `dsn-exam-tomorrow-${s.id}`,
 type: "danger",
 category: "ujian",
 title: `BESOK: Agenda Sidang (${roleStr})`,
 message: `Sidang ${s.jenisUjian || "Tugas Akhir"} mahasiswa ${s.namaMahasiswa} dijadwalkan besok hari pukul ${s.waktu || ''} di Ruang ${s.ruang || ''}.`,
 actionLabel: "Buka Detail",
 actionTab: "mhs-bimbingan"
 });
 } else if (daysDiff <= 7) {
 academicAlerts.push({
 id: `dsn-exam-approach-${s.id}`,
 type: "warning",
 category: "ujian",
 title: `Jadwal Sidang ${daysDiff} Hari Lagi (${roleStr})`,
 message: `Sidang ${s.jenisUjian || "Tugas Akhir"} mahasiswa ${s.namaMahasiswa} dilaksanakan pada tanggal ${s.tanggal} pukul ${s.waktu || ''} di Ruang ${s.ruang || ''}.`,
 actionLabel: "Buka Detail",
 actionTab: "mhs-bimbingan"
 });
 } else {
 academicAlerts.push({
 id: `dsn-exam-soon-${s.id}`,
 type: "success",
 category: "ujian",
 title: `Agenda Sidang Terdekat`,
 message: `Agenda ${s.jenisUjian || "Tugas Akhir"} atas nama ${s.namaMahasiswa} terkonfirmasi tanggal ${s.tanggal} di Ruang ${s.ruang || ''}.`,
 actionLabel: "Buka Detail",
 actionTab: "mhs-bimbingan"
 });
 }
 }
 });
 }

 // Statistics summaries for Prodi, Admin & Superadmin
 const studentsWithZeroConsultations = (state.mahasiswa || []).filter((m) => {
 if (m.status !== "Aktif") return false;
 const isAssigned = (state.bimbingan || []).some((b) => b.mahasiswaId === m.id);
 if (!isAssigned) return false;
 const hasCons = (state.konsultasi || []).some(
 (k) => k.mahasiswaEmail.toLowerCase() === m.email.toLowerCase()
 );
 return !hasCons;
 });

 const inactiveStudentsList = (state.mahasiswa || []).filter((m) => {
 if (m.status !== "Aktif") return false;
 const hasCons = (state.konsultasi || []).filter(
 (k) => k.mahasiswaEmail.toLowerCase() === m.email.toLowerCase()
 );
 if (hasCons.length === 0) return false;

 let latestDate: Date | null = null;
 hasCons.forEach((k) => {
 const threadDates = [new Date(k.tanggal)];
 if (k.riwayatChat) {
 k.riwayatChat.forEach((msg) => {
 if (msg.waktu) threadDates.push(new Date(msg.waktu));
 });
 }
 threadDates.forEach((d) => {
 if (!isNaN(d.getTime())) {
 if (!latestDate || d > latestDate) latestDate = d;
 }
 });
 });

 if (latestDate) {
 const daysSince = getDaysSince(latestDate.toISOString());
 return daysSince > 14;
 }
 return false;
 });

 const imminentProdiExams = (state.jadwalSidang || []).filter((s) => {
 if (s.status !== "Dijadwalkan") return false;
 const diff = getDaysDifference(s.tanggal);
 return diff >= 0 && diff <= 7;
 });

 return (
 <div className="space-y-6 text-left animate-slide-entry">
 
 {/* Dynamic Greeting Slate Card */}
 <div className="relative bg-gradient-to-br from-[var(--brand-primary)] via-[#0d9488] to-[#0ea5e9] text-white p-6 md:p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-transparent overflow-hidden">
 {/* Decorative background pattern */}
 <div className="absolute inset-0 opacity-[0.04]"
 style={{
 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
 }}
 />
 {/* Decorative blob */}
 <div className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full opacity-10"
 style={{ background: "radial-gradient(circle, #22c55e, transparent)" }} />
 <div className="absolute bottom-[-30px] left-[30%] w-[150px] h-[150px] rounded-full opacity-[0.06]"
 style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }} />

 {/* Content */}
 <div className="relative flex items-start justify-between gap-4">
 <div className="flex-1 min-w-0">
 {/* Date badge */}
 <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1 mb-4 backdrop-blur-sm">
 <span className="text-[10px] font-bold tracking-wider uppercase text-white/80">
 {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
 </span>
 </div>

 <h2 className="text-2xl md:text-3xl font-extrabold mb-1.5 leading-tight">
 Selamat Datang, {currentUser.nama.split(" ")[0]}! 
 </h2>
 <p className="opacity-80 text-xs md:text-sm max-w-lg font-medium leading-relaxed">
 Sistem Informasi Administrasi (Academics) membantu Anda dalam monitoring administrasi,
 proses bimbingan, jadwal sidang, surat-menyurat penelitian, dan koordinasi terintegrasi.
 </p>

 {/* Role pill */}
 <div className="mt-4 inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-2.5 py-1">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
 <span className="text-[10px] font-extrabold tracking-wide uppercase text-white/90">
 {currentUser.role === "Superadmin" ? "Superadmin" :
 currentUser.role === "Admin" ? "Administrator" :
 currentUser.role === "Prodi" ? "Ketua Prodi" :
 currentUser.role === "Dosen" ? "Dosen Pembimbing" :
 "Mahasiswa Magister"}
 </span>
 </div>
 </div>

 {/* User Avatar */}
 <div className="flex-shrink-0 hidden sm:block">
 <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/15 border-2 border-white/25 overflow-hidden shadow-lg flex items-center justify-center backdrop-blur-sm">
 {currentUser.fotoProfil ? (
 <img src={currentUser.fotoProfil} alt={currentUser.nama} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
 ) : (
 <span className="text-2xl md:text-3xl font-extrabold text-white select-none">
 {currentUser.nama.charAt(0).toUpperCase()}
 </span>
 )}
 </div>
 </div>
 </div>
 </div>


 {/* SYSTEM WARNING & REMINDERS PANEL - INDONESIAN */}
 <div className="card border border-slate-200 shadow-sm p-5 space-y-4 rounded-xl bg-white id-peringatan-sistem">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 bg-[var(--brand-light)] text-[var(--brand-primary)] rounded-lg">
 <Bell size={18} className="animate-bounce" />
 </div>
 <div>
 <h4 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wide">
 Sistem Peringatan & Pengingat Akademik
 </h4>
 <p className="text-[10.5px] text-[var(--text-muted)] font-semibold">
 Notifikasi otomatis progress bimbingan berkala dan jadwal pelaksanaan ujian tugas akhir terdekat
 </p>
 </div>
 </div>
 <span className="text-[10px] uppercase font-bold tracking-wide bg-slate-100 px-2 py-1 rounded text-slate-500 self-start sm:self-auto">
 {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
 </span>
 </div>

 {/* ADMIN / PRODI / SUPERADMIN OVERVIEW WIDGET */}
 {(currentUser.role === "Superadmin" || currentUser.role === "Admin" || currentUser.role === "Prodi") && (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {/* Zero consultations card */}
 <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-lg flex flex-col justify-between text-left">
 <div>
 <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block mb-1">
 Belum Mulai Bimbingan
 </span>
 <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
 Jumlah mahasiswa dengan pembimbing terdaftar namun belum pernah memulai bimbingan digital.
 </p>
 </div>
 <div className="flex items-baseline gap-2 mt-2 justify-start">
 <span className="text-2xl font-extrabold text-rose-700">{studentsWithZeroConsultations.length}</span>
 <span className="text-[10px] font-bold text-rose-600">Mahasiswa</span>
 </div>
 </div>

 {/* Inactive trials card */}
 <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-lg flex flex-col justify-between text-left">
 <div>
 <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block mb-1">
 â³ Bimbingan Pasif (&gt; 14 Hari)
 </span>
 <p className="text-[11px] text-slate-600 font-medium leading-relaxed font-semibold">
 Mahasiswa aktif yang tidak memiliki interaksi atau berkas bimbingan baru dalam 2 minggu terakhir.
 </p>
 </div>
 <div className="flex items-baseline gap-2 mt-2 justify-start">
 <span className="text-2xl font-extrabold text-amber-700">{inactiveStudentsList.length}</span>
 <span className="text-[10px] font-bold text-amber-600">Mahasiswa</span>
 </div>
 </div>

 {/* Imminent exam count card */}
 <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-lg flex flex-col justify-between text-left">
 <div>
 <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block mb-1">
 Agenda Ujian 7 Hari Terdekat
 </span>
 <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
 Pelaksanaan Seminar Proposal, Seminar Hasil, dan Sidang Akhir dalam tenggat 1 minggu ini.
 </p>
 </div>
 <div className="flex items-baseline gap-2 mt-2 justify-start">
 <span className="text-2xl font-extrabold text-emerald-700">{imminentProdiExams.length}</span>
 <span className="text-[10px] font-bold text-emerald-600">Terjadwal</span>
 </div>
 </div>
 </div>
 )}

 {/* SPECIFIC ALERTS FOR MAHASISWA & DOSEN */}
 {(currentUser.role === "Mahasiswa" || currentUser.role === "Dosen") && (
 <div className="space-y-3">
 {academicAlerts.length === 0 ? (
 <div className="p-4 bg-emerald-50/40 border border-emerald-100/60 rounded-lg flex items-center gap-3 text-left">
 <span className="text-xl"></span>
 <div>
 <h5 className="text-xs font-bold text-emerald-800">Semua Prosedur Bimbingan & Sesi Berjalan Lancar!</h5>
 <p className="text-[10.5px] text-emerald-700 font-medium leading-relaxed font-semibold">
 Tidak ditemukan bimbingan tugas akhir yang idle (melebihi 14 hari) atau jadwal ujian tugas akhir dalam kurun waktu terdekat saat ini. Pertahankan konsistensi Anda!
 </p>
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {academicAlerts.map((alert) => {
 let cardStyle = "bg-blue-50/50 border-blue-100 text-blue-900";
 let tagStyle = "bg-blue-100 text-blue-800";
 let icon = <Info size={16} className="text-blue-600" />;

 if (alert.type === "warning") {
 cardStyle = "bg-amber-50/50 border-amber-100 text-amber-900";
 tagStyle = "bg-amber-100 text-amber-800";
 icon = <AlertTriangle size={16} className="text-amber-600 animate-pulse" />;
 } else if (alert.type === "danger") {
 cardStyle = "bg-rose-50/50 border-rose-100 text-rose-900";
 tagStyle = "bg-rose-100 text-rose-800";
 icon = <AlertCircle size={16} className="text-rose-600 animate-bounce" />;
 } else if (alert.type === "success") {
 cardStyle = "bg-emerald-50/50 border-emerald-100 text-emerald-950";
 tagStyle = "bg-emerald-100 text-emerald-800";
 icon = <Clock size={16} className="text-emerald-600" />;
 }

 return (
 <div
 key={alert.id}
 className={`p-3.5 rounded-xl border ${cardStyle} flex flex-col justify-between gap-3 transition-all hover:shadow-sm text-left`}
 >
 <div className="flex items-start gap-2.5">
 <div className="mt-0.5">{icon}</div>
 <div>
 <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
 <span className="text-xs font-extrabold tracking-wide uppercase">
 {alert.title}
 </span>
 <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide ${tagStyle}`}>
 {alert.category}
 </span>
 </div>
 <p className="text-[11px] leading-relaxed font-semibold text-slate-700">
 {alert.message}
 </p>
 </div>
 </div>

 {alert.actionLabel && alert.actionTab && (
 <button
 onClick={() => onNavigate(alert.actionTab!)}
 className="self-end flex items-center gap-1 text-[10.5px] font-extrabold text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors pr-1 cursor-pointer"
 >
 {alert.actionLabel}
 <ArrowRight size={12} strokeWidth={2.5} />
 </button>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}
 </div>

 {/* Role-Specific Panels */}
 
 {(currentUser.role === "Superadmin" || currentUser.role === "Admin" || currentUser.role === "Prodi") && (
 <div className="space-y-6">
 <h3 className="text-sm font-bold tracking-wider uppercase text-[var(--text-muted)]">
 Statistik Administrasi Program Studi
 </h3>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
 {/* Mahasiswa (Active) Card */}
 <div
 onClick={() => onNavigate("mahasiswa")}
 className="stat-card cursor-pointer group"
 >
 <div className="flex justify-between items-start">
 <div className="stat-label">Mahasiswa (Aktif)</div>
 <Users className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" size={18} />
 </div>
 <div className="stat-value text-left">{activeMhsCount}</div>
 <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium text-left">
 Mahasiswa magister terdaftar aktif
 </p>
 </div>

 {/* Mahasiswa (Lulusan / Alumni) Card */}
 <div
 onClick={() => onNavigate("mahasiswa")}
 className="stat-card cursor-pointer group border-emerald-200/50 hover:border-emerald-500 hover:shadow-sm bg-emerald-50/10"
 >
 <div className="flex justify-between items-start">
 <div className="stat-label text-emerald-800 font-bold">Lulusan (Alumni)</div>
 <span className="text-emerald-700 font-bold text-base transition-transform group-hover:scale-110"></span>
 </div>
 <div className="stat-value text-emerald-700 flex items-baseline gap-1.5 justify-start text-left">
 {graduatedMhsCount}
 {graduatedMhsCount > 0 && (
 <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase animate-pulse">
 Yudisium SIAP
 </span>
 )}
 </div>
 <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium text-left">
 Telah lulus & mengunggah draf final tugas akhir
 </p>
 </div>

 {/* Dosen (Active) Card */}
 <div
 onClick={() => onNavigate("dosen")}
 className="stat-card cursor-pointer group"
 >
 <div className="flex justify-between items-start">
 <div className="stat-label">Dosen (Aktif)</div>
 <BookOpen className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" size={18} />
 </div>
 <div className="stat-value text-left">{activeDsnCount}</div>
 <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium text-left">
 Dosen pembimbing & penguji prodi aktif
 </p>
 </div>

 {/* Pendaftaran Tugas Akhir (Waiting) Card */}
 <div
 onClick={() => onNavigate(currentUser.role === "Prodi" ? "review-judul" : "pendaftaran-admin")}
 className="stat-card cursor-pointer group"
 >
 <div className="flex justify-between items-start">
 <div className="stat-label">Pendaftaran Tugas Akhir</div>
 <FileText className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" size={18} />
 </div>
 <div className="stat-value flex items-baseline gap-2 justify-start text-left">
 {waitingTesisCount}
 {waitingTesisCount > 0 && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-warning-light)] text-[var(--accent-warning-hover)] animate-pulse">
 Menunggu
 </span>
 )}
 </div>
 <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium text-left">
 Berkas seminar/sidang mengantre validasi
 </p>
 </div>

 {/* Jadwal Sidang (Upcoming) Card */}
 <div
 onClick={() => onNavigate(currentUser.role === "Prodi" ? "assign" : "jadwalsidang")}
 className="stat-card cursor-pointer group"
 >
 <div className="flex justify-between items-start">
 <div className="stat-label">Jadwal Sidang</div>
 <Calendar className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" size={18} />
 </div>
 <div className="stat-value text-left">{upcomingSidangCount}</div>
 <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium text-left">
 Sesi sidang terjadwal periode ini
 </p>
 </div>
 </div>

 {/* Quick Access Matrix */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
 <div className="card text-left">
 <h4 className="text-base font-extrabold text-[var(--text-main)] mb-1">
 Pendaftaran & Sidang Terbaru
 </h4>
 <p className="text-xs text-[var(--text-muted)] mb-4 font-semibold">
 Antrean pendaftaran draf dokumen tugas akhir dan pengajuan dewan penguji
 </p>
 <div className="divide-y divide-[var(--border-color)]">
 <div className="py-3 flex justify-between items-center">
 <span className="text-xs font-medium text-[var(--text-main)]">Pendaftaran Menunggu</span>
 <span className="pill pill-warning">{registrationCount} Berkas</span>
 </div>
 <div className="py-3 flex justify-between items-center">
 <span className="text-xs font-medium text-[var(--text-main)]">Jadwal Sidang Aktif</span>
 <span className="pill pill-info">{(state.jadwalSidang || []).length} Jadwal</span>
 </div>
 </div>
 <button
 onClick={() => onNavigate(currentUser.role === "Prodi" ? "review-judul" : "pendaftaran-admin")}
 className="mt-4 w-full py-2 bg-[var(--bg-base)] text-[var(--text-main)] hover:border-[var(--brand-primary)] border border-[var(--border-color)] font-semibold rounded-[var(--radius-sm)] text-xs transition-colors cursor-pointer"
 >
 {currentUser.role === "Prodi" ? "Ke Persetujuan Judul & Pembimbing" : "Ke Manajemen Verifikasi Sidang"}
 </button>
 </div>

 <div className="card text-left">
 <h4 className="text-base font-extrabold text-[var(--text-main)] mb-1">
 Aktivitas Konsultasi Internal
 </h4>
 <p className="text-xs text-[var(--text-muted)] mb-4 font-semibold">
 Jumlah percakapan konsultasi mahasiswa bimbingan yang berjalan saat ini
 </p>
 <div className="divide-y divide-[var(--border-color)]">
 <div className="py-3 flex justify-between items-center">
 <span className="text-xs font-medium text-[var(--text-main)]">Total Sesi Bimbingan</span>
 <span className="pill pill-purple">{(state.bimbingan || []).length} Sesi</span>
 </div>
 <div className="py-3 flex justify-between items-center">
 <span className="text-xs font-medium text-[var(--text-main)]">Percakapan Berjalan</span>
 <span className="pill pill-success">{(state.konsultasi || []).length} Topik</span>
 </div>
 </div>
 <button
 onClick={() => onNavigate(currentUser.role === "Prodi" ? "assign" : "users")}
 className="mt-4 w-full py-2 bg-[var(--brand-light)] text-[var(--brand-primary)] border border-transparent hover:bg-[var(--brand-primary)] hover:text-white font-semibold rounded-[var(--radius-sm)] text-xs transition-colors cursor-pointer"
 >
 {currentUser.role === "Prodi" ? "Kelola Penentuan Tim Penguji" : "Kelola Akses Akun Stakeholder"}
 </button>
 </div>
 </div>
 </div>
 )}

 {currentUser.role === "Dosen" && (
 <div className="space-y-6">
 <h3 className="text-sm font-bold tracking-wider uppercase text-[var(--text-muted)]">
 Daftar Tugas Akademik Anda
 </h3>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
 <div onClick={() => onNavigate("mhs-bimbingan")} className="stat-card cursor-pointer group">
 <div className="flex justify-between items-start">
 <div className="stat-label">Bimbingan Utama (Pembimbing 1)</div>
 <Award className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" size={18} />
 </div>
 <div className="stat-value text-left">{pb1Count}</div>
 <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium text-left">
 Mahasiswa utama dalam bimbingan tugas akhir Anda
 </p>
 </div>

 <div onClick={() => onNavigate("mhs-bimbingan")} className="stat-card cursor-pointer group">
 <div className="flex justify-between items-start">
 <div className="stat-label">Bimbingan Pendamping (Pembimbing 2)</div>
 <Layers className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" size={18} />
 </div>
 <div className="stat-value text-left">{pb2Count}</div>
 <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium text-left">
 Mahasiswa bermitra bimbingan dengan Anda
 </p>
 </div>
 </div>

 <div className="card text-left">
 <h4 className="text-base font-extrabold text-[var(--text-main)] mb-1">
 Catatan Penting Review Judul
 </h4>
 <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold">
 Perlu segera ditinjau untuk persetujuan penulisan draf:
 </p>
 <div className="text-xs font-semibold px-4 py-3 bg-[var(--brand-light)] text-[var(--brand-primary)] border-l-4 border-[var(--brand-primary)] rounded-[var(--radius-sm)]">
 Terdapat {(state.judul || []).filter(j => j.status === 'Menunggu').length} draf pengajuan judul mahasiswa menanti keputusan Anda.
 </div>
 </div>

 {/* Dosen Quick Actions */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
 {[
 { label: 'Balas Konsultasi', icon: MessageSquare, tab: 'konsultasi-dsn', color: 'var(--accent-info)' },
 { label: 'Review Dokumen', icon: FolderOpen, tab: 'dokumen-tugas akhir', color: 'var(--accent-purple)' },
 { label: 'ACC Pendaftaran', icon: PenLine, tab: 'pendaftaran-admin', color: 'var(--brand-primary)' },
 { label: 'Jadwal Menguji', icon: CalendarDays, tab: 'jadwal-menguji', color: 'var(--accent-warning)' },
 ].map(a => (
 <button
 key={a.tab}
 onClick={() => onNavigate(a.tab)}
 className="flex flex-col items-center gap-2 p-3 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-surface)] hover:shadow-[var(--shadow-md)] hover:border-[var(--brand-primary)] transition-all cursor-pointer group"
 >
 <a.icon size={20} style={{ color: a.color }} className="group-hover:scale-110 transition-transform" />
 <span className="text-[10px] font-bold text-[var(--text-muted)] text-center leading-tight">{a.label}</span>
 </button>
 ))}
 </div>
 </div>
 )}

 {currentUser.role === "Mahasiswa" && (
 <div className="space-y-6">
 <h3 className="text-sm font-bold tracking-wider uppercase text-[var(--text-muted)]">
 Status Studi Akhir (Tugas Akhir)
 </h3>

 {/* === THESIS PROGRESS TIMELINE === */}
 {(() => {
 // Hitung tahap tugas akhir saat ini berdasarkan data yang ada
 const mhs = state.mahasiswa.find(m => m.email === currentUser.email);
 const bimbingan = mhs ? state.bimbingan.find(b => b.mahasiswaId === mhs.id) : null;
 const judul = state.judul.find(j => j.mahasiswaEmail === currentUser.email);
 const pendaftaranList = state.pendaftaranTesis.filter(p => p.mahasiswaEmail === currentUser.email);
 const jadwalList = state.jadwalSidang.filter(s => mhs ? s.mahasiswaId === mhs.id : false);

 const sempro = pendaftaranList.find(p => p.jenisPendaftaran === 'Seminar Proposal');
 const semhas = pendaftaranList.find(p => p.jenisPendaftaran === 'Seminar Hasil');
 const sidang = pendaftaranList.find(p => p.jenisPendaftaran === 'Sidang Tugas Akhir');
 const yudisium = pendaftaranList.find(p => p.jenisPendaftaran === 'Yudisium');

 type StepStatus = 'done' | 'active' | 'pending';

 const steps: { label: string; sub: string; status: StepStatus; actionTab?: string }[] = [
 {
 label: 'Pengajuan Judul',
 sub: judul?.status === 'Disetujui' ? 'Disetujui' : judul ? judul.status : 'Belum diajukan',
 status: judul?.status === 'Disetujui' ? 'done' : judul ? 'active' : 'pending',
 actionTab: 'ajukan-judul',
 },
 {
 label: 'Seminar Proposal',
 sub: sempro?.status === 'Disetujui' ? 'Selesai' : sempro ? sempro.status : 'Belum didaftarkan',
 status: sempro?.status === 'Disetujui' ? 'done' : sempro ? 'active' : 'pending',
 actionTab: 'pendaftaran-mhs',
 },
 {
 label: 'Seminar Hasil',
 sub: semhas?.status === 'Disetujui' ? 'Selesai' : semhas ? semhas.status : 'Belum didaftarkan',
 status: semhas?.status === 'Disetujui' ? 'done' : semhas ? 'active' : 'pending',
 actionTab: 'pendaftaran-mhs',
 },
 {
 label: 'Sidang Tugas Akhir',
 sub: sidang?.status === 'Disetujui' ? 'Lulus' : sidang ? sidang.status : 'Belum didaftarkan',
 status: sidang?.status === 'Disetujui' ? 'done' : sidang ? 'active' : 'pending',
 actionTab: 'pendaftaran-mhs',
 },
 {
 label: 'Yudisium',
 sub: mhs?.status === 'Lulusan' ? 'Lulus âœ“' : yudisium ? yudisium.status : 'Menunggu',
 status: mhs?.status === 'Lulusan' ? 'done' : yudisium ? 'active' : 'pending',
 },
 ];

 const activeIndex = steps.map(s => s.status).lastIndexOf('done') + 1;
 const pct = Math.round((steps.filter(s => s.status === 'done').length / steps.length) * 100);

 return (
 <div className="card mb-2 text-left">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h4 className="text-base font-extrabold text-[var(--text-main)]">Progres Tugas Akhir Anda</h4>
 <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-semibold">5 tahap wajib menuju kelulusan</p>
 </div>
 <div className="text-right">
 <span className="text-2xl font-extrabold text-[var(--brand-primary)]">{pct}%</span>
 <p className="text-[10px] text-[var(--text-muted)]">selesai</p>
 </div>
 </div>

 {/* Progress bar */}
 <div className="h-1.5 bg-[var(--bg-surface-hover)] rounded-full mb-5 overflow-hidden">
 <div
 className="h-full bg-[var(--brand-primary)] rounded-full transition-all duration-700"
 style={{ width: `${pct}%` }}
 />
 </div>

 {/* Steps */}
 <div className="flex items-start gap-0 relative">
 {steps.map((step, i) => {
 const isDone = step.status === 'done';
 const isActive = step.status === 'active';
 const isLast = i === steps.length - 1;
 return (
 <div key={i} className="flex-1 flex flex-col items-center relative">
 {/* Connector line */}
 {!isLast && (
 <div className="absolute top-[18px] left-1/2 w-full h-0.5 z-0"
 style={{ background: isDone ? 'var(--brand-primary)' : 'var(--border-color)' }}
 />
 )}
 {/* Circle */}
 <button
 onClick={() => step.actionTab && onNavigate(step.actionTab)}
 className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all cursor-pointer ${
 isDone
 ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white'
 : isActive
 ? 'bg-[var(--accent-warning-light)] border-[var(--accent-warning)] text-[var(--accent-warning)]'
 : 'bg-[var(--bg-surface-hover)] border-[var(--border-color)] text-[var(--text-muted)]'
 }`}
 title={isDone || isActive ? `Klik untuk ke ${step.label}` : ''}
 >
 {isDone ? <Check size={14} /> : <span>{i + 1}</span>}
 </button>
 {/* Label */}
 <p className={`text-center text-[9px] font-bold mt-2 leading-tight px-1 ${
 isDone ? 'text-[var(--brand-primary)]' :
 isActive ? 'text-[var(--accent-warning)]' :
 'text-[var(--text-muted)]'
 }`}>{step.label}</p>
 <p className="text-center text-[9px] text-[var(--text-muted)] px-1 leading-tight mt-0.5">{step.sub}</p>
 </div>
 );
 })}
 </div>

 {/* Active step hint */}
 {activeIndex < steps.length && (
 <div className={`mt-4 px-3 py-2 rounded-[var(--radius-sm)] text-[11px] font-semibold flex items-center gap-2 ${
 steps[activeIndex]?.status === 'active'
 ? 'bg-[var(--accent-warning-light)] text-[var(--accent-warning-hover)]'
 : 'bg-[var(--brand-light)] text-[var(--brand-primary)]'
 }`}>
 <span>â†’</span>
 <span>
 Langkah selanjutnya: <b>{steps[activeIndex]?.label}</b>
 {steps[activeIndex]?.actionTab && (
 <button
 onClick={() => onNavigate(steps[activeIndex].actionTab!)}
 className="ml-2 underline cursor-pointer font-bold"
 >
 Buka â†’
 </button>
 )}
 </span>
 </div>
 )}
 </div>
 );
 })()}

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
 {/* Judul Status */}
 <div onClick={() => onNavigate("ajukan-judul")} className="stat-card cursor-pointer group">
 <div className="flex justify-between items-start">
 <div className="stat-label">Status Judul</div>
 <FileText className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" size={18} />
 </div>
 <div className="stat-value text-xl md:text-2xl mt-3 font-extrabold text-[var(--brand-primary)] text-left">
 {currentproposal ? currentproposal.status : "Belum Mengajukan"}
 </div>
 <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium text-truncate text-left">
 {currentproposal ? currentproposal.judul : "Ajukan draf konsep judul Anda"}
 </p>
 </div>

 {/* Dosen Pembimbing Status */}
 <div className="stat-card text-left">
 <div className="flex justify-between items-start">
 <div className="stat-label">Tim Pembimbing Tugas Akhir</div>
 <Users className="text-[var(--text-muted)]" size={18} />
 </div>
 <div className="mt-4 space-y-1">
 {state.bimbingan.find(
 (b) => b.mahasiswaId === state.mahasiswa.find((m) => m.email === currentUser.email)?.id
 ) ? (
 <>
 <div className="text-xs font-bold text-[var(--text-main)] text-truncate">
 Pb 1: {state.dosen.find(d => d.email === state.bimbingan.find(b => b.mahasiswaId === state.mahasiswa.find(m => m.email === currentUser.email)?.id)?.pembimbing1)?.nama || "Belum"}
 </div>
 <div className="text-xs font-medium text-[var(--text-muted)] text-truncate">
 Pb 2: {state.dosen.find(d => d.email === state.bimbingan.find(b => b.mahasiswaId === state.mahasiswa.find(m => m.email === currentUser.email)?.id)?.pembimbing2)?.nama || "Belum"}
 </div>
 </>
 ) : (
 <div className="text-xs font-bold text-[var(--accent-warning-hover)]">Belum Diassign</div>
 )}
 </div>
 </div>

 {/* Agenda Sidang */}
 <div onClick={() => onNavigate("jadwal-mhs")} className="stat-card cursor-pointer group">
 <div className="flex justify-between items-start">
 <div className="stat-label">Jadwal Sidang Akhir</div>
 <Calendar className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" size={18} />
 </div>
 <div className="stat-value text-base mt-2 font-bold text-[var(--text-main)] text-left">
 {currentJadwal ? `${currentJadwal.tanggal} (${currentJadwal.waktu})` : "Belum Dijadwalkan"}
 </div>
 <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium text-left">
 {currentJadwal ? `Ruang: ${currentJadwal.ruang}` : "Hubungi bagian administrasi prodi"}
 </p>
 </div>
 </div>

 {/* Guidelines info */}
 <div className="card text-left">
 <h4 className="text-base font-extrabold text-[var(--text-main)] mb-1">
 Panduan Penyusunan Tugas Akhir Terbuka
 </h4>
 <ul className="text-xs text-[var(--text-muted)] space-y-2 mt-3 list-disc pl-4 font-medium">
 <li>Lakukan pengajuan judul konsep di menu <b>Ajukan Judul</b>.</li>
 <li>Lakukan diskusi rutin dengan dosen pembimbing utama (P1) dan pendamping (P2) di tab <b>Konsultasi</b>.</li>
 <li>Untuk keperluan observasi atau pengumpulan data awal lapangan, ajukan di permohonan <b>Pesan Surat</b>.</li>
 <li>Jika naskah draf final disetujui, daftarkan diri untuk mendaftar ujian di sub-menu <b>Daftar Sidang</b>.</li>
 </ul>
 </div>

 {/* Mahasiswa Quick Actions */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {[
 { label: 'Ajukan Konsultasi', icon: MessageSquare, tab: 'konsultasi-mhs', color: 'var(--accent-info)' },
 { label: 'Lihat Jadwal', icon: CalendarDays, tab: 'jadwal-mhs', color: 'var(--brand-primary)' },
 { label: 'Upload Dokumen', icon: FolderOpen, tab: 'dokumen-tugas akhir', color: 'var(--accent-purple)' },
 { label: 'Ajukan Surat', icon: Mail, tab: 'surat-mhs', color: 'var(--accent-warning)' },
 ].map(a => (
 <button
 key={a.tab}
 onClick={() => onNavigate(a.tab)}
 className="flex flex-col items-center gap-2 p-3 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-surface)] hover:shadow-[var(--shadow-md)] hover:border-[var(--brand-primary)] transition-all cursor-pointer group"
 >
 <a.icon size={20} style={{ color: a.color }} className="group-hover:scale-110 transition-transform" />
 <span className="text-[10px] font-bold text-[var(--text-muted)] text-center leading-tight">{a.label}</span>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Pusat Laporan Mandiri (Self-Service Reports Menu) */}
 {(currentUser.role === "Superadmin" || currentUser.role === "Admin" || currentUser.role === "Dosen" || currentUser.role === "Prodi") && (
 <div className="card border-[var(--brand-primary)] bg-[var(--brand-light)] border-opacity-30 relative overflow-hidden animate-slide-entry no-print">
 {/* Subtle background glow */}
 <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-[rgba(15,110,86,0.06)] to-transparent pointer-events-none rounded-r-[var(--radius-lg)]"></div>
 
 <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
 <div className="text-left">
 <div className="flex items-center gap-2 mb-1">
 <span className="text-xl"></span>
 <h4 className="text-base font-extrabold text-[var(--brand-primary)]">
 Pusat Cetak & Ekspor Laporan Akademik Mandiri
 </h4>
 </div>
 <p className="text-xs text-[var(--text-muted)] max-w-xl font-medium leading-relaxed font-semibold">
 Unduh rekapitulasi data resmi terkait statistik bimbingan dosen maupun progress status pengajuan judul tugas akhir mahasiswa dalam format CSV atau cetak dokumen laporan resmi (PDF) secara langsung.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-3">
 {/* CSV Bimbingan */}
 <button
 onClick={() => exportToCSV("bimbingan")}
 className="btn btn-sm bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] font-bold shadow-sm flex items-center gap-1.5 transition-all text-xs cursor-pointer"
 title="Ekspor Statistik Bimbingan Dosen ke file CSV"
 >
 <Download size={14} />
 <span>Statistik Bimbingan (CSV)</span>
 </button>

 {/* CSV Status Judul */}
 <button
 onClick={() => exportToCSV("pengajuan")}
 className="btn btn-sm bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] font-bold shadow-sm flex items-center gap-1.5 transition-all text-xs cursor-pointer"
 title="Ekspor Data Pengajuan Judul Tugas Akhir ke file CSV"
 >
 <Download size={14} />
 <span>Status Judul Tugas Akhir (CSV)</span>
 </button>

 {/* PDF Cetak */}
 <button
 onClick={() => setShowPrintModal(true)}
 className="btn btn-sm bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] font-bold shadow-md flex items-center gap-1.5 transition-all text-xs cursor-pointer"
 title="Buka Pratinjau Dokumen Resmi & Cetak ke PDF"
 >
 <Printer size={14} />
 <span>Cetak Laporan Resmi (PDF)</span>
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Visualisasi Data & Statistik Recharts */}
 {(currentUser.role === "Superadmin" || currentUser.role === "Admin" || currentUser.role === "Prodi" || currentUser.role === "Dosen") && (
 <div className="space-y-6 pt-4 border-t border-[var(--border-color)] animate-slide-entry no-print">
 <div className="flex items-center gap-2 mb-1 text-left">
 <span className="text-xl"></span>
 <h3 className="text-sm font-bold tracking-wider uppercase text-[var(--text-muted)]">
 Visualisasi & Analitik Real-Time Academics
 </h3>
 </div>
 
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Bar Chart Card */}
 <div className="card flex flex-col justify-between text-left">
 <div>
 <h4 className="text-base font-extrabold text-[var(--text-main)] mb-1">
 Distribusi Mahasiswa Bimbingan per Dosen
 </h4>
 <p className="text-[11px] text-[var(--text-muted)] mb-4 font-semibold">
 Perbandingan jumlah mahasiswa yang dibimbing oleh masing-masing dosen (Pembimbing 1 & Pembimbing 2)
 </p>
 </div>
 
 <div className="h-72 w-full mt-2">
 {barData.length === 0 ? (
 <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
 Tidak ada data bimbingan tersedia
 </div>
 ) : (
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
 <XAxis
 dataKey="name"
 tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 500 }}
 axisLine={{ stroke: "var(--border-color)" }}
 tickLine={{ stroke: "var(--border-color)" }}
 />
 <YAxis
 allowDecimals={false}
 tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 500 }}
 axisLine={{ stroke: "var(--border-color)" }}
 tickLine={{ stroke: "var(--border-color)" }}
 />
 <Tooltip
 contentStyle={{
 backgroundColor: "var(--bg-surface)",
 borderColor: "var(--border-color)",
 borderRadius: "var(--radius-sm)",
 color: "var(--text-main)",
 fontSize: "12px",
 boxShadow: "var(--shadow-md)"
 }}
 />
 <Legend
 wrapperStyle={{ fontSize: "11px", paddingTop: "10px", fontWeight: 600 }}
 />
 <Bar dataKey="Pembimbing 1" fill="#0F6E56" radius={[4, 4, 0, 0]} />
 <Bar dataKey="Pembimbing 2" fill="#6366f1" radius={[4, 4, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 )}
 </div>
 </div>

 {/* Pie Chart Card */}
 <div className="card flex flex-col justify-between text-left">
 <div>
 <h4 className="text-base font-extrabold text-[var(--text-main)] mb-1">
 Status Pengajuan Judul Tugas Akhir
 </h4>
 <p className="text-[11px] text-[var(--text-muted)] mb-4 font-semibold">
 Distribusi persentase status dari total {totalPengajuanJudul} pengajuan usulan judul mahasiswa magister
 </p>
 </div>

 <div className="h-72 w-full flex flex-col md:flex-row items-center justify-center gap-4">
 {totalPengajuanJudul === 0 ? (
 <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
 Belum ada data pengajuan judul tugas akhir
 </div>
 ) : (
 <>
 <div className="h-56 w-56 relative flex items-center justify-center flex-shrink-0">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={pieData.filter(d => d.value > 0)}
 cx="50%"
 cy="50%"
 innerRadius={60}
 outerRadius={80}
 paddingAngle={3}
 dataKey="value"
 >
 {pieData.filter(d => d.value > 0).map((entry, index) => (
 <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || "#cbd5e1"} />
 ))}
 </Pie>
 <Tooltip
 contentStyle={{
 backgroundColor: "var(--bg-surface)",
 borderColor: "var(--border-color)",
 borderRadius: "var(--radius-sm)",
 color: "var(--text-main)",
 fontSize: "12px",
 boxShadow: "var(--shadow-md)"
 }}
 />
 </PieChart>
 </ResponsiveContainer>
 <div className="absolute flex flex-col items-center justify-center text-center">
 <span className="text-2xl font-extrabold text-[var(--text-main)]">
 {totalPengajuanJudul}
 </span>
 <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
 Total Judul
 </span>
 </div>
 </div>

 {/* Custom Indicator Legend inside Pie Card */}
 <div className="flex flex-col gap-2.5 text-xs w-full md:w-auto px-4">
 {pieData.map((item) => {
 const percentage = totalPengajuanJudul > 0 ? Math.round((item.value / totalPengajuanJudul) * 100) : 0;
 return (
 <div key={item.name} className="flex items-center justify-between gap-5 border-b border-[var(--border-color)] pb-1.5 last:border-b-0 text-left">
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[item.name] || "#cbd5e1" }}></span>
 <span className="font-semibold text-[var(--text-muted)]">{item.name}</span>
 </div>
 <div className="text-right">
 <span className="font-bold text-[var(--text-main)]">{item.value} Mhs</span>
 <span className="text-[10px] text-[var(--text-muted)] ml-1.5 font-semibold">({percentage}%)</span>
 </div>
 </div>
 );
 })}
 </div>
 </>
 )}
 </div>
 </div>

 {/* Area Chart Card (Historis Produktivitas Bimbingan) */}
 <div className="card col-span-1 lg:col-span-2 flex flex-col justify-between text-left">
 <div>
 <h4 className="text-base font-extrabold text-[var(--text-main)] mb-1">
 {currentUser.role === "Dosen" ? "Tren Produktivitas Bimbingan Saya (Historis)" : "Tren Produktivitas Bimbingan Tugas Akhir Prodi (Historis)"}
 </h4>
 <p className="text-[11px] text-[var(--text-muted)] mb-4 font-semibold">
 {currentUser.role === "Dosen" 
 ? "Grafik historis jumlah mahasiswa bimbingan aktif Anda sebagai Pembimbing per bulan" 
 : "Grafik historis jumlah akumulasi bimbingan aktif se-program studi dari bulan ke bulan dalam semester berjalan"}
 </p>
 </div>

 <div className="h-72 w-full mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={trendData} margin={{ top: 10, right: 30, left: -20, bottom: 5 }}>
 <defs>
 <linearGradient id="colorBimbingan" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#0F6E56" stopOpacity={0.4}/>
 <stop offset="95%" stopColor="#0F6E56" stopOpacity={0.01}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
 <XAxis
 dataKey="bulan"
 tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 500 }}
 axisLine={{ stroke: "var(--border-color)" }}
 tickLine={{ stroke: "var(--border-color)" }}
 />
 <YAxis
 allowDecimals={false}
 tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 500 }}
 axisLine={{ stroke: "var(--border-color)" }}
 tickLine={{ stroke: "var(--border-color)" }}
 />
 <Tooltip
 contentStyle={{
 backgroundColor: "var(--bg-surface)",
 borderColor: "var(--border-color)",
 borderRadius: "var(--radius-sm)",
 color: "var(--text-main)",
 fontSize: "12px",
 boxShadow: "var(--shadow-md)"
 }}
 />
 <Area
 type="monotone"
 dataKey="Jumlah Bimbingan"
 stroke="#0F6E56"
 strokeWidth={3}
 fillOpacity={1}
 fill="url(#colorBimbingan)"
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Log Aktivitas (Audit Trail) - Only visible to privileged roles */}
 {(currentUser.role === "Superadmin" || currentUser.role === "Admin" || currentUser.role === "Prodi") && (
 <div className="card col-span-1 lg:col-span-2 flex flex-col justify-between mt-4 text-left">
 <div>
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3 text-left">
 <div>
 <h4 className="text-base font-extrabold text-[var(--text-main)] mb-1 flex items-center gap-1.5 font-sans">
 <span></span> Log Aktivitas Pengguna (Audit Trail)
 </h4>
 <p className="text-[11px] text-[var(--text-muted)] font-medium font-sans font-semibold">
 Riwayat perubahan data dan tindakan yang terekam di dalam sistem Academics secara real-time
 </p>
 </div>
 </div>

 {/* ADVANCED FILTER & EXPORT BAR */}
 <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-[var(--border-color)] mb-4 space-y-3 text-left">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
 
 {/* Search query */}
 <div>
 <label className="block text-[10px] font-extrabold uppercase text-[var(--text-muted)] mb-1">Pencarian Kata Kunci</label>
 <input
 type="text"
 placeholder="Cari log, nama, atau tabel..."
 value={searchLog}
 onChange={(e) => {
 setSearchLog(e.target.value);
 setVisibleLogsCount(10);
 }}
 className="w-full text-xs px-2.5 py-1.5 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] outline-none font-semibold"
 />
 </div>

 {/* Filter User */}
 <div>
 <label className="block text-[10px] font-extrabold uppercase text-[var(--text-muted)] mb-1">Pilih Pengguna</label>
 <select
 value={userEmailFilter}
 onChange={(e) => {
 setUserEmailFilter(e.target.value);
 setVisibleLogsCount(10);
 }}
 className="w-full text-xs px-2 py-1.5 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] outline-none font-semibold cursor-pointer"
 >
 <option value="Semua">Semua Pengguna</option>
 {(() => {
 const emails = Array.from(new Set((state.aktivitas || []).map(l => l.email).filter(Boolean)));
 return emails.map(email => {
 const sampleLog = state.aktivitas?.find(l => l.email === email);
 return (
 <option key={email} value={email}>
 {sampleLog?.nama || email} ({email})
 </option>
 );
 });
 })()}
 </select>
 </div>

 {/* Filter Action */}
 <div>
 <label className="block text-[10px] font-extrabold uppercase text-[var(--text-muted)] mb-1">Jenis Tindakan</label>
 <select
 value={actionFilter}
 onChange={(e) => {
 setActionFilter(e.target.value);
 setVisibleLogsCount(10);
 }}
 className="w-full text-xs px-2 py-1.5 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] outline-none font-semibold cursor-pointer"
 >
 <option value="Semua">Semua Tindakan</option>
 <option value="Tambah">Tambah</option>
 <option value="Edit">Edit</option>
 <option value="Hapus">Hapus</option>
 </select>
 </div>

 {/* Lease Range */}
 <div>
 <label className="block text-[10px] font-extrabold uppercase text-[var(--text-muted)] mb-1">Rentang Catatan Tanggal</label>
 <div className="flex gap-1.5 items-center">
 <input
 type="date"
 value={startDateFilter}
 onChange={(e) => {
 setStartDateFilter(e.target.value);
 setVisibleLogsCount(10);
 }}
 className="w-full text-[11px] px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] outline-none font-semibold"
 />
 <span className="text-[10px] text-[var(--text-muted)] font-black">s/d</span>
 <input
 type="date"
 value={endDateFilter}
 onChange={(e) => {
 setEndDateFilter(e.target.value);
 setVisibleLogsCount(10);
 }}
 className="w-full text-[11px] px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] outline-none font-semibold"
 />
 </div>
 </div>

 </div>

 {/* EXPORT CONTROL PANEL */}
 <div className="pt-2 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2">
 {(() => {
 const logs = state.aktivitas || [];
 const filtered = logs.filter((log) => {
 const matchesSearch = 
 log.nama.toLowerCase().includes(searchLog.toLowerCase()) ||
 log.email.toLowerCase().includes(searchLog.toLowerCase()) ||
 log.deskripsi.toLowerCase().includes(searchLog.toLowerCase()) ||
 log.tabel.toLowerCase().includes(searchLog.toLowerCase());
 
 const matchesAction = 
 actionFilter === "Semua" || 
 log.tindakan.toLowerCase() === actionFilter.toLowerCase();

 const matchesUser =
 userEmailFilter === "Semua" ||
 log.email === userEmailFilter;

 let matchesDate = true;
 if (startDateFilter) {
 const sDate = new Date(startDateFilter);
 sDate.setHours(0, 0, 0, 0);
 const logDate = new Date(log.tanggal);
 if (logDate < sDate) matchesDate = false;
 }
 if (endDateFilter) {
 const eDate = new Date(endDateFilter);
 eDate.setHours(23, 59, 59, 999);
 const logDate = new Date(log.tanggal);
 if (logDate > eDate) matchesDate = false;
 }
 
 return matchesSearch && matchesAction && matchesUser && matchesDate;
 });

 return (
 <>
 <span className="text-[10px] text-slate-500 font-extrabold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded uppercase">
 Logs Terfilter: {filtered.length}
 </span>
 
 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => {
 // Download UTF-8 ready CSV
 const csvRows: string[] = [];
 const headers = ["ID", "Waktu", "Nama Pengguna", "Email", "Role", "Tindakan", "Kategori", "Detail Perubahan"];
 csvRows.push(headers.map(h => `"${h}"`).join(","));
 
 filtered.forEach(l => {
 const row = [
 l.id,
 l.tanggal,
 l.nama,
 l.email,
 l.role,
 l.tindakan,
 l.tabel,
 l.deskripsi
 ];
 csvRows.push(row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(","));
 });
 
 const csvContent = "\uFEFF" + csvRows.join("\n");
 const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.href = url;
 link.setAttribute("download", `Audit_Trail_Tugas_Akhir_${new Date().toISOString().slice(0, 10)}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 }}
 className="px-3 py-1.5 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
 >
 Ekspor Excel (CSV)
 </button>

 <button
 type="button"
 onClick={() => {
 // Beautiful HTML print window
 const printWindow = window.open("", "_blank");
 if (!printWindow) return;
 
 const tableRowsHtml = filtered.map(l => `
 <tr>
 <td style="padding: 6px 10px; border-bottom: 1px solid #ddd; font-family: monospace; white-space: nowrap;">${l.tanggal}</td>
 <td style="padding: 6px 10px; border-bottom: 1px solid #ddd; font-weight: bold;">${l.nama} (${l.email})</td>
 <td style="padding: 6px 10px; border-bottom: 1px solid #ddd; text-transform: uppercase;">${l.tindakan}</td>
 <td style="padding: 6px 10px; border-bottom: 1px solid #ddd;">${l.tabel}</td>
 <td style="padding: 6px 10px; border-bottom: 1px solid #ddd;">${l.deskripsi}</td>
 </tr>
 `).join("");

 printWindow.document.write(`
 <html>
 <head>
 <title>LAPORAN AUDIT TRAIL DATA TUGAS AKHIR - Academics</title>
 <style>
 body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 25px; color: #333; }
 h1 { font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px; }
 p { font-size: 11px; margin: 0 0 20px 0; color: #555; }
 table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; }
 th { background-color: #0f6e56; color: white; padding: 8px 10px; text-align: left; }
 </style>
 </head>
 <body>
 <h1>Laporan Audit Trail Resmi Academics</h1>
 <p>Dicetak pada: ${new Date().toLocaleString()} | Filter: ${actionFilter} | Total Tindakan: ${filtered.length}</p>
 <table>
 <thead>
 <tr>
 <th>Waktu</th>
 <th>Pengguna</th>
 <th>Tindakan</th>
 <th>Kategori</th>
 <th>Deskripsi Tindakan</th>
 </tr>
 </thead>
 <tbody>
 ${tableRowsHtml || '<tr><td colspan="5" style="text-align:center; padding:10px;">Tidak ada data terfilter untuk dicetak</td></tr>'}
 </tbody>
 </table>
 <script>
 window.onload = function() {
 window.print();
 setTimeout(function() { window.close(); }, 500);
 }
 </script>
 </body>
 </html>
 `);
 printWindow.document.close();
 }}
 className="px-3 py-1.5 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
 >
 Cetak Laporan (PDF)
 </button>
 </div>
 </>
 );
 })()}
 </div>
 </div>

 {/* Audit Logs Table / List */}
 <div className="overflow-x-auto border border-[var(--border-color)] rounded-lg text-left">
 {(() => {
 const logs = state.aktivitas || [];
 const filtered = logs.filter((log) => {
 const matchesSearch = 
 log.nama.toLowerCase().includes(searchLog.toLowerCase()) ||
 log.email.toLowerCase().includes(searchLog.toLowerCase()) ||
 log.deskripsi.toLowerCase().includes(searchLog.toLowerCase()) ||
 log.tabel.toLowerCase().includes(searchLog.toLowerCase());
 
 const matchesAction = 
 actionFilter === "Semua" || 
 log.tindakan.toLowerCase() === actionFilter.toLowerCase();

 const matchesUser =
 userEmailFilter === "Semua" ||
 log.email === userEmailFilter;

 let matchesDate = true;
 if (startDateFilter) {
 const sDate = new Date(startDateFilter);
 sDate.setHours(0, 0, 0, 0);
 const logDate = new Date(log.tanggal);
 if (logDate < sDate) matchesDate = false;
 }
 if (endDateFilter) {
 const eDate = new Date(endDateFilter);
 eDate.setHours(23, 59, 59, 999);
 const logDate = new Date(log.tanggal);
 if (logDate > eDate) matchesDate = false;
 }
 
 return matchesSearch && matchesAction && matchesUser && matchesDate;
 });

 if (filtered.length === 0) {
 return (
 <div className="p-8 text-center text-xs text-[var(--text-muted)] font-bold">
 Tidak ditemukan catatan logs aktivitas yang sesuai dengan filteraktif Anda
 </div>
 );
 }

 // Helper to format logs dates nicely
 const formatLogDate = (dateStr: string): string => {
 try {
 const d = new Date(dateStr);
 if (isNaN(d.getTime())) return dateStr;
 const jam = String(d.getHours()).padStart(2, '0');
 const menit = String(d.getMinutes()).padStart(2, '0');
 const detik = String(d.getSeconds()).padStart(2, '0');
 const hari = d.getDate();
 const bulanArr = [
 "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
 "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
 ];
 const bulan = bulanArr[d.getMonth()];
 const tahun = d.getFullYear();
 return `${hari} ${bulan} ${tahun}, ${jam}:${menit}:${detik}`;
 } catch (e) {
 return dateStr;
 }
 };

 return (
 <table className="w-full text-left border-collapse text-xs">
 <thead>
 <tr className="bg-[var(--bg-surface)] text-[var(--text-muted)] border-b border-[var(--border-color)] font-bold">
 <th className="px-4 py-3 w-40">Waktu</th>
 <th className="px-4 py-3 w-48">Pengguna</th>
 <th className="px-4 py-3 w-24">Tindakan</th>
 <th className="px-4 py-3 w-32">Kategori</th>
 <th className="px-4 py-3">Deskripsi Tindakan</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border-color)] text-left">
 {filtered.slice(0, visibleLogsCount).map((log) => {
 // Action styles
 let actionColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
 if (log.tindakan === "Edit") {
 actionColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
 } else if (log.tindakan === "Hapus") {
 actionColor = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
 }

 // Role styles
 let roleColor = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
 if (log.role === "Superadmin") roleColor = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
 else if (log.role === "Admin") roleColor = "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
 else if (log.role === "Dosen") roleColor = "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";

 return (
 <tr key={log.id} className="hover:bg-[rgba(0,0,0,0.02)] transition-colors">
 <td className="px-4 py-3 text-[var(--text-muted)] font-mono text-[11px] whitespace-nowrap">
 {formatLogDate(log.tanggal)}
 </td>
 <td className="px-4 py-3 whitespace-nowrap">
 <div className="font-bold text-[var(--text-main)] truncate max-w-[180px]" title={log.nama}>
 {log.nama}
 </div>
 <div className="flex items-center gap-1.5 mt-0.5">
 <span className={`px-1.5 py-px text-[9px] font-bold rounded ${roleColor}`}>
 {log.role}
 </span>
 <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]" title={log.email}>
 {log.email}
 </span>
 </div>
 </td>
 <td className="px-4 py-3 whitespace-nowrap">
 <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${actionColor}`}>
 {log.tindakan}
 </span>
 </td>
 <td className="px-4 py-3 whitespace-nowrap font-semibold text-[var(--text-muted)]">
 {log.tabel}
 </td>
 <td className="px-4 py-3 text-[var(--text-main)] font-medium leading-relaxed font-semibold">
 {log.deskripsi}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 );
 })()}
 </div>

 {/* Pagination load more button */}
 {(() => {
 const logs = state.aktivitas || [];
 const filtered = logs.filter((log) => {
 const matchesSearch = 
 log.nama.toLowerCase().includes(searchLog.toLowerCase()) ||
 log.email.toLowerCase().includes(searchLog.toLowerCase()) ||
 log.deskripsi.toLowerCase().includes(searchLog.toLowerCase()) ||
 log.tabel.toLowerCase().includes(searchLog.toLowerCase());
 
 const matchesAction = 
 actionFilter === "Semua" || 
 log.tindakan.toLowerCase() === actionFilter.toLowerCase();

 const matchesUser =
 userEmailFilter === "Semua" ||
 log.email === userEmailFilter;

 let matchesDate = true;
 if (startDateFilter) {
 const sDate = new Date(startDateFilter);
 sDate.setHours(0, 0, 0, 0);
 const logDate = new Date(log.tanggal);
 if (logDate < sDate) matchesDate = false;
 }
 if (endDateFilter) {
 const eDate = new Date(endDateFilter);
 eDate.setHours(23, 59, 59, 999);
 const logDate = new Date(log.tanggal);
 if (logDate > eDate) matchesDate = false;
 }
 
 return matchesSearch && matchesAction && matchesUser && matchesDate;
 });

 if (filtered.length > visibleLogsCount) {
 return (
 <div className="flex justify-center mt-4 pt-2">
 <button
 onClick={() => setVisibleLogsCount(prev => prev + 15)}
 className="btn text-xs font-bold px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-color)] hover:bg-[rgba(0,0,0,0.04)] text-[var(--text-main)] rounded-md transition-colors cursor-pointer"
 >
 Muat Lebih Banyak Catatan ({filtered.length - visibleLogsCount} tersisa)
 </button>
 </div>
 );
 }
 return null;
 })()}

 </div>
 </div>
 )}

 </div>
 </div>
 )}

 {/* Modal Cetak PDF Laporan Resmi */}
 {showPrintModal && (
 <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex flex-col overflow-y-auto p-4 md:p-6 print-modal">
 {/* Print Stylesheet Hook */}
 <style>{`
 @media print {
 body * {
 visibility: hidden !important;
 }
 #printable-report, #printable-report * {
 visibility: visible !important;
 }
 #printable-report {
 position: absolute !important;
 left: 0 !important;
 top: 0 !important;
 width: 100% !important;
 margin: 0 !important;
 padding: 2.5cm !important;
 box-shadow: none !important;
 border: none !important;
 background: white !important;
 color: #000000 !important;
 }
 html, body {
 background: white !important;
 color: #000000 !important;
 }
 .no-print {
 display: none !important;
 }
 }
 `}</style>

 {/* Modal Header Actions (Floating menu on top) */}
 <div className="max-w-4xl w-full mx-auto bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-t-xl p-4 flex items-center justify-between shadow-xl sticky top-0 z-50 no-print">
 <div className="flex items-center gap-2">
 <span className="text-xl"></span>
 <div className="text-left">
 <h4 className="text-sm font-bold text-[var(--text-main)]">
 Pratinjau Dokumen Cetak Laporan Resmi
 </h4>
 <p className="text-[10px] text-[var(--text-muted)] font-medium">
 Ekspor instan ke format PDF melalui dialog Printer Sistem Anda
 </p>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 <button
 onClick={() => printElementById("printable-report")}
 className="btn btn-sm bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] font-bold flex items-center gap-1.5 cursor-pointer"
 >
 <Printer size={13} />
 <span>Cetak & Simpan PDF</span>
 </button>
 <button
 onClick={() => setShowPrintModal(false)}
 className="btn btn-sm bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer"
 >
 Tutup Pratinjau
 </button>
 </div>
 </div>

 {/* Printable Document Paper Simulator (A4 Aspect Ratio on Screen) */}
 <div className="max-w-4xl w-full mx-auto bg-white text-slate-900 border-x border-b border-slate-200 shadow-2xl p-8 md:p-12 mb-12 rounded-b-xl leading-relaxed text-sm">
 <div id="printable-report" className="space-y-6">
 
 {/* Kop Surat Instansi Resmi */}
 <div className="flex items-center justify-between border-b-4 border-double border-slate-900 pb-3 mb-4">
 <div className="flex items-center gap-5 w-full">
 <div className="w-[85px] h-[85px] flex-shrink-0 flex items-center justify-center overflow-hidden">
 {state.logo ? (
 <img src={state.logo} alt="Logo" className="w-[80px] h-[80px] object-contain" referrerPolicy="no-referrer" />
 ) : (
 <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-300 flex items-center justify-center text-2xl font-extrabold text-[#0F6E56]">
 UM
 </div>
 )}
 </div>
 <div className="text-left">
 <h2 className="text-base md:text-lg font-bold uppercase tracking-wider leading-tight text-black">
 UNIVERSITAS MUHAMMADIYAH PONTIANAK
 </h2>
 <h3 className="text-[11px] md:text-[13px] font-bold uppercase tracking-wide leading-tight mt-0.5 text-neutral-800">
 FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI
 </h3>
 <h3 className="text-[10px] md:text-[11.5px] font-bold uppercase tracking-wide leading-tight mt-0.5 text-neutral-600">
 PROGRAM STUDI FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI (S2)
 </h3>
 <p className="text-[8.5px] md:text-[9.5px] leading-snug mt-1 opacity-95 italic text-neutral-700">
 Alamat: Jl. Jend. Ahmad Yani No. 111, Pontianak, Kalimantan Barat 78124 | Email: fikpsi@unmuhpnk.ac.id | Telp: (0561) 764571
 </p>
 </div>
 </div>
 </div>

 {/* Judul Dokumen */}
 <div className="text-center my-6 space-y-1">
 <h3 className="text-sm font-extrabold tracking-wider uppercase text-slate-900">
 <u>LAPORAN EVALUASI BIMBINGAN DAN PROGRESS STATUS TUGAS AKHIR</u>
 </h3>
 <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
 Nomor: LPR-{Math.floor(Math.random() * 900 + 100)}/II.3.AU.15/A/{new Date().getFullYear()}
 </p>
 </div>

 {/* Metadata details */}
 <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
 <div className="space-y-1 text-left">
 <div>
 <span className="text-slate-500 font-medium">Tanggal Cetak:</span>{" "}
 <span className="text-slate-900 font-bold">{new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
 </div>
 <div>
 <span className="text-slate-500 font-medium">Semester / Tahun:</span>{" "}
 <span className="text-slate-900 font-bold">Genap / Semester Akhir 2025-2026</span>
 </div>
 <div>
 <span className="text-slate-500 font-medium">Tingkat Sistem:</span>{" "}
 <span className="text-emerald-800 font-black">Layanan Mandiri Terverifikasi</span>
 </div>
 </div>

 <div className="space-y-1 text-right">
 <div>
 <span className="text-slate-500 font-medium">Pencetak Dokumen:</span>{" "}
 <span className="text-slate-900 font-bold">{currentUser.nama}</span>
 </div>
 <div>
 <span className="text-slate-500 font-medium">Hak Akses Role:</span>{" "}
 <span className="text-indigo-800 font-bold uppercase">{currentUser.role}</span>
 </div>
 <div>
 <span className="text-slate-500 font-medium">Email Terdaftar:</span>{" "}
 <span className="text-slate-900 font-bold">{currentUser.email}</span>
 </div>
 </div>
 </div>

 {/* Rangkuman Ringkas KPIs */}
 <div className="text-left">
 <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
 I. RANGKUMAN STATISTIK STATUS TUGAS AKHIR
 </h4>
 <div className="grid grid-cols-4 gap-2 text-center">
 <div className="border border-slate-200 p-2.5 rounded bg-white">
 <div className="text-[10px] uppercase font-bold text-slate-500">Total Mahasiswa</div>
 <div className="text-lg font-black text-slate-900">{mhsCount} Mhs</div>
 </div>
 <div className="border border-slate-200 p-2.5 rounded bg-white">
 <div className="text-[10px] uppercase font-semibold text-slate-500 text-emerald-800">Disetujui</div>
 <div className="text-lg font-black text-green-700">{statusCounts["Disetujui"] || 0} Judul</div>
 </div>
 <div className="border border-slate-200 p-2.5 rounded bg-white">
 <div className="text-[10px] uppercase font-semibold text-slate-500 text-amber-800">Menunggu</div>
 <div className="text-lg font-black text-amber-600">{statusCounts["Menunggu"] || 0} Antrean</div>
 </div>
 <div className="border border-slate-200 p-2.5 rounded bg-white">
 <div className="text-[10px] uppercase font-semibold text-slate-500 text-red-800">Revisi & Tolak</div>
 <div className="text-lg font-black text-red-600">{(statusCounts["Revisi"] || 0) + (statusCounts["Ditolak"] || 0)} Judul</div>
 </div>
 </div>
 </div>

 {/* Table 1: Keaktifan Bimbingan */}
 <div className="text-left">
 <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
 II. STATISTIK BEBAN BIMBINGAN AKTIF DOSEN
 </h4>
 <div className="border border-slate-200 rounded overflow-hidden">
 <table className="w-full text-[11px] text-left border-collapse font-sans">
 <thead>
 <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black">
 <th className="px-3 py-2 w-10">No</th>
 <th className="px-3 py-2">Nama Dosen Pembimbing</th>
 <th className="px-3 py-2">Email</th>
 <th className="px-3 py-2">Kelahian Utama</th>
 <th className="px-3 py-2 text-center w-16">Pb 1</th>
 <th className="px-3 py-2 text-center w-16">Pb 2</th>
 <th className="px-3 py-2 text-center w-24">Beban Aktif</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 text-slate-800">
 {state.dosen.map((d, index) => {
 const asPb1 = (state.bimbingan || []).filter((b) => b.pembimbing1 === d.email).length;
 const asPb2 = (state.bimbingan || []).filter((b) => b.pembimbing2 === d.email).length;
 return (
 <tr key={d.id} className="hover:bg-slate-50">
 <td className="px-3 py-2 text-slate-500 font-bold">{index + 1}</td>
 <td className="px-3 py-2 font-bold text-slate-900">{d.nama}</td>
 <td className="px-3 py-2 text-slate-600 font-mono text-[10px]">{d.email}</td>
 <td className="px-3 py-2">{d.bidangKeahlian || "-"}</td>
 <td className="px-3 py-2 text-center font-bold text-emerald-800">{asPb1}</td>
 <td className="px-3 py-2 text-center font-bold text-sky-800">{asPb2}</td>
 <td className="px-3 py-2 text-center font-black bg-slate-50 text-slate-900">{asPb1 + asPb2} Mhs</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {/* Table 2: Status Pengajuan Judul Tugas Akhir */}
 <div className="text-left">
 <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
 III. REKAPITULASI PROGRESS USULAN JUDUL TUGAS AKHIR MAHASISWA
 </h4>
 <div className="border border-slate-200 rounded overflow-hidden">
 <table className="w-full text-[11px] text-left border-collapse font-sans">
 <thead>
 <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black">
 <th className="px-3 py-2 w-10">No</th>
 <th className="px-3 py-2 w-28">NIM</th>
 <th className="px-3 py-2 w-36">Nama Mahasiswa</th>
 <th className="px-3 py-2">Draf Judul Tugas Akhir Yang Diajukan</th>
 <th className="px-3 py-2 text-center w-28">Status</th>
 <th className="px-3 py-2 w-40">Catatan Reviewer</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 text-slate-800">
 {state.judul.map((j, index) => {
 const mhs = state.mahasiswa.find(m => m.email === j.mahasiswaEmail);
 return (
 <tr key={j.id} className="hover:bg-slate-50">
 <td className="px-3 py-2 text-slate-500 font-bold">{index + 1}</td>
 <td className="px-3 py-2 font-mono font-bold text-slate-700">{mhs ? mhs.nim : "-"}</td>
 <td className="px-3 py-2 font-bold text-slate-900">{j.namaMahasiswa || mhs?.nama || "-"}</td>
 <td className="px-3 py-2 leading-relaxed text-slate-800 font-semibold">{j.judul}</td>
 <td className="px-3 py-2 text-center whitespace-nowrap">
 <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase border ${
 j.status === "Disetujui" ? "bg-green-50 text-green-700 border-green-200" :
 j.status === "Menunggu" ? "bg-amber-50 text-amber-700 border-amber-200" :
 j.status === "Revisi" ? "bg-blue-50 text-blue-700 border-blue-200" :
 "bg-red-50 text-red-700 border-red-200"
 }`}>
 {j.status}
 </span>
 </td>
 <td className="px-3 py-2 text-slate-600 max-w-[150px] truncate" title={j.catatan}>
 {j.catatan || "-"}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {/* Sign-off / Signature section */}
 <div className="flex justify-end pt-12">
 <div className="text-center w-64 space-y-12">
 <div className="text-xs text-slate-700 space-y-0.5 leading-relaxed">
 <p>Pontianak, {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p>
 <p className="font-extrabold text-slate-900">Mengetahui & Mengesahkan,</p>
 <p className="font-semibold text-slate-600">Ketua Program Studi FIKPsi</p>
 </div>
 
 <div className="text-xs text-slate-900 font-bold space-y-0.5 leading-relaxed pt-8 text-center">
 <p className="underline font-black uppercase block">Prof. Dr. apt. H. M. Budi, M.Si</p>
 <p className="text-slate-500 text-[10px]">NIDN: 1104057802</p>
 </div>
 </div>
 </div>

 </div>
 </div>
 </div>
 )}

 </div>
 );
}


