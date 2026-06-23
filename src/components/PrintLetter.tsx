import React, { useEffect, useState } from "react";
import { Printer, X, Download, Loader2 } from "lucide-react";
import { PesanSurat, Mahasiswa } from "../types";
import { printElementById, downloadStandaloneHtml, downloadPdfFromElement } from "../utils/printHelper";

interface PrintLetterProps {
 surat: PesanSurat;
 logo: string | null;
 mahasiswaList: Mahasiswa[];
 onClose: () => void;
}

export function PrintLetter({
 surat,
 logo,
 mahasiswaList,
 onClose,
}: PrintLetterProps) {
 const m = mahasiswaList.find((x) => x.email.toLowerCase() === surat.mahasiswaEmail.toLowerCase());
 const nim = m ? m.nim : "-";
 
 const nomorSurat = surat.nomorSurat || `098/II.3.AU.15/A/${new Date().getFullYear()}`;
 const getFormatDate = (dateStr: string) => {
 if (!dateStr) return new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
 const d = new Date(dateStr);
 if (isNaN(d.getTime())) {
 return dateStr || "-";
 }
 return d.toLocaleDateString("id-ID", {
 day: "numeric",
 month: "long",
 year: "numeric",
 });
 };
 const tglFormatted = getFormatDate(surat.tanggal);

 const [isDownloading, setIsDownloading] = useState(false);

 // Automatically trigger print on load or view
 const triggerPrint = () => {
 printElementById("print-area");
 };

 const handleDownloadPDF = async () => {
 setIsDownloading(true);
 const safeName = surat.namaMahasiswa.replace(/[^a-z0-9]/gi, "_").toLowerCase();
 const docType = surat.jenisSurat.replace(/[^a-z0-9]/gi, "_").toLowerCase();
 const filename = `Surat_${docType}_${safeName}.pdf`;
 
 await downloadPdfFromElement("print-area", filename);
 setIsDownloading(false);
 };

 const handleDownloadHTML = () => {
 const safeName = surat.namaMahasiswa.replace(/[^a-z0-9]/gi, "_").toLowerCase();
 const docType = surat.jenisSurat.replace(/[^a-z0-9]/gi, "_").toLowerCase();
 const filename = `Surat_${docType}_${safeName}.html`;
 downloadStandaloneHtml("print-area", filename);
 };

 return (
 <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-start p-4 md:p-8 overflow-y-auto print-modal">
 
 {/* Control floating actions panel */}
 <div className="bg-[var(--bg-surface)] w-full max-w-4xl p-4 rounded-xl border border-[var(--border-color)] flex justify-between items-center mb-6 shadow-lg no-print">
 <div>
 <span className="text-xs font-bold text-[var(--text-disabled)] uppercase tracking-widest block leading-none mb-1">Cetak Surat Resmi</span>
 <h4 className="text-sm font-extrabold text-[var(--text-main)]">
 {surat.jenisSurat} - {surat.namaMahasiswa}
 </h4>
 </div>
 <div className="flex flex-wrap gap-2.5">
 <button
 onClick={triggerPrint}
 className="btn btn-primary text-xs flex items-center gap-1.5 font-bold cursor-pointer"
 title="Mencetak surat langsung melalui browser (bisa terhambat oleh iFrame)"
 >
 <Printer size={14} /> Cetak Kartu
 </button>

 <button
 onClick={handleDownloadPDF}
 disabled={isDownloading}
 className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-md flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
 title="Unduh Surat sebagai fail PDF Resmi"
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
 onClick={handleDownloadHTML}
 className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-md flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
 title="Alternatif Handal: Unduh lembar cetak HTML mandiri untuk dicetak langsung dari komputer Anda"
 >
 <Download size={14} />
 <span>Alternatif Cetak (HTML)</span>
 </button>

 <button
 onClick={onClose}
 className="p-2 border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-base)] rounded-lg transition-colors cursor-pointer"
 title="Tutup Preview"
 >
 <X size={15} />
 </button>
 </div>
 </div>

 {/* LET'S EMBED THE VISUAL PRINT OUT SHEET MOCKUP - ID: print-area */}
 <div
 id="print-area"
 className="bg-white text-black p-[1.8cm] w-full max-w-[21.5cm] min-h-[33cm] shadow-2xl rounded-sm border border-neutral-200 text-left relative"
 style={{ color: "#000", background: "#fff", fontFamily: "'Times New Roman', Times, serif" }}
 >
 {/* Kop Surat Header */}
 <div 
 className="relative flex items-center justify-center border-b-4 border-double border-black pb-3 mb-6 min-h-[105px]"
 style={{ fontFamily: "'Times New Roman', Times, serif" }}
 >
 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[95px] h-[95px] flex items-center justify-center">
 {logo ? (
 <img src={logo} alt="Logo Instansi" className="w-[90px] h-[90px] object-contain" referrerPolicy="no-referrer" />
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
 PROGRAM STUDI FAKULTAS ILMU KESEHATAN DAN PSIKOLOGI (S2)
 </h2>
 <p className="text-[9.5px] md:text-[10px] leading-snug mt-1 italic text-black font-medium" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
 Alamat: Jl. Jend. Ahmad Yani No. 111, Pontianak, Kalimantan Barat 78124<br />
 Email: fikpsi@unmuhpnk.ac.id | Telp: (0561) 764571 | Website: fikpsi.unmuhpnk.ac.id
 </p>
 </div>
 </div>

 {/* Nomor, Lampiran, Perihal Block */}
 <div className="grid grid-cols-12 gap-1 text-[13px] leading-relaxed mb-6">
 <div className="col-span-2 font-semibold">Nomor</div>
 <div className="col-span-5">: {nomorSurat}</div>
 <div className="col-span-5 text-right font-medium">Pontianak, {tglFormatted}</div>

 <div className="col-span-2 font-semibold">Lampiran</div>
 <div className="col-span-10">: 1 (Satu) Berkas Proposal</div>

 <div className="col-span-2 font-semibold">Perihal</div>
 <div className="col-span-10">
 : <b className="uppercase underline">{surat.jenisSurat}</b>
 </div>
 </div>

 {/* Destination Address */}
 <div className="text-[13px] leading-relaxed mb-6">
 <p className="font-semibold mb-1">Kepada Yth.</p>
 <p className="font-bold underline">{surat.tujuanSurat}</p>
 <p className="font-medium">Di -</p>
 <p className="pl-4 italic font-medium">Tempat</p>
 </div>

 {/* Surat Body Message */}
 <div className="text-[13px] leading-relaxed space-y-4 mb-8 text-justify">
 <p>Dengan hormat,</p>
 <p>
 Sehubungan dengan syarat penyelesaian tugas akhir penulisan <b>tugas akhir</b> pada kurikulum Program Studi 
 Fakultas Ilmu Kesehatan dan Psikologi Universitas Muhammadiyah Pontianak, kami menginformasikan 
 bahwa mahasiswa yang bersangkutan sedang melaksanakan kegiatan penyusunan <b>tugas akhir</b>.
 </p>
 <p>
 Untuk kelancaran pemenuhan naskah analisis draf penelitian, kami memohon kesediaan Bapak/Ibu 
 pimpinan instansi terkait untuk memberikan dukungan berupa izin pelaksanaan pengumpulan data dan survei lapangan kepada:
 </p>
 
 {/* Student Profile Block */}
 <div className="pl-8 py-2 border-l-2 border-neutral-300 space-y-1.5 my-4 bg-neutral-50/50">
 <div>
 <span className="inline-block w-32 font-semibold">Nama Mahasiswa</span>
 <span>: <b>{surat.namaMahasiswa}</b></span>
 </div>
 <div>
 <span className="inline-block w-32 font-semibold">NIM Mahasiswa</span>
 <span>: <b>{nim}</b></span>
 </div>
 <div>
 <span className="inline-block w-32 font-semibold">Program Studi</span>
 <span>: Fakultas Ilmu Kesehatan dan Psikologi (S2)</span>
 </div>
 </div>

 <div>
 <span className="font-semibold block mb-1">Fokus Bidang Keperluan:</span>
 <p className="italic bg-neutral-50 p-2.5 rounded-sm border border-neutral-100 text-[12px]">
 "{surat.keperluan}"
 </p>
 </div>

 <div>
 <span className="font-semibold block mb-1">Kebutuhan Data Spesifik:</span>
 <p className="italic bg-neutral-50 p-2.5 rounded-sm border border-neutral-100 text-[12px]">
 "{surat.dataDiperlukan}"
 </p>
 </div>

 <p>
 Demikian surat permohonan ini kami sampaikan secara resmi. Atas partisipasi, perhatian tinggi, serta 
 kerja sama baik Bapak/Ibu sekalian, kami sampaikan limpahan terima kasih.
 </p>
 </div>

 {/* Signature Box */}
 <div className="grid grid-cols-12 gap-2 text-[13px] mt-12">
 <div className="col-span-6"></div>
 <div className="col-span-6 text-center">
 <p className="mb-1">Ketua Program Studi</p>
 <p className="font-semibold mb-16">Fakultas Ilmu Kesehatan dan Psikologi (FIKPsi)</p>
 
 <p className="font-bold underline leading-none">Andri Dwi Hernawan, S.K.M., M. Kes (Epid)</p>
 <p className="text-[11px] font-medium opacity-80 mt-1">NIK: 1234.110.086</p>
 </div>
 </div>

 {/* Carbon copy block */}
 <div className="border-t border-dashed border-neutral-400 pt-3 mt-14 text-[11px] leading-normal opacity-90">
 <p className="font-bold uppercase tracking-wider mb-1">Tembusan Kepada Yth :</p>
 <ol className="list-decimal pl-4 italic">
 <li>Arsip Fakultas Ilmu Kesehatan dan Psikologi Kantor Dekanat</li>
 <li>Dosen Pembimbing Akademik</li>
 <li>Mahasiswa yang Bersangkutan</li>
 </ol>
 </div>

 </div>

 </div>
 );
}


