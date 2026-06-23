import fs from "fs";
import path from "path";

const filesToDownload = [
  { path: "src/utils/printHelper.ts", id: "1l-LxcLO-jpiVD-2y9CrIvlPA-cOepoAI" }
];

async function downloadFile(filePath: string, fileId: string) {
  const url = `https://docs.google.com/uc?export=download&id=${fileId}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
       throw new Error(`Failed to download ${filePath}: ${response.statusText}`);
    }
    const content = await response.text();
    
    const fullPath = path.join(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
       fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Successfully downloaded: ${filePath} (${content.length} bytes)`);
  } catch (error) {
    console.error(`Error downloading file ${filePath}:`, error);
  }
}

async function run() {
  console.log("Starting downloads for utils files...");
  await Promise.all(filesToDownload.map(f => downloadFile(f.path, f.id)));
  console.log("Finished all utils downloads.");
}

run();
