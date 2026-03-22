import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';

export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? { email: form.email, password: form.password }
        : form;

      const { data } = await axios.post(endpoint, body);
      onLogin(data.token, { id: data.user_id, name: form.name || 'User', email: form.email });
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass-card p-12 max-w-md w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl mx-auto mb-6 shadow-2xl flex items-center justify-center">
            <span className="text-4xl">🚀</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join Nano'}
          </h2>
          <p className="text-indigo-100">{isLogin ? 'Login to your account' : 'Create free account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="flex items-center space-x-2 text-white/90 mb-3 font-medium">
                <FiUser className="w-5 h-5" />
                <span>Name</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-4 pl-12 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div>
            <label className="flex items-center space-x-2 text-white/90 mb-3 font-medium">
              <FiMail className="w-5 h-5" />
              <span>Email</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-4 pl-12 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-white/90 mb-3 font-medium">
              <FiLock className="w-5 h-5" />
              <span>Password</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-4 pl-12 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 text-lg font-bold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="text-center mt-10">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-200 hover:text-white font-semibold underline transition-colors"
          >
            {isLogin ? 'Create new account' : 'Already have account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}