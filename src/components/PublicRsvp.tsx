import React, { useEffect, useState } from "react";
import { Check, X, Calendar, Clock, MapPin, AlertCircle, RefreshCw, Award } from "lucide-react";

interface PublicRsvpProps {
 scheduleId: string;
 role: string;
 name: string;
 onClose: () => void;
}

interface RsvpInfo {
 id: string;
 namaMahasiswa: string;
 nim: string;
 tanggal: string;
 waktu: string;
 ruang: string;
 jenisUjian: string;
 penguji1: string;
 penguji2: string;
 accPenguji1: string;
 accPenguji2: string;
 catatan: string;
}

export function PublicRsvp({ scheduleId, role, name, onClose }: PublicRsvpProps) {
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [info, setInfo] = useState<RsvpInfo | null>(null);
 const [submitting, setSubmitting] = useState(false);
 const [successMsg, setSuccessMsg] = useState<string | null>(null);

 useEffect(() => {
 const fetchInfo = async () => {
 try {
 const res = await fetch(`/api/rsvp-info?id=${scheduleId}`);
 if (!res.ok) {
 throw new Error("Gagal memuat jadwal sidang atau jadwal tidak valid.");
 }
 const data = await res.json();
 setInfo(data);
 } catch (err: any) {
 setError(err.message || "Terjadi kesalahan koneksi.");
 } finally {
 setLoading(false);
 }
 };

 fetchInfo();
 }, [scheduleId]);

 const handleResponse = async (status: "Disetujui" | "Ditolak") => {
 setSubmitting(true);
 setError(null);
 try {
 const res = await fetch("/api/rsvp-public", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 id: scheduleId,
 role: role,
 status: status
 })
 });

 const data = await res.json();
 if (!res.ok) {
 throw new Error(data.error || "Gagal menyimpan konfirmasi.");
 }

 setSuccessMsg(data.message);
 // Update local state info
 if (info) {
 setInfo({
 ...info,
 accPenguji1: role === "penguji1" ? status : info.accPenguji1,
 accPenguji2: role === "penguji2" ? status : info.accPenguji2
 });
 }
 } catch (err: any) {
 setError(err.message || "Gagal mengirim tanggapan.");
 } finally {
 setSubmitting(false);
 }
 };

 const getRoleDisplayName = () => {
 if (role === "penguji1") return "Penguji Utama I / Ketua Penguji";
 if (role === "penguji2") return "Penguji Pendamping II / Sekretaris";
 return "Anggota Dewan Penguji";
 };

 const getExaminerEmail = () => {
 if (!info) return "";
 return role === "penguji1" ? info.penguji1 : info.penguji2;
 };

 const formatIDDate = (dateStr: string): string => {
 try {
 const d = new Date(dateStr);
 if (isNaN(d.getTime())) return dateStr;
 const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
 const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
 return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
 } catch (e) {
 return dateStr;
 }
 };

 return (
 <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-4 font-sans">
 <div className="w-full max-w-md bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl p-6 relative overflow-hidden transition-all duration-300">
 
 {/* Background accent */}
 <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600"></div>

 {/* Brand */}
 <div className="flex items-center gap-2 mb-6">
 <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
 <span className="text-xl">??</span>
 </div>
 <div>
 <h1 className="text-sm font-black tracking-wider text-emerald-400 uppercase">Academics</h1>
 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Universitas Muhammadiyah Pontianak</p>
 </div>
 </div>

 {loading ? (
 <div className="flex flex-col items-center justify-center py-10 space-y-3">
 <RefreshCw className="animate-spin text-emerald-500" size={32} />
 <span className="text-xs text-slate-400 font-bold tracking-wide">Memverifikasi Undangan Sidang...</span>
 </div>
 ) : error && !successMsg ? (
 <div className="space-y-4 py-4 text-center">
 <div className="text-rose-500 mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
 <AlertCircle size={24} />
 </div>
 <h2 className="text-sm font-black text-slate-200">Konfirmasi RSVP Gagal</h2>
 <p className="text-xs text-slate-400 leading-relaxed font-semibold">{error}</p>
 <button
 onClick={onClose}
 className="mt-4 px-4 py-2 w-full bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 font-bold text-xs"
 >
 Kembali ke Halaman Utama
 </button>
 </div>
 ) : successMsg ? (
 <div className="space-y-5 text-center py-4">
 <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-rose">
 <Check className="text-emerald-500" size={28} />
 </div>
 <h2 className="text-base font-black text-slate-100">Konfirmasi Berhasil Tersimpan!</h2>
 <div className="p-3.5 bg-slate-900 border border-slate-700/50 rounded-xl">
 <p className="text-xs text-slate-300 font-semibold leading-relaxed whitespace-pre-line">{successMsg}</p>
 </div>
 <p className="text-[10px] text-slate-400 font-medium">Bapak/Ibu dapat menutup tab/browser ini dengan aman.</p>
 <button
 onClick={onClose}
 className="mt-2 px-4 py-2 w-full bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold text-xs transition-colors cursor-pointer"
 >
 Halaman Login Academics
 </button>
 </div>
 ) : info && (
 <div className="space-y-5">
 <div className="space-y-1">
 <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
 SISTEM RSVP DOSEN PENGUJI
 </span>
 <h2 className="text-base font-black text-slate-100 pt-1">
 Undangan Sebagai {getRoleDisplayName()}
 </h2>
 <p className="text-xs text-slate-400 font-semibold">
 Yth. Bapak/Ibu Dosen di Lingkungan Fikes, mohon kesediaannya memberikan konfirmasi kehadiran ujian di bawah ini.
 </p>
 </div>

 {/* Schedule Details Card */}
 <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 space-y-3.5 text-xs">
 <div className="border-b border-slate-800 pb-2.5">
 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mahasiswa Mhs S2</div>
 <div className="font-extrabold text-white text-sm mt-0.5">{info.namaMahasiswa}</div>
 <div className="text-[10px] text-slate-400 font-semibold mt-0.5">NIM: {info.nim}</div>
 </div>

 <div>
 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mata Ujian / Kegiatan</div>
 <div className="flex items-center gap-1.5 font-extrabold text-emerald-400">
 <Award size={13} />
 <span>{info.jenisUjian}</span>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
 <div className="flex items-start gap-2">
 <Calendar className="text-teal-400 mt-0.5 flex-shrink-0" size={13} />
 <div>
 <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tanggal</div>
 <div className="font-extrabold text-slate-200 mt-0.5 leading-tight">{formatIDDate(info.tanggal)}</div>
 </div>
 </div>

 <div className="flex items-start gap-2">
 <Clock className="text-teal-400 mt-0.5 flex-shrink-0" size={13} />
 <div>
 <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Waktu</div>
 <div className="font-extrabold text-slate-200 mt-0.5 leading-tight">{info.waktu} WIB</div>
 </div>
 </div>
 </div>

 <div className="flex items-start gap-2 border-t border-slate-800 pt-3">
 <MapPin className="text-teal-400 mt-0.5 flex-shrink-0" size={13} />
 <div>
 <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tempat / Ruangan</div>
 <div className="font-extrabold text-slate-200 mt-0.5 leading-tight">{info.ruang}</div>
 </div>
 </div>

 {info.catatan && (
 <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/40 text-[11px] font-semibold text-slate-300">
 <span className="text-[10px] font-black text-rose-300 block mb-0.5">Catatan Staf Prodi:</span>
 {info.catatan}
 </div>
 )}
 </div>

 {/* Current RSVPs Status Indicator */}
 <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-700/20 text-[10px] font-bold uppercase tracking-wide text-slate-400">
 <span>Status RSVP Anda:</span>
 {(() => {
 const currentStatus = role === "penguji1" ? info.accPenguji1 : info.accPenguji2;
 if (currentStatus === "Disetujui") {
 return <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black">? Hadir (Disetujui)</span>;
 }
 if (currentStatus === "Ditolak") {
 return <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-black">? Absen (Ditolak)</span>;
 }
 return <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-black animate-pulse">Menunggu Jawaban</span>;
 })()}
 </div>

 {/* RSVP Selection Buttons */}
 <div className="space-y-2.5">
 <button
 disabled={submitting}
 onClick={() => handleResponse("Disetujui")}
 className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-55 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 border border-emerald-500/10"
 >
 {submitting ? (
 <RefreshCw className="animate-spin" size={14} />
 ) : (
 <Check size={15} />
 )}
 <span>SAYA BERSEDIA HADIR (SETUJU)</span>
 </button>

 <button
 disabled={submitting}
 onClick={() => handleResponse("Ditolak")}
 className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 hover:text-white disabled:opacity-55 text-slate-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-600/30"
 >
 <X size={15} />
 <span>MOHON MAAF, SAYA BERHALANGAN (TOLAK)</span>
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}

