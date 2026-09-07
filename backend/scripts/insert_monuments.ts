import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../frontend/.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function seed() {
  const data = JSON.parse(fs.readFileSync('parsed_monuments.json', 'utf8'));
  console.log(`Ready to insert ${data.length} monuments.`);

  const batchSize = 1000;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    console.log(`Inserting batch ${i} to ${i + batchSize}...`);
    
    // We only insert the 'monuments' table for now
    // Some monument names might be duplicates in the PDF, so we ignore duplicates
    const { error } = await supabase.from('monuments').upsert(batch, { onConflict: 'name', ignoreDuplicates: true });
    if (error) {
      console.error('Error inserting batch:', error);
    }
  }

  console.log('Seeding complete.');
}

seed();
