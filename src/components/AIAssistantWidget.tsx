import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, User, Sparkles, Loader2, Maximize2, Minimize2, Move } from "lucide-react";
import Markdown from "react-markdown";

interface AIAssistantWidgetProps {
 logo?: string | null;
}

export function AIAssistantWidget({ logo }: AIAssistantWidgetProps = {}) {
 const [isOpen, setIsOpen] = useState(false);
 const [isExpanded, setIsExpanded] = useState(false);
 const [query, setQuery] = useState("");
 const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
 {
 role: "bot",
 text: "Halo! Saya Inotna, Asisten AI Academics. Ada yang bisa saya bantu terkait penulisan tugas akhir, saran judul, perbaikan tata bahasa, atau informasi akademik lainnya?",
 },
 ]);
 const [isLoading, setIsLoading] = useState(false);
 const messagesEndRef = useRef<HTMLDivElement>(null);

 // Position and Drag States
 const [position, setPosition] = useState({ x: 0, y: 0 });
 const [isDragging, setIsDragging] = useState(false);
 const [dragDistance, setDragDistance] = useState(0);
 const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });

 const handlePointerDown = (e: React.PointerEvent) => {
 // Only register drag on main click
 if (e.button !== 0 && e.pointerType === "mouse") return;

 const target = e.target as HTMLElement;
 // Don't drag if interactive areas are clicked
 if (
 target.closest("button") ||
 target.closest("textarea") ||
 target.closest("input") ||
 target.closest(".markdown-body")
 ) {
 return;
 }

 setIsDragging(true);
 setDragDistance(0);
 dragRef.current = {
 startX: e.clientX,
 startY: e.clientY,
 posX: position.x,
 posY: position.y
 };
 e.currentTarget.setPointerCapture(e.pointerId);
 };

 const handlePointerMove = (e: React.PointerEvent) => {
 if (!isDragging) return;
 const dx = e.clientX - dragRef.current.startX;
 const dy = e.clientY - dragRef.current.startY;
 const distance = Math.sqrt(dx * dx + dy * dy);
 setDragDistance(distance);
 setPosition({
 x: dragRef.current.posX + dx,
 y: dragRef.current.posY + dy
 });
 };

 const handlePointerUp = (e: React.PointerEvent) => {
 if (!isDragging) return;
 setIsDragging(false);
 e.currentTarget.releasePointerCapture(e.pointerId);
 };

 const handleButtonClick = (e: React.MouseEvent) => {
 // If it was mostly a drag operation, prevent toggling the chat window open
 if (dragDistance > 8) {
 e.preventDefault();
 e.stopPropagation();
 return;
 }
 setIsOpen(true);
 };

 useEffect(() => {
 if (messagesEndRef.current) {
 messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
 }
 }, [messages, isOpen]);

 const handleSend = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!query.trim() || isLoading) return;

 const userMessage = query.trim();
 setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
 setQuery("");
 setIsLoading(true);

 try {
 const formattedHistory = messages
 .map(m => `${m.role === 'user' ? 'User' : 'Asisten'}: ${m.text}`)
 .join("\n\n");
 
 const fullPrompt = `${formattedHistory}\n\nUser: ${userMessage}`;

 const res = await fetch("/api/ai/generate", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify({ prompt: fullPrompt }),
 });

 if (res.ok) {
 const data = await res.json();
 setMessages((prev) => [...prev, { role: "bot", text: data.result }]);
 } else {
 const errData = await res.json();
 setMessages((prev) => [
 ...prev,
 { role: "bot", text: `Maaf, terjadi kesalahan: ${errData.error || "Gagal menghubungi server AI."}` },
 ]);
 }
 } catch (err) {
 console.error(err);
 setMessages((prev) => [
 ...prev,
 { role: "bot", text: "Maaf, koneksi ke server AI terputus. Silakan coba lagi nanti." },
 ]);
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div 
 className={`fixed bottom-6 right-6 z-[9000] no-print ${isOpen ? "w-80 md:w-96" : "w-auto"}`}
 style={{
 transform: `translate(${position.x}px, ${position.y}px)`,
 touchAction: "none"
 }}
 >
 {/* Widget Button */}
 {!isOpen && (
 <button
 onPointerDown={handlePointerDown}
 onPointerMove={handlePointerMove}
 onPointerUp={handlePointerUp}
 onClick={handleButtonClick}
 className="bg-gradient-to-r from-[var(--brand-primary)] to-[#0f766e] text-white p-0 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group relative border-2 border-white/20 cursor-grab active:cursor-grabbing overflow-hidden w-[54px] h-[54px]"
 title="Tarik untuk memindahkan bot | Klik untuk chatting"
 >
 {logo ? (
 <img src={logo} alt="AI" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
 ) : (
 <Bot size={24} className="group-hover:animate-bounce" />
 )}
 <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
 1
 </div>
 {/* Draggable visual indicator on hover */}
 <div className="absolute -bottom-10 right-0 bg-slate-800/95 backdrop-blur text-white text-[10px] py-1 px-2 rounded-md shadow-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none flex items-center gap-1 font-semibold">
 <Move size={10} /> Seret untuk memindahkan
 </div>
 </button>
 )}

 {/* Chat Window */}
 {isOpen && (
 <div className={`bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "fixed top-6 left-6 right-6 bottom-6 md:top-10 md:bottom-10 md:left-auto md:right-10 md:w-[600px]" : "h-[450px]"}`}>
 {/* Header - Drag source when chat is open */}
 <div 
 onPointerDown={handlePointerDown}
 onPointerMove={handlePointerMove}
 onPointerUp={handlePointerUp}
 className="bg-gradient-to-r from-[var(--brand-primary)] to-[#0f766e] text-white p-4 flex justify-between items-center shrink-0 cursor-grab active:cursor-grabbing select-none"
 title="Seret bagian ini untuk menggeser jendela"
 >
 <div className="flex items-center gap-2 pointer-events-none">
 <div className="bg-white/20 p-1 rounded-lg flex items-center justify-center overflow-hidden w-9 h-9 flex-shrink-0">
 {logo ? (
 <img src={logo} alt="Logo" className="w-full h-full object-contain rounded-md" referrerPolicy="no-referrer" />
 ) : (
 <Sparkles size={18} className="text-yellow-300 fill-yellow-300" />
 )}
 </div>
 <div>
 <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
 Inotna <Move size={12} className="opacity-75 animate-pulse" />
 </h3>
 <p className="text-[10px] text-emerald-100 font-medium">Asisten Cerdas (Seret/Geser)</p>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <button 
 onClick={() => setIsExpanded(!isExpanded)} 
 className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white hidden md:block"
 title={isExpanded ? "Perkecil Tampilan" : "Perbesar Tampilan"}
 >
 {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
 </button>
 <button 
 onClick={() => setIsOpen(false)} 
 className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white"
 title="Sembunyikan Chat"
 >
 <X size={18} />
 </button>
 </div>
 </div>

 {/* Chat Messages */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-base)] chat-messages-container">
 {messages.map((msg, idx) => (
 <div key={idx} className={`flex gap-2 text-sm ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
 <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-[var(--brand-light)] border border-[var(--border-color)]'}`}>
 {msg.role === 'user' ? <User size={14} /> : (
 logo ? (
 <img src={logo} alt="Bot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
 ) : (
 <Bot size={14} className="text-[var(--brand-primary)]" />
 )
 )}
 </div>
 <div className={`py-2 px-3.5 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-[var(--brand-primary)] text-white rounded-tr-sm' : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-sm'}`}>
 {msg.role === 'user' ? (
 <p className="whitespace-pre-wrap">{msg.text}</p>
 ) : (
 <div className="markdown-body text-xs leading-relaxed prose-p:my-1 prose-strong:text-emerald-800 prose-ul:my-1 prose-li:my-0.5">
 <Markdown>{msg.text}</Markdown>
 </div>
 )}
 </div>
 </div>
 ))}
 {isLoading && (
 <div className="flex gap-2 text-sm">
 <div className="w-7 h-7 rounded-full bg-[var(--brand-light)] border border-[var(--border-color)] flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
 {logo ? (
 <img src={logo} alt="Bot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
 ) : (
 <Bot size={14} className="text-[var(--brand-primary)]" />
 )}
 </div>
 <div className="py-2 px-3.5 rounded-2xl max-w-[85%] bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-sm flex items-center gap-2">
 <Loader2 size={14} className="animate-spin text-[var(--brand-primary)]" />
 <span className="text-xs text-[var(--text-muted)] italic">Gemini sedang mengetik...</span>
 </div>
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>

 {/* Input Area */}
 <div className="p-3 bg-[var(--bg-surface)] border-t border-[var(--border-color)] shrink-0">
 <form onSubmit={handleSend} className="flex items-end gap-2 relative">
 <textarea
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 handleSend(e);
 }
 }}
 placeholder="Tanya saran judul, perbaiki abstrak..."
 className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl py-2 pl-3 pr-10 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold resize-none text-[var(--text-main)]"
 rows={1}
 style={{ minHeight: '40px', maxHeight: '120px' }}
 />
 <button
 type="submit"
 disabled={!query.trim() || isLoading}
 className="absolute right-2 bottom-1.5 p-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 title="Kirim Pesan"
 >
 <Send size={14} />
 </button>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}

