import { Router } from 'express';
import type { Request, Response } from 'express';
import { fetchMonumentSummary, searchMonument } from '../services/wikimedia.js';

export const wikimediaRouter = Router();

wikimediaRouter.get('/monument', async (req: Request, res: Response) => {
  try {
    const name = req.query.name as string;

    if (!name) {
      res.status(400).json({ error: 'MISSING_PARAMETER', message: 'Monument name is required.' });
      return;
    }

    let summary = await fetchMonumentSummary(name);

    if (!summary) {
      // Not found, try searching for closest match
      const closestTitle = await searchMonument(name);
      
      if (closestTitle) {
        summary = await fetchMonumentSummary(closestTitle);
      }
    }

    if (!summary) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'No historical records found for this monument on Wikimedia.' });
      return;
    }

    res.json(summary);
  } catch (error: any) {
    if (error.message === 'WIKIMEDIA_403') {
      console.error('❌ WIKIMEDIA 403: User-Agent policy violation or invalid OAuth token');
      res.status(502).json({ error: 'BAD_GATEWAY', message: 'Failed to communicate with Wikimedia services.' });
      return;
    }

    console.error('Wikimedia Route Error:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected network error occurred.' });
  }
});
