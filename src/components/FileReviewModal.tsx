import React, { useState, useRef, useEffect } from "react";
import { 
 X, Check, Eye, Download, Edit3, MousePointer2, Eraser, PenTool, 
 Loader, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, BookOpen, 
 Plus, Trash2, History, RotateCcw, AlertCircle, RefreshCw, Send, CheckCircle2,
 Minimize2, Maximize2, Move, Layers, Sparkles, Bot
} from "lucide-react";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { ChatMessage } from "../types";

// Setup PDF.js worker using Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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

interface PageComment {
 id: string;
 pageNum: number;
 bab: string;
 text: string;
 status: "Belum" | "Selesai";
 date: string;
 writer: string;
 rectId?: string; // Links directly to a high fidelity custom bounding box highlight!
}

interface DrawingStroke {
 id: string;
 page: number;
 x: number;
 y: number;
 width: number;
 height: number;
 color: string;
 commentId?: string;
 points?: { x: number; y: number }[]; // kept for prior compatibility
}

interface FileReviewModalProps {
 msg: ChatMessage;
 currentUserRole: string;
 onClose: () => void;
 onSaveKoreksi: (annotatedBlobUrl: string) => void;
 showToast: (msg: string, type?: "success" | "warning" | "error") => void;
 activeSession?: any;
 mutate?: any;
 onReply?: any;
}

export function FileReviewModal({ 
 msg, 
 currentUserRole, 
 onClose, 
 onSaveKoreksi, 
 showToast,
 activeSession,
 mutate,
 onReply
}: FileReviewModalProps) {
 const [mode, setMode] = useState<"view" | "draw" | "erase">("view");
 const [color, setColor] = useState("#ef4444"); // Default to classic correction red
 const [wordHtml, setWordHtml] = useState<string>("");
 const [isLoadingWord, setIsLoadingWord] = useState(false);
 
 // PDF states
 const [pdfDoc, setPdfDoc] = useState<any>(null);
 const [pageNum, setPageNum] = useState(1);
 const [numPages, setNumPages] = useState(0);
 const [scale, setScale] = useState(1.2);
 const [isPdfRendering, setIsPdfRendering] = useState(false);
 const [canvasDim, setCanvasDim] = useState({ width: 0, height: 0 });

 const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
 const containerRef = useRef<HTMLDivElement>(null);
 const commentInputRef = useRef<HTMLTextAreaElement>(null);

 // High fidelity structures (Rectangle overlays replaces scribbles)
 const [allDrawings, setAllDrawings] = useState<DrawingStroke[]>([]);
 const [allComments, setAllComments] = useState<PageComment[]>([]);
 const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);

 // Drag and Resize Core State Engine
 const [tempRect, setTempRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
 const [dragState, setDragState] = useState<{
 type: "create" | "move" | "resize";
 handle?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
 rectId?: string;
 startX: number;
 startY: number;
 initialRect?: { x: number; y: number; width: number; height: number };
 } | null>(null);
 
 // Comment Panel and Fields
 const [sidebarTab, setSidebarTab] = useState<"page" | "all">("page");
 const [selectedBab, setSelectedBab] = useState<string>("Umum/Lainnya");
 const [newComment, setNewComment] = useState("");
 const [chapterFilter, setChapterFilter] = useState<string>("Semua");

 // Inotna AI - Google Gemini integration inside review workspace
 const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
 const [isLoadingAI, setIsLoadingAI] = useState(false);
 const [showAIPanel, setShowAIPanel] = useState(false);

 const handleGetAiSuggestions = async () => {
 setIsLoadingAI(true);
 setShowAIPanel(true);
 setAiSuggestions([]);
 try {
 const sessionSubject = activeSession?.subjek || "Terdokumentasi di konsultasi bimbingan";
 const sessionDetails = activeSession?.pesan || "Draf bimbingan tugas akhir";
 const prompt = `Sebagai Inotna AI, Asisten Tugas Akhir Pascasarjana Academics Universitas Muhammadiyah Pontianak, berikan 3 poin masukan akademis atau koreksi kritis yang spesifik untuk "${selectedBab}" pada Halaman ${pageNum}. 
Topik bimbingan mahasiswa: "${sessionSubject}".
Detail draf bimbingan: "${sessionDetails}".

Format jawaban Anda HANYA berupa 3 poin terpisah dengan tanda strip (-) atau angka, tanpa kalimat pengantar atau kesimpulan apapun di awal dan akhir. Setiap poin harus singkat (1-2 kalimat), padat, berfokus pada ketepatan kutipan, metodologi kesehatan masyarakat (jika relevan dengan Fikes), relevansi data, kebaruan referensi, tata bahasa baku Bahasa Indonesia, dan format penulisan akademik yang ideal.`;

 const res = await fetch("/api/ai/generate", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify({ prompt }),
 });

 if (res.ok) {
 const data = await res.json();
 const parsed = data.result
 .split("\n")
 .map((line: string) => line.replace(/^[\d\-\.\s\)\*]+/, "").trim())
 .filter((line: string) => line.length > 8);
 setAiSuggestions(parsed.slice(0, 3));
 showToast("Tinjauan cerdas Google AI siap diterapkan!", "success");
 } else {
 showToast("Gagal memanggil asisten Google AI.", "error");
 }
 } catch (error) {
 console.error(error);
 showToast("Gagal menghubungkan ke server AI.", "error");
 } finally {
 setIsLoadingAI(false);
 }
 };

 // Undo/Redo Stacks
 const [history, setHistory] = useState<string[]>([]); // Serialized array of drawings
 const [historyStep, setHistoryStep] = useState<number>(-1);

 // Restore existing annotations/comments from ChatMessage
 useEffect(() => {
 if (msg.annotations) {
 try {
 const parsed = JSON.parse(msg.annotations);
 // Map old scribble stroke objects to rectangles if necessary, or load straight
 const sanitized = parsed.map((d: any) => {
 if (d.points && d.points.length > 0 && typeof d.x === "undefined") {
 // Upgrade prior coordinates to rectangle
 const xs = d.points.map((p: any) => p.x);
 const ys = d.points.map((p: any) => p.y);
 const minX = Math.min(...xs);
 const maxX = Math.max(...xs);
 const minY = Math.min(...ys);
 const maxY = Math.max(...ys);
 return {
 id: d.id,
 page: d.page,
 x: minX,
 y: minY,
 width: Math.max(20, maxX - minX),
 height: Math.max(20, maxY - minY),
 color: d.color || "#ef4444"
 };
 }
 return d;
 });
 setAllDrawings(sanitized);
 setHistory([JSON.stringify(sanitized)]);
 setHistoryStep(0);
 } catch (e) {
 console.error("Failed to parse annotations payload", e);
 }
 }
 if (msg.comments) {
 try {
 setAllComments(JSON.parse(msg.comments));
 } catch (e) {
 console.error("Failed to parse comments payload", e);
 }
 }
 }, [msg]);

 // Load PDF document
 useEffect(() => {
 let active = true;
 if (msg.lampiranTipe !== "Word" && msg.lampiranTipe !== "Image" && msg.lampiranData) {
 const loadPdf = async () => {
 setIsPdfRendering(true);
 try {
 const arrayBuffer = await base64ToArrayBufferAsync(msg.lampiranData);
 if (!active) return;
 const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
 const doc = await loadingTask.promise;
 if (active) {
 setPdfDoc(doc);
 setNumPages(doc.numPages);
 setPageNum(1);
 }
 } catch (error) {
 console.error("Error loading PDF", error);
 if (active) {
 setPdfDoc("error");
 }
 } finally {
 if (active) {
 setIsPdfRendering(false);
 }
 }
 };
 loadPdf();
 }
 return () => {
 active = false;
 };
 }, [msg.lampiranTipe, msg.lampiranData]);

 // Render PDF page onto background canvas
 useEffect(() => {
 const renderPage = async () => {
 if (!pdfDoc || pdfDoc === "error" || !pdfCanvasRef.current) return;
 setIsPdfRendering(true);
 try {
 const page = await pdfDoc.getPage(pageNum);
 const viewport = page.getViewport({ scale });

 // Update PDF Canvas dimensions
 const canvas = pdfCanvasRef.current;
 const ctx = canvas.getContext("2d");
 if (!ctx) return;
 canvas.width = viewport.width;
 canvas.height = viewport.height;
 
 setCanvasDim({ width: viewport.width, height: viewport.height });

 const renderContext = {
 canvasContext: ctx,
 viewport: viewport,
 };
 await page.render(renderContext).promise;
 } catch (error) {
 console.error("Error rendering PDF page", error);
 } finally {
 setIsPdfRendering(false);
 }
 };
 renderPage();
 }, [pdfDoc, pageNum, scale]);

 // Load DOCX text extracts
 useEffect(() => {
 let active = true;
 if (msg.lampiranTipe === "Word" && msg.lampiranData) {
 setIsLoadingWord(true);
 const loadWord = async () => {
 try {
 const arrayBuffer = await base64ToArrayBufferAsync(msg.lampiranData);
 if (!active) return;
 const result = await mammoth.convertToHtml({ arrayBuffer });
 if (active) {
 setWordHtml(result.value);
 setIsLoadingWord(false);
 }
 } catch (err) {
 console.error("Error parsing Word file:", err);
 if (active) {
 setWordHtml("<p>Gagal memuat pratinjau dokumen Word. Format file mungkin tidak didukung atau rusak.</p>");
 setIsLoadingWord(false);
 }
 }
 };
 loadWord();
 }
 return () => {
 active = false;
 };
 }, [msg.lampiranTipe, msg.lampiranData]);

 // Undo/Redo mechanisms
 const saveStateToHistory = (newDrawingsState: DrawingStroke[]) => {
 const newHistory = history.slice(0, historyStep + 1);
 newHistory.push(JSON.stringify(newDrawingsState));
 setHistory(newHistory);
 setHistoryStep(newHistory.length - 1);
 };

 const undo = () => {
 if (historyStep > 0) {
 const stepPrev = historyStep - 1;
 setHistoryStep(stepPrev);
 const parsed = JSON.parse(history[stepPrev]);
 setAllDrawings(parsed);
 setSelectedDrawingId(null);
 showToast("Urungkan coretan terakhir", "warning");
 } else if (historyStep === 0) {
 setHistoryStep(-1);
 setAllDrawings([]);
 setSelectedDrawingId(null);
 showToast("Semua coretan diatur ulang", "warning");
 }
 };

 const redo = () => {
 if (historyStep < history.length - 1) {
 const stepNext = historyStep + 1;
 setHistoryStep(stepNext);
 setAllDrawings(JSON.parse(history[stepNext]));
 setSelectedDrawingId(null);
 showToast("Kembalikan coretan terakhir", "success");
 }
 };

 // Interactive Mouse Event Handlers mapped to high fidelity overlay panel
 const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
 // Left click only
 if (e.button !== 0) return;

 const rect = e.currentTarget.getBoundingClientRect();
 const clientX = e.clientX - rect.left;
 const clientY = e.clientY - rect.top;

 // Normalize coordinates back to scale=1.0 relative bounds
 const normX = clientX / scale;
 const normY = clientY / scale;

 // If Mode is Draw, we initiate rectangle drag creation
 if (mode === "draw") {
 setDragState({
 type: "create",
 startX: normX,
 startY: normY,
 rectId: undefined
 });
 setTempRect({
 x: normX,
 y: normY,
 width: 0,
 height: 0
 });
 setSelectedDrawingId(null);
 } else if (mode === "erase") {
 // Direct click click erase in erase mode!
 // Look for a rectangle that bounds this click
 const target = allDrawings
 .filter(r => r.page === pageNum)
 .reverse()
 .find(r => (
 normX >= r.x && normX <= r.x + r.width &&
 normY >= r.y && normY <= r.y + r.height
 ));
 if (target) {
 handleDeleteRectangle(target.id);
 }
 } else {
 // Regular navigation/view mode - click background clears active highlights
 setSelectedDrawingId(null);
 }
 };

 // Drag handles for Resize Starter
 const startResize = (e: React.MouseEvent, rectId: string, handle: "top-left" | "top-right" | "bottom-left" | "bottom-right") => {
 e.stopPropagation();
 e.preventDefault();
 const rectObj = allDrawings.find(x => x.id === rectId);
 if (!rectObj) return;

 setDragState({
 type: "resize",
 handle: handle,
 rectId: rectId,
 startX: e.clientX,
 startY: e.clientY,
 initialRect: { x: rectObj.x, y: rectObj.y, width: rectObj.width, height: rectObj.height }
 });
 setSelectedDrawingId(rectId);
 };

 // Drag center bar for Moving Starter
 const startMove = (e: React.MouseEvent, rectId: string) => {
 e.stopPropagation();
 e.preventDefault();
 const rectObj = allDrawings.find(x => x.id === rectId);
 if (!rectObj) return;

 setDragState({
 type: "move",
 rectId: rectId,
 startX: e.clientX,
 startY: e.clientY,
 initialRect: { x: rectObj.x, y: rectObj.y, width: rectObj.width, height: rectObj.height }
 });
 setSelectedDrawingId(rectId);
 };

 // Dynamic Overlay Mouse movement tracker
 const handleOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
 if (!dragState) return;

 if (dragState.type === "create") {
 const parentRect = e.currentTarget.getBoundingClientRect();
 const currentX = (e.clientX - parentRect.left) / scale;
 const currentY = (e.clientY - parentRect.top) / scale;

 const x = Math.min(dragState.startX, currentX);
 const y = Math.min(dragState.startY, currentY);
 const width = Math.abs(dragState.startX - currentX);
 const height = Math.abs(dragState.startY - currentY);

 setTempRect({ x, y, width, height });
 } else if (dragState.type === "move" && dragState.rectId && dragState.initialRect) {
 // Pixel offsets converted by scale
 const dx = (e.clientX - dragState.startX) / scale;
 const dy = (e.clientY - dragState.startY) / scale;

 const init = dragState.initialRect;
 const updatedX = Math.max(0, init.x + dx);
 const updatedY = Math.max(0, init.y + dy);

 setAllDrawings(prev => 
 prev.map(r => r.id === dragState.rectId ? { ...r, x: updatedX, y: updatedY } : r)
 );
 } else if (dragState.type === "resize" && dragState.rectId && dragState.initialRect && dragState.handle) {
 const dx = (e.clientX - dragState.startX) / scale;
 const dy = (e.clientY - dragState.startY) / scale;

 const init = dragState.initialRect;
 let x = init.x;
 let y = init.y;
 let width = init.width;
 let height = init.height;

 const handle = dragState.handle;
 const minSize = 15; // pixels at scale 1.0

 if (handle === "bottom-right") {
 width = Math.max(minSize, init.width + dx);
 height = Math.max(minSize, init.height + dy);
 } else if (handle === "bottom-left") {
 width = Math.max(minSize, init.width - dx);
 height = Math.max(minSize, init.height + dy);
 x = init.width - dx > minSize ? init.x + dx : init.x;
 } else if (handle === "top-right") {
 width = Math.max(minSize, init.width + dx);
 height = Math.max(minSize, init.height - dy);
 y = init.height - dy > minSize ? init.y + dy : init.y;
 } else if (handle === "top-left") {
 width = Math.max(minSize, init.width - dx);
 height = Math.max(minSize, init.height - dy);
 x = init.width - dx > minSize ? init.x + dx : init.x;
 y = init.height - dy > minSize ? init.y + dy : init.y;
 }

 setAllDrawings(prev => 
 prev.map(r => r.id === dragState.rectId ? { ...r, x, y, width, height } : r)
 );
 }
 };

 // Finish drag gesture
 const handleOverlayMouseUp = () => {
 if (!dragState) return;

 if (dragState.type === "create" && tempRect) {
 // Discard small tiny clicks
 if (tempRect.width > 12 && tempRect.height > 12) {
 const rectId = "rect_" + Math.random().toString(36).substring(2, 9);
 const newR: DrawingStroke = {
 id: rectId,
 page: pageNum,
 x: tempRect.x,
 y: tempRect.y,
 width: tempRect.width,
 height: tempRect.height,
 color: color
 };

 const updatedDrawings = [...allDrawings, newR];
 setAllDrawings(updatedDrawings);
 saveStateToHistory(updatedDrawings);
 setSelectedDrawingId(rectId);

 if (currentUserRole === "Dosen" || currentUserRole === "Mahasiswa") {
 showToast(`Berhasil membingkai lembar tugas akhir! Silakan ketik komentar detail pada sidebar sebelah kanan.`, "success");
 setTimeout(() => {
 commentInputRef.current?.focus();
 }, 150);
 }
 }
 } else if (dragState.type === "move" || dragState.type === "resize") {
 // Saved modified coordinates to undo queue
 saveStateToHistory(allDrawings);
 }

 setDragState(null);
 setTempRect(null);
 };

 // Support responsive mobile/tablet touch operations
 const handleOverlayTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
 if (e.touches.length === 0) return;
 const parentRect = e.currentTarget.getBoundingClientRect();
 const touch = e.touches[0];
 const clientX = touch.clientX - parentRect.left;
 const clientY = touch.clientY - parentRect.top;

 const normX = clientX / scale;
 const normY = clientY / scale;

 if (mode === "draw") {
 setDragState({
 type: "create",
 startX: normX,
 startY: normY,
 });
 setTempRect({
 x: normX,
 y: normY,
 width: 0,
 height: 0
 });
 setSelectedDrawingId(null);
 }
 };

 const handleOverlayTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
 if (!dragState || e.touches.length === 0) return;
 
 // Prevent document scrolling while drawing
 if (mode === "draw" && e.cancelable) {
 e.preventDefault();
 }

 if (dragState.type === "create") {
 const parentRect = e.currentTarget.getBoundingClientRect();
 const touch = e.touches[0];
 const currentX = (touch.clientX - parentRect.left) / scale;
 const currentY = (touch.clientY - parentRect.top) / scale;

 const x = Math.min(dragState.startX, currentX);
 const y = Math.min(dragState.startY, currentY);
 const width = Math.abs(dragState.startX - currentX);
 const height = Math.abs(dragState.startY - currentY);

 setTempRect({ x, y, width, height });
 }
 };

 const handleOverlayTouchEnd = () => {
 handleOverlayMouseUp();
 };

 // Delete dynamic rectangle annotation
 const handleDeleteRectangle = (rectId: string) => {
 const updated = allDrawings.filter(r => r.id !== rectId);
 setAllDrawings(updated);
 saveStateToHistory(updated);

 // Also dissociate or clear link on Comments
 const sanitizedComments = allComments.map(c => {
 if (c.rectId === rectId) {
 return { ...c, rectId: undefined };
 }
 return c;
 });
 setAllComments(sanitizedComments);

 if (selectedDrawingId === rectId) {
 setSelectedDrawingId(null);
 }
 showToast("Coretan bingkai dihapus", "warning");
 };

 // Add Comment linked directly to an active selected rectangle
 const handleAddComment = () => {
 if (!newComment.trim()) {
 showToast("Tulis catatan atau instruksi koreksi terlebih dahulu.", "warning");
 return;
 }

 const commentId = Date.now().toString();
 const commentItem: PageComment = {
 id: commentId,
 pageNum: pageNum,
 bab: selectedBab,
 text: newComment.trim(),
 status: "Belum",
 date: new Date().toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" }),
 writer: currentUserRole === "Dosen" ? "Dosen Pembimbing" : "Mahasiswa",
 rectId: selectedDrawingId || undefined // Bind high fidelity link!
 };

 // If a rectangle was currently highlighted, link it back to this comment
 if (selectedDrawingId) {
 setAllDrawings(prev => 
 prev.map(r => r.id === selectedDrawingId ? { ...r, commentId: commentId } : r)
 );
 }

 setAllComments([...allComments, commentItem]);
 setNewComment("");
 
 showToast(selectedDrawingId 
 ? `Saran koreksi berhasil ditautkan langsung ke bingkai pada Halaman ${pageNum}!` 
 : `Catatan revisi umum berhasil ditambahkan ke Halaman ${pageNum}!`, "success"
 );

 // Refresh active tab views
 setSidebarTab("page");
 };

 // Toggle status of comment card resolved
 const handleToggleCommentStatus = (commentId: string) => {
 const updated = allComments.map(c => {
 if (c.id === commentId) {
 const nextStatus = c.status === "Selesai" ? "Belum" : "Selesai";
 showToast(nextStatus === "Selesai" ? "Pekerjaan bab ditandai Selesai diperbaiki!" : "Bagian dikembalikan ke status Revisi", "success");
 return { ...c, status: nextStatus as "Belum" | "Selesai" };
 }
 return c;
 });

 setAllComments(updated);

 // Sync database state live so students see updates without refreshing!
 if (activeSession && mutate) {
 const updatedChat = activeSession.riwayatChat.map((m: ChatMessage) => {
 if (m.waktu === msg.waktu && m.lampiranNama === msg.lampiranNama) {
 return {
 ...m,
 comments: JSON.stringify(updated)
 };
 }
 return m;
 });

 mutate("konsultasi", "update", {
 riwayatChat: updatedChat
 }, "id", activeSession.id);
 }
 };

 // Delete index comment
 const handleDeleteComment = (commentId: string) => {
 const filtered = allComments.filter(c => c.id !== commentId);
 setAllComments(filtered);

 // Also clean link on linked rectangle
 setAllDrawings(prev => 
 prev.map(r => r.commentId === commentId ? { ...r, commentId: undefined } : r)
 );

 showToast("Catatan bimbingan dihapus", "warning");

 if (activeSession && mutate) {
 const updatedChat = activeSession.riwayatChat.map((m: ChatMessage) => {
 if (m.waktu === msg.waktu && m.lampiranNama === msg.lampiranNama) {
 return {
 ...m,
 comments: JSON.stringify(filtered)
 };
 }
 return m;
 });

 mutate("konsultasi", "update", {
 riwayatChat: updatedChat
 }, "id", activeSession.id);
 }
 };

 // Save everything and sync back to ChatRoom
 const handleSaveAllReview = () => {
 if (allComments.length === 0 && allDrawings.length === 0) {
 showToast("Silakan tambahkan setidaknya satu coretan bingkai atau ulasan komentar bimbingan.", "warning");
 return;
 }

 if (!activeSession || !onReply) {
 handleSave(); // fallback
 return;
 }

 const commentsJson = JSON.stringify(allComments);
 const drawingsJson = JSON.stringify(allDrawings);

 // Composite rectangles onto background image for rich chat preview thumbnail
 const pCanvas = pdfCanvasRef.current;
 let customSnapshotUrl = msg.lampiranData; // fallback to original PDF base64 raw

 if (pCanvas) {
 const compCanvas = document.createElement("canvas");
 compCanvas.width = pCanvas.width;
 compCanvas.height = pCanvas.height;
 const ctx = compCanvas.getContext("2d");
 if (ctx) {
 // Draw bottom PDF layer
 ctx.drawImage(pCanvas, 0, 0);

 // Map and draw rectangular borders
 const pageRects = allDrawings.filter(r => r.page === pageNum);
 pageRects.forEach(r => {
 const ratio = pCanvas.width / (canvasDim.width || pCanvas.width);
 const sc = scale * ratio;

 // Border Box
 ctx.strokeStyle = r.color === "#ef4444" ? "rgba(239, 68, 68, 1)" : "rgba(16, 185, 129, 1)";
 ctx.lineWidth = 4;
 ctx.strokeRect(r.x * sc, r.y * sc, r.width * sc, r.height * sc);

 // Fill Box
 ctx.fillStyle = r.color === "#ef4444" ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)";
 ctx.fillRect(r.x * sc, r.y * sc, r.width * sc, r.height * sc);

 // Text label pill backdrop
 ctx.fillStyle = r.color === "#ef4444" ? "#ef4444" : "#10b981";
 ctx.fillRect(r.x * sc, (r.y * sc) - 22, 65, 22);

 // Inner text type
 ctx.fillStyle = "#ffffff";
 ctx.font = "bold 11px sans-serif";
 ctx.fillText(r.color === "#ef4444" ? "REVISI" : "SARAN", (r.x * sc) + 8, (r.y * sc) - 7);
 });

 customSnapshotUrl = compCanvas.toDataURL("image/jpeg", 0.7);
 }
 }

 const extendedAttachment: any = {
 lampiranData: msg.lampiranData, // keep High Def original PDF source file
 lampiranNama: msg.lampiranNama,
 lampiranTipe: msg.lampiranTipe,
 isKoreksi: true,
 annotations: drawingsJson,
 comments: commentsJson
 };

 // Construct highly legible index breakdown report
 const infoString = currentUserRole === "Dosen"
 ? `?? **Review Hasil Koreksi Tugas Akhir Selesai**\n` +
 `Disusun oleh dosen pembimbing dengan **${allDrawings.length} lembar bingkai penanda** dan **${allComments.length} catatan perbaikan aktif**.\n\n` +
 `?? *Daftar ulasan yang wajib diperhatikan:*` +
 (allComments.length === 0 ? ` (Ulasan umum di lembar revisi)` : "") +
 allComments.map(c => `\n?? **Hal ${c.pageNum} [${c.bab}]**: "${c.text}"`).slice(-3).join("") +
 (allComments.length > 3 ? `\n...dan ${allComments.length - 3} koreksi dokumen lainnya.` : "") +
 `\n\n*Silakan klik tombol "Lihat Hasil Koreksi" pada jendela chat untuk mengulas detail & menandai status perbaikan.*`
 : `?? **Tanggapan Mahasiswa atas Koreksi Tugas Akhir**\n` +
 `Dikirim oleh mahasiswa dengan **${allComments.filter(c => c.status === "Selesai").length} revisi diselesaikan** dan **${allComments.length} total catatan tanggapan**.\n\n` +
 `?? *Daftar tanggapan & status terbaru:*` +
 (allComments.length === 0 ? ` (Tanggapan umum)` : "") +
 allComments.map(c => `\n?? **Hal ${c.pageNum} [${c.bab}]** (${c.status === "Selesai" ? "? Selesai" : "? Revisi"}): "${c.text}"`).slice(-3).join("") +
 (allComments.length > 3 ? `\n...dan ${allComments.length - 3} tanggapan lainnya.` : "") +
 `\n\n*Dosen Pembimbing silakan klik tombol "View & Koreksi" pada chat untuk mengulas tanggapan balik dan koreksi lanjutan.*`;

 onReply(activeSession.id, infoString, extendedAttachment);
 showToast(currentUserRole === "Dosen" 
 ? "Seluruh berkas hasil koreksi bimbingan berhasil dikirim ke mahasiswa!" 
 : "Seluruh berkas tanggapan & perubahan berhasil dikirim kembali ke dosen pembimbing!", "success");
 onClose();
 };

 // Fallback saver
 const handleSave = () => {
 const pCanvas = pdfCanvasRef.current;
 if (pCanvas) {
 const compCanvas = document.createElement("canvas");
 compCanvas.width = pCanvas.width;
 compCanvas.height = pCanvas.height;
 const ctx = compCanvas.getContext("2d");
 if (ctx) {
 ctx.drawImage(pCanvas, 0, 0);
 const dataUrl = compCanvas.toDataURL("image/jpeg", 0.75);
 onSaveKoreksi(dataUrl);
 onClose();
 }
 } else {
 showToast("Gagal mengekspor file.", "error");
 }
 };

 const thesisChapters = [
 "Bab 1 - Pendahuluan",
 "Bab 2 - Tinjauan Pustaka",
 "Bab 3 - Metodologi Penelitian",
 "Bab 4 - Hasil & Pembahasan",
 "Bab 5 - Kesimpulan & Saran",
 "Umum/Lainnya"
 ];

 const quickPills = [
 { label: "Tata Bahasa", text: "Struktur kalimat kurang baku, harap sesuaikan dengan Kamus Bahasa Indonesia & EYD." },
 { label: "Format SOP", text: "Format spasi paragraf atau margin dokumen tidak sesuai standar SOP Tugas Akhir." },
 { label: "Sitasi Jurnal", text: "Kutipan klaim ini belum didukung referensi sitasi jurnal mutakhir (3 tahun terakhir)." },
 { label: "Pembahasan Kurang", text: "Pembahasan terlalu dangkal. Harap bandingkan analisis hasil Anda dengan teori ilmiah terkait." }
 ];

 const pageFilteredComments = allComments.filter(c => c.pageNum === pageNum);
 const allFilteredComments = allComments.filter(c => {
 if (chapterFilter === "Semua") return true;
 return c.bab.toLowerCase().includes(chapterFilter.toLowerCase());
 });

 return (
 <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[99999] flex items-center justify-center p-2 sm:p-5 animate-fade-in text-slate-800 font-sans">
 <div className="bg-white w-full max-w-6xl h-full sm:h-[94vh] rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
 
 {/* TOP CONTROL HEAD PANEL */}
 <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 shrink-0">
 <div className="flex items-center gap-3 max-w-[55%]">
 <div className="bg-blue-100 text-blue-700 p-2 rounded-xl">
 <Layers size={18} />
 </div>
 <div className="truncate">
 <div className="flex items-center gap-2">
 <span className="text-[10px] uppercase tracking-wider font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded">FITUR ADVANCED</span>
 <span className="text-[10px] text-slate-400 font-semibold">� Interaktif Frame Layer</span>
 </div>
 <span className="font-bold text-sm text-slate-800 block truncate mt-0.5">{msg.lampiranNama}</span>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2.5">
 
 {/* WORKSPACE MODE SELECTORS */}
 {(currentUserRole === "Dosen" || currentUserRole === "Mahasiswa") && (
 <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-300/60">
 <button
 onClick={() => { setMode("view"); setSelectedDrawingId(null); }}
 className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
 mode === "view" 
 ? "bg-white text-slate-900 shadow-sm" 
 : "text-slate-600 hover:text-slate-900"
 }`}
 title="Navigasi & Pilih Kotak"
 >
 <MousePointer2 size={13} />
 <span>Navigasi & Klik</span>
 </button>

 <button
 onClick={() => { setMode("draw"); setColor("#ef4444"); setSelectedDrawingId(null); }}
 className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
 mode === "draw" && color === "#ef4444"
 ? "bg-rose-550 bg-rose-600 text-white shadow-sm" 
 : "text-rose-600 hover:bg-rose-50"
 }`}
 title="Tandai Area Salah (Merah)"
 >
 <Maximize2 size={13} />
 <span>Bingkai Revisi</span>
 </button>

 <button
 onClick={() => { setMode("draw"); setColor("#10b981"); setSelectedDrawingId(null); }}
 className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
 mode === "draw" && color === "#10b981"
 ? "bg-emerald-600 text-white shadow-sm" 
 : "text-emerald-600 hover:bg-emerald-50"
 }`}
 title="Tandai Area Saran (Hijau)"
 >
 <Maximize2 size={13} />
 <span>Bingkai Saran</span>
 </button>

 <button
 onClick={() => { setMode("erase"); setSelectedDrawingId(null); }}
 className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
 mode === "erase" 
 ? "bg-slate-850 bg-slate-800 text-white shadow-sm" 
 : "text-slate-600 hover:text-slate-900"
 }`}
 title="Eraser: Klik bingkai penanda untuk menghapusnya"
 >
 <Eraser size={13} />
 <span>Hapus Bingkai</span>
 </button>
 </div>
 )}

 {/* UNDO / REDO NAVIGATION */}
 {(currentUserRole === "Dosen" || currentUserRole === "Mahasiswa") && (
 <div className="flex bg-slate-100 rounded-lg border border-slate-200 p-0.5">
 <button
 onClick={undo}
 disabled={historyStep < 0}
 className="p-1.5 rounded-md text-slate-500 hover:bg-white disabled:opacity-35 hover:text-slate-900 transition"
 title="Batalkan (Undo)"
 >
 <RotateCcw size={14} />
 </button>
 <button
 onClick={redo}
 disabled={historyStep >= history.length - 1}
 className="p-1.5 rounded-md text-slate-500 hover:bg-white disabled:opacity-35 hover:text-slate-900 transition"
 title="Ulangi (Redo)"
 >
 <History size={14} />
 </button>
 </div>
 )}

 <button 
 onClick={onClose} 
 className="p-2 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition text-slate-500"
 >
 <X size={18} />
 </button>
 </div>
 </div>

 {/* WORKSPACE WORK AREA */}
 <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
 
 {/* THE DOCUMENT CONTAINER AREA (LEFT) */}
 <div className="flex-1 relative bg-slate-100/90 flex flex-col overflow-hidden" ref={containerRef}>
 
 {/* COMPREHENSIVE FLOATING DOC TIPS */}
 <div className="absolute top-4 left-4 z-40 bg-white/95 px-3 py-2 rounded-xl text-xs font-semibold shadow-md border border-slate-200 max-w-[280px]">
 <div className="flex items-center gap-1.5 text-blue-600 font-extrabold mb-0.5">
 <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
 <span>Petunjuk Workspace</span>
 </div>
 <p className="text-[10px] text-slate-500 leading-relaxed">
 {currentUserRole === "Dosen" 
 ? "Pilih mode bingkai (Revisi/Saran), tahan dan tarik tetikus/gerakan jari Anda di atas naskah untuk menandai area perbaikan tugas akhir."
 : "Pilih mode bingkai di atas untuk berdiskusi/menandai, atau ulas perbaikan dengan mengklik setiap bingkai draf berwarna di atas dokumen atau daftar bab di sidebar kanan."}
 </p>
 </div>

 {/* PDF PAGE NAVIGATION CONTROLS */}
 {msg.lampiranTipe !== "Word" && msg.lampiranTipe !== "Image" && pdfDoc !== "error" && (
 <div className="absolute top-4 right-4 z-40 bg-white/95 shadow-md rounded-full px-4 py-2 border border-slate-200 flex gap-4 items-center">
 <div className="flex items-center gap-1.5">
 <button 
 disabled={pageNum <= 1} 
 onClick={() => { setPageNum(p => Math.max(1, p - 1)); setSelectedDrawingId(null); }} 
 className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-20 text-slate-600 hover:text-slate-900 cursor-pointer transition"
 >
 <ChevronLeft size={16} />
 </button>
 <span className="text-xs font-extrabold font-mono text-slate-700 select-none">
 P. {pageNum} / {numPages || "..."}
 </span>
 <button 
 disabled={pageNum >= numPages} 
 onClick={() => { setPageNum(p => Math.min(numPages, p + 1)); setSelectedDrawingId(null); }} 
 className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-20 text-slate-600 hover:text-slate-900 cursor-pointer transition"
 >
 <ChevronRight size={16} />
 </button>
 </div>
 <div className="w-px h-4 bg-slate-300"></div>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => setScale(s => Math.max(0.6, s - 0.2))} 
 className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-blue-600"
 title="Perkecil"
 >
 <ZoomOut size={15} />
 </button>
 <span className="text-xs font-extrabold font-mono text-slate-700 min-w-[36px] text-center">{Math.round(scale * 100)}%</span>
 <button 
 onClick={() => setScale(s => Math.min(2.5, s + 0.2))} 
 className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-blue-600"
 title="Perbesar"
 >
 <ZoomIn size={15} />
 </button>
 </div>
 </div>
 )}

 {/* INTERACTIVE COMPREHENSIVE DOCUMENT INNER CONTAINER */}
 <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
 <div className="flex flex-col items-center py-6 min-w-full min-h-full">
 
 {/* WORD FILE VIEWER */}
 {msg.lampiranTipe === "Word" ? (
 <div className="w-full max-w-3xl mx-auto bg-white text-slate-800 shadow-xl rounded-xl border border-slate-200 overflow-hidden shrink-0">
 <div className="w-full p-8 font-serif leading-relaxed text-slate-700 text-sm">
 {isLoadingWord ? (
 <div className="flex flex-col items-center justify-center p-12 text-slate-500 h-full">
 <Loader size={32} className="animate-spin text-blue-500 mb-4" />
 <p className="font-sans">Mengekstrak dokumen akademik...</p>
 </div>
 ) : (
 wordHtml ? (
 <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: wordHtml }} />
 ) : (
 <div className="text-center font-sans py-12">
 <p>Tidak ada teks di dalam file berkas .docx bimbingan.</p>
 </div>
 )
 )}
 </div>
 </div>
 ) : msg.lampiranTipe === "Image" ? (
 <img 
 src={msg.lampiranData} 
 alt="Review Copy"
 className="w-full max-w-3xl object-contain bg-white shadow-xl rounded-xl border border-slate-200 shrink-0"
 />
 ) : pdfDoc === "error" ? (
 <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-white shadow-xl max-w-2xl rounded-2xl border border-slate-200">
 <AlertCircle size={40} className="text-rose-500 mb-2" />
 <p className="font-extrabold text-slate-800 mb-1">Pratinjau PDF Gagal Tercapai</p>
 <p className="text-xs text-slate-500 mb-4 text-center">Berkas asli PDF dapat dengan aman diunduh untuk divalidasi lokal:</p>
 <a 
 href={msg.lampiranData} 
 download={msg.lampiranNama} 
 className="flex gap-2 items-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
 >
 <Download size={14} /> Unduh Berkas Mahasiswa
 </a>
 </div>
 ) : (
 
 /* PDF FRAME LAYER BOX WITH DRAGGABLE/RESIZABLE OVERLAY VECTOR STRUCTURES */
 <div 
 className="relative shadow-xl border border-slate-300 rounded bg-white" 
 style={{ 
 width: canvasDim.width > 0 ? canvasDim.width : 'auto', 
 height: canvasDim.height > 0 ? canvasDim.height : 'auto' 
 }}
 >
 {isPdfRendering && (
 <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-xs">
 <Loader className="animate-spin text-blue-600" size={24} />
 </div>
 )}

 {/* Render background PDF nodes */}
 <canvas ref={pdfCanvasRef} className="absolute inset-0 z-0 rounded" />
 
 {/* Interactive Rectangle Highlight Drawer layer */}
 <div
 onMouseDown={handleOverlayMouseDown}
 onMouseMove={handleOverlayMouseMove}
 onMouseUp={handleOverlayMouseUp}
 onTouchStart={handleOverlayTouchStart}
 onTouchMove={handleOverlayTouchMove}
 onTouchEnd={handleOverlayTouchEnd}
 className={`absolute inset-0 z-10 w-full h-full rounded select-none ${
 mode === "draw"
 ? "cursor-crosshair"
 : mode === "erase"
 ? "cursor-pointer"
 : "cursor-default"
 }`}
 >
 {/* Draw Existing rectangles in State */}
 {allDrawings.filter(r => r.page === pageNum).map(rect => {
 const isSelected = selectedDrawingId === rect.id;
 
 // Find comment mapped to this rect
 const boundComment = allComments.find(c => c.rectId === rect.id);

 return (
 <div
 key={rect.id}
 onClick={(e) => {
 e.stopPropagation();
 setSelectedDrawingId(rect.id);
 
 // If is eraser mode, delete it immediately
 if (mode === "erase") {
 handleDeleteRectangle(rect.id);
 return;
 }

 // Jump and highlight the associated comment on sidebar list!
 if (boundComment) {
 setSidebarTab("page");
 showToast(`Melihat revisi terkait di Halaman ${pageNum}!`, "success");
 }
 }}
 className={`absolute rounded-lg border-[3px] transition-all group ${
 rect.color === "#ef4444"
 ? "border-rose-500 bg-rose-500/10 hover:bg-rose-500/20"
 : "border-emerald-500 bg-emerald-550 bg-emerald-500/10 hover:bg-emerald-500/20"
 } ${
 isSelected 
 ? "ring-2 ring-blue-500 ring-offset-2 shadow-lg z-30 scale-[1.01]" 
 : "z-20 cursor-pointer"
 }`}
 style={{
 left: rect.x * scale,
 top: rect.y * scale,
 width: rect.width * scale,
 height: rect.height * scale,
 }}
 >
 {/* Little overlay tag label */}
 <div className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[9px] font-bold text-white shadow-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
 rect.color === "#ef4444" ? "bg-rose-600" : "bg-emerald-600"
 }`}>
 <span>{rect.color === "#ef4444" ? "Revisi" : "Saran"}</span>
 {boundComment && <span className="bg-white/20 px-1 rounded">Berkomentar</span>}
 </div>

 {/* Inner Quick info tags if clicked/selected */}
 {isSelected && boundComment && (
 <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white px-2.5 py-1.5 rounded-lg text-[10px] shadow-xl font-medium w-48 truncate text-center z-40">
 "{boundComment.text}"
 </div>
 )}

 {/* Drag handles (Active ONLY for super/admin/lecturer) */}
 {isSelected && (currentUserRole === "Dosen" || currentUserRole === "Mahasiswa") && mode === "view" && (
 <>
 {/* Centered drag handles */}
 <div 
 onMouseDown={(e) => startMove(e, rect.id)}
 className="absolute inset-0 cursor-move flex items-center justify-center bg-transparent"
 title="Tahan dan geser untuk memindahkan bingkai"
 >
 <Move className="text-blue-600 opacity-20 group-hover:opacity-15" size={24} />
 </div>

 {/* Resuming Handles (Pulsing blue nodes) */}
 <div 
 onMouseDown={(e) => startResize(e, rect.id, "top-left")}
 className="absolute -top-2 -left-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-50"
 title="Tarik sudut untuk menyesuaikan ukuran"
 />
 <div 
 onMouseDown={(e) => startResize(e, rect.id, "top-right")}
 className="absolute -top-2 -right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform z-50"
 title="Tarik sudut untuk menyesuaikan ukuran"
 />
 <div 
 onMouseDown={(e) => startResize(e, rect.id, "bottom-left")}
 className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform z-50"
 title="Tarik sudut untuk menyesuaikan ukuran"
 />
 <div 
 onMouseDown={(e) => startResize(e, rect.id, "bottom-right")}
 className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-50"
 title="Tarik sudut untuk menyesuaikan ukuran"
 />

 {/* Quick action small float delete on selected */}
 <button
 onClick={(ep) => { ep.stopPropagation(); handleDeleteRectangle(rect.id); }}
 className="absolute -top-3.5 -right-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white p-1 rounded-full shadow-md hover:scale-115 transition z-50 transition"
 title="Hapus Frame koreksi"
 >
 <Trash2 size={11} />
 </button>
 </>
 )}
 </div>
 );
 })}

 {/* TEMP OUTLINE BEING DRAWN */}
 {tempRect && (
 <div 
 className={`absolute border-[3px] border-dashed rounded-lg ${
 color === "#ef4444" 
 ? "border-rose-500 bg-rose-500/10" 
 : "border-emerald-500 bg-emerald-50/10"
 }`}
 style={{
 left: tempRect.x * scale,
 top: tempRect.y * scale,
 width: tempRect.width * scale,
 height: tempRect.height * scale,
 }}
 />
 )}
 </div>
 </div>
 )}

 </div>
 </div>

 {/* LOWER ACTIONS BAR */}
 <div className="p-3.5 border-t border-slate-200/70 bg-slate-50/90 shrink-0 flex items-center justify-between">
 <span className="text-[11px] text-slate-500 font-medium">
 {currentUserRole === "Dosen" 
 ? "?? Tips: Setelah menggambar bingkai di atas halaman, Anda bisa memindahkan posisi draf dengan memilih mode 'Navigasi & Klik' lalu menarik kotak tersebut."
 : "?? Tips: Anda dapat menandai status revisi menjadi Selesai, menambah komentar tanggapan, atau menggambar bingkai baru lalu mengirimkannya kembali ke pembimbing."}
 </span>

 <button
 onClick={handleSaveAllReview}
 className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
 >
 <CheckCircle2 size={15} />
 <span>
 {currentUserRole === "Dosen" 
 ? "Kirim Semua Koreksi & Catatan" 
 : "Kirim Tanggapan & Perubahan"}
 </span>
 </button>
 </div>

 </div>

 {/* COMMENTS & REVIEWS SIDEBAR (RIGHT) */}
 <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col shrink-0 z-20">
 
 {/* TABS HEADER */}
 <div className="flex border-b border-slate-200 shrink-0">
 <button
 onClick={() => setSidebarTab("page")}
 className={`flex-1 py-3.5 text-xs font-extrabold transition-all border-b-2 text-center cursor-pointer ${
 sidebarTab === "page" 
 ? "border-blue-600 text-blue-600 bg-blue-50/10" 
 : "border-transparent text-slate-500 hover:text-slate-900"
 }`}
 >
 Hal ini ({pageFilteredComments.length})
 </button>
 <button
 onClick={() => setSidebarTab("all")}
 className={`flex-1 py-3.5 text-xs font-extrabold transition-all border-b-2 text-center cursor-pointer ${
 sidebarTab === "all" 
 ? "border-blue-600 text-blue-600 bg-blue-50/10" 
 : "border-transparent text-slate-500 hover:text-slate-900"
 }`}
 >
 Semua Bab ({allComments.length})
 </button>
 </div>

 {/* FILTER DROP DOWN FOR ALL TAB */}
 {sidebarTab === "all" && allComments.length > 0 && (
 <div className="p-2 border-b border-slate-100 bg-slate-50 shrink-0">
 <select
 value={chapterFilter}
 onChange={(e) => setChapterFilter(e.target.value)}
 className="w-full text-xs border border-slate-200 bg-white rounded-md p-1.5 text-slate-705 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
 >
 <option value="Semua">Tampilkan Semua Bab</option>
 <option value="Bab 1">Bab 1 - Pendahuluan</option>
 <option value="Bab 2">Bab 2 - Tinjauan Pustaka</option>
 <option value="Bab 3">Bab 3 - Metodologi</option>
 <option value="Bab 4">Bab 4 - Pembahasan</option>
 <option value="Bab 5">Bab 5 - Kesimpulan</option>
 <option value="Umum">Umum/Lainnya</option>
 </select>
 </div>
 )}

 {/* COMMENTS LIST WRAPPER */}
 <div className="flex-1 p-3 overflow-y-auto bg-slate-50/60 flex flex-col gap-2.5">
 
 {/* TAB 1: CURRENT PAGE COMMENTS */}
 {sidebarTab === "page" && (
 <>
 {pageFilteredComments.length === 0 ? (
 <div className="text-center py-12 px-4 flex flex-col items-center">
 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2.5 text-slate-400">
 <PenTool size={18} />
 </div>
 <p className="text-xs font-extrabold text-slate-600">Belum ada catatan</p>
 <p className="text-[10px] text-slate-400 mt-1 text-center leading-relaxed max-w-[180px]">
 Tandai naskah draf dengan bingkai berwarna untuk menautkan komentar langsung ke lembar halaman ini.
 </p>
 </div>
 ) : (
 pageFilteredComments.map((c) => {
 const hasRect = !!c.rectId;
 const isLinkedSelected = selectedDrawingId === c.rectId;

 return (
 <div 
 key={c.id} 
 onClick={() => {
 if (c.rectId) {
 setSelectedDrawingId(c.rectId);
 showToast("Fokus bingkai penanda aktif!", "success");
 }
 }}
 className={`bg-white border rounded-xl p-3 shadow-sm relative group cursor-pointer transition-all duration-200 ${
 isLinkedSelected
 ? "ring-2 ring-blue-500 border-blue-400 bg-blue-50/5"
 : c.status === "Selesai"
 ? "border-emerald-200 bg-emerald-50/5"
 : "border-slate-200 hover:border-slate-400 bg-white"
 }`}
 >
 <div className="flex justify-between items-start gap-2 mb-1.5">
 <div className="flex flex-col gap-0.5">
 <span className="text-[8px] uppercase tracking-wider font-extrabold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded self-start">
 {c.bab}
 </span>
 {hasRect && (
 <span className="text-[8px] text-indigo-700 font-bold bg-indigo-50 px-1 py-0.5 rounded self-start mt-1">
 ?? Ditautkan ke Bingkai
 </span>
 )}
 </div>
 <button
 onClick={(e) => { e.stopPropagation(); handleToggleCommentStatus(c.id); }}
 className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full transition cursor-pointer flex items-center gap-1 ${
 c.status === "Selesai"
 ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
 : "bg-rose-100 text-rose-800 hover:bg-rose-200"
 }`}
 title="Klik untuk mengubah status pengerjaan"
 >
 <span className={`w-1.5 h-1.5 rounded-full ${c.status === "Selesai" ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`}></span>
 <span>{c.status === "Selesai" ? "Selesai" : "Revisi"}</span>
 </button>
 </div>

 <p className="text-xs leading-relaxed text-slate-700 font-semibold whitespace-pre-wrap">{c.text}</p>
 
 <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-[9px] text-slate-400">
 <span>{c.writer} � Hal {c.pageNum}</span>
 {(currentUserRole === "Dosen" || (currentUserRole === "Mahasiswa" && c.writer === "Mahasiswa")) && (
 <button 
 onClick={(e) => { e.stopPropagation(); handleDeleteComment(c.id); }}
 className="text-rose-450 text-rose-500 hover:text-rose-700 transition-colors p-1 rounded hover:bg-rose-50 cursor-pointer"
 title="Hapus catatan"
 >
 <Trash2 size={10} />
 </button>
 )}
 </div>
 </div>
 );
 })
 )}
 </>
 )}

 {/* TAB 2: INDEXED LIST ACROSS ALL SESSIONS */}
 {sidebarTab === "all" && (
 <>
 {allFilteredComments.length === 0 ? (
 <div className="text-center py-12 px-4">
 <p className="text-xs text-slate-400">Tidak ada catatan review bimbingan pada filter ini.</p>
 </div>
 ) : (
 allFilteredComments.map((c) => (
 <div 
 key={c.id} 
 onClick={() => {
 setPageNum(c.pageNum);
 setSidebarTab("page");
 if (c.rectId) {
 setSelectedDrawingId(c.rectId);
 }
 }}
 className={`bg-white border rounded-xl p-3 shadow-sm cursor-pointer text-left transition-all hover:translate-x-1 duration-150 ${
 c.status === "Selesai" 
 ? "border-emerald-200 bg-emerald-50/10" 
 : "border-slate-200 hover:border-blue-400 hover:shadow-md"
 } ${pageNum === c.pageNum ? "ring-2 ring-blue-500/20" : ""}`}
 >
 <div className="flex justify-between items-start gap-2 mb-1.5">
 <span className="text-[8px] uppercase tracking-wider font-extrabold bg-blue-105 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
 Hal {c.pageNum} � {c.bab}
 </span>
 <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
 c.status === "Selesai" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
 }`}>
 {c.status === "Selesai" ? "Selesai" : "Revisi"}
 </span>
 </div>

 <p className="text-xs text-slate-700 font-bold leading-relaxed truncate">{c.text}</p>
 <span className="text-[8px] text-slate-400 block mt-1.5">
 {c.rectId ? "?? Ditautkan ke nomor Bingkai � Klik untuk melompat" : "Klik untuk melompat ke Halaman " + c.pageNum}
 </span>
 </div>
 ))
 )}
 </>
 )}

 </div>

 {/* WRITE REVISION PANEL (DOSEN & MAHASISWA EDITOR BOX) */}
 {(currentUserRole === "Dosen" || currentUserRole === "Mahasiswa") && (
 <div className="p-3 border-t border-slate-200 bg-white shrink-0 shadow-[0_-5px_15px_-3px_rgba(0,0,0,0.06)]">
 
 {selectedDrawingId ? (
 <div className="mb-2 text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-1 bg-blue-50/80 rounded-lg border border-blue-100 flex items-center justify-between">
 <div className="flex items-center gap-1">
 <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
 <span>Menautkan coretan penanda aktif.</span>
 </div>
 <button 
 onClick={() => setSelectedDrawingId(null)} 
 className="text-[9px] underline font-bold hover:text-blue-900"
 >
 Batal Taut
 </button>
 </div>
 ) : (
 mode === "draw" && (
 <div className="mb-2 text-[10px] bg-amber-50 text-amber-700 font-semibold px-2.5 py-1.5 rounded-lg border border-amber-100 flex items-center gap-1">
 <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
 <span>Tarik bingkai baru untuk menautkan ulasan secara presisi!</span>
 </div>
 )
 )}
 
 <div className="flex gap-2 max-w-full mb-2">
 <div className="w-1/2">
 <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Lembar Halaman</label>
 <div className="bg-slate-100 px-2 py-1.5 text-xs text-slate-700 font-extrabold rounded-lg border border-slate-200">
 Hal {pageNum}
 </div>
 </div>
 
 <div className="w-1/2">
 <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Seksi Bab Tugas Akhir</label>
 <select
 value={selectedBab}
 onChange={(e) => setSelectedBab(e.target.value)}
 className="w-full text-xs border border-slate-200 bg-slate-50 rounded-lg p-1.5 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 font-bold"
 >
 {thesisChapters.map((ch) => (
 <option key={ch} value={ch}>{ch}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Google AI Recommendations Button */}
 <div className="mb-2">
 <button
 type="button"
 onClick={handleGetAiSuggestions}
 disabled={isLoadingAI}
 className="w-full py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:from-emerald-850 active:to-teal-900 disabled:opacity-50 text-white text-[10.5px] font-extrabold rounded-xl shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
 >
 <Sparkles size={11} className={isLoadingAI ? "animate-spin" : "animate-pulse"} />
 <span>{isLoadingAI ? "Google AI Menganalisis..." : "Dapatkan Masukan Google AI (Inotna)"}</span>
 </button>
 </div>

 {/* Recs Panel rendering */}
 {showAIPanel && (
 <div className="mb-2.5 p-2 bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border border-emerald-100 rounded-xl">
 <div className="flex justify-between items-center mb-1">
 <div className="flex items-center gap-1 text-emerald-850">
 <Bot size={12} className="text-emerald-700" />
 <span className="text-[9.5px] font-extrabold uppercase tracking-wide">Rekomendasi Akademis</span>
 </div>
 <button 
 type="button"
 onClick={() => setShowAIPanel(false)}
 className="text-[10px] text-slate-405 font-bold hover:text-slate-600"
 >
 Tutup
 </button>
 </div>

 {isLoadingAI ? (
 <div className="py-3 text-center">
 <div className="inline-block w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
 <p className="text-[8.5px] text-slate-500 font-semibold mt-1">AI sedang menganalisis draf bimbingan...</p>
 </div>
 ) : aiSuggestions.length === 0 ? (
 <p className="text-[9px] text-slate-500 italic text-center py-1.5">Tidak tersedia saran. Silakan klik ulang.</p>
 ) : (
 <div className="flex flex-col gap-1">
 {aiSuggestions.map((suggestion, idx) => (
 <div 
 key={idx} 
 onClick={() => {
 setNewComment(suggestion);
 showToast("Saran Google AI berhasil disalin!", "success");
 }}
 className="p-1.5 bg-white hover:bg-emerald-550/5 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-250 hover:border-emerald-200 rounded-lg text-[9px] font-semibold text-slate-700 leading-normal cursor-pointer transition-all flex items-start gap-1 group"
 >
 <span className="text-emerald-600 font-bold shrink-0">{idx + 1}.</span>
 <div className="flex-1">
 <p className="group-hover:text-emerald-900 transition-colors">{suggestion}</p>
 <span className="text-[7.5px] text-emerald-700 font-extrabold block mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
 ? Klik untuk Terapkan ke Catatan
 </span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* TEXT REC EDITOR BOX */}
 <textarea
 ref={commentInputRef}
 value={newComment}
 onChange={(e) => setNewComment(e.target.value)}
 className="w-full text-xs border border-slate-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 resize-none outline-none transition-all placeholder:text-slate-400 font-semibold leading-relaxed"
 placeholder={selectedDrawingId 
 ? "Tulis ulasan/revisi spesifik untuk area berkas yang telah Anda tandai bibir bingkai penunjuk ini..." 
 : "Tulis ulasan umum/kesalahan pada lembar halaman ini..."}
 rows={3}
 />

 {/* INSTANT PILLS ACCELERATOR */}
 <div className="my-2 select-none">
 <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-1">Gunakan Pola Baku:</p>
 <div className="flex flex-wrap gap-1">
 {quickPills.map((pill) => (
 <button
 key={pill.label}
 type="button"
 onClick={() => setNewComment(pill.text)}
 className="text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md transition duration-150 cursor-pointer"
 >
 + {pill.label}
 </button>
 ))}
 </div>
 </div>

 <button
 type="button"
 onClick={handleAddComment}
 className="w-full mt-2.5 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
 >
 <Plus size={15} />
 <span>Tambahkan Catatan ke Bab ini</span>
 </button>

 </div>
 )}

 </div>

 </div>

 </div>
 </div>
 );
}

