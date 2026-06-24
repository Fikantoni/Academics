import React, { useState } from "react";
import { Hammer, Search, Plus, Trash2, Calendar, ClipboardList, Check, X, Undo, Filter, ShieldCheck, Tag } from "lucide-react";
import { AppState, Pengguna, PeminjamanAlat } from "../types";

interface LabLendingTabProps {
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

export function LabLendingTab({ currentUser, state, mutate, showToast }: LabLendingTabProps) {
 const [searchTerm, setSearchTerm] = useState("");
 const [filterStatus, setFilterStatus] = useState<"Semua" | "Menunggu" | "Disetujui" | "Ditolak" | "Dikembalikan">("Semua");
 const [isAddOpen, setIsAddOpen] = useState(false);

 // Form states (Student Loan Request)
 const [namaAlat, setNamaAlat] = useState("Mikroskop Binokuler Olympus CX23");
 const [jumlah, setJumlah] = useState(1);
 const [tanggalPinjam, setTanggalPinjam] = useState(new Date().toISOString().substring(0, 10));
 const [tanggalKembali, setTanggalKembali] = useState(
 new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
 ); // Default 7 days
 const [tujuanPenggunaan, setTujuanPenggunaan] = useState("");

 const listPeminjaman = state.peminjamanAlat || [];

 const handleAddSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!namaAlat || !tujuanPenggunaan || jumlah <= 0) {
 showToast("Harap isi semua kolom dengan benar!", "warning");
 return;
 }

 // Find student details
 const student = state.mahasiswa?.find((m) => m.email === currentUser.email);
 
 const payload: Omit<PeminjamanAlat, "id">= {
 mahasiswaEmail: currentUser.email,
 namaMahasiswa: currentUser.nama || "Mahasiswa",
 nimMahasiswa: student?.nim || "-",
 namaAlat,
 jumlah,
 tanggalPinjam,
 tanggalKembali,
 tujuanPenggunaan,
 status: "Menunggu",
 catatan: "",
 };

 try {
 await mutate("peminjamanAlat", "add", payload);
 showToast("Permohonan peminjaman alat laboratorium berhasil diajukan!", "success");
 setTujuanPenggunaan("");
 setJumlah(1);
 setIsAddOpen(false);
 } catch {
 showToast("Gagal mengajukan peminjaman.", "error");
 }
 };

 const handleUpdateStatus = async (id: string, newStatus: PeminjamanAlat["status"], catatanNote = "") => {
 try {
 await mutate(
 "peminjamanAlat",
 "update",
 { status: newStatus, catatan: catatanNote, petugasApprove: currentUser.nama || "Staff Admin" },
 "id",
 id
 );
 showToast(`Peminjaman berhasil diperbarui menjadi: ${newStatus}`, "success");
 } catch {
 showToast("Gagal memperbarui status peminjaman.", "error");
 }
 };

 const handleDelete = async (id: string) => {
 if (!window.confirm("Apakah Anda yakin ingin menghapus data peminjaman ini?")) return;
 try {
 await mutate("peminjamanAlat", "delete", {}, "id", id);
 showToast("Data peminjaman berhasil dihapus.", "success");
 } catch {
 showToast("Gagal menghapus data peminjaman.", "error");
 }
 };

 const isStudent = currentUser.role === "Mahasiswa";
 const isAdminOrProdi = currentUser.role === "Admin" || currentUser.role === "Superadmin" || currentUser.role === "Prodi";

 // Filter list
 const filteredList = listPeminjaman.filter((p) => {
 // Student can only see their own requests
 if (isStudent && p.mahasiswaEmail !== currentUser.email) return false;

 const matchesSearch =
 p.namaMahasiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
 p.nimMahasiswa.includes(searchTerm) ||
 p.namaAlat.toLowerCase().includes(searchTerm.toLowerCase());

 const matchesStatus = filterStatus === "Semua" || p.status === filterStatus;

 return matchesSearch && matchesStatus;
 });

 const availableEquipment = [
 "Mikroskop Binokuler Olympus CX23",
 "Timbangan Analitik Shimadzu",
 "Centrifuge Benchtop Hettich",
 "Autoclave Portable",
 "Spectrophotometer UV-Vis",
 "pH Meter Benchtop Hanna",
 "Hotplate Stirrer IKA",
 "Lab Refrigerator & Freezer",
 "Laminar Air Flow (LAF)",
 ];

 return (
 <div className="space-y-6 text-left font-sans">
 {/* Header Context */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)]">
 <div>
 <span className="text-xs font-bold text-[var(--brand-primary)] uppercase tracking-wider block mb-1">
 Layanan Sarana & Prasarana
 </span>
 <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
 Peminjaman Alat Laboratorium
 </h2>
 <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
 Sistem pengajuan inventaris alat praktikum & riset mahasiswa Fakultas Ilmu Kesehatan & Psikologi.
 </p>
 </div>

 {isStudent && (
 <button
 onClick={() => setIsAddOpen(true)}
 className="btn btn-primary text-xs flex items-center gap-2 cursor-pointer"
 >
 <Plus size={15} /> Ajukan Peminjaman Alat
 </button>
 )}
 </div>

 {/* Stats Cards (Admin view shows totals, Student shows personal stats) */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="card p-5 border border-[var(--border-color)] flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-300 flex items-center justify-center text-xl shrink-0">
 <ClipboardList size={20} />
 </div>
 <div>
 <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Total Peminjaman</div>
 <div className="text-2xl font-extrabold text-[var(--text-main)]">{filteredList.length} Transaksi</div>
 </div>
 </div>

 <div className="card p-5 border border-[var(--border-color)] flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-300 flex items-center justify-center text-xl shrink-0">
 <Filter size={20} />
 </div>
 <div>
 <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Menunggu Persetujuan</div>
 <div className="text-2xl font-extrabold text-[var(--text-main)]">
 {filteredList.filter((p) => p.status === "Menunggu").length} Transaksi
 </div>
 </div>
 </div>

 <div className="card p-5 border border-[var(--border-color)] flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-xl shrink-0">
 <ShieldCheck size={20} />
 </div>
 <div>
 <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Aktif Dipinjam</div>
 <div className="text-2xl font-extrabold text-[var(--text-main)]">
 {filteredList.filter((p) => p.status === "Disetujui").length} Transaksi
 </div>
 </div>
 </div>

 <div className="card p-5 border border-[var(--border-color)] flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xl shrink-0">
 <Undo size={20} />
 </div>
 <div>
 <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Sudah Dikembalikan</div>
 <div className="text-2xl font-extrabold text-[var(--text-main)]">
 {filteredList.filter((p) => p.status === "Dikembalikan").length} Transaksi
 </div>
 </div>
 </div>
 </div>

 {/* Main Table Layout */}
 <div className="card border border-[var(--border-color)] p-0 overflow-hidden">
 {/* Table Controls */}
 <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-base)] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
 <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
 <div className="relative max-w-xs w-full">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
 <input
 type="text"
 placeholder="Cari Alat / Mahasiswa / NIM..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="form-input text-xs font-semibold pl-9 py-1.5"
 />
 </div>

 <select
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value as any)}
 className="form-input text-xs py-1.5 px-3 w-40 cursor-pointer bg-[var(--bg-surface)] border-[var(--border-color)]"
 >
 <option value="Semua">Semua Status</option>
 <option value="Menunggu">Menunggu</option>
 <option value="Disetujui">Disetujui</option>
 <option value="Ditolak">Ditolak</option>
 <option value="Dikembalikan">Dikembalikan</option>
 </select>
 </div>

 <div className="text-[11px] text-[var(--text-muted)] font-mono">
 Total Ditemukan: <b>{filteredList.length}</b> transaksi
 </div>
 </div>

 {/* Data List Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-[var(--border-color)] bg-[var(--bg-base)]/50 text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-muted)]">
 <th className="py-3 px-4">Nama Mahasiswa (NIM)</th>
 <th className="py-3 px-4">Alat Lab & Jumlah</th>
 <th className="py-3 px-4">Tanggal Pinjam - Kembali</th>
 <th className="py-3 px-4">Tujuan Penggunaan</th>
 <th className="py-3 px-4">Status</th>
 <th className="py-3 px-4 text-center">Tindakan / Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border-color)] text-xs font-medium">
 {filteredList.length > 0 ? (
 filteredList.map((p) => (
 <tr key={p.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
 <td className="py-4 px-4">
 <div className="font-extrabold text-[var(--text-main)]">{p.namaMahasiswa}</div>
 <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">NIM: {p.nimMahasiswa}</div>
 <span className="block text-[9px] text-[var(--text-disabled)] mt-1 truncate max-w-[150px]">{p.mahasiswaEmail}</span>
 </td>
 <td className="py-4 px-4">
 <div className="font-extrabold text-[var(--text-main)] flex items-center gap-1.5">
 <span className="p-1 rounded bg-[var(--brand-light)] text-[var(--brand-primary)]">
 <Hammer size={12} />
 </span>
 {p.namaAlat}
 </div>
 <div className="text-[10px] text-[var(--text-muted)] font-bold mt-1 bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] inline-block px-2 py-0.5 rounded">
 Jumlah: {p.jumlah} Unit
 </div>
 </td>
 <td className="py-4 px-4 whitespace-nowrap">
 <div className="flex items-center gap-1 text-[var(--text-main)]">
 <Calendar size={12} className="text-slate-400" />
 <span>{p.tanggalPinjam} s/d {p.tanggalKembali}</span>
 </div>
 {p.petugasApprove && p.status === "Disetujui" && (
 <span className="block text-[9px] text-[var(--brand-primary)] mt-1">Disahkan: {p.petugasApprove}</span>
 )}
 </td>
 <td className="py-4 px-4 max-w-xs leading-relaxed text-[var(--text-muted)]">
 {p.tujuanPenggunaan}
 {p.catatan && (
 <div className="text-[9.5px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-1.5 rounded border border-amber-100 dark:border-amber-900/30 mt-1">
 Catatan: {p.catatan}
 </div>
 )}
 </td>
 <td className="py-4 px-4 whitespace-nowrap">
 <span className={`pill ${
 p.status === "Disetujui" ? "pill-success" :
 p.status === "Dikembalikan" ? "pill-info text-blue-700 bg-blue-50 border-blue-200" :
 p.status === "Ditolak" ? "pill-danger" : "pill-warning"
 }`}>
 {p.status}
 </span>
 </td>
 <td className="py-4 px-4">
 <div className="flex justify-center gap-1.5">
 {/* Admin approval actions */}
 {isAdminOrProdi && p.status === "Menunggu" && (
 <>
 <button
 onClick={() => handleUpdateStatus(p.id, "Disetujui")}
 className="btn text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded cursor-pointer flex items-center gap-0.5"
 title="Setujui Pinjam"
 >
 <Check size={11} className="stroke-[3]" /> Setujui
 </button>
 <button
 onClick={() => {
 const note = window.prompt("Tulis alasan penolakan peminjaman:") || "";
 if (note.trim()) handleUpdateStatus(p.id, "Ditolak", note);
 }}
 className="btn text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-2.5 rounded cursor-pointer flex items-center gap-0.5"
 title="Tolak Pinjam"
 >
 <X size={11} className="stroke-[3]" /> Tolak
 </button>
 </>
 )}

 {/* Admin return action */}
 {isAdminOrProdi && p.status === "Disetujui" && (
 <button
 onClick={() => {
 const note = window.prompt("Catatan kondisi alat setelah dikembalikan (opsional):") || "";
 handleUpdateStatus(p.id, "Dikembalikan", note);
 }}
 className="btn text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded cursor-pointer flex items-center gap-0.5"
 title="Tandai Alat Sudah Kembali"
 >
 <Undo size={11} /> Kembalikan Alat
 </button>
 )}

 {/* Delete history */}
 {isAdminOrProdi && (
 <button
 onClick={() => handleDelete(p.id)}
 className="p-1.5 text-rose-500 hover:text-rose-750 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
 title="Hapus Data"
 >
 <Trash2 size={13} />
 </button>
 )}

 {!isAdminOrProdi && p.status === "Menunggu" && (
 <span className="text-[10px] text-[var(--text-disabled)] italic font-semibold">Menunggu Verifikasi</span>
 )}
 {!isAdminOrProdi && p.status !== "Menunggu" && (
 <span className="text-[10px] text-[var(--text-disabled)] font-bold">Terproses</span>
 )}
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="py-12 text-center text-[var(--text-muted)] italic font-semibold">
 Tidak ada transaksi peminjaman alat laboratorium.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Modal Add Lending Request (Student View) */}
 {isAddOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
 <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-color)] shadow-[var(--shadow-lg)] w-full max-w-md overflow-hidden animate-slide-entry">
 {/* Modal Header */}
 <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-base)] flex justify-between items-center">
 <div>
 <h3 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wider">
 🧪 Ajukan Peminjaman Alat Laboratorium
 </h3>
 <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Ajukan permohonan inventaris untuk praktikum / riset</p>
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
 <div>
 <label className="block mb-1">Pilih Alat Laboratorium *</label>
 <select
 value={namaAlat}
 onChange={(e) => setNamaAlat(e.target.value)}
 className="form-input font-bold text-[var(--text-main)]"
 >
 {availableEquipment.map((eq) => (
 <option key={eq} value={eq}>{eq}</option>
 ))}
 </select>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block mb-1">Jumlah Unit *</label>
 <input
 type="number"
 min={1}
 required
 value={jumlah}
 onChange={(e) => setJumlah(Number(e.target.value))}
 className="form-input text-[var(--text-main)] font-extrabold"
 />
 </div>
 <div>
 <label className="block mb-1">Tanggal Pinjam *</label>
 <input
 type="date"
 required
 value={tanggalPinjam}
 onChange={(e) => setTanggalPinjam(e.target.value)}
 className="form-input text-[var(--text-main)]"
 />
 </div>
 </div>

 <div>
 <label className="block mb-1">Estimasi Tanggal Pengembalian *</label>
 <input
 type="date"
 required
 value={tanggalKembali}
 onChange={(e) => setTanggalKembali(e.target.value)}
 className="form-input text-[var(--text-main)]"
 />
 </div>

 <div>
 <label className="block mb-1">Tujuan Penggunaan & Keperluan Riset *</label>
 <textarea
 rows={4}
 required
 placeholder="Contoh: Pengujian mikrobiologis sampel stunting balita di wilayah kerja puskesmas untuk Bab 4 draf akhir..."
 value={tujuanPenggunaan}
 onChange={(e) => setTujuanPenggunaan(e.target.value)}
 className="form-input font-medium text-[var(--text-main)] leading-relaxed"
 />
 <span className="text-[9px] text-[var(--text-disabled)] font-normal block mt-1">
 Harap jaga kondisi alat dengan baik. Kelalaian atau kerusakan menjadi tanggung jawab peminjam.
 </span>
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
 🧪 Kirim Permohonan Pinjam
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}

