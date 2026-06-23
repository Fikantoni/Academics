import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Calendar, Clock, MapPin, Sparkles, HelpCircle, UserCheck } from "lucide-react";
import { AppState, Dosen, Pengguna } from "../types";
import { createGoogleCalendarEvent } from "../lib/googleCalendar";

interface ScheduleFormProps {
 state: AppState;
 currentUser: Pengguna | null;
 isAdminMode: boolean;
 googleToken?: string | null;
 onConnectGoogle?: () => void;
 initialValues?: {
 jenisUjian?: string;
 mahasiswaId?: string;
 tanggal?: string;
 waktu?: string;
 ruang?: string;
 penguji1?: string;
 penguji2?: string;
 catatan?: string;
 isExternalPenguji1?: boolean;
 externalPenguji1Name?: string;
 externalPenguji1Instansi?: string;
 isExternalPenguji2?: boolean;
 externalPenguji2Name?: string;
 externalPenguji2Instansi?: string;
 };
 onSubmit: (values: {
 jenisUjian: string;
 mahasiswaId: string;
 tanggal: string;
 waktu: string;
 ruang: string;
 penguji1: string;
 penguji2: string;
 catatan: string;
 meetLink?: string;
 calendarEventId?: string;
 isExternalPenguji1?: boolean;
 externalPenguji1Name?: string;
 externalPenguji1Instansi?: string;
 isExternalPenguji2?: boolean;
 externalPenguji2Name?: string;
 externalPenguji2Instansi?: string;
 }) => void;
 onClose: () => void;
}

export function ScheduleForm({
 state,
 currentUser,
 isAdminMode,
 googleToken,
 onConnectGoogle,
 initialValues,
 onSubmit,
 onClose,
}: ScheduleFormProps) {
 // Current student id
 const defaultStudentId = isAdminMode
 ? (state.mahasiswa[0]?.id || "")
 : (state.mahasiswa.find((m) => m.email === currentUser?.email)?.id || "");

 const studentNIM = state.mahasiswa.find((m) => m.email === currentUser?.email)?.nim || "S2";

 // Form states
 const [jenisUjian, setJenisUjian] = useState(initialValues?.jenisUjian || "Seminar Proposal");
 const [mahasiswaId, setMahasiswaId] = useState(initialValues?.mahasiswaId || defaultStudentId);
 const [tanggal, setTanggal] = useState(initialValues?.tanggal || "");
 const [waktu, setWaktu] = useState(initialValues?.waktu || "");
 const [ruang, setRuang] = useState(initialValues?.ruang || "Ruang Sidang S2 Pascasarjana");
 const [penguji1, setPenguji1] = useState(initialValues?.penguji1 || "");
 const [penguji2, setPenguji2] = useState(initialValues?.penguji2 || "");
 const [catatan, setCatatan] = useState(initialValues?.catatan || "");

 // External examiners states
 const [isExternalPenguji1, setIsExternalPenguji1] = useState(initialValues?.isExternalPenguji1 || false);
 const [externalPenguji1Name, setExternalPenguji1Name] = useState(initialValues?.externalPenguji1Name || "");
 const [externalPenguji1Instansi, setExternalPenguji1Instansi] = useState(initialValues?.externalPenguji1Instansi || "");

 const [isExternalPenguji2, setIsExternalPenguji2] = useState(initialValues?.isExternalPenguji2 || false);
 const [externalPenguji2Name, setExternalPenguji2Name] = useState(initialValues?.externalPenguji2Name || "");
 const [externalPenguji2Instansi, setExternalPenguji2Instansi] = useState(initialValues?.externalPenguji2Instansi || "");

 // Google Meet scheduling options
 const [createGoogleMeet, setCreateGoogleMeet] = useState(false);
 const [isGeneratingMeet, setIsGeneratingMeet] = useState(false);

 // Conflict state
 const [conflictReport, setConflictReport] = useState<{
 hasConflict: boolean;
 reasons: string[];
 roomConflict: boolean;
 p1Conflict: boolean;
 p2Conflict: boolean;
 mhsConflict: boolean;
 }>({
 hasConflict: false,
 reasons: [],
 roomConflict: false,
 p1Conflict: false,
 p2Conflict: false,
 mhsConflict: false,
 });

 const [recommendations, setRecommendations] = useState<{
 date: string;
 time: string;
 room: string;
 label: string;
 }[]>([]);

 // Helpers
 const parseTimeToMinutes = (tStr: string): number => {
 if (!tStr) return 0;
 const parts = tStr.split(":");
 if (parts.length < 2) return 0;
 const h = parseInt(parts[0], 10) || 0;
 const m = parseInt(parts[1], 10) || 0;
 return h * 60 + m;
 };

 const timesOverlap = (t1: string, t2: string): boolean => {
 const m1 = parseTimeToMinutes(t1);
 const m2 = parseTimeToMinutes(t2);
 // overlap if within 90 minutes (1.5 hours)
 return Math.abs(m1 - m2) < 90;
 };

 const getDosenNameByEmail = (email: string) => {
 return state.dosen.find((d) => d.email === email)?.nama || email;
 };

 const getMhsNameById = (id: string) => {
 return state.mahasiswa.find((m) => m.id === id)?.nama || "Mahasiswa";
 };

 // Run audit when inputs change
 useEffect(() => {
 if (!tanggal || !waktu) {
 setConflictReport({
 hasConflict: false,
 reasons: [],
 roomConflict: false,
 p1Conflict: false,
 p2Conflict: false,
 mhsConflict: false,
 });
 return;
 }

 const recsList: string[] = [];
 const schedules = state.jadwalSidang || [];

 // 1. Room conflict check
 const rConflictMatch = schedules.find(
 (s) =>
 s.tanggal === tanggal &&
 s.ruang.toLowerCase().trim() === ruang.toLowerCase().trim() &&
 timesOverlap(s.waktu, waktu)
 );
 if (rConflictMatch) {
 recsList.push(
 `?? Ruang "${ruang}" bentrok pada jam ${rConflictMatch.waktu} dengan agenda ${rConflictMatch.namaMahasiswa} (${rConflictMatch.jenisUjian || "Ujian"})`
 );
 }

 // 2. Penguji 1 conflict check
 const p1ConflictMatch = penguji1 && !isExternalPenguji1
 ? schedules.find(
 (s) =>
 s.tanggal === tanggal &&
 (s.penguji1 === penguji1 || s.penguji2 === penguji1) &&
 timesOverlap(s.waktu, waktu)
 )
 : null;
 if (p1ConflictMatch) {
 recsList.push(
 `?? Penguji 1 (${getDosenNameByEmail(penguji1)}) memiliki agenda lain pada jam ${p1ConflictMatch.waktu}: ${p1ConflictMatch.jenisUjian || "Ujian"} (${p1ConflictMatch.namaMahasiswa})`
 );
 }

 // 3. Penguji 2 conflict check
 const p2ConflictMatch = penguji2 && !isExternalPenguji2
 ? schedules.find(
 (s) =>
 s.tanggal === tanggal &&
 (s.penguji1 === penguji2 || s.penguji2 === penguji2) &&
 timesOverlap(s.waktu, waktu)
 )
 : null;
 if (p2ConflictMatch) {
 recsList.push(
 `?? Penguji 2 (${getDosenNameByEmail(penguji2)}) memiliki agenda lain pada jam ${p2ConflictMatch.waktu}: ${p2ConflictMatch.jenisUjian || "Ujian"} (${p2ConflictMatch.namaMahasiswa})`
 );
 }

 // 4. Student conflict check
 const mConflictMatch = mahasiswaId
 ? schedules.find(
 (s) =>
 s.tanggal === tanggal &&
 s.mahasiswaId === mahasiswaId &&
 timesOverlap(s.waktu, waktu)
 )
 : null;
 if (mConflictMatch) {
 recsList.push(
 `?? Anda/Mahasiswa ini sudah terdaftar ujian ${mConflictMatch.jenisUjian || "Seminar"} di ruang ${mConflictMatch.ruang} jam ${mConflictMatch.waktu}`
 );
 }

 setConflictReport({
 hasConflict: recsList.length > 0,
 reasons: recsList,
 roomConflict: !!rConflictMatch,
 p1Conflict: !!p1ConflictMatch,
 p2Conflict: !!p2ConflictMatch,
 mhsConflict: !!mConflictMatch,
 });
 }, [tanggal, waktu, ruang, penguji1, penguji2, mahasiswaId, state.jadwalSidang, isExternalPenguji1, isExternalPenguji2, externalPenguji1Name, externalPenguji2Name]);

 // Generate dynamic recommendations
 useEffect(() => {
 const recs: { date: string; time: string; room: string; label: string }[] = [];
 const schedules = state.jadwalSidang || [];
 const baseDate = tanggal ? new Date(tanggal) : new Date();
 
 if (isNaN(baseDate.getTime())) return;

 const timeSlots = ["08:30", "10:30", "13:30", "15:30"];
 const roomOptions = [
 ruang || "Ruang Sidang S2 Pascasarjana",
 "Ruang Rapat Magister S2",
 "Ruang Teleconference S2",
 "Ruang Kelas Utama S2",
 ];

 const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
 const monthNames = [
 "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
 "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
 ];

 // Scan up to 7 future days
 for (let i = 0; i < 7; i++) {
 const checkDate = new Date(baseDate);
 checkDate.setDate(baseDate.getDate() + i);

 const dayOfWeek = checkDate.getDay();
 if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekend

 const yyyy = checkDate.getFullYear();
 const mm = String(checkDate.getMonth() + 1).padStart(2, '0');
 const dd = String(checkDate.getDate()).padStart(2, '0');
 const dateQuery = `${yyyy}-${mm}-${dd}`;

 const readableDate = `${dayNames[dayOfWeek]}, ${checkDate.getDate()} ${monthNames[checkDate.getMonth()]}`;

 for (const time of timeSlots) {
 for (const roomOpt of roomOptions) {
 // Check room conflict
 const roomConf = schedules.some(
 (s) =>
 s.tanggal === dateQuery &&
 s.ruang.toLowerCase().trim() === roomOpt.toLowerCase().trim() &&
 timesOverlap(s.waktu, time)
 );

 // Check penguji 1 conflict
 const p1Conf = penguji1 && !isExternalPenguji1
 ? schedules.some(
 (s) =>
 s.tanggal === dateQuery &&
 (s.penguji1 === penguji1 || s.penguji2 === penguji1) &&
 timesOverlap(s.waktu, time)
 )
 : false;

 // Check penguji 2 conflict
 const p2Conf = penguji2 && !isExternalPenguji2
 ? schedules.some(
 (s) =>
 s.tanggal === dateQuery &&
 (s.penguji1 === penguji2 || s.penguji2 === penguji2) &&
 timesOverlap(s.waktu, time)
 )
 : false;

 // Check student conflict
 const mhsConf = mahasiswaId
 ? schedules.some(
 (s) =>
 s.tanggal === dateQuery &&
 s.mahasiswaId === mahasiswaId &&
 timesOverlap(s.waktu, time)
 )
 : false;

 if (!roomConf && !p1Conf && !p2Conf && !mhsConf) {
 recs.push({
 date: dateQuery,
 time: time,
 room: roomOpt,
 label: `${readableDate} | Pkl ${time} | ${roomOpt}`,
 });
 if (recs.length >= 3) {
 setRecommendations(recs);
 return;
 }
 }
 }
 }
 }
 setRecommendations(recs);
 }, [tanggal, ruang, penguji1, penguji2, mahasiswaId, state.jadwalSidang, isExternalPenguji1, isExternalPenguji2, externalPenguji1Name, externalPenguji2Name]);

 const applyRecommendation = (rec: { date: string; time: string; room: string }) => {
 setTanggal(rec.date);
 setWaktu(rec.time);
 setRuang(rec.room);
 };

 const handleFormSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const effectiveP1 = isExternalPenguji1 ? externalPenguji1Name : penguji1;
 const effectiveP2 = isExternalPenguji2 ? externalPenguji2Name : penguji2;

 if (!tanggal || !waktu || !ruang || !effectiveP1 || !effectiveP2) {
 alert("Harap lengkapi semua isian formulir jadwal!");
 return;
 }

 let generatedMeetLink = "";
 let generatedEventId = "";

 if (createGoogleMeet) {
 if (!googleToken) {
 alert("Silakan hubungkan akun Google di bar atas.");
 if (onConnectGoogle) onConnectGoogle();
 return;
 }

 setIsGeneratingMeet(true);
 try {
 const studentInfo = state.mahasiswa.find((m) => m.id === mahasiswaId);
 const attendees = [
 studentInfo?.email || "",
 effectiveP1,
 effectiveP2
 ].filter((em) => em && em.includes("@"));

 const eventRes = await createGoogleCalendarEvent(googleToken, {
 summary: `${jenisUjian}: ${studentInfo?.nama || "Mahasiswa"}`,
 description: `Agenda Ujian / Seminar Akademik resmi Academics Pascasarjana UM Pontianak.\nJenis Ujian: ${jenisUjian}\nMahasiswa: ${studentInfo?.nama} (${studentInfo?.nim})\nPenguji 1: ${isExternalPenguji1 ? `${externalPenguji1Name} (Luar - ${externalPenguji1Instansi || ''})` : getDosenNameByEmail(penguji1)}\nPenguji 2: ${isExternalPenguji2 ? `${externalPenguji2Name} (Luar - ${externalPenguji2Instansi || ''})` : getDosenNameByEmail(penguji2)}\nCatatan tambahan: ${catatan}`,
 tanggal: tanggal,
 waktu: waktu,
 ruangan: ruang,
 attendees: attendees
 });

 if (eventRes.meetLink) {
 generatedMeetLink = eventRes.meetLink;
 generatedEventId = eventRes.id;
 }
 } catch (err: any) {
 console.error(err);
 alert(`Gagal membuat link Google Calendar Meet: ${err.message || err}. Melanjutkan pendaftaran tanpa link.`);
 } finally {
 setIsGeneratingMeet(false);
 }
 }

 onSubmit({
 jenisUjian,
 mahasiswaId,
 tanggal,
 waktu,
 ruang,
 penguji1: effectiveP1,
 penguji2: effectiveP2,
 catatan,
 meetLink: generatedMeetLink || undefined,
 calendarEventId: generatedEventId || undefined,
 isExternalPenguji1,
 externalPenguji1Name,
 externalPenguji1Instansi,
 isExternalPenguji2,
 externalPenguji2Name,
 externalPenguji2Instansi
 });
 };

 return (
 <form onSubmit={handleFormSubmit} className="space-y-4">
 {/* 1. JADWAL DETAIL */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Jenis Kegiatan Akademik</label>
 <select
 value={jenisUjian}
 onChange={(e) => setJenisUjian(e.target.value)}
 required
 className="form-input text-xs font-semibold"
 >
 <option value="Seminar Proposal">Seminar Proposal</option>
 <option value="Seminar Hasil">Seminar Hasil</option>
 <option value="Sidang Tugas Akhir">Sidang Tugas Akhir</option>
 </select>
 </div>

 {isAdminMode ? (
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Mahasiswa Peserta</label>
 <select
 value={mahasiswaId}
 onChange={(e) => setMahasiswaId(e.target.value)}
 required
 className="form-input text-xs font-semibold"
 >
 {state.mahasiswa.map((m) => (
 <option key={m.id} value={m.id}>
 {m.nama} ({m.nim || "NIM Tidak Ada"})
 </option>
 ))}
 </select>
 </div>
 ) : (
 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Nama Mahasiswa (Pengusul)</label>
 <input
 type="text"
 disabled
 value={`${currentUser?.nama} (${studentNIM})`}
 className="form-input text-xs font-semibold bg-[var(--bg-surface-hover)] cursor-not-allowed"
 />
 </div>
 )}
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="form-group relative">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
 <Calendar size={12} /> Tanggal Pelaksanaan
 </label>
 <input
 type="date"
 value={tanggal}
 onChange={(e) => setTanggal(e.target.value)}
 required
 className={`form-input text-xs font-semibold ${
 conflictReport.hasConflict && (conflictReport.p1Conflict || conflictReport.p2Conflict || conflictReport.roomConflict || conflictReport.mhsConflict)
 ? "border-rose-300 focus:border-rose-500"
 : "border-emerald-200"
 }`}
 />
 </div>

 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
 <Clock size={12} /> Jam Mulai (WIB)
 </label>
 <input
 type="time"
 value={waktu}
 onChange={(e) => setWaktu(e.target.value)}
 required
 className="form-input text-xs font-semibold"
 placeholder="09:00"
 />
 </div>

 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
 <MapPin size={12} /> Pilihan Ruangan
 </label>
 <input
 type="text"
 value={ruang}
 onChange={(e) => setRuang(e.target.value)}
 required
 className={`form-input text-xs font-semibold ${conflictReport.roomConflict ? "border-rose-400 bg-rose-50/10" : ""}`}
 placeholder="Ruang Rapat Pascasarjana"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* PENGUJI 1 SECTION */}
 <div className="p-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-surface-hover)] space-y-3">
 <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
 <label className="block text-xs font-extrabold text-[var(--brand-primary)] uppercase tracking-wider">
 Dosen Penguji Utama (1)
 </label>
 <div className="flex items-center gap-1.5">
 <input
 type="checkbox"
 id="checkbox-external-p1"
 checked={isExternalPenguji1}
 onChange={(e) => {
 setIsExternalPenguji1(e.target.checked);
 if (e.target.checked) setPenguji1(""); // clear internal selector
 }}
 className="w-3.5 h-3.5 text-xs rounded border-[var(--border-color)] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
 />
 <label htmlFor="checkbox-external-p1" className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 cursor-pointer select-none">
 Penguji Luar Prodi
 </label>
 </div>
 </div>

 {!isExternalPenguji1 ? (
 <div className="form-group">
 <select
 value={penguji1}
 onChange={(e) => setPenguji1(e.target.value)}
 required={!isExternalPenguji1}
 className={`form-input text-xs font-semibold ${conflictReport.p1Conflict ? "border-rose-400 bg-rose-50/10" : ""}`}
 >
 <option value="">-- Pilih Penguji 1 --</option>
 {state.dosen.map((d) => (
 <option key={d.id} value={d.email}>
 {d.nama}
 </option>
 ))}
 </select>
 </div>
 ) : (
 <div className="space-y-2.5 animate-fadeIn">
 <div>
 <label className="text-[9px] font-bold uppercase block text-[var(--text-muted)] mb-0.5">Nama Lengkap &amp; Gelar</label>
 <input
 type="text"
 value={externalPenguji1Name}
 onChange={(e) => setExternalPenguji1Name(e.target.value)}
 required={isExternalPenguji1}
 className="form-input text-xs py-1.5 font-semibold placeholder:opacity-50"
 placeholder="Contoh: Dr. Herman, M.Kes"
 />
 </div>
 <div>
 <label className="text-[9px] font-bold uppercase block text-[var(--text-muted)] mb-0.5">Asal Instansi / Afiliasi</label>
 <input
 type="text"
 value={externalPenguji1Instansi}
 onChange={(e) => setExternalPenguji1Instansi(e.target.value)}
 className="form-input text-xs py-1.5 font-semibold placeholder:opacity-50"
 placeholder="Contoh: Universitas Gadjah Mada"
 />
 </div>
 </div>
 )}
 </div>

 {/* PENGUJI 2 SECTION */}
 <div className="p-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-surface-hover)] space-y-3">
 <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
 <label className="block text-xs font-extrabold text-[var(--brand-primary)] uppercase tracking-wider">
 Dosen Penguji Pendamping (2)
 </label>
 <div className="flex items-center gap-1.5">
 <input
 type="checkbox"
 id="checkbox-external-p2"
 checked={isExternalPenguji2}
 onChange={(e) => {
 setIsExternalPenguji2(e.target.checked);
 if (e.target.checked) setPenguji2(""); // clear internal selector
 }}
 className="w-3.5 h-3.5 text-xs rounded border-[var(--border-color)] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
 />
 <label htmlFor="checkbox-external-p2" className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 cursor-pointer select-none">
 Penguji Luar Prodi
 </label>
 </div>
 </div>

 {!isExternalPenguji2 ? (
 <div className="form-group">
 <select
 value={penguji2}
 onChange={(e) => setPenguji2(e.target.value)}
 required={!isExternalPenguji2}
 className={`form-input text-xs font-semibold ${conflictReport.p2Conflict ? "border-rose-400 bg-rose-50/10" : ""}`}
 >
 <option value="">-- Pilih Penguji 2 --</option>
 {state.dosen.map((d) => (
 <option key={d.id} value={d.email}>
 {d.nama}
 </option>
 ))}
 </select>
 </div>
 ) : (
 <div className="space-y-2.5 animate-fadeIn">
 <div>
 <label className="text-[9px] font-bold uppercase block text-[var(--text-muted)] mb-0.5">Nama Lengkap &amp; Gelar</label>
 <input
 type="text"
 value={externalPenguji2Name}
 onChange={(e) => setExternalPenguji2Name(e.target.value)}
 required={isExternalPenguji2}
 className="form-input text-xs py-1.5 font-semibold placeholder:opacity-50"
 placeholder="Contoh: Prof. Dr. Andi, S.KM., M.Kes"
 />
 </div>
 <div>
 <label className="text-[9px] font-bold uppercase block text-[var(--text-muted)] mb-0.5">Asal Instansi / Afiliasi</label>
 <input
 type="text"
 value={externalPenguji2Instansi}
 onChange={(e) => setExternalPenguji2Instansi(e.target.value)}
 className="form-input text-xs py-1.5 font-semibold placeholder:opacity-50"
 placeholder="Contoh: Universitas Indonesia"
 />
 </div>
 </div>
 )}
 </div>
 </div>

 <div className="form-group">
 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Catatan Tambahan / Alasan Khusus (Opsional)</label>
 <textarea
 value={catatan}
 onChange={(e) => setCatatan(e.target.value)}
 rows={2}
 placeholder="Tuliskan keterangan pendukung atau detail alasan lainnya jika ada..."
 className="form-input text-xs font-semibold"
 />
 </div>

 {/* 2. REALTIME CONFLICT DETECTION WARNING PANEL */}
 {conflictReport.hasConflict && (
 <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900/40 rounded-xl space-y-2">
 <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-extrabold text-[11px] uppercase tracking-wider">
 <AlertTriangle size={15} className="animate-bounce" />
 ?? Temuan Bentrok Jadwal Otomatis (Sistem)
 </div>
 <ul className="list-disc list-inside text-[10px] font-semibold text-rose-700 dark:text-rose-400 space-y-1">
 {conflictReport.reasons.map((reason, idx) => (
 <li key={idx} className="leading-relaxed">{reason}</li>
 ))}
 </ul>
 </div>
 )}

 {/* 3. SMART RECOMMENDATIONS SYSTEM */}
 <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-xl space-y-2.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300 font-extrabold text-[11px] uppercase tracking-wider">
 <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
 ?? Rekomendasi Slot Waktu Bebas Bentrok
 </div>
 <span className="text-[10px] text-indigo-700 bg-indigo-100 dark:bg-indigo-900/60 font-extrabold rounded px-1.5 py-0.2">
 AI Auto-Scan
 </span>
 </div>
 <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
 Sistem otomatis memindai slot kosong (tidak ada tabrakan dosen, ruangan, maupun mahasiswa) disekitar tanggal target:
 </p>
 
 {recommendations.length > 0 ? (
 <div className="grid grid-cols-1 gap-1.5 pt-1">
 {recommendations.map((rec, index) => (
 <button
 key={index}
 type="button"
 onClick={() => {
 applyRecommendation(rec);
 }}
 className="w-full text-left text-[10px] font-bold p-2 bg-white dark:bg-slate-950 rounded border border-indigo-100 dark:border-indigo-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700 transition cursor-pointer flex justify-between items-center group shadow-sm"
 >
 <span className="truncate group-hover:text-white text-[var(--text-main)] font-semibold">
 {rec.label}
 </span>
 <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-0.5 whitespace-nowrap">
 <UserCheck size={9} /> Terapkan Slot
 </span>
 </button>
 ))}
 </div>
 ) : (
 <p className="text-[9.5px] italic text-slate-400 font-semibold">
 Silakan pilih Penguji terlebih dahulu untuk memindai rekomendasi agenda kosong.
 </p>
 )}
 </div>

 {/* 4. GOOGLE CALENDAR / MEET SYNCHRONIZATION CONTROLS */}
 <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-left">
 <div className="flex justify-between items-center">
 <label className="flex items-center gap-2 cursor-pointer font-extrabold text-[11px] text-[var(--text-main)] select-none">
 <input 
 type="checkbox"
 checked={createGoogleMeet}
 onChange={(e) => setCreateGoogleMeet(e.target.checked)}
 className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-[var(--border-color)] cursor-pointer"
 />
 <span className="text-emerald-800 dark:text-emerald-300">Sinkronkan Kalender & Buat Link Google Meet</span>
 </label>
 {!googleToken && (
 <button 
 type="button"
 onClick={onConnectGoogle}
 className="text-[10px] text-amber-600 font-extrabold hover:underline cursor-pointer"
 >
 Hubungkan Google
 </button>
 )}
 </div>
 <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
 Sistem akan otomatis mendaftarkan jadwal ujian ini ke Google Calendar mahasiswa, penguji 1, dan penguji 2, berikut dengan jembatan link video konferensi Google Meet virtual resmi.
 </p>
 </div>

 <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--border-color)]">
 <button
 type="button"
 onClick={onClose}
 disabled={isGeneratingMeet}
 className="btn btn-secondary text-xs font-bold px-4 py-2 cursor-pointer disabled:opacity-50"
 >
 Batal
 </button>
 <button
 type="submit"
 disabled={isGeneratingMeet}
 className="btn btn-primary text-xs font-bold px-5 py-2 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
 >
 {isGeneratingMeet ? "Membuat Event Kalender..." : (conflictReport.hasConflict ? "Tetap Terbitkan (Paksa)" : "? Simpan & Terbitkan")}
 </button>
 </div>
 </form>
 );
}

