import React, { useState, useEffect } from "react";
import { 
 X, 
 Download, 
 CheckCircle, 
 AlertTriangle, 
 Edit3, 
 User, 
 Calendar, 
 BookOpen, 
 FileText, 
 Check, 
 Eye,
 MessageSquare,
 Sparkles,
 Loader
} from "lucide-react";
import * as mammoth from "mammoth";
import { DokumenTesis, Pengguna } from "../types";

interface DocumentPreviewModalProps {
 doc: DokumenTesis;
 currentUser: Pengguna;
 onClose: () => void;
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

// Helper to convert base64 to Object URL natively and asymptotically fast
const base64ToBlobUrl = async (dataUrl: string) => {
 try {
 if (!dataUrl) return "";
 if (!dataUrl.startsWith("data:")) return dataUrl; // fallback if already blobUrl or direct path

 // Leverage the browser's native C++ decoding thread by fetching the data URL as a Blob
 // This runs up to 100x faster than character-by-character Javascript loops!
 const response = await fetch(dataUrl);
 const blob = await response.blob();
 return URL.createObjectURL(blob);
 } catch (error) {
 console.error("Gagal mengubah base64 ke Object URL secara native, menggunakan fallback", error);
 // Lightweight sync fallback if fetch fails
 try {
 const parts = dataUrl.split(";base64,");
 if (parts.length < 2) return dataUrl;
 const mime = parts[0].split(":")[1] || "application/pdf";
 const binary = atob(parts[1]);
 const array = new Uint8Array(binary.length);
 for (let i = 0; i < binary.length; i++) {
 array[i] = binary.charCodeAt(i);
 }
 const blob = new Blob([array], { type: mime });
 return URL.createObjectURL(blob);
 } catch (fallbackError) {
 console.error("Fallback base64 conversion failed:", fallbackError);
 return dataUrl;
 }
 }
};

// Helper helper to convert base64 to array buffer asynchronously
const base64ToArrayBufferAsync = async (dataUrl: string): Promise<ArrayBuffer> => {
 try {
 const res = await fetch(dataUrl);
 return await res.arrayBuffer();
 } catch (error) {
 console.warn("Gagal fetch arrayBuffer secara native, menggunakan fallback sync", error);
 const base64Clean = dataUrl.split(";base64,")[1] || dataUrl;
 const binaryString = window.atob(base64Clean);
 const len = binaryString.length;
 const bytes = new Uint8Array(len);
 for (let i = 0; i < len; i++) {
 bytes[i] = binaryString.charCodeAt(i);
 }
 return bytes.buffer;
 }
};

export function DocumentPreviewModal({ 
 doc, 
 currentUser, 
 onClose, 
 mutate, 
 showToast 
}: DocumentPreviewModalProps) {
 // State for Review form input fields
 const [reviewText, setReviewText] = useState(doc.catatanReview || "");
 const [reviewStatus, setReviewStatus] = useState<"Belum Direview" | "Perlu Revisi" | "Disetujui">(
 doc.statusReview || "Belum Direview"
 );
 const [isSavingReview, setIsSavingReview] = useState(false);
 const [pdfUrl, setPdfUrl] = useState<string>("");
 const [wordHtml, setWordHtml] = useState<string>("");
 const [isLoadingWord, setIsLoadingWord] = useState(false);

 const isPdf = doc.tipeFile === "PDF" || doc.namaFile.toLowerCase().endsWith(".pdf");

 useEffect(() => {
 let active = true;
 let createdUrl = "";

 const loadDocument = async () => {
 if (isPdf && doc.fileData) {
 try {
 const url = await base64ToBlobUrl(doc.fileData);
 if (active) {
 createdUrl = url;
 setPdfUrl(url);
 }
 } catch (e) {
 console.error("Failed to render PDF preview:", e);
 }
 } else if (!isPdf && doc.fileData) {
 setIsLoadingWord(true);
 try {
 const arrayBuffer = await base64ToArrayBufferAsync(doc.fileData);
 if (!active) return;
 const result = await mammoth.convertToHtml({ arrayBuffer });
 if (active) {
 setWordHtml(result.value);
 setIsLoadingWord(false);
 }
 } catch (err) {
 console.error("Error reading Word file:", err);
 if (active) {
 setWordHtml("<p>Gagal memuat pratinjau dokumen Word. Format file mungkin tidak didukung atau rusak.</p>");
 setIsLoadingWord(false);
 }
 }
 }
 };

 loadDocument();

 return () => {
 active = false;
 if (createdUrl && createdUrl.startsWith("blob:")) {
 URL.revokeObjectURL(createdUrl);
 }
 };
 }, [doc.fileData, isPdf]);

 // Determine if the current user has rights to review/comment on this file
 // (Lecturers, Admin, Prodi can write reviews. Students can only see them)
 const canReview = [ "Dosen", "Prodi", "Admin", "Superadmin" ].includes(currentUser.role);

 const handleSaveReview = async () => {
 setIsSavingReview(true);
 try {
 const updateData = {
 catatanReview: reviewText,
 statusReview: reviewStatus,
 reviewOleh: currentUser.nama,
 tanggalReview: new Date().toISOString().replace("T", " ").substring(0, 16)
 };

 await mutate("dokumenTesis", "update", updateData, "id", doc.id, true);
 
 // Update local object reference too
 doc.catatanReview = reviewText;
 doc.statusReview = reviewStatus;
 doc.reviewOleh = currentUser.nama;
 doc.tanggalReview = updateData.tanggalReview;

 showToast("Tanggapan review dokumen berhasil disimpan!", "success");
 } catch (err: any) {
 console.error(err);
 showToast(`Gagal menyimpan review: ${err.message || err}`, "error");
 } finally {
 setIsSavingReview(false);
 }
 };

 const triggerDownload = () => {
 try {
 const link = document.createElement("a");
 link.href = doc.fileData;
 link.download = doc.namaFile;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 showToast(`Mengunduh berkas: ${doc.namaFile}`, "success");
 } catch (err) {
 showToast("Gagal mengunduh berkas.", "error");
 }
 };

 return (
 <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-hidden animate-fade-in no-print">
 <div className="bg-[var(--bg-surface)] w-full max-w-6xl h-[92vh] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border-color)] overflow-hidden flex flex-col text-left">
 
 {/* HEADER */}
 <div className="p-4 sm:p-5 bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
 <div className="flex items-center gap-3 overflow-hidden mr-4">
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold ${isPdf ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400" : "bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"}`}>
 <FileText size={22} />
 </div>
 <div className="overflow-hidden">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider bg-[var(--border-color)] text-[var(--text-muted)] border">
 {doc.tipeFile}
 </span>
 {doc.statusReview && (
 <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${
 doc.statusReview === "Disetujui" 
 ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300"
 : doc.statusReview === "Perlu Revisi"
 ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-300"
 : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
 }`}>
 {doc.statusReview}
 </span>
 )}
 </div>
 <h3 className="text-sm font-extrabold tracking-tight text-[var(--text-main)] truncate mt-1.5" title={doc.namaFile}>
 Pratinjau & Review: {doc.namaFile}
 </h3>
 </div>
 </div>
 
 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={triggerDownload}
 className="p-2 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)] transition cursor-pointer"
 title="Unduh Berkas Asli"
 >
 <Download size={16} />
 </button>
 <button 
 onClick={onClose} 
 className="p-2 rounded bg-[var(--bg-surface)] hover:bg-rose-500 hover:text-white text-[var(--text-muted)] border border-[var(--border-color)] hover:border-rose-500 transition cursor-pointer font-extrabold text-xs flex items-center justify-center w-8 h-8"
 >
 <X size={18} />
 </button>
 </div>
 </div>

 {/* WORKSPACE AREA (SPLIT PANEL) */}
 <div className="flex-1 min-h-0 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-color)]">
 
 {/* LEFT COLUMN: THE ATTACHED FILE RENDERER */}
 <div className="flex-1 bg-slate-900/30 dark:bg-black/20 p-4 flex flex-col h-full overflow-hidden">
 <div className="flex items-center justify-between mb-2 shrink-0 text-slate-400">
 <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
 <Eye size={12} /> Lembar Pratinjau Dokumen
 </span>
 <span className="text-[10px] font-semibold">{doc.ukuranFile}</span>
 </div>

 <div className="flex-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden flex items-center justify-center relative min-h-0">
 {isPdf ? (
 pdfUrl ? (
 <iframe 
 src={pdfUrl} 
 className="w-full h-full border-0 bg-[var(--bg-surface)]" 
 title={doc.namaFile} 
 />
 ) : (
 <div className="text-center font-bold text-xs text-[var(--text-muted)] p-4 flex flex-col items-center gap-2">
 <div className="w-6 h-6 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
 Memuat Dokumen Pratinjau...
 </div>
 )
 ) : (
 <div className="w-full h-full justify-center overflow-y-auto bg-white p-8">
 {isLoadingWord ? (
 <div className="flex flex-col items-center justify-center p-12 text-slate-500 h-full">
 <Loader size={32} className="animate-spin text-blue-500 mb-4" />
 <p>Mengekstrak Dokumen Word...</p>
 </div>
 ) : (
 wordHtml ? (
 <div className="prose max-w-none prose-sm text-slate-800" dangerouslySetInnerHTML={{ __html: wordHtml }} />
 ) : (
 <div className="text-center text-slate-500 py-12 flex flex-col items-center">
 <AlertTriangle size={32} className="text-amber-500 mb-2" />
 <p>Pratinjau Word Gagal. Format file mungkin rusak.</p>
 <button onClick={triggerDownload} className="mt-4 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold flex gap-2">
 <Download size={14} /> Unduh Saja
 </button>
 </div>
 )
 )}
 </div>
 )}
 </div>
 </div>

 {/* RIGHT COLUMN: METADATA & REVIEW INPUT BOARD */}
 <div className="w-full lg:w-[380px] bg-[var(--bg-surface)] overflow-y-auto flex flex-col shrink-0 p-5 space-y-4">
 
 {/* DOCUMENT METADATA INFO CARD */}
 <div className="p-3.5 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-xl space-y-3 font-semibold text-xs text-[var(--text-muted)]">
 <h4 className="text-[11px] uppercase tracking-wider text-[var(--text-main)] pb-1.5 border-b border-[var(--border-color)] font-extrabold">
 Detail Berkas Unggahan
 </h4>
 <div>
 <span className="text-slate-400 block text-[10px] uppercase">Terbuka untuk Mahasiswa</span>
 <span className="text-[var(--text-main)] mt-0.5 block truncate font-bold text-[11px]">{doc.namaMahasiswa}</span>
 </div>
 <div>
 <span className="text-slate-400 block text-[10px] uppercase">Judul Penelitian Tugas Akhir</span>
 <p className="text-[var(--text-main)] mt-0.5 line-clamp-2 leading-relaxed font-bold text-[11px]" title={doc.judulTesis}>
 {doc.judulTesis}
 </p>
 </div>
 <div className="grid grid-cols-2 gap-2 pt-1">
 <div>
 <span className="text-slate-400 block text-[10px] uppercase">Diunggah Oleh</span>
 <span className="text-[var(--text-main)] mt-0.5 block truncate text-[11px]">{doc.pengirimNama}</span>
 </div>
 <div>
 <span className="text-slate-400 block text-[10px] uppercase">Tanggal Kirim</span>
 <span className="text-[var(--text-main)] mt-0.5 block text-[11px]">{doc.tanggal}</span>
 </div>
 </div>

 <div className="pt-2 border-t border-[var(--border-color)]/60">
 <span className="text-slate-400 block text-[10px] uppercase mb-1">Catatan Pengantar Pengirim</span>
 <p className="text-[var(--text-main)] italic leading-relaxed text-[11px] p-2 bg-[var(--bg-surface)] border border-[var(--border-color)]/60 rounded">
 &ldquo;{doc.catatan || "Tidak ada catatan pengantar."}&rdquo;
 </p>
 </div>
 </div>

 {/* REVIEW FEEDBACK FIELD */}
 <div className="flex-1 flex flex-col">
 <h4 className="text-[11px] uppercase tracking-wider text-[var(--text-main)] font-extrabold flex items-center gap-1.5 mb-2.5">
 <MessageSquare size={14} className="text-[var(--brand-primary)]" />
 Kolom Review & Evaluasi
 </h4>

 {canReview ? (
 /* WRITE REVIEW MODE FOR LECTURERS/STAFF */
 <div className="space-y-4 flex-1 flex flex-col justify-between">
 <div className="space-y-3.5">
 <div>
 <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">
 Status Kelayakan Berkas
 </label>
 <div className="grid grid-cols-3 gap-2">
 <button
 type="button"
 onClick={() => setReviewStatus("Belum Direview")}
 className={`py-1.5 rounded text-[10px] font-bold border transition cursor-pointer ${
 reviewStatus === "Belum Direview"
 ? "bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 font-extrabold"
 : "bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
 }`}
 >
 Tunda
 </button>
 <button
 type="button"
 onClick={() => setReviewStatus("Perlu Revisi")}
 className={`py-1.5 rounded text-[10px] font-bold border transition cursor-pointer ${
 reviewStatus === "Perlu Revisi"
 ? "bg-amber-500/15 border-amber-300 text-amber-800 dark:text-amber-400 font-extrabold"
 : "bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
 }`}
 >
 Perlu Revisi
 </button>
 <button
 type="button"
 onClick={() => setReviewStatus("Disetujui")}
 className={`py-1.5 rounded text-[10px] font-bold border transition cursor-pointer ${
 reviewStatus === "Disetujui"
 ? "bg-emerald-500/15 border-emerald-300 text-emerald-800 dark:text-emerald-400 font-extrabold"
 : "bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
 }`}
 >
 Disetujui
 </button>
 </div>
 </div>

 <div className="flex-1">
 <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">
 Catatan Koreksi / Feedback Bimbingan
 </label>
 <textarea
 rows={10}
 value={reviewText}
 onChange={(e) => setReviewText(e.target.value)}
 placeholder="Masukkan catatan tinjauan bimbingan, revisi konten yang perlu diperbaiki mahasiswa pada dokumen tugas akhir ini..."
 className="w-full text-xs p-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)] text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] font-semibold leading-relaxed"
 />
 </div>
 </div>

 <button
 onClick={handleSaveReview}
 disabled={isSavingReview}
 className="w-full py-2.5 bg-[var(--brand-primary)] hover:bg-[#4338ca] active:bg-[#083c2e] text-white rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md mt-4 cursor-pointer disabled:opacity-50"
 >
 {isSavingReview ? (
 "Menyimpan Tanggapan..."
 ) : (
 <>
 <Check size={14} /> Simpan Review Evaluasi
 </>
 )}
 </button>
 </div>
 ) : (
 /* READ-ONLY VIEW FOR STUDENTS */
 <div className="space-y-3">
 {doc.catatanReview ? (
 <div className="p-4 bg-emerald-50/50 border border-emerald-100 dark:bg-slate-900 dark:border-slate-800 rounded-xl space-y-3 font-semibold text-xs text-[var(--text-muted)]">
 <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
 <div className="flex items-center gap-2">
 <User size={14} className="text-[var(--brand-primary)] animate-pulse" />
 <div>
 <span className="text-[10px] text-slate-400 block uppercase">Reviewer Eksternal</span>
 <span className="text-[var(--text-main)] font-extrabold">{doc.reviewOleh}</span>
 </div>
 </div>
 <span className="text-[9.5px] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded px-1.5 py-0.5">
 {doc.tanggalReview}
 </span>
 </div>
 <div>
 <span className="text-[10px] text-slate-400 block uppercase mb-1">Feedback Tinjauan Bimbingan:</span>
 <p className="text-[var(--text-main)] whitespace-pre-wrap leading-relaxed italic bg-[var(--bg-surface)] p-3 border border-[var(--border-color)] rounded-lg">
 &ldquo;{doc.catatanReview}&rdquo;
 </p>
 </div>
 </div>
 ) : (
 <div className="p-8 text-center border-2 border-dashed border-[var(--border-color)] rounded-xl space-y-2">
 <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-950/40 text-slate-400 flex items-center justify-center mx-auto">
 <Sparkles size={18} />
 </div>
 <p className="text-xs font-bold text-[var(--text-main)]">Belum Ada Tinjauan</p>
 <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
 Evaluasi langsung belum diterbitkan oleh dosen pembimbing atau prodi untuk draf dokumen ini. Anda akan mendapatkan notifikasi saat review selesai.
 </p>
 </div>
 )}
 </div>
 )}

 </div>

 </div>

 </div>

 </div>
 </div>
 );
}

