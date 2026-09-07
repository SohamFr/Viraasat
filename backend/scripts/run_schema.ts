import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const projectId = process.env.SUPABASE_URL?.split('//')[1].split('.')[0];
  const password = process.env.DATABASE_PASSWORD;
  
  if (!projectId || !password) {
    console.error('Missing credentials');
    process.exit(1);
  }

  const connectionString = `postgresql://postgres.${projectId}:${password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
  
  // Try connecting via pooler first, fallback to direct connection
  let sql = postgres(connectionString, { ssl: 'require' });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf-8');
    await sql.unsafe(schemaSql);
    console.log('Successfully executed schema.sql');
  } catch (error: any) {
    console.error('Failed with pooler connection, trying direct connection...', error.message);
    const directConnString = `postgresql://postgres:${password}@db.${projectId}.supabase.co:5432/postgres`;
    sql = postgres(directConnString, { ssl: 'require' });
    try {
      const schemaSql = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf-8');
      await sql.unsafe(schemaSql);
      console.log('Successfully executed schema.sql via direct connection');
    } catch (e: any) {
      console.error('Failed direct connection as well:', e.message);
    }
  } finally {
    await sql.end();
  }
}

run();
