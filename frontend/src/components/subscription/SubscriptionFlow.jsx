import React, { useState } from 'react';
import { PaymentModal } from './PaymentModal';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Core Features',
    price: '$0',
    period: '/ month',
    description: 'For individual sellers & boutique catalogues getting started with AI description validation.',
    features: [
      'Up to 50 product image reviews / month',
      'Single-view alt-text generator',
      'Deterministic Review Guard claim check',
      'Rule-based fallback descriptions',
      'Standard CSV & JSON export',
      'Community & documentation support',
    ],
    ctaText: 'Choose Starter Plan (Free)',
    recommended: false,
    requiresPayment: false,
  },
  {
    id: 'pro',
    name: 'Pro Growth',
    badge: 'MOST POPULAR • RECOMMENDED',
    price: '$49',
    period: '/ month',
    description: 'For D2C brands & marketplace sellers who need multi-view coverage and multi-format copy.',
    features: [
      'Unlimited product image reviews',
      'Multi-format descriptions (Short, Bullets, Marketplace, Card)',
      'Multi-image view angle grouping & coverage checklist',
      '10+ Regional language translations (Hindi, Telugu, Tamil, etc.)',
      'Real-time SQLite persistent audit logs & database viewer',
      'Human-in-the-loop batch sign-off workflow',
      'Priority Gemini candidate model routing',
    ],
    ctaText: 'Choose Pro Growth ($49/mo) →',
    recommended: true,
    requiresPayment: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Scale',
    badge: 'Custom Workflows',
    price: '$199',
    period: '/ month',
    description: 'For high-volume catalogue agencies and multi-brand retailers with custom taxonomy rules.',
    features: [
      'Everything in Pro Growth',
      'Custom category view requirements & checklists',
      'Dedicated API endpoint synchronization',
      'Custom unsupported claims dictionary per brand',
      'Unlimited team editor seats & audit trails',
      'Dedicated SLA & 24/7 priority support',
    ],
    ctaText: 'Choose Enterprise Plan ($199/mo) →',
    recommended: false,
    requiresPayment: true,
  },
];

export function SubscriptionFlow({ onSelectPlan, currentPlanId = 'pro', user = null }) {
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  const handleChoose = (plan) => {
    setSelectedPlanId(plan.id);

    // If it requires payment (e.g. Pro Plan $49 or Enterprise $199), open Payment Modal
    if (plan.requiresPayment) {
      setPendingPlan(plan);
      setShowPaymentModal(true);
      return;
    }

    // Free plan activation
    const payload = {
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      paymentStatus: 'FREE_TIER',
      selectedAt: new Date().toISOString(),
    };
    localStorage.setItem('altlume_subscription', JSON.stringify(payload));
    onSelectPlan(payload);
  };

  const handlePaymentSuccess = (paymentData) => {
    setShowPaymentModal(false);
    localStorage.setItem('altlume_subscription', JSON.stringify(paymentData));
    onSelectPlan(paymentData);
  };

  return (
    <div className="subscription-container">
      {/* Header section with high-contrast text and clean spacing */}
      <div className="subscription-header">
        <span className="brand-pill" style={{ marginBottom: '14px', display: 'inline-block' }}>
          ✦ EDITORIAL CATALOGUE PLANS
        </span>
        <h1 className="subscription-main-title">
          Select an Editorial Review Plan
        </h1>
        <p className="subscription-main-subtitle">
          Transparent pricing tailored to your catalogue volume. Every plan includes our deterministic Review Guard to prevent unverified marketing claims.
        </p>
      </div>

      <div className="pricing-grid">
        {PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <div
              key={plan.id}
              className={`pricing-card ${plan.recommended ? 'recommended' : ''}`}
            >
              {plan.recommended && (
                <div className="recommended-pill">
                  {plan.badge}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="plan-title">{plan.name}</div>
                  {!plan.recommended && plan.badge && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {plan.badge}
                    </span>
                  )}
                </div>

                <p className="plan-desc">{plan.description}</p>

                <div className="plan-price-row">
                  <span className="plan-price">{plan.price}</span>
                  <span className="plan-period">{plan.period}</span>
                </div>

                <ul className="plan-features-list">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="plan-feature-item">
                      <span className="plan-feature-icon">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className={plan.recommended ? 'btn-editorial-primary' : 'btn-editorial-secondary'}
                onClick={() => handleChoose(plan)}
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.92rem' }}
              >
                {isSelected ? `✓ Selected: ${plan.name}` : plan.ctaText}
              </button>
            </div>
          );
        })}
      </div>

      {/* Security & Guarantee Note */}
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.84rem', maxWidth: '640px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
        <span>🔒 Secure 256-Bit SSL Checkout</span>
        <span>•</span>
        <span>Monthly Billing</span>
        <span>•</span>
        <span>Cancel Anytime</span>
      </div>

      {/* Payment / Checkout Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        plan={pendingPlan}
        user={user}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
