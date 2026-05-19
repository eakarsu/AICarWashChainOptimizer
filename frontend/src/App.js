import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AIToolsPage from './pages/AIToolsPage';
import AIHistory from './pages/AIHistory';
import Webhooks from './pages/Webhooks';
import CustomViewsPage from './pages/CustomViewsPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData.user);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData.user));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) return null;

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/" element={
            user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
          <Route path="/feature/:featureKey" element={
            user ? <FeaturePage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
          <Route path="/ai-tools/:toolKey" element={
            user ? <AIToolsPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
          <Route path="/ai-history" element={
            user ? <AIHistory user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
          <Route path="/webhooks" element={
            user ? <Webhooks user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
          <Route path="/custom-views" element={
            user ? <CustomViewsPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
