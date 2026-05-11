import React, { useState, useEffect } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../authConfig';
import './Auth.css';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

export default function Auth({ onAuthenticated }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    initializeMsal();
  }, []);

  const initializeMsal = async () => {
    try {
      await msalInstance.initialize();

      // Handle redirect response after Microsoft redirects back
      const response = await msalInstance.handleRedirectPromise();

      if (response) {
        // Successfully authenticated via redirect
        console.log('✅ Authentication successful via redirect');
        handleAuthenticationSuccess(response);
        return;
      }

      // Check if user is already logged in
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        console.log('✅ User already logged in');
        // Try to get token silently
        try {
          const tokenResponse = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
          });
          handleAuthenticationSuccess(tokenResponse);
          return;
        } catch (silentError) {
          console.log('⚠️ Silent token acquisition failed, user needs to login again');
        }
      }

      // No existing session, show login button
      setLoading(false);
    } catch (error) {
      console.error('❌ MSAL initialization error:', error);
      setError('Failed to initialize authentication');
      setLoading(false);
    }
  };

  const handleAuthenticationSuccess = (response) => {
    console.log('🎉 Authentication response:', response);

    // Extract user information from the JWT token
    const account = response.account || msalInstance.getAllAccounts()[0];

    let userId = account.homeAccountId;
    let userName = account.name;
    let userEmail = account.username;

    // Decode JWT to get OID (Object ID) and see claims
    if (response.idToken) {
      const tokenParts = response.idToken.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('📜 JWT Payload:', payload);
      console.log('⏰ Token expires:', new Date(payload.exp * 1000));

      // Use OID from token for backend consistency
      userId = payload.oid || account.homeAccountId;
      userName = payload.name || account.name;
      userEmail = payload.preferred_username || account.username;
    }

    // Pass authentication data to parent
    onAuthenticated({
      token: response.idToken, // Backend expects idToken, not accessToken
      user: {
        userId: userId,
        name: userName,
        email: userEmail,
      }
    });
  };

  const handleMicrosoftSignIn = async () => {
    setLoggingIn(true);
    setError('');

    try {
      console.log('🔐 Starting Microsoft authentication...');

      // Use redirect flow (more reliable than popup)
      await msalInstance.loginRedirect(loginRequest);

      // Note: Code after loginRedirect won't execute as page will redirect
    } catch (error) {
      console.error('❌ Login error:', error);

      let errorMessage = 'Failed to sign in with Microsoft';

      if (error.errorCode === 'user_cancelled') {
        errorMessage = 'Sign-in was cancelled';
      } else if (error.errorCode === 'interaction_in_progress') {
        errorMessage = 'Sign-in already in progress. Please complete or refresh the page.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-root">
        <div className="auth-bg-pattern" />
        <div className="auth-center">
          <div className="auth-card animate-in" style={{ textAlign: 'center' }}>
            <div className="auth-logo">💬</div>
            <p style={{ color: '#8696a0', marginTop: '20px' }}>Loading authentication...</p>
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
            <p className="auth-tagline">
              Sign in with your <strong>Microsoft account</strong>
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <button
            className="auth-btn primary"
            onClick={handleMicrosoftSignIn}
            disabled={loggingIn}
            style={{ marginTop: '20px' }}
          >
            {loggingIn ? 'Signing in...' : '🔐 Sign in with Microsoft'}
          </button>

          <p style={{
            marginTop: '20px',
            fontSize: '13px',
            color: '#8696a0',
            textAlign: 'center'
          }}>
            Secured with Azure AD JWT Authentication
          </p>
        </div>
      </div>
    </div>
  );
}
