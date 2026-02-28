// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const login   = useStore((s) => s.login);
  const profile = useStore((s) => s.profile);
  const navigate = useNavigate();
  const toast    = useToast();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulasi delay kecil agar tidak terlalu instant
    await new Promise((r) => setTimeout(r, 300));

    const ok = login(username.trim(), password);
    setLoading(false);

    if (ok) {
      toast('Selamat datang, ' + username + '! 👋', 'green');
      navigate('/', { replace: true });
    } else {
      setError('Username atau password salah!');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0A0F1E' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-10 border"
        style={{
          background: '#111827',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 overflow-hidden"
            style={{ background: '#2563EB' }}
          >
            {profile.logo ? (
              <img src={profile.logo} alt="logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-3xl">👕</span>
            )}
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            {profile.name || 'NUDIE JUICE'}
          </h1>
          <p className="text-xs text-white/30 uppercase tracking-widest mt-1">
            {profile.sub || 'Sistem Manajemen Konveksi'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-700 text-white/50 uppercase tracking-widest mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              autoComplete="off"
              autoFocus
              required
              className="w-full px-3.5 py-2.5 rounded-lg text-[13px] text-white placeholder-white/25 transition-all outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563EB';
                e.target.style.background  = 'rgba(37,99,235,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.background  = 'rgba(255,255,255,0.06)';
              }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-700 text-white/50 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              className="w-full px-3.5 py-2.5 rounded-lg text-[13px] text-white placeholder-white/25 transition-all outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563EB';
                e.target.style.background  = 'rgba(37,99,235,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.background  = 'rgba(255,255,255,0.06)';
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="px-3.5 py-2.5 rounded-lg text-[12px] text-red-300"
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-lg text-[14px] font-700 text-white transition-all disabled:opacity-60"
            style={{ background: '#2563EB' }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#1D4ED8')}
            onMouseLeave={(e) => (e.target.style.background = '#2563EB')}
          >
            {loading ? 'Memproses...' : 'Masuk →'}
          </button>
        </form>
      </div>
    </div>
  );
}
