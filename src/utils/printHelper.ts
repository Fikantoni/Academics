import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Utility helper to handle high-fidelity printing.
 * Creates an offline hidden iframe, copies active styling assets,
 * injects the target print container's HTML content, and invokes the system print dialog.
 * This guarantees the user is forwarded directly to the printer layout without UI clutter.
 */
export function printElementById(elementId: string): boolean {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Elemen cetak dengan ID "${elementId}" tidak ditemukan. Menggunakan cetak default.`);
    window.print();
    return false;
  }

  // Create temporary hidden iframe
  const iframe = document.createElement("iframe");
  iframe.name = "print_iframe_target";
  iframe.setAttribute("title", "Print Document Frame");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  document.body.appendChild(iframe);

  const iframeWindow = iframe.contentWindow;
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  
  if (!iframeWindow || !iframeDoc) {
    console.warn("Gagal membuat konteks dokumen cetak. Menggunakan cetak default.");
    window.print();
    document.body.removeChild(iframe);
    return true;
  }

  // Capture all current stylesheets and font tags from the host DOM
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((styleNode) => styleNode.outerHTML)
    .join("\n");

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Cetak Dokumen - FIKPsi</title>
        ${stylesheets}
        <style>
          @page {
            size: 215mm 330mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Times New Roman', Times, serif;
          }
          /* Ensure print box spans full width cleanly on F4 and background colors render properly */
          #print-area, #printable-report, .printable-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 1.8cm !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          /* Hide screen-specific helpers */
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="print-container bg-white text-black">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Focus and trigger system printer dialog
  setTimeout(() => {
    try {
      iframeWindow.focus();
      iframeWindow.print();
    } catch (err) {
      console.error("Gagal menjalankan fungsi print lewat iframe, mengalihkan ke cetak layar:", err);
      window.print();
    } finally {
      // Remove the temporary element after document handover to system printer
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  }, 500);

  return true;
}

/**
 * Downloads the inner HTML elements bundled as a fully responsive standalone HTML file.
 * This completely bypasses securely sealed iframe sandbox download constraints by launching in a new tab
 * where the user can easily print (Ctrl + P) with zero blockages.
 */
export function downloadStandaloneHtml(elementId: string, filename: string): boolean {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Elemen cetak dengan ID "${elementId}" tidak ditemukan.`);
    return false;
  }

  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((styleNode) => styleNode.outerHTML)
    .join("\n");

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>${filename.replace(".html", "").replace(/_/g, " ")}</title>
        ${stylesheets}
        <style>
          @page {
            size: 215mm 330mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Times New Roman', Times, serif;
          }
          #print-area, #printable-report, .printable-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 2cm !important;
            width: 100% !important;
            max-width: 21.5cm !important;
            margin: 0 auto !important;
            min-height: 33cm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
          .helper-banner {
            background: #f0fdf4;
            border-bottom: 1px solid #bbf7d0;
            color: #15803d;
            padding: 14px;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 13.5px;
            text-align: center;
            font-weight: bold;
          }
          @media print {
            .helper-banner {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="helper-banner no-print">
          🖨️ Dokumen Resmi Universitas Muhammadiyah Pontianak Siap Cetak.<br/>
          Silakan tekan tombol <kbd style="background:white; border:1px solid #ccc; padding:2px 6px; border-radius:4px;">Ctrl + P</kbd> 
          (atau <kbd style="background:white; border:1px solid #ccc; padding:2px 6px; border-radius:4px;">Cmd + P</kbd> di Mac) untuk mencetak langsung atau menyimpannya sebagai file PDF resmi.
        </div>
        <div class="print-container bg-white text-black">
          ${element.outerHTML}
        </div>
        <script>
          // Automatically trigger printer dialog
          window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
              window.print();
            }, 600);
          });
        </script>
      </body>
    </html>
  `;

  try {
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    return true;
  } catch (err) {
    console.error("Gagal mendownload standalone HTML:", err);
    return false;
  }
}

/**
 * Converts a DOM container target to a high-contrast standard PDF document download.
 */
export async function downloadPdfFromElement(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) return false;

  const originalScrollY = window.scrollY;
  const originalScrollX = window.scrollX;

  try {
    // Scroll element container to top of viewport to prevent html2canvas viewport rendering limitation
    window.scrollTo(0, 0);

    const canvas = await html2canvas(element, {
      scale: 1.8,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const svgs = clonedDoc.querySelectorAll("svg");
        svgs.forEach((svg) => {
          const parent = svg.parentNode;
          if (parent) {
            const span = clonedDoc.createElement("span");
            span.style.color = "#10b981";
            span.style.fontWeight = "bold";
            span.style.marginRight = "4px";
            span.innerHTML = "✓ ";
            parent.replaceChild(span, svg);
          }
        });
      }
    });

    window.scrollTo(originalScrollX, originalScrollY);

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF("p", "mm", [215, 330]);
    const imgWidth = 215;
    const pageHeight = 330;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    try {
      const blob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (blobError) {
      console.warn("Direct blob download failed, falling back to pdf.save:", blobError);
      pdf.save(filename);
    }
    return true;
  } catch (err) {
    console.error("Gagal mendownload PDF:", err);
    window.scrollTo(originalScrollX, originalScrollY);
    // As a final ultimate fallback, try direct pdf.save in case the capture worked but download link failed
    try {
      console.log("Mencoba ultimate fallback pdf.save...");
      // We can't reuse the canvas if it failed, but we can alert or suggest alternatives
    } catch (secondErr) {
      console.error(secondErr);
    }
    return false;
  }
}

/**
 * Opens a printed element beautifully in a standalone new browser window or tab,
 * bypassing any parent iframe sandboxing limitations (e.g. Chrome's block on downloads from iframes).
 * It includes an interactive control bar to easily trigger the native browser print/save layout.
 */
export function openInNewTabForPrint(elementId: string, docTitle: string): boolean {
  const element = document.getElementById(elementId);
  if (!element) return false;

  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((styleNode) => styleNode.outerHTML)
    .join("\n");

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>${docTitle}</title>
        ${stylesheets}
        <style>
          @page {
            size: 215mm 330mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            color: #000000;
            font-family: 'Times New Roman', Times, serif;
          }
          #print-area, #printable-report, .printable-sheet {
            border: none !important;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
            padding: 2cm !important;
            width: 100% !important;
            max-width: 21.5cm !important;
            margin: 30px auto !important;
            min-height: 33cm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-sizing: border-box !important;
          }
          @media print {
            body {
              background-color: #ffffff;
            }
            #print-area, #printable-report, .printable-sheet {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 1.8cm !important;
              max-width: 100% !important;
            }
            .no-print {
              display: none !important;
            }
          }
          /* Control bar */
          .control-header-bar {
            background: #0f172a;
            color: #ffffff;
            padding: 14px 28px;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 99999;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          }
          .control-header-bar .brand-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .control-header-bar h1 {
            font-size: 15px;
            font-weight: 700;
            margin: 0;
            color: #f8fafc;
            letter-spacing: 0.01em;
          }
          .control-header-bar p {
            font-size: 11px;
            margin: 2px 0 0 0;
            color: #94a3b8;
          }
          .btn-print {
            background: #10b981;
            color: white;
            font-weight: bold;
            font-size: 13px;
            padding: 8px 18px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            transition: background 0.15s ease-in-out;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .btn-print:hover {
            background: #059669;
          }
          .btn-close {
            background: transparent;
            color: #94a3b8;
            font-weight: 500;
            font-size: 13px;
            padding: 8px 14px;
            border-radius: 6px;
            border: 1px solid #334155;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
          }
          .btn-close:hover {
            color: white;
            background: #334155;
          }
        </style>
      </head>
      <body>
        <div class="control-header-bar no-print">
          <div class="brand-info">
            <div>
              <h1>🎓 Portal Dokumen Resmi - UM Pontianak FIKPsi</h1>
              <p>Klik tombol hijau di sebelah kanan untuk mencetak fisik atau menyimpan dokumen ini sebagai file PDF dengan kualitas terbaik (vektor tajam).</p>
            </div>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn-print" onclick="window.print()">
              <span>🖨️ Cetak / Simpan sebagai PDF</span>
            </button>
            <button class="btn-close" onclick="window.close()">
              Tutup Halaman
            </button>
          </div>
        </div>
        <div class="print-container">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `;

  try {
    const win = window.open("", "_blank");
    if (!win) {
      alert("Pembukaan tab baru diblokir oleh browser. Harap ijinkan popup (pop-up) untuk situs ini agar cetakan dapat ditampilkan.");
      return false;
    }
    win.document.open();
    win.document.write(fullHtml);
    win.document.close();
    return true;
  } catch (err) {
    console.error("Gagal membuka tab baru:", err);
    return false;
  }
}

