import React from "react";
import { 
 LogOut, 
 LayoutDashboard, 
 BookOpen, 
 ShieldCheck, 
 Megaphone, 
 GraduationCap, 
 Presentation, 
 Link2, 
 ClipboardCheck, 
 CalendarDays, 
 FilePlus, 
 Printer, 
 FileCheck, 
 FolderOpen, 
 Settings2, 
 MessageSquare, 
 BookMarked, 
 PenLine, 
 ClipboardList, 
 Sparkles, 
 Mail, 
 PanelLeftClose, 
 PanelLeftOpen 
} from "lucide-react";
import { Pengguna, AppState } from "../types";

// Update NavItemType to use Lucide React icons type
export interface NavItemType {
 id: string;
 icon: React.ComponentType<{ size?: number; className?: string }>;
 label: string;
}

export interface NavGroupHeader {
 type: 'group';
 label: string;
}

interface SidebarProps {
 currentUser: Pengguna;
 activeTab: string;
 onTabChange: (id: string) => void;
 onLogout: () => void;
 logo: string | null;
 state: AppState;
 mobileOpen: boolean;
 onCloseMobile: () => void;
 onProfileClick?: () => void;
 onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({
 currentUser,
 activeTab,
 onTabChange,
 onLogout,
 logo,
 state,
 mobileOpen,
 onCloseMobile,
 onProfileClick,
 onCollapsedChange,
}: SidebarProps) {
 const [collapsed, setCollapsed] = React.useState(false);

 React.useEffect(() => {
 if (onCollapsedChange) {
 onCollapsedChange(collapsed);
 }
 }, [collapsed, onCollapsedChange]);

 const getNavItems = (): (NavItemType | NavGroupHeader)[] => {
 switch (currentUser.role) {
 case "Superadmin":
 return [
 { type: 'group', label: 'UTAMA' },
 { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
 { id: "panduan-sop", icon: BookOpen, label: "Panduan & SOP" },
 { id: "pengumuman", icon: Megaphone, label: "Pengumuman" },

 { type: 'group', label: 'AKADEMIK' },
 { id: "mahasiswa", icon: GraduationCap, label: "Data Mahasiswa" },
 { id: "dosen", icon: Presentation, label: "Data Dosen" },
 { id: "assign", icon: Link2, label: "Assign Pembimbing" },
 { id: "review-judul", icon: ClipboardCheck, label: "Persetujuan Judul" },

 { type: 'group', label: 'ADMINISTRASI' },
 { id: "jadwalsidang", icon: CalendarDays, label: "Jadwal Sidang" },
 { id: "pendaftaran-admin", icon: FilePlus, label: "Pendaftaran Tugas Akhir" },
 { id: "berkas-maju", icon: Printer, label: "Berkas Maju" },
 { id: "surat", icon: FileCheck, label: "Verifikasi Surat" },
 { id: "dokumen-tugas akhir", icon: FolderOpen, label: "Dokumen Tugas Akhir" },

 { type: 'group', label: 'SISTEM' },
 { id: "users", icon: ShieldCheck, label: "Manajemen Akses" },
 { id: "pengaturan", icon: Settings2, label: "Pengaturan" },
 ];
 case "Admin":
 return [
 { type: 'group', label: 'UTAMA' },
 { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
 { id: "panduan-sop", icon: BookOpen, label: "Panduan & SOP" },
 { id: "pengumuman", icon: Megaphone, label: "Pengumuman" },

 { type: 'group', label: 'AKADEMIK' },
 { id: "mahasiswa", icon: GraduationCap, label: "Data Mahasiswa" },
 { id: "dosen", icon: Presentation, label: "Data Dosen" },
 { id: "assign", icon: Link2, label: "Assign Pembimbing" },
 { id: "review-judul", icon: ClipboardCheck, label: "Persetujuan Judul" },

 { type: 'group', label: 'ADMINISTRASI' },
 { id: "jadwalsidang", icon: CalendarDays, label: "Jadwal Sidang" },
 { id: "pendaftaran-admin", icon: FilePlus, label: "Verifikasi Pendaftaran" },
 { id: "berkas-maju", icon: Printer, label: "Berkas Maju" },
 { id: "surat", icon: FileCheck, label: "Verifikasi Surat" },
 { id: "dokumen-tugas akhir", icon: FolderOpen, label: "Dokumen Tugas Akhir" },

 { type: 'group', label: 'SISTEM' },
 { id: "pengaturan", icon: Settings2, label: "Pengaturan" },
 ];
 case "Dosen":
 return [
 { type: 'group', label: 'UTAMA' },
 { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
 { id: "konsultasi-dsn", icon: MessageSquare, label: "Konsultasi" },

 { type: 'group', label: 'AKADEMIK' },
 { id: "panduan-sop", icon: BookOpen, label: "Panduan & SOP" },
 { id: "mhs-bimbingan", icon: BookMarked, label: "Bimbingan (P1/P2)" },
 { id: "review-judul", icon: ClipboardCheck, label: "Review Judul" },

 { type: 'group', label: 'SIDANG' },
 { id: "pendaftaran-admin", icon: PenLine, label: "ACC Seminar & Sidang" },
 { id: "jadwal-menguji", icon: CalendarDays, label: "Jadwal Menguji" },
 { id: "dokumen-tugas akhir", icon: FolderOpen, label: "Dokumen Tugas Akhir" },
 ];
 case "Mahasiswa":
 return [
 { type: 'group', label: 'UTAMA' },
 { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
 { id: "konsultasi-mhs", icon: MessageSquare, label: "Konsultasi" },

 { type: 'group', label: 'TUGAS AKHIR' },
 { id: "panduan-sop", icon: BookOpen, label: "Panduan & SOP" },
 { id: "ajukan-judul", icon: Sparkles, label: "Ajukan Judul" },
 { id: "pendaftaran-mhs", icon: ClipboardList, label: "Daftar Sidang" },
 { id: "dokumen-tugas akhir", icon: FolderOpen, label: "Dokumen Tugas Akhir" },

 { type: 'group', label: 'JADWAL & SURAT' },
 { id: "jadwal-mhs", icon: CalendarDays, label: "Jadwal Sidang" },
 { id: "surat-mhs", icon: Mail, label: "Pesan Surat" },
 ];
 case "Prodi":
 return [
 { type: 'group', label: 'UTAMA' },
 { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
 { id: "panduan-sop", icon: BookOpen, label: "Panduan & SOP" },

 { type: 'group', label: 'AKADEMIK' },
 { id: "review-judul", icon: ClipboardCheck, label: "Persetujuan Judul" },
 { id: "assign", icon: Link2, label: "Penentuan Penguji" },

 { type: 'group', label: 'ADMINISTRASI' },
 { id: "jadwalsidang", icon: CalendarDays, label: "Jadwal Sidang" },
 { id: "pendaftaran-admin", icon: FilePlus, label: "Pendaftaran & Progress" },
 { id: "berkas-maju", icon: Printer, label: "Berkas Maju" },
 { id: "dokumen-tugas akhir", icon: FolderOpen, label: "Dokumen Tugas Akhir" },
 ];
 default:
 return [
 { type: 'group', label: 'UTAMA' },
 { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" }
 ];
 }
 };

 const getBadgeCount = (id: string): number => {
 if (currentUser.role === "Superadmin" || currentUser.role === "Admin") {
 if (id === "surat") {
 return (state.pesanSurat || []).filter((s) => s.status === "Menunggu").length;
 }
 if (id === "pendaftaran-admin") {
 return (state.pendaftaranTesis || []).filter((p) => p.status === "Menunggu").length;
 }
 if (id === "review-judul") {
 return (state.judul || []).filter((j) => j.status === "Menunggu" || j.status === "Telah Dicek Admin").length;
 }
 } else if (currentUser.role === "Dosen") {
 if (id === "konsultasi-dsn") {
 return (state.konsultasi || []).filter(
 (k) => k.dosenEmail === currentUser.email && k.status === "Menunggu"
 ).length;
 }
 if (id === "review-judul") {
 const myAssignmentEmails = (state.bimbingan || [])
 .filter((b) => b.pembimbing1 === currentUser.email || b.pembimbing2 === currentUser.email)
 .map((b) => {
 const mhs = (state.mahasiswa || []).find((m) => m.id === b.mahasiswaId);
 return mhs ? mhs.email : "";
 })
 .filter(Boolean);

 return (state.judul || []).filter(
 (j) => myAssignmentEmails.includes(j.mahasiswaEmail) && j.status === "Menunggu"
 ).length;
 }
 if (id === "pendaftaran-admin") {
 return (state.pendaftaranTesis || []).filter((p) => {
 const studentBimbingan = (state.bimbingan || []).find((b) => {
 const mhs = (state.mahasiswa || []).find((m) => m.email === p.mahasiswaEmail);
 return mhs ? b.mahasiswaId === mhs.id : false;
 });
 if (!studentBimbingan) return false;

 const isPb1 = studentBimbingan.pembimbing1 === currentUser.email && p.accPembimbing1 === "Menunggu";
 const isPb2 = studentBimbingan.pembimbing2 === currentUser.email && p.accPembimbing2 === "Menunggu";
 const isPenguji1 = studentBimbingan.penguji1 === currentUser.email && p.accPenguji1 === "Menunggu";
 const isPenguji2 = studentBimbingan.penguji2 === currentUser.email && p.accPenguji2 === "Menunggu";

 return (isPb1 || isPb2 || isPenguji1 || isPenguji2) && p.status === "Menunggu";
 }).length;
 }
 } else if (currentUser.role === "Mahasiswa") {
 if (id === "konsultasi-mhs") {
 return (state.konsultasi || []).filter(
 (k) => k.mahasiswaEmail === currentUser.email && k.status === "Dibalas"
 ).length;
 }
 } else if (currentUser.role === "Prodi") {
 if (id === "review-judul") {
 return (state.judul || []).filter((j) => j.status === "Menunggu" || j.status === "Telah Dicek Admin").length;
 }
 if (id === "pendaftaran-admin") {
 return (state.pendaftaranTesis || []).filter((p) => p.status === "Menunggu").length;
 }
 }
 return 0;
 };

 const menuItems = getNavItems();

 const handleItemClick = (id: string) => {
 onTabChange(id);
 onCloseMobile();
 };

 const avatarChar = currentUser.nama ? currentUser.nama.charAt(0).toUpperCase() : "U";

 return (
 <>
 {/* Mobile Backdrop Overlay */}
 {mobileOpen && (
 <div
 className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[990] lg:hidden transition-opacity duration-300"
 onClick={onCloseMobile}
 />
 )}

 <aside
 id="simtesis-sidebar"
 className={`${
 collapsed ? "w-[68px]" : "w-[280px]"
 } flex flex-col transition-all duration-300 h-screen fixed lg:static z-[1000] ${
 mobileOpen ? "left-0" : "-left-[280px] lg:left-0"
 }`}
 style={{
 background: "var(--bg-surface)",
 borderRight: "1px solid var(--border-color)",
 }}
 >
 {/* Header Area */}
 <div className={`p-5 flex items-center ${collapsed ? "justify-center" : "justify-between gap-4"} border-b border-[var(--border-color)] relative`}
 style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.04) 0%, transparent 100%)" }}
 >
 <div className="flex items-center gap-3.5 overflow-hidden">
 <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center font-extrabold text-[var(--brand-primary)] text-xl overflow-hidden flex-shrink-0 p-0.5"
 style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)", border: "1px solid rgba(13,148,136,0.2)" }}
 >
 {logo ? (
 <img src={logo} alt="A Logo" className="w-full h-full object-contain rounded-[calc(var(--radius-md)-2px)]" referrerPolicy="no-referrer" />
 ) : (
 <span>A</span>
 )}
 </div>
 {!collapsed && (
 <div className="overflow-hidden">
 <div className="text-[15px] font-extrabold tracking-tight leading-none text-[var(--text-main)]">
 Academics
 </div>
 <div className="text-[9px] font-black tracking-[0.1em] uppercase mt-1.5 truncate"
 style={{ color: "#f59e0b" }}
 >
 ✦ {currentUser.role}
 </div>
 </div>
 )}
 </div>
 <button
 id="toggle-sidebar-collapse"
 onClick={() => setCollapsed(!collapsed)}
 className={`p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--brand-primary)] transition-all hidden lg:flex items-center justify-center ${
 collapsed ? "absolute -right-3 top-5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-full z-50 shadow-md p-1" : ""
 }`}
 title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
 >
 {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
 </button>
 </div>

 {/* Navigation Link Matrix */}
 <nav className="flex-1 px-4 py-5 overflow-y-auto space-y-1.5 scrollbar-thin">
 {menuItems.map((item, index) => {
 if ('type' in item && item.type === 'group') {
 return (
 <div 
 key={`group-${index}`} 
 className={collapsed ? "hidden" : "px-3 pt-4 pb-1 text-[10px] font-bold tracking-[0.08em] uppercase text-[var(--text-muted)] opacity-60 select-none"}
 >
 {item.label}
 </div>
 );
 }

 const active = activeTab === (item as NavItemType).id;
 const badge = getBadgeCount((item as NavItemType).id);

 return (
 <button
 key={(item as NavItemType).id}
 id={`nav-${(item as NavItemType).id}`}
 onClick={() => handleItemClick((item as NavItemType).id)}
 className={`w-full px-3.5 py-2.5 rounded-[var(--radius-md)] flex items-center ${collapsed ? "justify-center" : "gap-3"} text-left font-semibold text-sm transition-all duration-200 cursor-pointer relative group`}
 style={active ? {
 background: "linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%)",
 color: "#ffffff",
 boxShadow: "0 4px 14px rgba(13, 148, 136, 0.3)",
 } : {}}
 title={collapsed ? (item as NavItemType).label : undefined}
 >
 {/* Subtle hover fill when not active */}
 {!active && (
 <span className="absolute inset-0 rounded-[var(--radius-md)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
 style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.07) 0%, rgba(14,165,233,0.04) 100%)" }}
 />
 )}
 {/* Left glow bar for active */}
 {active && (
 <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[55%] bg-white/50 rounded-r-full" />
 )}
 <div className={`flex-shrink-0 flex items-center justify-center ${!active ? "text-[var(--text-muted)] group-hover:text-[var(--brand-primary)]" : ""} transition-colors`}>
 <span className="text-base leading-none">
 {React.createElement((item as NavItemType).icon, { size: 16, className: "flex-shrink-0" })}
 </span>
 </div>
 <span className={`${collapsed ? "hidden" : "flex-1 text-truncate"} ${!active ? "text-[var(--text-muted)] group-hover:text-[var(--text-main)]" : ""} transition-colors`}>
 {(item as NavItemType).label}
 </span>

 {badge > 0 && (
 <span className={
 collapsed 
 ? "absolute top-1 right-1 bg-[var(--accent-danger)] text-white text-[9px] font-extrabold px-1 py-0.5 rounded-full min-w-[16px] text-center"
 : "absolute right-3.5 top-1/2 -translate-y-1/2 bg-[var(--accent-danger)] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
 }>
 {badge}
 </span>
 )}
 </button>
 );
 })}
 </nav>

 {/* User Card Profile Footer */}
 <div className={`p-4 border-t border-[var(--border-color)] flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
 style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.03) 0%, transparent 100%)" }}
 >
 <div 
 onClick={onProfileClick}
 className={`flex items-center ${collapsed ? "justify-center" : "flex-1 gap-3"} overflow-hidden group cursor-pointer hover:bg-[var(--bg-surface-hover)] p-1.5 rounded-[var(--radius-md)] transition-all`}
 title="Suntik foto & Edit Profil"
 >
 <div className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-inner flex-shrink-0 overflow-hidden relative border border-[rgba(13,148,136,0.2)] group-hover:scale-105 transition-transform duration-200"
 style={{ background: "linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%)" }}
 >
 {currentUser.fotoProfil ? (
 <img src={currentUser.fotoProfil} alt={currentUser.nama} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
 ) : (
 avatarChar
 )}
 </div>
 {!collapsed && (
 <div className="flex-1 overflow-hidden">
 <div className="text-[12px] font-bold text-[var(--text-main)] leading-tight text-truncate group-hover:text-[var(--brand-primary)] transition-colors" title={currentUser.nama}>
 {currentUser.nama}
 </div>
 <div className="text-[10px] text-[var(--text-muted)] leading-normal text-truncate" title={currentUser.email}>
 {currentUser.email}
 </div>
 </div>
 )}
 </div>
 {!collapsed && (
 <button
 onClick={onLogout}
 className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-transparent text-[var(--text-muted)] hover:border-[var(--accent-danger-light)] hover:text-[var(--accent-danger)] hover:bg-[var(--accent-danger-light)] transition-all cursor-pointer flex-shrink-0"
 title="Keluar dari Akun"
 >
 <LogOut size={15} />
 </button>
 )}
 </div>
 </aside>
 </>
 );
}

