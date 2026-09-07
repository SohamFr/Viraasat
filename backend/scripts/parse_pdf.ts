import fs from 'fs';
import path from 'path';

// This script reads the transcript, extracts the PDF OCR, parses it into JSON, and generates SQL inserts.
const transcriptPath = 'transcript_extract.json';

function parseOCR() {
  if (!fs.existsSync(transcriptPath)) {
    console.error('Transcript not found at', transcriptPath);
    return;
  }

  const fileContent = fs.readFileSync(transcriptPath, 'utf16le');
  let ocrContent = '';

  const match = fileContent.match(/==Start of PDF==[\s\S]*==End of PDF==/);
  if (match) {
    ocrContent = match[0];
    console.log("PDF text found! Starts with: ", ocrContent.substring(0, 100));
  }

  if (!ocrContent) {
    console.log('No OCR content found in transcript.');
    return;
  }

  const pages = ocrContent.split('==Start of OCR for page');
  
  const monuments: any[] = [];
  let currentState = '';
  
  for (const page of pages) {
    if (!page.includes('==End of OCR for page')) continue;
    const text = page.split('==End of OCR for page')[0].split('\n').slice(1).join('\n'); // remove page number line
    
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Look for State headers
      // Typically: "List of Centrally Protected Monuments / Sites under the jurisdiction of StateName"
      // Or just bold state names in the index, but let's try to capture state headers.
      if (line.includes('jurisdiction of') || line.includes('under the jurisdiction of')) {
        let stateLine = line.split('jurisdiction of')[1]?.trim() || '';
        if (!stateLine && i + 1 < lines.length) {
          stateLine = lines[i+1].trim();
        }
        // clean up state name
        stateLine = stateLine.replace(/\(.*\)/g, '').trim(); // Remove circle names
        if (stateLine && stateLine.length > 2) {
          currentState = stateLine;
        }
      }

      // Try to match table rows
      // Format: Sl.No. Name Locality District
      // Usually starts with a number followed by a dot
      const match = line.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        // This is a complex parsing task because columns are space separated and can wrap.
        // For a simpler approach, let's just capture the whole line as the name and clean it up.
        // A proper regex or column-based parser would be needed for exact splitting.
        // Let's split by 2 or more spaces, or tabs
        let parts = match[2].split(/\s{2,}|\t/);
        
        let name = parts[0];
        let locality = parts.length > 1 ? parts[1] : '';
        let district = parts.length > 2 ? parts[2] : '';
        
        monuments.push({
          state: currentState,
          name: name,
          locality: locality,
          district: district,
          raw: line
        });
      }
    }
  }

  console.log(`Parsed ${monuments.length} monuments.`);
  fs.writeFileSync('monuments_parsed.json', JSON.stringify(monuments, null, 2));
}

parseOCR();
