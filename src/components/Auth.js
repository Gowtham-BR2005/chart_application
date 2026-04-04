import React, { useState, useRef, useEffect } from 'react';
import './Auth.css';

// ── icons ──────────────────────────────────────────────────────────────────
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);
const EyeIcon = ({ open }) => open ? (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
  </svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
  </svg>
);

// ── reusable field ──────────────────────────────────────────────────────────
function Field({ icon, type = 'text', placeholder, value, onChange, rightSlot, error }) {
  return (
    <div className={`auth-field ${error ? 'has-error' : ''}`}>
      <span className="auth-field-icon">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete="off"
      />
      {rightSlot && <span className="auth-field-right">{rightSlot}</span>}
      {error && <p className="auth-field-error">{error}</p>}
    </div>
  );
}

// ── LOGIN ───────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, onGoSignUp }) {
  const [mode, setMode] = useState('uid'); // 'uid' | 'phone'
  const [uid, setUid] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (mode === 'uid') {
      if (!uid.trim()) e.uid = 'User ID is required';
      if (!password) e.password = 'Password is required';
    } else {
      if (!/^\d{10}$/.test(phone.trim())) e.phone = 'Enter a valid 10-digit number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (mode === 'uid') onLogin({ type: 'uid', uid, password });
    else onLogin({ type: 'phone', phone });
  };

  return (
    <div className="auth-card animate-in">
      <div className="auth-brand">
        <span className="auth-logo">💬</span>
        <h1>WhatsApp</h1>
        <p className="auth-tagline">Sign in to continue</p>
      </div>

      <div className="auth-tabs">
        <button className={mode === 'uid' ? 'active' : ''} onClick={() => { setMode('uid'); setErrors({}); }}>
          User ID
        </button>
        <button className={mode === 'phone' ? 'active' : ''} onClick={() => { setMode('phone'); setErrors({}); }}>
          Mobile Number
        </button>
      </div>

      <div className="auth-fields">
        {mode === 'uid' ? (
          <>
            <Field icon={<UserIcon />} placeholder="Enter your User ID" value={uid} onChange={setUid} error={errors.uid} />
            <Field
              icon={<LockIcon />}
              type={showPwd ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              rightSlot={
                <button className="eye-toggle" onClick={() => setShowPwd(p => !p)}>
                  <EyeIcon open={showPwd} />
                </button>
              }
            />
            <div className="auth-forgot"><a href="#!">Forgot password?</a></div>
          </>
        ) : (
          <div className="phone-field-wrap">
            <span className="phone-prefix">+91</span>
            <Field icon={<PhoneIcon />} placeholder="10-digit mobile number" value={phone} onChange={setPhone} error={errors.phone} />
          </div>
        )}
      </div>

      <button className="auth-btn primary" onClick={handleSubmit}>
        {mode === 'uid' ? 'Sign In' : 'Send OTP'}
      </button>

      <p className="auth-switch">
        Don't have an account?{' '}
        <button onClick={onGoSignUp}>Create account</button>
      </p>
    </div>
  );
}

// ── OTP ─────────────────────────────────────────────────────────────────────
function OtpPage({ phone, onVerify, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
    const t = setInterval(() => setResendTimer(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = text.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(next);
    refs.current[Math.min(text.length, 5)]?.focus();
    e.preventDefault();
  };

  const verify = () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the 6-digit OTP'); return; }
    // demo: any 6-digit code works
    onVerify(code);
  };

  return (
    <div className="auth-card animate-in">
      <button className="auth-back" onClick={onBack}><BackIcon /></button>
      <div className="auth-brand">
        <span className="auth-logo otp-pulse">📱</span>
        <h1>Verify Phone</h1>
        <p className="auth-tagline">
          We sent a 6-digit code to<br />
          <strong>+91 {phone}</strong>
        </p>
      </div>

      <div className="otp-boxes" onPaste={handlePaste}>
        {otp.map((d, i) => (
          <input
            key={i}
            ref={el => refs.current[i] = el}
            className={`otp-box ${d ? 'filled' : ''}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
          />
        ))}
      </div>
      {error && <p className="otp-error">{error}</p>}

      <button className="auth-btn primary" onClick={verify}>Verify OTP</button>

      <div className="otp-resend">
        {resendTimer > 0 ? (
          <span>Resend OTP in <strong>{resendTimer}s</strong></span>
        ) : (
          <button onClick={() => setResendTimer(30)}>Resend OTP</button>
        )}
      </div>
    </div>
  );
}

// ── SIGN UP STEP 1 ──────────────────────────────────────────────────────────
function SignUpStep1({ onNext, onGoLogin }) {
  const [uid, setUid] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : /[A-Z]/.test(password) && /\d/.test(password) ? 3 : 2;

  const validate = () => {
    const e = {};
    if (!uid.trim() || uid.length < 4) e.uid = 'User ID must be at least 4 characters';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="auth-card animate-in">
      <div className="auth-brand">
        <span className="auth-logo">💬</span>
        <h1>Create Account</h1>
        <p className="auth-tagline">Step 1 of 2 — Set your credentials</p>
      </div>

      <div className="auth-steps-indicator">
        <div className="step active"><CheckIcon /></div>
        <div className="step-line" />
        <div className="step">2</div>
      </div>

      <div className="auth-fields">
        <Field icon={<UserIcon />} placeholder="Choose a User ID (min 4 chars)" value={uid} onChange={setUid} error={errors.uid} />
        <Field
          icon={<LockIcon />}
          type={showPwd ? 'text' : 'password'}
          placeholder="Create password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          rightSlot={
            <button className="eye-toggle" onClick={() => setShowPwd(p => !p)}>
              <EyeIcon open={showPwd} />
            </button>
          }
        />
        {password && (
          <div className="strength-bar">
            <div className={`strength-fill s${strength}`} />
            <span>{['', 'Weak', 'Good', 'Strong'][strength]}</span>
          </div>
        )}
        <Field
          icon={<LockIcon />}
          type={showPwd ? 'text' : 'password'}
          placeholder="Confirm password"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
        />
      </div>

      <button className="auth-btn primary" onClick={() => validate() && onNext({ uid, password })}>
        Continue
      </button>
      <p className="auth-switch">
        Already have an account? <button onClick={onGoLogin}>Sign in</button>
      </p>
    </div>
  );
}

// ── SIGN UP STEP 2 ──────────────────────────────────────────────────────────
function SignUpStep2({ onSubmit, onBack }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    if (!/^\d{10}$/.test(phone.trim())) { setError('Enter a valid 10-digit number'); return false; }
    setError('');
    return true;
  };

  return (
    <div className="auth-card animate-in">
      <button className="auth-back" onClick={onBack}><BackIcon /></button>
      <div className="auth-brand">
        <span className="auth-logo">📱</span>
        <h1>Add Mobile Number</h1>
        <p className="auth-tagline">Step 2 of 2 — We'll verify your number</p>
      </div>

      <div className="auth-steps-indicator">
        <div className="step done"><CheckIcon /></div>
        <div className="step-line done" />
        <div className="step active"><CheckIcon /></div>
      </div>

      <div className="auth-fields">
        <div className="phone-field-wrap">
          <span className="phone-prefix">+91</span>
          <Field icon={<PhoneIcon />} placeholder="10-digit mobile number" value={phone} onChange={setPhone} error={error} />
        </div>
      </div>

      <button className="auth-btn primary" onClick={() => validate() && onSubmit(phone)}>
        Send OTP
      </button>
    </div>
  );
}

// ── SUCCESS ─────────────────────────────────────────────────────────────────
function SuccessScreen({ onEnter }) {
  return (
    <div className="auth-card animate-in success-card">
      <div className="success-ring">
        <span>✓</span>
      </div>
      <h2>You're all set!</h2>
      <p>Your account has been verified successfully.</p>
      <button className="auth-btn primary" onClick={onEnter}>Open WhatsApp</button>
    </div>
  );
}

// ── MAIN AUTH CONTROLLER ─────────────────────────────────────────────────────
export default function Auth({ onAuthenticated }) {
  // screens: login | otp | signup1 | signup2 | signup-otp | success
  const [screen, setScreen] = useState('login');
  const [pendingPhone, setPendingPhone] = useState('');
  const [signupData, setSignupData] = useState(null);

  const handleLogin = ({ type, phone }) => {
    if (type === 'phone') { setPendingPhone(phone); setScreen('otp'); }
    else setScreen('success'); // uid login → straight in (demo)
  };

  const handleSignup1Next = (data) => { setSignupData(data); setScreen('signup2'); };

  const handleSignup2Submit = (phone) => { setPendingPhone(phone); setScreen('signup-otp'); };

  const handleOtpVerify = () => setScreen('success');

  return (
    <div className="auth-root">
      <div className="auth-bg-pattern" />
      <div className="auth-center">
        {screen === 'login' && (
          <LoginPage onLogin={handleLogin} onGoSignUp={() => setScreen('signup1')} />
        )}
        {screen === 'otp' && (
          <OtpPage phone={pendingPhone} onVerify={handleOtpVerify} onBack={() => setScreen('login')} />
        )}
        {screen === 'signup1' && (
          <SignUpStep1 onNext={handleSignup1Next} onGoLogin={() => setScreen('login')} />
        )}
        {screen === 'signup2' && (
          <SignUpStep2 onSubmit={handleSignup2Submit} onBack={() => setScreen('signup1')} />
        )}
        {screen === 'signup-otp' && (
          <OtpPage phone={pendingPhone} onVerify={handleOtpVerify} onBack={() => setScreen('signup2')} />
        )}
        {screen === 'success' && (
          <SuccessScreen onEnter={onAuthenticated} />
        )}
      </div>
    </div>
  );
}
