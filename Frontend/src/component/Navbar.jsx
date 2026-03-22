import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiUpload, FiUsers, FiMessageSquare } from 'react-icons/fi';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <nav className="glass-card shadow-2xl border-b-2 border-white/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <span className="text-2xl">🚀</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white drop-shadow-lg">Nano Exchange</h1>
              <p className="text-indigo-100 text-sm">Fast File Transfer</p>
            </div>
          </Link>

          <div className="flex items-center space-x-2">
            <div className="flex space-x-1 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
              <Link to="/files" className="p-2 hover:bg-white/30 rounded-xl transition-all" title="Files">
                <FiUpload className="w-5 h-5 text-white" />
              </Link>
              <Link to="/groups" className="p-2 hover:bg-white/30 rounded-xl transition-all" title="Groups">
                <FiUsers className="w-5 h-5 text-white" />
              </Link>
              <Link to="/chat/1" className="p-2 hover:bg-white/30 rounded-xl transition-all" title="Chat">
                <FiMessageSquare className="w-5 h-5 text-white" />
              </Link>
            </div>

            <div className="flex items-center space-x-3 ml-4">
              <div className="text-right">
                <p className="font-semibold text-white text-lg">{user.name}</p>
                <p className="text-indigo-100 text-sm">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="btn-primary px-4 py-2 text-sm font-bold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}