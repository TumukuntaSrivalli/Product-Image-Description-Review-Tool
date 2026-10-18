import React, { useState } from 'react';

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
    ctaText: 'Choose Starter Plan',
    recommended: false,
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
    ctaText: 'Choose Pro Growth (Recommended)',
    recommended: true,
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
    ctaText: 'Choose Enterprise Plan',
    recommended: false,
  },
];

export function SubscriptionFlow({ onSelectPlan, currentPlanId = 'pro' }) {
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId);

  const handleChoose = (plan) => {
    setSelectedPlanId(plan.id);
    const payload = {
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      selectedAt: new Date().toISOString(),
    };
    localStorage.setItem('altlume_subscription', JSON.stringify(payload));
    onSelectPlan(payload);
  };

  return (
    <div className="subscription-container">
      <div className="subscription-header">
        <span className="brand-pill" style={{ marginBottom: '14px', display: 'inline-block' }}>
          EDITORIAL CATALOGUE PLANS
        </span>
        <h1>Select an Editorial Review Plan</h1>
        <p>
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
                {isSelected ? `✓ Current Plan: ${plan.name}` : plan.ctaText}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust Notice */}
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '600px', margin: '0 auto' }}>
        ✦ Prototype deployment notice: Plan selection is simulated and stored locally. No credit card required. All features are fully functional immediately.
      </div>
    </div>
  );
}
