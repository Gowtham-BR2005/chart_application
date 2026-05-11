import React, { useState, useEffect, useCallback } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../authConfig';
import { findUserById, registerUser } from '../chatService';
import './Auth.css';


const msal = new PublicClientApplication(msalConfig);

export default function Auth({ onAuthenticated }) {
  const [step, setStep] = useState('loading');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkLogin() {
      await msal.initialize();
      const accounts = msal.getAllAccounts();
      if (accounts.length > 0) {
        try {
          const result = await msal.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
          });
          await checkUserExists(result.accessToken);
        } catch {
          setStep('login');
        }
      } else {
        setStep('login');
      }
    }
    checkLogin();
  }, []);

const checkUserExists = useCallback(async (token) => {
  const data = await findUserById(token);
  if (data?.user) {
    onAuthenticated({ token, user: data.user });
  } else {
    window._authToken = token;
    setStep('username');
  }
}, [onAuthenticated]);

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      await msal.initialize();
      const result = await msal.loginPopup(loginRequest);
      await checkUserExists(result.accessToken);
    } catch (e) {
      setError('Login failed. Please try again.');
    }
    setLoading(false);
  }

  async function handleRegister() {
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await registerUser(window._authToken, username.trim());
      if (data.error === 'Username already taken') {
        setError('Username taken, try another');
        setLoading(false);
        return;
      }
      onAuthenticated({ token: window._authToken, user: data.user });
    } catch {
      setError('Something went wrong. Try again.');
    }
    setLoading(false);
  }

  if (step === 'loading') {
    return (
      <div className="auth-root">
        <div className="auth-bg-pattern" />
        <div className="auth-center">
          <div className="auth-card animate-in" style={{ textAlign: 'center' }}>
            <div className="auth-logo">💬</div>
            <p style={{ color: '#8696a0' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'username') {
    return (
      <div className="auth-root">
        <div className="auth-bg-pattern" />
        <div className="auth-center">
          <div className="auth-card animate-in">
            <div className="auth-brand">
              <span className="auth-logo">💬</span>
              <h1>Pick a username</h1>
              <p className="auth-tagline">This is how others will find you</p>
            </div>
            <div className="auth-fields">
              <div className="auth-field">
                <input
                  type="text"
                  placeholder="e.g. gowtham"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  autoFocus
                />
              </div>
              {error && <p style={{ color: '#ef5350', fontSize: 13 }}>{error}</p>}
            </div>
            <button className="auth-btn primary" onClick={handleRegister} disabled={loading}>
              {loading ? 'Setting up...' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-root">
      <div className="auth-bg-pattern" />
      <div className="auth-center">
        <div className="auth-card animate-in">
          <div className="auth-brand">
            <span className="auth-logo">💬</span>
            <h1>Chat App</h1>
            <p className="auth-tagline">Sign in with your <strong>Microsoft account</strong></p>
          </div>
          {error && <p style={{ color: '#ef5350', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="auth-btn primary" onClick={handleLogin} disabled={loading}>
            {loading ? 'Signing in...' : '🔐 Sign in with Microsoft'}
          </button>
        </div>
      </div>
    </div>
  );
}