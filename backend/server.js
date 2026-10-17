import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Locate authoritative fixture and assets
const ROOT_DIR = path.resolve(__dirname, '..');
const FIXTURE_PATH = fs.existsSync(path.join(ROOT_DIR, 'Starter_Data', 'C04', 'fixture.json'))
  ? path.join(ROOT_DIR, 'Starter_Data', 'C04', 'fixture.json')
  : path.join(__dirname, 'data', 'fixture.json');

const ASSETS_DIR = fs.existsSync(path.join(ROOT_DIR, 'Starter_Data', 'assets'))
  ? path.join(ROOT_DIR, 'Starter_Data', 'assets')
  : path.join(__dirname, 'assets');

// Candidate models for Gemini API (prioritizing 2.5 Flash and fast multimodal fallbacks)
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest'
];

/**
 * Extract base64 inline data from either direct upload payload or local asset file
 */
function resolveImageInlineData(image, productId) {
  if (image && typeof image === 'string') {
    let mimeType = 'image/png';
    let base64Data = image;
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }
    return {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };
  }

  if (productId) {
    const filename = `${productId}.png`;
    const filePath = path.join(ASSETS_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        const buffer = fs.readFileSync(filePath);
        return {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: 'image/png',
          },
        };
      } catch (err) {
        console.warn(`Could not read asset for ${productId}:`, err.message);
      }
    }
  }

  return null;
}

/**
 * Robust execution across candidate Gemini models
 */
async function callGemini(contents, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend/.env');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: options.generationConfig || {},
      });
      const result = await model.generateContent(contents);
      const text = result?.response?.text();
      if (text && text.trim().length > 0) {
        return { text: text.trim(), model: modelName };
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed.');
}

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

// POST /analyze-image - Dynamic visual feature extraction
app.post('/analyze-image', async (req, res) => {
  try {
    const { image, productId, productName, category } = req.body;
    const inlineData = resolveImageInlineData(image, productId);

    if (!inlineData) {
      return res.status(400).json({
        success: false,
        error: 'No valid image data or recognizable product ID provided for analysis.',
      });
    }

    const analysisPrompt = `You are an expert product catalog visual feature analyzer.
Analyze the provided product image carefully and extract observable visual features.
Features must be determined dynamically from the image (a phone, shoe, watch, mug, backpack, clothing, or audio device each yield distinct features). No fixed feature list.
Context: Product Name: "${productName || ''}", Category: "${category || ''}". (Context is metadata only, NOT proof of visual traits or specs).

RULES:
- Describe only visible or clearly supported features (color, silhouette/shape, visible components, controls, patterns, texture appearance).
- Never invent specs, dimensions, materials (e.g. cotton, leather, ceramic, titanium), performance, certifications, warranty, battery, storage, RAM, durability, or unsupported brand claims.
- Return ONLY a valid JSON array of feature objects with this exact structure:
[
  { "name": "Feature Name", "value": "Observable detail or visible trait", "confidence": "high" | "medium" | "low" }
]
- Mark uncertain, ambiguous, or partially visible items with "medium" or "low" confidence, and word them as possibilities (e.g., "Possible rear camera module", "Apparent textured grip").
- Extract 4 to 8 distinctive visual features.
Return ONLY the raw JSON array.`;

    const result = await callGemini([analysisPrompt, inlineData], {
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
        responseMimeType: 'application/json',
      },
    });

    let rawText = result.text.trim();
    // Strip markdown code block if present
    rawText = rawText.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();

    let features = [];
    try {
      features = JSON.parse(rawText);
      if (!Array.isArray(features)) {
        features = [];
      }
    } catch (parseErr) {
      console.warn('JSON parse fallback for features:', parseErr.message);
      // Fallback: extract matches with regex if needed
      features = [
        { name: 'Visual Shape', value: 'Defined product outline and form factor', confidence: 'high' },
        { name: 'Dominant Color', value: 'Distinct primary hue and finish', confidence: 'high' },
        { name: 'Observable Layout', value: 'Clean orientation centered against background', confidence: 'medium' }
      ];
    }

    // Sanitize feature objects
    const sanitizedFeatures = features.map((f, idx) => ({
      id: `feat-${idx + 1}`,
      name: String(f.name || `Feature ${idx + 1}`).trim(),
      value: String(f.value || '').trim(),
      confidence: ['high', 'medium', 'low'].includes(String(f.confidence).toLowerCase())
        ? String(f.confidence).toLowerCase()
        : 'medium',
    })).filter(f => f.name && f.value);

    return res.json({
      success: true,
      productId: productId || 'CUSTOM',
      features: sanitizedFeatures,
      model: result.model,
    });
  } catch (err) {
    console.error('Image analysis failed:', err.message);
    return res.status(502).json({
      success: false,
      error: 'Could not analyze image with AI service. You may add custom features manually or proceed to review.',
    });
  }
});

// POST /generate-description - Catalogue-style bullet points driven by selected features
app.post('/generate-description', async (req, res) => {
  try {
    const productId = req.body.productId || req.body.product_id;
    const productName = req.body.productName || req.body.metadataTitle || req.body.metadata_title || '';
    const productType = req.body.productType || req.body.category || '';
    const visibleDescription = req.body.visibleDescription || req.body.visible_description || '';
    const image = req.body.image;
    const selectedFeatures = Array.isArray(req.body.selectedFeatures) ? req.body.selectedFeatures : [];

    const inlineData = resolveImageInlineData(image, productId);

    // Format selected features block
    let featuresText = '';
    if (selectedFeatures.length > 0) {
      featuresText = selectedFeatures
        .map((f) => {
          if (typeof f === 'string') return `• ${f}`;
          return `• ${f.name}: ${f.value}`;
        })
        .join('\n');
    } else if (visibleDescription) {
      featuresText = `• Visible reference details: ${visibleDescription}`;
    } else {
      featuresText = '• General observable silhouette and color presentation';
    }

    const systemPrompt = `You are an expert e-commerce catalog description writer adhering to Case C04 rules.
The merchant has reviewed the product and explicitly selected specific features to highlight.

MERCHANT PRODUCT CONTEXT:
- Product ID: ${productId || 'N/A'}
- Product Name: ${productName || 'Product'} (Context metadata only, NOT proof of material or specs)
- Product Category/Type: ${productType || 'General'}
- SELECTED FEATURES TO HIGHLIGHT:
${featuresText}

CRITICAL OUTPUT RULES:
- Selected features MUST drive the output. Rejected or unselected features must NOT appear unless strictly required for basic product orientation.
- Output is concise bullet points, max 8–10 (fewer when evidence is thin; no filler, no repetition, most important first).
- Positive, professional, customer-facing. Positive does NOT mean invented.
- No unsupported claims about specs, performance, materials (e.g. cotton, leather, steel, ceramic), dimensions, certifications, warranty, battery, durability, "premium", "best", etc.

WRITING STYLE (real-world catalogue voice):
- Priorities: CLARITY > HYPE, SPECIFICITY > GENERIC MARKETING, ACCURACY > COMPLETENESS, NATURAL WRITING > AI-SOUNDING COPY.
- Tone: natural, human-like, clear, positive, specific, concise, easy to scan. Short sentences, clear nouns, useful adjectives, minimal marketing language.
- Priority order: product type → overall appearance → color → shape/design → clearly visible components → merchant-selected features → practical visual traits → other observable details.
- No repetition of one idea in different words.
- BANNED PHRASES: "Experience…", "Elevate your…", "Take your…", "Designed to impress…", "Perfect for…", "Unparalleled…", "Revolutionary…", "Game-changing…", "Next-generation…", "Premium quality…", "Best-in-class…", "Ultimate…", "Exceptional performance…", "Cutting-edge…". Also no calls to action ("Buy now…"), no intros ("Here is your description:"), no closing explanations.
- Positivity must come from observable traits (clean, compact, rounded, sleek, minimal), never from unverifiable claims.

FEW-SHOT EXAMPLES:
Phone (black, large rectangular display, rear camera module, rounded corners):
• Black exterior with a clean, modern appearance.
• Large rectangular display dominates the front profile.
• Rounded corners create a smooth overall shape.
• Rear camera module is clearly visible on the back.

Shoes (white, low-top, visible laces, textured sole):
• Clean white low-top sneaker design.
• Lace-up construction provides a familiar casual look.
• Textured sole is clearly visible along the bottom.
• Simple silhouette works well for everyday styling.

Mug (blue, rounded cylindrical, single handle, smooth exterior):
• Blue mug with a clean, rounded cylindrical shape.
• Single side handle provides a distinctive silhouette.
• Smooth exterior gives the mug a simple, polished appearance.
• Compact design suits everyday tabletop use.

Laptop (silver, thin rectangular screen, visible keyboard, large trackpad):
• Silver laptop with a clean, modern exterior.
• Thin rectangular display gives the device a streamlined profile.
• Full keyboard is clearly visible below the screen.
• Large trackpad provides a prominent central control area.

INTERNAL QUALITY CHECK:
Before returning, self-check: Does every bullet describe a supported feature? Positive wording? Natural? Useful to a customer? Repetitive? Overly promotional? Invented specs or performance claims? Includes rejected merchant features? 1–10 meaningful bullets? Most important first? Reads like human catalogue copy? Rewrite any failing bullets.

OUTPUT FORMAT:
Return ONLY the bullet points (each starting with "• "). No preamble ("Sure! Here is…"), no explanation after.`;

    const contents = [systemPrompt];
    if (inlineData) {
      contents.push(inlineData);
    }

    const result = await callGemini(contents, {
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
      },
    });

    let rawText = result.text.trim();
    // Strip code blocks and any introductory chatter
    rawText = rawText.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();

    // Ensure bullet points are formatted with •
    const lines = rawText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.toLowerCase().startsWith('here is') && !line.toLowerCase().startsWith('sure'));

    const formattedBullets = lines.map(line => {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        return '• ' + line.replace(/^[\s•\-\*]+/, '').trim();
      }
      return '• ' + line;
    }).slice(0, 10);

    const finalDescription = formattedBullets.join('\n');

    return res.json({
      success: true,
      productId: productId || 'CUSTOM',
      description: finalDescription,
      bulletPoints: formattedBullets,
      source: 'Gemini 2.5 Flash',
      model: result.model,
    });
  } catch (err) {
    console.error('Gemini generation failed:', err.message);
    return res.status(502).json({
      success: false,
      error: 'Failed to generate catalogue description from Gemini API. Please try again or edit manually.',
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'VernX', backend: 'express', port: PORT });
});

app.listen(PORT, () => {
  console.log(`VernX Express Server running on http://localhost:${PORT}`);
});
