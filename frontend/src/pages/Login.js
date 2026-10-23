import React, { useState } from 'react';
import { login } from '../services/api';

const demoEmail = process.env.REACT_APP_DEMO_EMAIL || 'admin@carwash.com';
const demoPassword = process.env.REACT_APP_DEMO_PASSWORD || '';
const demoCredentialsEnabled = process.env.REACT_APP_ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true'
  && Boolean(demoPassword);

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signInWith = async (loginEmail, loginPassword) => {
    setError('');
    setLoading(true);
    try {
      const data = await login(loginEmail, loginPassword);
      onLogin(data);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signInWith(email, password);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="icon">🚗💦</div>
          <h1>SparkleWash AI</h1>
          <p>Car Wash Chain Optimizer Platform</p>
        </div>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="button"
            className="btn-autofill"
            onClick={() => {
              setEmail(demoEmail);
              setPassword(demoPassword);
              signInWith(demoEmail, demoPassword);
            }}
            disabled={loading || !demoCredentialsEnabled}
            aria-label="Fill Demo Credentials"
          >
            Fill Demo Credentials
          </button>
          {!demoCredentialsEnabled && (
            <p style={{ color: '#94a3b8', fontSize: 12, margin: '8px 0 12px' }}>
              Demo credential filling is available only in an enabled local demo environment.
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
