import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

// Mirrors server/utils/password.js.
const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const isValidPassword = (password) => typeof password === 'string' && PASSWORD_REGEX.test(password);

function fieldStyle() {
  return { width:'100%', height:42, padding:'0 14px', border:'1.5px solid #E5E5EA', borderRadius:10, fontSize:14, background:'#FAFAFB', outline:'none', transition:'border-color .15s' };
}

function Field({ label, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:6 }}>{label}</label>
      <input
        style={fieldStyle()}
        onFocus={e => e.target.style.borderColor='#5B5BD6'}
        onBlur={e => e.target.style.borderColor='#E5E5EA'}
        {...props}
      />
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('mode') === 'reset' ? searchParams.get('token') : null;

  const [mode, setMode] = useState(resetToken ? 'reset' : 'signin'); // 'signin' | 'signup' | 'forgot' | 'reset'
  const [notice, setNotice] = useState('');
  const [orgName, setOrgName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === '1') setNotice('Your email is confirmed — sign in below.');
    if (searchParams.get('verifyError') === '1') setError('That confirmation link is invalid or has expired.');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showError = (err, fallback) => {
    const raw = err.response?.data?.error ?? err.message ?? fallback;
    setError(typeof raw === 'string' ? raw : (raw.message || JSON.stringify(raw)));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
        navigate('/');
      } else if (mode === 'signup') {
        if (!isValidPassword(password)) { setError(PASSWORD_RULE_MESSAGE); return; }
        const { data } = await api.post('/auth/signup', { orgName, name, email, password });
        if (data.emailSent) {
          setNotice(`We've sent a confirmation link to ${email}. Click it to finish creating your organization.`);
        } else {
          setNotice('Your organization is ready — sign in below. (No email server is configured on this instance, so your account was confirmed automatically.)');
        }
        setMode('signin');
      } else if (mode === 'forgot') {
        await api.post('/auth/forgot-password', { email });
        setNotice(`If ${email} has an account, we've sent a password reset link to it.`);
      } else if (mode === 'reset') {
        if (!isValidPassword(password)) { setError(PASSWORD_RULE_MESSAGE); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        await api.post('/auth/reset-password', { token: resetToken, password });
        setNotice('Password updated — sign in below.');
        setMode('signin');
      }
    } catch (err) {
      showError(err, 'Something went wrong. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setError(''); setNotice(''); setMode(m); };

  const titles = {
    signin: 'Sign in to your workspace',
    signup: 'Create your organization',
    forgot: 'Reset your password',
    reset: 'Choose a new password',
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
          <div style={{ color:'rgba(255,255,255,0.8)', marginTop:12, fontSize:14 }}>{titles[mode]}</div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'28px 36px 32px' }}>
          {mode === 'signup' && (
            <>
              <Field label="Organization name" type="text" required value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Acme Inc." />
              <Field label="Your name" type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
            </>
          )}

          {mode !== 'reset' && (
            <Field label="Email" type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
          )}

          {(mode === 'signin' || mode === 'signup') && (
            <Field label="Password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          )}

          {mode === 'reset' && (
            <>
              <Field label="New password" type="password" required autoFocus value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              <Field label="Confirm new password" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </>
          )}

          {mode === 'signin' && (
            <div style={{ textAlign:'right', marginTop:-8, marginBottom:20 }}>
              <a href="#" onClick={e => { e.preventDefault(); switchMode('forgot'); }} style={{ color:'#5B5BD6', fontSize:12.5, fontWeight:600, textDecoration:'none' }}>Forgot password?</a>
            </div>
          )}

          {notice && (
            <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'10px 14px', color:'#166534', fontSize:13, marginBottom:16, lineHeight:1.4 }}>
              {notice}
            </div>
          )}
          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', color:'#DC2626', fontSize:13, marginBottom:16 }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{ width:'100%', height:42, background:'#5B5BD6', color:'#fff', borderRadius:10, fontSize:14, fontWeight:700, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Working…' : { signin: 'Sign in', signup: 'Create organization', forgot: 'Send reset link', reset: 'Set new password' }[mode]}
          </button>

          {mode !== 'reset' && (
            <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#6B6B76' }}>
              {mode === 'signup' && <>Already have an account? <a href="#" onClick={e => { e.preventDefault(); switchMode('signin'); }} style={{ color:'#5B5BD6', fontWeight:600, textDecoration:'none' }}>Sign in</a></>}
              {mode === 'signin' && <>New here? <a href="#" onClick={e => { e.preventDefault(); switchMode('signup'); }} style={{ color:'#5B5BD6', fontWeight:600, textDecoration:'none' }}>Create an organization</a></>}
              {mode === 'forgot' && <>Remembered it? <a href="#" onClick={e => { e.preventDefault(); switchMode('signin'); }} style={{ color:'#5B5BD6', fontWeight:600, textDecoration:'none' }}>Sign in</a></>}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
