import React, { useState, useEffect } from "react";
import { Send, Smartphone, Users, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { AppState, Dosen, JadwalSidang, Pengguna } from "../types";

interface WaReminderModalProps {
 schedule: JadwalSidang;
 state: AppState;
 currentUser: Pengguna | null;
 onClose: () => void;
 showToast: (msg: string, type?: "success" | "warning" | "error") => void;
}

export default function WaReminderModal({
 schedule,
 state,
 currentUser,
 onClose,
 showToast
}: WaReminderModalProps) {
 // Read WhatsApp settings keys
 const settings = state.pengaturan || [];
 const waStatus = settings.find((p) => p.id === "wa_status")?.value || "Nonaktif";
 const waProvider = settings.find((p) => p.id === "wa_gateway_provider")?.value || "Fonnte";
 
 // Recipient profiles
 const mahasiswa = state.mahasiswa.find((m) => m.id === schedule.mahasiswaId);
 const lecturer1 = state.dosen.find((d) => d.email === schedule.penguji1);
 const lecturer2 = state.dosen.find((d) => d.email === schedule.penguji2);

 // States for phones & customized drafts
 const [targetType, setTargetType] = useState<"mhs" | "dosen1" | "dosen2" | "audiens">("mhs");
 const [phoneNo, setPhoneNo] = useState("");
 const [customMessage, setCustomMessage] = useState("");
 const [isSending, setIsSending] = useState(false);
 const [logs, setLogs] = useState<{ time: string; text: string; status: "success" | "error" | "simulated" }[]>([]);

 // Default templates matching database or standard fallback
 const getTemplate = (id: string, defaultText: string) => {
 return settings.find((p) => p.id === id)?.value || defaultText;
 };

 const tplMhs = getTemplate("wa_template_mhs", "Yth. {nama}, Jadwal {kegiatan} Anda telah terbit. Tanggal: {tanggal}, Jam: {waktu} WIB, Ruang: {ruang}. Harap bersiap menghadapi ujian. Link Meet: {link}");
 const tplDosen = getTemplate("wa_template_dosen", "Yth. Dr/Bapak/Ibu {nama}, Mohon kehadirannya selaku dewan penguji pada Jadwal {kegiatan} Mahasiswa {mahasiswa} ({nim}). Tanggal: {tanggal}, Jam: {waktu} WIB, Ruang: {ruang}. Link Meet: {link}");
 const tplAudiens = getTemplate("wa_template_audiens", "INFO PASCA: Hadirilah & saksikan Seminar/Sidang {kegiatan} Mahasiswa: {mahasiswa} pada Tanggal: {tanggal}, Jam: {waktu} WIB di {ruang} sebagai bekal persiapan ujian Anda!");

 // Compile variables
 const variables = {
 nama: "",
 kegiatan: schedule.jenisUjian || "Sidang Tugas Akhir",
 tanggal: schedule.tanggal || "-",
 waktu: schedule.waktu || "-",
 ruang: schedule.ruang || "-",
 link: schedule.meetLink || "Tatap Muka",
 mahasiswa: schedule.namaMahasiswa || "-",
 nim: mahasiswa?.nim || "-"
 };

 const parseTpl = (tpl: string, recipientName: string) => {
 return tpl
 .replace(/{nama}/g, recipientName)
 .replace(/{kegiatan}/g, variables.kegiatan)
 .replace(/{tanggal}/g, variables.tanggal)
 .replace(/{waktu}/g, variables.waktu)
 .replace(/{ruang}/g, variables.ruang)
 .replace(/{link}/g, variables.link)
 .replace(/{mahasiswa}/g, variables.mahasiswa)
 .replace(/{nim}/g, variables.nim);
 };

 // Pre-populate settings on target change
 useEffect(() => {
 if (targetType === "mhs") {
 setPhoneNo("081234567890"); // Placeholder or default digit for student
 setCustomMessage(parseTpl(tplMhs, schedule.namaMahasiswa));
 } else if (targetType === "dosen1") {
 setPhoneNo("085233214455"); // Placeholder for examiner 1
 const link = `${window.location.origin}?rsvp=yes&id=${schedule.id}&role=penguji1&name=${encodeURIComponent(lecturer1?.nama || "Dosen Penguji 1")}`;
 setCustomMessage(parseTpl(tplDosen, lecturer1?.nama || "Dosen Penguji 1") + `\n\nKonfirmasi RSVP Kehadiran Cepat:\n?? ${link}`);
 } else if (targetType === "dosen2") {
 setPhoneNo("089677884433"); // Placeholder for examiner 2
 const link = `${window.location.origin}?rsvp=yes&id=${schedule.id}&role=penguji2&name=${encodeURIComponent(lecturer2?.nama || "Dosen Penguji 2")}`;
 setCustomMessage(parseTpl(tplDosen, lecturer2?.nama || "Dosen Penguji 2") + `\n\nKonfirmasi RSVP Kehadiran Cepat:\n?? ${link}`);
 } else if (targetType === "audiens") {
 setPhoneNo("081299001122"); // Target representative/representative group coordinator
 setCustomMessage(parseTpl(tplAudiens, "Rekan-rekan Mahasiswa"));
 }
 }, [targetType, schedule]);

 const handleSendWa = async () => {
 if (!phoneNo || phoneNo.length < 5) {
 showToast("Harap masukkan nomor tujuan WhatsApp yang valid!", "warning");
 return;
 }

 setIsSending(true);
 try {
 const resp = await fetch("/api/wa/send", {
 method: "POST",
 headers: {
 "Content-Type": "application/json"
 },
 body: JSON.stringify({
 phone: phoneNo,
 message: customMessage,
 recipientName: targetType === "mhs" ? schedule.namaMahasiswa : targetType === "dosen1" ? (lecturer1?.nama || "Penguji") : targetType === "dosen2" ? (lecturer2?.nama || "Penguji 2") : "Audiens Kelas",
 role: targetType.toUpperCase(),
 user: currentUser
 })
 });

 const body = await resp.json();
 if (resp.ok) {
 if (body.simulated) {
 showToast("Pengingat berhasil diuji (Mode Simulasi)!", "success");
 setLogs((prev) => [
 {
 time: new Date().toLocaleTimeString(),
 text: `?? Berhasil disimulasikan ke ${phoneNo} (${targetType}): ${customMessage.substring(0, 40)}...`,
 status: "simulated"
 },
 ...prev
 ]);
 } else {
 showToast("Notifikasi WhatsApp berhasil dikirim via Live Gateway!", "success");
 setLogs((prev) => [
 {
 time: new Date().toLocaleTimeString(),
 text: `?? Sukses dikirim via ${waProvider} ke ${phoneNo}`,
 status: "success"
 },
 ...prev
 ]);
 }
 } else {
 showToast(body.error || "Gagal mengirimkan WhatsApp.", "error");
 setLogs((prev) => [
 {
 time: new Date().toLocaleTimeString(),
 text: `? Error (${waProvider}): ${body.error || "Gagal terhubung"}`,
 status: "error"
 },
 ...prev
 ]);
 }
 } catch (err: any) {
 console.error(err);
 showToast("Koneksi API bermasalah.", "error");
 setLogs((prev) => [
 {
 time: new Date().toLocaleTimeString(),
 text: `? Kegagalan Jaringan: ${err.message}`,
 status: "error"
 },
 ...prev
 ]);
 } finally {
 setIsSending(false);
 }
 };

 return (
 <div className="space-y-4 text-left font-sans">
 <div className="flex items-center gap-2 mb-2 p-2.5 bg-indigo-50/60 dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 rounded-xl">
 <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
 <p className="text-[10px] text-indigo-950 dark:text-indigo-300 font-medium leading-relaxed">
 Posisikan Academics untuk mengirimkan berkas pengingat jadwal langsung ke ponsel bersangkutan. 
 Gunakan switch di bawah untuk meninjau masing-masing target.
 </p>
 </div>

 {/* Target Navigation Tab Buttons */}
 <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg gap-1 border border-slate-200/50 dark:border-slate-800">
 <button
 type="button"
 onClick={() => setTargetType("mhs")}
 className={`flex-1 py-1.5 px-2.5 rounded-md text-[10px] font-extrabold text-center transition cursor-pointer ${
 targetType === "mhs"
 ? "bg-white dark:bg-slate-950 text-indigo-700 dark:text-indigo-400 shadow-sm"
 : "text-slate-500 hover:text-slate-700"
 }`}
 >
 ?? Mahasiswa
 </button>
 <button
 type="button"
 onClick={() => setTargetType("dosen1")}
 className={`flex-1 py-1.5 px-1 rounded-md text-[10px] font-extrabold text-center transition cursor-pointer truncate ${
 targetType === "dosen1"
 ? "bg-white dark:bg-slate-950 text-indigo-700 dark:text-indigo-400 shadow-sm"
 : "text-slate-500 hover:text-slate-700"
 }`}
 title={lecturer1?.nama || "Penguji 1"}
 >
 ?? Penguji 1 {lecturer1 ? "?" : ""}
 </button>
 <button
 type="button"
 onClick={() => setTargetType("dosen2")}
 className={`flex-1 py-1.5 px-1 rounded-md text-[10px] font-extrabold text-center transition cursor-pointer truncate ${
 targetType === "dosen2"
 ? "bg-white dark:bg-slate-950 text-indigo-700 dark:text-indigo-400 shadow-sm"
 : "text-slate-500 hover:text-slate-700"
 }`}
 title={lecturer2?.nama || "Penguji 2"}
 >
 ?? Penguji 2 {lecturer2 ? "?" : ""}
 </button>
 <button
 type="button"
 onClick={() => setTargetType("audiens")}
 className={`flex-1 py-1.5 px-2.5 rounded-md text-[10px] font-extrabold text-center transition cursor-pointer ${
 targetType === "audiens"
 ? "bg-white dark:bg-slate-950 text-indigo-700 dark:text-indigo-400 shadow-sm"
 : "text-slate-500 hover:text-slate-700"
 }`}
 >
 ?? Audiens
 </button>
 </div>

 {/* Target Content Editor */}
 <div className="space-y-3.5 pt-1.5">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
 <div className="form-group">
 <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
 <Smartphone size={12} className="text-slate-400" />
 Nomor WhatsApp Penerima
 </label>
 <input
 type="text"
 value={phoneNo}
 onChange={(e) => setPhoneNo(e.target.value)}
 className="form-input text-xs font-semibold"
 placeholder="e.g. 081234567890"
 />
 </div>

 <div className="p-2 border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 rounded-lg">
 <span className="text-[9.5px] font-extrabold text-slate-500 uppercase block mb-0.5">Target Penerima:</span>
 <span className="text-xs font-extrabold text-[var(--text-main)]">
 {targetType === "mhs" && `${schedule.namaMahasiswa} (Mahasiswa)`}
 {targetType === "dosen1" && `${lecturer1?.nama || "Dosen Penguji 1"}`}
 {targetType === "dosen2" && `${lecturer2?.nama || "Dosen Penguji 2"}`}
 {targetType === "audiens" && "Siaran Ringkas Forum (Broadcast)"}
 </span>
 </div>
 </div>

 <div className="form-group">
 <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1">
 Tinjau Isi Pesan (Editor Teks Langsung)
 </label>
 <textarea
 value={customMessage}
 onChange={(e) => setCustomMessage(e.target.value)}
 rows={5}
 className="form-input text-xs font-semibold leading-relaxed font-sans"
 placeholder="Ketik isi pesan pengingat khusus..."
 />
 </div>

 {/* Action Button */}
 <div className="flex items-center justify-between gap-4 pt-1">
 <div className="text-[10px] text-slate-400 font-semibold max-w-[240px]">
 {waStatus === "Aktif" ? (
 <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
 ? Live Mode (Kirim nyata menggunakan {waProvider} API Gateway)
 </span>
 ) : (
 <span className="text-rose-600 font-extrabold flex items-center gap-1">
 ? Mode Simulasi Aktif (Pesan disimpan di Log Audit Trail)
 </span>
 )}
 </div>

 <button
 type="button"
 onClick={handleSendWa}
 disabled={isSending}
 className="btn btn-primary text-xs font-bold px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
 >
 {isSending ? (
 <>
 <RefreshCw size={13} className="animate-spin" />
 Mengirim...
 </>
 ) : (
 <>
 <Send size={13} />
 Kirim Pengingat
 </>
 )}
 </button>
 </div>
 </div>

 {/* Interactive logs inside the modal */}
 <div className="border-t border-[var(--border-color)] pt-4 mt-3">
 <h4 className="text-[10px] font-extrabold text-[var(--text-main)] uppercase tracking-wider mb-2">
 ?? Riwayat Pengiriman Baru (Internal Session Log)
 </h4>
 {logs.length > 0 ? (
 <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
 {logs.map((log, idx) => (
 <div 
 key={idx} 
 className={`p-2 rounded text-[10px] font-semibold flex justify-between gap-3 ${
 log.status === "error" 
 ? "bg-rose-50 dark:bg-rose-950/20 text-rose-750" 
 : "bg-emerald-500/5 text-emerald-800 dark:text-emerald-350"
 }`}
 >
 <span className="truncate leading-relaxed">{log.text}</span>
 <span className="text-[9px] text-slate-400 flex items-center shrink-0">{log.time}</span>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-[9.5px] text-slate-400 italic font-semibold">
 Belum ada notifikasi yang diproses pada sesi ini. Klik "Kirim Pengingat" di atas untuk memulai pengujian.
 </p>
 )}
 </div>

 <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
 <button
 type="button"
 onClick={onClose}
 className="btn btn-secondary text-xs font-bold px-4 py-1.5 cursor-pointer"
 >
 Tutup Panel WA
 </button>
 </div>
 </div>
 );
}

