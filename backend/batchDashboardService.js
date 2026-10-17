/**
 * VernX Batch 3 Service: Batch Dashboard, Multi-Format Content, and Readiness
 * 
 * Includes:
 * 1. computeReadinessScore - Transparent, checklist-based score calculation
 * 2. generateMultiFormatDescriptions - Generates Highlights, Short, Marketplace, and Card Summary from the same verified specs
 * 3. validateMultiFormatClaims - Extended Claim Check scanning all four formats
 */

/**
 * Transparent checklist-based Catalogue Readiness Score.
 * NOT an AI-guessed number.
 * 
 * Scoring rubric (Total = 100 points):
 * 1. Product Identified: 15 pts (Category and identified name determined from visual evidence)
 * 2. Features Confirmed: 20 pts (At least 1 observable visual feature selected/confirmed)
 * 3. Specifications Verified: 15 pts (Merchant verified at least 1 specification or confirmed none needed)
 * 4. Multi-Format Content Generated: 20 pts (All 4 formats generated: Highlights, Short, Marketplace, Card Summary)
 * 5. Review Guard / Claim Check Passed: 15 pts (Zero unsupported claims across all 4 formats)
 * 6. View Coverage: 15 pts (Scaled according to category checklist view coverage score)
 */
export function computeReadinessScore(product = {}) {
  const missing = [];
  let score = 0;

  // 1. Product Identification (15 pts)
  const isIdentified = Boolean(
    product.detected_product?.product_name ||
    product.product_identified ||
    product.category ||
    product.metadata_title
  );
  if (isIdentified) {
    score += 15;
  } else {
    missing.push('Identify product name and category from visual evidence');
  }

  // 2. Features Confirmed (20 pts)
  const features = Array.isArray(product.detected_features) ? product.detected_features : [];
  const confirmedFeatures = features.filter((f) => {
    const choice = product.feature_choices?.[f.id] || f.choice || 'INCLUDE';
    return choice === 'INCLUDE';
  });
  if (confirmedFeatures.length > 0) {
    score += 20;
  } else {
    missing.push('Confirm at least 1 observable visual feature');
  }

  // 3. Specifications Verified (15 pts)
  const confirmedSpecs = product.merchant_confirmed_specs || product.verified_specs || product.verifiedSpecs || {};
  const hasVerifiedSpecs = Object.keys(confirmedSpecs).length > 0;
  const questions = product.verification_questions || [];
  const answeredQuestions = Object.keys(product.merchant_answers || {}).length;
  if (hasVerifiedSpecs || (questions.length > 0 && answeredQuestions >= questions.length)) {
    score += 15;
  } else {
    missing.push('Verify non-observable specifications in merchant questionnaire');
  }

  // 4. Multi-Format Content Generated (20 pts)
  const hasHighlights = Boolean(product.product_highlights || product.description_bullets || product.draft);
  const hasShort = Boolean(product.short_description || product.description_short);
  const hasMarketplace = Boolean(product.marketplace_description || product.description_long);
  const hasCardSummary = Boolean(product.card_summary);

  const formatsCount = [hasHighlights, hasShort, hasMarketplace, hasCardSummary].filter(Boolean).length;
  const contentPoints = Math.round((formatsCount / 4) * 20);
  score += contentPoints;
  if (formatsCount < 4) {
    missing.push(`Generate all 4 catalogue formats (${formatsCount}/4 ready)`);
  }

  // 5. Review Guard / Claim Check Passed (15 pts)
  const check = product.content_check || (product.status === 'READY' || product.status === 'APPROVED' ? { flagged_claims: [] } : null);
  const flaggedCount = check?.flagged_claims?.length || 0;
  if (check && flaggedCount === 0) {
    score += 15;
  } else if (!check) {
    missing.push('Run Review Guard claim check on descriptions');
  } else {
    missing.push(`Resolve ${flaggedCount} unsupported claim(s) in Claim Check`);
  }

  // 6. View Coverage (15 pts)
  const coverageScore = product.view_coverage?.score !== undefined
    ? product.view_coverage.score
    : (Array.isArray(product.images) && product.images.length > 1 ? 75 : (product.status === 'READY' || product.status === 'APPROVED' ? 100 : 25));
  const viewPoints = Math.round((coverageScore / 100) * 15);
  score += viewPoints;
  if (coverageScore < 100) {
    missing.push(`Upload missing views to improve angle coverage (${coverageScore}%)`);
  }

  // Determine readiness status bucket
  let statusBucket = 'NEEDS INFORMATION';
  if (product.status === 'INACCESSIBLE') {
    statusBucket = 'INACCESSIBLE';
  } else if (product.status === 'ERROR') {
    statusBucket = 'ERROR';
  } else if (product.status === 'APPROVED' || product.status === 'READY') {
    statusBucket = 'READY';
  } else if (score >= 80 && flaggedCount === 0) {
    statusBucket = 'READY';
  } else if (score >= 50) {
    statusBucket = 'NEEDS REVIEW';
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    status: statusBucket,
    status_bucket: statusBucket,
    checklist: {
      product_identified: { passed: isIdentified, points: isIdentified ? 15 : 0, max: 15, label: 'Product Identified' },
      features_confirmed: { passed: confirmedFeatures.length > 0, points: confirmedFeatures.length > 0 ? 20 : 0, max: 20, label: 'Features Confirmed' },
      specs_verified: { passed: Boolean(hasVerifiedSpecs || answeredQuestions > 0), points: (hasVerifiedSpecs || answeredQuestions > 0) ? 15 : 0, max: 15, label: 'Specs Verified' },
      content_generated: { passed: formatsCount === 4, points: contentPoints, max: 20, label: 'Multi-Format Generated' },
      claim_check_passed: { passed: Boolean(check && flaggedCount === 0), points: (check && flaggedCount === 0) ? 15 : 0, max: 15, label: 'Claim Check Passed' },
      view_coverage: { passed: coverageScore >= 70, points: viewPoints, max: 15, label: `View Coverage (${coverageScore}%)` },
    },
    breakdown: {
      product_identified: isIdentified ? 15 : 0,
      features_confirmed: confirmedFeatures.length > 0 ? 20 : 0,
      specs_verified: (hasVerifiedSpecs || answeredQuestions > 0) ? 15 : 0,
      multi_format_content: contentPoints,
      claim_check_passed: (check && flaggedCount === 0) ? 15 : 0,
      view_coverage: viewPoints,
    },
    missing: missing,
    missing_items: missing,
    disclaimer: 'Prototype indicator only; not scientifically validated.',
    is_prototype_disclaimer: 'Prototype indicator only; not scientifically validated.',
  };
}

/**
 * Scan all four content formats against dictionary of unsupported claims
 */
export function validateMultiFormatClaims(formats = {}, unsupportedWordsDict = {}) {
  const formatResults = {};
  const allFlagged = [];

  const formatKeys = ['product_highlights', 'short_description', 'marketplace_description', 'card_summary'];
  for (const key of formatKeys) {
    const rawVal = formats[key];
    const text = (Array.isArray(rawVal) ? rawVal.join(' ') : String(rawVal || '')).toLowerCase();
    const words = text.match(/[a-z0-9-]+/g) || [];
    const flagged = [];

    for (const w of words) {
      if (unsupportedWordsDict[w] || ['waterproof', 'leather', 'titanium', 'handmade', 'organic', 'durability'].includes(w)) {
        const cat = unsupportedWordsDict[w] || (w === 'leather' || w === 'titanium' || w === 'organic' ? 'material' : 'performance');
        const item = {
          word: w,
          category: cat,
          format: key,
          type: 'unsupported_claim',
          action_suggested: 'verify_or_remove',
          actions: ['[VERIFY]', '[REMOVE]'],
        };
        flagged.push(item);
        allFlagged.push(item);
      }
    }

    formatResults[key] = {
      is_valid: flagged.length === 0,
      flagged_claims: flagged,
    };
  }

  // Deduplicate flagged claims
  const uniqueFlagged = [];
  const seenWords = new Set();
  for (const item of allFlagged) {
    if (!seenWords.has(item.word)) {
      seenWords.add(item.word);
      uniqueFlagged.push(item);
    }
  }

  return {
    passed: uniqueFlagged.length === 0,
    flagged_claims: uniqueFlagged,
    flagged_count: uniqueFlagged.length,
    total_claims_flagged: uniqueFlagged.length,
    by_format: formatResults,
  };
}

/**
 * Generate 4 distinct catalogue formats from the SAME verified information
 */
export async function generateMultiFormatDescriptions(productData = {}, callGeminiFn, unsupportedWordsDict = {}) {
  const {
    productId = 'P01',
    productName = '',
    category = '',
    merchantName = '',
    visibleDescription = '',
    images = [],
  } = productData;

  const selectedFeatures = productData.selectedFeatures || productData.confirmedFeatures || productData.confirmed_features || [];
  const merchantConfirmedSpecs = productData.merchantConfirmedSpecs || productData.verifiedSpecs || productData.verified_specs || {};
  const recommendedHighlights = productData.recommendedHighlights || productData.highlights || [];

  // Format selected features
  let featuresText = '';
  if (Array.isArray(selectedFeatures) && selectedFeatures.length > 0) {
    featuresText = selectedFeatures
      .map((f) => (typeof f === 'string' ? `• ${f}` : `• ${f.name}: ${f.value}`))
      .join('\n');
  } else if (visibleDescription) {
    featuresText = `• Visible traits: ${visibleDescription}`;
  } else {
    featuresText = '• Clean observable contours and balanced presentation';
  }

  // Format verified specs
  const specEntries = Object.entries(merchantConfirmedSpecs).filter(
    ([k, v]) => v && v !== 'Not known' && v !== 'Skipped' && String(v).trim().length > 0
  );
  let confirmedSpecsText = '';
  if (specEntries.length > 0) {
    confirmedSpecsText = specEntries
      .map(([k, v]) => `• ${k}: ${v} [Verified Merchant Spec]`)
      .join('\n');
  }

  // Format highlights
  let highlightsText = '';
  if (Array.isArray(recommendedHighlights) && recommendedHighlights.length > 0) {
    highlightsText = recommendedHighlights.map((h) => `• Prioritize: ${h}`).join('\n');
  }

  let generated = null;
  let modelUsed = 'Fallback Rule-Based';

  if (typeof callGeminiFn === 'function') {
    const prompt = `You are the lead e-commerce catalogue copywriter and visual reviewer for VernX.
Generate FOUR distinct commercial catalogue text formats for this product based ONLY on the verified information below.
All four formats MUST be completely consistent and derived from the SAME verified information with NO contradictory specifications.

FOUR FORMATS REQUIRED:
(A) Product Highlights: max 10 concise bullet points.
(B) Short Description: 1 concise paragraph (approx 2 sentences, 120-160 characters).
(C) Marketplace Description: a comprehensive catalogue-ready narrative (2-3 detailed paragraphs).
(D) Product Card Summary: 1-2 punchy lines (max 80-100 characters) ideal for grid card previews.

CRITICAL RULES:
1. Positive but strictly factual. No invented specs (no waterproof unless verified, no durable, no battery life unless verified).
2. NO BANNED PHRASES: "Experience...", "Elevate your...", "Designed to impress...", "Game-changing", "Revolutionary", "Premium quality", "Best-in-class", "Ultimate".
3. Unconfirmed specifications must NEVER appear in ANY format.
4. Do NOT insert the merchant name ("${merchantName}") into the descriptions.
5. All 4 formats must be mutually consistent and share the exact same specifications.

INPUT DATA:
- Product ID: ${productId}
- Product Title Context: ${productName || 'Product Item'}
- Category: ${category || 'General'}
- Observable Visual Features:
${featuresText}
- Verified Specifications:
${confirmedSpecsText || '(None confirmed. Rely strictly on observable visual features)'}
- Highlights to Emphasize:
${highlightsText || '(None specified)'}

Return ONLY a valid JSON object matching this schema:
{
  "product_highlights": "• Highlight bullet 1\\n• Highlight bullet 2\\n• Highlight bullet 3...",
  "short_description": "Single concise paragraph...",
  "marketplace_description": "Paragraph 1 describing overall form and aesthetic.\\n\\nParagraph 2 describing specific components and verified traits.",
  "card_summary": "1-2 lines summarizing key observable traits."
}
No markdown fences, no preamble, strictly valid JSON.`;

    const contents = [prompt];

    // Attach primary image if provided
    const primaryImg = images[0] || productData.image;
    if (primaryImg) {
      if (primaryImg.inlineData) {
        contents.push(primaryImg);
      } else if (typeof primaryImg === 'string' && primaryImg.startsWith('data:')) {
        const match = primaryImg.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (match) {
          contents.push({
            inlineData: { mimeType: match[1], data: match[2] },
          });
        }
      } else if (primaryImg.url && primaryImg.url.startsWith('data:')) {
        const match = primaryImg.url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (match) {
          contents.push({
            inlineData: { mimeType: match[1], data: match[2] },
          });
        }
      }
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await callGeminiFn(contents, {
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 1200,
            responseMimeType: 'application/json',
          },
        });
        modelUsed = result.model;
        const raw = result.text.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
        generated = JSON.parse(raw);
        if (generated && generated.product_highlights && generated.short_description) {
          break;
        }
      } catch (e) {
        console.warn(`Multi-format Gemini attempt ${attempt} warning:`, e.message);
        if (attempt === 2) generated = null;
      }
    }
  }

  if (!generated) {
    // Deterministic rule-based fallback based on confirmed features & specs
    const vis = visibleDescription || (selectedFeatures[0]?.value) || `${productName || 'Product'} with clean contours`;
    const specAddon = specEntries.length > 0 ? ` featuring verified ${specEntries.map(([k, v]) => `${k} (${v})`).join(', ')}` : '';

    const highlightsList = [
      `Clean visual silhouette with balanced contours`,
      `Observable exterior finish displayed against a neutral background`,
      ...(specEntries.length > 0 ? [`Verified ${specEntries[0][0]}: ${specEntries[0][1]}`] : []),
      `Consistent proportions with standard catalogue styling`,
    ];

    generated = {
      product_highlights: highlightsList,
      short_description: `${vis}${specAddon}. Designed with a clean silhouette for clear visual presentation.`,
      marketplace_description: `${vis}${specAddon}. The item displays clean lines and distinct observable styling.\n\nAll visual traits and merchant-verified specifications are confirmed from authentic product inspection.`,
      card_summary: `${vis.slice(0, 75)}...`,
    };
  }

  // Clean strings
  const bulletsArr = Array.isArray(generated.product_highlights)
    ? generated.product_highlights
    : (typeof generated.product_highlights === 'string'
        ? generated.product_highlights.split('\n').map((l) => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
        : []);

  const formats = {
    product_highlights: bulletsArr.map((b) => `• ${b}`).join('\n'),
    short_description: String(generated.short_description || '').trim(),
    marketplace_description: String(generated.marketplace_description || '').trim(),
    card_summary: String(generated.card_summary || '').trim(),
  };

  // Run extended claim check across all 4 formats
  const claimCheck = validateMultiFormatClaims(formats, unsupportedWordsDict);

  return {
    success: true,
    model: modelUsed,
    productId,
    product_highlights: bulletsArr,
    short_description: formats.short_description,
    marketplace_description: formats.marketplace_description,
    card_summary: formats.card_summary,
    formats,
    content_check: claimCheck,
    // Backward compatibility aliases
    description_bullets: formats.product_highlights,
    description_short: formats.short_description,
    description_long: formats.marketplace_description,
  };
}

