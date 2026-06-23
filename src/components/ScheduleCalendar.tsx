import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Video, Calendar, MapPin, Clock, User, Share2, Clipboard, AlertCircle } from "lucide-react";
import { JadwalSidang, AppState, Pengguna } from "../types";

interface ScheduleCalendarProps {
 schedules: JadwalSidang[];
 state: AppState;
 currentUser: Pengguna | null;
 onOpenWaModal: (s: JadwalSidang) => void;
 onAddScheduleAtDate?: (dateStr: string) => void;
 showToast: (msg: string, type?: "success" | "warning" | "error") => void;
}

export default function ScheduleCalendar({
 schedules,
 state,
 currentUser,
 onOpenWaModal,
 onAddScheduleAtDate,
 showToast,
}: ScheduleCalendarProps) {
 const [currentDate, setCurrentDate] = useState<Date>(new Date());
 const [selectedSchedule, setSelectedSchedule] = useState<JadwalSidang | null>(null);

 const year = currentDate.getFullYear();
 const month = currentDate.getMonth();

 const monthNames = [
 "Januari", "Februari", "Maret", "April", "Mei", "Juni",
 "Juli", "Agustus", "September", "Oktober", "November", "Desember"
 ];

 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
 
 // Align Sunday to index 6, Monday to index 0 for standard Indonesian view if desired, or keep standard. 
 // Let's use Indonesian standard (Senin to Minggu)
 // Standard getDay(): 0-Sun, 1-Mon, 2-Tue, 3-Wed, 4-Thu, 5-Fri, 6-Sat
 // Adjusted: Sun: 6, Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5
 const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

 // Day names heading INDONESIAN
 const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

 const prevMonth = () => {
 setCurrentDate(new Date(year, month - 1, 1));
 setSelectedSchedule(null);
 };

 const nextMonth = () => {
 setCurrentDate(new Date(year, month + 1, 1));
 setSelectedSchedule(null);
 };

 const goToToday = () => {
 setCurrentDate(new Date());
 setSelectedSchedule(null);
 };

 // Safe checks for date formats (supports both YYYY-MM-DD and DD-MM-YYYY)
 const isSameDayStr = (schedDateStr: string, cellYear: number, cellMonth: number, cellDay: number) => {
 if (!schedDateStr) return false;
 
 // Normalize cell parts
 const cellMM = String(cellMonth + 1).padStart(2, "0");
 const cellDD = String(cellDay).padStart(2, "0");
 const cellYMD = `${cellYear}-${cellMM}-${cellDD}`; // e.g. 2026-06-11
 const cellDMY = `${cellDD}-${cellMM}-${cellYear}`; // e.g. 11-06-2026

 // Direct match check
 if (schedDateStr === cellYMD || schedDateStr === cellDMY) {
 return true;
 }

 // Try parsing date if different format
 try {
 const parsedSched = new Date(schedDateStr);
 if (!isNaN(parsedSched.getTime())) {
 return (
 parsedSched.getFullYear() === cellYear &&
 parsedSched.getMonth() === cellMonth &&
 parsedSched.getDate() === cellDay
 );
 }
 } catch (_) {}

 return false;
 };

 const getSchedulesForDay = (dayNum: number) => {
 return schedules.filter(s => isSameDayStr(s.tanggal, year, month, dayNum));
 };

 // Color mapping per exam type
 const getBadgeStyle = (jenis?: string) => {
 switch (jenis) {
 case "Seminar Proposal":
 return {
 bg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300",
 dot: "bg-indigo-600",
 text: "Proposal"
 };
 case "Seminar Hasil":
 return {
 bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-350",
 dot: "bg-emerald-600",
 text: "Hasil"
 };
 case "Sidang Tugas Akhir":
 return {
 bg: "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-900 dark:text-purple-300",
 dot: "bg-purple-600",
 text: "Sidang Akhir"
 };
 default:
 return {
 bg: "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300",
 dot: "bg-slate-600",
 text: "Sidang"
 };
 };
 };

 const handleCopyClipboardInfo = (s: JadwalSidang) => {
 const text = `*Academics - PEMBERITAHUAN JADWAL UJIAN*\n\n` +
 `*Nama:* ${s.namaMahasiswa}\n` +
 `*Ujian:* ${s.jenisUjian || "Sidang Tugas Akhir"}\n` +
 `*Tanggal:* ${s.tanggal}\n` +
 `*Waktu:* ${s.waktu}\n` +
 `*Ruang:* ${s.ruang}\n` +
 `*Join Link:* ${s.meetLink || "Tatap Muka"}\n\n` +
 `_Harap login ke Academics untuk memberikan persetujuan berkas._`;
 
 navigator.clipboard.writeText(text);
 showToast("Ringkasan jadwal disalin ke Clipboard!", "success");
 };

 // Render Day Cells
 const cells = [];
 
 // Prep preceding month filler cells
 const prevMonthDate = new Date(year, month, 0);
 const prevMonthDaysCount = prevMonthDate.getDate();
 for (let i = adjustedFirstDay - 1; i >= 0; i--) {
 const fillerDay = prevMonthDaysCount - i;
 cells.push({
 dayNum: fillerDay,
 isCurrentMonth: false,
 key: `fill-prev-${fillerDay}`
 });
 }

 // Current month day cells
 for (let d = 1; d <= daysInMonth; d++) {
 cells.push({
 dayNum: d,
 isCurrentMonth: true,
 key: `day-${d}`
 });
 }

 // Post month filler cells to form an exact 42 grid blocks
 const remainingCells = 42 - cells.length;
 for (let i = 1; i <= remainingCells; i++) {
 cells.push({
 dayNum: i,
 isCurrentMonth: false,
 key: `fill-next-${i}`
 });
 }

 return (
 <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-slide-entry text-left font-sans">
 
 {/* ?? CALENDAR SECTION */}
 <div className="xl:col-span-2 card bg-white dark:bg-slate-950 p-4 border border-[var(--border-color)]">
 
 {/* Header Controls */}
 <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-[var(--border-color)] pb-4 mb-4">
 <div className="flex items-center gap-2">
 <Calendar className="text-[var(--brand-primary)] shrink-0" size={20} />
 <span className="text-base font-extrabold text-[var(--text-main)] uppercase tracking-tight">
 {monthNames[month]} {year}
 </span>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={goToToday}
 className="px-2.5 py-1 text-[11px] font-extrabold bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 border border-[var(--border-color)] rounded transition-all cursor-pointer select-none text-[var(--text-main)]"
 >
 Hari Ini
 </button>
 <div className="flex rounded border border-[var(--border-color)] overflow-hidden">
 <button
 onClick={prevMonth}
 className="p-1 px-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-r border-[var(--border-color)] transition-all cursor-pointer"
 title="Bulan Sebelumnya"
 >
 <ChevronLeft size={16} className="text-[var(--text-main)]" />
 </button>
 <button
 onClick={nextMonth}
 className="p-1 px-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
 title="Bulan Selanjutnya"
 >
 <ChevronRight size={16} className="text-[var(--text-main)]" />
 </button>
 </div>
 </div>
 </div>

 {/* Calendar Grid Container */}
 <div className="border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm bg-slate-50/40 dark:bg-slate-950">
 
 {/* Day Headers */}
 <div className="grid grid-cols-7 bg-slate-100/80 dark:bg-slate-900 border-b border-[var(--border-color)]">
 {dayNames.map((name) => (
 <div 
 key={name} 
 className="py-2 text-center text-[10px] font-extrabold text-[var(--text-muted)] tracking-wider uppercase border-r last:border-0 border-[var(--border-color)]"
 >
 {name}
 </div>
 ))}
 </div>

 {/* Days Grid */}
 <div className="grid grid-cols-7 grid-rows-6">
 {cells.map(({ dayNum, isCurrentMonth, key }) => {
 const dayScheds = isCurrentMonth ? getSchedulesForDay(dayNum) : [];
 const formattedCellDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
 const isToday = isCurrentMonth && 
 new Date().getDate() === dayNum && 
 new Date().getMonth() === month && 
 new Date().getFullYear() === year;

 return (
 <div
 key={key}
 className={`min-h-[75px] md:min-h-[85px] p-1.5 border-r border-b border-[var(--border-color)] last:border-r-0 flex flex-col justify-between transition-all relative ${
 isCurrentMonth 
 ? "bg-white dark:bg-slate-950/60 text-[var(--text-main)] hover:bg-slate-50/50 dark:hover:bg-slate-900/30" 
 : "bg-slate-50/40 dark:bg-slate-900/10 text-slate-405 dark:text-slate-600"
 }`}
 >
 {/* Day Indicator */}
 <div className="flex justify-between items-center mb-0.5 select-none">
 <span 
 className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
 isToday 
 ? "bg-indigo-600 text-white shadow-sm" 
 : "text-[var(--text-muted)]"
 }`}
 >
 {dayNum}
 </span>
 
 {/* Tiny plus button on hover for administrative additions */}
 {isCurrentMonth && onAddScheduleAtDate && (currentUser?.role === "Superadmin" || currentUser?.role === "Admin" || currentUser?.role === "Prodi") && (
 <button
 onClick={() => onAddScheduleAtDate(formattedCellDate)}
 className="opacity-0 hover:opacity-100 md:group-hover:opacity-100 text-[9.5px] bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 border border-[var(--border-color)] rounded w-4 h-4 flex items-center justify-center transition-all cursor-pointer absolute top-1 right-1"
 title="Buat Jadwal Baru di hari ini"
 >
 +
 </button>
 )}
 </div>

 {/* Chiclets / Badges for each event */}
 <div className="flex-1 flex flex-col gap-1 overflow-y-auto mt-1 max-h-[50px] scrollbar-thin">
 {dayScheds.map((s) => {
 const style = getBadgeStyle(s.jenisUjian);
 return (
 <button
 key={s.id}
 onClick={(e) => {
 e.stopPropagation();
 setSelectedSchedule(s);
 }}
 className={`w-full text-left p-1 rounded border text-[9.5px] font-extrabold flex items-center gap-1 transition-all truncate cursor-pointer ${style.bg} ${
 selectedSchedule?.id === s.id ? "ring-2 ring-indigo-500 scale-95" : ""
 }`}
 >
 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
 <span className="truncate flex-1">
 {s.namaMahasiswa.split(" ")[0]} ({style.text})
 </span>
 </button>
 );
 })}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 {/* ?? DETAILED SCHEDULING CARD DRAWER */}
 <div className="card bg-white dark:bg-slate-950 border border-[var(--border-color)] p-4 flex flex-col justify-between">
 {selectedSchedule ? (
 <div className="space-y-4">
 <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-3">
 <div>
 <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-350 border border-[var(--border-color)]">
 Detail Kegiatan
 </span>
 <h3 className="text-base font-extrabold text-[var(--text-main)] mt-2">
 {selectedSchedule.jenisUjian || "Sidang Kelompok"}
 </h3>
 </div>
 <button
 onClick={() => setSelectedSchedule(null)}
 className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] rounded w-6 h-6 flex items-center justify-center cursor-pointer"
 >
 ?
 </button>
 </div>

 {/* General Info */}
 <div className="space-y-2.5">
 <div className="flex items-center gap-2.5 text-xs">
 <span className="w-5 text-center text-slate-400">??</span>
 <div>
 <span className="text-[10px] text-slate-400 block font-semibold">Mahasiswa yang Ujian</span>
 <span className="font-extrabold text-slate-900 dark:text-white">{selectedSchedule.namaMahasiswa}</span>
 </div>
 </div>

 <div className="flex items-center gap-2.5 text-xs">
 <Clock className="w-5 text-slate-400 shrink-0" size={14} />
 <div>
 <span className="text-[10px] text-slate-400 block font-semibold">Waktu Pelaksanaan</span>
 <span className="font-bold text-[var(--text-main)]">{selectedSchedule.tanggal} @ {selectedSchedule.waktu}</span>
 </div>
 </div>

 <div className="flex items-center gap-2.5 text-xs">
 <MapPin className="w-5 text-slate-400 shrink-0" size={14} />
 <div>
 <span className="text-[10px] text-slate-400 block font-semibold">Lokasi Ruang / Tempat</span>
 <span className="font-bold text-[var(--text-main)]">{selectedSchedule.ruang}</span>
 </div>
 </div>
 </div>

 {/* Panel Penguji & Pembimbing */}
 <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
 <span className="text-[9.5px] uppercase font-extrabold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
 <User size={11} />
 Dewan Penguji
 </span>
 <div className="text-[11px] font-semibold space-y-1.5 text-[var(--text-main)]">
 <div className="flex justify-between border-b border-[var(--border-color)] pb-1">
 <span>?? Penguji 1:</span>
 <span className="font-extrabold truncate max-w-[130px]" title={selectedSchedule.penguji1}>
 {selectedSchedule.isExternalPenguji1 && selectedSchedule.externalPenguji1Name
 ? `${selectedSchedule.externalPenguji1Name} (Luar)`
 : (state.dosen.find((d) => d.email === selectedSchedule.penguji1)?.nama || selectedSchedule.penguji1)}
 </span>
 </div>
 <div className="flex justify-between border-b border-[var(--border-color)] pb-1">
 <span>?? Penguji 2:</span>
 <span className="font-extrabold truncate max-w-[130px]" title={selectedSchedule.penguji2}>
 {selectedSchedule.isExternalPenguji2 && selectedSchedule.externalPenguji2Name
 ? `${selectedSchedule.externalPenguji2Name} (Luar)`
 : (state.dosen.find((d) => d.email === selectedSchedule.penguji2)?.nama || selectedSchedule.penguji2)}
 </span>
 </div>
 </div>
 </div>

 {/* Electronic Signatures Overview */}
 <div className="p-3 bg-slate-100/50 dark:bg-slate-900/40 rounded-xl border border-[var(--border-color)]">
 <span className="text-[9.5px] uppercase font-extrabold text-[var(--text-muted)] block mb-1.5">
 Konfirmasi TTD Elektronik
 </span>
 <div className="grid grid-cols-3 gap-1.5 text-[9.5px] font-bold text-center">
 <div className="p-1 rounded bg-white dark:bg-slate-900 border border-[var(--border-color)]">
 <div className="text-slate-400 mb-0.5">Mhs</div>
 <span className={selectedSchedule.accMahasiswa === "Disetujui" ? "text-emerald-600 font-extrabold" : "text-amber-500"}>
 {selectedSchedule.accMahasiswa || "Menunggu"}
 </span>
 </div>
 <div className="p-1 rounded bg-white dark:bg-slate-900 border border-[var(--border-color)]">
 <div className="text-slate-400 mb-0.5">Penguji 1</div>
 <span className={selectedSchedule.accPenguji1 === "Disetujui" ? "text-emerald-600 font-extrabold" : "text-amber-500"}>
 {selectedSchedule.accPenguji1 || "Menunggu"}
 </span>
 </div>
 <div className="p-1 rounded bg-white dark:bg-slate-900 border border-[var(--border-color)]">
 <div className="text-slate-400 mb-0.5">Penguji 2</div>
 <span className={selectedSchedule.accPenguji2 === "Disetujui" ? "text-emerald-600 font-extrabold" : "text-amber-500"}>
 {selectedSchedule.accPenguji2 || "Menunggu"}
 </span>
 </div>
 </div>
 </div>

 {/* Action buttons inside agenda details view */}
 <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
 {selectedSchedule.meetLink && (
 <a
 href={selectedSchedule.meetLink}
 target="_blank"
 rel="noopener noreferrer"
 className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all text-center border-none"
 >
 <Video size={13} /> Gabung Rapat Google Meet
 </a>
 )}

 <div className="grid grid-cols-2 gap-2">
 <button
 type="button"
 onClick={() => onOpenWaModal(selectedSchedule)}
 className="py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer border-none"
 >
 ?? Notifikasi WA
 </button>
 <button
 type="button"
 onClick={() => handleCopyClipboardInfo(selectedSchedule)}
 className="py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-[var(--text-main)] border border-[var(--border-color)] rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
 >
 <Share2 size={11} /> Salin Text
 </button>
 </div>
 </div>
 </div>
 ) : (
 <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 my-auto">
 <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] flex items-center justify-center text-slate-400">
 ???
 </div>
 <p className="text-xs font-extrabold text-[var(--text-main)]">Tidak ada Jadwal dipilih</p>
 <p className="text-[10px] text-[var(--text-muted)] max-w-[200px] leading-relaxed">
 Pilihlah salah satu gelembung agenda ujian mahasiswa dalam kalender untuk meninjau status, link meet, dan mengirim notifikasi WhatsApp otomatis.
 </p>
 </div>
 )}
 </div>

 </div>
 );
}

