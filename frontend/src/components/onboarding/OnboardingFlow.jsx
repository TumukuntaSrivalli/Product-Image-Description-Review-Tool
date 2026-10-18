import React, { useState } from 'react';

const QUESTIONS = [
  {
    id: 'businessType',
    stepNumber: 1,
    title: 'What best describes your business?',
    subtitle: 'This helps us configure catalog view checklists and validation rules for your team.',
    options: [
      { id: 'd2c', label: 'D2C / E-commerce brand', icon: '🛍️' },
      { id: 'marketplace', label: 'Marketplace seller', icon: '🏪' },
      { id: 'agency', label: 'E-commerce agency', icon: '💼' },
      { id: 'manufacturer', label: 'Manufacturer / wholesaler', icon: '🏭' },
      { id: 'individual', label: 'Individual seller', icon: '👤' },
    ],
  },
  {
    id: 'industry',
    stepNumber: 2,
    title: 'Which industry do you operate in?',
    subtitle: 'We will calibrate our deterministic claim filters and category view requirements.',
    options: [
      { id: 'fashion', label: 'Fashion and apparel', icon: '👗' },
      { id: 'footwear', label: 'Footwear', icon: '👟' },
      { id: 'beauty', label: 'Beauty and personal care', icon: '💄' },
      { id: 'electronics', label: 'Electronics', icon: '📱' },
      { id: 'home', label: 'Home and lifestyle', icon: '🛋️' },
      { id: 'other', label: 'Other', icon: '✨' },
    ],
  },
  {
    id: 'role',
    stepNumber: 3,
    title: 'What is your role?',
    subtitle: "We'll tailor your editorial review permissions and export defaults.",
    options: [
      { id: 'founder', label: 'Founder / Owner', icon: '🚀' },
      { id: 'catalogue_mgr', label: 'Marketing / Catalogue manager', icon: '📊' },
      { id: 'ecommerce_mgr', label: 'E-commerce manager', icon: '🛒' },
      { id: 'agency_provider', label: 'Agency / Service provider', icon: '🤝' },
      { id: 'other', label: 'Other', icon: '🎯' },
    ],
  },
];

export function OnboardingFlow({ onComplete, initialValues = {} }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    businessType: initialValues.businessType || '',
    industry: initialValues.industry || '',
    role: initialValues.role || '',
  });
  const [validationError, setValidationError] = useState('');

  const activeQuestion = QUESTIONS[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / QUESTIONS.length) * 100);

  const handleSelectOption = (optionLabel) => {
    setAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: optionLabel,
    }));
    setValidationError('');
  };

  const handleNext = () => {
    const selectedAnswer = answers[activeQuestion.id];
    if (!selectedAnswer) {
      setValidationError('Please select an option to continue.');
      return;
    }

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setValidationError('');
    } else {
      // Finished all 3 questions!
      const payload = {
        ...answers,
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem('altlume_onboarding', JSON.stringify(payload));
      onComplete(payload);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setValidationError('');
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Step Progress Bar */}
        <div className="onboarding-progress-bar-wrap">
          <div
            className="onboarding-progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="onboarding-step-badge">
            Step {currentStep + 1} of {QUESTIONS.length}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {progressPercent}% Complete
          </span>
        </div>

        {/* Question Header */}
        <h2 className="onboarding-question-title">{activeQuestion.title}</h2>
        <p className="onboarding-question-subtitle">{activeQuestion.subtitle}</p>

        {validationError && (
          <div
            style={{
              background: 'var(--rose-bg)',
              border: '1px solid var(--rose-border)',
              color: 'var(--rose)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              marginBottom: '20px',
            }}
          >
            {validationError}
          </div>
        )}

        {/* Selectable Options Grid */}
        <div className="onboarding-grid">
          {activeQuestion.options.map((opt) => {
            const isSelected = answers[activeQuestion.id] === opt.label;
            return (
              <div
                key={opt.id}
                className={`onboarding-option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectOption(opt.label)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelectOption(opt.label);
                  }
                }}
              >
                <div className="option-card-left">
                  <span className="option-card-icon">{opt.icon}</span>
                  <span className="option-card-text">{opt.label}</span>
                </div>
                <div className="option-radio-dot">
                  {isSelected && <div className="option-radio-dot-inner" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="onboarding-actions">
          {currentStep > 0 ? (
            <button
              type="button"
              className="btn-editorial-secondary"
              onClick={handleBack}
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            className="btn-editorial-primary"
            onClick={handleNext}
            style={{ padding: '10px 24px', fontSize: '0.88rem' }}
          >
            {currentStep === QUESTIONS.length - 1 ? 'Complete & View Plans →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
