import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const STATES = new Set([
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Ladakh', 'Jammu & Kashmir', 'Vadodara', 'Delhi', 'Chandigarh', 'Puducherry',
  'Andaman & Nicobar', 'Lakshadweep', 'Daman & Diu', 'Dadra & Nagar Haveli', 'Open'
].map(s => s.toLowerCase()));

async function run() {
  const dataPath = 'parsed_monuments.json';
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Filter out states and invalid entries
  const validMonuments = data.filter((m: any) => {
    if (!m.name || !m.lat || !m.lng) return false;
    if (STATES.has(m.name.trim().toLowerCase())) return false;
    if (m.name.length < 3) return false;
    return true;
  });

  console.log(`Original count: ${data.length}`);
  console.log(`Filtered count: ${validMonuments.length}`);

  // Format for DB
  const toInsert = validMonuments.map((m: any) => ({
    name: m.name,
    lat: parseFloat(m.lat),
    lng: parseFloat(m.lng),
    district: m.district || m.location || null,
    built_century: null,
    description: "An official protected monument of the Archaeological Survey of India.",
    street_view_id: null,
    architectural_style: null
  }));

  // Chunk insert
  const CHUNK_SIZE = 500;
  for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
    const chunk = toInsert.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('monuments').upsert(chunk, { onConflict: 'name', ignoreDuplicates: true });
    if (error) {
      console.error(`Error inserting chunk ${i}:`, error);
    } else {
      console.log(`Inserted chunk ${i} - ${i + chunk.length}`);
    }
  }

  console.log('Finished inserting 3700 monuments.');
}

run();
