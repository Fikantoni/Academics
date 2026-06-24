import React, { useState, useMemo } from "react";
import { List, Search, Plus, FileSpreadsheet, Calendar, User, ChevronRight, Hash, X } from "lucide-react";
import { AppState, Pengguna, NomorSuratKeluar } from "../types";

interface OutgoingNumberTabProps {
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

export function OutgoingNumberTab({ currentUser, state, mutate, showToast }: OutgoingNumberTabProps) {
 const [searchTerm, setSearchTerm] = useState("");
 const [isAddOpen, setIsAddOpen] = useState(false);

 // Form states
 const [perihal, setPerihal] = useState("");
 const [tujuan, setTujuan] = useState("");
 const [kategori, setKategori] = useState("Surat Keterangan");
 const [tanggalPembuatan, setTanggalPembuatan] = useState(new Date().toISOString().substring(0, 10));

 const listNomor = state.nomorSuratKeluar || [];

 // Calculate next sequential number
 const nextSequence = useMemo(() => {
 if (listNomor.length === 0) return 1;
 const maxUrut = Math.max(...listNomor.map((n) => n.nomorUrut || 0));
 return maxUrut + 1;
 }, [listNomor]);

 // Clean formatting for the generated code
 const generatedNumber = useMemo(() => {
 const seqStr = String(nextSequence).padStart(3, "0");
 const year = new Date(tanggalPembuatan).getFullYear();
 return `${seqStr}/II.3.AU.15/K/FIKPsi/${year}`;
 }, [nextSequence, tanggalPembuatan]);

 const handleAddSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!perihal || !tujuan) {
 showToast("Harap isi perihal dan tujuan surat!", "warning");
 return;
 }

 const payload: Omit<NomorSuratKeluar, "id">= {
 nomorUrut: nextSequence,
 nomorSuratLengkap: generatedNumber,
 perihal,
 tujuan,
 tanggalPembuatan,
 pembuat: currentUser.nama || "Staff Admin",
 kategori,
 };

 try {
 await mutate("nomorSuratKeluar", "add", payload);
 showToast("Nomor surat berhasil diregistrasi!", "success");
 setPerihal("");
 setTujuan("");
 setIsAddOpen(false);
 } catch {
 showToast("Gagal menyimpan nomor surat.", "error");
 }
 };

 const filteredNomor = listNomor.filter((n) => {
 return (
 n.nomorSuratLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
 n.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
 n.tujuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
 n.pembuat.toLowerCase().includes(searchTerm.toLowerCase())
 );
 });

 const categories = ["Surat Keterangan", "Surat Pengantar", "Surat Keputusan (SK)", "Surat Tugas", "Surat Rekomendasi", "Surat Undangan", "Edaran", "Lainnya"];

 const isAdminOrProdi = currentUser.role === "Admin" || currentUser.role === "Superadmin" || currentUser.role === "Prodi";

 return (
 <div className="space-y-6 text-left font-sans">
 {/* Header Context */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)]">
 <div>
 <span className="text-xs font-bold text-[var(--brand-primary)] uppercase tracking-wider block mb-1">
 Layanan Kesekretariatan
 </span>
 <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
 Registrasi Nomor Surat Keluar
 </h2>
 <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
 Sistem penomoran surat otomatis dan pencatatan buku agenda keluar resmi FIKPsi.
 </p>
 </div>

 {isAdminOrProdi && (
 <button
 onClick={() => setIsAddOpen(true)}
 className="btn btn-primary text-xs flex items-center gap-2 cursor-pointer"
 >
 <Plus size={15} /> Registrasikan Nomor Baru
 </button>
 )}
 </div>

 {/* Main Workspace Layout */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Left Side: Next Number Alert Preview */}
 <div className="lg:col-span-4 space-y-6">
 <div className="card p-5 border border-[var(--border-color)] bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-slate-900 dark:to-indigo-950/20 text-slate-800 dark:text-slate-200">
 <h3 className="text-xs uppercase font-extrabold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-1">
 <Hash size={14} /> Nomor Urut Berikutnya
 </h3>
 
 <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-indigo-200 dark:border-indigo-950/60 shadow-inner text-center">
 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Generated Pattern</div>
 <div className="font-mono font-extrabold text-[15px] text-[var(--brand-primary)]">
 {generatedNumber}
 </div>
 <div className="text-[10px] text-indigo-500 font-bold mt-1.5 bg-indigo-50 dark:bg-indigo-950/30 inline-block px-2.5 py-0.5 rounded-full">
 Sequence: #{nextSequence}
 </div>
 </div>
 
 <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-4">
 Nomor surat keluar digenerasi secara urut dan otomatis berdasarkan agenda tahunan universitas untuk Fakultas Ilmu Kesehatan & Psikologi (FIKPsi).
 </p>
 </div>

 <div className="card p-5 border border-[var(--border-color)]">
 <h3 className="text-xs uppercase font-extrabold text-[var(--text-main)] mb-3 pb-2 border-b border-[var(--border-color)]">
 ℹ️ Panduan Penomoran
 </h3>
 <ul className="text-[10px] text-[var(--text-muted)] space-y-2 leading-relaxed font-semibold">
 <li className="flex items-start gap-1.5">
 <ChevronRight size={12} className="text-[var(--brand-primary)] shrink-0 mt-0.5" />
 <span><b>Urut/Seq:</b> Menunjukkan nomor index surat keluar berturut-turut.</span>
 </li>
 <li className="flex items-start gap-1.5">
 <ChevronRight size={12} className="text-[var(--brand-primary)] shrink-0 mt-0.5" />
 <span><b>II.3.AU.15:</b> Kode afiliasi institusi Pimpinan Daerah Muhammadiyah.</span>
 </li>
 <li className="flex items-start gap-1.5">
 <ChevronRight size={12} className="text-[var(--brand-primary)] shrink-0 mt-0.5" />
 <span><b>K/FIKPsi:</b> Klasifikasi kode surat keluar Fakultas Ilmu Kesehatan & Psikologi.</span>
 </li>
 </ul>
 </div>
 </div>

 {/* Right Side: Data Directory */}
 <div className="lg:col-span-8 space-y-6">
 <div className="card border border-[var(--border-color)] p-0 overflow-hidden">
 {/* Table Control Bar */}
 <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-base)] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
 <div className="relative max-w-xs w-full">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
 <input
 type="text"
 placeholder="Cari No. Surat / Perihal / Pembuat..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="form-input text-xs font-semibold pl-9 py-1.5"
 />
 </div>

 <div className="text-[11px] text-[var(--text-muted)] font-mono">
 Terdaftar <b>{filteredNomor.length}</b> agenda nomor surat
 </div>
 </div>

 {/* List Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-[var(--border-color)] bg-[var(--bg-base)]/50 text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-muted)]">
 <th className="py-3 px-4 w-[60px] text-center">Urut</th>
 <th className="py-3 px-4">Nomor Surat Resmi</th>
 <th className="py-3 px-4">Perihal & Tujuan</th>
 <th className="py-3 px-4">Tanggal Pembuatan</th>
 <th className="py-3 px-4">Pembuat (Staf)</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border-color)] text-xs font-medium">
 {filteredNomor.length > 0 ? (
 filteredNomor.reverse().map((n) => (
 <tr key={n.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
 <td className="py-4 px-4 text-center">
 <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 text-[var(--text-main)] font-extrabold font-mono text-[11px] border border-[var(--border-color)]">
 #{n.nomorUrut}
 </span>
 </td>
 <td className="py-4 px-4 font-mono font-extrabold text-[var(--brand-primary)]">
 {n.nomorSuratLengkap}
 <span className="block text-[9px] text-[var(--text-disabled)] font-bold font-sans uppercase tracking-wider mt-0.5">
 {n.kategori}
 </span>
 </td>
 <td className="py-4 px-4">
 <div className="font-extrabold text-[var(--text-main)]">{n.perihal}</div>
 <div className="text-[10px] text-[var(--text-muted)] font-semibold mt-0.5">Kepada: {n.tujuan}</div>
 </td>
 <td className="py-4 px-4 whitespace-nowrap">
 <div className="flex items-center gap-1.5 text-[var(--text-main)]">
 <Calendar size={12} className="text-slate-400" />
 {n.tanggalPembuatan}
 </div>
 </td>
 <td className="py-4 px-4 whitespace-nowrap">
 <div className="flex items-center gap-1.5 text-[var(--text-main)]">
 <User size={12} className="text-slate-400" />
 {n.pembuat}
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="py-12 text-center text-[var(--text-muted)] italic font-semibold">
 Nomor surat tidak ditemukan.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>

 {/* Modal Add Document */}
 {isAddOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
 <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-color)] shadow-[var(--shadow-lg)] w-full max-w-md overflow-hidden animate-slide-entry">
 {/* Modal Header */}
 <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-base)] flex justify-between items-center">
 <div>
 <h3 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wider">
 📝 Registrasikan Nomor Surat Keluar
 </h3>
 <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Booking index urutan penomoran untuk surat dinas</p>
 </div>
 <button
 onClick={() => setIsAddOpen(false)}
 className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition"
 >
 <X size={16} />
 </button>
 </div>

 {/* Modal Form Body */}
 <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs font-semibold text-[var(--text-muted)]">
 
 <div className="p-3.5 bg-[var(--brand-light)] border border-[var(--brand-primary)]/10 rounded-xl">
 <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Generated Number Preview</span>
 <span className="font-mono font-black text-sm text-[var(--brand-primary)] block">{generatedNumber}</span>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block mb-1">Tanggal Pembuatan *</label>
 <input
 type="date"
 required
 value={tanggalPembuatan}
 onChange={(e) => setTanggalPembuatan(e.target.value)}
 className="form-input text-[var(--text-main)]"
 />
 </div>
 <div>
 <label className="block mb-1">Kategori Surat *</label>
 <select
 value={kategori}
 onChange={(e) => setKategori(e.target.value)}
 className="form-input font-bold text-[var(--text-main)]"
 >
 {categories.map((c) => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 </div>
 </div>

 <div>
 <label className="block mb-1">Perihal / Isi Ringkas Surat *</label>
 <input
 type="text"
 required
 placeholder="Contoh: Permohonan Izin Kerja Praktek Lapangan"
 value={perihal}
 onChange={(e) => setPerihal(e.target.value)}
 className="form-input text-[var(--text-main)]"
 />
 </div>

 <div>
 <label className="block mb-1">Instansi / Orang Tujuan Surat *</label>
 <input
 type="text"
 required
 placeholder="Contoh: Kepala Biro Perencanaan Dinas Kesehatan"
 value={tujuan}
 onChange={(e) => setTujuan(e.target.value)}
 className="form-input text-[var(--text-main)]"
 />
 </div>

 {/* Form Footer Buttons */}
 <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
 <button
 type="button"
 onClick={() => setIsAddOpen(false)}
 className="btn btn-secondary text-xs"
 >
 Batal
 </button>
 <button
 type="submit"
 className="btn btn-primary text-xs bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold"
 >
 💾 Simpan & Rilis Nomor
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}

