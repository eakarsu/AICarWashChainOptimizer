import React, { useState } from 'react';
import { login } from '../services/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      onLogin(data);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    setEmail('admin@carwash.com');
    setPassword('password123');
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
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <button onClick={handleAutoFill} className="btn-autofill">
          Demo Login - Click to Auto-Fill Credentials
        </button>
      </div>
    </div>
  );
}

export default Login;
