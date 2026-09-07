import { Router } from 'express';
import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const monumentsRouter = Router();

let supabase: any = null;
function getSupabase() {
  if (!supabase && process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY)) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || ''
    );
  }
  return supabase;
}

monumentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const client = getSupabase();
    if (!client) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }
    
    const { data, error } = await client
      .from('monuments')
      .select('*, monument_logistics(*)');
    
    if (error) {
      console.error("Supabase query error:", error);
      res.status(500).json({ error: 'Failed to fetch monuments from database' });
      return;
    }

    if (data) {
      const result = data.map((m: any) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        architectural_style: m.architectural_style,
        built_century: m.built_century,
        lat: m.lat,
        lng: m.lng,
        street_view_id: m.street_view_id,
        logistics: m.monument_logistics?.[0]
      }));
      res.json(result);
      return;
    }
    
    res.json([]);
  } catch (err) {
    console.error("Supabase query failed in backend", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
