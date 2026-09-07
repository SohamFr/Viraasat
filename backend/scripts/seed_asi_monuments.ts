import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

async function parsePDF() {
  const pdfPath = 'C:/Users/suman/.gemini/antigravity-ide/brain/41d290e9-f1a4-4f76-b22a-78f1a06f1e3b/.user_uploaded/media_1788769811525.pdf';
  const dataBuffer = fs.readFileSync(pdfPath);

  try {
    const parse = typeof pdf === 'function' ? pdf : pdf.default;
    const data = await parse(dataBuffer);
    fs.writeFileSync('pdf_extracted.txt', data.text);
    console.log(`Extracted ${data.numpages} pages.`);
  } catch (err) {
    console.error('Failed to parse PDF', err);
  }
}

parsePDF();
