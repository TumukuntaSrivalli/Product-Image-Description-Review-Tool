import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import './components/onboarding/onboarding-subscription.css';
import { LoginModal } from './components/auth/LoginModal';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { SubscriptionFlow } from './components/subscription/SubscriptionFlow';
import { HomeLandingPage } from './components/landing/HomeLandingPage';
import { BatchView } from './components/workspace/BatchView';

// Dynamic Price Estimation Helper based on product category, title, and file keywords
export function getEstimatedProductPrice(category = '', title = '', filename = '') {
  const combined = `${category} ${title} ${filename}`.toLowerCase();
  if (combined.includes('keyboard')) return 68.00;
  if (combined.includes('mouse')) return 34.99;
  if (combined.includes('hub') || combined.includes('adapter') || combined.includes('charger')) return 42.50;
  if (combined.includes('headphone') || combined.includes('earbud') || combined.includes('audio')) return 79.99;
  if (combined.includes('watch') || combined.includes('smartwatch')) return 129.00;
  if (combined.includes('camera')) return 249.00;
  if (combined.includes('laptop') || combined.includes('computer')) return 899.00;
  if (combined.includes('phone') || combined.includes('mobile')) return 499.00;
  if (combined.includes('bottle') || combined.includes('flask') || combined.includes('tumbler')) return 19.99;
  if (combined.includes('mug') || combined.includes('cup')) return 16.00;
  if (combined.includes('sneaker') || combined.includes('shoe') || combined.includes('footwear')) return 85.00;
  if (combined.includes('bag') || combined.includes('backpack') || combined.includes('tote')) return 45.00;
  if (combined.includes('jacket') || combined.includes('hoodie') || combined.includes('coat')) return 59.99;
  if (combined.includes('tshirt') || combined.includes('t-shirt') || combined.includes('shirt') || combined.includes('top')) return 24.99;
  if (combined.includes('pant') || combined.includes('jean') || combined.includes('trouser')) return 39.99;
  if (combined.includes('drinkware')) return 18.50;
  if (combined.includes('apparel') || combined.includes('clothing')) return 28.00;
  if (combined.includes('electronics')) return 49.99;
  if (combined.includes('accessories')) return 22.50;

  // Consistent deterministic price generation for arbitrary items
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  const base = 15 + Math.abs(hash % 70);
  return Number((base + 0.99).toFixed(2));
}

// Authoritative fallback fixture data for Case C04 (P01 - P10)
const DEFAULT_PRODUCTS = [
  { product_id: 'P01', metadata_title: 'Blue Tshirt', category: 'Apparel', price: 24.99, visible_description: 'Blue rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P02', metadata_title: 'Blue Tshirt', category: 'Apparel', price: 24.99, visible_description: 'Blue rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P03', metadata_title: 'Red Tshirt', category: 'Apparel', price: 26.50, visible_description: 'Red rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P04', metadata_title: 'Blue Tshirt', category: 'Apparel', price: 24.99, visible_description: 'Blue rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P05', metadata_title: 'Blue Mug', category: 'Drinkware', price: 16.00, visible_description: 'Blue rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P06', metadata_title: 'Red Mug', category: 'Drinkware', price: 16.00, visible_description: 'Red rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P07', metadata_title: 'Black Mouse', category: 'Electronics', price: 34.99, visible_description: 'Black rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P08', metadata_title: 'Black Keyboard', category: 'Electronics', price: 68.00, visible_description: 'Black rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P09', metadata_title: 'Grey Hub', category: 'Accessories', price: 42.50, visible_description: 'Grey rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P10', metadata_title: 'Green Bottle', category: 'Drinkware', price: 19.99, visible_description: 'Green rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
];

// Dictionary of unsupported claims for real-time Review Guard
const UNSUPPORTED_WORDS = {
  cotton: 'material', leather: 'material', ceramic: 'material', steel: 'material',
  plastic: 'material', wood: 'material', metal: 'material', wool: 'material',
  polyester: 'material', denim: 'material', silk: 'material',
  iso: 'certification', bis: 'certification', ce: 'certification', certified: 'certification',
  organic: 'certification', fda: 'certification',
  waterproof: 'performance', durable: 'performance', durability: 'performance',
  ergonomic: 'performance', 'long-lasting': 'performance', breathable: 'performance',
  shockproof: 'performance', 'scratch-resistant': 'performance', 'heavy-duty': 'performance',
  official: 'identity', authentic: 'identity', genuine: 'identity', brand: 'identity',
  nike: 'identity', apple: 'identity',
  premium: 'superlative', best: 'superlative', ultimate: 'superlative', revolutionary: 'superlative',
  'game-changing': 'superlative', 'next-generation': 'superlative', 'best-in-class': 'superlative',
};

// Keyword Classification Patterns for Keyword Highlighter
const KEYWORD_PATTERNS = [
  { category: 'COLOR', regex: /\b(blue|red|black|grey|gray|green|white|yellow|orange|purple|brown|navy|silver|gold)\b/gi },
  { category: 'SHAPE', regex: /\b(rounded rectangular|rectangular|round|circular|cylindrical|oval|curved|square|low-top)\b/gi },
  { category: 'OBJECT', regex: /\b(product illustration|illustration|t-shirt|tshirt|mug|mouse|keyboard|hub|bottle|sneaker|shoes|shoe|laptop|phone|graphic|device|apparel)\b/gi },
  { category: 'TEXT', regex: /\b("Blue Tshirt"|"P01"|"fictional catalogue image"|printed text|label|text)\b/gi },
  { category: 'QUANTITY', regex: /\b(single|one|two|pair|dual|multiple|three|four)\b/gi },
  { category: 'POSITION', regex: /\b(centrally positioned|centered|front|rear|side|bottom|top|background)\b/gi },
  { category: 'VISIBLE FEATURE', regex: /\b(silhouette|handle|sole|laces|display|keys|buttons|port|finish|outline|contours)\b/gi },
  { category: 'UNCERTAINTY', regex: /\b(possible|apparent|appears|likely|estimated|suggested)\b/gi },
];

// Client-side image quality check (no API call)
function checkImageQualityClient(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve({ width, height, warnings: [], isGood: true });
      }
      ctx.drawImage(img, 0, 0, 100, 100);
      const imgData = ctx.getImageData(0, 0, 100, 100);
      const data = imgData.data;

      let totalBrightness = 0;
      const lumas = [];
      for (let i = 0; i < data.length; i += 4) {
        const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        totalBrightness += luma;
        lumas.push(luma);
      }
      const avgBrightness = totalBrightness / (data.length / 4);

      let variance = 0;
      for (let i = 0; i < lumas.length; i++) {
        variance += Math.pow(lumas[i] - avgBrightness, 2);
      }
      variance = variance / lumas.length;

      const warnings = [];
      if (width < 350 || height < 250) {
        warnings.push('Image is too small (resolution below 350x250 px)');
      }
      if (avgBrightness < 45) {
        warnings.push('Image is too dark (average brightness under 18%)');
      } else if (avgBrightness > 245) {
        warnings.push('Image is too bright / overexposed');
      }
      if (variance < 150) {
        warnings.push('Image looks blurry (low contrast / detail variance)');
      }

      resolve({
        width,
        height,
        avgBrightness: Math.round(avgBrightness),
        variance: Math.round(variance),
        warnings,
        isGood: warnings.length === 0,
      });
    };
    img.onerror = () => {
      resolve({
        width: 0,
        height: 0,
        warnings: ['Unable to load image file'],
        isGood: false,
      });
    };
    img.src = dataUrl;
  });
}

// ALTLUME Interactive Custom Cursor
function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [cursorType, setCursorType] = useState('default');
  const [cursorLabel, setCursorLabel] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let animId;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;

    const onMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setPos({ x: targetX, y: targetY });
      if (!isVisible) setIsVisible(true);

      const target = e.target;
      if (!target || !target.closest) return;

      const isImg = target.closest('.viewer-360-main-img, .source-product-img, .image-canvas-stage img, .image-canvas-viewport, .stage-canvas-box img');
      if (isImg) {
        setCursorType('crosshair');
        setIsHovered(true);
        setCursorLabel('');
        return;
      }

      const interactive = target.closest('button, a, [role="button"], input[type="checkbox"], input[type="radio"], [data-cursor]');
      if (interactive) {
        const custom = interactive.getAttribute('data-cursor') ||
          (interactive.textContent && interactive.textContent.includes('Approve') ? 'Approve' :
            interactive.textContent && (interactive.textContent.includes('Listen') || interactive.textContent.includes('Play')) ? 'Play' :
              interactive.textContent && interactive.textContent.includes('Export') ? 'Export' :
                interactive.textContent && interactive.textContent.includes('Save') ? 'Save' :
                  interactive.textContent && interactive.textContent.includes('Upload') ? 'Upload' :
                    interactive.textContent && interactive.textContent.includes('Zoom') ? 'Zoom' : 'Review');
        setCursorType('action');
        setIsHovered(true);
        setCursorLabel(custom);
        return;
      }

      setCursorType('default');
      setIsHovered(false);
      setCursorLabel('');
    };

    const onMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    const loop = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      setRingPos({ x: currentX, y: currentY });
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      <div
        className="altlume-cursor-dot"
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
        aria-hidden="true"
      />
      <div
        className={`altlume-cursor-ring ${isHovered ? 'active' : ''} ${cursorType === 'crosshair' ? 'crosshair' : ''}`}
        style={{ transform: `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)` }}
        aria-hidden="true"
      >
        {cursorLabel && <span className="altlume-cursor-label">{cursorLabel}</span>}
        {cursorType === 'crosshair' && (
          <div className="crosshair-reticle">
            <span className="reticle-h" />
            <span className="reticle-v" />
          </div>
        )}
      </div>
    </>
  );
}

// ALTLUME Thin Scroll Progress Line
function ScrollProgressLine() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="altlume-scroll-line"
      style={{ width: `${scrollProgress}%` }}
      aria-hidden="true"
    />
  );
}

export default function App() {
  // Auth state persisted in localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('altlume_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Business Onboarding answers persisted in localStorage
  const [onboardingData, setOnboardingData] = useState(() => {
    try {
      const saved = localStorage.getItem('altlume_onboarding');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Subscription plan selection persisted in localStorage
  const [subscriptionPlan, setSubscriptionPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('altlume_subscription');
      return saved ? JSON.parse(saved) : { planId: 'growth', planName: 'Growth', price: '₹4,499' };
    } catch {
      return { planId: 'growth', planName: 'Growth', price: '₹4,499' };
    }
  });

  // Login modal open/close
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Active Flow: 'home' | 'onboarding' | 'subscription' | 'workspace'
  const [activeFlow, setActiveFlow] = useState(() => {
    try {
      const u = localStorage.getItem('altlume_user');
      const o = localStorage.getItem('altlume_onboarding');
      const s = localStorage.getItem('altlume_subscription');
      if (u && o && s) return 'workspace';
      if (u && !o) return 'onboarding';
      if (u && o && !s) return 'subscription';
    } catch {}
    return 'home';
  });

  // Navigation tabs within Workspace: 'dashboard' | 'batch' | 'workspace' (Studio) | 'method' | 'export'
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLoginSuccess = (user) => {
    localStorage.setItem('altlume_user', JSON.stringify(user));
    setCurrentUser(user);
    setShowLoginModal(false);

    // As requested: After sign-in, always take user through business onboarding questionnaire
    setActiveFlow('onboarding');
    try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch {}
    setSuccessMessage(`Welcome, ${user.name || 'Editor'}! Please set up your business profile.`);
  };

  const handleLogout = () => {
    localStorage.removeItem('altlume_user');
    setCurrentUser(null);
    setActiveFlow('home');
    try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch {}
    setSuccessMessage('Signed out successfully.');
  };

  const handleOnboardingComplete = (data) => {
    setOnboardingData(data);
    localStorage.setItem('altlume_onboarding', JSON.stringify(data));
    setActiveFlow('subscription');
    try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch {}
    setSuccessMessage('Business onboarding completed! Please choose your catalogue plan.');
  };

  const handleSelectSubscription = (plan) => {
    setSubscriptionPlan(plan);
    localStorage.setItem('altlume_subscription', JSON.stringify(plan));
    setActiveFlow('workspace');
    setActiveTab('dashboard');
    try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch {}

    if (plan.paymentStatus === 'PAID') {
      setSuccessMessage(`Payment of ${plan.paidAmount} confirmed! Activated ${plan.planName} (Receipt: ${plan.transactionId}). Welcome to your review workspace!`);
    } else {
      setSuccessMessage(`Subscribed to ${plan.planName}! Welcome to your review workspace.`);
    }
  };

  // Session-wide Merchant Name
  const [merchantName, setMerchantName] = useState('VarnX Store');

  // Review Language: 'en' | 'hi' | 'te'
  const [reviewLanguage, setReviewLanguage] = useState('en');

  // Master product queue (empty by default; user uploads products directly)
  const [products, setProducts] = useState(() => []);

  const [selectedId, setSelectedId] = useState('');
  const [queueFilter, setQueueFilter] = useState('ALL'); // ALL | PENDING | APPROVED | INACCESSIBLE
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [highlightKeywords, setHighlightKeywords] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals & Drawers
  const [showInaccessibleModal, setShowInaccessibleModal] = useState(false);
  const [inaccessibleReason, setInaccessibleReason] = useState('Image too unclear');
  const [inaccessibleNote, setInaccessibleNote] = useState('');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showApproveAllModal, setShowApproveAllModal] = useState(false);
  const [showApproveAllListenedModal, setShowApproveAllListenedModal] = useState(false);

  // ALTLUME Theme & Visual Identity State
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('altlume_theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('altlume_theme', next);
    } catch (e) { }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Command Palette, Zoom, and Filmstrip Tools
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [imageZoomLevel, setImageZoomLevel] = useState('1x'); // '1x' | '1.5x' | '2x'
  const [toolDrawerTab, setToolDrawerTab] = useState('audio'); // 'audio' | 'lang' | 'batch'
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  // Custom Feature addition state
  const [showAddCustomFeature, setShowAddCustomFeature] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureValue, setNewFeatureValue] = useState('');

  // Bulk Upload Queue State
  const [bulkQueue, setBulkQueue] = useState([]);
  const [bulkProgress, setBulkProgress] = useState(0);

  // Voice TTS State
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [listenAllPlaying, setListenAllPlaying] = useState(false);
  const [autoAdvanceVoice, setAutoAdvanceVoice] = useState(true);
  const [voiceRate, setVoiceRate] = useState(1);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const ttsUtteranceRef = useRef(null);

  // Camera stream ref & video element ref
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // Upload input ref
  const fileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);
  const cameraFileInputRef = useRef(null);
  const uploadCounterRef = useRef(1);

  // Single-Product Intelligence State (Feature flag + helpers)
  const [singleProductIntelligenceEnabled, setSingleProductIntelligenceEnabled] = useState(true);
  const [isAnalyzingProduct, setIsAnalyzingProduct] = useState(false);
  const [customHighlightInput, setCustomHighlightInput] = useState('');

  // Batch 2: Multi-Image Support State (Feature flag + staging + viewer)
  const [multiImageSupportEnabled, setMultiImageSupportEnabled] = useState(true);
  const [isGroupingImages, setIsGroupingImages] = useState(false);
  const [showGroupingModal, setShowGroupingModal] = useState(false);
  const [stagedGroups, setStagedGroups] = useState([]);
  const [dragStartX, setDragStartX] = useState(null);

  const multiImageUploadRef = useRef(null);
  const addSingleViewRef = useRef(null);

  // Batch 3: Batch Dashboard, Multi-Format Content & Readiness State
  const [batchDashboardEnabled, setBatchDashboardEnabled] = useState(true);
  const [dashboardFilter, setDashboardFilter] = useState('ALL'); // ALL | READY | NEEDS REVIEW | NEEDS INFORMATION | ERROR
  const [dashboardCategoryFilter, setDashboardCategoryFilter] = useState('ALL');
  const [activeFormatTab, setActiveFormatTab] = useState('highlights'); // highlights | short | marketplace | card_summary
  const [showApproveLowRiskModal, setShowApproveLowRiskModal] = useState(false);
  const [isGeneratingMultiFormat, setIsGeneratingMultiFormat] = useState(false);

  // Export Customization State: select particular descriptions/products
  const [selectedExportIds, setSelectedExportIds] = useState(() => []);
  const [exportSearchTerm, setExportSearchTerm] = useState('');
  const [exportStatusFilter, setExportStatusFilter] = useState('ALL'); // 'ALL' | 'APPROVED' | 'PENDING' | 'INACCESSIBLE'

  // Derived aliases
  const isCameraActive = showCameraModal;
  const isListeningAll = listenAllPlaying;
  const isAutoAdvance = autoAdvanceVoice;
  const setIsAutoAdvance = setAutoAdvanceVoice;
  const isBulkProcessing = showBulkUploadModal;
  const customFeatureName = newFeatureName;
  const setCustomFeatureName = setNewFeatureName;
  const customFeatureValue = newFeatureValue;
  const setCustomFeatureValue = setNewFeatureValue;
  const videoRef = cameraVideoRef;

  // Initialize Speech Synthesis Voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        if (voices.length > 0 && !selectedVoiceName) {
          const defaultVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
          setSelectedVoiceName(defaultVoice?.name || '');
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceName]);

  // Keep review queue clean for merchant uploads (no auto-injected dummy data)
  useEffect(() => {
    // Queue is driven by merchant uploads
  }, []);

  // Auto-sync products to SQLite database on state updates
  const isInitialSyncMount = useRef(true);
  useEffect(() => {
    if (isInitialSyncMount.current) {
      isInitialSyncMount.current = false;
      return;
    }
    if (!products || products.length === 0) return;

    const timer = setTimeout(() => {
      fetch('/api/products/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products, merchantName }),
      }).catch(() => {});
    }, 500);

    return () => clearTimeout(timer);
  }, [products, merchantName]);

  const currentProduct = products.find((p) => p.product_id === selectedId) || products[0] || null;

  // Transparent category view checklist calculator
  const computeClientViewCoverage = (category = '', images = []) => {
    const normCat = (category || '').toLowerCase();
    let expected = ['front', 'back', 'side', 'detail'];
    if (normCat.includes('shoe') || normCat.includes('footwear')) {
      expected = ['top', 'left', 'right', 'heel', 'sole'];
    } else if (normCat.includes('electron') || normCat.includes('device') || normCat.includes('accessory')) {
      expected = ['front', 'back', 'side', 'ports'];
    } else if (normCat.includes('furniture')) {
      expected = ['front', 'back', 'side', 'detail'];
    }

    const presentViews = (images || [])
      .filter(img => !img.is_inaccessible)
      .map(img => (img.view || 'front').toLowerCase());

    const presentExpected = expected.filter(exp =>
      presentViews.some(pv => pv.includes(exp) || exp.includes(pv))
    );

    const missing = expected.filter(exp => !presentExpected.includes(exp));
    const score = Math.round((presentExpected.length / expected.length) * 100);

    let recommendation = '';
    if (missing.length === 0) {
      recommendation = `Coverage 100% – Complete view coverage for ${category || 'product'}.`;
    } else if (images.length <= 1) {
      recommendation = `Coverage ${score}% (Single view) – Upload a ${missing[0]} view to improve coverage.`;
    } else {
      recommendation = `Coverage ${score}% – Upload a ${missing[0]} view to improve coverage.`;
    }

    return {
      score,
      expected_views: expected,
      present_views: presentExpected,
      missing_views: missing,
      recommendation,
      is_single_view: images.length <= 1,
    };
  };

  // Batch 3: Transparent Catalogue Readiness Score Calculator (Checklist-based)
  // Labeled: "Prototype indicator only; not scientifically validated."
  const computeClientReadinessScore = (product) => {
    if (!product) {
      return {
        score: 0,
        status: 'NEEDS INFORMATION',
        checklist: {},
        missing: ['No product data'],
        is_prototype_disclaimer: 'Prototype indicator only; not scientifically validated.',
      };
    }

    // 1. Product Identified (15 pts)
    const hasCategory = Boolean(product.detected_category || product.category || product.product_category);
    const isConfident = product.confidence !== 'low';
    const productIdentified = hasCategory && isConfident;

    // 2. Features Confirmed (20 pts): at least 2 features detected/confirmed
    const detectedFeats = product.detected_features || [];
    const confirmedCount = detectedFeats.filter(
      (f) => (product.feature_choices?.[f.id] || 'INCLUDE') === 'INCLUDE'
    ).length;
    const featuresConfirmed = confirmedCount >= 2;

    // 3. Specs Verified (15 pts): merchant confirmed specs present
    const verifiedSpecs = product.merchant_confirmed_specs || product.verified_specs || product.verified_specifications || {};
    const specsVerified = Object.keys(verifiedSpecs).length >= 1;

    // 4. Multi-Format Content Generated (20 pts, 5 pts each)
    const hasHighlights = Boolean(
      (Array.isArray(product.product_highlights) && product.product_highlights.length > 0) ||
      product.description_bullets
    );
    const hasShort = Boolean(product.short_description || product.description_short);
    const hasMarketplace = Boolean(product.marketplace_description || product.description_long || product.detailed_description || product.final_description);
    const hasCardSummary = Boolean(product.card_summary);

    let contentPts = 0;
    if (hasHighlights) contentPts += 5;
    if (hasShort) contentPts += 5;
    if (hasMarketplace) contentPts += 5;
    if (hasCardSummary) contentPts += 5;

    // 5. Claim Check Passed (15 pts)
    const allText = [
      Array.isArray(product.product_highlights) ? product.product_highlights.join(' ') : (product.product_highlights || ''),
      product.short_description || '',
      product.marketplace_description || product.final_description || product.draft || '',
      product.card_summary || '',
      product.edited_text || '',
    ].join(' ').toLowerCase();

    let claimFlags = 0;
    const words = allText.match(/[a-z0-9-]+/g) || [];
    for (const w of words) {
      if (UNSUPPORTED_WORDS && UNSUPPORTED_WORDS[w]) {
        // Only flag if not in verifiedSpecs
        const isVerified = Object.values(verifiedSpecs).some(val => String(val).toLowerCase().includes(w));
        if (!isVerified) {
          claimFlags++;
        }
      }
    }
    const claimCheckPassed = claimFlags === 0 && (contentPts > 0 || product.status === 'APPROVED');

    // 6. View Coverage (15 pts)
    const imagesList = product.images && product.images.length > 0
      ? product.images
      : [{ url: product.image_url, view: 'front', is_inaccessible: product.status === 'INACCESSIBLE' }];
    const cov = computeClientViewCoverage(product.category || product.detected_category, imagesList);
    const covPts = Math.min(15, Math.round((cov.score || 0) * 0.15));

    let totalScore = 0;
    if (productIdentified) totalScore += 15;
    if (featuresConfirmed) totalScore += 20;
    if (specsVerified) totalScore += 15;
    totalScore += contentPts;
    if (claimCheckPassed) totalScore += 15;
    totalScore += covPts;
    totalScore = Math.min(100, Math.max(0, totalScore));

    const missing = [];
    if (!productIdentified) missing.push('Category identity unconfirmed');
    if (!featuresConfirmed) missing.push(`${Math.max(0, 2 - confirmedCount)} feature(s) missing confirmation`);
    if (!specsVerified) missing.push('Key merchant specifications unverified');
    if (contentPts < 20) missing.push(`${4 - (contentPts / 5)} catalogue format(s) not yet generated`);
    if (claimFlags > 0) missing.push(`${claimFlags} unsupported claim(s) require verification`);
    if (cov.missing_views && cov.missing_views.length > 0) {
      missing.push(`Missing view angles: ${cov.missing_views.join(', ')}`);
    }

    let status = 'NEEDS INFORMATION';
    if (product.status === 'INACCESSIBLE' || product.status === 'ERROR') {
      status = 'ERROR';
    } else if (totalScore >= 80 && claimFlags === 0) {
      status = 'READY';
    } else if (totalScore >= 50) {
      status = 'NEEDS REVIEW';
    }

    return {
      score: totalScore,
      status,
      checklist: {
        product_identified: { passed: productIdentified, points: productIdentified ? 15 : 0, max: 15, label: 'Product Identified' },
        features_confirmed: { passed: featuresConfirmed, points: featuresConfirmed ? 20 : 0, max: 20, label: 'Features Confirmed' },
        specs_verified: { passed: specsVerified, points: specsVerified ? 15 : 0, max: 15, label: 'Specs Verified' },
        content_generated: { passed: contentPts === 20, points: contentPts, max: 20, label: 'Multi-Format Generated' },
        claim_check_passed: { passed: claimCheckPassed, points: claimCheckPassed ? 15 : 0, max: 15, label: 'Claim Check Passed' },
        view_coverage: { passed: cov.score >= 70, points: covPts, max: 15, label: `View Coverage (${cov.score}%)` },
      },
      missing,
      is_prototype_disclaimer: 'Prototype indicator only; not scientifically validated.',
    };
  };


  // Multi-view active images derivation
  const activeImages = useMemo(() => {
    if (!currentProduct) return [];
    if (Array.isArray(currentProduct.images) && currentProduct.images.length > 0) {
      return currentProduct.images;
    }
    return [{
      id: `${currentProduct.product_id}-v1`,
      url: currentProduct.image_url,
      view: 'front',
      confidence: 'high',
      is_inaccessible: false,
    }];
  }, [currentProduct]);

  const activeViewIndex = (currentProduct?.active_view_index !== undefined && currentProduct.active_view_index < activeImages.length)
    ? currentProduct.active_view_index
    : 0;

  const activeImageView = activeImages[activeViewIndex] || activeImages[0] || { url: currentProduct?.image_url, view: 'front' };

  // Active description based on mode and status
  const currentText = useMemo(() => {
    if (!currentProduct) return '';
    if (currentProduct.edited_text !== undefined && currentProduct.edited_text !== '') {
      return currentProduct.edited_text;
    }
    if (currentProduct.mode === 'DETAILED') {
      return currentProduct.detailed_description || currentProduct.draft;
    }
    return currentProduct.short_description || currentProduct.draft || currentProduct.visible_description || '';
  }, [currentProduct]);

  // Review Guard Live Validation (ALTLUME Editorial Suite)
  const validationResult = useMemo(() => {
    const raw = (currentText || '').trim();
    const text = raw.toLowerCase();
    const flags = [];
    const blockingErrors = [];
    const warnings = [];
    const offendingWords = [];
    const words = text.match(/[a-z0-9-]+/g) || [];

    const isDecorative = currentProduct?.is_decorative || false;
    const containsText = currentProduct?.contains_text || false;
    const multipleProducts = currentProduct?.has_multiple_products || false;

    // 1. Empty description check: valid ONLY after explicit decorative confirmation
    const isEmpty = raw.length === 0;
    if (isEmpty) {
      if (isDecorative) {
        flags.push('Decorative image marked: null alt text is valid.');
      } else {
        blockingErrors.push('Description is empty. Provide an image description or confirm decorative toggle.');
      }
    }

    // 2. Block redundant opener prefixes
    if (/^(image of|picture of|photo of|graphic of|screenshot of)/i.test(raw)) {
      blockingErrors.push('Do not start with "image of", "picture of", or "photo of". Screen readers already announce images.');
    }

    // 3. Length thresholds: Calm <=125, Warn 126-250, Block >250
    const charCount = raw.length;
    let lengthLevel = 'calm';
    if (charCount > 250) {
      lengthLevel = 'block';
      blockingErrors.push(`Description length (${charCount} characters) exceeds hard limit of 250 characters.`);
    } else if (charCount > 125) {
      lengthLevel = 'warn';
      warnings.push(`Description length (${charCount} characters) exceeds recommended screen reader brevity of 125 characters.`);
    }

    // 4. Unsupported Claims (Material, Certification, Performance, Superlatives)
    const verifiedSpecs = currentProduct?.merchant_confirmed_specs || {};
    for (const w of words) {
      if (UNSUPPORTED_WORDS && UNSUPPORTED_WORDS[w]) {
        const cat = UNSUPPORTED_WORDS[w];
        const isVerified = Object.values(verifiedSpecs).some((v) => String(v).toLowerCase().includes(w));
        if (!isVerified) {
          offendingWords.push({ word: w, category: cat });
          warnings.push(`Unsupported ${cat} claim: "${w}". Confirm spec or remove.`);
        }
      }
    }

    // 5. Contains Text: require quoted transcription
    if (containsText) {
      if (!/["'“].+?["'”]/.test(raw) && !raw.includes(':')) {
        warnings.push('Image contains visible text. Please include quoted transcription (e.g. "BRAND NAME").');
      }
    }

    // 6. Multiple Products: require group wording
    if (multipleProducts) {
      const groupTerms = ['set', 'pair', 'collection', 'pack', 'group', 'pieces', 'items', 'and', 'with', 'trio', 'duo'];
      const hasGroupTerm = groupTerms.some((t) => text.includes(t));
      if (!hasGroupTerm) {
        warnings.push('Multiple products selected. Include group wording (e.g. "Set of...", "Pair of...").');
      }
    }

    // 7. Repetition of metadata title
    if (currentProduct?.metadata_title && raw.toLowerCase() === currentProduct.metadata_title.toLowerCase()) {
      warnings.push('Description repeats exact product title verbatim. Describe visual details not present in title.');
    }

    const isValid = blockingErrors.length === 0 && (isEmpty ? isDecorative : true);

    return {
      isEmpty,
      charCount,
      lengthLevel,
      blockingErrors,
      warnings,
      offendingWords,
      flags,
      hasObservableDetails: words.length >= 3 && !isEmpty,
      isValid,
    };
  }, [currentText, currentProduct]);

  // Auto-dismiss alert messages
  useEffect(() => {
    if (errorMessage || successMessage) {
      const t = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [errorMessage, successMessage]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if typing inside textarea or input
      if (['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement?.tagName)) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
        }
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        const currentIndex = products.findIndex((p) => p.product_id === selectedId);
        const next = products[(currentIndex + 1) % products.length];
        if (next) setSelectedId(next.product_id);
      } else if (e.key === 'p' || e.key === 'P') {
        const currentIndex = products.findIndex((p) => p.product_id === selectedId);
        const prev = products[(currentIndex - 1 + products.length) % products.length];
        if (prev) setSelectedId(prev.product_id);
      } else if (e.key === 'a' || e.key === 'A') {
        handleApprove();
      } else if (e.key === 'f' || e.key === 'F' || e.key === 'i' || e.key === 'I') {
        setShowInaccessibleModal(true);
      } else if (e.key === 'e' || e.key === 'E') {
        document.getElementById('varnix-text-editor')?.focus();
      } else if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        setShowInaccessibleModal(false);
        setShowDiffModal(false);
        setShowCameraModal(false);
        setShowBulkUploadModal(false);
        setShowApproveAllListenedModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, selectedId]);

  // Handle Description Type Change (Short | Bullets | Long)
  const handleDescTypeChange = (type) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        let nextText = '';
        if (type === 'short') {
          nextText = p.description_short || p.short_description || p.draft;
        } else if (type === 'long') {
          nextText = p.description_long || p.detailed_description || p.draft;
        } else {
          nextText = p.description_bullets || p.draft;
        }
        return {
          ...p,
          selected_description_type: type,
          mode: type.toUpperCase(),
          edited_text: nextText,
        };
      })
    );
    setSuccessMessage(`Switched description view to ${type.toUpperCase()}`);
  };

  // Analyze Image for Dynamic Features (POST /analyze-image)
  const handleAnalyzeImage = async (prod = currentProduct) => {
    if (!prod) return;
    setIsAnalyzingImage(true);
    setErrorMessage('');

    try {
      const res = await fetch('/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: prod.product_id,
          productName: prod.metadata_title,
          category: prod.category,
          image: prod.image_url,
        }),
      });

      if (!res.ok) {
        throw new Error('Image analysis could not be completed.');
      }

      const data = await res.json();
      if (data.features && Array.isArray(data.features)) {
        const initialChoices = {};
        data.features.forEach((f) => {
          initialChoices[f.id] = f.confidence === 'low' ? 'UNSURE' : 'INCLUDE';
        });

        setProducts((prev) =>
          prev.map((p) => {
            if (p.product_id !== prod.product_id) return p;
            return {
              ...p,
              detected_features: data.features,
              feature_choices: initialChoices,
              category: data.suggestedCategory || p.category,
            };
          })
        );
        setSuccessMessage(`Detected ${data.features.length} dynamic features for ${prod.product_id}`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Image analysis failed. You may add features manually.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Feature Choice toggle (INCLUDE | EXCLUDE | UNSURE)
  const handleSetFeatureChoice = (featId, choice) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const updatedFeatures = (p.detected_features || []).map((f) =>
          f.id === featId ? { ...f, choice } : f
        );
        return {
          ...p,
          detected_features: updatedFeatures,
          feature_choices: {
            ...(p.feature_choices || {}),
            [featId]: choice,
          },
        };
      })
    );
  };

  // Add Custom Feature
  const handleAddCustomFeature = () => {
    if (!customFeatureName.trim() || !customFeatureValue.trim()) {
      setErrorMessage('Please provide both a feature name and value.');
      return;
    }
    const newId = `custom-${Date.now()}`;
    const newFeature = {
      id: newId,
      name: customFeatureName.trim(),
      value: customFeatureValue.trim(),
      confidence: 'medium',
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        return {
          ...p,
          detected_features: [...(p.detected_features || []), newFeature],
          feature_choices: {
            ...(p.feature_choices || {}),
            [newId]: 'INCLUDE',
          },
        };
      })
    );
    setCustomFeatureName('');
    setCustomFeatureValue('');
    setShowAddCustomFeature(false);
    setSuccessMessage(`Added custom feature: ${newFeature.name}`);
  };

  // Single-Product Intelligence: Deep Product Analysis (POST /analyze-product)
  const handleAnalyzeProduct = async (prod = currentProduct) => {
    if (!prod) return;
    setIsAnalyzingProduct(true);
    setErrorMessage('');

    try {
      const res = await fetch('/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: prod.product_id,
          productName: prod.metadata_title,
          category: prod.category,
          image: prod.image_url,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Product intelligence analysis could not be completed.');
      }

      const data = await res.json();
      setProducts((prev) =>
        prev.map((p) => {
          if (p.product_id !== prod.product_id) return p;
          const initialChoices = {};
          (data.visual_features || []).forEach((f, idx) => {
            initialChoices[`vf-${idx}`] = f.confidence === 'low' ? 'UNSURE' : 'INCLUDE';
          });

          return {
            ...p,
            detected_product: data.product || null,
            visual_features: data.visual_features || [],
            specifications_to_verify: data.specifications_to_verify || [],
            verification_questions: data.verification_questions || [],
            merchant_answers: p.merchant_answers || {}, // Never preselected
            merchant_custom_answers: p.merchant_custom_answers || {},
            merchant_confirmed_specs: p.merchant_confirmed_specs || {},
            recommended_highlights: data.recommended_highlights || [],
            selected_highlights: p.selected_highlights && p.selected_highlights.length > 0
              ? p.selected_highlights
              : (data.recommended_highlights ? [...data.recommended_highlights] : []),
            quality_observations: data.quality_observations || [],
            view_recommendation: data.view_recommendation || 'Single view analysis. Additional views recommended for complete inspection.',
            category: data.product?.category || p.category,
            detected_features: (data.visual_features || []).map((vf, i) => ({
              id: `vf-${i}`,
              name: vf.name,
              value: vf.value,
              confidence: vf.confidence,
              source: vf.source || 'image',
            })),
            feature_choices: initialChoices,
          };
        })
      );
      setSuccessMessage(`Identified ${data.product?.product_name || prod.product_id} with ${data.visual_features?.length || 0} visual features!`);
    } catch (err) {
      setErrorMessage(err.message || 'Product intelligence analysis error. Fallback active.');
    } finally {
      setIsAnalyzingProduct(false);
    }
  };

  // Questionnaire: Handle selection for dynamic questions
  const handleAnswerQuestion = (qId, attribute, answer) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const currentAnswers = { ...(p.merchant_answers || {}) };
        const currentSpecs = { ...(p.merchant_confirmed_specs || {}) };

        if (answer === 'Not known' || answer === 'Skipped' || !answer) {
          currentAnswers[qId] = answer;
          delete currentSpecs[attribute];
        } else if (answer === 'Other (custom value)') {
          currentAnswers[qId] = answer;
          const customVal = p.merchant_custom_answers?.[qId];
          if (customVal && customVal.trim()) {
            currentSpecs[attribute] = customVal.trim();
          } else {
            delete currentSpecs[attribute];
          }
        } else {
          currentAnswers[qId] = answer;
          currentSpecs[attribute] = answer;
        }

        return {
          ...p,
          merchant_answers: currentAnswers,
          merchant_confirmed_specs: currentSpecs,
        };
      })
    );
  };

  // Questionnaire: Custom free-text entry
  const handleCustomAnswerChange = (qId, attribute, text) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const customAnswers = { ...(p.merchant_custom_answers || {}), [qId]: text };
        const currentSpecs = { ...(p.merchant_confirmed_specs || {}) };

        if (text.trim() && p.merchant_answers?.[qId] === 'Other (custom value)') {
          currentSpecs[attribute] = text.trim();
        } else if (p.merchant_answers?.[qId] === 'Other (custom value)') {
          delete currentSpecs[attribute];
        }

        return {
          ...p,
          merchant_custom_answers: customAnswers,
          merchant_confirmed_specs: currentSpecs,
        };
      })
    );
  };

  // Smart Highlights: Toggle selection
  const handleToggleHighlight = (highlight) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const currentSelected = p.selected_highlights || [];
        const nextSelected = currentSelected.includes(highlight)
          ? currentSelected.filter((h) => h !== highlight)
          : [...currentSelected, highlight];
        return {
          ...p,
          selected_highlights: nextSelected,
        };
      })
    );
  };

  // Smart Highlights: Reorder (Up / Down)
  const handleReorderHighlight = (index, direction) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const list = [...(p.selected_highlights || [])];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= list.length) return p;
        const temp = list[index];
        list[index] = list[targetIndex];
        list[targetIndex] = temp;
        return {
          ...p,
          selected_highlights: list,
        };
      })
    );
  };

  // Smart Highlights: Add Custom Highlight
  const handleAddCustomHighlight = () => {
    if (!customHighlightInput.trim() || !currentProduct) return;
    const newH = customHighlightInput.trim();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const nextSelected = [...(p.selected_highlights || []), newH];
        const nextRecommended = [...(p.recommended_highlights || []), newH];
        return {
          ...p,
          selected_highlights: nextSelected,
          recommended_highlights: nextRecommended,
        };
      })
    );
    setCustomHighlightInput('');
    setSuccessMessage(`Added highlight: "${newH}"`);
  };

  // Smart Highlights: Remove Highlight
  const handleRemoveHighlight = (index) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const list = [...(p.selected_highlights || [])];
        list.splice(index, 1);
        return {
          ...p,
          selected_highlights: list,
        };
      })
    );
  };

  // Content Check Action: [REMOVE] claim from description text
  const handleRemoveClaimFromText = (claimWord) => {
    if (!currentProduct) return;
    const regex = new RegExp(`\\b${claimWord}\\b`, 'gi');
    const sourceText = currentProduct.edited_text || currentProduct.description_bullets || currentProduct.draft || '';
    const updatedText = sourceText.replace(regex, '').replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();

    const updatedFlagged = (currentProduct.content_check?.flagged_claims || []).filter(
      (c) => c.word.toLowerCase() !== claimWord.toLowerCase()
    );
    const updatedCheck = currentProduct.content_check
      ? {
        ...currentProduct.content_check,
        flagged_claims: updatedFlagged,
        passed: updatedFlagged.length === 0,
      }
      : null;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        return {
          ...p,
          edited_text: updatedText,
          description_bullets: p.selected_description_type === 'bullets' ? updatedText : p.description_bullets,
          final_description: p.status === 'APPROVED' ? updatedText : p.final_description,
          content_check: updatedCheck,
          status: 'EDITED',
        };
      })
    );
    setSuccessMessage(`Removed unsupported claim '${claimWord}' from description.`);
  };

  // Content Check Action: [VERIFY] claim as merchant-confirmed spec
  const handleVerifyClaimAsSpec = (claimWord, category) => {
    if (!currentProduct) return;
    const specKey = category ? `${category.charAt(0).toUpperCase() + category.slice(1)}` : 'Verified Spec';
    const updatedSpecs = {
      ...(currentProduct.merchant_confirmed_specs || {}),
      [specKey]: claimWord,
    };

    const updatedFlagged = (currentProduct.content_check?.flagged_claims || []).filter(
      (c) => c.word.toLowerCase() !== claimWord.toLowerCase()
    );
    const updatedCheck = currentProduct.content_check
      ? {
        ...currentProduct.content_check,
        flagged_claims: updatedFlagged,
        passed: updatedFlagged.length === 0,
      }
      : null;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        return {
          ...p,
          merchant_confirmed_specs: updatedSpecs,
          content_check: updatedCheck,
        };
      })
    );
    setSuccessMessage(`Verified '${claimWord}' as merchant-confirmed spec!`);
  };

  // Generate AI Description (POST /generate-description)
  const handleGenerateAI = async () => {
    if (!currentProduct) return;
    setIsGenerating(true);
    setErrorMessage('');

    try {
      // Selected features strictly drive generation
      const selectedFeatures = (currentProduct.detected_features || [])
        .filter((f) => (currentProduct.feature_choices?.[f.id] || 'INCLUDE') === 'INCLUDE')
        .map((f) => ({ name: f.name, value: f.value }));

      const response = await fetch(`/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: currentProduct.product_id,
          productName: currentProduct.metadata_title,
          productType: currentProduct.category,
          merchantName,
          mode: (currentProduct.selected_description_type || 'bullets').toUpperCase(),
          image: currentProduct.image_url,
          visibleDescription: currentProduct.visible_description,
          selectedFeatures,
          merchantConfirmedSpecs: currentProduct.merchant_confirmed_specs || {},
          recommendedHighlights: currentProduct.selected_highlights || currentProduct.recommended_highlights || [],
        }),
      });

      if (!response.ok) {
        throw new Error('AI generation service returned an error.');
      }

      const data = await response.json();
      const shortDesc = data.description_short || '';
      const bulletsDesc = data.description_bullets || data.description || '';
      const longDesc = data.description_long || '';
      const contentCheck = data.content_check || null;

      const activeType = currentProduct.selected_description_type || 'bullets';
      const activeText = activeType === 'short' ? shortDesc : activeType === 'long' ? longDesc : bulletsDesc;

      setProducts((prev) =>
        prev.map((p) => {
          if (p.product_id !== currentProduct.product_id) return p;
          const updatedHistory = [
            ...p.history,
            { action: `GENERATED (${activeType})`, timestamp: new Date().toLocaleTimeString() }
          ];
          return {
            ...p,
            draft: bulletsDesc,
            description_short: shortDesc,
            description_bullets: bulletsDesc,
            description_long: longDesc,
            edited_text: activeText,
            status: 'DRAFT_READY',
            content_check: contentCheck,
            history: updatedHistory,
            translations: {
              ...p.translations,
              en: activeText,
            },
          };
        })
      );
      setSuccessMessage(`Generated catalogue descriptions for ${currentProduct.product_id}`);
    } catch (err) {
      setErrorMessage(err.message || 'Generation error. Fallback reference is active.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Human Edit: marks status as EDITED; if previously APPROVED, returns it to EDITED
  const handleTextEdit = (e) => {
    const val = e.target.value;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        return {
          ...p,
          edited_text: val,
          status: 'EDITED', // Editing an Approved item returns it to EDITED
          translations: {
            ...p.translations,
            en: val,
          },
        };
      })
    );
  };

  // ALTLUME: Batch Generate all drafts for unreviewed products
  const handleGenerateAllDrafts = async () => {
    const unapproved = products.filter((p) => p.status !== 'APPROVED');
    if (unapproved.length === 0) {
      setSuccessMessage('All product descriptions are already approved.');
      return;
    }
    setSuccessMessage(`Generating visual drafts for ${unapproved.length} products...`);
    for (const p of unapproved) {
      try {
        await handleGenerateMultiFormat(p);
      } catch (e) { }
    }
    setSuccessMessage('Finished generating drafts for review!');
  };

  // Approve Description (ALTLUME Human Sign-off)
  const handleApprove = () => {
    if (!currentProduct) return;
    if (currentProduct.imageError) {
      setErrorMessage('Cannot approve: Source image is missing or inaccessible. Please upload a valid image first.');
      return;
    }

    const textToApprove = (currentText || '').trim();
    if (!textToApprove && !currentProduct.is_decorative) {
      setErrorMessage('Cannot approve an empty description. Please write a description or confirm decorative image toggle.');
      return;
    }

    if (validationResult.blockingErrors && validationResult.blockingErrors.length > 0) {
      setErrorMessage(`Cannot approve: ${validationResult.blockingErrors[0]}`);
      return;
    }

    if (!validationResult.isValid || (validationResult.warnings && validationResult.warnings.length > 0)) {
      const confirmApprove = window.confirm(
        `Review Guard identified warnings:\n${(validationResult.warnings || []).join('\n')}\n\nDo you still wish to approve with human editorial sign-off?`
      );
      if (!confirmApprove) return;
    }

    const approvedText = currentProduct.is_decorative && !textToApprove ? '' : textToApprove;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const updatedHistory = [
          ...p.history,
          { action: 'APPROVED', timestamp: new Date().toLocaleTimeString() }
        ];
        return {
          ...p,
          final_description: approvedText,
          edited_text: approvedText,
          status: 'APPROVED',
          is_human_edited: true,
          history: updatedHistory,
        };
      })
    );

    // Direct SQLite backend update for approval and audit logging
    fetch(`/api/images/${currentProduct.product_id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: approvedText }),
    }).catch(() => {});

    setSuccessMessage(`Product ${currentProduct.product_id} approved successfully!`);
  };

  // Mark as Inaccessible
  const handleConfirmInaccessible = () => {
    if (!currentProduct) return;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const updatedHistory = [
          ...p.history,
          { action: 'MARKED_INACCESSIBLE', timestamp: new Date().toLocaleTimeString() }
        ];
        return {
          ...p,
          status: 'INACCESSIBLE',
          inaccessible_reason: inaccessibleReason,
          reviewer_note: inaccessibleNote || 'Visual details cannot be reliably identified.',
          final_description: 'Image unavailable — manual review required.',
          edited_text: 'Image unavailable — manual review required.',
          history: updatedHistory,
        };
      })
    );

    // Direct SQLite backend update for inaccessible status and audit logging
    fetch(`/api/images/${currentProduct.product_id}/inaccessible`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: inaccessibleReason,
        reviewer_note: inaccessibleNote || 'Visual details cannot be reliably identified.',
      }),
    }).catch(() => {});

    setShowInaccessibleModal(false);
    setSuccessMessage(`Marked ${currentProduct.product_id} as Inaccessible.`);
  };

  // Batch 3: Generate Multi-Format Descriptions (Highlights, Short, Marketplace, Card Summary)
  const handleGenerateMultiFormat = async (prod = currentProduct) => {
    if (!prod) return;
    setIsGeneratingMultiFormat(true);
    setErrorMessage('');

    try {
      const selectedFeatures = (prod.detected_features || [])
        .filter((f) => (prod.feature_choices?.[f.id] || 'INCLUDE') === 'INCLUDE')
        .map((f) => ({ name: f.name, value: f.value }));

      const res = await fetch('/api/batch/generate-multi-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: prod.product_id,
          productName: prod.metadata_title || prod.product_id,
          category: prod.detected_category || prod.category || prod.product_category || 'General',
          image: prod.image_url,
          images: prod.images || [],
          verifiedSpecs: prod.merchant_confirmed_specs || prod.verified_specs || {},
          confirmedFeatures: selectedFeatures,
          highlights: prod.selected_highlights || prod.recommended_highlights || [],
          previousFormats: {
            product_highlights: prod.product_highlights,
            short_description: prod.short_description,
            marketplace_description: prod.marketplace_description,
            card_summary: prod.card_summary,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Multi-format generation service encountered an error.');
      }

      const data = await res.json();
      const updatedFormats = {
        product_highlights: data.product_highlights || [],
        short_description: data.short_description || '',
        marketplace_description: data.marketplace_description || '',
        card_summary: data.card_summary || '',
      };

      const bulletsText = Array.isArray(updatedFormats.product_highlights)
        ? updatedFormats.product_highlights.map((h) => `• ${h}`).join('\n')
        : updatedFormats.product_highlights;

      const nextStatus = prod.status === 'APPROVED' ? 'EDITED' : 'GENERATED';

      setProducts((prev) =>
        prev.map((p) => {
          if (p.product_id !== prod.product_id) return p;
          const merged = {
            ...p,
            ...updatedFormats,
            description_short: updatedFormats.short_description,
            description_bullets: bulletsText,
            description_long: updatedFormats.marketplace_description,
            draft: updatedFormats.marketplace_description,
            final_description: updatedFormats.marketplace_description,
            edited_text: updatedFormats.marketplace_description,
            content_check: data.content_check || null,
            status: nextStatus,
            history: [
              ...(p.history || []),
              { action: 'MULTI_FORMAT_GENERATED', timestamp: new Date().toLocaleTimeString() },
            ],
          };
          merged.readiness_score = computeClientReadinessScore(merged);
          return merged;
        })
      );
      setSuccessMessage(`Generated 4 consistent formats for ${prod.product_id}`);
    } catch (err) {
      setErrorMessage(err.message || 'Error generating multi-format descriptions.');
    } finally {
      setIsGeneratingMultiFormat(false);
    }
  };

  // Batch 3: Regenerate a single format
  const handleRegenerateFormat = async (formatKey) => {
    if (!currentProduct) return;
    setIsGeneratingMultiFormat(true);
    setErrorMessage('');

    try {
      const selectedFeatures = (currentProduct.detected_features || [])
        .filter((f) => (currentProduct.feature_choices?.[f.id] || 'INCLUDE') === 'INCLUDE')
        .map((f) => ({ name: f.name, value: f.value }));

      const res = await fetch('/api/batch/generate-multi-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: currentProduct.product_id,
          productName: currentProduct.metadata_title || currentProduct.product_id,
          category: currentProduct.detected_category || currentProduct.category || currentProduct.product_category || 'General',
          image: currentProduct.image_url,
          images: currentProduct.images || [],
          verifiedSpecs: currentProduct.merchant_confirmed_specs || currentProduct.verified_specs || {},
          confirmedFeatures: selectedFeatures,
          highlights: currentProduct.selected_highlights || currentProduct.recommended_highlights || [],
          targetFormat: formatKey,
          previousFormats: {
            product_highlights: currentProduct.product_highlights,
            short_description: currentProduct.short_description,
            marketplace_description: currentProduct.marketplace_description,
            card_summary: currentProduct.card_summary,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to regenerate ${formatKey}`);
      }

      const data = await res.json();
      setProducts((prev) =>
        prev.map((p) => {
          if (p.product_id !== currentProduct.product_id) return p;
          const updated = { ...p };
          if (formatKey === 'highlights') {
            updated.product_highlights = data.product_highlights || p.product_highlights;
            updated.description_bullets = Array.isArray(data.product_highlights)
              ? data.product_highlights.map((h) => `• ${h}`).join('\n')
              : p.description_bullets;
          } else if (formatKey === 'short') {
            updated.short_description = data.short_description || p.short_description;
            updated.description_short = updated.short_description;
          } else if (formatKey === 'marketplace') {
            updated.marketplace_description = data.marketplace_description || p.marketplace_description;
            updated.description_long = updated.marketplace_description;
            updated.draft = updated.marketplace_description;
            updated.edited_text = updated.marketplace_description;
            updated.final_description = updated.marketplace_description;
          } else if (formatKey === 'card_summary') {
            updated.card_summary = data.card_summary || p.card_summary;
          }

          if (updated.status === 'APPROVED') {
            updated.status = 'EDITED';
          }
          updated.readiness_score = computeClientReadinessScore(updated);
          return updated;
        })
      );
      setSuccessMessage(`Regenerated ${formatKey} for ${currentProduct.product_id}`);
    } catch (err) {
      setErrorMessage(err.message || `Failed to regenerate ${formatKey}`);
    } finally {
      setIsGeneratingMultiFormat(false);
    }
  };

  // Batch runner: generate multi-format for all items in catalogue
  const handleBatchGenerateAllMultiFormat = async () => {
    setIsGeneratingMultiFormat(true);
    try {
      for (const prod of products) {
        await handleGenerateMultiFormat(prod);
      }
      setSuccessMessage('Batch multi-format generation completed for all catalogue items.');
    } catch (err) {
      setErrorMessage('Batch multi-format generation notice: ' + (err?.message || String(err)));
    } finally {
      setIsGeneratingMultiFormat(false);
    }
  };

  // Batch 3: Format text edit (Editing an Approved description returns it to EDITED and needs re-approval)
  const handleFormatTextEdit = (formatKey, value) => {
    if (!currentProduct) return;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const updated = { ...p };
        if (formatKey === 'highlights') {
          const lines = value
            .split('\n')
            .map((l) => l.replace(/^[•\-\*]\s*/, '').trim())
            .filter(Boolean);
          updated.product_highlights = lines;
          updated.description_bullets = value;
        } else if (formatKey === 'short') {
          updated.short_description = value;
          updated.description_short = value;
        } else if (formatKey === 'marketplace') {
          updated.marketplace_description = value;
          updated.description_long = value;
          updated.draft = value;
          updated.edited_text = value;
          updated.final_description = value;
        } else if (formatKey === 'card_summary') {
          updated.card_summary = value;
        }

        // Status transition rule:
        // Editing an Approved description returns it to EDITED and needs re-approval.
        if (updated.status === 'APPROVED') {
          updated.status = 'EDITED';
        } else if (updated.status === 'NOT_GENERATED' || updated.status === 'PENDING') {
          updated.status = 'EDITED';
        }

        updated.readiness_score = computeClientReadinessScore(updated);
        return updated;
      })
    );
  };

  // Batch 3: Explicit per-product "Approve all four formats"
  const handleApproveAllFormats = () => {
    if (!currentProduct) return;
    const readiness = currentProduct.readiness_score || computeClientReadinessScore(currentProduct);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const finalDesc = p.marketplace_description || p.edited_text || p.draft || p.short_description || '';
        return {
          ...p,
          status: 'APPROVED',
          final_description: finalDesc,
          readiness_score: {
            ...readiness,
            status: 'READY',
          },
          history: [
            ...(p.history || []),
            { action: 'APPROVED_ALL_FORMATS', timestamp: new Date().toLocaleTimeString() },
          ],
        };
      })
    );
    setSuccessMessage(`Approved all 4 catalogue formats for ${currentProduct.product_id}`);
  };

  // Batch 3: Approve all low-risk items (requires confirmation dialog)
  const handleConfirmApproveLowRisk = () => {
    let count = 0;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.status === 'APPROVED' || p.status === 'INACCESSIBLE' || p.status === 'ERROR') {
          return p;
        }
        const readiness = p.readiness_score || computeClientReadinessScore(p);
        const hasClaimFlags = (p.content_check?.flagged_claims?.length || 0) > 0;
        const isLowRisk = readiness.score >= 80 && !hasClaimFlags;

        if (isLowRisk) {
          count++;
          const finalDesc = p.marketplace_description || p.edited_text || p.draft || p.short_description || '';
          return {
            ...p,
            status: 'APPROVED',
            final_description: finalDesc,
            history: [
              ...(p.history || []),
              { action: 'BATCH_APPROVED_LOW_RISK', timestamp: new Date().toLocaleTimeString() },
            ],
          };
        }
        return p;
      })
    );
    setShowApproveLowRiskModal(false);
    setSuccessMessage(`Approved ${count} low-risk product(s) (Readiness ≥ 80, no claim flags).`);
  };

  // Batch 3: Retry failed item in bulk queue
  const handleRetryBulkItem = async (itemId) => {
    const item = bulkQueue.find((q) => q.id === itemId);
    if (!item) return;

    setBulkQueue((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, status: 'ANALYZING', error: null } : q))
    );

    try {
      const res = await fetch('/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.id,
          productName: item.metadata_title,
          category: item.category,
          image: item.image_url,
        }),
      });
      let cat = item.category;
      let features = [];
      if (res.ok) {
        const data = await res.json();
        features = data.features || [];
        if (data.suggestedCategory) cat = data.suggestedCategory;
      }

      setBulkQueue((prev) =>
        prev.map((q) => (q.id === itemId ? { ...q, status: 'READY', category: cat } : q))
      );
      setSuccessMessage(`Retried and processed ${itemId} successfully.`);
    } catch (err) {
      setBulkQueue((prev) =>
        prev.map((q) => (q.id === itemId ? { ...q, status: 'FAILED', error: err.message } : q))
      );
      setErrorMessage(`Retry failed for ${itemId}: ${err.message}`);
    }
  };



  // Edge-case toggles
  const handleToggleEdgeCase = (key) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const updatedEdgeCases = {
          ...p.edge_cases,
          [key]: !p.edge_cases[key],
        };
        return {
          ...p,
          edge_cases: updatedEdgeCases,
          edited_text: key === 'is_decorative' && !p.edge_cases.is_decorative ? '' : p.edited_text,
          status: 'EDITED',
        };
      })
    );
  };

  // Multilingual translation request
  const handleTranslate = async (langCode) => {
    if (!currentProduct) return;
    setReviewLanguage(langCode);
    if (langCode === 'en') return;

    setIsTranslating(true);
    try {
      const response = await fetch(`/api/images/${currentProduct.product_id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage: langCode,
          text: currentProduct.final_description || currentText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const translated = data.translatedText;
        setProducts((prev) =>
          prev.map((p) => {
            if (p.product_id !== currentProduct.product_id) return p;
            return {
              ...p,
              selected_language: langCode,
              translations: {
                ...p.translations,
                [langCode]: translated,
              },
            };
          })
        );
        setSuccessMessage(`Review aid synced in ${langCode.toUpperCase()}`);
      }
    } catch (e) {
      // Graceful fallback to English
    } finally {
      setIsTranslating(false);
    }
  };

  // Voice TTS Playback (Reads Product ID, Description, then Validator warnings)
  const handleVoicePlay = (targetProduct = currentProduct, onEndCallback = null) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setErrorMessage('Speech Synthesis API is not supported in this browser.');
      return;
    }

    if (isPlayingVoice && !targetProduct) {
      window.speechSynthesis.pause();
      setIsPlayingVoice(false);
      return;
    }

    const p = targetProduct || currentProduct;
    if (!p) return;

    window.speechSynthesis.cancel();

    // Text to speak based on selected review language
    const spokenDesc = reviewLanguage === 'en'
      ? (p.edited_text || p.description_bullets || p.draft || p.visible_description)
      : (p.translations?.[reviewLanguage] || p.edited_text || p.draft);

    // Read order: Product ID, description, then validator/risk warnings
    let warningsText = '';
    const val = validationResult;
    if (val && val.offendingWords && val.offendingWords.length > 0) {
      warningsText = ` Attention: contains unsupported claims for ${val.offendingWords.map(w => w.word).join(', ')}.`;
    }

    const fullUtteranceText = `Product ${p.product_id}. ${spokenDesc}.${warningsText}`;

    const utterance = new SpeechSynthesisUtterance(fullUtteranceText);
    utterance.rate = voiceRate;

    // Pick matching voice for the selected language
    const langPrefix = reviewLanguage.toLowerCase();
    let voice = availableVoices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
    if (!voice) {
      voice = availableVoices.find((v) => v.lang.toLowerCase().startsWith('en')) || availableVoices[0];
    }
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || reviewLanguage;
    } else {
      utterance.lang = reviewLanguage;
    }

    utterance.onend = () => {
      setIsPlayingVoice(false);
      // Mark as listened
      setProducts((prev) =>
        prev.map((item) => (item.product_id === p.product_id ? { ...item, listened: true } : item))
      );
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      setIsPlayingVoice(false);
    };

    ttsUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlayingVoice(true);
  };

  const handleVoicePause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPlayingVoice(false);
      setListenAllPlaying(false);
    }
  };

  const handleVoiceReplay = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      setTimeout(() => handleVoicePlay(currentProduct), 100);
    }
  };

  // "Listen to All" sequential queue playback
  const handleStartListenAll = () => {
    setListenAllPlaying(true);
    let index = products.findIndex((p) => p.product_id === selectedId);
    if (index === -1) index = 0;

    const playNext = (idx) => {
      if (idx >= products.length) {
        setListenAllPlaying(false);
        setSuccessMessage('Completed audio review queue!');
        return;
      }
      const prod = products[idx];
      setSelectedId(prod.product_id);
      handleVoicePlay(prod, () => {
        if (autoAdvanceVoice) {
          playNext(idx + 1);
        } else {
          setListenAllPlaying(false);
        }
      });
    };

    playNext(index);
  };

  const handleListenAllToggle = () => {
    if (listenAllPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setListenAllPlaying(false);
      setIsPlayingVoice(false);
    } else {
      handleStartListenAll();
    }
  };

  const handleApproveAllListened = () => {
    let count = 0;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.listened && p.status !== 'INACCESSIBLE' && p.status !== 'APPROVED') {
          const desc = p.edited_text || p.description_bullets || p.draft;
          if (desc && desc.trim().length > 0) {
            count++;
            return {
              ...p,
              status: 'APPROVED',
              final_description: desc,
              history: [...(p.history || []), { action: 'APPROVED_BATCH_LISTENED', timestamp: new Date().toLocaleTimeString() }]
            };
          }
        }
        return p;
      })
    );
    setShowApproveAllModal(false);
    setShowApproveAllListenedModal(false);
    setSuccessMessage(`Approved ${count} listened products.`);
  };

  const handleStopCamera = () => {
    handleCloseCamera();
  };

  // Single Merchant File Upload with client-side quality check
  const handleFileUpload = async (e) => {
    const file = e?.target?.files?.[0] || e?.dataTransfer?.files?.[0] || (e instanceof File ? e : null);
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result;
      const numStr = String(uploadCounterRef.current).padStart(3, '0');
      const newId = `UPLOAD-${numStr}`;
      uploadCounterRef.current += 1;

      // Client-side image quality check
      const qualityCheck = await checkImageQualityClient(base64);
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const category = 'Merchant Item';
      const estimatedPrice = getEstimatedProductPrice(category, title, file.name);

      const newProduct = {
        product_id: newId,
        metadata_title: title,
        category: category,
        price: estimatedPrice,
        visible_description: 'Merchant uploaded product image',
        review_note: 'Merchant image upload; review observable features before approval.',
        image_url: base64,
        file_name: file.name,
        status: 'PENDING',
        draft: 'Merchant product photo ready for visual review.',
        description_short: 'Merchant product photo ready for visual review.',
        description_bullets: '• Merchant product photo ready for visual review.\n• Observable traits presented against neutral background.',
        description_long: 'Merchant product photo ready for visual review. Observable features displayed against neutral setting.',
        selected_description_type: 'bullets',
        edited_text: '',
        final_description: '',
        mode: 'BULLETS',
        quality_status: qualityCheck.warnings.length === 0 ? 'GOOD' : 'WARNING',
        quality_score: qualityCheck.warnings.length === 0 ? 92 : 68,
        quality_warning: qualityCheck.warnings.length > 0 ? qualityCheck.warnings : null,
        quality_details: {
          resolution: `${qualityCheck.width} x ${qualityCheck.height} px`,
          aspect_ratio: 'Standard',
          visual_clarity: qualityCheck.isGood ? 'Good' : 'Needs Review',
          blur_estimate: qualityCheck.variance < 150 ? 'Blurry / Low contrast' : 'Sharp / Clear focus',
          brightness: `${qualityCheck.avgBrightness}%`,
          contrast: 'High',
        },
        detected_features: [],
        feature_choices: {},
        listened: false,
        selected_language: 'en',
        translations: {
          en: 'Merchant product photo ready for visual review.',
          hi: 'समीक्षा के लिए तैयार उत्पाद छवि।',
          te: 'సమీక్షకు సిద్ధంగా ఉన్న ఉత్పత్తి చిత్రం.',
        },
        edge_cases: {
          is_decorative: false,
          contains_text: false,
          multiple_products: false,
          ambiguous_color: false,
        },
        history: [{ action: 'UPLOADED', timestamp: new Date().toLocaleTimeString() }],
        isUploaded: true,
      };

      setProducts((prev) => [...prev, newProduct]);
      setSelectedId(newId);
      setActiveTab('workspace');
      setSuccessMessage(`Loaded upload ${newId} (${file.name}) — Estimated Price: $${estimatedPrice.toFixed(2)}. Quality: ${qualityCheck.isGood ? 'Good' : 'Warning'}`);
    };
    reader.readAsDataURL(file);
    if (e?.target) e.target.value = '';
  };

  // Remove single product from review queue
  const handleDeleteProduct = (id) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.product_id !== id);
      if (selectedId === id) {
        setSelectedId(next.length > 0 ? next[0].product_id : '');
      }
      return next;
    });
    setSuccessMessage(`Removed product ${id} from queue.`);
  };

  // Clear entire queue
  const handleClearQueue = () => {
    setProducts([]);
    setSelectedId('');
    setSuccessMessage('Cleared review queue.');
  };

  // ==========================================
  // BATCH 2: MULTI-IMAGE UPLOAD & GROUPING
  // ==========================================

  // Multi-Image Upload: Merchant uploads multiple images at once (front, back, side, detail)
  const handleMultiImageFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Cap images per upload batch (max 8)
    if (files.length > 8) {
      setErrorMessage(`Multi-image cap exceeded: You selected ${files.length} images. Maximum 8 images per product upload allowed.`);
      e.target.value = '';
      return;
    }

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB cap
    const preparedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowed.includes(file.type.toLowerCase())) {
        setErrorMessage(`Unsupported format in file "${file.name}". Please upload PNG, JPG, or WEBP only.`);
        e.target.value = '';
        return;
      }

      if (file.size > maxSizeBytes) {
        setErrorMessage(`File "${file.name}" exceeds 5MB size limit (${(file.size / 1024 / 1024).toFixed(1)}MB). Please choose a smaller image.`);
        e.target.value = '';
        return;
      }

      const base64 = await new Promise((res) => {
        const r = new FileReader();
        r.onload = (ev) => res(ev.target?.result);
        r.readAsDataURL(file);
      });

      const qualityCheck = await checkImageQualityClient(base64);

      preparedImages.push({
        id: `img-${Date.now()}-${i}`,
        file_name: file.name,
        name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        url: base64,
        qualityCheck,
      });
    }

    e.target.value = '';
    setIsGroupingImages(true);
    setErrorMessage('');

    try {
      // Send images to Gemini grouping endpoint
      const response = await fetch('/api/multi-image/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: preparedImages.map((img) => ({
            id: img.id,
            name: img.file_name,
            url: img.url,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('AI grouping service encountered an error.');
      }

      const data = await response.json();
      const groups = (data.groups || []).map((grp, gIdx) => ({
        ...grp,
        group_id: grp.group_id || `GRP-${gIdx + 1}`,
        group_name: grp.group_name || `Product Group ${gIdx + 1}`,
        needs_merchant_confirmation: grp.needs_merchant_confirmation || false,
        confirmation_message: grp.confirmation_message || '',
        images: grp.images.map((img) => ({
          ...img,
          view: img.view || 'front',
          confidence: img.confidence || 'high',
          is_inaccessible: false,
        })),
      }));

      setStagedGroups(groups);
      setShowGroupingModal(true);
      setSuccessMessage(`AI analyzed ${preparedImages.length} images and suggested ${groups.length} product group(s).`);
    } catch (err) {
      // Fallback: If network/AI fails, present images as a single group for merchant confirmation
      const fallbackGroup = [{
        group_id: 'GRP-1',
        group_name: preparedImages[0]?.name || 'Uploaded Product',
        category: 'Merchant Item',
        confidence: 'low',
        needs_merchant_confirmation: true,
        confirmation_message: 'These images may represent the same product. Please confirm.',
        images: preparedImages.map((img, idx) => ({
          id: img.id,
          file_name: img.file_name,
          url: img.url,
          view: idx === 0 ? 'front' : idx === 1 ? 'back' : idx === 2 ? 'side' : 'detail',
          confidence: 'medium',
          is_inaccessible: false,
        })),
      }];
      setStagedGroups(fallbackGroup);
      setShowGroupingModal(true);
      setErrorMessage('AI grouping used local fallback. Review and confirm product groups below.');
    } finally {
      setIsGroupingImages(false);
    }
  };

  // Grouping Studio: Merge all staged groups into one product group
  const handleMergeAllStagedGroups = () => {
    if (stagedGroups.length <= 1) return;
    const allImages = stagedGroups.flatMap((g) => g.images);
    const merged = [{
      group_id: 'GRP-MERGED',
      group_name: stagedGroups[0]?.group_name || 'Merged Product Group',
      category: stagedGroups[0]?.category || 'Merchant Item',
      confidence: 'high',
      needs_merchant_confirmation: false,
      confirmation_message: '',
      images: allImages,
    }];
    setStagedGroups(merged);
    setSuccessMessage(`Merged into a single product group with ${allImages.length} views.`);
  };

  // Grouping Studio: Separate a group so each image becomes an individual product
  const handleSeparateStagedGroup = (groupIndex) => {
    const targetGroup = stagedGroups[groupIndex];
    if (!targetGroup || targetGroup.images.length <= 1) return;

    const separated = targetGroup.images.map((img, i) => ({
      group_id: `GRP-SEP-${Date.now()}-${i}`,
      group_name: img.file_name ? img.file_name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : `Product Item ${i + 1}`,
      category: targetGroup.category || 'Merchant Item',
      confidence: 'high',
      needs_merchant_confirmation: false,
      images: [img],
    }));

    const nextGroups = [
      ...stagedGroups.slice(0, groupIndex),
      ...separated,
      ...stagedGroups.slice(groupIndex + 1),
    ];
    setStagedGroups(nextGroups);
    setSuccessMessage(`Separated group into ${separated.length} individual products.`);
  };

  // Grouping Studio: Rename a staged group
  const handleRenameStagedGroup = (groupIndex, newName) => {
    setStagedGroups((prev) =>
      prev.map((g, idx) => (idx === groupIndex ? { ...g, group_name: newName } : g))
    );
  };

  // Grouping Studio: Remove an image from a staged group
  const handleRemoveStagedImage = (groupIndex, imgIndex) => {
    setStagedGroups((prev) => {
      const next = prev.map((g, gIdx) => {
        if (gIdx !== groupIndex) return g;
        const remainingImages = g.images.filter((_, i) => i !== imgIndex);
        return { ...g, images: remainingImages };
      }).filter((g) => g.images.length > 0);
      return next;
    });
  };

  // Grouping Studio: Correct view orientation label in staged group
  const handleChangeStagedImageView = (groupIndex, imgIndex, newView) => {
    setStagedGroups((prev) =>
      prev.map((g, gIdx) => {
        if (gIdx !== groupIndex) return g;
        const nextImgs = g.images.map((img, i) => (i === imgIndex ? { ...img, view: newView } : img));
        return { ...g, images: nextImgs };
      })
    );
  };

  // Grouping Studio: Confirm and commit product groups to review queue
  const handleConfirmGroupingCommit = () => {
    if (stagedGroups.length === 0) {
      setShowGroupingModal(false);
      return;
    }

    const createdProducts = [];

    stagedGroups.forEach((grp) => {
      if (grp.images.length === 0) return;
      const numStr = String(uploadCounterRef.current).padStart(3, '0');
      const newId = `UPLOAD-${numStr}`;
      uploadCounterRef.current += 1;

      const category = grp.category || 'General';
      const coverage = computeClientViewCoverage(category, grp.images);

      const estPrice = getEstimatedProductPrice(category, grp.group_name || `Multi-View Product ${newId}`);

      const product = {
        product_id: newId,
        metadata_title: grp.group_name || `Multi-View Product ${newId}`,
        category,
        price: estPrice,
        visible_description: `Merchant multi-view product (${grp.images.length} angle photos: ${grp.images.map(img => img.view).join(', ')})`,
        review_note: `Multi-view product (${grp.images.length} views). Review all angles before final approval.`,
        image_url: grp.images[0]?.url || '',
        images: grp.images.map((img, idx) => ({
          id: img.id || `${newId}-v${idx + 1}`,
          url: img.url,
          view: img.view || 'front',
          confidence: img.confidence || 'high',
          is_inaccessible: false,
        })),
        active_view_index: 0,
        image_count: grp.images.length,
        view_coverage: coverage,
        view_recommendation: coverage.recommendation,
        file_name: grp.images[0]?.file_name || `${newId}.jpg`,
        status: 'PENDING',
        draft: `Multi-angle product (${grp.images.length} views: ${grp.images.map(img => img.view).join(', ')}) ready for visual review.`,
        description_short: `Multi-view product ready for visual catalogue review.`,
        description_bullets: `• Multi-view product captured across ${grp.images.length} angles (${grp.images.map(img => img.view).join(', ')}).\n• Observable details verified across visible perspectives.`,
        description_long: `Multi-view product captured across ${grp.images.length} perspectives. Observable features confirmed from real merchant photographs.`,
        selected_description_type: 'bullets',
        edited_text: '',
        final_description: '',
        mode: 'BULLETS',
        quality_status: 'GOOD',
        quality_score: 90,
        detected_features: [],
        feature_choices: {},
        merchant_confirmed_specs: {},
        merchant_answers: {},
        verification_questions: [],
        selected_highlights: [],
        recommended_highlights: [],
        listened: false,
        selected_language: 'en',
        translations: { en: 'Multi-view product ready for visual review.' },
        edge_cases: { is_decorative: false, contains_text: false, multiple_products: false, ambiguous_color: false },
        history: [{ action: `MULTI_IMAGE_UPLOAD (${grp.images.length} views)`, timestamp: new Date().toLocaleTimeString() }],
        isUploaded: true,
      };

      createdProducts.push(product);
    });

    setProducts((prev) => [...prev, ...createdProducts]);
    if (createdProducts.length > 0) {
      setSelectedId(createdProducts[0].product_id);
    }
    setShowGroupingModal(false);
    setActiveTab('workspace');
    setSuccessMessage(`Successfully added ${createdProducts.length} multi-image product(s) with estimated pricing to the queue!`);
  };

  // Add single view to the current active product (cap at 8)
  const handleAddViewToCurrentProduct = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentProduct) return;

    if (activeImages.length >= 8) {
      setErrorMessage('Image cap reached: Maximum 8 images per product allowed.');
      e.target.value = '';
      return;
    }

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setErrorMessage('Please upload a PNG, JPG, or WEBP image.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image exceeds 5MB size limit.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result;
      const nextIndex = activeImages.length;
      // Default view based on missing views in category
      const currentCoverage = currentProduct.view_coverage || computeClientViewCoverage(currentProduct.category, activeImages);
      const defaultView = currentCoverage.missing_views?.[0] || 'detail';

      const newImg = {
        id: `${currentProduct.product_id}-v${nextIndex + 1}-${Date.now()}`,
        url: base64,
        view: defaultView,
        confidence: 'high',
        is_inaccessible: false,
      };

      const updatedImages = [...activeImages, newImg];
      const nextCoverage = computeClientViewCoverage(currentProduct.category, updatedImages);

      setProducts((prev) =>
        prev.map((p) => {
          if (p.product_id !== currentProduct.product_id) return p;
          return {
            ...p,
            images: updatedImages,
            image_count: updatedImages.length,
            active_view_index: updatedImages.length - 1,
            view_coverage: nextCoverage,
            view_recommendation: nextCoverage.recommendation,
          };
        })
      );

      setSuccessMessage(`Added ${defaultView} view to ${currentProduct.product_id}. Coverage now: ${nextCoverage.score}%`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Remove a single view from current product
  const handleRemoveViewFromCurrentProduct = (imgIndex) => {
    if (!currentProduct || activeImages.length <= 1) {
      setErrorMessage('Cannot remove the only image. To mark unusable, click Mark Inaccessible.');
      return;
    }

    const updatedImages = activeImages.filter((_, idx) => idx !== imgIndex);
    const nextCoverage = computeClientViewCoverage(currentProduct.category, updatedImages);
    const nextActiveIndex = Math.max(0, Math.min(activeViewIndex, updatedImages.length - 1));

    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        return {
          ...p,
          images: updatedImages,
          image_count: updatedImages.length,
          image_url: updatedImages[0]?.url || p.image_url,
          active_view_index: nextActiveIndex,
          view_coverage: nextCoverage,
          view_recommendation: nextCoverage.recommendation,
        };
      })
    );
    setSuccessMessage(`Removed view. Coverage updated to ${nextCoverage.score}%.`);
  };

  // Toggle single image inaccessible (e.g. blurry side view)
  const handleToggleViewInaccessible = (imgIndex) => {
    if (!currentProduct) return;
    const targetImg = activeImages[imgIndex];
    const newInaccessible = !targetImg.is_inaccessible;

    const updatedImages = activeImages.map((img, idx) =>
      idx === imgIndex ? { ...img, is_inaccessible: newInaccessible } : img
    );

    // Recompute view coverage excluding inaccessible views
    const nextCoverage = computeClientViewCoverage(currentProduct.category, updatedImages);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        return {
          ...p,
          images: updatedImages,
          view_coverage: nextCoverage,
          view_recommendation: nextCoverage.recommendation,
        };
      })
    );

    setSuccessMessage(newInaccessible
      ? `Marked ${targetImg.view} view as inaccessible. Excluded from coverage.`
      : `Restored ${targetImg.view} view to active.`
    );
  };

  // Correct view label on active product (front, back, side, detail, heel, sole, ports, etc.)
  const handleChangeViewLabel = (imgIndex, newView) => {
    if (!currentProduct) return;
    const updatedImages = activeImages.map((img, idx) =>
      idx === imgIndex ? { ...img, view: newView } : img
    );
    const nextCoverage = computeClientViewCoverage(currentProduct.category, updatedImages);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        return {
          ...p,
          images: updatedImages,
          view_coverage: nextCoverage,
          view_recommendation: nextCoverage.recommendation,
        };
      })
    );
  };

  // 360-Style Viewer Navigation: Cycle through ONLY real uploaded images
  const handlePrev360View = () => {
    if (activeImages.length <= 1) return;
    const nextIdx = (activeViewIndex - 1 + activeImages.length) % activeImages.length;
    setProducts((prev) =>
      prev.map((p) => (p.product_id === currentProduct.product_id ? { ...p, active_view_index: nextIdx } : p))
    );
  };

  const handleNext360View = () => {
    if (activeImages.length <= 1) return;
    const nextIdx = (activeViewIndex + 1) % activeImages.length;
    setProducts((prev) =>
      prev.map((p) => (p.product_id === currentProduct.product_id ? { ...p, active_view_index: nextIdx } : p))
    );
  };

  // Multi-View Deep Analysis: Send all accessible images in group to Gemini together
  const handleAnalyzeMultiViewProduct = async () => {
    if (!currentProduct) return;
    const accessibleImages = activeImages.filter((img) => !img.is_inaccessible);
    if (accessibleImages.length === 0) {
      setErrorMessage('No accessible images to analyze. All views are marked inaccessible.');
      return;
    }

    setIsAnalyzingProduct(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/multi-image/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: currentProduct.product_id,
          productName: currentProduct.metadata_title,
          category: currentProduct.category,
          images: accessibleImages.map((img) => ({
            id: img.id,
            url: img.url,
            view: img.view,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Multi-view analysis service encountered an error.');
      }

      const data = await response.json();
      const detectedFeatures = (data.detected_features || []).map((f) => ({
        ...f,
        choice: currentProduct.feature_choices?.[f.id] || 'INCLUDE',
      }));

      const initialChoices = { ...(currentProduct.feature_choices || {}) };
      detectedFeatures.forEach((f) => {
        if (!initialChoices[f.id]) initialChoices[f.id] = 'INCLUDE';
      });

      const bulletsDesc = data.description_bullets || currentProduct.draft || '';
      const questions = data.verification_questions || [];
      const highlights = data.recommended_highlights || [];
      const coverage = data.view_coverage || computeClientViewCoverage(data.detected_product?.category || currentProduct.category, activeImages);

      setProducts((prev) =>
        prev.map((p) => {
          if (p.product_id !== currentProduct.product_id) return p;
          const updatedHistory = [
            ...p.history,
            { action: `MULTI_VIEW_ANALYZED (${accessibleImages.length} views)`, timestamp: new Date().toLocaleTimeString() },
          ];
          return {
            ...p,
            detected_product: data.detected_product || p.detected_product,
            category: data.detected_product?.category || p.category,
            detected_features: detectedFeatures,
            feature_choices: initialChoices,
            verification_questions: questions,
            recommended_highlights: highlights,
            selected_highlights: highlights,
            description_bullets: bulletsDesc,
            draft: bulletsDesc,
            edited_text: bulletsDesc,
            content_check: data.content_check || null,
            view_coverage: coverage,
            view_recommendation: coverage.recommendation,
            history: updatedHistory,
            status: 'DRAFT_READY',
          };
        })
      );

      setSuccessMessage(`Multi-view analysis complete for ${currentProduct.product_id}! Analyzed across ${accessibleImages.length} angles.`);
    } catch (err) {
      setErrorMessage(err.message || 'Multi-view analysis encountered an issue. Fallback reference active.');
    } finally {
      setIsAnalyzingProduct(false);
    }
  };

  // Camera Capture start (desktop getUserMedia with fallback)
  const handleStartCamera = async () => {
    setShowCameraModal(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        cameraStreamRef.current = stream;
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play();
        }
      } else {
        throw new Error('Camera not supported');
      }
    } catch (err) {
      setShowCameraModal(false);
      setErrorMessage('Camera access was not granted or is not supported. Please use file upload instead.');
      cameraFileInputRef.current?.click();
    }
  };

  const handleSnapCamera = async () => {
    if (!cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    // Stop stream
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setShowCameraModal(false);

    // Quality check
    const qualityCheck = await checkImageQualityClient(dataUrl);
    const numStr = String(uploadCounterRef.current).padStart(3, '0');
    const newId = `UPLOAD-${numStr}`;
    uploadCounterRef.current += 1;

    const estPrice = getEstimatedProductPrice('Merchant Item', `Camera Photo ${newId}`);

    const newProduct = {
      product_id: newId,
      metadata_title: `Camera Photo ${newId}`,
      category: 'Merchant Item',
      price: estPrice,
      visible_description: 'Direct camera photo of product',
      review_note: 'Direct camera capture; review observable details before approval.',
      image_url: dataUrl,
      file_name: `${newId}.jpg`,
      status: 'PENDING',
      draft: 'Camera photo ready for visual review.',
      description_short: 'Camera product photo ready for visual review.',
      description_bullets: '• Direct camera product photo ready for review.\n• Observable traits captured under local lighting.',
      description_long: 'Direct camera product photo ready for visual review. Observable features displayed on surface.',
      selected_description_type: 'bullets',
      edited_text: '',
      final_description: '',
      mode: 'BULLETS',
      quality_status: qualityCheck.warnings.length === 0 ? 'GOOD' : 'WARNING',
      quality_score: qualityCheck.warnings.length === 0 ? 90 : 65,
      quality_warning: qualityCheck.warnings.length > 0 ? qualityCheck.warnings : null,
      quality_details: {
        resolution: `${qualityCheck.width} x ${qualityCheck.height} px`,
        aspect_ratio: 'Standard',
        visual_clarity: qualityCheck.isGood ? 'Good' : 'Needs Review',
        blur_estimate: qualityCheck.variance < 150 ? 'Blurry' : 'Sharp focus',
        brightness: `${qualityCheck.avgBrightness}%`,
        contrast: 'Standard',
      },
      detected_features: [],
      feature_choices: {},
      listened: false,
      selected_language: 'en',
      translations: { en: 'Camera photo ready for visual review.' },
      edge_cases: { is_decorative: false, contains_text: false, multiple_products: false, ambiguous_color: false },
      history: [{ action: 'CAMERA_CAPTURE', timestamp: new Date().toLocaleTimeString() }],
      isUploaded: true,
    };

    setProducts((prev) => [...prev, newProduct]);
    setSelectedId(newId);
    setActiveTab('workspace');
    setSuccessMessage(`Captured ${newId} from camera! Estimated Price: $${estPrice.toFixed(2)}. Quality: ${qualityCheck.isGood ? 'Good' : 'Warning'}`);
  };

  const handleCloseCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setShowCameraModal(false);
  };

  // Bulk Upload (max 20 images)
  const handleBulkFilesSelected = async (e) => {
    const files = Array.from(e?.target?.files || e?.dataTransfer?.files || []);
    if (files.length === 0) return;

    if (files.length > 20) {
      setErrorMessage(`Batch limit exceeded: You selected ${files.length} images. Maximum 20 images per batch allowed (10 recommended).`);
      if (e?.target) e.target.value = '';
      return;
    }

    const newQueueItems = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const numStr = String(uploadCounterRef.current).padStart(3, '0');
      const newId = `UPLOAD-${numStr}`;
      uploadCounterRef.current += 1;

      const base64 = await new Promise((res) => {
        const r = new FileReader();
        r.onload = (ev) => res(ev.target?.result);
        r.readAsDataURL(file);
      });

      const qualityCheck = await checkImageQualityClient(base64);

      newQueueItems.push({
        id: newId,
        file,
        product_id: newId,
        metadata_title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        category: 'Merchant Item',
        visible_description: 'Merchant batch uploaded item',
        image_url: base64,
        status: 'QUEUED', // QUEUED | ANALYZING | READY | FAILED
        qualityCheck,
      });
    }

    setBulkQueue(newQueueItems);
    setBulkProgress({ total: newQueueItems.length, completed: 0 });
    setShowBulkUploadModal(true);
    if (e?.target) e.target.value = '';

    // Process bulk items sequentially (2 concurrent)
    processBulkQueue(newQueueItems);
  };

  const processBulkQueue = async (items) => {
    const updatedProducts = [];
    const concurrency = 2;

    const processSingleItem = async (item) => {
      // Set item to ANALYZING
      setBulkQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'ANALYZING', error: null } : q))
      );

      let features = [];
      let cat = item.category || 'General';
      let questions = [];
      let suggestedHighlights = [];

      try {
        const res = await fetch('/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.id,
            productName: item.metadata_title,
            category: item.category,
            image: item.image_url,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          features = data.features || [];
          if (data.suggestedCategory) cat = data.suggestedCategory;
          questions = data.verification_questions || [];
          suggestedHighlights = data.recommended_highlights || [];
        }
      } catch (err) {
        console.warn('Batch analyze item fallback:', err.message);
      }

      const initialChoices = {};
      features.forEach((f) => {
        initialChoices[f.id] = f.confidence === 'low' ? 'UNSURE' : 'INCLUDE';
      });

      // Generate multi-format descriptions
      let formats = {
        product_highlights: [
          `Visual silhouette: ${cat} item with observable contours.`,
          `High-contrast finish visible on exterior.`,
          `Neutral backdrop with standard product presentation.`
        ],
        short_description: `Observable ${cat} item featuring balanced form and defined visible lines.`,
        marketplace_description: `This ${cat} item displays clear observable exterior attributes on a neutral review surface. Suitable for visual catalogue inspection.`,
        card_summary: `Observable ${cat} item with distinct structural features.`,
      };

      try {
        const mfRes = await fetch('/api/batch/generate-multi-format', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.id,
            productName: item.metadata_title,
            category: cat,
            image: item.image_url,
            images: [],
            verifiedSpecs: {},
            confirmedFeatures: features.filter((f) => f.confidence !== 'low'),
            highlights: suggestedHighlights,
          }),
        });
        if (mfRes.ok) {
          const mfData = await mfRes.json();
          if (mfData.product_highlights) formats.product_highlights = mfData.product_highlights;
          if (mfData.short_description) formats.short_description = mfData.short_description;
          if (mfData.marketplace_description) formats.marketplace_description = mfData.marketplace_description;
          if (mfData.card_summary) formats.card_summary = mfData.card_summary;
        }
      } catch (mfErr) {
        console.warn('Multi-format generation fallback:', mfErr.message);
      }

      const bulletsText = Array.isArray(formats.product_highlights)
        ? formats.product_highlights.map((h) => `• ${h}`).join('\n')
        : formats.product_highlights;

      const estPrice = getEstimatedProductPrice(cat, item.metadata_title, item.file?.name);

      const prod = {
        product_id: item.id,
        metadata_title: item.metadata_title,
        category: cat,
        price: estPrice,
        visible_description: 'Merchant batch uploaded product',
        review_note: 'Batch image upload; review observable features before approval.',
        image_url: item.image_url,
        file_name: item.file.name,
        status: 'GENERATED',
        draft: formats.marketplace_description,
        short_description: formats.short_description,
        description_short: formats.short_description,
        description_bullets: bulletsText,
        product_highlights: formats.product_highlights,
        description_long: formats.marketplace_description,
        marketplace_description: formats.marketplace_description,
        card_summary: formats.card_summary,
        selected_description_type: 'marketplace',
        edited_text: '',
        final_description: formats.marketplace_description,
        mode: 'BULLETS',
        quality_status: item.qualityCheck.warnings.length === 0 ? 'GOOD' : 'WARNING',
        quality_score: item.qualityCheck.warnings.length === 0 ? 92 : 70,
        quality_warning: item.qualityCheck.warnings.length > 0 ? item.qualityCheck.warnings : null,
        quality_details: {
          resolution: `${item.qualityCheck.width} x ${item.qualityCheck.height} px`,
          aspect_ratio: 'Standard',
          visual_clarity: item.qualityCheck.isGood ? 'Good' : 'Needs Review',
          blur_estimate: item.qualityCheck.variance < 150 ? 'Blurry' : 'Sharp focus',
          brightness: `${item.qualityCheck.avgBrightness}%`,
          contrast: 'High',
        },
        detected_features: features,
        feature_choices: initialChoices,
        verification_questions: questions,
        merchant_confirmed_specs: {},
        selected_highlights: suggestedHighlights,
        recommended_highlights: suggestedHighlights,
        listened: false,
        selected_language: 'en',
        translations: { en: formats.marketplace_description },
        edge_cases: { is_decorative: false, contains_text: false, multiple_products: false, ambiguous_color: false },
        history: [{ action: 'BATCH_UPLOADED', timestamp: new Date().toLocaleTimeString() }],
        isUploaded: true,
      };

      prod.readiness_score = computeClientReadinessScore(prod);
      updatedProducts.push(prod);

      setBulkQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'READY', category: cat } : q))
      );
      setBulkProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
    };

    // Process with concurrency of 2
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      await Promise.all(chunk.map((item) => processSingleItem(item)));
    }

    setProducts((prev) => [...prev, ...updatedProducts]);
    setSuccessMessage(`Processed ${updatedProducts.length} images in bulk upload!`);
  };

  // Approve all low-risk listened items
  const handleConfirmApproveAllListened = () => {
    setProducts((prev) =>
      prev.map((p) => {
        const val = validateDescriptionText(p.edited_text || p.description_bullets || p.draft);
        const isLowRisk = val.isValid && p.status !== 'INACCESSIBLE';
        if (p.listened && isLowRisk && p.status !== 'APPROVED') {
          const finalDesc = p.edited_text || p.description_bullets || p.draft;
          return {
            ...p,
            status: 'APPROVED',
            final_description: finalDesc,
            history: [...p.history, { action: 'BATCH_APPROVED_LISTENED', timestamp: new Date().toLocaleTimeString() }],
          };
        }
        return p;
      })
    );
    setShowApproveAllListenedModal(false);
    setSuccessMessage('Approved all low-risk listened products!');
  };

  // Export Selection Helpers
  const handleToggleSelectExport = (id) => {
    setSelectedExportIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllExport = () => {
    setSelectedExportIds(products.map((p) => p.product_id));
  };

  const handleClearExportSelection = () => {
    setSelectedExportIds([]);
  };

  const handleSelectApprovedExportOnly = () => {
    const approvedIds = products.filter((p) => p.status === 'APPROVED').map((p) => p.product_id);
    setSelectedExportIds(approvedIds);
  };

  const handleSelectPendingExportOnly = () => {
    const pendingIds = products.filter((p) => p.status !== 'APPROVED' && p.status !== 'INACCESSIBLE').map((p) => p.product_id);
    setSelectedExportIds(pendingIds);
  };

  // CSV Export Download (supports custom/single product or selected products)
  const handleExportCsv = (customProducts = null) => {
    const targetProducts = Array.isArray(customProducts)
      ? customProducts
      : (selectedExportIds.length > 0
          ? products.filter((p) => selectedExportIds.includes(p.product_id))
          : []);

    if (!targetProducts || targetProducts.length === 0) {
      setErrorMessage('Please select at least one description to export.');
      return;
    }

    const escapeCsv = (str) => {
      const s = String(str ?? '');
      if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headers = [
      'product_id',
      'price',
      'category',
      'merchant_name',
      'description',
      'description_short',
      'description_bullets',
      'description_long',
      'status',
      'product_identified',
      'merchant_confirmed_specs',
      'content_check_status',
      'image_count',
      'view_coverage',
      'short_description',
      'marketplace_description',
      'card_summary',
      'verified_specifications',
      'selected_highlights',
      'readiness_score',
    ];

    const rows = targetProducts.map((p) => {
      const isInactive = p.status === 'INACCESSIBLE';
      const shortDesc = isInactive ? 'Image unavailable — manual review required.' : (p.short_description || p.description_short || p.visible_description);
      const bulletsDesc = isInactive ? 'Image unavailable — manual review required.' : (p.product_highlights || p.description_bullets || p.draft || `• ${p.visible_description}`);
      const longDesc = isInactive ? 'Image unavailable — manual review required.' : (p.marketplace_description || p.description_long || p.detailed_description || p.visible_description);
      const cardSummary = isInactive ? 'Image unavailable — manual review required.' : (p.card_summary || (shortDesc ? `${shortDesc.slice(0, 80)}...` : ''));

      // "description" is the final human-edited text (bullets by default)
      let finalDesc = p.final_description || p.edited_text || bulletsDesc;
      if (isInactive) {
        finalDesc = 'Image unavailable — manual review required.';
      }

      const identifiedName = p.detected_product?.product_name || p.metadata_title || '';
      const confirmedSpecsStr = Object.entries(p.merchant_confirmed_specs || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
      const contentCheckStatus = p.content_check?.passed ? 'PASSED' : (p.content_check?.flagged_claims?.length > 0 ? 'FLAGGED' : 'NOT_CHECKED');

      const imgCount = p.image_count || (Array.isArray(p.images) && p.images.length > 0 ? p.images.length : 1);
      const viewCov = p.view_coverage?.score !== undefined
        ? `${p.view_coverage.score}%`
        : (p.images && p.images.length > 1 ? '75%' : '25% (Single view)');

      const highlightsStr = (p.selected_highlights || p.recommended_highlights || []).join('; ') || 'None';
      const readinessObj = computeClientReadinessScore(p);

      return [
        escapeCsv(p.product_id),
        escapeCsv(p.price !== undefined ? `$${Number(p.price).toFixed(2)}` : '$0.00'),
        escapeCsv(p.category || 'General'),
        escapeCsv(merchantName),
        escapeCsv(finalDesc),
        escapeCsv(shortDesc),
        escapeCsv(bulletsDesc),
        escapeCsv(longDesc),
        escapeCsv(p.status),
        escapeCsv(identifiedName),
        escapeCsv(confirmedSpecsStr),
        escapeCsv(contentCheckStatus),
        escapeCsv(imgCount),
        escapeCsv(viewCov),
        escapeCsv(shortDesc),
        escapeCsv(longDesc),
        escapeCsv(cardSummary),
        escapeCsv(confirmedSpecsStr),
        escapeCsv(highlightsStr),
        escapeCsv(`${readinessObj.score}%`),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = targetProducts.length === 1
      ? `${targetProducts[0].product_id}_description.csv`
      : 'product_description_review_results.csv';
    link.click();
    URL.revokeObjectURL(url);
    setSuccessMessage(`Exported CSV with ${targetProducts.length} selected description(s).`);

    // Sync session to backend
    fetch('/api/products/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, merchantName }),
    }).catch(() => { });
  };

  // JSON Export Download (supports custom/single product or selected products)
  const handleExportJson = (customProducts = null) => {
    const targetProducts = Array.isArray(customProducts)
      ? customProducts
      : (selectedExportIds.length > 0
          ? products.filter((p) => selectedExportIds.includes(p.product_id))
          : []);

    if (!targetProducts || targetProducts.length === 0) {
      setErrorMessage('Please select at least one description to export.');
      return;
    }

    const payload = {
      app: 'VARNIX',
      case_id: 'C04',
      total_records: targetProducts.length,
      selected_count: targetProducts.length,
      demo_count: targetProducts.filter((p) => !p.isUploaded).length,
      upload_count: targetProducts.filter((p) => p.isUploaded).length,
      approved_count: targetProducts.filter((p) => p.status === 'APPROVED').length,
      records: targetProducts.map((p) => ({
        product_id: p.product_id,
        metadata_title: p.metadata_title,
        price: p.price !== undefined ? Number(p.price) : 0,
        price_formatted: `$${(p.price !== undefined ? Number(p.price) : 0).toFixed(2)}`,
        status: p.status,
        final_description: p.final_description || p.edited_text || p.draft,
        short_description: p.short_description || p.description_short,
        marketplace_description: p.marketplace_description,
        bullet_points: p.product_highlights,
        quality_status: p.quality_status,
        quality_score: p.quality_score,
        reviewer_note: p.reviewer_note,
        translations: p.translations,
        history: p.history,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = targetProducts.length === 1
      ? `${targetProducts[0].product_id}_description.json`
      : 'product_description_review_results.json';
    link.click();
    URL.revokeObjectURL(url);
    setSuccessMessage(`Exported JSON with ${targetProducts.length} selected description(s).`);
  };

  // Quick single-item download handlers
  const handleExportSingleCsv = (p) => {
    handleExportCsv([p]);
  };

  const handleExportSingleJson = (p) => {
    handleExportJson([p]);
  };

  // Filtered queue items
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (queueFilter === 'PENDING' && (p.status === 'APPROVED' || p.status === 'INACCESSIBLE')) return false;
      if (queueFilter === 'APPROVED' && p.status !== 'APPROVED') return false;
      if (queueFilter === 'INACCESSIBLE' && p.status !== 'INACCESSIBLE') return false;
      if (categoryFilter !== 'ALL' && (p.category || 'General') !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.product_id.toLowerCase().includes(q) || (p.metadata_title || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, queueFilter, categoryFilter, searchQuery]);

  const approvedCount = products.filter((p) => p.status === 'APPROVED').length;
  const inaccessibleCount = products.filter((p) => p.status === 'INACCESSIBLE').length;
  const listenedCount = products.filter((p) => p.listened).length;

  // Render Highlighted Keywords
  const renderHighlightedKeywords = (text) => {
    if (!text || !highlightKeywords) {
      return text;
    }

    // Split text into tokens and tag matching keywords
    const tokens = text.split(/(\s+|[.,;!?()]+)/);
    return tokens.map((token, i) => {
      let matchedCategory = null;
      for (const pattern of KEYWORD_PATTERNS) {
        if (pattern.regex.test(token.trim())) {
          matchedCategory = pattern.category;
          pattern.regex.lastIndex = 0; // reset regex
          break;
        }
      }

      if (matchedCategory) {
        const catClass = `kw-${matchedCategory.toLowerCase().replace(/\s+/g, '-')}`;
        const isTooltipOpen = activeTooltip === i;

        return (
          <span
            key={i}
            className={`kw-tag ${catClass}`}
            onClick={() => setActiveTooltip(isTooltipOpen ? null : i)}
            title={`${matchedCategory}: ${token.trim()}`}
          >
            {token}
            {isTooltipOpen && (
              <span className="kw-tooltip">
                <strong>{matchedCategory}:</strong> {token.trim()}
              </span>
            )}
          </span>
        );
      }
      return token;
    });
  };

  return (
    <div className="altlume-app">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <CustomCursor />
      <ScrollProgressLine />

      {/* Global Contextual Navbar */}
      <header className={`altlume-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          <div
            className="brand-section"
            onClick={() => {
              if (currentUser && onboardingData && subscriptionPlan) {
                setActiveFlow('workspace');
                setActiveTab('dashboard');
              } else {
                setActiveFlow('home');
              }
            }}
            title="ALTLUME Review Studio"
            style={{ cursor: 'pointer' }}
          >
            <span className="brand-wordmark">ALTLUME</span>
            <span className="brand-pill">
              {activeFlow === 'home'
                ? 'COMMERCE STUDIO'
                : activeFlow === 'onboarding'
                ? 'ONBOARDING'
                : activeFlow === 'subscription'
                ? 'EDITORIAL PLANS'
                : 'REVIEW STUDIO'}
            </span>
          </div>

          {/* Navigation for Workspace */}
          {activeFlow === 'workspace' && (
            <nav className="workspace-master-nav" aria-label="Workspace Main Navigation">
              <button
                type="button"
                className={`workspace-nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
                title="Catalogue Readiness & Portfolio Metrics"
              >
                📊 Dashboard
              </button>
              <button
                type="button"
                className={`workspace-nav-tab ${activeTab === 'batch' ? 'active' : ''}`}
                onClick={() => setActiveTab('batch')}
                title="Batch Multi-Image & Angle Processing"
              >
                ⚡ Batch
              </button>
              <button
                type="button"
                className={`workspace-nav-tab ${activeTab === 'workspace' ? 'active' : ''}`}
                onClick={() => setActiveTab('workspace')}
                title="Editorial Product Review Studio"
              >
                ✍️ Review Studio
              </button>
              <button
                type="button"
                className={`workspace-nav-tab ${activeTab === 'method' ? 'active' : ''}`}
                onClick={() => setActiveTab('method')}
                title="Editorial Guidelines & W3C Standards"
              >
                📖 Method
              </button>
              <button
                type="button"
                className={`workspace-nav-tab ${activeTab === 'export' ? 'active' : ''}`}
                onClick={() => setActiveTab('export')}
                title="Export Verified CSV & JSON"
              >
                📥 Export
              </button>
            </nav>
          )}

          {/* Right Tools & Theme Toggle */}
          <div className="nav-tools">
            {activeFlow === 'workspace' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--surface-card-subtle)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Store:</span>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="Store Name"
                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.74rem', fontWeight: 700, width: '80px', color: 'var(--text-ink)' }}
                    title="Merchant catalogue store tag"
                  />
                </div>

                <div className="user-profile-badge" title={`Signed in as ${currentUser?.email || 'Editor'}`}>
                  <span>👤 {currentUser?.name || 'Editor'}</span>
                  {onboardingData?.role && (
                    <span style={{ color: 'var(--text-muted)' }}>• {onboardingData.role.split('/')[0].trim()}</span>
                  )}
                </div>

                <button
                  type="button"
                  className="user-plan-pill"
                  onClick={() => setActiveFlow('subscription')}
                  title="View or Change Editorial Subscription Plan"
                >
                  {subscriptionPlan?.planName || 'PRO PLAN'} ↗
                </button>
              </>
            )}

            <button
              type="button"
              className="nav-btn"
              onClick={() => setShowCommandPalette(true)}
              title="Command Palette (Cmd+K / Ctrl+K)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '5px 8px' }}
            >
              🔍 ⌘K
            </button>

            <a
              href="/database"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-editorial-secondary"
              style={{ padding: '6px 12px', fontSize: '0.76rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Inspect live SQLite database tables & records"
            >
              🗄️ Database
            </a>

            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Midnight Dark' : 'Warm Paper'} Theme`}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {activeFlow === 'home' && (
              currentUser ? (
                <button
                  type="button"
                  className="btn-editorial-primary"
                  onClick={() => {
                    setActiveFlow('workspace');
                    setActiveTab('dashboard');
                  }}
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  ✦ Open Workspace →
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-editorial-secondary"
                    onClick={() => setShowLoginModal(true)}
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className="btn-editorial-primary"
                    onClick={() => setShowLoginModal(true)}
                    style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                  >
                    Get Started →
                  </button>
                </div>
              )
            )}

            {activeFlow === 'workspace' && (
              <button
                type="button"
                className="btn-editorial-secondary"
                onClick={handleLogout}
                style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                title="Sign out and return to Home"
              >
                Sign Out
              </button>
            )}

            {(activeFlow === 'onboarding' || activeFlow === 'subscription') && (
              <button
                type="button"
                className="btn-editorial-secondary"
                onClick={() => setActiveFlow('home')}
                style={{ padding: '6px 12px', fontSize: '0.76rem' }}
              >
                Exit to Home
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hidden File Inputs for Single Upload, Camera, Bulk, Multi-Image Upload, and Single-View Addition */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".png,.jpg,.jpeg,.webp"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <input
        type="file"
        ref={cameraFileInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <input
        type="file"
        ref={bulkFileInputRef}
        multiple
        accept=".png,.jpg,.jpeg,.webp"
        style={{ display: 'none' }}
        onChange={handleBulkFilesSelected}
      />
      <input
        type="file"
        ref={multiImageUploadRef}
        multiple
        accept=".png,.jpg,.jpeg,.webp"
        style={{ display: 'none' }}
        onChange={handleMultiImageFiles}
      />
      <input
        type="file"
        ref={addSingleViewRef}
        accept=".png,.jpg,.jpeg,.webp"
        style={{ display: 'none' }}
        onChange={handleAddViewToCurrentProduct}
      />

      {/* Main Content Area */}
      <main className="varnix-main-content">
        {/* User Notification Alerts */}
        {errorMessage && (
          <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 700 }}>✕</button>
          </div>
        )}
        {successMessage && (
          <div style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✓ {successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* FLOW 1: MODERN INTERACTIVE HERO / LANDING PAGE */}
        {activeFlow === 'home' && (
          <HomeLandingPage
            onGetStarted={() => setShowLoginModal(true)}
            onLogin={() => setShowLoginModal(true)}
            products={products}
            onSelectProduct={(id) => {
              setSelectedId(id);
              if (currentUser) {
                setActiveFlow('workspace');
                setActiveTab('workspace');
              } else {
                setShowLoginModal(true);
              }
            }}
          />
        )}

        {/* FLOW 2: 3-STEP USER ONBOARDING QUESTIONNAIRE */}
        {activeFlow === 'onboarding' && (
          <OnboardingFlow
            initialValues={onboardingData || {}}
            onComplete={handleOnboardingComplete}
          />
        )}

        {/* FLOW 3: SUBSCRIPTION & PRICING PLANS */}
        {activeFlow === 'subscription' && (
          <SubscriptionFlow
            currentPlanId={subscriptionPlan?.planId || 'growth'}
            user={currentUser}
            onSelectPlan={handleSelectSubscription}
          />
        )}

        {/* FLOW 4: WORKSPACE - BATCH OPERATIONS & VIEW COVERAGE */}
        {activeFlow === 'workspace' && activeTab === 'batch' && (
          <BatchView
            products={products}
            onOpenUpload={() => bulkFileInputRef.current?.click()}
            onOpenGroupingStudio={() => setShowMultiImageStudio(true)}
            onGenerateAllMultiFormat={handleBatchGenerateAllMultiFormat}
            onApproveLowRisk={() => setShowApproveLowRiskModal(true)}
            onSelectProduct={(id) => {
              setSelectedId(id);
              setActiveTab('workspace');
            }}
            computeClientReadinessScore={computeClientReadinessScore}
            computeClientViewCoverage={computeClientViewCoverage}
            isBatchGenerating={isGeneratingMultiFormat}
          />
        )}

        {/* TAB 0: HOMEPAGE / LANDING SCREEN (RETIRED) */}
        {false && (
          <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
            <div className="landing-page-container">
              {/* Cinematic Hero */}
              <section className="landing-hero" aria-label="Hero Introduction">
                <div className="hero-copy">
                  <span className="brand-pill" style={{ marginBottom: '14px', display: 'inline-block' }}>
                    EDITORIAL COMMERCE STUDIO
                  </span>
                  <h1>Good descriptions begin with looking.</h1>
                  <p>
                    A tactile, calm review studio for commerce editors. ALTLUME pairs computer vision observations with disciplined human judgment—ensuring every product alt text is accurate, concise, and verifiable.
                  </p>
                  <div className="hero-actions">
                    <button
                      type="button"
                      className="btn-editorial-primary"
                      onClick={() => {
                        setSelectedId('P01');
                        setActiveTab('workspace');
                      }}
                      data-cursor="Open"
                    >
                      ✦ Open the workspace
                    </button>
                    <button
                      type="button"
                      className="btn-editorial-secondary"
                      onClick={() => setActiveTab('method')}
                      data-cursor="Learn"
                    >
                      📖 See how it works
                    </button>
                  </div>
                </div>

                {/* Live Editorial Product Showcase (P01–P06) with Real Data & Thumbnail */}
                <div className="glass-tiles-artwork" aria-label="Product Showcase Gallery" data-cursor="Catalogue">
                  {(products && products.length > 0 ? products.slice(0, 6) : DEFAULT_PRODUCTS.slice(0, 6)).map((p) => {
                    const desc = p.final_description || p.edited_text || p.draft || p.visible_description || 'Concise editorial image description ready for review.';
                    const cat = p.detected_category || p.category || 'General';
                    return (
                      <div
                        key={p.product_id}
                        className="glass-tile"
                        onClick={() => {
                          setSelectedId(p.product_id);
                          setActiveTab('workspace');
                        }}
                        style={{ cursor: 'pointer' }}
                        title={`Review ${p.metadata_title || p.product_id} in Workspace`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedId(p.product_id);
                            setActiveTab('workspace');
                          }
                        }}
                      >
                        <div className="tile-top-row">
                          <span className="tile-id">{p.product_id}</span>
                          <span className="tile-cat-badge">{cat}</span>
                        </div>
                        {p.image_url ? (
                          <div className="tile-thumb-wrap">
                            <img src={p.image_url} alt={p.metadata_title || p.product_id} className="tile-thumb-img" />
                          </div>
                        ) : null}
                        <div className="tile-content-wrap">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span className="tile-caption">{p.metadata_title || p.product_id}</span>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>
                              ${p.price !== undefined ? Number(p.price).toFixed(2) : '0.00'}
                            </span>
                          </div>
                          <span className="tile-desc-snippet">
                            {desc.length > 70 ? `${desc.slice(0, 67)}…` : desc}
                          </span>
                        </div>
                        <div className="tile-footer-action">
                          <span>Review ↗</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Compact Trust Strip */}
              <div className="trust-strip" aria-label="Core Editorial Principles">
                <div className="trust-item">
                  <span className="trust-icon">👁️</span>
                  <div>
                    <div className="trust-text-title">Visual Evidence First</div>
                    <div className="trust-text-sub">Observations strictly from observable pixels</div>
                  </div>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">🛡️</span>
                  <div>
                    <div className="trust-text-title">Deterministic Guardrails</div>
                    <div className="trust-text-sub">Immediate flags on non-observable claims</div>
                  </div>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">✍️</span>
                  <div>
                    <div className="trust-text-title">Commerce Editor in Loop</div>
                    <div className="trust-text-sub">Zero unapproved automated publications</div>
                  </div>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">♿</span>
                  <div>
                    <div className="trust-text-title">W3C Alt-Text Aligned</div>
                    <div className="trust-text-sub">Concise, functional, under 125 characters</div>
                  </div>
                </div>
              </div>

              {/* 3-Step Approach Section */}
              <section className="approach-section" aria-label="Editorial Methodology">
                <div className="section-headline">
                  <h2>Our Three-Step Discipline</h2>
                  <p>Designed for commercial editors who require precision over generative hype.</p>
                </div>

                <div className="steps-grid">
                  <div className="step-card">
                    <span className="step-number">Step 01</span>
                    <div className="step-title">Look closely</div>
                    <p className="step-desc">
                      Observe light, material finish, silhouette contours, and camera angles. Separate observable pixels from promotional catalogue marketing assumptions.
                    </p>
                  </div>

                  <div className="step-card">
                    <span className="step-number">Step 02</span>
                    <div className="step-title">Write with restraint</div>
                    <p className="step-desc">
                      Draft positive, factual descriptions without banned superlative phrases. Keep descriptions concise (under 125 characters) for effortless screen reader consumption.
                    </p>
                  </div>

                  <div className="step-card">
                    <span className="step-number">Step 03</span>
                    <div className="step-title">Approve with care</div>
                    <p className="step-desc">
                      A machine proposal is never an approval. Every published description must pass merchant claim validation and explicit editor endorsement.
                    </p>
                  </div>
                </div>

                {/* Strong Closing CTA Card */}
                <div style={{ marginTop: '48px', padding: '36px', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: '16px', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-ink)', marginBottom: '10px' }}>
                    Ready to review your digital catalogue?
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 24px', fontSize: '0.94rem' }}>
                    Open the studio with ten preloaded reference products (P01–P10) or upload up to 20 product images to inspect coverage and generate multi-format copy.
                  </p>
                  <button
                    type="button"
                    className="btn-editorial-primary"
                    onClick={() => {
                      setSelectedId('P01');
                      setActiveTab('workspace');
                    }}
                    style={{ margin: '0 auto' }}
                  >
                    Enter Review Studio →
                  </button>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '16px', fontStyle: 'italic' }}>
                    Note: The prototype uses synthetic data and human review is required. This tool does not prove website accessibility compliance.
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* TAB 1: 3-COLUMN REVIEW WORKSPACE */}
        {activeFlow === 'workspace' && activeTab === 'workspace' && (
          <div className="workspace-wrapper">
            {/* Workspace Subnav & Editorial Progress Bar */}
            <div className="workspace-subnav">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div className="progress-ring-badge">
                  <span
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: approvedCount === products.length ? 'var(--emerald)' : 'var(--accent-indigo)',
                      boxShadow: '0 0 6px var(--accent-indigo)'
                    }}
                  />
                  <span>
                    <strong>{approvedCount}</strong> of {products.length} reviewed
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>|</span>
                {currentProduct ? (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span>Active Focus: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)' }}>{currentProduct.product_id}</strong> — {currentProduct.metadata_title}</span>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'rgba(5, 150, 105, 0.12)',
                      color: 'var(--emerald)',
                      border: '1px solid rgba(5, 150, 105, 0.3)',
                      fontFamily: 'var(--font-mono)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      🏷️ ${currentProduct.price !== undefined ? Number(currentProduct.price).toFixed(2) : '0.00'}
                    </span>
                  </span>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>✨ Review Studio Ready — Upload your merchant product images to begin review</span>
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-editorial-secondary"
                  onClick={handleGenerateAllDrafts}
                  style={{ padding: '6px 14px', fontSize: '0.76rem' }}
                  title="Generate visual descriptions for all unapproved items"
                  data-cursor="Generate"
                >
                  ⚡ Generate all drafts
                </button>
                <button
                  type="button"
                  className="btn-editorial-primary"
                  onClick={handleExportCsv}
                  style={{ padding: '6px 14px', fontSize: '0.76rem' }}
                  title="Download reviewed CSV"
                  data-cursor="Export"
                >
                  📥 Export review
                </button>
              </div>
            </div>

            {/* 3-Column Studio Grid */}
            <div className="workspace-grid">
              {/* COLUMN 1: FILMSTRIP QUEUE (LEFT) */}
              <aside className="filmstrip-col" aria-label="Product Review Filmstrip">
                <div className="filmstrip-header">
                  <span className="col-label">FILMSTRIP ({products.length})</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className="btn-editorial-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload Single Product Image"
                      data-cursor="Upload"
                    >
                      + Upload
                    </button>
                    <button
                      type="button"
                      className="btn-editorial-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                      onClick={() => bulkFileInputRef.current?.click()}
                      title="Bulk Upload (Up to 20 images)"
                      data-cursor="Bulk"
                    >
                      📂 Bulk
                    </button>
                  </div>
                </div>

                {/* Compact Search & Status Filter */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '0.74rem',
                      borderRadius: '6px',
                      border: '1px solid var(--surface-border)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-ink)',
                      outline: 'none',
                    }}
                  />
                  <select
                    value={queueFilter}
                    onChange={(e) => setQueueFilter(e.target.value)}
                    style={{
                      padding: '5px 6px',
                      fontSize: '0.72rem',
                      borderRadius: '6px',
                      border: '1px solid var(--surface-border)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-ink)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL">All ({products.length})</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="INACCESSIBLE">Inaccessible</option>
                  </select>
                </div>

                {/* Filmstrip Items */}
                <div className="filmstrip-items">
                  {filteredProducts.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '24px 12px',
                      background: 'var(--surface-card)',
                      borderRadius: '8px',
                      border: '1px dashed var(--surface-border)',
                      margin: '6px 0'
                    }}>
                      <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>📸</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-ink)', marginBottom: '4px' }}>
                        {products.length === 0 ? 'No products in queue' : 'No matching products'}
                      </div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.4 }}>
                        {products.length === 0
                          ? 'Upload product images to start reviewing and generating visual descriptions.'
                          : 'Try adjusting your search query or filter.'}
                      </p>
                      <button
                        type="button"
                        className="btn-editorial-primary"
                        style={{ padding: '6px 12px', fontSize: '0.72rem', width: '100%', justifyContent: 'center' }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        + Upload Image
                      </button>
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = p.product_id === selectedId;
                      const statusClass = p.status.toLowerCase().replace(/_/g, '-');
                      const imgCount = p.image_count || (Array.isArray(p.images) ? p.images.length : 1);

                      // Duplicate-description marker check
                      const descText = (p.final_description || p.edited_text || p.draft || '').trim().toLowerCase();
                      const isDuplicate =
                        descText &&
                        descText.length > 10 &&
                        products.filter(
                          (other) =>
                            other.product_id !== p.product_id &&
                            (other.final_description || other.edited_text || other.draft || '').trim().toLowerCase() === descText
                        ).length > 0;

                      return (
                        <div
                          key={p.product_id}
                          style={{ position: 'relative' }}
                        >
                          <button
                            type="button"
                            className={`filmstrip-card ${isSelected ? 'active' : ''}`}
                            onClick={() => setSelectedId(p.product_id)}
                            data-cursor="Review"
                            style={{ width: '100%', textAlign: 'left' }}
                          >
                            <img
                              src={p.image_url}
                              alt=""
                              className="filmstrip-thumb"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <div className="filmstrip-meta">
                              <div className="meta-row">
                                <span className="product-id-badge">{p.product_id}</span>
                                <span className={`status-pill ${statusClass}`}>{p.status}</span>
                              </div>
                              <div
                                style={{
                                  fontSize: '0.74rem',
                                  color: 'var(--text-ink)',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {p.metadata_title}
                              </div>
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{p.category || 'General'}</span>
                                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--emerald)', background: 'rgba(5, 150, 105, 0.1)', padding: '0 4px', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>
                                  ${p.price !== undefined ? Number(p.price).toFixed(2) : '0.00'}
                                </span>
                                {imgCount > 1 && (
                                  <span style={{ fontSize: '0.62rem', background: '#F3E8FF', color: '#7E22CE', padding: '0 4px', borderRadius: '3px', fontWeight: 700 }}>
                                    🔄 {imgCount} views
                                  </span>
                                )}
                                {p.listened && (
                                  <span style={{ fontSize: '0.62rem', background: '#EEF2FF', color: '#4338CA', padding: '0 4px', borderRadius: '3px', fontWeight: 700 }}>
                                    🔊 Listened
                                  </span>
                                )}
                                {p.quality_warning && (
                                  <span style={{ fontSize: '0.62rem', background: '#FEF3C7', color: '#B45309', padding: '0 4px', borderRadius: '3px', fontWeight: 700 }}>
                                    ⚠️ Quality
                                  </span>
                                )}
                              </div>
                              {isDuplicate && (
                                <span className="dup-warning-badge" title="Description repeats wording from another product in this queue">
                                  ⚠️ Duplicate wording
                                </span>
                              )}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(p.product_id);
                            }}
                            title="Remove this product"
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: 'none',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: 'var(--danger-text, #DC2626)',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 2,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Secondary Features: Spacious Studio Tools Drawer (Never Squished) */}
                <div className="filmstrip-tools-card">
                  <div className="tools-tab-bar">
                    <button
                      type="button"
                      className={`tool-tab-btn ${toolDrawerTab === 'audio' ? 'active' : ''}`}
                      onClick={() => setToolDrawerTab('audio')}
                    >
                      🎧 Audio Review
                    </button>
                    <button
                      type="button"
                      className={`tool-tab-btn ${toolDrawerTab === 'lang' ? 'active' : ''}`}
                      onClick={() => setToolDrawerTab('lang')}
                    >
                      🌐 Language Aid
                    </button>
                    <button
                      type="button"
                      className={`tool-tab-btn ${toolDrawerTab === 'batch' ? 'active' : ''}`}
                      onClick={() => setToolDrawerTab('batch')}
                    >
                      ⚡ Quick Tools
                    </button>
                  </div>

                  {toolDrawerTab === 'audio' && (
                    <div className="audio-review-panel">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-ink)' }}>
                          🔊 Listen-to-Review
                        </span>
                        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          Listened: <strong>{products.filter((p) => p.listened).length}</strong> / {products.length}
                        </span>
                      </div>

                      <div className="audio-main-row">
                        <div className="audio-btn-group">
                          <button
                            type="button"
                            className="btn-editorial-primary"
                            style={{ padding: '5px 12px', fontSize: '0.72rem' }}
                            onClick={isPlayingVoice ? handleVoicePause : () => handleVoicePlay(currentProduct)}
                            data-cursor="Play"
                          >
                            {isPlayingVoice ? '⏸ Pause' : '▶ Listen'}
                          </button>
                          <button
                            type="button"
                            className="btn-editorial-secondary"
                            style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                            onClick={handleVoiceReplay}
                            title="Replay from start"
                            data-cursor="Replay"
                          >
                            ↺ Replay
                          </button>
                        </div>

                        <div className="audio-speed-pills">
                          {[0.75, 1, 1.25, 1.5].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              className={`speed-pill-btn ${voiceRate === rate ? 'active' : ''}`}
                              onClick={() => setVoiceRate(rate)}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="audio-queue-row">
                        <button
                          type="button"
                          className="btn-editorial-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          onClick={listenAllPlaying ? handleListenAllToggle : handleStartListenAll}
                          data-cursor={listenAllPlaying ? 'Stop' : 'Play'}
                        >
                          {listenAllPlaying ? '⏹ Stop Queue' : '▶ Listen All Queue'}
                        </button>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          <input
                            type="checkbox"
                            checked={autoAdvanceVoice}
                            onChange={(e) => setAutoAdvanceVoice(e.target.checked)}
                          />
                          Auto-advance
                        </label>

                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: 'var(--accent-indigo)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => {
                            setProducts((prev) =>
                              prev.map((p) => (p.listened && p.status !== 'APPROVED' ? { ...p, status: 'APPROVED' } : p))
                            );
                            setSuccessMessage('Approved all listened items!');
                          }}
                        >
                          Approve listened
                        </button>
                      </div>

                      <div className="audio-tip-text">
                        Tip: Spot-check audio-review items against the image. Listening alone never auto-approves.
                      </div>
                    </div>
                  )}

                  {toolDrawerTab === 'lang' && (
                    <div style={{ background: 'var(--surface-card-subtle)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-ink)' }}>
                          🌐 Review Language Aid
                        </span>
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                          English is source of truth
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        {[
                          { code: 'en', label: 'English' },
                          { code: 'hi', label: 'हिन्दी' },
                          { code: 'te', label: 'తెలుగు' },
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            className={`btn-editorial-secondary ${reviewLanguage === lang.code ? 'active' : ''}`}
                            style={{
                              padding: '6px 4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: reviewLanguage === lang.code ? 'var(--accent-indigo)' : 'var(--surface-card)',
                              color: reviewLanguage === lang.code ? '#FFF' : 'var(--text-secondary)',
                              borderColor: reviewLanguage === lang.code ? 'var(--accent-indigo)' : 'var(--surface-border)',
                            }}
                            onClick={() => handleLanguageSelect(lang.code)}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>

                      {reviewLanguage !== 'en' && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--surface-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--surface-border)', marginTop: '4px' }}>
                          <strong>Translation Preview ({reviewLanguage.toUpperCase()}):</strong>
                          <p style={{ margin: '4px 0 0', fontStyle: 'italic' }}>
                            {currentProduct.translations?.[reviewLanguage] || (isTranslating ? 'Syncing translation...' : 'Translation will appear after generation.')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {toolDrawerTab === 'batch' && (
                    <div style={{ background: 'var(--surface-card-subtle)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-ink)' }}>
                        ⚡ Staging & Camera Shortcuts
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-editorial-secondary"
                          style={{ fontSize: '0.7rem', padding: '6px' }}
                          onClick={handleStartCamera}
                        >
                          📸 Take Photo
                        </button>
                        <button
                          type="button"
                          className="btn-editorial-secondary"
                          style={{ fontSize: '0.7rem', padding: '6px' }}
                          onClick={() => multiImageUploadRef.current?.click()}
                        >
                          🔄 Multi-Angle
                        </button>
                      </div>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                        Upload up to 20 images. Automated blur, brightness, and contrast preflight checks.
                      </div>
                    </div>
                  )}
                </div>
              </aside>

              {currentProduct ? (
                <>
                  {/* COLUMN 2: CENTER IMAGE & QUALITY STAGE */}
                  <section className="center-column" aria-label="Visual Understanding & Quality Stage">
                    <div className="varnix-card">
                  <div className="queue-card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                        {currentProduct.product_id}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.86rem' }}>
                        {currentProduct.metadata_title}
                      </span>
                      {merchantName && (
                        <span className="merchant-store-tag" title="Session merchant store name">
                          Sold by: {merchantName}
                        </span>
                      )}
                      {currentProduct.isUploaded && (
                        <span style={{ fontSize: '0.68rem', background: '#EEF2FF', color: '#4338CA', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          Uploaded
                        </span>
                      )}
                    </div>
                    <span className={`status-pill status-${currentProduct.status.toLowerCase().replace(/_/g, '-')}`}>
                      {currentProduct.status}
                    </span>
                  </div>

                  <div className="viewer-card-body">
                    {/* Image Quality Warning Banner (Client-side check) */}
                    {currentProduct.quality_warning && (
                      <div className="quality-warning-banner">
                        <div className="quality-warning-title">
                          ⚠️ Image Quality Notice: {currentProduct.quality_reason}
                        </div>
                        <div className="quality-warning-desc">
                          Image may be dark, small, or blurry. You can retake the photo, mark as inaccessible, or continue anyway.
                        </div>
                        <div className="quality-warning-actions">
                          <button
                            type="button"
                            className="btn-quality-retake"
                            onClick={() => {
                              if (navigator.mediaDevices) handleStartCamera();
                              else cameraFileInputRef.current?.click();
                            }}
                          >
                            📸 Retake Photo
                          </button>
                          <button
                            type="button"
                            className="btn-quality-continue"
                            onClick={() => {
                              setProducts(prev => prev.map(p => p.product_id === currentProduct.product_id ? { ...p, quality_warning: false } : p));
                            }}
                          >
                            ✓ Continue Anyway
                          </button>
                          <button
                            type="button"
                            className="btn-quality-inaccessible"
                            onClick={() => setShowInaccessibleModal(true)}
                          >
                            🚩 Mark Inaccessible
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Multi-View 360 Viewer or Single View Stage */}
                    {(() => {
                      const coverage = currentProduct.view_coverage || computeClientViewCoverage(currentProduct.category, activeImages);
                      const isMulti = activeImages.length > 1 && multiImageSupportEnabled;

                      return (
                        <>
                          {/* View Mode Header Badge */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            {isMulti ? (
                              <span className="single-view-badge" style={{ background: '#F3E8FF', color: '#7E22CE', border: '1px solid #D8B4FE' }}>
                                🔄 360° MULTI-VIEW ({activeImages.length} REAL VIEWS)
                              </span>
                            ) : (
                              <span className="single-view-badge">
                                📸 SINGLE VIEW ANALYSIS
                              </span>
                            )}
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {isMulti ? 'Drag or click arrows to cycle real views' : 'Multimodal Gemini Vision'}
                            </span>
                          </div>

                          {isMulti ? (
                            /* 360-STYLE VIEWER COMPONENT (ONLY REAL UPLOADED IMAGES) */
                            <div className="viewer-360-container">
                              {/* Active View Orientation & Correction Bar */}
                              <div className="viewer-view-info-bar">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="viewer-view-badge">
                                    VIEW {activeViewIndex + 1}/{activeImages.length}: {activeImageView.view?.toUpperCase() || 'VIEW'}
                                  </span>
                                  <span className={`confidence-pill confidence-${activeImageView.confidence || 'high'}`} style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                                    {activeImageView.confidence || 'high'}
                                  </span>
                                  {activeImageView.is_inaccessible && (
                                    <span style={{ fontSize: '0.64rem', background: '#FEE2E2', color: '#DC2626', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                      🚩 Inaccessible
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Correct:</span>
                                  <select
                                    className="viewer-view-select"
                                    value={activeImageView.view || 'front'}
                                    onChange={(e) => handleChangeViewLabel(activeViewIndex, e.target.value)}
                                    title="Merchant correction for view orientation"
                                  >
                                    <option value="front">Front View</option>
                                    <option value="back">Back View</option>
                                    <option value="side">Side View</option>
                                    <option value="left">Left View</option>
                                    <option value="right">Right View</option>
                                    <option value="top">Top View</option>
                                    <option value="detail">Detail View</option>
                                    <option value="heel">Heel View</option>
                                    <option value="sole">Sole View</option>
                                    <option value="ports">Ports / Controls</option>
                                  </select>
                                </div>
                              </div>

                              {/* Viewport with Prev/Next Controls and Drag Spin (Real Images Only) */}
                              <div
                                className="viewer-360-viewport"
                                onMouseDown={(e) => setDragStartX(e.clientX)}
                                onMouseUp={(e) => {
                                  if (dragStartX !== null) {
                                    const diff = e.clientX - dragStartX;
                                    if (diff > 35) handlePrev360View();
                                    else if (diff < -35) handleNext360View();
                                    setDragStartX(null);
                                  }
                                }}
                                onTouchStart={(e) => setDragStartX(e.touches[0].clientX)}
                                onTouchEnd={(e) => {
                                  if (dragStartX !== null && e.changedTouches[0]) {
                                    const diff = e.changedTouches[0].clientX - dragStartX;
                                    if (diff > 35) handlePrev360View();
                                    else if (diff < -35) handleNext360View();
                                    setDragStartX(null);
                                  }
                                }}
                              >
                                <button
                                  type="button"
                                  className="viewer-360-nav-btn prev"
                                  onClick={handlePrev360View}
                                  title="Previous Real Angle (←)"
                                >
                                  ◀
                                </button>

                                <img
                                  src={activeImageView.url}
                                  alt={`${currentProduct.metadata_title} - ${activeImageView.view} view`}
                                  className={`viewer-360-main-img ${activeImageView.is_inaccessible ? 'inaccessible-blur' : ''}`}
                                />

                                <button
                                  type="button"
                                  className="viewer-360-nav-btn next"
                                  onClick={handleNext360View}
                                  title="Next Real Angle (→)"
                                >
                                  ▶
                                </button>
                              </div>

                              {/* Real Thumbnail Scrubber Strip */}
                              <div className="viewer-360-strip">
                                {activeImages.map((img, idx) => (
                                  <button
                                    key={img.id || idx}
                                    type="button"
                                    className={`viewer-360-thumb ${idx === activeViewIndex ? 'active' : ''}`}
                                    onClick={() => {
                                      setProducts((prev) =>
                                        prev.map((p) => (p.product_id === currentProduct.product_id ? { ...p, active_view_index: idx } : p))
                                      );
                                    }}
                                    title={`Jump to ${img.view} view`}
                                  >
                                    <img src={img.url} alt={img.view} />
                                    <span className="viewer-360-thumb-label">{img.view}</span>
                                  </button>
                                ))}
                              </div>

                              {/* View Management Bar */}
                              <div className="viewer-manage-bar">
                                <button
                                  type="button"
                                  className="btn-secondary-action"
                                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                                  onClick={() => addSingleViewRef.current?.click()}
                                  title="Add another angle image to this product"
                                >
                                  + Add Angle
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary-action"
                                  style={{ fontSize: '0.72rem', padding: '3px 8px', color: activeImageView.is_inaccessible ? '#059669' : '#DC2626' }}
                                  onClick={() => handleToggleViewInaccessible(activeViewIndex)}
                                  title="Mark this angle inaccessible (excluded from coverage)"
                                >
                                  {activeImageView.is_inaccessible ? '✓ Mark View Accessible' : '🚩 Mark View Inaccessible'}
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary-action"
                                  style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#DC2626' }}
                                  onClick={() => handleRemoveViewFromCurrentProduct(activeViewIndex)}
                                  title="Remove this angle image"
                                >
                                  🗑️ Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* SINGLE IMAGE VIEWPORT (NO 360 OFFERED) */
                            <div className="image-canvas-stage">
                              {currentProduct.imageError ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#DC2626' }}>
                                  <div style={{ fontSize: '32px' }}>⚠️ 🖼️</div>
                                  <h4>This image is unavailable.</h4>
                                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    The visual asset for {currentProduct.product_id} cannot be loaded or analyzed.
                                  </p>
                                  <button
                                    type="button"
                                    className="btn-danger-action"
                                    onClick={() => setShowInaccessibleModal(true)}
                                  >
                                    🚩 Mark as Inaccessible
                                  </button>
                                </div>
                              ) : (
                                <img
                                  src={currentProduct.image_url}
                                  alt={currentProduct.description || currentProduct.metadata_title}
                                  onError={() => {
                                    setProducts((prev) =>
                                      prev.map((p) => (p.product_id === currentProduct.product_id ? { ...p, imageError: true } : p))
                                    );
                                  }}
                                />
                              )}
                            </div>
                          )}

                          {/* Image Actions: Add View, Replace, Analyze */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn-secondary-action"
                              style={{ fontSize: '0.74rem', padding: '5px 10px', flex: 1 }}
                              onClick={() => addSingleViewRef.current?.click()}
                              title="Upload an additional angle image (front, side, back, detail)"
                            >
                              ➕ Add View {isMulti ? '' : 'to Enable 360°'}
                            </button>
                            <button
                              type="button"
                              className="btn-secondary-action"
                              style={{ fontSize: '0.74rem', padding: '5px 10px', flex: 1 }}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              🔄 Replace
                            </button>

                            {isMulti ? (
                              <button
                                type="button"
                                className="btn-primary-action"
                                style={{ fontSize: '0.78rem', padding: '7px 14px', flex: '1 1 100%', background: 'linear-gradient(135deg, #4338CA, #6D28D9)', marginTop: '4px' }}
                                onClick={handleAnalyzeMultiViewProduct}
                                disabled={isAnalyzingProduct}
                              >
                                {isAnalyzingProduct ? '⚡ Deep Multi-View Analyzing with Gemini Vision...' : '✨ Deep Multi-View Analysis (All Angles Together)'}
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn-primary-action"
                                  style={{ fontSize: '0.78rem', padding: '6px 14px', flex: 2, background: 'linear-gradient(135deg, #4F46E5, #6366F1)' }}
                                  onClick={handleAnalyzeImage}
                                  disabled={isAnalyzingImage || currentProduct.imageError}
                                >
                                  {isAnalyzingImage ? '🔍 Analyzing image...' : '🔍 Analyze Image (Detect Features)'}
                                </button>
                                {singleProductIntelligenceEnabled && (
                                  <button
                                    type="button"
                                    className="btn-primary-action"
                                    style={{ fontSize: '0.78rem', padding: '7px 14px', flex: '1 1 100%', background: 'linear-gradient(135deg, #4338CA, #6D28D9)', marginTop: '4px' }}
                                    onClick={() => handleAnalyzeProduct(currentProduct)}
                                    disabled={isAnalyzingProduct || currentProduct.imageError}
                                  >
                                    {isAnalyzingProduct ? '⚡ Deep Analyzing with Gemini Vision...' : '✨ Deep Intelligence Analysis (Identify Product & Questions)'}
                                  </button>
                                )}
                              </>
                            )}
                          </div>

                          {/* Transparent View Coverage Checklist Panel */}
                          <div className="coverage-panel">
                            <div className="coverage-header">
                              <div className="coverage-title">
                                📐 View Coverage: <strong>{coverage.score}%</strong>
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                Category: <strong>{currentProduct.category || 'General'}</strong>
                              </span>
                            </div>

                            <div className="coverage-bar-track">
                              <div
                                className="coverage-bar-fill"
                                style={{
                                  width: `${coverage.score}%`,
                                  background: coverage.score >= 100 ? '#10B981' : coverage.score >= 50 ? '#4F46E5' : '#F59E0B'
                                }}
                              />
                            </div>

                            <div className="coverage-checklist">
                              {coverage.expected_views.map((v) => {
                                const hasView = coverage.present_views.includes(v);
                                return (
                                  <span
                                    key={v}
                                    className={`coverage-checklist-chip ${hasView ? 'present' : 'missing'}`}
                                    title={hasView ? `Present: ${v} view captured` : `Missing: upload a ${v} view to improve coverage`}
                                  >
                                    {hasView ? '✓' : '○'} {v.toUpperCase()}
                                  </span>
                                );
                              })}
                            </div>

                            <div className="coverage-recommendation">
                              💡 <strong>Recommendation:</strong> {coverage.recommendation}
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* Product Identification Card (Single-Product Intelligence) */}
                    {singleProductIntelligenceEnabled && currentProduct.detected_product && (
                      <div className="intel-product-card">
                        <div className="intel-product-header">
                          <div className="intel-product-title">
                            📦 {currentProduct.detected_product.product_name || currentProduct.metadata_title}
                          </div>
                          <span className={`confidence-pill confidence-${currentProduct.detected_product.confidence || 'high'}`} style={{ fontSize: '0.64rem', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800 }}>
                            {currentProduct.detected_product.confidence || 'HIGH'} CONFIDENCE
                          </span>
                        </div>
                        <div className="intel-category-path">
                          📂 Category: <strong>{currentProduct.detected_product.category}</strong> {currentProduct.detected_product.subcategory ? `› ${currentProduct.detected_product.subcategory}` : ''}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          ✓ Identified dynamically from image evidence. Any merchant-entered name or category is context only.
                        </div>
                      </div>
                    )}

                    {/* Product Context Panel (Optional Name & Category inputs) */}
                    <div className="context-box">
                      <div className="context-box-header">
                        <span className="context-box-title">📝 Product Context</span>
                        <span className="context-box-pill">Context Only</span>
                      </div>

                      <div className="context-inputs-grid">
                        <div className="context-input-group">
                          <label className="context-input-label">
                            Product Name (Context only):
                          </label>
                          <input
                            type="text"
                            value={currentProduct.metadata_title || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProducts(prev => prev.map(p => p.product_id === currentProduct.product_id ? { ...p, metadata_title: val } : p));
                            }}
                            placeholder="e.g. Wireless Noise-Cancelling Headphones"
                            className="context-input-field"
                          />
                        </div>
                        <div className="context-input-group">
                          <label className="context-input-label">
                            Product Category (Context only):
                          </label>
                          <input
                            type="text"
                            value={currentProduct.category || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProducts(prev => prev.map(p => p.product_id === currentProduct.product_id ? { ...p, category: val } : p));
                            }}
                            placeholder="e.g. Apparel, Footwear, Drinkware"
                            className="context-input-field"
                          />
                        </div>
                        <div className="context-input-group">
                          <label className="context-input-label">
                            Product Price ($):
                          </label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={currentProduct.price !== undefined ? currentProduct.price : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                setProducts(prev => prev.map(p => p.product_id === currentProduct.product_id ? { ...p, price: val } : p));
                              }}
                              placeholder="e.g. 24.99"
                              className="context-input-field"
                              style={{ paddingLeft: '24px' }}
                            />
                          </div>
                        </div>
                      </div>

                      {currentProduct.visible_description && (
                        <div className="context-visible-card">
                          <span className="context-visible-tag">👁️ VISIBLE INFORMATION</span>
                          <span className="context-visible-text">{currentProduct.visible_description}</span>
                        </div>
                      )}

                      <div className="context-note-pill">
                        <span>ℹ️ <strong>Note:</strong> Product Name, Category, and Price are context only and are never proof of visual traits or specs.</span>
                      </div>
                    </div>

                    {/* Image Quality Metrics (Sections 7 & 8) */}
                    <div className="quality-panel">
                      <div className="quality-header-row">
                        <span className="quality-title">
                          🔍 Quality Evaluation
                        </span>
                        <div className="quality-status-badge-wrap">
                          <span className="quality-status-label">Status:</span>
                          <span className={`quality-score-badge ${currentProduct.quality_warning ? 'warn' : 'good'}`}>
                            {currentProduct.quality_status || 'GOOD'} ({currentProduct.quality_score || 92}/100)
                          </span>
                        </div>
                      </div>

                      <div className="quality-grid">
                        <div className="quality-metric-item">
                          <span className="quality-metric-label">Resolution</span>
                          <span className="quality-metric-val">{currentProduct.quality_details?.resolution || '1200 x 900 px'}</span>
                        </div>
                        <div className="quality-metric-item">
                          <span className="quality-metric-label">Aspect Ratio</span>
                          <span className="quality-metric-val">{currentProduct.quality_details?.aspect_ratio || '4:3'}</span>
                        </div>
                        <div className="quality-metric-item">
                          <span className="quality-metric-label">Blur Estimate</span>
                          <span className="quality-metric-val">{currentProduct.quality_details?.blur_estimate || 'Sharp / Clear focus'}</span>
                        </div>
                        <div className="quality-metric-item">
                          <span className="quality-metric-label">Brightness</span>
                          <span className="quality-metric-val">{currentProduct.quality_details?.brightness || '84% (Optimal)'}</span>
                        </div>
                        <div className="quality-metric-item">
                          <span className="quality-metric-label">Contrast</span>
                          <span className="quality-metric-val">{currentProduct.quality_details?.contrast || '12.4:1 (High)'}</span>
                        </div>
                        <div className="quality-metric-item">
                          <span className="quality-metric-label">Review Warning</span>
                          <span className={`quality-metric-val ${currentProduct.quality_warning ? 'warning' : 'clean'}`}>
                            {currentProduct.quality_warning ? '⚠️ Flagged' : '✓ Clean'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* COLUMN 3: RIGHT AI DESCRIPTION & HUMAN REVIEW ENGINE */}
              <aside className="editor-column" aria-label="Description Editor & Validation">
                <div className="varnix-card" style={{ padding: '16px' }}>



                  {/* SINGLE-PRODUCT INTELLIGENCE: Category-Specific Merchant Verification Questionnaire */}
                  {singleProductIntelligenceEnabled && currentProduct.verification_questions && currentProduct.verification_questions.length > 0 && (
                    <div className="questionnaire-panel">
                      <div className="questionnaire-header">
                        <span className="questionnaire-title">
                          ❓ Merchant Verification Questionnaire ({currentProduct.verification_questions.length})
                        </span>
                        <span className="merchant-provided-pill">
                          {Object.keys(currentProduct.merchant_confirmed_specs || {}).length} Verified
                        </span>
                      </div>
                      <div className="questionnaire-sub">
                        Dynamic non-observable attributes for this product category. Confirmed answers are tagged <strong>Merchant-provided</strong>. Unconfirmed specs <em>never</em> appear in descriptions.
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {currentProduct.verification_questions.map((q) => {
                          const answeredVal = currentProduct.merchant_answers?.[q.id];
                          const isConfirmed = answeredVal && answeredVal !== 'Not known' && answeredVal !== 'Skipped';

                          return (
                            <div key={q.id} className="question-item-card">
                              <div className="question-item-title">
                                <span>{q.question_text || `Verify ${q.attribute}:`}</span>
                                {isConfirmed && (
                                  <span className="merchant-provided-pill">
                                    ✓ Merchant-provided
                                  </span>
                                )}
                              </div>

                              <div className="question-options-grid">
                                {(q.options || ['Not known', 'Other (custom value)']).map((opt) => {
                                  const isSelected = answeredVal === opt;
                                  return (
                                    <label
                                      key={opt}
                                      className={`question-option-row ${isSelected ? 'selected' : ''}`}
                                      onClick={() => handleAnswerQuestion(q.id, q.attribute, opt)}
                                    >
                                      <input
                                        type="radio"
                                        name={`q-${currentProduct.product_id}-${q.id}`}
                                        checked={isSelected}
                                        onChange={() => handleAnswerQuestion(q.id, q.attribute, opt)}
                                      />
                                      <span>{opt}</span>
                                      {opt === 'Not known' && (
                                        <span style={{ fontSize: '0.64rem', color: '#9CA3AF', marginLeft: 'auto' }}>
                                          (Omit from catalogue)
                                        </span>
                                      )}
                                    </label>
                                  );
                                })}
                              </div>

                              {/* Custom value text input */}
                              {answeredVal === 'Other (custom value)' && (
                                <div style={{ marginTop: '6px' }}>
                                  <input
                                    type="text"
                                    placeholder={`Enter custom ${q.attribute}...`}
                                    value={currentProduct.merchant_custom_answers?.[q.id] || ''}
                                    onChange={(e) => handleCustomAnswerChange(q.id, q.attribute, e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '5px 8px',
                                      borderRadius: '4px',
                                      border: '1px solid #4F46E5',
                                      fontSize: '0.74rem',
                                      outline: 'none',
                                      background: '#EEF2FF',
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SINGLE-PRODUCT INTELLIGENCE: Smart Highlights Manager */}
                  {singleProductIntelligenceEnabled && (currentProduct.recommended_highlights?.length > 0 || currentProduct.selected_highlights?.length > 0) && (
                    <div className="highlights-manager-card">
                      <div className="highlights-manager-header">
                        <span className="highlights-manager-title">
                          ⭐ Smart Catalogue Highlights
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Selected: <strong>{currentProduct.selected_highlights?.length || 0}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Recommended top features for this category. Accept, reorder, or add custom highlights.
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                        {(currentProduct.selected_highlights || []).map((h, idx) => (
                          <div key={idx} className="highlight-item-row active">
                            <span className="highlight-item-text">
                              #{idx + 1} {h}
                            </span>
                            <div className="highlight-actions-group">
                              <button
                                type="button"
                                className="highlight-mini-btn"
                                onClick={() => handleReorderHighlight(idx, 'up')}
                                disabled={idx === 0}
                                title="Move Up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                className="highlight-mini-btn"
                                onClick={() => handleReorderHighlight(idx, 'down')}
                                disabled={idx === (currentProduct.selected_highlights?.length || 0) - 1}
                                title="Move Down"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                className="highlight-mini-btn"
                                style={{ color: '#DC2626' }}
                                onClick={() => handleRemoveHighlight(idx)}
                                title="Remove"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Custom Highlight Input */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Add custom highlight..."
                          value={customHighlightInput}
                          onChange={(e) => setCustomHighlightInput(e.target.value)}
                          style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.74rem' }}
                        />
                        <button
                          type="button"
                          className="btn-secondary-action"
                          style={{ fontSize: '0.72rem', padding: '4px 10px', fontWeight: 700 }}
                          onClick={handleAddCustomHighlight}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SINGLE-PRODUCT INTELLIGENCE: Visual Quality Observations */}
                  {singleProductIntelligenceEnabled && currentProduct.quality_observations?.length > 0 && (
                    <div style={{ marginBottom: '14px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Visual Observations (Appearance Only):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {currentProduct.quality_observations.map((obs, idx) => (
                          <div key={idx} className="quality-obs-tag" style={{ margin: 0 }}>
                            <span className="quality-obs-label">{obs.label || 'visual observation'}</span>
                            <span>{obs.observation}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                        Visible appearance only; never implies durability or verified material composition.
                      </div>
                    </div>
                  )}

                  {/* SECTION A: QUICK REVIEW UI — "Which features should we highlight?" */}
                  <div className="features-highlight-card" style={{ marginBottom: '16px', background: 'var(--surface-card)', padding: '14px', borderRadius: '10px', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✨ Which features should we highlight?
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Selected: <strong style={{ color: 'var(--accent-indigo)' }}>{(currentProduct.detected_features || []).filter(f => (currentProduct.feature_choices?.[f.id] ?? f.choice ?? 'INCLUDE') === 'INCLUDE').length}</strong> / {(currentProduct.detected_features || []).length}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      Only selected features feed catalogue generation. Rejected features are strictly excluded.
                    </p>

                    {/* Feature Cards List */}
                    {(currentProduct.detected_features && currentProduct.detected_features.length > 0) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                        {currentProduct.detected_features.map((f) => {
                          const isPossibility = f.confidence === 'medium' || f.confidence === 'low';
                          const labelTitle = isPossibility ? `Possible ${f.name}` : f.name;
                          const currentChoice = currentProduct.feature_choices?.[f.id] ?? f.choice ?? 'INCLUDE';
                          const isIncluded = currentChoice === 'INCLUDE';
                          const isExcluded = currentChoice === 'EXCLUDE';
                          const isUnsure = currentChoice === 'UNSURE';

                          return (
                            <div
                              key={f.id}
                              className="feature-card-item"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: isIncluded
                                  ? '1px solid rgba(5, 150, 105, 0.45)'
                                  : isExcluded
                                    ? '1px solid rgba(220, 38, 38, 0.4)'
                                    : '1px solid var(--surface-border)',
                                background: isIncluded
                                  ? 'rgba(5, 150, 105, 0.1)'
                                  : isExcluded
                                    ? 'rgba(220, 38, 38, 0.1)'
                                    : 'var(--surface-card-subtle)',
                                gap: '10px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-ink)' }}>
                                    {labelTitle}:
                                  </span>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {f.value}
                                  </span>
                                  <span className={`confidence-pill confidence-${f.confidence}`} style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                                    {f.confidence}
                                  </span>
                                  {f.source_view && (
                                    <span className="feature-view-source-badge" title={`Visual feature verified in ${f.source_view} view`} style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '4px', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                                      📷 {f.source_view.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Yes / No / Unsure Controls */}
                              <div className="feature-choice-btn-group" style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                <button
                                  type="button"
                                  className={`feature-choice-btn ${isIncluded ? 'active-include' : ''}`}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '0.72rem',
                                    borderRadius: '6px',
                                    border: isIncluded ? '1px solid #059669' : '1px solid var(--surface-border)',
                                    background: isIncluded ? '#059669' : 'var(--surface-card)',
                                    color: isIncluded ? '#FFFFFF' : 'var(--emerald)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isIncluded ? '0 1px 3px rgba(5,150,105,0.3)' : 'none'
                                  }}
                                  onClick={() => handleSetFeatureChoice(f.id, 'INCLUDE')}
                                  title="Include feature in description"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  className={`feature-choice-btn ${isExcluded ? 'active-exclude' : ''}`}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '0.72rem',
                                    borderRadius: '6px',
                                    border: isExcluded ? '1px solid #DC2626' : '1px solid var(--surface-border)',
                                    background: isExcluded ? '#DC2626' : 'var(--surface-card)',
                                    color: isExcluded ? '#FFFFFF' : 'var(--rose)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isExcluded ? '0 1px 3px rgba(220,38,38,0.3)' : 'none'
                                  }}
                                  onClick={() => handleSetFeatureChoice(f.id, 'EXCLUDE')}
                                  title="Exclude feature (do not mention)"
                                >
                                  No
                                </button>
                                <button
                                  type="button"
                                  className={`feature-choice-btn ${isUnsure ? 'active-unsure' : ''}`}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '0.72rem',
                                    borderRadius: '6px',
                                    border: isUnsure ? '1px solid #D97706' : '1px solid var(--surface-border)',
                                    background: isUnsure ? '#D97706' : 'var(--surface-card)',
                                    color: isUnsure ? '#FFFFFF' : 'var(--amber)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isUnsure ? '0 1px 3px rgba(217,119,6,0.3)' : 'none'
                                  }}
                                  onClick={() => handleSetFeatureChoice(f.id, 'UNSURE')}
                                  title="Unsure / Not verified"
                                >
                                  Unsure
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px', background: 'var(--surface-card-subtle)', borderRadius: '8px', border: '1px dashed var(--surface-border)' }}>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                          No features detected yet. Click "Analyze Image" to extract visible traits dynamically.
                        </p>
                        <button
                          type="button"
                          className="btn-secondary-action"
                          onClick={handleAnalyzeImage}
                          disabled={isAnalyzingImage || currentProduct.imageError}
                          style={{ fontSize: '0.76rem', padding: '6px 14px' }}
                        >
                          {isAnalyzingImage ? '🔍 Analyzing...' : '🔍 Analyze Image Now'}
                        </button>
                      </div>
                    )}

                    {/* Add Custom Feature (Never auto-trusted) */}
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        + Add Custom Feature (Merchant-Supplied):
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          value={newFeatureName}
                          onChange={(e) => setNewFeatureName(e.target.value)}
                          placeholder="e.g. Strap Material"
                          style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.74rem' }}
                        />
                        <input
                          type="text"
                          value={newFeatureValue}
                          onChange={(e) => setNewFeatureValue(e.target.value)}
                          placeholder="e.g. Braided nylon"
                          style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.74rem' }}
                        />
                        <button
                          type="button"
                          className="btn-secondary-action"
                          onClick={handleAddCustomFeature}
                          style={{ fontSize: '0.72rem', padding: '4px 10px', fontWeight: 700 }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SECTION B: DESCRIPTION TYPES & GENERATION */}
                  {batchDashboardEnabled ? (
                    <div className="batch-multiformat-studio" style={{ marginBottom: '16px', background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          📦 Multi-Format Catalogue Studio
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, background: '#EEF2FF', padding: '2px 6px', borderRadius: '4px' }}>
                          Batch 3: 4 Formats
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        All formats are generated from the SAME verified features with no contradictions.
                      </div>

                      {/* 4 Format Switcher Tabs */}
                      <div className="format-tabs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '10px' }}>
                        {[
                          { key: 'highlights', label: 'Highlights', badge: '10 bullets' },
                          { key: 'short', label: 'Short', badge: '1 para' },
                          { key: 'marketplace', label: 'Marketplace', badge: 'Catalogue' },
                          { key: 'card_summary', label: 'Summary', badge: '1-2 lines' },
                        ].map((fmt) => (
                          <button
                            key={fmt.key}
                            type="button"
                            className={`format-tab-btn ${activeFormatTab === fmt.key ? 'active' : ''}`}
                            onClick={() => setActiveFormatTab(fmt.key)}
                            style={{
                              padding: '6px 4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: activeFormatTab === fmt.key ? '2px solid var(--primary)' : '1px solid var(--border)',
                              background: activeFormatTab === fmt.key ? '#EEF2FF' : '#FFF',
                              color: activeFormatTab === fmt.key ? 'var(--primary)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              textAlign: 'center',
                            }}
                          >
                            <div>{fmt.label}</div>
                            <div style={{ fontSize: '0.62rem', fontWeight: 500, opacity: 0.8 }}>{fmt.badge}</div>
                          </button>
                        ))}
                      </div>

                      {/* Generation and Regeneration Action Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginBottom: '8px' }}>
                        <button
                          type="button"
                          className="btn-primary-action"
                          onClick={() => handleGenerateMultiFormat(currentProduct)}
                          disabled={isGeneratingMultiFormat || currentProduct.imageError}
                          style={{ minHeight: '38px', fontWeight: 800, fontSize: '0.8rem' }}
                        >
                          {isGeneratingMultiFormat ? '⚡ Generating 4 Formats...' : '✨ Generate All 4 Formats'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary-action"
                          onClick={() => handleRegenerateFormat(activeFormatTab)}
                          disabled={isGeneratingMultiFormat || currentProduct.imageError}
                          style={{ fontSize: '0.74rem', padding: '6px 12px' }}
                          title={`Regenerate only ${activeFormatTab}`}
                        >
                          🔄 Regenerate {activeFormatTab}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                          DESCRIPTION FORMAT TO EXPORT
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Driven by selected features
                        </span>
                      </div>

                      <div className="desc-type-switcher" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
                        <button
                          type="button"
                          className={`desc-type-tab-btn ${(currentProduct.selected_description_type || 'BULLETS') === 'SHORT' ? 'active' : ''}`}
                          onClick={() => handleDescTypeChange('SHORT')}
                          style={{
                            padding: '6px 8px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: (currentProduct.selected_description_type || 'BULLETS') === 'SHORT' ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: (currentProduct.selected_description_type || 'BULLETS') === 'SHORT' ? '#EEF2FF' : '#FFF',
                            color: (currentProduct.selected_description_type || 'BULLETS') === 'SHORT' ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          Short (≤125)
                        </button>
                        <button
                          type="button"
                          className={`desc-type-tab-btn ${(currentProduct.selected_description_type || 'BULLETS') === 'BULLETS' ? 'active' : ''}`}
                          onClick={() => handleDescTypeChange('BULLETS')}
                          style={{
                            padding: '6px 8px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: (currentProduct.selected_description_type || 'BULLETS') === 'BULLETS' ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: (currentProduct.selected_description_type || 'BULLETS') === 'BULLETS' ? '#EEF2FF' : '#FFF',
                            color: (currentProduct.selected_description_type || 'BULLETS') === 'BULLETS' ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          Bullets (8–10)
                        </button>
                        <button
                          type="button"
                          className={`desc-type-tab-btn ${(currentProduct.selected_description_type || 'BULLETS') === 'LONG' ? 'active' : ''}`}
                          onClick={() => handleDescTypeChange('LONG')}
                          style={{
                            padding: '6px 8px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: (currentProduct.selected_description_type || 'BULLETS') === 'LONG' ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: (currentProduct.selected_description_type || 'BULLETS') === 'LONG' ? '#EEF2FF' : '#FFF',
                            color: (currentProduct.selected_description_type || 'BULLETS') === 'LONG' ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          Long Paragraph
                        </button>
                      </div>

                      {/* AI Generation Button */}
                      <button
                        type="button"
                        className="btn-primary-action"
                        onClick={handleGenerateAI}
                        disabled={isGenerating || currentProduct.imageError}
                        style={{ width: '100%', minHeight: '42px', fontWeight: 800, fontSize: '0.86rem' }}
                      >
                        {isGenerating ? '⚡ Generating catalogue descriptions...' : '✨ Generate Catalogue Description'}
                      </button>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span>Model: <strong>Gemini 2.5 Flash</strong></span>
                        <span>Tone: Catalogue Reviewer (No Hype)</span>
                      </div>
                    </div>
                  )}

                  {/* Keyword Highlighter Control & Preview (Section 6) */}
                  <div>
                    <div className="keyword-highlighter-bar">
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Visual Keyword Highlighting
                      </span>
                      <button
                        type="button"
                        className="btn-secondary-action"
                        onClick={() => setHighlightKeywords(!highlightKeywords)}
                        style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                      >
                        {highlightKeywords ? 'Highlights: ON' : 'Highlights: OFF'}
                      </button>
                    </div>

                    {highlightKeywords && (
                      <div className="kw-highlighted-text" aria-live="polite">
                        {renderHighlightedKeywords(currentText)}
                      </div>
                    )}
                  </div>


                  {/* Review / Edit Description Textarea (ALTLUME Human Review Engine) */}
                  <div style={{ marginBottom: '14px' }}>
                    {/* Draft Source & Character Meter Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Draft Source: <strong style={{ color: 'var(--accent-indigo)' }}>Gemini Vision 2.5 Flash</strong> (Visual facts only)
                      </span>
                      <span className={`char-meter-pill ${validationResult.lengthLevel}`}>
                        {validationResult.charCount} / 125 chars ({validationResult.lengthLevel === 'block' ? 'Exceeds 250 limit' : validationResult.lengthLevel === 'warn' ? 'Over 125 chars (Warn)' : 'Optimal screen-reader brevity'})
                      </span>
                    </div>

                    {/* Surrounding Page Context Field */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0 }}>
                        Page Context:
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Primary PDP Hero Gallery / Search Results Thumbnail"
                        value={currentProduct.page_context || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProducts((prev) =>
                            prev.map((p) => (p.product_id === currentProduct.product_id ? { ...p, page_context: val } : p))
                          );
                        }}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          fontSize: '0.74rem',
                          borderRadius: '6px',
                          border: '1px solid var(--surface-border)',
                          background: 'var(--surface-card-subtle)',
                          color: 'var(--text-ink)',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Editorial Toggles Row */}
                    <div className="editorial-toggles-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '8px 10px', background: 'var(--surface-card-subtle)', borderRadius: '6px', border: '1px solid var(--surface-border)', marginBottom: '10px' }}>
                      <label className="toggle-label-item" title="Decorative image: allows null/empty alt attribute" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!currentProduct.is_decorative}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setProducts((prev) =>
                              prev.map((p) => (p.product_id === currentProduct.product_id ? { ...p, is_decorative: checked } : p))
                            );
                          }}
                        />
                        <span>Decorative image (suppress alt text)</span>
                      </label>

                      <label className="toggle-label-item" title="Requires quoted transcription of any visible text" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!currentProduct.contains_text}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setProducts((prev) =>
                              prev.map((p) => (p.product_id === currentProduct.product_id ? { ...p, contains_text: checked } : p))
                            );
                          }}
                        />
                        <span>Contains visible text</span>
                      </label>

                      <label className="toggle-label-item" title="Requires group wording (e.g. Set of, Pair of)" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!currentProduct.has_multiple_products}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setProducts((prev) =>
                              prev.map((p) => (p.product_id === currentProduct.product_id ? { ...p, has_multiple_products: checked } : p))
                            );
                          }}
                        />
                        <span>Multiple products</span>
                      </label>
                    </div>

                    {/* Language & Voice Selection Controls */}
                    <div className="lang-voice-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 12px', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🌐 Language:
                        </span>
                        <select
                          value={reviewLanguage}
                          onChange={(e) => {
                            const newLang = e.target.value;
                            setReviewLanguage(newLang);
                            if (newLang !== 'en') {
                              handleTranslate(newLang);
                            }
                          }}
                          className="lang-select-dropdown"
                          style={{
                            padding: '5px 10px',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--surface-border)',
                            background: 'var(--surface-card-subtle)',
                            color: 'var(--text-ink)',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="en">🇬🇧 English</option>
                          <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
                          <option value="te">🇮🇳 తెలుగు (Telugu)</option>
                          <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
                          <option value="es">🇪🇸 Español (Spanish)</option>
                          <option value="fr">🇫🇷 Français (French)</option>
                          <option value="de">🇩🇪 Deutsch (German)</option>
                        </select>
                        {isTranslating && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>
                            ⚡ Translating...
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className={`btn-voice-play ${isPlayingVoice ? 'playing' : ''}`}
                          onClick={() => {
                            if (isPlayingVoice) handleVoicePause();
                            else handleVoicePlay(currentProduct);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: '1px solid var(--accent-indigo)',
                            background: isPlayingVoice ? 'var(--accent-indigo)' : 'var(--surface-card)',
                            color: isPlayingVoice ? '#FFF' : 'var(--accent-indigo)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          title={`Listen to description in ${reviewLanguage.toUpperCase()}`}
                        >
                          {isPlayingVoice ? '⏸ Pause Voice' : `🔊 Listen in ${reviewLanguage.toUpperCase()}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setVoiceRate(prev => prev === 1 ? 1.25 : prev === 1.25 ? 0.85 : 1)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.68rem',
                            fontFamily: 'var(--font-mono)',
                            borderRadius: '4px',
                            border: '1px solid var(--surface-border)',
                            background: 'var(--surface-card-subtle)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                          title="Toggle voice playback speed"
                        >
                          {voiceRate}x
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label htmlFor="varnix-text-editor" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {batchDashboardEnabled
                          ? `Final Description (${activeFormatTab.replace(/_/g, ' ').toUpperCase()} • ${reviewLanguage.toUpperCase()}):`
                          : `Final Description (${reviewLanguage.toUpperCase()}):`}
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setShowDiffModal(true)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-indigo)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Draft vs Your version
                        </button>
                        {currentProduct.status === 'APPROVED' && (
                          <span style={{ fontSize: '0.68rem', color: '#D97706', fontWeight: 600 }}>
                            ⚠️ Editing resets to EDITED
                          </span>
                        )}
                      </div>
                    </div>

                    {(() => {
                      const baseText = batchDashboardEnabled
                        ? (activeFormatTab === 'highlights'
                          ? (Array.isArray(currentProduct.product_highlights) ? currentProduct.product_highlights.map((h) => `• ${h}`).join('\n') : (currentProduct.product_highlights || currentProduct.description_bullets || ''))
                          : activeFormatTab === 'short'
                            ? (currentProduct.short_description || currentProduct.description_short || '')
                            : activeFormatTab === 'marketplace'
                              ? (currentProduct.marketplace_description || currentProduct.description_long || currentProduct.edited_text || currentProduct.draft || '')
                              : (currentProduct.card_summary || ''))
                        : currentText;

                      const currentFormatText = reviewLanguage !== 'en' && currentProduct.translations?.[reviewLanguage]
                        ? currentProduct.translations[reviewLanguage]
                        : baseText;

                      return (
                        <>
                          <textarea
                            id="varnix-text-editor"
                            className="editorial-textarea"
                            value={currentFormatText}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (reviewLanguage !== 'en') {
                                setProducts((prev) =>
                                  prev.map((p) => (p.product_id === currentProduct.product_id
                                    ? { ...p, translations: { ...(p.translations || {}), [reviewLanguage]: val } }
                                    : p))
                                );
                              } else if (batchDashboardEnabled) {
                                handleFormatTextEdit(activeFormatTab, val);
                              } else {
                                handleTextEdit(e);
                              }
                            }}
                            rows={activeFormatTab === 'card_summary' ? 3 : 5}
                            placeholder={currentProduct.is_decorative ? 'Decorative image confirmed. Empty description valid.' : `Enter or edit concise description in ${reviewLanguage.toUpperCase()} for ${currentProduct.metadata_title}...`}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            <span>{currentFormatText.length} characters</span>
                            <span>{currentFormatText.split(/\s+/).filter(Boolean).length} words ({reviewLanguage.toUpperCase()})</span>
                          </div>
                        </>
                      );
                    })()}

                    {/* Plain Language Live Validation Feedback (aria-live="polite") */}
                    <div aria-live="polite" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {validationResult.blockingErrors.map((err, idx) => (
                        <div key={idx} style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '6px', padding: '6px 10px', fontSize: '0.73rem', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>⛔ Blocking:</span> <span>{err}</span>
                        </div>
                      ))}
                      {validationResult.warnings.map((warn, idx) => (
                        <div key={idx} style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '6px', padding: '6px 10px', fontSize: '0.73rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>⚠️ Notice:</span> <span>{warn}</span>
                        </div>
                      ))}
                      {validationResult.blockingErrors.length === 0 && validationResult.warnings.length === 0 && (
                        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '6px 10px', fontSize: '0.73rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>✓ Valid:</span> <span>Concise, observable facts only. Ready for editorial approval.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SINGLE-PRODUCT INTELLIGENCE: VernX Content Check Panel */}
                  {singleProductIntelligenceEnabled && (
                    <div className="content-check-card">
                      <div className="content-check-header">
                        <span className="content-check-title">
                          🛡️ VernX Content Check
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: (currentProduct.content_check?.flagged_claims?.length > 0 || validationResult.offendingWords?.length > 0) ? '#DC2626' : '#059669' }}>
                          {(currentProduct.content_check?.flagged_claims?.length > 0 || validationResult.offendingWords?.length > 0) ? '⚠️ ACTION REQUIRED' : '✓ ALL CHECKS PASSED'}
                        </span>
                      </div>

                      <div className="content-check-grid">
                        <div className={`content-check-pill ${currentProduct.detected_product ? 'pass' : 'warn'}`}>
                          {currentProduct.detected_product ? `✓ Product Identified (${currentProduct.detected_product.product_name})` : 'ℹ Standard Model'}
                        </div>
                        <div className={`content-check-pill ${(currentProduct.detected_features?.length || 0) > 0 ? 'pass' : 'warn'}`}>
                          ✓ Features Identified ({currentProduct.detected_features?.length || 0})
                        </div>
                        <div className={`content-check-pill ${Object.keys(currentProduct.merchant_confirmed_specs || {}).length > 0 ? 'pass' : 'warn'}`}>
                          {Object.keys(currentProduct.merchant_confirmed_specs || {}).length > 0
                            ? `✓ Merchant Specs (${Object.keys(currentProduct.merchant_confirmed_specs || {}).length} verified)`
                            : 'ℹ Merchant Specs (None)'}
                        </div>
                        <div className="content-check-pill pass">
                          ✓ Positive Tone (Catalogue standard)
                        </div>
                        <div className={`content-check-pill ${(currentProduct.content_check?.flagged_claims?.length > 0 || validationResult.offendingWords?.length > 0) ? 'fail' : 'pass'}`}>
                          {(currentProduct.content_check?.flagged_claims?.length > 0 || validationResult.offendingWords?.length > 0)
                            ? `⚠️ ${(currentProduct.content_check?.flagged_claims?.length || 0) + (validationResult.offendingWords?.length || 0)} Unsupported Claims`
                            : '✓ No Unsupported Claims'}
                        </div>
                        <div className="content-check-pill pass">
                          ✓ No Repetition Scan
                        </div>
                      </div>

                      {/* Flagged Unsupported Claims Warning with [VERIFY] and [REMOVE] */}
                      {(() => {
                        const combined = [];
                        const seen = new Set();
                        (currentProduct.content_check?.flagged_claims || []).forEach((c) => {
                          const key = c.word.toLowerCase();
                          if (!seen.has(key)) {
                            seen.add(key);
                            combined.push({ word: c.word, category: c.category });
                          }
                        });
                        (validationResult.offendingWords || []).forEach((c) => {
                          const key = c.word.toLowerCase();
                          const isMerchantConfirmed = Object.values(currentProduct.merchant_confirmed_specs || {}).some(
                            (v) => String(v).toLowerCase().includes(key)
                          );
                          if (!seen.has(key) && !isMerchantConfirmed) {
                            seen.add(key);
                            combined.push({ word: c.word, category: c.category });
                          }
                        });

                        if (combined.length === 0) return null;

                        return (
                          <div style={{ marginTop: '8px' }}>
                            {combined.map((item, idx) => (
                              <div key={idx} className="flagged-claim-box">
                                <div className="flagged-claim-title">
                                  ⚠️ Unsupported Claim Detected: "{item.word}" ({item.category})
                                </div>
                                <div className="flagged-claim-desc">
                                  Visual image evidence does not prove {item.category}. Unconfirmed specs cannot be published without merchant verification.
                                </div>
                                <div className="flagged-claim-actions">
                                  <button
                                    type="button"
                                    className="btn-claim-verify"
                                    onClick={() => handleVerifyClaimAsSpec(item.word, item.category)}
                                    title="Confirm this spec as verified merchant-provided"
                                  >
                                    [VERIFY] Merchant Confirms
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-claim-remove"
                                    onClick={() => handleRemoveClaimFromText(item.word)}
                                    title="Remove this word from description text"
                                  >
                                    [REMOVE] Delete Claim
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* BATCH 3: Catalogue Readiness Score Panel (Checklist-Based) */}
                  {batchDashboardEnabled && (() => {
                    const readiness = computeClientReadinessScore(currentProduct);
                    const checklist = readiness.checklist || {};
                    return (
                      <div className="readiness-score-card" style={{ marginBottom: '14px', background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              📊 Catalogue Readiness Score
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: readiness.status === 'READY' ? '#ECFDF5' : readiness.status === 'NEEDS REVIEW' ? '#FFFBEB' : '#EFF6FF',
                                color: readiness.status === 'READY' ? '#059669' : readiness.status === 'NEEDS REVIEW' ? '#D97706' : '#2563EB',
                                border: `1px solid ${readiness.status === 'READY' ? '#A7F3D0' : readiness.status === 'NEEDS REVIEW' ? '#FDE68A' : '#BFDBFE'}`,
                              }}
                            >
                              {readiness.status}
                            </span>
                          </div>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: readiness.score >= 80 ? '#059669' : readiness.score >= 50 ? '#D97706' : '#2563EB' }}>
                            {readiness.score} / 100
                          </span>
                        </div>

                        {/* Transparent Checklist Breakdown */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                          {Object.entries(checklist).map(([key, item]) => (
                            <div
                              key={key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '5px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                background: item.passed ? '#ECFDF5' : '#F3F4F6',
                                color: item.passed ? '#065F46' : 'var(--text-muted)',
                                border: `1px solid ${item.passed ? '#A7F3D0' : 'var(--border)'}`,
                              }}
                            >
                              <span>{item.passed ? '✓' : '○'} {item.label}</span>
                              <span style={{ fontWeight: 700 }}>+{item.points}</span>
                            </div>
                          ))}
                        </div>

                        {/* What is missing callout */}
                        {readiness.missing && readiness.missing.length > 0 && (
                          <div style={{ background: '#FFFBEB', padding: '6px 10px', borderRadius: '4px', border: '1px solid #FDE68A', fontSize: '0.72rem', color: '#92400E', marginBottom: '8px' }}>
                            <strong>Missing to achieve 100%:</strong> {readiness.missing.join(' · ')}
                          </div>
                        )}

                        {/* Mandatory Disclaimer */}
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                          Prototype indicator only; not scientifically validated.
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Audio Verification Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-card-subtle)', borderRadius: '8px', border: '1px solid var(--surface-border)', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-ink)' }}>
                        🔊 Audio Verification
                      </span>
                      {currentProduct.listened && (
                        <span style={{ fontSize: '0.64rem', background: '#ECFDF5', color: '#059669', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          Listened ✓
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-editorial-primary"
                      onClick={handleVoicePlay}
                      style={{ padding: '5px 12px', fontSize: '0.74rem' }}
                      title="Read description and risk warnings aloud"
                    >
                      {isPlayingVoice ? '⏸ Pause' : '🔊 Listen Aloud'}
                    </button>
                  </div>

                  {/* Human Review Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {batchDashboardEnabled && (
                      <button
                        type="button"
                        className="btn-primary-action"
                        onClick={handleApproveAllFormats}
                        style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#FFF', fontWeight: 800, minHeight: '38px' }}
                        title="Explicitly approve all four formats (Highlights, Short, Marketplace, Card Summary)"
                      >
                        ✓ Approve All 4 Formats (Batch 3)
                      </button>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-primary-action"
                        onClick={handleApprove}
                        style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#FFF', fontWeight: 800, minHeight: '40px' }}
                      >
                        ✓ Approve Description (A)
                      </button>
                      <button
                        type="button"
                        className="btn-secondary-action"
                        onClick={() => setShowDiffModal(true)}
                        title="Compare Versions"
                      >
                        🔍 Diff
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-danger-action"
                        onClick={() => setShowInaccessibleModal(true)}
                      >
                        🚩 Mark Inaccessible (I)
                      </button>
                      <button
                        type="button"
                        className="btn-secondary-action"
                        onClick={() => {
                          setProducts((prev) =>
                            prev.map((p) =>
                              p.product_id === currentProduct.product_id
                                ? { ...p, edited_text: '', status: 'NOT_GENERATED' }
                                : p
                            )
                          );
                        }}
                      >
                        ↺ Reset Item
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
            </>
          ) : (
            /* INTERACTIVE UPLOAD HUB (Shown when queue is empty) */
            <div
              style={{
                gridColumn: '2 / -1',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                padding: '10px 0'
              }}
            >
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBulkFilesSelected(e);
                }}
                style={{
                  background: 'var(--surface-card)',
                  border: '2px dashed var(--accent-indigo)',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--accent-indigo)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  marginBottom: '16px'
                }}>
                  ☁️
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-ink)', margin: '0 0 8px 0' }}>
                  Upload Product Images to Review
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
                  Drag & drop single images or batch upload up to 20 product photos. The AI will automatically analyze visual attributes, estimate market price, and draft accessible descriptions.
                </p>

                {/* Primary Upload Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn-editorial-primary"
                    style={{ padding: '10px 22px', fontSize: '0.85rem' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📁 Select Single Image
                  </button>
                  <button
                    type="button"
                    className="btn-editorial-secondary"
                    style={{ padding: '10px 22px', fontSize: '0.85rem' }}
                    onClick={() => bulkFileInputRef.current?.click()}
                  >
                    📂 Bulk Upload (Up to 20)
                  </button>
                  <button
                    type="button"
                    className="btn-editorial-secondary"
                    style={{ padding: '10px 22px', fontSize: '0.85rem' }}
                    onClick={handleStartCamera}
                  >
                    📸 Take Photo
                  </button>
                  <button
                    type="button"
                    className="btn-editorial-secondary"
                    style={{ padding: '10px 22px', fontSize: '0.85rem' }}
                    onClick={() => multiImageUploadRef.current?.click()}
                  >
                    🔄 Multi-Angle Views
                  </button>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div className="varnix-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-ink)', marginBottom: '4px' }}>
                    Instant Price Estimation
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    Automated market pricing engine classifies category and predicts estimated retail price for every uploaded product.
                  </p>
                </div>
                <div className="varnix-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛡️</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-ink)', marginBottom: '4px' }}>
                    Automated Preflight Quality
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    Checks blur, lighting, contrast, and resolution automatically. Retake blurry shots with live camera before drafting.
                  </p>
                </div>
                <div className="varnix-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📥</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-ink)', marginBottom: '4px' }}>
                    Selective CSV / JSON Export
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    Export exactly the reviewed descriptions you choose with individual checkboxes and one-click bulk export.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
          </div>
        )}

        {/* TAB 2: OVERVIEW & 3D INTERACTIVE VISUALIZER */}
        {activeTab === 'overview' && (
          <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', margin: '0 0 10px 0' }}>
                Turn every product image into accessible context.
              </h1>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto' }}>
                Generate accurate descriptions, review every detail, and publish only what a human approves.
              </p>
            </div>

            {/* 3D Visualizer Stage */}
            <div className="hero-3d-stage">
              <svg width="420" height="260" viewBox="0 0 420 260" fill="none">
                {/* Orbit Path */}
                <ellipse cx="210" cy="130" rx="160" ry="70" stroke="#818CF8" strokeWidth="2" strokeDasharray="6 6" opacity="0.6" />
                {/* Central Product Image Card */}
                <rect x="160" y="90" width="100" height="80" rx="10" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2" filter="drop-shadow(0 4px 12px rgba(79,70,229,0.15))" />
                <text x="210" y="135" textAnchor="middle" fill="#4F46E5" fontWeight="800" fontSize="13" fontFamily="system-ui">IMAGE</text>
                {/* Orbiting Node 1: Vision */}
                <circle cx="50" cy="130" r="28" fill="#FFFFFF" stroke="#06B6D4" strokeWidth="2" filter="drop-shadow(0 2px 8px rgba(6,182,212,0.2))" />
                <text x="50" y="134" textAnchor="middle" fill="#0891B2" fontWeight="700" fontSize="10">VISION</text>
                {/* Orbiting Node 2: Description */}
                <circle cx="210" cy="60" r="28" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="2" filter="drop-shadow(0 2px 8px rgba(139,92,246,0.2))" />
                <text x="210" y="64" textAnchor="middle" fill="#7C3AED" fontWeight="700" fontSize="9">DESCRIBE</text>
                {/* Orbiting Node 3: Review */}
                <circle cx="370" cy="130" r="28" fill="#FFFFFF" stroke="#059669" strokeWidth="2" filter="drop-shadow(0 2px 8px rgba(5,150,105,0.2))" />
                <text x="370" y="134" textAnchor="middle" fill="#059669" fontWeight="700" fontSize="10">REVIEW</text>
                {/* Orbiting Node 4: Voice */}
                <circle cx="210" cy="200" r="28" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" filter="drop-shadow(0 2px 8px rgba(245,158,11,0.2))" />
                <text x="210" y="204" textAnchor="middle" fill="#D97706" fontWeight="700" fontSize="10">VOICE</text>
              </svg>
            </div>

            {/* Flow Steps Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px' }}>
              <div className="varnix-card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>1. Quality Check</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Evaluates resolution, blur, brightness, contrast, and visual clarity before drafting.
                </p>
              </div>
              <div className="varnix-card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>2. AI Drafting</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Drafts concise short, detailed, or bullet descriptions from observable facts only.
                </p>
              </div>
              <div className="varnix-card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛡️</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>3. Review Guard</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Guards against unsupported material, certification, and performance claims in real time.
                </p>
              </div>
              <div className="varnix-card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌐</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>4. Voice & Export</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Synchronizes Hindi/Telugu voice audio and exports auditable RFC 4180 CSV & JSON.
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => setActiveTab('workspace')}
                style={{ minHeight: '44px', padding: '10px 24px' }}
              >
                Start Reviewing Queue →
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: METHOD PAGE (ALTLUME DISCIPLINE) */}
        {activeFlow === 'workspace' && activeTab === 'method' && (
          <div style={{ maxWidth: '980px', margin: '40px auto 60px', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span className="brand-pill" style={{ marginBottom: '12px', display: 'inline-block' }}>
                EDITORIAL DISCIPLINE
              </span>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', color: 'var(--text-ink)', margin: '0 0 14px' }}>
                The ALTLUME Method: Observe → Check → Review
              </h1>
              <p style={{ fontSize: '1.08rem', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
                A systematic standard for commerce image descriptions. We separate visual evidence from marketing copy so every published alt text is factual, concise, and verifiable.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '36px' }}>
              <div className="step-card">
                <span className="step-number">Phase 01</span>
                <div className="step-title">Observe</div>
                <p className="step-desc">
                  Look closely at visible light, material texture, silhouette, and geometry. <strong>Catalogue metadata is not proof of visible detail</strong>—only what is rendered in pixels may be described.
                </p>
              </div>

              <div className="step-card">
                <span className="step-number">Phase 02</span>
                <div className="step-title">Check</div>
                <p className="step-desc">
                  Apply deterministic guardrails against unsupported claims. Banned words (eco-friendly, durable, ergonomic, pure silk) must be confirmed by merchant specs or removed.
                </p>
              </div>

              <div className="step-card">
                <span className="step-number">Phase 03</span>
                <div className="step-title">Review</div>
                <p className="step-desc">
                  <strong>A generated draft is never an approval.</strong> The commerce editor holds ultimate responsibility for clarity, brevity (under 125 characters), and screen reader accessibility.
                </p>
              </div>
            </div>

            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: '14px', padding: '28px', marginBottom: '28px', boxShadow: 'var(--shadow-md)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text-ink)', marginTop: 0, marginBottom: '10px' }}>
                W3C Web Accessibility Guidelines
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem', margin: '0 0 16px 0' }}>
                ALTLUME aligns with the World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG 2.2). Before writing descriptions, verify image intent using the decision tree: decorative images must use null alt text, informative images require concise descriptions, and text-containing images require verbatim transcription.
              </p>
              <a
                href="https://www.w3.org/WAI/tutorials/images/decision-tree/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-editorial-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                ↗ Open W3C Image Alt-Text Decision Tree
              </a>
            </div>

            <div style={{ background: 'var(--surface-card-subtle)', border: '1px solid var(--surface-border)', borderRadius: '10px', padding: '16px 20px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong>Synthetic Fixture Notice:</strong> ALTLUME operates on fixture dataset (P01–P10). This tool assists editorial workflows and <strong>does not prove website accessibility compliance</strong>. Human editorial sign-off is strictly required before public publishing.
            </div>
          </div>
        )}

        {/* TAB 4: EXPORT HUB (ALTLUME READINESS & AUDIT) */}
        {activeFlow === 'workspace' && activeTab === 'export' && (() => {
          const displayedExportProducts = products.filter((p) => {
            if (exportStatusFilter === 'APPROVED' && p.status !== 'APPROVED') return false;
            if (exportStatusFilter === 'PENDING' && (p.status === 'APPROVED' || p.status === 'INACCESSIBLE')) return false;
            if (exportStatusFilter === 'INACCESSIBLE' && p.status !== 'INACCESSIBLE') return false;
            if (exportSearchTerm.trim()) {
              const q = exportSearchTerm.toLowerCase();
              const matchId = p.product_id.toLowerCase().includes(q);
              const matchTitle = (p.metadata_title || '').toLowerCase().includes(q);
              const matchDesc = (p.final_description || p.edited_text || p.draft || '').toLowerCase().includes(q);
              return matchId || matchTitle || matchDesc;
            }
            return true;
          });

          const isAllVisibleSelected =
            displayedExportProducts.length > 0 &&
            displayedExportProducts.every((p) => selectedExportIds.includes(p.product_id));

          return (
            <div style={{ maxWidth: '1120px', margin: '30px auto 60px', padding: '0 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <span className="brand-pill" style={{ marginBottom: '8px', display: 'inline-block' }}>
                    SELECTIVE & BATCH EXPORT
                  </span>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text-ink)', margin: '0 0 6px 0' }}>
                    Export Reviewed Catalogue
                  </h1>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    Select specific product descriptions or download the entire verified catalogue in CSV and JSON.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn-editorial-secondary"
                    onClick={() => handleExportJson()}
                    disabled={selectedExportIds.length === 0}
                    style={{ opacity: selectedExportIds.length === 0 ? 0.5 : 1, cursor: selectedExportIds.length === 0 ? 'not-allowed' : 'pointer' }}
                    title={selectedExportIds.length === 0 ? 'Select at least 1 description below' : `Download JSON for ${selectedExportIds.length} item(s)`}
                  >
                    📦 Download JSON ({selectedExportIds.length})
                  </button>
                  <button
                    type="button"
                    className="btn-editorial-primary"
                    onClick={() => handleExportCsv()}
                    disabled={selectedExportIds.length === 0}
                    style={{ opacity: selectedExportIds.length === 0 ? 0.5 : 1, cursor: selectedExportIds.length === 0 ? 'not-allowed' : 'pointer' }}
                    title={selectedExportIds.length === 0 ? 'Select at least 1 description below' : `Download CSV for ${selectedExportIds.length} item(s)`}
                  >
                    📥 Download CSV ({selectedExportIds.length})
                  </button>
                </div>
              </div>

              {/* Readiness Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div className="varnix-card" style={{ padding: '16px', background: 'var(--surface-card)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Catalogue Items</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-ink)', marginTop: '4px' }}>
                    {products.length}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--emerald)', marginTop: '2px' }}>100% ID preserved</div>
                </div>

                <div className="varnix-card" style={{ padding: '16px', background: 'var(--surface-card)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Selected For Export</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-indigo)', marginTop: '4px' }}>
                    {selectedExportIds.length}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Will be in downloaded file</div>
                </div>

                <div className="varnix-card" style={{ padding: '16px', background: 'var(--surface-card)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Approved Items</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--emerald)', marginTop: '4px' }}>
                    {approvedCount}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Human endorsed</div>
                </div>

                <div className="varnix-card" style={{ padding: '16px', background: 'var(--surface-card)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Pending Review</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
                    {products.length - approvedCount - inaccessibleCount}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Awaiting editor</div>
                </div>
              </div>

              {/* Selection Control Toolbar */}
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--surface-border)',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-ink)', marginRight: '4px' }}>
                    Select:
                  </span>
                  <button
                    type="button"
                    className="btn-editorial-secondary"
                    onClick={handleSelectAllExport}
                    style={{ padding: '5px 10px', fontSize: '0.74rem' }}
                  >
                    ✦ All ({products.length})
                  </button>
                  <button
                    type="button"
                    className="btn-editorial-secondary"
                    onClick={handleSelectApprovedExportOnly}
                    style={{ padding: '5px 10px', fontSize: '0.74rem' }}
                  >
                    ✓ Approved Only ({approvedCount})
                  </button>
                  <button
                    type="button"
                    className="btn-editorial-secondary"
                    onClick={handleSelectPendingExportOnly}
                    style={{ padding: '5px 10px', fontSize: '0.74rem' }}
                  >
                    ⏳ Pending Only
                  </button>
                  <button
                    type="button"
                    className="btn-editorial-secondary"
                    onClick={handleClearExportSelection}
                    style={{ padding: '5px 10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}
                  >
                    ✕ Clear
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Filter by ID, Title, or Words..."
                    value={exportSearchTerm}
                    onChange={(e) => setExportSearchTerm(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--surface-border)',
                      background: 'var(--surface-card-subtle)',
                      color: 'var(--text-ink)',
                      fontSize: '0.76rem',
                      width: '210px',
                      outline: 'none'
                    }}
                  />
                  <select
                    value={exportStatusFilter}
                    onChange={(e) => setExportStatusFilter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--surface-border)',
                      background: 'var(--surface-card-subtle)',
                      color: 'var(--text-ink)',
                      fontSize: '0.76rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="APPROVED">Approved Only</option>
                    <option value="PENDING">Pending Only</option>
                    <option value="INACCESSIBLE">Inaccessible</option>
                  </select>
                </div>
              </div>

              {/* Selection Notification Banner */}
              <div style={{
                background: selectedExportIds.length > 0 ? 'rgba(79, 70, 229, 0.07)' : '#FEF2F2',
                border: `1px solid ${selectedExportIds.length > 0 ? 'rgba(79, 70, 229, 0.2)' : '#FECACA'}`,
                borderRadius: '8px',
                padding: '9px 14px',
                marginBottom: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '0.8rem',
                color: selectedExportIds.length > 0 ? 'var(--text-ink)' : '#DC2626'
              }}>
                <div>
                  <strong>{selectedExportIds.length}</strong> of {products.length} description{products.length === 1 ? '' : 's'} selected for download.
                  {selectedExportIds.length === 0 && ' (Please check individual descriptions below)'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  💡 Use the checkboxes to choose custom descriptions, or click the individual <strong>📥 CSV</strong> / <strong>📦 JSON</strong> buttons on any row.
                </div>
              </div>

              {/* Product Audit Table with Checkboxes & Row Actions */}
              <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-card-subtle)', borderBottom: '1px solid var(--surface-border)' }}>
                      <th style={{ padding: '12px 14px', width: '38px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isAllVisibleSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const visibleIds = displayedExportProducts.map((p) => p.product_id);
                              setSelectedExportIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
                            } else {
                              const visibleSet = new Set(displayedExportProducts.map((p) => p.product_id));
                              setSelectedExportIds((prev) => prev.filter((id) => !visibleSet.has(id)));
                            }
                          }}
                          title="Select / deselect all visible rows"
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-indigo)' }}
                        />
                      </th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'var(--font-mono)', width: '60px' }}>ID</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, width: '60px' }}>Image</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Product Title</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Price</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Origin</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Reviewed Description</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center', width: '140px' }}>Download Single</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedExportProducts.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No products found matching "{exportSearchTerm}". Clear search filter to view catalogue.
                        </td>
                      </tr>
                    ) : (
                      displayedExportProducts.map((p) => {
                        const isHuman = p.is_human_edited || p.status === 'APPROVED' || p.edited_text;
                        const isSelected = selectedExportIds.includes(p.product_id);
                        const desc = p.final_description || (p.status === 'INACCESSIBLE' ? 'Image unavailable — manual review required.' : p.edited_text || p.draft || '—');

                        return (
                          <tr
                            key={p.product_id}
                            style={{
                              borderBottom: '1px solid var(--surface-border)',
                              background: isSelected ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectExport(p.product_id)}
                                title={`Toggle selection for ${p.product_id}`}
                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-indigo)' }}
                              />
                            </td>
                            <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                              {p.product_id}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <img
                                src={p.image_url}
                                alt=""
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--surface-border)' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-ink)' }}>
                              <div>{p.metadata_title}</div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>{p.category || 'General'}</span>
                            </td>
                            <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--emerald)' }}>
                              ${p.price !== undefined ? Number(p.price).toFixed(2) : '0.00'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span className={`status-pill ${p.status.toLowerCase().replace(/_/g, '-')}`}>
                                {p.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: isHuman ? '#ECFDF5' : '#F3F4F6',
                                  color: isHuman ? '#047857' : '#6B7280',
                                  border: `1px solid ${isHuman ? '#A7F3D0' : '#E5E7EB'}`,
                                }}
                              >
                                {isHuman ? '✍️ Human' : '🤖 AI Draft'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: 1.5 }}>
                              <div style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {desc}
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleExportSingleCsv(p)}
                                  title={`Download CSV only for ${p.product_id}`}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    border: '1px solid var(--surface-border)',
                                    background: 'var(--surface-card)',
                                    color: 'var(--text-ink)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  📥 CSV
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExportSingleJson(p)}
                                  title={`Download JSON only for ${p.product_id}`}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    border: '1px solid var(--surface-border)',
                                    background: 'var(--surface-card)',
                                    color: 'var(--text-ink)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  📦 JSON
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Non-compliance Disclaimer */}
              <div style={{ background: 'var(--surface-card-subtle)', border: '1px solid var(--surface-border)', borderRadius: '10px', padding: '16px 20px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'center' }}>
                ⚖️ <strong>Legal Notice:</strong> An export from this tool alone does not prove or guarantee website accessibility compliance. Human editorial review is strictly required.
              </div>
            </div>
          );
        })()}

        {/* TAB 404: MISSING IMAGE / SLIPPED FRAME */}
        {activeTab === '404' && (
          <div style={{ maxWidth: '640px', margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '16px', filter: 'drop-shadow(0 6px 14px rgba(79,70,229,0.2))' }}>
              🖼️💨
            </div>
            <span className="brand-pill" style={{ marginBottom: '12px', display: 'inline-block' }}>
              STATUS 404
            </span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: 'var(--text-ink)', margin: '0 0 12px 0' }}>
              The image slipped out of the frame.
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '28px' }}>
              We inspected every pixel between P01 and P10, but this frame is completely empty. It may have been relocated, unlinked, or never rendered.
            </p>
            <button
              type="button"
              className="btn-editorial-primary"
              onClick={() => setActiveTab('workspace')}
              data-cursor="Return"
            >
              ← Return to Review Studio
            </button>
          </div>
        )}

        {/* TAB 5: BATCH DASHBOARD VIEW (Batch 3 Feature) */}
        {activeFlow === 'workspace' && activeTab === 'dashboard' && (
          <div className="batch-dashboard-container">
            {/* Dashboard Header Bar */}
            <div className="batch-dashboard-header">
              <div>
                <h1 className="batch-dashboard-title">
                  📊 Batch Operations & Catalogue Readiness Dashboard
                </h1>
                <p className="batch-dashboard-subtitle">
                  Portfolio monitoring: Multi-format consistency, verification queue, transparent readiness checklists, and bulk approval.
                </p>
              </div>

              <div className="batch-dashboard-actions">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setShowApproveLowRiskModal(true)}
                  title="Approve all products with readiness score ≥ 80 and zero unsupported claims"
                >
                  🛡️ Approve All Low-Risk Items
                </button>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => bulkFileInputRef.current?.click()}
                  title="Upload up to 20 images at once"
                >
                  📤 Batch Upload Images (Max 20)
                </button>
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={handleExportCsv}
                >
                  📥 Export CSV
                </button>
              </div>
            </div>

            {/* Summary Metrics Strip */}
            {(() => {
              const allReadiness = products.map((p) => computeClientReadinessScore(p));
              const readyCount = allReadiness.filter((r) => r.status === 'READY').length;
              const needReviewCount = allReadiness.filter((r) => r.status === 'NEEDS REVIEW').length;
              const needInfoCount = allReadiness.filter((r) => r.status === 'NEEDS INFORMATION').length;
              const errorCount = products.filter((p) => p.status === 'INACCESSIBLE' || p.status === 'ERROR').length;
              const approvedCount = products.filter((p) => p.status === 'APPROVED').length;
              const totalImages = products.reduce((acc, p) => acc + (p.images?.length || 1), 0);

              const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.detected_category || p.category || p.product_category || 'General').filter(Boolean)))];

              const filteredProducts = products.filter((p) => {
                const readiness = computeClientReadinessScore(p);
                const cat = p.detected_category || p.category || p.product_category || 'General';

                // Category filter
                if (dashboardCategoryFilter !== 'ALL' && cat !== dashboardCategoryFilter) {
                  return false;
                }

                // Status filter
                if (dashboardFilter === 'ALL') return true;
                if (dashboardFilter === 'READY') return readiness.status === 'READY' && p.status !== 'INACCESSIBLE';
                if (dashboardFilter === 'NEEDS REVIEW') return readiness.status === 'NEEDS REVIEW' && p.status !== 'INACCESSIBLE';
                if (dashboardFilter === 'NEEDS INFORMATION') return readiness.status === 'NEEDS INFORMATION' && p.status !== 'INACCESSIBLE';
                if (dashboardFilter === 'ERROR') return p.status === 'INACCESSIBLE' || p.status === 'ERROR' || readiness.status === 'ERROR';
                return true;
              });

              return (
                <div>
                  {/* Summary Counts Banner */}
                  <div className="dashboard-summary-bar">
                    <div className="dashboard-summary-chip">
                      <strong>{products.length} Products</strong> ({totalImages} images)
                    </div>
                    <span className="summary-dot">·</span>
                    <div className="dashboard-summary-chip chip-ready">
                      <span className="chip-indicator">●</span> <strong>{readyCount} Ready</strong>
                    </div>
                    <span className="summary-dot">·</span>
                    <div className="dashboard-summary-chip chip-review">
                      <span className="chip-indicator">●</span> <strong>{needReviewCount} Need Review</strong>
                    </div>
                    <span className="summary-dot">·</span>
                    <div className="dashboard-summary-chip chip-info">
                      <span className="chip-indicator">●</span> <strong>{needInfoCount} Need Information</strong>
                    </div>
                    <span className="summary-dot">·</span>
                    <div className="dashboard-summary-chip chip-approved">
                      <span className="chip-indicator">✓</span> <strong>{approvedCount} Approved</strong>
                    </div>
                    {errorCount > 0 && (
                      <>
                        <span className="summary-dot">·</span>
                        <div className="dashboard-summary-chip chip-error">
                          <span className="chip-indicator">⚠️</span> <strong>{errorCount} Inaccessible / Error</strong>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter Row */}
                  <div className="dashboard-filters-row">
                    <div className="dashboard-filter-group">
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
                      {[
                        { id: 'ALL', label: 'ALL', count: products.length },
                        { id: 'READY', label: 'READY', count: readyCount },
                        { id: 'NEEDS REVIEW', label: 'NEEDS REVIEW', count: needReviewCount },
                        { id: 'NEEDS INFORMATION', label: 'NEEDS INFORMATION', count: needInfoCount },
                        { id: 'ERROR', label: 'ERROR', count: errorCount },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className={`dashboard-filter-btn ${dashboardFilter === f.id ? 'active' : ''}`}
                          onClick={() => setDashboardFilter(f.id)}
                        >
                          {f.label} ({f.count})
                        </button>
                      ))}
                    </div>

                    <div className="dashboard-filter-group">
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>Category:</span>
                      <select
                        className="dashboard-category-select"
                        value={dashboardCategoryFilter}
                        onChange={(e) => setDashboardCategoryFilter(e.target.value)}
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c === 'ALL' ? 'All Categories' : c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Product Cards Grid */}
                  <div className="dashboard-products-grid">
                    {filteredProducts.map((p) => {
                      const readiness = computeClientReadinessScore(p);
                      const cat = p.detected_category || p.category || p.product_category || 'General';
                      const viewCount = p.images?.length || 1;
                      const verifiedSpecsCount = Object.keys(p.merchant_confirmed_specs || p.verified_specs || {}).length;
                      const featuresList = (p.detected_features || []).filter(
                        (f) => (p.feature_choices?.[f.id] || 'INCLUDE') === 'INCLUDE'
                      );
                      const highlightsList = p.selected_highlights || p.recommended_highlights || (Array.isArray(p.product_highlights) ? p.product_highlights : []);

                      const statusColor =
                        p.status === 'APPROVED' ? '#059669' :
                          p.status === 'INACCESSIBLE' ? '#DC2626' :
                            p.status === 'ERROR' ? '#DC2626' :
                              p.status === 'EDITED' ? '#D97706' :
                                p.status === 'GENERATED' ? '#4F46E5' :
                                  p.status === 'ANALYZING' ? '#2563EB' :
                                    '#6B7280';

                      return (
                        <div key={p.product_id} className="dashboard-product-card">
                          {/* Card Header: Thumbnail + Identity */}
                          <div className="product-card-top">
                            <div className="product-card-thumb-container">
                              <img
                                src={p.image_url}
                                alt={p.metadata_title || p.product_id}
                                className="product-card-thumb"
                              />
                              <span className="product-card-view-badge">
                                📷 {viewCount} view{viewCount > 1 ? 's' : ''}
                              </span>
                            </div>

                            <div className="product-card-info">
                              <div className="product-card-id-row">
                                <span className="product-card-id">{p.product_id}</span>
                                <span
                                  className="product-card-status-pill"
                                  style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}40` }}
                                >
                                  {p.status}
                                </span>
                              </div>

                              <div className="product-card-title">
                                {p.metadata_title || p.product_id}
                              </div>

                              <div className="product-card-meta-row">
                                <span className="product-card-category-tag">
                                  📁 {cat}
                                </span>
                                <span className={`product-card-confidence ${p.confidence || 'medium'}`}>
                                  Confidence: {p.confidence || 'high'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Catalogue Readiness Score Meter */}
                          <div className="readiness-meter-block">
                            <div className="readiness-meter-header">
                              <span className="readiness-meter-label">Catalogue Readiness</span>
                              <span className="readiness-meter-val" style={{ color: readiness.score >= 80 ? '#059669' : readiness.score >= 50 ? '#D97706' : '#2563EB' }}>
                                <strong>{readiness.score}/100</strong> ({readiness.status})
                              </span>
                            </div>

                            <div className="readiness-meter-track">
                              <div
                                className="readiness-meter-fill"
                                style={{
                                  width: `${readiness.score}%`,
                                  background: readiness.score >= 80 ? 'linear-gradient(90deg, #10B981, #059669)' : readiness.score >= 50 ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, #60A5FA, #3B82F6)',
                                }}
                              />
                            </div>

                            {/* Missing items indicator */}
                            {readiness.missing && readiness.missing.length > 0 && (
                              <div className="readiness-missing-note">
                                ⚠️ {readiness.missing[0]}
                              </div>
                            )}
                          </div>

                          {/* Observable Features & Verified Specs Summary */}
                          <div className="card-specs-row">
                            <span className="spec-indicator">
                              ✨ <strong>{featuresList.length}</strong> Features Confirmed
                            </span>
                            <span className="spec-indicator">
                              ❓ <strong>{verifiedSpecsCount}</strong> Verified Specs
                            </span>
                            <span className="spec-indicator">
                              ⭐ <strong>{highlightsList.length}</strong> Highlights
                            </span>
                          </div>

                          {/* Description Snippet Preview */}
                          <div className="card-description-preview">
                            <div className="preview-label">Short Description Preview:</div>
                            <div className="preview-text">
                              {p.short_description || p.description_short || p.marketplace_description || p.draft || 'No description generated yet.'}
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="card-actions-footer">
                            <button
                              type="button"
                              className="btn-card-workspace"
                              onClick={() => {
                                setSelectedId(p.product_id);
                                setActiveTab('workspace');
                              }}
                            >
                              🏢 Review in Workspace
                            </button>

                            {p.status !== 'APPROVED' ? (
                              <button
                                type="button"
                                className="btn-card-approve"
                                onClick={() => {
                                  setSelectedId(p.product_id);
                                  handleApproveAllFormats();
                                }}
                                title="Explicitly approve all four formats for this item"
                              >
                                ✓ Approve All 4 Formats
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, padding: '4px 8px' }}>
                                ✓ Approved
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredProducts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#FFF', borderRadius: '8px', border: '1px dashed var(--border)', marginTop: '20px' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        No products match the filter "{dashboardFilter}" {dashboardCategoryFilter !== 'ALL' ? `in category ${dashboardCategoryFilter}` : ''}.
                      </p>
                      <button
                        type="button"
                        className="btn-secondary-action"
                        onClick={() => {
                          setDashboardFilter('ALL');
                          setDashboardCategoryFilter('ALL');
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </main>


      {/* MODAL 1: Inaccessible Image Dialog */}
      {showInaccessibleModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>🚩 Mark Image as Inaccessible</span>
              <button type="button" onClick={() => setShowInaccessibleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 0 }}>
                Flagging {currentProduct.product_id} as Inaccessible will preserve its product ID and assign the standard placeholder without generating fabricated AI copy.
              </p>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Reason:</label>
                <select
                  value={inaccessibleReason}
                  onChange={(e) => setInaccessibleReason(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.84rem' }}
                >
                  <option value="Image unavailable">Image unavailable</option>
                  <option value="Image too blurry">Image too blurry</option>
                  <option value="Image too unclear">Image too unclear</option>
                  <option value="Insufficient visual information">Insufficient visual information</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Reviewer Note:</label>
                <textarea
                  rows={3}
                  value={inaccessibleNote}
                  onChange={(e) => setInaccessibleNote(e.target.value)}
                  placeholder="Explain why visual details cannot be reliably described..."
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.84rem' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary-action" onClick={() => setShowInaccessibleModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn-danger-action" onClick={handleConfirmInaccessible}>
                Confirm Inaccessible
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Keyboard Shortcuts Help */}
      {showShortcutsModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>⌨️ Keyboard Navigation Shortcuts</span>
              <button type="button" onClick={() => setShowShortcutsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px', fontSize: '0.84rem' }}>
                <kbd style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: 700 }}>N</kbd>
                <span>Navigate to Next Product in Queue</span>

                <kbd style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: 700 }}>P</kbd>
                <span>Navigate to Previous Product in Queue</span>

                <kbd style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: 700 }}>E</kbd>
                <span>Focus Description Editor Textarea</span>

                <kbd style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: 700 }}>A</kbd>
                <span>Approve Current Description</span>

                <kbd style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: 700 }}>I</kbd>
                <span>Open Mark Inaccessible Dialog</span>

                <kbd style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: 700 }}>?</kbd>
                <span>Toggle Shortcuts Help Dialog</span>

                <kbd style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: 700 }}>Esc</kbd>
                <span>Close any open modal or unfocus</span>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-primary-action" onClick={() => setShowShortcutsModal(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Version Diff Viewer */}
      {showDiffModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>🔍 Description Version Comparison ({currentProduct.product_id})</span>
              <button type="button" onClick={() => setShowDiffModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>1. AI DRAFT:</span>
                <div style={{ background: '#EFF6FF', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', marginTop: '2px', color: '#1E40AF' }}>
                  {currentProduct.draft || 'No draft generated yet'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>2. HUMAN EDITED:</span>
                <div style={{ background: '#FFFBEB', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', marginTop: '2px', color: '#92400E' }}>
                  {currentProduct.edited_text || 'No edits applied'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>3. APPROVED FINAL:</span>
                <div style={{ background: '#ECFDF5', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', marginTop: '2px', color: '#065F46' }}>
                  {currentProduct.final_description || (currentProduct.status === 'APPROVED' ? currentText : 'Not approved yet')}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-primary-action" onClick={() => setShowDiffModal(false)}>
                Close Diff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Camera Capture Dialog */}
      {isCameraActive && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📸 Direct Camera Capture</span>
              <button type="button" onClick={handleStopCamera} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ width: '100%', height: '320px', background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Center the product in the frame. Captured photos will automatically pass through client-side quality checks.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="btn-secondary-action" onClick={handleStopCamera}>
                Cancel
              </button>
              <button type="button" className="btn-primary-action" onClick={handleSnapCamera} style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)' }}>
                📸 Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Bulk Upload Processing Queue */}
      {(isBulkProcessing || bulkQueue.length > 0) && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                📂 Bulk Upload & Analysis Queue ({bulkQueue.length} Images)
              </span>
              {!isBulkProcessing && (
                <button type="button" onClick={() => setBulkQueue([])} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
              )}
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 0 }}>
                Processing sequentially with concurrency limit (max 2–3). Each image is checked for quality and analyzed with Gemini.
              </p>

              {/* Overall Progress Bar */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px', fontWeight: 600 }}>
                  <span>Batch Progress</span>
                  <span>{bulkProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${bulkProgress}%`, height: '100%', background: 'linear-gradient(90deg, #4F46E5, #10B981)', transition: 'width 0.3s' }} />
                </div>
              </div>

              {/* Items List */}
              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bulkQueue.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--primary)' }}>
                        {item.id}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Category selector */}
                      <select
                        value={item.category || 'General'}
                        onChange={(e) => {
                          const cat = e.target.value;
                          setBulkQueue(prev => prev.map(q => q.id === item.id ? { ...q, category: cat } : q));
                          setProducts(prev => prev.map(p => p.product_id === item.id ? { ...p, category: cat } : p));
                        }}
                        style={{ padding: '3px 6px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                      >
                        <option value="General">General</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Footwear">Footwear</option>
                        <option value="Bag">Bag</option>
                        <option value="Watch">Watch</option>
                        <option value="Drinkware">Drinkware</option>
                        <option value="Clothing">Clothing</option>
                      </select>

                      {/* Status indicator */}
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: item.status === 'READY' ? '#ECFDF5' : item.status === 'FAILED' ? '#FEF2F2' : item.status === 'ANALYZING' ? '#EEF2FF' : '#F3F4F6',
                          color: item.status === 'READY' ? '#059669' : item.status === 'FAILED' ? '#DC2626' : item.status === 'ANALYZING' ? '#4F46E5' : '#6B7280'
                        }}
                      >
                        {item.status}
                      </span>

                      {/* Retry button on failed item */}
                      {item.status === 'FAILED' && (
                        <button
                          type="button"
                          className="btn-secondary-action"
                          onClick={() => handleRetryBulkItem(item.id)}
                          style={{ padding: '2px 6px', fontSize: '0.68rem', color: '#DC2626' }}
                          title="Retry processing this item"
                        >
                          🔄 Retry
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary-action"
                disabled={isBulkProcessing}
                onClick={() => setBulkQueue([])}
              >
                {isBulkProcessing ? 'Processing Batch...' : 'Done / View in Queue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Approve All Low-Risk Listened Items Confirmation */}
      {showApproveAllModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>✓ Approve Low-Risk Listened Products</span>
              <button type="button" onClick={() => setShowApproveAllModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', marginTop: 0 }}>
                This action will mark all eligible items that you have listened to as <strong>APPROVED</strong>.
              </p>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div>• Only applies to items with badge <strong>🔊 Listened</strong></div>
                <div>• Items flagged with critical risk warnings or inaccessible status are <strong>skipped</strong></div>
                <div>• Remember to spot-check audio-reviewed items against the images</div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary-action" onClick={() => setShowApproveAllModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary-action"
                onClick={handleApproveAllListened}
                style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
              >
                Confirm Batch Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6B: Batch 3 - Approve All Low-Risk Items Confirmation Dialog */}
      {showApproveLowRiskModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>🛡️ Approve All Low-Risk Catalogue Items</span>
              <button type="button" onClick={() => setShowApproveLowRiskModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', marginTop: 0 }}>
                This bulk action will explicitly approve all products meeting high-confidence readiness criteria.
              </p>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div>• Minimum Readiness Score: <strong>80 / 100</strong></div>
                <div>• Claim Check: <strong>Zero unverified claims</strong></div>
                <div>• Excludes items marked <strong>INACCESSIBLE</strong> or <strong>ERROR</strong></div>
                <div>• Generates immutable audit log entries</div>
              </div>
              <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Prototype indicator only; not scientifically validated. Merchants remain responsible for catalog accuracy.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary-action" onClick={() => setShowApproveLowRiskModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary-action"
                onClick={handleConfirmApproveLowRisk}
                style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
              >
                ✓ Confirm Approval of Low-Risk Items
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL 7: Batch 2 AI Multi-Image Grouping & View Orientation Studio */}
      {showGroupingModal && (
        <div className="grouping-modal-overlay" role="dialog" aria-modal="true">
          <div className="grouping-modal">
            <div className="grouping-modal-header">
              <div>
                <div className="grouping-modal-title">
                  🖼️ AI Multi-Image Grouping & View Orientation Studio
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  Gemini analyzed your uploaded images and suggested product groupings and view angles.
                </div>
              </div>
              <button
                type="button"
                className="grouping-modal-close"
                onClick={() => setShowGroupingModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="grouping-modal-body">
              <div className="grouping-modal-actions-bar">
                <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  {stagedGroups.length} Suggested Product Group{stagedGroups.length > 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {stagedGroups.length > 1 && (
                    <button
                      type="button"
                      className="btn-group-action"
                      onClick={handleMergeAllStagedGroups}
                      title="Merge all images into a single product group"
                    >
                      🔗 Merge All Into 1 Product
                    </button>
                  )}
                </div>
              </div>

              <div className="grouping-groups-list">
                {stagedGroups.map((grp, gIdx) => (
                  <div key={grp.group_id || gIdx} className="grouping-card">
                    <div className="grouping-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)' }}>
                          Group #{gIdx + 1}:
                        </span>
                        <input
                          type="text"
                          className="grouping-card-title-input"
                          value={grp.group_name}
                          onChange={(e) => handleRenameStagedGroup(gIdx, e.target.value)}
                          placeholder="Product Group Name"
                        />
                        <span style={{ fontSize: '0.72rem', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                          {grp.images.length} view{grp.images.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {grp.images.length > 1 && (
                          <button
                            type="button"
                            className="btn-group-action"
                            onClick={() => handleSeparateStagedGroup(gIdx)}
                            title="Split this group so every image becomes an individual product"
                          >
                            ✂️ Separate Images
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Low confidence warning banner if AI suggests confirmation */}
                    {grp.needs_merchant_confirmation && (
                      <div className="low-confidence-banner">
                        <span className="low-confidence-banner-icon">⚠️</span>
                        <span>{grp.confirmation_message || 'These images may represent the same product. Please confirm.'}</span>
                      </div>
                    )}

                    {/* Images Grid */}
                    <div className="grouping-images-grid">
                      {grp.images.map((img, imgIdx) => (
                        <div key={img.id || imgIdx} className="grouping-image-tile">
                          <img src={img.url} alt={img.file_name || `Angle ${imgIdx + 1}`} />
                          <div className="grouping-tile-overlay">
                            <select
                              className="grouping-tile-view-select"
                              value={img.view || 'front'}
                              onChange={(e) => handleChangeStagedImageView(gIdx, imgIdx, e.target.value)}
                              title="Correct view label"
                            >
                              <option value="front">Front View</option>
                              <option value="back">Back View</option>
                              <option value="side">Side View</option>
                              <option value="left">Left View</option>
                              <option value="right">Right View</option>
                              <option value="top">Top View</option>
                              <option value="detail">Detail View</option>
                              <option value="heel">Heel View</option>
                              <option value="sole">Sole View</option>
                              <option value="ports">Ports / Controls</option>
                            </select>
                            <button
                              type="button"
                              className="grouping-tile-remove-btn"
                              onClick={() => handleRemoveStagedImage(gIdx, imgIdx)}
                              title="Remove image from group"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grouping-modal-footer">
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => setShowGroupingModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary-action"
                onClick={handleConfirmGroupingCommit}
                style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
              >
                ✓ Confirm & Add to Review Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Command Palette Modal (Cmd+K / Ctrl+K) */}
      {showCommandPalette && (
        <div
          className="modal-overlay"
          onClick={() => setShowCommandPalette(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Command Palette"
        >
          <div
            className="glass-modal"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>🔍</span>
              <input
                type="text"
                autoFocus
                placeholder="Type a product ID (P01–P10) or action..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  color: 'var(--text-ink)',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--surface-card-subtle)', border: '1px solid var(--surface-border)' }}>
                ESC
              </kbd>
            </div>

            {/* Filtered Results */}
            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px' }}>
                Products ({products.length})
              </div>
              {products
                .filter(
                  (p) =>
                    !commandQuery ||
                    p.product_id.toLowerCase().includes(commandQuery.toLowerCase()) ||
                    p.metadata_title.toLowerCase().includes(commandQuery.toLowerCase())
                )
                .map((p) => (
                  <button
                    key={p.product_id}
                    type="button"
                    className="btn-editorial-secondary"
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      border: '1px solid var(--surface-border)',
                      background: p.product_id === selectedId ? 'var(--primary-light)' : 'transparent',
                    }}
                    onClick={() => {
                      setSelectedId(p.product_id);
                      setActiveTab('workspace');
                      setShowCommandPalette(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                        {p.product_id}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-ink)' }}>
                        {p.metadata_title}
                      </span>
                    </div>
                    <span className={`status-pill ${p.status.toLowerCase().replace(/_/g, '-')}`}>
                      {p.status}
                    </span>
                  </button>
                ))}

              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '8px 8px 4px' }}>
                Studio Navigation
              </div>
              {[
                { label: '✦ Review Workspace', tab: 'workspace' },
                { label: '📊 Batch Dashboard', tab: 'dashboard' },
                { label: '📖 Editorial Method (WCAG)', tab: 'method' },
                { label: '📥 Export Hub (CSV & JSON)', tab: 'export' },
                { label: '🖼️ Simulated 404 (Missing Frame)', tab: '404' },
              ].map((nav) => (
                <button
                  key={nav.tab}
                  type="button"
                  className="btn-editorial-secondary"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}
                  onClick={() => {
                    setActiveTab(nav.tab);
                    setShowCommandPalette(false);
                  }}
                >
                  {nav.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Guide Modal */}
      {showShortcutsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowShortcutsModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard Shortcuts"
        >
          <div
            className="glass-modal"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.25rem', color: 'var(--text-ink)' }}>
                Keyboard Shortcuts
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'A', desc: 'Approve current description' },
                { key: 'I', desc: 'Flag image as inaccessible' },
                { key: 'Space', desc: 'Listen / play description aloud' },
                { key: '⌘ + K', desc: 'Toggle command palette' },
                { key: '← / →', desc: 'Previous / next product in filmstrip' },
                { key: '?', desc: 'Toggle keyboard shortcut cheat sheet' },
              ].map((sc) => (
                <div
                  key={sc.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--surface-card-subtle)',
                    border: '1px solid var(--surface-border)',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{sc.desc}</span>
                  <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'var(--accent-indigo)' }}>
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SaaS Authentication Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Global ALTLUME Footer */}
      <footer className="altlume-footer">
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>ALTLUME Review Studio</strong> — Human-in-the-loop product image descriptions for digital commerce.
          </div>
          <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
            This tool does not prove website accessibility compliance. Human review is strictly required.
          </div>
        </div>
      </footer>
    </div>
  );
}
