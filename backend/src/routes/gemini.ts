import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

import type { Request, Response } from 'express';

export const geminiRouter = Router();

// ── Initialize Gemini client ───────────────────────────────────
let genAI: GoogleGenerativeAI | null = null;

/**
 * POST /api/vision
 *
 * Accepts an image (as base64) and coordinates,
 * then forwards the request to the Gemini Vision model server-side.
 */
geminiRouter.post('/vision', async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is missing.');
    res.status(500).json({ error: 'AI_ANALYSIS_FAILED', message: 'API key is missing on the server.' });
    return;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }

  try {
    const { imageBase64, mimeType, lat, lng } = req.body;

    if (!imageBase64 || !mimeType || lat === undefined || lng === undefined) {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Missing required fields: imageBase64, mimeType, lat, lng.',
      });
      return;
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const imagePart = {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    };

    const prompt = `You are an expert Indian historian. The user is at GPS coordinates [${lat}, ${lng}]. They took this image. Identify the cultural heritage structure. 
If the image does NOT depict a cultural heritage structure, return this exact JSON: { "name": "Not a Monument", "history_slides": ["This image does not appear to be a cultural heritage site.", "Please point your camera at a historical structure."], "architectural_style": "N/A", "built_century": "N/A", "confidence_score": 0 }.
Otherwise, return a valid JSON object strictly matching this exact schema: { "name": "Monument Name", "history_slides": ["Slide 1: Origin and builder", "Slide 2: Architectural significance", "Slide 3: Cultural impact"], "architectural_style": "e.g., Rajput", "built_century": "e.g., 16th Century", "confidence_score": <number between 0-100> }.
Do not include any other text, markdown formatting, or code blocks.`;

    // ── Call Gemini Vision ──────────────────────────────────────
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    
    // Attempt to parse the JSON to ensure it's valid before sending it back
    const jsonResponse = JSON.parse(text);

    res.json(jsonResponse);
  } catch (err: any) {
    console.error('Gemini Vision API error:', err.message);
    res.status(500).json({ error: 'AI_ANALYSIS_FAILED', message: 'Could not process the image. Please try again.' });
  }
});

/**
 * GET /api/guide/:name
 *
 * Fetches dynamic Traveler Intelligence from Gemini AI.
 */
geminiRouter.get('/guide/:name', async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API_KEY_MISSING' });

  if (!genAI) genAI = new GoogleGenerativeAI(apiKey);

  try {
    const name = decodeURIComponent(req.params.name);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `You are an expert Indian travel guide. Provide traveler intelligence for the monument: "${name}".
Return a valid JSON object strictly matching this exact schema:
{
  "best_season": "string",
  "golden_hour_tips": "string",
  "peak_rush_warning": "string",
  "dress_code": "string",
  "secret_trivia": "string"
}`;

    const result = await model.generateContent(prompt);
    res.json(JSON.parse(result.response.text()));
  } catch (err: any) {
    console.error('Gemini Guide API error:', err.message);
    res.status(500).json({ error: 'AI_GUIDE_FAILED' });
  }
});
