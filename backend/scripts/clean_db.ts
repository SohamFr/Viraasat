import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../frontend/.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

const names = ['Amber Fort', 'Hawa Mahal', 'Jantar Mantar', 'Taj Mahal', 'Group of Monuments at Hampi', 'Varanasi Ghats (Dashashwamedh)', 'Konark Sun Temple', 'Gateway of India'];

async function run() {
  const { data, error } = await supabase.from('monuments').delete().not('name', 'in', `(${names.join(',')})`);
  console.log("Deleted fake monuments:", error || 'Success');
  process.exit(0);
}
run();
