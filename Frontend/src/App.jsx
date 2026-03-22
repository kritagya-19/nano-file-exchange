import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import Groups from './pages/Groups';
import Chat from './pages/Chat';
import Navbar from './components/Navbar';

axios.defaults.baseURL = 'http://localhost:8000/api';
axios.defaults.headers.post['Content-Type'] = 'application/json';

function AppContent() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nano_token'));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Auto-login check
      axios.get('/auth/me').catch(() => logout());
    }
  }, [token]);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('nano_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nano_token');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  return (
    <>
      {user && <Navbar user={user} onLogout={logout} />}
      
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/files" element={user ? <Files /> : <Navigate to="/login" />} />
        <Route path="/groups" element={user ? <Groups /> : <Navigate to="/login" />} />
        <Route path="/chat/:groupId" element={user ? <Chat /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;