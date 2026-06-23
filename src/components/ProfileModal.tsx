import React, { useState, useRef } from "react";
import { Upload, X, Shield, Mail, Key, User, Image, Trash2 } from "lucide-react";
import { Pengguna } from "../types";

interface ProfileModalProps {
 currentUser: Pengguna;
 onSave: (data: { nama: string; password?: string; fotoProfil?: string | null }) => Promise<void>;
 onClose: () => void;
 showToast: (msg: string, type: "success" | "warning" | "error") => void;
}

export function ProfileModal({
 currentUser,
 onSave,
 onClose,
 showToast,
}: ProfileModalProps) {
 const [nama, setNama] = useState(currentUser.nama || "");
 const [password, setPassword] = useState("");
 const [fotoProfil, setFotoProfil] = useState<string | null>(currentUser.fotoProfil || null);
 const [isSaving, setIsSaving] = useState(false);
 const [dragOver, setDragOver] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);

 // Convert uploaded image file to Base64 String
 const processImageFile = (file: File) => {
 if (!file.type.startsWith("image/")) {
 showToast("Format berkas tidak didukung. Mohon unggah berkas gambar (PNG, JPG, JPEG).", "error");
 return;
 }
 
 // Validate file size (limit base64 storage to 3MB to keep db.json light)
 if (file.size > 3 * 1024 * 1024) {
 showToast("Ukuran berkas terlalu besar. Maksimal ukuran gambar adalah 3 MB.", "warning");
 return;
 }

 const reader = new FileReader();
 reader.onload = (e) => {
 const base64Data = e.target?.result as string;
 setFotoProfil(base64Data);
 showToast("Foto profil berhasil dimuat! Tekan 'Simpan' untuk memperbarui secara permanen.", "success");
 };
 reader.onerror = () => {
 showToast("Gagal membaca file gambar.", "error");
 };
 reader.readAsDataURL(file);
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 processImageFile(e.target.files[0]);
 }
 };

 const handleDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 setDragOver(true);
 };

 const handleDragLeave = () => {
 setDragOver(false);
 };

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 setDragOver(false);
 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 processImageFile(e.dataTransfer.files[0]);
 }
 };

 const triggerFileInput = () => {
 fileInputRef.current?.click();
 };

 const handleRemovePhoto = () => {
 setFotoProfil(null);
 showToast("Foto profil dihapus (akan kembali ke inisial nama). Tekan 'Simpan' untuk memperbarui.", "info" as any);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!nama.trim()) {
 showToast("Nama lengkap tidak boleh kosong.", "error");
 return;
 }

 setIsSaving(true);
 try {
 const updatedFields: { nama: string; password?: string; fotoProfil?: string | null } = {
 nama: nama.trim(),
 fotoProfil: fotoProfil,
 };

 if (password.trim()) {
 updatedFields.password = password;
 }

 await onSave(updatedFields);
 onClose();
 } catch (err) {
 console.error("Failed to save profile:", err);
 showToast("Terjadi kesalahan saat menyimpan perubahan.", "error");
 } finally {
 setIsSaving(false);
 }
 };

 const avatarChar = currentUser.nama ? currentUser.nama.charAt(0).toUpperCase() : "U";

 return (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
 <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border-color)] overflow-hidden animate-slide-entry text-left">
 
 {/* Header */}
 <div className="p-5 bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] flex justify-between items-center">
 <div className="flex items-center gap-2.5">
 <User size={18} className="text-[var(--brand-primary)]" />
 <h3 className="text-base font-extrabold tracking-tight text-[var(--text-main)]">
 Edit Profil Pengguna
 </h3>
 </div>
 <button 
 onClick={onClose} 
 className="text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] p-1.5 rounded-full transition-all cursor-pointer text-xl leading-none"
 aria-label="Tutup"
 >
 <X size={18} />
 </button>
 </div>

 {/* Content Form */}
 <form onSubmit={handleSubmit} className="p-6 space-y-6">
 
 {/* User Meta Summary (Read only) */}
 <div className="flex items-center gap-4 p-4 rounded-[var(--radius-md)] bg-[var(--bg-surface-hover)] border border-[var(--border-color)]">
 <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[#4338ca] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white/20 overflow-hidden flex-shrink-0">
 {fotoProfil ? (
 <img src={fotoProfil} alt={currentUser.nama} className="w-full h-full object-cover" />
 ) : (
 avatarChar
 )}
 </div>
 <div className="overflow-hidden flex-1">
 <h4 className="text-sm font-bold text-[var(--text-main)] tracking-tight text-truncate">
 {currentUser.nama}
 </h4>
 <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5 text-truncate">
 <Mail size={12} className="opacity-70" />
 <span>{currentUser.email}</span>
 </div>
 <div className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--brand-primary)] flex items-center gap-1 mt-1">
 <Shield size={10} />
 <span>{currentUser.role}</span>
 </div>
 {currentUser.programStudi && (
 <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/30 text-[9px] font-extrabold uppercase tracking-wide mt-1.5">
 🎓 {currentUser.programStudi === "Ilmu Kesehatan Masyarakat" ? "Prodi IKM (S1)" : currentUser.programStudi === "Psikologi" ? "Prodi Psikologi (S1)" : "Prodi MKM (S2)"}
 </div>
 )}
 </div>
 </div>

 {/* Profile Picture Uploader Section */}
 <div className="space-y-2">
 <label className="block text-xs font-bold text-[var(--text-main)] tracking-wide uppercase">
 Foto Profil
 </label>
 <div className="flex flex-col sm:flex-row items-center gap-5">
 
 {/* Profile Preview Indicator */}
 <div className="relative group">
 <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[#4338ca] text-white flex items-center justify-center font-bold text-3xl shadow-xl overflow-hidden border-3 border-[var(--border-color)]">
 {fotoProfil ? (
 <img src={fotoProfil} alt="Preview" className="w-full h-full object-cover" />
 ) : (
 avatarChar
 )}
 </div>
 {fotoProfil && (
 <button
 type="button"
 onClick={handleRemovePhoto}
 className="absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-full shadow-lg border-2 border-[var(--bg-surface)] hover:scale-105 transition-all cursor-pointer"
 title="Hapus foto profil"
 >
 <Trash2 size={13} />
 </button>
 )}
 </div>

 {/* Upload Drop Zone Box */}
 <div
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 onClick={triggerFileInput}
 className={`flex-1 w-full p-4 border-2 border-dashed rounded-[var(--radius-md)] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 bg-[var(--bg-base)] ${
 dragOver
 ? "border-[var(--brand-primary)] bg-[var(--brand-light)]/20 scale-[1.01]"
 : "border-[var(--border-color)] hover:border-[var(--brand-primary)]"
 }`}
 >
 <input
 type="file"
 ref={fileInputRef}
 onChange={handleFileChange}
 accept="image/png, image/jpeg, image/jpg"
 className="hidden"
 />
 <Upload size={22} className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] mb-1.5" />
 <span className="text-xs font-bold text-[var(--text-main)]">
 {dragOver ? "Lepaskan file di sini" : "Tarik foto ke sini, atau klik untuk memilih"}
 </span>
 <span className="text-[10px] text-[var(--text-disabled)] mt-1 font-semibold">
 Mendukung PNG, JPG, JPEG (Maks. 3 MB)
 </span>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 
 {/* Input Name */}
 <div className="space-y-1.5">
 <label htmlFor="input-profile-nama" className="block text-xs font-bold text-[var(--text-main)] tracking-wide uppercase">
 Nama Lengkap
 </label>
 <div className="relative">
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
 <User size={15} />
 </span>
 <input
 id="input-profile-nama"
 type="text"
 value={nama}
 onChange={(e) => setNama(e.target.value)}
 placeholder="Masukkan nama lengkap Anda..."
 className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-color)] text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] bg-[var(--bg-base)] text-[var(--text-main)] transition-all font-semibold"
 required
 />
 </div>
 </div>

 {/* Input Password */}
 <div className="space-y-1.5">
 <label htmlFor="input-profile-pass" className="block text-xs font-bold text-[var(--text-main)] tracking-wide uppercase">
 Ganti Kata Sandi (Opsional)
 </label>
 <div className="relative">
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-semibold">
 <Key size={15} />
 </span>
 <input
 id="input-profile-pass"
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Isi hanya jika ingin mengubah kata sandi..."
 className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-color)] text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] bg-[var(--bg-base)] text-[var(--text-main)] transition-all font-semibold"
 />
 </div>
 <p className="text-[10px] text-[var(--text-muted)] italic leading-normal font-semibold">
 *Kosongkan kolom ini jika Anda tidak ingin mengganti kata sandi login Anda.
 </p>
 </div>
 </div>

 {/* Actions / Footer Buttons inside Modal */}
 <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
 <button
 type="button"
 onClick={onClose}
 disabled={isSaving}
 className="px-4 py-2.5 text-xs font-extrabold text-[var(--text-muted)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] rounded-[var(--radius-sm)] transition-all cursor-pointer"
 >
 Batal
 </button>
 <button
 type="submit"
 disabled={isSaving}
 className="px-5 py-2.5 text-xs font-extrabold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] rounded-[var(--radius-sm)] shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
 >
 {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
 </button>
 </div>

 </form>
 </div>
 </div>
 );
}

