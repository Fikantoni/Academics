import React, { useState, useMemo } from "react";
import { Users, ShieldAlert, Award, Copy, Check, Scale, BookOpen, AlertTriangle } from "lucide-react";
import { Dosen, Bimbingan, JadwalSidang, AppState } from "../types";

interface DosenWorkloadEqualizerProps {
 state: AppState;
 showToast: (msg: string, type?: "success" | "warning" | "error") => void;
}

export default function DosenWorkloadEqualizer({ state, showToast }: DosenWorkloadEqualizerProps) {
 const [searchTerm, setSearchTerm] = useState("");
 const [copiedId, setCopiedId] = useState<string | null>(null);

 const lecturers = state.dosen || [];
 const guides = state.bimbingan || [];
 const exams = state.jadwalSidang || [];

 // Compute workload statistics for each lecturer
 const workloadStats = useMemo(() => {
 return lecturers.map((d) => {
 // Pembimbing 1
 const p1Count = guides.filter((g) => g.pembimbing1 === d.email).length;
 // Pembimbing 2
 const p2Count = guides.filter((g) => g.pembimbing2 === d.email).length;
 // Penguji 1 (Exams)
 const x1Count = exams.filter((e) => e.penguji1 === d.email).length;
 // Penguji 2 (Exams)
 const x2Count = exams.filter((e) => e.penguji2 === d.email).length;

 // Weighted score formula for academic load
 // Pembimbing 1: weight 2.0
 // Pembimbing 2: weight 1.0
 // Penguji 1: weight 1.5
 // Penguji 2: weight 1.0
 const score = (p1Count * 2) + p2Count + (x1Count * 1.5) + (x2Count * 1.0);
 const totalActivities = p1Count + p2Count + x1Count + x2Count;

 let loadStatus: "Aman" | "Optimal" | "Kelebihan";
 let statusLabel = "Sangat Aman";
 let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900";

 if (score >= 9) {
 loadStatus = "Kelebihan";
 statusLabel = "Beban Berlebih (>= 9 Pt)";
 badgeStyle = "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900";
 } else if (score >= 4) {
 loadStatus = "Optimal";
 statusLabel = "Optimal (Kapasitas Baik)";
 badgeStyle = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900";
 } else {
 loadStatus = "Aman";
 statusLabel = "Sangat Aman (< 4 Pt)";
 }

 return {
 ...d,
 p1Count,
 p2Count,
 x1Count,
 x2Count,
 score,
 totalActivities,
 loadStatus,
 statusLabel,
 badgeStyle
 };
 });
 }, [lecturers, guides, exams]);

 // Filters
 const filteredWorkload = workloadStats.filter((w) => 
 w.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
 w.nidn.includes(searchTerm) ||
 w.bidangKeahlian.toLowerCase().includes(searchTerm.toLowerCase())
 );

 // Recommendations sorted by lowest score (lowest workload)
 const lowWorkloadRecommendations = useMemo(() => {
 return [...workloadStats]
 .filter((w) => w.loadStatus !== "Kelebihan" && w.status !== "Cuti")
 .sort((a, b) => a.score - b.score)
 .slice(0, 4);
 }, [workloadStats]);

 const handleCopyEmail = (email: string, id: string) => {
 navigator.clipboard.writeText(email);
 setCopiedId(id);
 showToast("Email dosen disalin ke papan klip!", "success");
 setTimeout(() => setCopiedId(null), 1500);
 };

 return (
 <div className="space-y-6 text-left font-sans">
 
 {/* 📊 CO-ORDINATION RECOMMENDATIONS (LOW WORKLOAD) */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="md:col-span-1 bg-gradient-to-br from-indigo-550 to-indigo-700 dark:from-slate-900 dark:to-indigo-950/45 p-4 rounded-2xl text-white flex flex-col justify-between shadow-md border border-indigo-200 dark:border-indigo-950/60">
 <div>
 <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white mb-2 shadow">
 <Scale size={16} />
 </div>
 <h3 className="text-sm font-extrabold tracking-tight uppercase">Equalizer Beban</h3>
 <p className="text-[10px] text-indigo-150 leading-relaxed mt-2.5">
 Algoritma Academics menghitung poin akademis dosen berdasarkan keterlibatannya sebagai pembimbing tugas akhir S2 dan panel penguji seminar/sidang kelayakan.
 </p>
 </div>
 <div className="text-[9px] bg-white/10 p-2 rounded-lg mt-3 text-indigo-100 font-semibold border border-white/5">
 <b>Skema Poin:</b><br />
 • Pembimbing 1 = 2 Pt<br />
 • Penguji 1 = 1.5 Pt
 </div>
 </div>

 <div className="md:col-span-3 card bg-white dark:bg-slate-950 p-4 border border-[var(--border-color)] flex flex-col justify-between">
 <div>
 <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-sans">
 💡 Rekomendasi Teratas Pembagian Tugas
 </span>
 <p className="text-[11px] text-[var(--text-muted)] mt-1.5 mb-3">
 Daftar dosen dengan beban kerja paling ringan saat ini, direkomendasikan untuk tugas penguji/pembimbing berikutnya:
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {lowWorkloadRecommendations.map((rec) => (
 <div 
 key={rec.id}
 className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between hover:border-indigo-200 transition-all cursor-default"
 >
 <div className="space-y-0.5 max-w-[190px]">
 <div className="font-extrabold text-xs text-[var(--text-main)] truncate">{rec.nama}</div>
 <div className="text-[10px] text-slate-400 font-semibold truncate leading-tight">{rec.bidangKeahlian}</div>
 <div className="text-[9.5px] font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
 Skor Beban Pascasarjana: {rec.score} Pt
 </div>
 </div>

 <button
 onClick={() => handleCopyEmail(rec.email, rec.id)}
 className="p-1.5 text-slate-400 hover:text-[var(--brand-primary)] bg-white dark:bg-slate-950 rounded-lg border border-[var(--border-color)] transition cursor-pointer shrink-0"
 title="Salin Email untuk Assign"
 >
 {copiedId === rec.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
 </button>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* 📋 WORKLOAD DETAIL DIRECTORY TABLE */}
 <div className="card bg-white dark:bg-slate-950 p-4 border border-[var(--border-color)]">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
 <div>
 <h3 className="text-sm font-extrabold tracking-tight uppercase text-[var(--text-main)]">
 📋 Direktori Analitik Beban Dosen Program Studi
 </h3>
 <p className="text-xs text-[var(--text-muted)]">
 Daftar partisipasi tugas membimbing dan menguji mahasiswa Fakultas Ilmu Kesehatan dan Psikologi.
 </p>
 </div>

 <div className="max-w-[240px] w-full">
 <input
 type="text"
 placeholder="Cari NIDN / Nama / Keahlian Dosen..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="form-input text-xs font-semibold py-1.5"
 />
 </div>
 </div>

 {/* Warning Indicator */}
 {workloadStats.some(w => w.loadStatus === "Kelebihan") && (
 <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-950 text-orange-900 dark:text-orange-350 text-[11px] font-medium leading-relaxed mb-4">
 <AlertTriangle size={15} className="text-orange-500 shrink-0 mt-0.5" />
 <div>
 <span className="font-extrabold">Catatan Pemerataan Tugas:</span> Beberapa dosen terdeteksi melampaui ambang beban ideal akademis (&gt;= 9 Pt). Disarankan untuk menunjuk dosen pembimbing/penguji cadangan dari rekomendasi teratas untuk menghindari keterlambatan penandatanganan berkas kelulusan mahasiswa.
 </div>
 </div>
 )}

 <div className="table-container min-h-[220px]">
 <table className="data-table">
 <thead>
 <tr className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900 border-b border-[var(--border-color)]">
 <th className="p-3 text-left">Profil Dosen & NIDN</th>
 <th className="p-3 text-center">Bimbingan (P1 / P2)</th>
 <th className="p-3 text-center">Ujian (Pj1 / Pj2)</th>
 <th className="p-3 text-center">Total Poin Beban</th>
 <th className="p-3 text-right">Label Status Pemerataan</th>
 </tr>
 </thead>
 <tbody>
 {filteredWorkload.length > 0 ? (
 filteredWorkload.map((w) => (
 <tr key={w.id} className="border-b border-[var(--border-color)] hover:bg-slate-50/50 dark:hover:bg-slate-900/10 text-left">
 <td className="p-3">
 <div className="font-extrabold text-xs text-[var(--text-main)]">{w.nama}</div>
 <div className="text-[10px] text-slate-400 font-semibold mt-0.5">NIDN: {w.nidn} | {w.bidangKeahlian}</div>
 </td>
 <td className="p-3 text-center text-xs font-bold">
 <div className="flex justify-center items-center gap-1">
 <span className="text-[10.5px] bg-slate-100 dark:bg-slate-900 text-slate-600 px-1.5 py-0.5 rounded font-extrabold" title="Pembimbing 1">
 {w.p1Count}
 </span>
 <span className="text-slate-300">/</span>
 <span className="text-[10.5px] bg-slate-100 dark:bg-slate-900 text-slate-600 px-1.5 py-0.5 rounded font-extrabold" title="Pembimbing 2">
 {w.p2Count}
 </span>
 </div>
 </td>
 <td className="p-3 text-center text-xs font-bold">
 <div className="flex justify-center items-center gap-1 font-extrabold">
 <span className="text-[10.5px] bg-slate-100 dark:bg-slate-900 text-slate-600 px-1.5 py-0.5 rounded" title="Penguji 1">
 {w.x1Count}
 </span>
 <span className="text-slate-300">/</span>
 <span className="text-[10.5px] bg-slate-100 dark:bg-slate-900 text-slate-600 px-1.5 py-0.5 rounded" title="Penguji 2">
 {w.x2Count}
 </span>
 </div>
 </td>
 <td className="p-3 text-center">
 <span className="font-extrabold text-xs text-[var(--text-main)] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40 px-2 py-0.5 rounded">
 {w.score} Poin
 </span>
 </td>
 <td className="p-3 text-right">
 <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${w.badgeStyle}`}>
 {w.statusLabel}
 </span>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="text-center py-6 text-xs text-[var(--text-muted)] italic">
 Dosen dengan filter tersebut tidak ditemukan.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 </div>
 );
}

