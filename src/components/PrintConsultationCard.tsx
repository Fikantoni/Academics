import React from "react";
import { Printer, X, FileText, CheckCircle2, Download, Loader2 } from "lucide-react";
import { Konsultasi, Mahasiswa, Dosen } from "../types";
import { printElementById, downloadStandaloneHtml, downloadPdfFromElement } from "../utils/printHelper";

interface PrintConsultationCardProps {
 session: Konsultasi;
 allSessions: Konsultasi[];
 logo: string | null;
 mahasiswaList: Mahasiswa[];
 dosenList: Dosen[];
 onClose: () => void;
 showToast?: (msg: string, type?: "success" | "warning" | "error" | "info") => void;
}

export function PrintConsultationCard({
 session,
 allSessions,
 logo,
 mahasiswaList,
 dosenList,
 onClose,
 showToast,
}: PrintConsultationCardProps) {
 // Find related student and lecturer info
 const student = mahasiswaList.find(
 (m) => m.email.toLowerCase() === session.mahasiswaEmail.toLowerCase()
 );
 
 const lecturer = dosenList.find(
 (d) => d.email.toLowerCase() === session.dosenEmail.toLowerCase()
 );

 // Filter all sessions for this specific student and lecturer to create a comprehensive card,
 // sorted chronologically by date
 const studentLecturerSessions = allSessions
 .filter(
 (s) =>
 s.mahasiswaEmail.toLowerCase() === session.mahasiswaEmail.toLowerCase() &&
 s.dosenEmail.toLowerCase() === session.dosenEmail.toLowerCase()
 )
 .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

 const getFormatDate = (dateStr: string) => {
 if (!dateStr) return "-";
 const d = new Date(dateStr);
 if (isNaN(d.getTime())) return dateStr;
 return d.toLocaleDateString("id-ID", {
 day: "numeric",
 month: "long",
 year: "numeric",
 });
 };

 const triggerPrint = () => {
 printElementById("print-area");
 };

 const [isDownloading, setIsDownloading] = React.useState(false);

 const downloadPDF = async () => {
 setIsDownloading(true);
 if (showToast) {
 showToast("Sedang menyiapkan unduhan dokumen PDF...", "info");
 }
 
 const safeName = session.namaMahasiswa.replace(/[^a-z0-9]/gi, "_").toLowerCase();
 const filename = `Kartu_Bimbingan_Tugas_Akhir_${safeName}.pdf`;

 const success = await downloadPdfFromElement("print-area", filename);
 if (success) {
 if (showToast) {
 showToast("Kartu bimbingan tugas akhir berhasil diunduh!", "success");
 }
 } else {
 if (showToast) {
 showToast("Gagal memproses dokumen PDF. Silakan gunakan tombol cetak manual (kemudian pilih Simpan sebagai PDF).", "error");
 }
 }
 setIsDownloading(false);
 };

 // State to toggle between: "single" (Topic only) or "all" (Full official card)
 const [printMode, setPrintMode] = React.useState<"all" | "single">("all");

 const downloadHTML = () => {
 const safeName = session.namaMahasiswa.replace(/[^a-z0-9]/gi, "_").toLowerCase();
 const filename = `Kartu_Bimbingan_Tugas_Akhir_${safeName}.html`;
 const success = downloadStandaloneHtml("print-area", filename);
 if (success && showToast) {
 showToast("File cetak HTML mandiri berhasil diunduh! Silakan buka file tersebut untuk mencetak dengan lancar.", "success");
 } else if (showToast) {
 showToast("Gagal mempersiapkan lembar cetak HTML.", "error");
 }
 };

 return (
 <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-start p-4 md:p-8 overflow-y-auto print-modal">
 
 {/* Floating control bar */}
 <div className="bg-[var(--bg-surface)] w-full max-w-4xl p-4 rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shadow-lg no-print">
 <div className="text-left">
 <span className="text-[10px] uppercase tracking-widest font-extrabold text-[var(--text-disabled)] block mb-1">
 EKSPOR & CETAK RESMI
 </span>
 <h4 className="text-sm font-extrabold text-[var(--text-main)]">
 Kartu Kendali Konsultasi Tugas Akhir
 </h4>
 <p className="text-[11px] text-[var(--text-muted)] mt-1">
 Mahasiswa: <b className="text-[var(--text-main)]">{session.namaMahasiswa}</b> | Dosen: <b className="text-[var(--text-main)]">{session.namaDosen}</b>
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
 {/* Mode Selector */}
 <div className="flex bg-[var(--bg-base)] border border-[var(--border-color)] p-1 rounded-lg text-xs font-semibold">
 <button
 onClick={() => setPrintMode("all")}
 className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
 printMode === "all"
 ? "bg-[var(--brand-primary)] text-white font-bold"
 : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
 }`}
 >
 Komprehensif (Semua Sesi)
 </button>
 <button
 onClick={() => setPrintMode("single")}
 className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
 printMode === "single"
 ? "bg-[var(--brand-primary)] text-white font-bold"
 : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
 }`}
 >
 Sesi Aktif Saja
 </button>
 </div>

 <button
 onClick={triggerPrint}
 className="btn btn-primary text-xs flex items-center gap-1.5 font-bold px-4 py-2 hover:opacity-90"
 title="Mencetak kartu langsung melalui browser (bisa terhambat oleh iFrame)"
 >
 <Printer size={14} /> Cetak Kartu
 </button>

 <button
 onClick={downloadPDF}
 disabled={isDownloading}
 className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-md flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
 title="Unduh Lembar Kartu Kendali sebagai fail PDF Resmi"
 >
 {isDownloading ? (
 <>
 <Loader2 size={14} className="animate-spin" />
 <span>Mengunduh...</span>
 </>
 ) : (
 <>
 <Download size={14} />
 <span>Unduh PDF</span>
 </>
 )}
 </button>

 <button
 onClick={downloadHTML}
 className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-md flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
 title="Alternatif Handal: Unduh lembar cetak HTML mandiri untuk dicetak langsung dari komputer Anda"
 >
 <Download size={14} />
 <span>Alternatif Cetak (HTML)</span>
 </button>
 
 <button
 onClick={onClose}
 className="p-2 border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-base)] rounded-lg transition-colors cursor-pointer"
 title="Tutup Panel"
 >
 <X size={15} />
 </button>
 </div>
 </div>

 {/* Printable Sheet Area */}
 <div
 id="print-area"
 className="bg-white text-black p-[1.8cm] w-full max-w-[21.5cm] min-h-[33cm] shadow-2xl rounded-sm border border-neutral-300 text-left relative"
 style={{ color: "#000", background: "#fff", fontFamily: "'Times New Roman', Times, serif" }}
 >
 {/* Kop Surat Universitas */}
 <div 
 className="relative flex items-center justify-center border-b-4 border-double border-black pb-3 mb-6 min-h-[105px]"
 style={{ fontFamily: "'Times New Roman', Times, serif" }}
 >
 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[95px] h-[95px] flex items-center justify-center">
 {logo ? (
 <img src={logo} alt="Logo" className="w-[90px] h-[90px] object-contain" referrerPolicy="no-referrer" />
 ) : (
 <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-300 flex items-center justify-center text-2xl font-extrabold text-[#0d9488]">
 UM
 </div>
 )}
 </div>
 <div className="text-center px-16">
 <h1 className="text-[15px] md:text-[17px] font-bold uppercase tracking-wide leading-tight text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 UNIVERSITAS MUHAMMADIYAH PONTIANAK
 </h1>
 <h2 className="text-[12px] md:text-[13px] font-bold uppercase tracking-wide leading-tight mt-0.5 text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI
 </h2>
 <h2 className="text-[11px] md:text-[12px] font-bold uppercase tracking-wide leading-tight mt-0.5 text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 PROGRAM PASCASARJANA - FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI (S2)
 </h2>
 <p className="text-[9.5px] md:text-[10px] leading-snug mt-1 italic text-black font-medium" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 Alamat: Jl. Jend. Ahmad Yani No. 111, Pontianak, Kalimantan Barat 78124<br />
 Email: fikpsi@unmuhpnk.ac.id | Telp: (0561) 764571 | Website: fikpsi.unmuhpnk.ac.id
 </p>
 </div>
 </div>

 {/* Title Content */}
 <div className="text-center mb-6">
 <h3 className="text-[15px] font-black uppercase tracking-wider underline">
 KARTU KENDALI BIMBINGAN & KONSULTASI TUGAS AKHIR
 </h3>
 <p className="text-[11px] font-medium tracking-tight mt-0.5">
 Semester Aktivitas Berjalan TA: {new Date().getFullYear()}/{new Date().getFullYear()+1}
 </p>
 </div>

 {/* Identity Grid */}
 <div className="grid grid-cols-12 gap-y-1.5 text-[12px] mb-6 pb-4 border-b border-neutral-200">
 <div className="col-span-3 font-semibold text-neutral-600">Nama Mahasiswa</div>
 <div className="col-span-9 font-bold">: {session.namaMahasiswa}</div>

 <div className="col-span-3 font-semibold text-neutral-600">NIM / Reg. ID</div>
 <div className="col-span-9 font-bold">: {student?.nim || "-"}</div>

 <div className="col-span-3 font-semibold text-neutral-600">Program Studi</div>
 <div className="col-span-9">: Fakultas Ilmu Kesehatan dan Psikologi (S2)</div>

 <div className="col-span-3 font-semibold text-neutral-600">Dosen Pembimbing</div>
 <div className="col-span-9 font-bold">: {session.namaDosen} {lecturer?.nidn ? `(NIDN: ${lecturer.nidn})` : ""}</div>

 <div className="col-span-3 font-semibold text-neutral-600">Draf / Judul Penelitian</div>
 <div className="col-span-9 italic font-medium">
 : "{student?.judul || "Topik penelitian umum"}"
 </div>
 </div>

 {/* Dynamic Mode Heading */}
 <div className="mb-3">
 <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">
 TIPE LAPORAN: {printMode === "all" ? "REKAPITULASI KOMPREHENSIF SEMUA SESI" : "TINJAUAN SESIS SPESIFIK"}
 </span>
 <p className="text-[11px] text-neutral-500 italic">
 {printMode === "all"
 ? "Menampilkan seluruh riwayat dan log diskusi bimbingan terverifikasi sistem antara mahasiswa dengan dosen pembimbing terkait."
 : `Menampilkan isi detail percakapan dari topik diskusi spesifik: "${session.subjek}"`}
 </p>
 </div>

 {/* Table of consultations for mode "all" */}
 {printMode === "all" ? (
 <table className="w-full border-collapse border border-neutral-300 text-[11px] text-left leading-normal">
 <thead>
 <tr className="bg-neutral-50 border-b border-neutral-300 text-neutral-700 font-bold">
 <th className="border border-neutral-300 px-3 py-2.5 text-center w-[5%]">No.</th>
 <th className="border border-neutral-300 px-3 py-2.5 w-[15%]">Tanggal</th>
 <th className="border border-neutral-300 px-3 py-2.5 w-[40%]">Topik Bahasan / Subjek</th>
 <th className="border border-neutral-300 px-3 py-2.5 text-center w-[20%]">Ttd Mahasiswa</th>
 <th className="border border-neutral-300 px-3 py-2.5 text-center w-[20%]">Ttd Dosen</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-200">
 {studentLecturerSessions.map((s, idx) => {
 // Get last reply from chat logs if balasan is not set
 let lastResponse = s.balasan || "";
 if (!lastResponse && s.riwayatChat && s.riwayatChat.length > 0) {
 const replyMsgs = s.riwayatChat.filter(m => m.pengirim === s.namaDosen);
 if (replyMsgs.length > 0) {
 lastResponse = replyMsgs[replyMsgs.length - 1].pesan;
 }
 }

 return (
 <tr key={s.id} className="hover:bg-neutral-50/50 align-top">
 <td className="border border-neutral-300 p-2.5 text-center font-bold">{idx + 1}</td>
 <td className="border border-neutral-300 p-2.5 font-medium whitespace-nowrap">
 {getFormatDate(s.tanggal)}
 </td>
 <td className="border border-neutral-300 p-2.5 font-bold text-neutral-800">
 {s.subjek}
 </td>
 <td className="border border-neutral-300 p-2 text-center align-middle">
 <div className="flex flex-col items-center justify-center py-1">
 <div className="border border-emerald-200 bg-emerald-50 text-emerald-800 rounded px-1.5 py-0.5 text-[8.5px] font-bold inline-flex items-center gap-1">
 <CheckCircle2 size={10} className="text-emerald-600" />
 <span>TERVERIFIKASI</span>
 </div>
 <span className="text-[10px] font-semibold text-neutral-800 tracking-tight mt-1 truncate max-w-[120px]">
 {s.namaMahasiswa}
 </span>
 <div className="w-[80px] border-b border-dashed border-neutral-300 my-1"></div>
 <span className="text-[8px] text-neutral-400 font-mono uppercase">Paraf Mhs</span>
 </div>
 </td>
 <td className="border border-neutral-300 p-2 text-center align-middle bg-neutral-50/20">
 <div className="flex flex-col items-center justify-center py-1">
 {lastResponse ? (
 <>
 <div className="border border-emerald-200 bg-emerald-50 text-emerald-800 rounded px-1.5 py-0.5 text-[8.5px] font-bold inline-flex items-center gap-1">
 <CheckCircle2 size={10} className="text-emerald-600" />
 <span>DISETUJUI</span>
 </div>
 <span className="text-[10px] font-semibold text-neutral-800 tracking-tight mt-1 truncate max-w-[120px]">
 {s.namaDosen}
 </span>
 <div className="w-[80px] border-b border-dashed border-neutral-300 my-1"></div>
 <span className="text-[8px] text-neutral-400 font-mono uppercase">Paraf Dosen</span>
 </>
 ) : (
 <div className="flex flex-col items-center justify-center p-1">
 <div className="w-[80px] border-b border-dotted border-neutral-300 my-2"></div>
 <span className="text-[8.5px] text-neutral-400 italic font-medium">Belum diparaf</span>
 </div>
 )}
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 ) : (
 /* Detailed Single Thread Mode (Useful for deep record) */
 <div className="border border-neutral-300 rounded p-4 text-[12px] bg-neutral-50/50 space-y-4">
 <div className="border-b border-neutral-200 pb-2 mb-2">
 <h4 className="font-extrabold text-[13px] text-neutral-800">Topik Diskusi: {session.subjek}</h4>
 <p className="text-[11px] text-neutral-500">Dimulai Pada: {getFormatDate(session.tanggal)}</p>
 </div>
 
 {/* Base Question */}
 <div className="space-y-1">
 <div className="flex justify-between font-bold text-neutral-800 text-[11px]">
 <span>[MAHASISWA] {session.namaMahasiswa}</span>
 <span className="font-mono">{getFormatDate(session.tanggal)}</span>
 </div>
 <p className="p-2.5 bg-white border border-neutral-200 italic text-[11px] text-justify rounded">
 "{session.pesan}"
 </p>
 </div>

 {/* Chat list */}
 {session.riwayatChat && session.riwayatChat.length > 0 && (
 <div className="space-y-3.5 pt-2 border-t border-neutral-200">
 <span className="text-[10px] font-bold text-neutral-400 block uppercase">Log Riwayat Diskusi Kontak:</span>
 {session.riwayatChat.map((chat, cIdx) => (
 <div key={cIdx} className="space-y-1">
 <div className="flex justify-between font-extrabold text-neutral-700 text-[10px]">
 <span>{chat.pengirim}</span>
 <span className="font-mono text-[9px] opacity-85">{getFormatDate(chat.waktu)}</span>
 </div>
 <p className="p-2.5 bg-white border border-neutral-100 italic text-[11px] text-justify rounded">
 "{chat.pesan}"
 </p>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Validation Checkmark for Digital Authencity */}
 <div className="mt-8 flex items-center gap-3 p-3 border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-sm text-[11px] leading-relaxed">
 <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={18} />
 <div>
 <p className="font-bold">Dokumen Digital Terverifikasi & Disahkan</p>
 <p className="font-medium opacity-90">
 Kartu bimbingan ini diterbitkan secara elektronik oleh Sistem Informasi Administrasi (Academics). 
 Seluruh riwayat chat, paraf, status tanggapan dosen pembimbing telah tersinkronisasi murni dari log aktivitas database cloud resmi.
 </p>
 </div>
 </div>

 {/* Signature Footer Row */}
 <div className="grid grid-cols-12 gap-4 text-[12px] mt-12 pt-6">
 <div className="col-span-6 text-center">
 <p className="mb-14">Mahasiswa Bersangkutan,</p>
 <p className="font-bold underline">{session.namaMahasiswa}</p>
 <p className="text-[10px] opacity-75 font-mono">NIM: {student?.nim || "-"}</p>
 </div>
 
 <div className="col-span-6 text-center">
 <p className="mb-14">Dosen Pembimbing,</p>
 <p className="font-bold underline">{session.namaDosen}</p>
 <p className="text-[10px] opacity-75 font-mono">NIDN: {lecturer?.nidn || "-"}</p>
 </div>
 </div>

 {/* Watermark / Print Timestamp helper */}
 <div className="absolute bottom-4 left-8 right-8 flex justify-between text-[8px] text-neutral-400 font-mono no-print">
 <span>Academics UM Pontianak - {new Date().getFullYear()}</span>
 <span>Dicetak otomatis pada: {new Date().toLocaleString("id-ID")}</span>
 </div>

 </div>

 </div>
 );
}


