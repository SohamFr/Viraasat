import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../frontend/.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function seedLogistics() {
  console.log("Fetching monuments...");
  const { data: monuments, error } = await supabase.from('monuments').select('id');
  if (error || !monuments) {
    console.error("Failed to fetch monuments:", error);
    return;
  }

  console.log(`Found ${monuments.length} monuments. Inserting logistics...`);
  const logistics = monuments.map(m => ({
    monument_id: m.id,
    opening_time: '06:00',
    closing_time: '18:00',
    closed_days: 'None',
    ticket_indian: 50,
    ticket_foreigner: 600,
    ticket_saarc: 50,
    ticket_student: 0,
    camera_fee: 25,
    booking_url: 'https://asi.payumoney.com/'
  }));

  const batchSize = 1000;
  for (let i = 0; i < logistics.length; i += batchSize) {
    const batch = logistics.slice(i, i + batchSize);
    console.log(`Inserting batch ${i} to ${i + batchSize}...`);
    const { error: insertError } = await supabase.from('monument_logistics').upsert(batch, { onConflict: 'monument_id', ignoreDuplicates: true });
    if (insertError) {
      console.error('Error inserting logistics:', insertError);
    }
  }
  
  console.log("Logistics seeding complete.");
}

seedLogistics();
