import React, { useState } from 'react';

export function PaymentModal({
  isOpen,
  plan,
  user,
  onClose,
  onPaymentSuccess,
}) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardName, setCardName] = useState(user?.name || 'Alex Morgan');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('08/28');
  const [cvv, setCvv] = useState('888');
  const [zipCode, setZipCode] = useState('10001');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !plan) return null;

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
    if (error) setError('');
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setExpiry(val);
    if (error) setError('');
  };

  const handleCvvChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(val);
    if (error) setError('');
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!cardName.trim()) {
      setError('Please enter the name on your card.');
      return;
    }
    if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 12) {
      setError('Please enter a valid card number.');
      return;
    }
    if (!expiry.trim() || expiry.length < 4) {
      setError('Please enter expiration date (MM/YY).');
      return;
    }
    if (!cvv.trim() || cvv.length < 3) {
      setError('Please enter security CVV code.');
      return;
    }

    setIsProcessing(true);
    setError('');

    // Simulate realistic payment gateway processing
    setTimeout(() => {
      const generatedTxn = 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      setTransactionId(generatedTxn);
      setIsProcessing(false);
      setPaymentComplete(true);

      // Auto-advance to workspace after brief confirmation
      setTimeout(() => {
        onPaymentSuccess({
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
          paymentStatus: 'PAID',
          paidAmount: plan.price,
          transactionId: generatedTxn,
          paymentMethod: paymentMethod === 'card' ? 'Credit Card (•••• 4242)' : 'Instant UPI / Digital Pay',
          paidAt: new Date().toISOString(),
        });
      }, 1400);
    }, 1200);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card payment-checkout-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        {!isProcessing && !paymentComplete && (
          <button
            type="button"
            onClick={onClose}
            className="payment-modal-close"
            aria-label="Close payment modal"
          >
            ✕
          </button>
        )}

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span className="brand-pill" style={{ marginBottom: '8px', display: 'inline-block' }}>
            🔒 SECURE CHECKOUT
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-ink)', margin: '0 0 6px 0' }}>
            Complete Payment & Activate
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
            Unlock multi-format AI descriptions and view coverage for your catalogue.
          </p>
        </div>

        {/* Plan Summary Box */}
        <div className="checkout-summary-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <span className="checkout-plan-tag">SELECTED PLAN</span>
              <div style={{ fontWeight: 800, fontSize: '1.18rem', color: 'var(--text-ink)' }}>
                {plan.name}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Billed monthly • Cancel anytime
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                {plan.price}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>/ month</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Due Today:</span>
            <strong style={{ color: 'var(--text-ink)', fontSize: '0.92rem' }}>{plan.price} / month</strong>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--rose-bg)',
            border: '1px solid var(--rose-border)',
            color: 'var(--rose)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            marginBottom: '16px',
            fontWeight: 600,
          }}>
            ⚠️ {error}
          </div>
        )}

        {paymentComplete ? (
          <div className="payment-success-card">
            <div style={{ fontSize: '3rem', marginBottom: '10px', animation: 'scaleUp 0.3s ease-out' }}>
              🎉
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#059669', margin: '0 0 8px 0' }}>
              Payment Successful!
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              Your <strong>{plan.name}</strong> subscription is now active.
            </p>
            <div style={{ background: 'var(--surface-card-subtle)', border: '1px dashed #10B981', padding: '10px 14px', borderRadius: '8px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--text-ink)', marginBottom: '16px' }}>
              Receipt: <strong>{transactionId}</strong>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              ✦ Taking you to your review workspace dashboard...
            </div>
          </div>
        ) : (
          <form onSubmit={handlePay}>
            {/* Payment Method Switcher */}
            <div className="payment-method-selector">
              <button
                type="button"
                className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                💳 Credit / Debit Card
              </button>
              <button
                type="button"
                className={`payment-method-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                ⚡ UPI / Google Pay
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <>
                <div className="auth-form-group">
                  <label className="auth-form-label" htmlFor="pay-cardholder">Cardholder Name</label>
                  <input
                    id="pay-cardholder"
                    type="text"
                    required
                    className="auth-form-input"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Full name as shown on card"
                  />
                </div>

                <div className="auth-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="auth-form-label" htmlFor="pay-cardnumber">Card Number</label>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>VISA • MC • AMEX</span>
                  </div>
                  <input
                    id="pay-cardnumber"
                    type="text"
                    required
                    className="auth-form-input"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4242 4242 4242 4242"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="auth-form-group">
                    <label className="auth-form-label" htmlFor="pay-expiry">Expiry Date</label>
                    <input
                      id="pay-expiry"
                      type="text"
                      required
                      className="auth-form-input"
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div className="auth-form-group">
                    <label className="auth-form-label" htmlFor="pay-cvv">Security Code (CVV)</label>
                    <input
                      id="pay-cvv"
                      type="password"
                      maxLength={4}
                      required
                      className="auth-form-input"
                      value={cvv}
                      onChange={handleCvvChange}
                      placeholder="•••"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-form-label" htmlFor="pay-zip">Billing ZIP / Postal Code</label>
                  <input
                    id="pay-zip"
                    type="text"
                    required
                    className="auth-form-input"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="10001"
                  />
                </div>
              </>
            ) : (
              <div style={{ padding: '16px', background: 'var(--surface-card-subtle)', borderRadius: '10px', border: '1px solid var(--surface-border)', marginBottom: '16px' }}>
                <div className="auth-form-group" style={{ marginBottom: 0 }}>
                  <label className="auth-form-label" htmlFor="pay-upi">UPI ID / VPA</label>
                  <input
                    id="pay-upi"
                    type="text"
                    className="auth-form-input"
                    defaultValue="merchant@okhdfcbank"
                    placeholder="username@bank"
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    ✦ Instant approval via PhonePe, Google Pay, Paytm or BHIM.
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="auth-btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '16px',
                opacity: isProcessing ? 0.7 : 1,
                cursor: isProcessing ? 'wait' : 'pointer',
              }}
            >
              {isProcessing ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                  Processing Secure Payment...
                </>
              ) : (
                `🔒 Pay ${plan.price} & Activate Subscription →`
              )}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>🛡️ 256-Bit SSL Encrypted</span>
              <span>•</span>
              <span>PCI-DSS Level 1</span>
              <span>•</span>
              <span>Instant Invoice</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
