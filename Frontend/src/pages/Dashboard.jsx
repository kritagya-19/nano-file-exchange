import React from 'react';
import { Link } from 'react-router-dom';
import { FiUploadCloud, FiUsers, FiMessageCircle, FiFileText, FiDatabase, FiShield, FiZap } from 'react-icons/fi';

export default function Dashboard({ user }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <div className="text-center mb-20">
        <div className="inline-flex items-center bg-white/20 backdrop-blur-xl px-8 py-4 rounded-3xl mb-8 shadow-xl">
          <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></span>
          <span className="text-indigo-100 font-semibold">✅ System Online - Local Storage Active</span>
        </div>
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-white via-indigo-100 to-purple-100 bg-clip-text text-transparent mb-6 drop-shadow-2xl leading-tight">
          Nano Exchange
        </h1>
        <p className="text-xl md:text-2xl lg:text-3xl text-indigo-100 max-w-4xl mx-auto mb-12 leading-relaxed opacity-90">
          Unlimited file transfers • Real-time group chat • Hybrid local/cloud storage • 
          Resumable uploads for large files
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-2xl mx-auto mb-16">
          <Link 
            to="/files" 
            className="btn-primary py-6 px-12 text-xl font-bold shadow-2xl hover:shadow-3xl w-full sm:w-auto flex items-center justify-center space-x-3 transform hover:-translate-y-2 transition-all duration-300"
          >
            <FiUploadCloud className="w-8 h-8" />
            <span>Upload Files</span>
          </Link>
          <Link 
            to="/groups" 
            className="glass-card p-6 px-10 text-white/90 font-semibold hover:bg-white/30 hover:text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl flex items-center justify-center space-x-3 w-full sm:w-auto border border-white/20"
          >
            <FiUsers className="w-7 h-7" />
            <span>Create Group</span>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto opacity-80">
          <div className="flex items-center justify-center p-4 bg-white/10 rounded-2xl">
            <FiDatabase className="w-8 h-8 mr-3 text-emerald-400" />
            <span className="font-mono text-sm">Local Storage</span>
          </div>
          <div className="flex items-center justify-center p-4 bg-white/10 rounded-2xl">
            <FiShield className="w-8 h-8 mr-3 text-blue-400" />
            <span className="font-mono text-sm">JWT Auth</span>
          </div>
          <div className="flex items-center justify-center p-4 bg-white/10 rounded-2xl">
            <FiZap className="w-8 h-8 mr-3 text-yellow-400" />
            <span className="font-mono text-sm">WebSocket</span>
          </div>
        </div>
      </div>

      {/* Feature Stats */}
      <div className="grid lg:grid-cols-3 gap-8 mb-24">
        <div className="glass-card p-10 text-center group hover:scale-[1.02] transition-all duration-300 hover:shadow-3xl">
          <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:rotate-6 transition-all duration-500">
            <FiUploadCloud className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-4xl lg:text-5xl font-black text-white mb-4 drop-shadow-lg">Unlimited</h3>
          <p className="text-indigo-200 text-xl mb-6 font-semibold">File Size</p>
          <p className="text-indigo-300 leading-relaxed">No compression. Chunked resumable uploads for any file size.</p>
        </div>

        <div className="glass-card p-10 text-center group hover:scale-[1.02] transition-all duration-300 hover:shadow-3xl">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:rotate-6 transition-all duration-500">
            <FiUsers className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-4xl lg:text-5xl font-black text-white mb-4 drop-shadow-lg">Real-time</h3>
          <p className="text-indigo-200 text-xl mb-6 font-semibold">Collaboration</p>
          <p className="text-indigo-300 leading-relaxed">Group chat with WebSocket. Share files instantly within teams.</p>
        </div>

        <div className="glass-card p-10 text-center group hover:scale-[1.02] transition-all duration-300 hover:shadow-3xl">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:rotate-6 transition-all duration-500">
            <FiDatabase className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-4xl lg:text-5xl font-black text-white mb-4 drop-shadow-lg">Hybrid</h3>
          <p className="text-indigo-200 text-xl mb-6 font-semibold">Storage</p>
          <p className="text-indigo-300 leading-relaxed">Local disk or cloud (AWS S3, MinIO). Automatic hybrid management.</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="text-center mb-24">
        <h2 className="text-5xl font-black text-white mb-16 drop-shadow-2xl">⚡ Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Link to="/files" className="glass-card group p-10 hover:bg-white/20 hover:shadow-3xl transition-all duration-300 hover:-translate-y-4 border-2 border-white/10">
            <FiFileText className="w-20 h-20 text-indigo-400 mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
            <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">📁 My Files</h3>
            <p className="text-indigo-300 mb-6 leading-relaxed">View all your uploaded files and downloads</p>
            <span className="text-indigo-400 font-bold group-hover:text-white transition-all">Open Files →</span>
          </Link>

          <Link to="/groups" className="glass-card group p-10 hover:bg-white/20 hover:shadow-3xl transition-all duration-300 hover:-translate-y-4 border-2 border-white/10">
            <FiUsers className="w-20 h-20 text-emerald-400 mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
            <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">👥 Groups</h3>
            <p className="text-indigo-300 mb-6 leading-relaxed">Create teams and share files with colleagues</p>
            <span className="text-emerald-400 font-bold group-hover:text-white transition-all">Manage Groups →</span>
          </Link>

          <Link to="/files" className="glass-card group p-10 hover:bg-white/20 hover:shadow-3xl transition-all duration-300 hover:-translate-y-4 border-2 border-white/10">
            <FiUploadCloud className="w-20 h-20 text-blue-400 mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
            <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">⬆️ Upload</h3>
            <p className="text-indigo-300 mb-6 leading-relaxed">Drag & drop any file. Resumable for large files</p>
            <span className="text-blue-400 font-bold group-hover:text-white transition-all">Start Upload →</span>
          </Link>

          <div className="glass-card group p-10 hover:bg-white/20 hover:shadow-3xl transition-all duration-300 hover:-translate-y-4 border-2 border-white/10 cursor-pointer" onClick={() => window.open('http://localhost:8000/docs', '_blank')}>
            <FiZap className="w-20 h-20 text-yellow-400 mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
            <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">🔧 API Docs</h3>
            <p className="text-indigo-300 mb-6 leading-relaxed">Interactive API documentation & testing</p>
            <span className="text-yellow-400 font-bold group-hover:text-white transition-all">Open Swagger →</span>
          </div>
        </div>
      </div>

      {/* Welcome User Section */}
      <div className="glass-card p-12 text-center max-w-4xl mx-auto">
        <h2 className="text-4xl font-black text-white mb-6">Welcome, {user.name}!</h2>
        <p className="text-xl text-indigo-200 mb-8 max-w-2xl mx-auto leading-relaxed">
          Your Nano Exchange account is ready. Start by uploading files or creating a group 
          to collaborate with your team. All files are securely stored with resumable uploads.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/files" className="btn-primary px-8 py-4 text-lg font-bold">🚀 Get Started</Link>
          <button 
            onClick={() => window.open('http://localhost:8000/docs', '_blank')}
            className="glass-card px-8 py-4 text-white font-semibold border border-white/30 hover:bg-white/20 transition-all rounded-xl"
          >
            📚 API Documentation
          </button>
        </div>
      </div>
    </div>
  );
}