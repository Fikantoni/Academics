import React, { useState } from "react";
import { Lock, Mail, Loader2, ShieldCheck, BookOpen, Users } from "lucide-react";
import { Pengguna } from "../types";

interface LoginProps {
 onLoginSuccess: (user: Pengguna, token: string) => void;
 logo: string | null;
}

export function Login({ onLoginSuccess, logo }: LoginProps) {
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [error, setError] = useState("");
 const [pwdStrength, setPwdStrength] = useState<"none" | "weak" | "medium" | "strong">("none");
 const [isSubmitting, setIsSubmitting] = useState(false);

 const checkPwdStrength = (val: string) => {
 if (val.length === 0) {
 setPwdStrength("none");
 return;
 }
 if (val.length < 6) {
 setPwdStrength("weak");
 return;
 }
 const hasUpper = /[A-Z]/.test(val);
 const hasNumber = /[0-9]/.test(val);
 if (val.length >= 8 && hasUpper && hasNumber) {
 setPwdStrength("strong");
 } else {
 setPwdStrength("medium");
 }
 };

 const handleLoginSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError("");

 if (password.length < 6) {
 setError("Kata sandi minimal 6 karakter.");
 return;
 }

 setIsSubmitting(true);
 try {
 const response = await fetch("/api/login", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email, password }),
 });

 const result = await response.json();
 if (!response.ok) {
 setError(result.error || "Pecahkan kesalahan login.");
 return;
 }

 onLoginSuccess(result.user, result.token);
 } catch (err) {
 console.error("Login failure:", err);
 setError("Gagal terhubung ke server Academics. Sila periksa jaringan Anda.");
 } finally {
 setIsSubmitting(false);
 }
 };

 const pwdStrengthLabel = {
 none: "",
 weak: "Lemah",
 medium: "Sedang",
 strong: "Kuat",
 };
 const pwdStrengthColor = {
 none: "text-[var(--text-disabled)]",
 weak: "text-[var(--accent-danger)]",
 medium: "text-[var(--accent-warning)]",
 strong: "text-[var(--brand-primary)]",
 };

 return (
 <div className="min-h-screen bg-[var(--bg-base)] flex items-stretch transition-colors duration-300">

 {/* ── Left Decorative Panel (hidden on mobile) ── */}
 <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative overflow-hidden flex-col items-center justify-center p-12"
 style={{ background: "linear-gradient(145deg, #042f2e 0%, #0f766e 30%, #0ea5e9 70%, #0369a1 100%)" }}
 >
 {/* Decorative dot grid pattern */}
 <div className="absolute inset-0 opacity-[0.10]"
 style={{
 backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
 backgroundSize: "28px 28px",
 }}
 />

 {/* Floating candy blobs */}
 <div className="absolute top-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full opacity-20 animate-pulse"
 style={{ background: "radial-gradient(circle, #99f6e4, transparent)", animationDuration: "4s" }} />
 <div className="absolute bottom-[-50px] left-[-50px] w-[220px] h-[220px] rounded-full opacity-15 animate-pulse"
 style={{ background: "radial-gradient(circle, #7dd3fc, transparent)", animationDuration: "5s" }} />
 <div className="absolute top-[35%] left-[-30px] w-[160px] h-[160px] rounded-full opacity-15 animate-pulse"
 style={{ background: "radial-gradient(circle, #5eead4, transparent)", animationDuration: "6s" }} />
 <div className="absolute bottom-[20%] right-[-20px] w-[130px] h-[130px] rounded-full opacity-18 animate-pulse"
 style={{ background: "radial-gradient(circle, #fde68a, transparent)", animationDuration: "4.5s" }} />

 {/* Content */}
 <div className="relative z-10 max-w-sm text-center">
 {/* Logo */}
 <div className="w-20 h-20 mx-auto mb-8 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-sm p-2">
 {logo ? (
 <img src={logo} alt="Logo" className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
 ) : (
 <span className="text-white font-extrabold text-3xl leading-none">A</span>
 )}
 </div>

 <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 leading-tight">
 Academics
 </h1>
 <p className="text-white/70 text-sm font-medium leading-relaxed mb-10">
 Sistem Informasi Administrasi<br />
 Fakultas Ilmu Kesehatan dan Psikologi<br />
 Universitas Muhammadiyah Pontianak
 </p>

 {/* Feature highlights */}
 <div className="space-y-4 text-left">
 {[
 { icon: ShieldCheck, label: "Manajemen Akses Berbasis Peran", sub: "Superadmin, Admin, Prodi, Dosen & Mahasiswa" },
 { icon: BookOpen, label: "Monitoring Bimbingan Real-Time", sub: "Pantau progress tugas akhir secara terintegrasi" },
 { icon: Users, label: "Koordinasi Multi-Pihak", sub: "Jadwal sidang, surat, dan berkas digital" },
 ].map(({ icon: Icon, label, sub }) => (
 <div key={label} className="flex items-start gap-3 bg-white/8 rounded-xl p-3.5 border border-white/10">
 <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
 <Icon size={15} className="text-white" />
 </div>
 <div>
 <p className="text-white font-semibold text-[13px] leading-tight">{label}</p>
 <p className="text-white/55 text-[11px] mt-0.5 leading-snug">{sub}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Bottom version badge */}
 <div className="absolute bottom-6 left-0 right-0 text-center">
 <span className="text-white/30 text-[10px] font-semibold tracking-wider">Academics v2.0 · 2026</span>
 </div>
 </div>

 {/* ── Right Login Form Panel ── */}
 <div className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-16">
 <div className="w-full max-w-[420px]">

 {/* Mobile logo (only shown on small screens) */}
 <div className="lg:hidden flex flex-col items-center mb-8">
 <div className="w-16 h-16 bg-[var(--brand-light)] rounded-2xl flex items-center justify-center border border-[var(--border-color)] mb-4 p-1.5">
 {logo ? (
 <img src={logo} alt="Logo" className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
 ) : (
 <span className="text-[var(--brand-primary)] font-extrabold text-2xl">A</span>
 )}
 </div>
 <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">Academics</h1>
 <p className="text-xs text-[var(--text-muted)] text-center mt-1 leading-relaxed">
 Sistem Informasi Administrasi<br />
 Fakultas Ilmu Kesehatan dan Psikologi
 </p>
 </div>

 {/* Form card */}
 <div className="bg-[var(--bg-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] border border-[var(--border-color)] overflow-hidden">
 {/* Top accent bar */}
 <div className="h-[5px] bg-gradient-to-r from-[#0d9488] via-[#0ea5e9] to-[#f59e0b]" />

 <div className="p-8">
 <div className="mb-7">
 <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight">
 Masuk ke Akun Anda
 </h2>
 <p className="text-[13px] text-[var(--text-muted)] mt-1">
 Gunakan email institusi yang terdaftar di sistem.
 </p>
 </div>

 {/* Login Form */}
 <form onSubmit={handleLoginSubmit} className="space-y-5">
 {/* Email Field */}
 <div>
 <label className="block text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] mb-2">
 Email Institusi
 </label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
 <Mail size={16} />
 </span>
 <input
 type="email"
 required
 placeholder="nama@um-pontianak.ac.id"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 disabled={isSubmitting}
 className="w-full pl-11 pr-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-main)] placeholder-[var(--text-disabled)] outline-none focus:border-[var(--brand-primary)] focus:ring-3 focus:ring-[rgba(12,86,67,0.1)] transition-all text-sm disabled:opacity-60"
 />
 </div>
 </div>

 {/* Password Field */}
 <div>
 <label className="block text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] mb-2">
 Kata Sandi
 </label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
 <Lock size={16} />
 </span>
 <input
 type="password"
 required
 placeholder="••••••••"
 value={password}
 disabled={isSubmitting}
 onChange={(e) => {
 setPassword(e.target.value);
 checkPwdStrength(e.target.value);
 }}
 className={`w-full pl-11 pr-4 py-3 rounded-[var(--radius-sm)] border bg-[var(--bg-base)] text-[var(--text-main)] placeholder-[var(--text-disabled)] outline-none focus:ring-3 transition-all text-sm disabled:opacity-60 ${
 error
 ? "border-[var(--accent-danger)] focus:border-[var(--accent-danger)] focus:ring-[rgba(239,68,68,0.1)]"
 : "border-[var(--border-color)] focus:border-[var(--brand-primary)] focus:ring-[rgba(12,86,67,0.1)]"
 }`}
 />
 </div>

 {/* Password Strength Indicator */}
 {pwdStrength !== "none" && (
 <div className="mt-2.5 space-y-1.5">
 <div className="flex gap-1.5">
 {(["weak", "medium", "strong"] as const).map((level, i) => {
 const levels = ["weak", "medium", "strong"];
 const currentIdx = levels.indexOf(pwdStrength);
 const isActive = i <= currentIdx;
 return (
 <div
 key={level}
 className={`h-[4px] flex-1 rounded-sm transition-all duration-300 ${
 isActive
 ? pwdStrength === "weak"
 ? "bg-[var(--accent-danger)]"
 : pwdStrength === "medium"
 ? "bg-[var(--accent-warning)]"
 : "bg-[var(--brand-primary)]"
 : "bg-[var(--border-color)]"
 }`}
 />
 );
 })}
 </div>
 <div className="flex items-center justify-between">
 <span className={`text-[10px] font-bold ${pwdStrengthColor[pwdStrength]}`}>
 Kekuatan: {pwdStrengthLabel[pwdStrength]}
 </span>
 {pwdStrength === "weak" && (
 <span className="text-[10px] text-[var(--text-disabled)]">Min. 8 karakter + huruf besar + angka</span>
 )}
 </div>
 </div>
 )}

 {/* Error message */}
 {error && (
 <p className="mt-2 text-xs font-semibold text-[var(--accent-danger)] flex items-center gap-1.5">
 <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent-danger)]/15 flex items-center justify-center flex-shrink-0 text-[8px] font-black">!</span>
 {error}
 </p>
 )}
 </div>

 {/* Submit Button */}
 <button
 type="submit"
 disabled={isSubmitting}
 className="w-full mt-1 py-3.5 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold rounded-[var(--radius-sm)] shadow-sm hover:shadow-md transition-all duration-200 text-[15px] focus:outline-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
 >
 {isSubmitting ? (
 <>
 <Loader2 size={18} className="animate-spin" />
 <span>Memproses...</span>
 </>
 ) : (
 "Masuk"
 )}
 </button>
 </form>
 </div>
 </div>

 {/* Footer */}
 <p className="text-center text-[11px] text-[var(--text-disabled)] mt-6 leading-relaxed">
 Academics v2.0 · Universitas Muhammadiyah Pontianak<br />
 <span className="opacity-70">© 2026 Hak Cipta Dilindungi Undang-Undang</span>
 </p>
 </div>
 </div>
 </div>
 );
}

