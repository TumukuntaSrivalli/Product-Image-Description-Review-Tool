import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Locate authoritative fixture and assets
const ROOT_DIR = path.resolve(__dirname, '..');
const FIXTURE_PATH = fs.existsSync(path.join(ROOT_DIR, 'Starter_Data', 'C04', 'fixture.json'))
  ? path.join(ROOT_DIR, 'Starter_Data', 'C04', 'fixture.json')
  : path.join(__dirname, 'data', 'fixture.json');

const ASSETS_DIR = fs.existsSync(path.join(ROOT_DIR, 'Starter_Data', 'assets'))
  ? path.join(ROOT_DIR, 'Starter_Data', 'assets')
  : path.join(__dirname, 'assets');

// Serve static assets with graceful fallback
app.use('/assets', express.static(ASSETS_DIR));

// Fallback for missing asset
app.get('/assets/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(ASSETS_DIR, filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <rect width="400" height="300" fill="#232F3E" rx="8" />
    <text x="200" y="150" text-anchor="middle" fill="#FF9900" font-family="sans-serif" font-size="14">Image Not Found: ${filename}</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// GET /api/products - Read authoritative fixture and return P01..P10
app.get(['/api/products', '/products'], (req, res) => {
  try {
    const raw = fs.readFileSync(FIXTURE_PATH, 'utf-8');
    const fixture = JSON.parse(raw);
    const images = (fixture.records?.images || []).slice(0, 10);
    res.json({
      case_id: fixture.case_id || 'C04',
      synthetic: fixture.synthetic ?? true,
      images,
    });
  } catch (err) {
    console.error('Error reading fixture:', err.message);
    res.status(500).json({ error: 'Failed to read fixture data' });
  }
});

// POST /generate-description - Call Gemini API with C04 rules and image
app.post('/generate-description', async (req, res) => {
  const productId = req.body.productId || req.body.product_id;
  const metadataTitle = req.body.metadataTitle || req.body.metadata_title;
  const visibleDescription = req.body.visibleDescription || req.body.visible_description;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in backend/.env' });
  }

  // Find local image file
  const imageFilename = `${productId}.png`;
  const imagePath = path.join(ASSETS_DIR, imageFilename);

  let inlineData = null;
  if (fs.existsSync(imagePath)) {
    try {
      const buffer = fs.readFileSync(imagePath);
      inlineData = {
        mimeType: 'image/png',
        data: buffer.toString('base64'),
      };
    } catch (e) {
      console.warn('Could not read image file for base64:', e.message);
    }
  }

  // Construct strict C04 prompt
  const systemPrompt = `You are an image description drafter for e-commerce catalog accessibility under Case C04 rules.
Describe ONLY observable visual details (color, shape, visible object type, visible text/labels, layout).
Do NOT claim material (like cotton, leather, steel, ceramic), brand, certification, performance (like waterproof, durable, ergonomic), identity, dimensions, or specifications that are not visibly verifiable in the image. Metadata titles (like "${metadataTitle || ''}") are metadata, not proof of material or performance.
Keep the text concise (target under 125 characters, maximum 250 characters), screen-reader friendly, and in natural language, with uncertainty left for the human editor.
Do not start with "image of", "picture of", or "photo of". Return ONLY the description text.`;

  const parts = [{ text: systemPrompt }];
  if (inlineData) {
    parts.push({ inlineData });
  } else if (visibleDescription) {
    parts.push({ text: `Visible reference details: ${visibleDescription}` });
  }

  // Attempt generation using available active models
  const modelsToTry = [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest'
  ];
  let generatedText = null;
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 300,
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        lastError = errJson.error?.message || `HTTP ${response.status}`;
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (rawText) {
        generatedText = rawText.replace(/^["']|["']$/g, '').trim();
        break;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  if (generatedText) {
    return res.json({
      productId,
      description: generatedText,
      source: 'Gemini API',
    });
  }

  // Clean error response without leaking API keys
  console.error('Gemini generation failed:', lastError);
  return res.status(502).json({
    error: 'Failed to generate description from Gemini API. Please try again.',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'VarnX', backend: 'express', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Node Express Server running on http://localhost:${PORT}`);
});
