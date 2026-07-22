import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F4F4F6' }}>
      <div style={{ width:400, background:'#fff', borderRadius:18, boxShadow:'0 8px 40px rgba(20,20,30,0.12)', overflow:'hidden' }}>
        <div style={{ background:'#5B5BD6', padding:'32px 36px 28px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6L4 12l4 6"/>
                <path d="M16 6l4 6-4 6"/>
                <circle cx="12" cy="8" r="1.8" fill="#fff" stroke="none"/>
                <circle cx="12" cy="16" r="1.8" fill="#fff" stroke="none"/>
                <path d="M12 9.8v4.4" strokeWidth="1.6"/>
              </svg>
            </div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:20, letterSpacing:'-0.03em' }}>Flux</div>
          </div>
          <div style={{ color:'rgba(255,255,255,0.8)', marginTop:12, fontSize:14 }}>Sign in to your workspace</div>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:'28px 36px 32px' }}>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:6 }}>Email</label>
            <input
              type="email" required autoFocus
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ width:'100%', height:42, padding:'0 14px', border:'1.5px solid #E5E5EA', borderRadius:10, fontSize:14, background:'#FAFAFB', outline:'none', transition:'border-color .15s' }}
              onFocus={e => e.target.style.borderColor='#5B5BD6'}
              onBlur={e => e.target.style.borderColor='#E5E5EA'}
            />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:6 }}>Password</label>
            <input
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width:'100%', height:42, padding:'0 14px', border:'1.5px solid #E5E5EA', borderRadius:10, fontSize:14, background:'#FAFAFB', outline:'none', transition:'border-color .15s' }}
              onFocus={e => e.target.style.borderColor='#5B5BD6'}
              onBlur={e => e.target.style.borderColor='#E5E5EA'}
            />
          </div>
          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', color:'#DC2626', fontSize:13, marginBottom:16 }}>
              {error}
            </div>
          )}
          <button
            type="submit" disabled={loading}
            style={{ width:'100%', height:42, background:'#5B5BD6', color:'#fff', borderRadius:10, fontSize:14, fontWeight:700, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
