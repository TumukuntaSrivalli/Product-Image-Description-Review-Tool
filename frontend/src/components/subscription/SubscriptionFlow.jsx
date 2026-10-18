import React, { useState } from 'react';
import { PaymentModal } from './PaymentModal';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    badge: 'PLAN 01',
    price: '₹999',
    period: '/month',
    description: 'For individual online sellers',
    features: [
      '200 descriptions/month',
      'Multiple image uploads',
      'Custom length and tone',
      'Basic image-quality checks',
      'CSV/JSON export',
    ],
    ctaText: 'Choose Starter (₹999/mo) →',
    recommended: false,
    requiresPayment: true,
  },
  {
    id: 'growth',
    name: 'Growth',
    badge: 'PLAN 02 • RECOMMENDED',
    price: '₹4,499',
    period: '/month',
    description: 'For D2C brands and growing catalogues',
    features: [
      '1,000 descriptions/month',
      'Multilingual descriptions',
      'Voice-assisted editing',
      'Reviewer approval workflow',
      'Bulk processing and export',
    ],
    ctaText: 'Choose Growth (₹4,499/mo) →',
    recommended: true,
    requiresPayment: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    badge: 'PLAN 03',
    price: '₹11,999',
    period: '/month',
    description: 'For agencies and large sellers',
    features: [
      '3,000 descriptions/month',
      'Team collaboration and approvals',
      'Priority processing',
      'Brand-specific templates',
      'Advanced catalogue workflows',
    ],
    ctaText: 'Choose Agency (₹11,999/mo) →',
    recommended: false,
    requiresPayment: true,
  },
];

export function SubscriptionFlow({ onSelectPlan, currentPlanId = 'growth', user = null }) {
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
