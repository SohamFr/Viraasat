const fs = require('fs');

function parseMonuments() {
  const text = fs.readFileSync('pdf_extracted.txt', 'utf8');
  const lines = text.split('\n');
  
  const monuments = [];
  let currentState = 'Unknown';
  let currentCircle = 'Unknown';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Attempt to detect state headers like "Andhra Pradesh (Amaravati Circle)"
    const stateMatch = line.match(/^([a-zA-Z\s]+)\s*\((.*?Circle)\)/i);
    if (stateMatch) {
      currentState = stateMatch[1].trim();
      currentCircle = stateMatch[2].trim();
      continue;
    }
    
    // Look for lines that start with "1. " or "2. " etc.
    const match = line.match(/^(\d+)\.\s+(.*)$/);
    if (match) {
      let content = match[2].trim();
      // Heuristic: district is usually the last word, locality is before it. 
      // But because formatting is messy, let's just use the content as name for now.
      // E.g. "Veerabhadra temple Lepakashi Anantapuramu"
      // We'll split by 2+ spaces if they exist.
      let parts = content.split(/\s{2,}/);
      
      let name = parts[0] || 'Unknown Monument';
      let locality = parts.length > 1 ? parts[1] : '';
      let district = parts.length > 2 ? parts[2] : locality;
      
      // Basic cleanup
      name = name.replace(/[^a-zA-Z0-9\s\(\)\-]/g, '').trim();

      if (name.length > 3) {
        monuments.push({
          name: name,
          state: currentState,
          circle: currentCircle,
          locality: locality,
          district: district,
          lat: 20 + (Math.random() * 10 - 5), // Mock coordinates for now
          lng: 78 + (Math.random() * 10 - 5),
          description: `An ancient ASI protected monument located in ${district || locality || currentState}.`
        });
      }
    }
  }

  console.log(`Parsed ${monuments.length} monuments using heuristics.`);
  
  // Write to a JSON file to verify
  fs.writeFileSync('parsed_monuments.json', JSON.stringify(monuments, null, 2));
  
  return monuments;
}

parseMonuments();
