import React, { useState } from "react";
import { FolderOpen, Search, Plus, Trash2, FileText, ArrowDownLeft, ArrowUpRight, Calendar, Tag, X } from "lucide-react";
import { AppState, Pengguna, ArsipSurat } from "../types";

interface MailArchiveTabProps {
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

export function MailArchiveTab({ currentUser, state, mutate, showToast }: MailArchiveTabProps) {
 const [searchTerm, setSearchTerm] = useState("");
 const [filterJenis, setFilterJenis] = useState<"Semua" | "Masuk" | "Keluar">("Semua");
 const [filterKategori, setFilterKategori] = useState("Semua");
 const [isAddOpen, setIsAddOpen] = useState(false);

 // Form states
 const [nomorSurat, setNomorSurat] = useState("");
 const [judulSurat, setJudulSurat] = useState("");
 const [jenis, setJenis] = useState<"Masuk" | "Keluar">("Masuk");
 const [pengirimOrPenerima, setPengirimOrPenerima] = useState("");
 const [tanggalSurat, setTanggalSurat] = useState(new Date().toISOString().substring(0, 10));
 const [kategori, setKategori] = useState("Undangan");
 const [keterangan, setKeterangan] = useState("");
 const [fileNama, setFileNama] = useState("");

 const handleAddSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!nomorSurat || !judulSurat || !pengirimOrPenerima) {
 showToast("Harap isi semua kolom wajib!", "warning");
 return;
 }

 const payload: Omit<ArsipSurat, "id">= {
 nomorSurat,
 judulSurat,
 jenis,
 pengirimOrPenerima,
 tanggalSurat,
 tanggalArsip: new Date().toISOString().substring(0, 10),
 kategori,
 keterangan,
 fileNama: fileNama || "dokumen_arsip_scan.pdf",
 };

 try {
 await mutate("arsipSurat", "add", payload);
 showToast("Dokumen berhasil diarsipkan!", "success");
 // Reset form
 setNomorSurat("");
 setJudulSurat("");
 setPengirimOrPenerima("");
 setKeterangan("");
 setFileNama("");
 setIsAddOpen(false);
 } catch {
 showToast("Gagal menyimpan dokumen arsip.", "error");
 }
 };

 const handleDelete = async (id: string) => {
 if (!window.confirm("Apakah Anda yakin ingin menghapus arsip surat ini?")) return;
 try {
 await mutate("arsipSurat", "delete", {}, "id", id);
 showToast("Arsip surat berhasil dihapus.", "success");
 } catch {
 showToast("Gagal menghapus arsip surat.", "error");
 }
 };

 const listArsip = state.arsipSurat || [];
 const filteredArsip = listArsip.filter((a) => {
 const matchesSearch =
 a.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
 a.judulSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
 a.pengirimOrPenerima.toLowerCase().includes(searchTerm.toLowerCase());
 
 const matchesJenis = filterJenis === "Semua" || a.jenis === filterJenis;
 const matchesKategori = filterKategori === "Semua" || a.kategori === filterKategori;
 
 return matchesSearch && matchesJenis && matchesKategori;
 });

 const categories = ["Undangan", "Tugas", "Keputusan", "Permohonan", "Kerjasama", "Edaran", "Lainnya"];

 const isAdminOrProdi = currentUser.role === "Admin" || currentUser.role === "Superadmin" || currentUser.role === "Prodi";

 return (
 <div className="space-y-6 text-left font-sans">
 {/* Header Context */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)]">
 <div>
 <span className="text-xs font-bold text-[var(--brand-primary)] uppercase tracking-wider block mb-1">
 Layanan Administrasi Umum
 </span>
 <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
 Pengarsipan Surat Masuk & Keluar
 </h2>
 <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
 Pusat penyimpanan, pencarian, dan pengelolaan dokumen surat resmi Fakultas Ilmu Kesehatan dan Psikologi.
 </p>
 </div>

 {isAdminOrProdi && (
 <button
 onClick={() => setIsAddOpen(true)}
 className="btn btn-primary text-xs flex items-center gap-2 cursor-pointer"
 >
 <Plus size={15} /> Arsipkan Surat Baru
 </button>
 )}
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="card p-5 border border-[var(--border-color)] flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-300 flex items-center justify-center text-xl shrink-0">
 <FolderOpen size={20} />
 </div>
 <div>
 <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Total Arsip Surat</div>
 <div className="text-2xl font-extrabold text-[var(--text-main)]">{listArsip.length} Berkas</div>
 </div>
 </div>

 <div className="card p-5 border border-[var(--border-color)] flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-xl shrink-0">
 <ArrowDownLeft size={20} />
 </div>
 <div>
 <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Surat Masuk</div>
 <div className="text-2xl font-extrabold text-[var(--text-main)]">
 {listArsip.filter((a) => a.jenis === "Masuk").length} Berkas
 </div>
 </div>
 </div>

 <div className="card p-5 border border-[var(--border-color)] flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xl shrink-0">
 <ArrowUpRight size={20} />
 </div>
 <div>
 <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Surat Keluar</div>
 <div className="text-2xl font-extrabold text-[var(--text-main)]">
 {listArsip.filter((a) => a.jenis === "Keluar").length} Berkas
 </div>
 </div>
 </div>
 </div>

 {/* Main Workspace Layout */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Left Side: Filter Panel */}
 <div className="lg:col-span-3 space-y-6">
 <div className="card p-5 border border-[var(--border-color)]">
 <h3 className="text-xs uppercase font-extrabold text-[var(--text-main)] mb-4 pb-2 border-b border-[var(--border-color)]">
 ⚙️ Penyaringan Arsip
 </h3>

 <div className="space-y-4 text-xs font-semibold text-[var(--text-muted)]">
 <div>
 <label className="block mb-2">Pilih Jenis Surat</label>
 <div className="flex flex-col gap-1.5">
 {(["Semua", "Masuk", "Keluar"] as const).map((t) => (
 <label key={t} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-[var(--bg-surface-hover)]">
 <input
 type="radio"
 name="jenis-filter"
 checked={filterJenis === t}
 onChange={() => setFilterJenis(t)}
 className="accent-[var(--brand-primary)]"
 />
 <span className={filterJenis === t ? "text-[var(--text-main)] font-bold" : ""}>
 {t === "Semua" ? "Semua Surat" : t === "Masuk" ? "Surat Masuk" : "Surat Keluar"}
 </span>
 </label>
 ))}
 </div>
 </div>

 <div className="border-t border-dashed border-[var(--border-color)] pt-3">
 <label className="block mb-1.5">Kategori Dokumen</label>
 <select
 value={filterKategori}
 onChange={(e) => setFilterKategori(e.target.value)}
 className="form-input py-2"
 >
 <option value="Semua">Semua Kategori</option>
 {categories.map((c) => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 </div>
 </div>
 </div>
 </div>

 {/* Right Side: Data Directory */}
 <div className="lg:col-span-9 space-y-6">
 <div className="card border border-[var(--border-color)] p-0 overflow-hidden">
 {/* Table Control Bar */}
 <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-base)] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
 <div className="relative max-w-sm w-full">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
 <input
 type="text"
 placeholder="Cari No. Surat / Judul / Instansi..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="form-input text-xs font-semibold pl-9 py-1.5"
 />
 </div>

 <div className="text-[11px] text-[var(--text-muted)] font-mono">
 Menampilkan <b>{filteredArsip.length}</b> dari {listArsip.length} arsip
 </div>
 </div>

 {/* List Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-[var(--border-color)] bg-[var(--bg-base)]/50 text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-muted)]">
 <th className="py-3 px-4 w-[60px] text-center">Tipe</th>
 <th className="py-3 px-4">Surat Resmi & Nomor</th>
 <th className="py-3 px-4">Kategori & Asal/Tujuan</th>
 <th className="py-3 px-4">Tanggal Surat</th>
 <th className="py-3 px-4">Lampiran</th>
 {isAdminOrProdi && <th className="py-3 px-4 text-center">Aksi</th>}
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border-color)] text-xs font-medium">
 {filteredArsip.length > 0 ? (
 filteredArsip.map((a) => (
 <tr key={a.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
 <td className="py-4 px-4 text-center">
 <span className={`inline-flex items-center justify-center p-1.5 rounded-lg border ${
 a.jenis === "Masuk" 
 ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30" 
 : "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/30"
 }`} title={a.jenis === "Masuk" ? "Surat Masuk" : "Surat Keluar"}>
 {a.jenis === "Masuk" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
 </span>
 </td>
 <td className="py-4 px-4">
 <div className="font-extrabold text-[var(--text-main)]">{a.judulSurat}</div>
 <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{a.nomorSurat}</div>
 {a.keterangan && (
 <div className="text-[10px] text-slate-400 font-normal mt-1 leading-normal italic">
 "{a.keterangan}"
 </div>
 )}
 </td>
 <td className="py-4 px-4">
 <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40 uppercase tracking-wider mb-1">
 <Tag size={8} /> {a.kategori || "Lainnya"}
 </span>
 <div className="text-[11px] text-[var(--text-main)] font-semibold">{a.pengirimOrPenerima}</div>
 </td>
 <td className="py-4 px-4 whitespace-nowrap">
 <div className="flex items-center gap-1.5 text-[var(--text-main)]">
 <Calendar size={12} className="text-slate-400" />
 {a.tanggalSurat}
 </div>
 <span className="block text-[9px] text-[var(--text-disabled)] mt-0.5">Diarsip: {a.tanggalArsip}</span>
 </td>
 <td className="py-4 px-4">
 {a.fileNama ? (
 <a
 href="#"
 onClick={(e) => {
 e.preventDefault();
 showToast(`Membuka berkas lampiran "${a.fileNama}" (Simulasi)...`, "success");
 }}
 className="inline-flex items-center gap-1 text-xs text-[var(--brand-primary)] hover:underline font-bold"
 >
 <FileText size={12} />
 <span className="truncate max-w-[120px]">{a.fileNama}</span>
 </a>
 ) : (
 <span className="text-[10px] text-[var(--text-disabled)]">Tidak ada berkas</span>
 )}
 </td>
 {isAdminOrProdi && (
 <td className="py-4 px-4 text-center">
 <button
 onClick={() => handleDelete(a.id)}
 className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
 title="Hapus Arsip"
 >
 <Trash2 size={14} />
 </button>
 </td>
 )}
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={isAdminOrProdi ? 6 : 5} className="py-12 text-center text-[var(--text-muted)] italic font-semibold">
 Arsip surat tidak ditemukan.
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
 <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-color)] shadow-[var(--shadow-lg)] w-full max-w-lg overflow-hidden animate-slide-entry">
 {/* Modal Header */}
 <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-base)] flex justify-between items-center">
 <div>
 <h3 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wider">
 📥 Arsipkan Dokumen Surat Baru
 </h3>
 <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Daftarkan surat masuk/keluar ke database digital</p>
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
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block mb-1">Jenis Arsip *</label>
 <select
 value={jenis}
 onChange={(e) => setJenis(e.target.value as any)}
 className="form-input font-bold text-[var(--text-main)]"
 >
 <option value="Masuk">Surat Masuk (Incoming)</option>
 <option value="Keluar">Surat Keluar (Outgoing)</option>
 </select>
 </div>
 <div>
 <label className="block mb-1">Kategori Dokumen *</label>
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
 <label className="block mb-1">Nomor Surat Resmi *</label>
 <input
 type="text"
 required
 placeholder="Contoh: 005/II.3.AU.15/F/FIKPsi/2026"
 value={nomorSurat}
 onChange={(e) => setNomorSurat(e.target.value)}
 className="form-input text-[var(--text-main)]"
 />
 </div>

 <div>
 <label className="block mb-1">Perihal / Judul Surat *</label>
 <input
 type="text"
 required
 placeholder="Contoh: Surat Permohonan Izin Kunjungan Industri"
 value={judulSurat}
 onChange={(e) => setJudulSurat(e.target.value)}
 className="form-input text-[var(--text-main)]"
 />
 </div>

 <div>
 <label className="block mb-1">
 {jenis === "Masuk" ? "Instansi Pengirim *" : "Instansi Tujuan Penerima *"}
 </label>
 <input
 type="text"
 required
 placeholder={jenis === "Masuk" ? "Contoh: Kementerian Kesehatan RI" : "Contoh: Puskesmas Pontianak Barat"}
 value={pengirimOrPenerima}
 onChange={(e) => setPengirimOrPenerima(e.target.value)}
 className="form-input text-[var(--text-main)]"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block mb-1">Tanggal Surat *</label>
 <input
 type="date"
 required
 value={tanggalSurat}
 onChange={(e) => setTanggalSurat(e.target.value)}
 className="form-input text-[var(--text-main)]"
 />
 </div>
 <div>
 <label className="block mb-1">Unggah Lampiran Berkas (Mock)</label>
 <input
 type="file"
 onChange={(e) => {
 if (e.target.files && e.target.files.length > 0) {
 setFileNama(e.target.files[0].name);
 }
 }}
 className="form-input text-[var(--text-main)] py-1.5"
 />
 </div>
 </div>

 <div>
 <label className="block mb-1">Keterangan / Abstrak Singkat</label>
 <textarea
 rows={3}
 placeholder="Tulis ringkasan singkat isi surat atau catatan disposisi..."
 value={keterangan}
 onChange={(e) => setKeterangan(e.target.value)}
 className="form-input font-medium text-[var(--text-main)]"
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
 📥 Simpan & Arsipkan
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}

