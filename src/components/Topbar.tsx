import React, { useState, useEffect, useRef } from "react";
import { 
 Search, 
 Sun, 
 Moon, 
 Menu, 
 Bell, 
 User, 
 LogOut, 
 Video, 
 ChevronRight,
 X
} from "lucide-react";
import { Pengguna } from "../types";

export interface NotifItem {
 id: string;
 pesan: string;
 waktu: string;
 dibaca: boolean;
 tipe: 'info' | 'warning' | 'success' | 'danger';
 tabTarget?: string;
}

interface TopbarProps {
 title: string;
 searchVal: string;
 onSearchChange: (val: string) => void;
 onToggleSidebar: () => void;
 theme: "light" | "dark";
 onToggleTheme: () => void;
 currentUser: Pengguna;
 googleUser?: any;
 onConnectGoogle?: () => void;
 onDisconnectGoogle?: () => void;
 onManageGoogleMeet?: () => void;
 // Added props
 notifications?: NotifItem[];
 onMarkAllRead?: () => void;
 onProfileClick?: () => void;
 onLogout: () => void;
 fotoProfil?: string;
 breadcrumb?: string[];
}

export function Topbar({
 title,
 searchVal,
 onSearchChange,
 onToggleSidebar,
 theme,
 onToggleTheme,
 currentUser,
 googleUser,
 onConnectGoogle,
 onDisconnectGoogle,
 onManageGoogleMeet,
 notifications = [],
 onMarkAllRead,
 onProfileClick,
 onLogout,
 fotoProfil,
 breadcrumb,
}: TopbarProps) {
 const [notifOpen, setNotifOpen] = useState(false);
 const [avatarOpen, setAvatarOpen] = useState(false);
 const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
 const mobileSearchRef = useRef<HTMLInputElement>(null);

 const notifRef = useRef<HTMLDivElement>(null);
 const avatarRef = useRef<HTMLDivElement>(null);

 const unreadCount = (notifications || []).filter(n => !n.dibaca).length;

 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
 setNotifOpen(false);
 }
 if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
 setAvatarOpen(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => {
 document.removeEventListener("mousedown", handleClickOutside);
 };
 }, []);

 useEffect(() => {
 if (mobileSearchOpen && mobileSearchRef.current) {
 mobileSearchRef.current.focus();
 }
 }, [mobileSearchOpen]);

 const getSearchPlaceholder = () => {
 switch (currentUser.role) {
 case "Superadmin":
 return "Cari database, akses, & log...";
 case "Admin":
 return "Cari data, mahasiswa, verifikasi...";
 case "Prodi":
 return "Cari judul, bimbingan, penguji...";
 case "Dosen":
 return "Cari bimbingan & bincang...";
 case "Mahasiswa":
 return "Cari judul, jadwal, surat...";
 default:
 return "Cari data...";
 }
 };

 const getRoleBadgeStyle = () => {
 switch (currentUser.role) {
 case "Superadmin":
 return "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200";
 case "Admin":
 return "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200";
 case "Prodi":
 return "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200";
 case "Dosen":
 return "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200";
 case "Mahasiswa":
 return "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200";
 default:
 return "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200";
 }
 };

 const getRoleBadgeLabel = () => {
 switch (currentUser.role) {
 case "Superadmin": return "Superadmin";
 case "Admin": return "Administrator";
 case "Prodi": return "Ketua Prodi";
 case "Dosen": return "Dosen Pembimbing";
 case "Mahasiswa": return "Mahasiswa Magister";
 default: return "Pengguna";
 }
 };

 const roleBadgeStyle = getRoleBadgeStyle();
 const roleBadgeLabel = getRoleBadgeLabel();

 return (
 <>
 {/* Mobile Search Overlay */}
 {mobileSearchOpen && (
 <div className="fixed inset-0 z-50 flex flex-col md:hidden">
 <div className="bg-[var(--bg-surface)]/95 backdrop-blur-md border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3 shadow-lg">
 <span className="text-[var(--text-muted)] flex-shrink-0">
 <Search size={16} />
 </span>
 <input
 ref={mobileSearchRef}
 type="text"
 placeholder={getSearchPlaceholder()}
 value={searchVal}
 onChange={(e) => onSearchChange(e.target.value)}
 className="flex-1 bg-transparent text-sm text-[var(--text-main)] placeholder-[var(--text-disabled)] outline-none font-semibold"
 />
 <button
 onClick={() => { setMobileSearchOpen(false); onSearchChange(""); }}
 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)] transition-all cursor-pointer flex-shrink-0"
 >
 <X size={16} />
 </button>
 </div>
 <div
 className="flex-1 bg-slate-900/30 backdrop-blur-sm"
 onClick={() => setMobileSearchOpen(false)}
 />
 </div>
 )}

 <header className="px-6 md:px-8 py-4 bg-[var(--bg-surface)] border-b border-[var(--border-color)] flex items-center justify-between gap-4 transition-colors duration-300 z-10 sticky top-0">
 
 {/* Left side: Hamburger, Breadcrumbs & Title */}
 <div className="flex items-center gap-3 md:gap-4">
 <button
 onClick={onToggleSidebar}
 className="p-1.5 rounded-[var(--radius-sm)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] lg:hidden text-[var(--text-main)] cursor-pointer transition-all leading-none flex items-center justify-center"
 aria-label="Toggle Sidebar"
 >
 <Menu size={20} />
 </button>
 
 <div className="flex flex-col">
 {breadcrumb && breadcrumb.length > 0 && (
 <div className="text-[10px] text-[var(--text-muted)] font-medium hidden md:flex items-center gap-1 mb-0.5">
 {breadcrumb.map((crumb, i) => (
 <span key={i} className="flex items-center gap-1">
 {i > 0 && <ChevronRight size={10} className="opacity-40" />}
 <span className={i === breadcrumb.length - 1 ? 'text-[var(--text-main)] font-semibold' : ''}>{crumb}</span>
 </span>
 ))}
 </div>
 )}
 <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-[var(--text-main)]">
 {title}
 </h2>
 </div>
 </div>

 {/* Right side: Search, Notifications, Avatar Theme Button */}
 <div className="flex items-center gap-3.5">
 <div className="relative hidden md:block w-[240px] md:w-[280px]">
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
 <Search size={15} />
 </span>
 <input
 type="text"
 placeholder={getSearchPlaceholder()}
 value={searchVal}
 onChange={(e) => onSearchChange(e.target.value)}
 className="w-full pl-10 pr-4 py-2 text-xs rounded-full border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-main)] placeholder-[var(--text-disabled)] outline-none focus:border-[var(--brand-primary)] focus:ring-3 focus:ring-[rgba(12,86,67,0.08)] transition-all font-semibold"
 />
 </div>

 {/* Mobile Search Button */}
 <button
 onClick={() => setMobileSearchOpen(true)}
 className="w-10 h-10 rounded-full border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-muted)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] flex items-center justify-center transition-all cursor-pointer shadow-sm md:hidden"
 title="Cari"
 >
 <Search size={15} />
 </button>

 {/* 1. Notification Bell with Dropdown Panel */}
 <div className="relative" ref={notifRef}>
 <button
 onClick={() => setNotifOpen(!notifOpen)}
 className="w-10 h-10 rounded-full border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-main)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] flex items-center justify-center transition-all cursor-pointer shadow-sm relative"
 title="Notifikasi"
 >
 <Bell size={16} />
 {unreadCount > 0 && (
 <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[var(--accent-danger)] rounded-full border-2 border-[var(--bg-surface)]" />
 )}
 </button>

 {notifOpen && (
 <div className="absolute right-0 top-12 w-[320px] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] z-50 overflow-hidden">
 {/* Header panel */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
 <span className="text-sm font-bold text-[var(--text-main)]">Notifikasi</span>
 {unreadCount > 0 && onMarkAllRead && (
 <button onClick={onMarkAllRead} className="text-[11px] text-[var(--brand-primary)] font-semibold hover:underline cursor-pointer">
 Tandai semua dibaca
 </button>
 )}
 </div>
 {/* List notifikasi */}
 <div className="max-h-[340px] overflow-y-auto">
 {notifications.length === 0 ? (
 <div className="py-10 text-center text-xs text-[var(--text-muted)]">
 <Bell size={28} className="mx-auto mb-2 opacity-30" />
 Tidak ada notifikasi
 </div>
 ) : (
 notifications.map(n => (
 <div
 key={n.id}
 className={`flex gap-3 px-4 py-3 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-surface-hover)] transition-colors ${!n.dibaca ? 'bg-[var(--brand-light)] bg-opacity-30' : ''}`}
 >
 <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
 n.tipe === 'success' ? 'bg-[var(--brand-primary)]' :
 n.tipe === 'warning' ? 'bg-[var(--accent-warning)]' :
 n.tipe === 'danger' ? 'bg-[var(--accent-danger)]' :
 'bg-[var(--accent-info)]'
 }`} />
 <div className="flex-1 min-w-0 text-left">
 <p className="text-xs text-[var(--text-main)] font-medium leading-snug">{n.pesan}</p>
 <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{n.waktu}</p>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 )}
 </div>

 {/* Theme Toggle Icon Wrapper */}
 <button
 onClick={onToggleTheme}
 className="w-10 h-10 rounded-full border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-main)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] flex items-center justify-center transition-all cursor-pointer shadow-sm animate"
 title={theme === "light" ? "Matikan Lampu (Tema Gelap)" : "Nyalakan Lampu (Tema Terang)"}
 >
 {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
 </button>

 {/* 2. Pindahkan Role Badge → menjadi Profil Avatar Dropdown */}
 <div className="relative" ref={avatarRef}>
 <button
 onClick={() => setAvatarOpen(!avatarOpen)}
 className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[#085040] text-white flex items-center justify-center font-bold text-sm shadow-inner cursor-pointer hover:opacity-90 transition-all border-2 border-[var(--border-color)] overflow-hidden"
 title="Profil & Akun"
 >
 {fotoProfil || currentUser.fotoProfil ? (
 <img src={fotoProfil || currentUser.fotoProfil} alt={currentUser.nama} className="w-full h-full object-cover" />
 ) : (
 currentUser.nama.charAt(0).toUpperCase()
 )}
 </button>

 {avatarOpen && (
 <div className="absolute right-0 top-12 w-[240px] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] z-50 overflow-hidden text-left">
 <div className="px-4 py-3 border-b border-[var(--border-color)]">
 <p className="text-sm font-bold text-[var(--text-main)] truncate">{currentUser.nama}</p>
 <p className="text-[11px] text-[var(--text-muted)] truncate">{currentUser.email}</p>
 <span className={`inline-flex items-center gap-1 mt-1.5 text-[9px] font-black px-2 py-0.5 rounded-full border ${roleBadgeStyle}`}>
 {roleBadgeLabel}
 </span>
 </div>
 <div className="py-1">
 {onProfileClick && (
 <button onClick={() => { onProfileClick(); setAvatarOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] flex items-center gap-2 cursor-pointer transition-colors">
 <User size={13} /> Edit Profil
 </button>
 )}
 
 {/* 4. Google Connection / Kelola Meet item menu */}
 {(currentUser.role === 'Admin' || currentUser.role === 'Superadmin') && onManageGoogleMeet && (
 <button onClick={() => { onManageGoogleMeet(); setAvatarOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] flex items-center gap-2 cursor-pointer transition-colors">
 <Video size={13} /> Kelola Link Meet
 </button>
 )}

 {currentUser.role !== 'Admin' && currentUser.role !== 'Superadmin' && (
 googleUser ? (
 onDisconnectGoogle && (
 <button onClick={() => { onDisconnectGoogle(); setAvatarOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-[var(--accent-danger)] hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer transition-colors">
 <Video size={13} /> Putuskan Google Calendar
 </button>
 )
 ) : (
 onConnectGoogle && (
 <button onClick={() => { onConnectGoogle(); setAvatarOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-light)] flex items-center gap-2 cursor-pointer transition-colors">
 <Video size={13} /> Hubungkan Google Meet
 </button>
 )
 )
 )}

 <div className="border-t border-[var(--border-color)] my-1"></div>
 
 <button onClick={() => { onLogout(); setAvatarOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-[var(--accent-danger)] hover:bg-[var(--accent-danger-light)] flex items-center gap-2 cursor-pointer transition-colors">
 <LogOut size={13} /> Keluar
 </button>
 </div>
 </div>
 )}
 </div>
 </div>

 </header>
 </>
 );
}

