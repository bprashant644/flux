import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import HRModule from './HR';

// ── Icons ──────────────────────────────────────────────────────────────────
const PATHS = {
  grid: ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
  users: [{ t:'circle', cx:9, cy:7, r:3.4 }, 'M2.5 20v-.8a6 6 0 0 1 12 0v.8', 'M17 4a3.4 3.4 0 0 1 0 6.6', 'M22 20v-.8a5 5 0 0 0-3.6-4.7'],
  kanban: ['M4 4h5v15H4z','M10 4h5v10h-5z','M16 4h5v7h-5z'],
  bell: ['M6 9a6 6 0 0 1 12 0c0 6 2.4 7.6 2.4 7.6H3.6S6 15 6 9','M10.4 21a2 2 0 0 0 3.2 0'],
  award: [{ t:'circle', cx:12, cy:8, r:5.4 }, 'M8.7 12.6L7.2 22l4.8-2.8L16.8 22l-1.5-9.4'],
  search: [{ t:'circle', cx:11, cy:11, r:7 }, 'M21 21l-4.3-4.3'],
  plus: ['M12 5v14','M5 12h14'],
  phone: ['M5 3h4l2 5-2.6 1.6a13 13 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2z'],
  mail: ['M3 5h18v14H3z','M3 6.5l9 6.5 9-6.5'],
  check: ['M5 12l4.5 4.5L19 7'],
  x: ['M6 6l12 12','M18 6L6 18'],
  chevron: ['M6 9l6 6 6-6'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  userplus: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', { t:'circle', cx:9, cy:7, r:4 }, 'M19 8v6', 'M22 11h-6'],
  trash: ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2'],
  pencil: ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  briefcase: ['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z','M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'],
  task: ['M9 11l3 3L22 4','M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  layers: ['M12 2L2 7l10 5 10-5-10-5z','M2 17l10 5 10-5','M2 12l10 5 10-5'],
  flag:   ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z','M4 22v-7'],
  link:   ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71','M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
  doc:    ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  clock:  [{ t:'circle', cx:12, cy:12, r:9 },'M12 7v5l3 3'],
  target: [{ t:'circle', cx:12, cy:12, r:9 },{ t:'circle', cx:12, cy:12, r:4 },'M12 3v1','M12 20v1','M3 12h1','M20 12h1'],
  zap:      ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
  bookmark: ['M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
  rotate:   ['M23 4v6h-6','M1 20v-6h6','M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
  sidebar:  ['M3 3h18v18H3z','M9 3v18'],
};

function Icon({ name, size = 18, color }) {
  const items = PATHS[name] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || 'currentColor'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {items.map((it, i) =>
        typeof it === 'object'
          ? <circle key={i} cx={it.cx} cy={it.cy} r={it.r} />
          : <path key={i} d={it} />
      )}
    </svg>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const ACCENT = '#5B5BD6';
const DEAL_STAGES = [
  { key:'prospect',    label:'Prospect',    color:'#64748B', bg:'#F1F5F9' },
  { key:'qualified',   label:'Qualified',   color:'#7C3AED', bg:'#F5F0FF' },
  { key:'proposal',    label:'Proposal',    color:'#2563EB', bg:'#EFF4FF' },
  { key:'negotiation', label:'Negotiation', color:'#EA580C', bg:'#FFF1E9' },
  { key:'won',         label:'Won',         color:'#16A34A', bg:'#ECFDF3' },
  { key:'lost',        label:'Lost',        color:'#DC2626', bg:'#FEF2F2' },
];
const STAGES = [
  { key:'new',         label:'New',          color:'#64748B', bg:'#F1F5F9' },
  { key:'contacted',   label:'Contacted',    color:'#2563EB', bg:'#EFF4FF' },
  { key:'followup',    label:'Follow-up',    color:'#D97706', bg:'#FEF6E7' },
  { key:'discussion',  label:'In Discussion',color:'#7C3AED', bg:'#F5F0FF' },
  { key:'negotiation', label:'Negotiation',  color:'#EA580C', bg:'#FFF1E9' },
  { key:'won',         label:'Won',          color:'#16A34A', bg:'#ECFDF3' },
  { key:'lost',        label:'Lost',         color:'#DC2626', bg:'#FEF2F2' },
];
const stageByKey = k => STAGES.find(s => s.key === k) || STAGES[0];

// ── Currency system ───────────────────────────────────────────────────────────
const CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee',   locale: 'en-IN', rate: 1      },
  USD: { symbol: '$', name: 'US Dollar',       locale: 'en-US', rate: 83.5   },
  GBP: { symbol: '£', name: 'Pound Sterling',  locale: 'en-GB', rate: 106.0  },
  EUR: { symbol: '€', name: 'Euro',            locale: 'de-DE', rate: 90.5   },
};
// rates: "1 unit of [currency] = rate INR". INR is always the storage base.
function getCurrencyConfig() {
  try { const s = localStorage.getItem('crm_currency'); if (s) return JSON.parse(s); } catch {}
  return { display: 'INR', rates: { INR: 1, USD: 83.5, GBP: 106.0, EUR: 90.5 } };
}
function saveCurrencyConfig(cfg) { localStorage.setItem('crm_currency', JSON.stringify(cfg)); }

// Convert stored INR value → display currency amount
function toDisplayAmt(v) {
  const cfg = getCurrencyConfig();
  const rate = cfg.rates[cfg.display] ?? CURRENCIES[cfg.display]?.rate ?? 1;
  return Number(v) / rate;
}
// Convert input currency amount → INR for storage
function toHomeAmt(v, fromCurrency) {
  const cfg = getCurrencyConfig();
  const rate = cfg.rates[fromCurrency] ?? CURRENCIES[fromCurrency]?.rate ?? 1;
  return Math.round(Number(v) * rate);
}

function fmtMoney(v) {
  if (v === null || v === undefined) return '—';
  const cfg = getCurrencyConfig();
  const sym = CURRENCIES[cfg.display]?.symbol || '₹';
  const amt = toDisplayAmt(v);
  if (cfg.display === 'INR') return sym + Math.round(amt).toLocaleString('en-IN');
  return sym + Math.round(amt).toLocaleString('en-US');
}
function fmtMoneyK(v) {
  if (!v && v !== 0) return fmtMoney(0);
  const cfg = getCurrencyConfig();
  const sym = CURRENCIES[cfg.display]?.symbol || '₹';
  const amt = toDisplayAmt(v);
  if (amt === 0) return sym + '0';
  const compact = (n, divisor, suffix) => sym + parseFloat((n / divisor).toFixed(2)).toString() + suffix;
  if (cfg.display === 'INR') {
    if (amt >= 10000000) return compact(amt, 10000000, ' Cr');
    if (amt >= 100000)   return compact(amt, 100000,   ' L');
    if (amt >= 1000)     return compact(amt, 1000,     'k');
    return sym + Math.round(amt);
  }
  if (amt >= 1000000) return compact(amt, 1000000, 'M');
  if (amt >= 1000)    return compact(amt, 1000,    'k');
  return sym + Math.round(amt);
}

// Inline input: amount in selected currency → converts to INR on change
function CurrencyInput({ homeValue, onHomeChange, placeholder, inpStyle }) {
  const cfg = getCurrencyConfig();
  const [cur, setCur] = useState(cfg.display);
  const homeToInput = (h, c) => {
    const r = cfg.rates[c] ?? CURRENCIES[c]?.rate ?? 1;
    const n = Math.round(Number(h) / r);
    return n > 0 ? String(n) : '';
  };
  const [raw, setRaw] = useState(() => homeToInput(homeValue, cfg.display));

  const handleCurChange = (c) => {
    setCur(c);
    setRaw(homeToInput(homeValue, c));
  };
  const handleValChange = (val) => {
    setRaw(val);
    const parsed = parseFloat(val) || 0;
    onHomeChange(toHomeAmt(parsed, cur));
  };
  const sym = CURRENCIES[cfg.display]?.symbol || '₹';
  const selStyle = { height: inpStyle?.height || 38, border:'1px solid #E5E5EA', borderRadius:9,
    background:'#FAFAFB', fontSize:13, padding:'0 6px', cursor:'pointer', outline:'none', color:'#3A3A44' };
  return (
    <div style={{ display:'flex', gap:5 }}>
      <input type="number" value={raw} onChange={e => handleValChange(e.target.value)}
        placeholder={placeholder || '0'} style={{ ...inpStyle, flex:1 }} />
      <select value={cur} onChange={e => handleCurChange(e.target.value)} style={selStyle}>
        {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}
function initials(name) { return (name || '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(); }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function diffDays(iso) {
  if (!iso) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(iso); d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}
function dueInfo(iso) {
  const n = diffDays(iso);
  if (n === null) return null;
  if (n < 0) return { label: Math.abs(n) + 'd overdue', tone:'overdue' };
  if (n === 0) return { label: 'Today', tone:'today' };
  if (n === 1) return { label: 'Tomorrow', tone:'soon' };
  if (n <= 7) return { label: `In ${n} days`, tone:'soon' };
  return { label: fmtDate(iso), tone:'later' };
}
const TONES = {
  overdue: { c:'#DC2626', bg:'#FEF2F2' },
  today:   { c:'#C2410C', bg:'#FFF1E9' },
  soon:    { c:'#2563EB', bg:'#EFF4FF' },
  later:   { c:'#6B6B76', bg:'#F2F2F5' },
};
function DuePill({ iso }) {
  const info = dueInfo(iso);
  if (!info) return <span style={{ fontSize:12, color:'#B0B0BA' }}>No date</span>;
  const tn = TONES[info.tone];
  return <span style={{ fontSize:11.5, fontWeight:700, padding:'4px 9px', borderRadius:7, whiteSpace:'nowrap', color:tn.c, background:tn.bg }}>{info.label}</span>;
}
function StagePill({ stage }) {
  const m = stageByKey(stage);
  return <span style={{ display:'inline-flex', fontSize:11.5, fontWeight:700, padding:'3px 9px', borderRadius:7, whiteSpace:'nowrap', color:m.color, background:m.bg }}>{m.label}</span>;
}
function Avatar({ name, color, size = 28 }) {
  return (
    <div style={{ width:size, height:size, flexShrink:0, borderRadius:'50%', background:color||'#5B5BD6', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize: size * 0.38, fontWeight:700 }}>
      {initials(name)}
    </div>
  );
}

// ── Effort / waiting / health helpers ────────────────────────────────────────
const EFFORT_DEFAULT_HOURS = { S:2, M:4, L:8 };
const CONTEXT_TAGS = { deep:{ label:'Deep work', color:'#7C3AED', bg:'#F5F3FF' }, calls:{ label:'Calls', color:'#0891B2', bg:'#ECFEFF' }, admin:{ label:'Admin', color:'#64748B', bg:'#F1F5F9' } };
function EffortBadge({ size, hours }) {
  if (!size && !hours) return null;
  const label = size ? `${size}${hours ? ` · ${+hours}h` : ''}` : `${+hours}h`;
  return <span title="Effort estimate" style={{ fontSize:11, fontWeight:700, padding:'3px 7px', borderRadius:6, whiteSpace:'nowrap', color:'#6B6B76', background:'#F2F2F5' }}>{label}</span>;
}
function ContextChip({ tag }) {
  const m = CONTEXT_TAGS[tag];
  if (!m) return null;
  return <span style={{ fontSize:11, fontWeight:700, padding:'3px 7px', borderRadius:6, whiteSpace:'nowrap', color:m.color, background:m.bg }}>{m.label}</span>;
}
function WaitingPill({ waitingOn, contactName, since }) {
  if (!waitingOn) return null;
  const days = since != null ? -diffDays(since) : null;
  const who = contactName || waitingOn;
  return (
    <span title={`Waiting since ${since ? fmtDate(since) : '—'}`}
      style={{ fontSize:11.5, fontWeight:700, padding:'4px 9px', borderRadius:7, whiteSpace:'nowrap', color:'#D97706', background:'#FEF6E7' }}>
      ⏳ {who}{days > 0 ? ` · ${days}d` : ''}
    </span>
  );
}
function computeHealth(p) {
  if (p.status !== 'active') return null;
  const open = +p.item_count || 0;
  const overdue = +p.overdue_count || 0;
  const triage = +p.triage_count || 0;
  const lastActivity = p.last_item_activity ? diffDays(p.last_item_activity) : null;
  if (open === 0) return { label:'Idle', color:'#6B6B76', bg:'#F2F2F5' };
  if (overdue >= 3 || overdue / open >= 1/3) return { label:'At risk', color:'#DC2626', bg:'#FEF2F2' };
  if (lastActivity !== null && lastActivity <= -14) return { label:'Stale', color:'#D97706', bg:'#FEF6E7' };
  if (triage >= 5) return { label:'Needs triage', color:'#D97706', bg:'#FEF6E7' };
  return { label:'On track', color:'#16A34A', bg:'#ECFDF3' };
}
function HealthBadge({ project }) {
  const h = computeHealth(project);
  if (!h) return null;
  return <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, whiteSpace:'nowrap', color:h.color, background:h.bg }}>{h.label}</span>;
}

// ── Project constants ────────────────────────────────────────────────────────
const SECTION_TYPE_META = {
  task:        { label:'Task',        color:'#2563EB', bg:'#EFF4FF',  icon:'task'   },
  context:     { label:'Context',     color:'#64748B', bg:'#F1F5F9',  icon:'doc'    },
  deliverable: { label:'Deliverable', color:'#16A34A', bg:'#ECFDF3',  icon:'flag'   },
  followup:    { label:'Follow-up',   color:'#EA580C', bg:'#FFF1E9',  icon:'clock'  },
};
const DOC_TYPES = ['SoW','Proposal','Report','Spreadsheet','Presentation','Contract','Calculations','Other'];
const DELIVERABLE_STATUSES = [
  { key:'draft',     label:'Draft',    color:'#64748B', bg:'#F1F5F9' },
  { key:'review',    label:'Review',   color:'#D97706', bg:'#FEF6E7' },
  { key:'approved',  label:'Approved', color:'#2563EB', bg:'#EFF4FF' },
  { key:'delivered', label:'Delivered',color:'#16A34A', bg:'#ECFDF3' },
];
const QUADRANT_META = [
  { imp:1, urg:1, label:'Do First',  sub:'Important · Urgent',     color:'#DC2626', bg:'#FEF2F2', lightBg:'#FFF8F8' },
  { imp:1, urg:0, label:'Schedule',  sub:'Important · Not Urgent',  color:'#2563EB', bg:'#EFF4FF', lightBg:'#F5F9FF' },
  { imp:0, urg:1, label:'Delegate',  sub:'Not Important · Urgent',  color:'#D97706', bg:'#FEF6E7', lightBg:'#FFFBF4' },
  { imp:0, urg:0, label:'Drop',      sub:'Not Important · Not Urgent',color:'#94A3B8',bg:'#F1F5F9',lightBg:'#F8FAFC' },
];

function SectionTypeBadge({ type }) {
  const m = SECTION_TYPE_META[type] || SECTION_TYPE_META.task;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10.5, fontWeight:700,
      padding:'2px 7px', borderRadius:5, color:m.color, background:m.bg, whiteSpace:'nowrap' }}>
      {m.label}
    </span>
  );
}
function DocTypeBadge({ type }) {
  if (!type) return null;
  return (
    <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 7px', borderRadius:5,
      color:'#64748B', background:'#F1F5F9', whiteSpace:'nowrap' }}>
      {type}
    </span>
  );
}
function IUBadge({ importance, urgency, onChangeI, onChangeU }) {
  const iLabel = importance === 1 ? 'HI' : importance === 0 ? 'LI' : '?I';
  const uLabel = urgency    === 1 ? 'HU' : urgency    === 0 ? 'LU' : '?U';
  const iColor = importance === 1 ? '#DC2626' : importance === 0 ? '#64748B' : '#C4C4CC';
  const uColor = urgency    === 1 ? '#D97706' : urgency    === 0 ? '#64748B' : '#C4C4CC';
  const cycle = v => v === null ? 1 : v === 1 ? 0 : null;
  return (
    <div style={{ display:'flex', gap:3 }}>
      <button onClick={e => { e.stopPropagation(); onChangeI && onChangeI(cycle(importance)); }}
        title={`Importance: ${importance === 1 ? 'High' : importance === 0 ? 'Low' : 'Unset'}`}
        style={{ fontSize:10, fontWeight:700, padding:'2px 5px', borderRadius:4,
          color:iColor, background:'#F2F2F5', border:'none', cursor:onChangeI?'pointer':'default' }}>
        {iLabel}
      </button>
      <button onClick={e => { e.stopPropagation(); onChangeU && onChangeU(cycle(urgency)); }}
        title={`Urgency: ${urgency === 1 ? 'High' : urgency === 0 ? 'Low' : 'Unset'}`}
        style={{ fontSize:10, fontWeight:700, padding:'2px 5px', borderRadius:4,
          color:uColor, background:'#F2F2F5', border:'none', cursor:onChangeU?'pointer':'default' }}>
        {uLabel}
      </button>
    </div>
  );
}

// ── Contact Detail Panel ────────────────────────────────────────────────────
function DetailPanel({ contact, onClose, onUpdate, onDealsChange, onDelete, currentUserId, isAdmin, users, customFieldDefs, linkedProjects, onOpenProject }) {
  const [activity, setActivity]     = useState([]);
  const [noteDraft, setNoteDraft]   = useState('');
  const [followupDate, setFollowupDate] = useState(contact.next_followup?.slice(0,10) || '');
  const [recurrence, setRecurrence] = useState(contact.recurrence || 'none');
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [copied, setCopied]         = useState(null);
  const [deals, setDeals]           = useState([]);
  const [tasks, setTasks]           = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [dealForm, setDealForm]     = useState({ title:'', value:'', stage:'prospect', expected_close:'' });
  const [taskForm, setTaskForm]     = useState({ title:'', due_date:'', assigned_to: currentUserId });
  const cf = contact.custom_fields || {};
  const [editForm, setEditForm]     = useState({
    name:     contact.name     || '',
    title:    contact.title    || '',
    company:  contact.company  || '',
    email:    contact.email    || '',
    phone:    contact.phone    || '',
    source:   contact.source   || 'Inbound',
    value:    contact.value    != null ? String(contact.value) : '',
    notes:    contact.notes    || '',
    owner_id: contact.owner_id || '',
    custom_fields: { ...cf },
  });
  const canEdit = isAdmin || contact.owner_id === currentUserId;
  const canDelete = isAdmin || contact.owner_id === currentUserId;

  const handleDelete = async () => {
    await api.delete(`/contacts/${contact.id}`);
    onDelete(contact.id);
  };

  const reloadDeals = () => api.get(`/deals?contact_id=${contact.id}`).then(r => setDeals(r.data)).catch(()=>{});
  const reloadTasks = () => api.get(`/tasks?contact_id=${contact.id}`).then(r => setTasks(r.data)).catch(()=>{});

  useEffect(() => {
    api.get(`/contacts/${contact.id}/activity`).then(r => setActivity(r.data)).catch(()=>{});
    reloadDeals();
    reloadTasks();
  }, [contact.id]);

  const setField = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  const copyToClipboard = (label, text) => {
    if (!text || text === '—') return;
    const done = () => { setCopied(label); setTimeout(() => setCopied(null), 2000); };
    const fallback = () => {
      const el = document.createElement('textarea');
      el.value = text; el.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(el); el.focus(); el.select();
      try { document.execCommand('copy'); done(); } catch {}
      document.body.removeChild(el);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(fallback);
    else fallback();
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) return;
    setSaving(true);
    try {
      await api.put(`/contacts/${contact.id}`, { ...editForm, value: parseInt(editForm.value) || 0 });
      setEditing(false);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditForm({
      name:     contact.name     || '',
      title:    contact.title    || '',
      company:  contact.company  || '',
      email:    contact.email    || '',
      phone:    contact.phone    || '',
      source:   contact.source   || 'Inbound',
      value:    contact.value    != null ? String(contact.value) : '',
      notes:    contact.notes    || '',
      owner_id: contact.owner_id || '',
      custom_fields: { ...(contact.custom_fields || {}) },
    });
    setEditing(false);
  };

  const addDeal = async () => {
    if (!dealForm.title.trim()) return;
    await api.post('/deals', { ...dealForm, contact_id: contact.id, value: parseInt(dealForm.value)||0 });
    setDealForm({ title:'', value:'', stage:'prospect', expected_close:'' });
    setShowDealForm(false);
    reloadDeals();
    onDealsChange && onDealsChange();
  };

  const addTask = async () => {
    if (!taskForm.title.trim()) return;
    await api.post('/tasks', { ...taskForm, contact_id: contact.id });
    setTaskForm({ title:'', due_date:'', assigned_to: currentUserId });
    setShowTaskForm(false);
    reloadTasks();
  };

  const toggleTask = async (t) => {
    await api.put(`/tasks/${t.id}`, { completed: !t.completed });
    reloadTasks();
  };

  const deleteDeal = async (id) => { await api.delete(`/deals/${id}`); reloadDeals(); onDealsChange && onDealsChange(); };
  const deleteTask = async (id) => { await api.delete(`/tasks/${id}`); reloadTasks(); };

  const addNote = async () => {
    if (!noteDraft.trim()) return;
    await api.post(`/contacts/${contact.id}/activity`, { type:'note', text:noteDraft.trim() });
    const r = await api.get(`/contacts/${contact.id}/activity`);
    setActivity(r.data);
    setNoteDraft('');
  };

  const logAction = async (type) => {
    const text = type === 'call' ? 'Logged a call' : 'Logged an email';
    await api.post(`/contacts/${contact.id}/activity`, { type, text });
    const r = await api.get(`/contacts/${contact.id}/activity`);
    setActivity(r.data);
    onUpdate();
  };

  const setStage = async (stage) => {
    await api.put(`/contacts/${contact.id}`, { stage });
    onUpdate();
  };

  const saveFollowup = async (date) => {
    await api.put(`/contacts/${contact.id}`, { next_followup: date || null });
    onUpdate();
  };

  const saveRecurrence = async (rule) => {
    setRecurrence(rule);
    await api.put(`/contacts/${contact.id}`, { recurrence: rule });
    onUpdate();
  };

  const completeFollowup = async () => {
    await api.put(`/contacts/${contact.id}`, { next_followup: null, last_contacted: new Date().toISOString().slice(0,10) });
    await api.post(`/contacts/${contact.id}/activity`, { type:'check', text:'Follow-up completed' });
    onUpdate();
    onClose();
  };

  const inpStyle = { width:'100%', height:38, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13, background:'#FAFAFB', outline:'none' };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.30)', animation:'fadeIn .15s' }} />
      <div style={{ position:'absolute', top:0, right:0, height:'100%', width:460, background:'#fff', boxShadow:'-8px 0 34px rgba(20,20,30,0.14)', animation:'slideIn .22s cubic-bezier(.2,.8,.2,1)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'20px 22px 16px', borderBottom:'1px solid #EEEEF1', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:13, minWidth:0 }}>
              <Avatar name={contact.name} color={contact.owner_color} size={46} />
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {editing ? editForm.name : contact.name}
                </div>
                <div style={{ fontSize:13, color:'#8A8A94', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {editing ? `${editForm.title} · ${editForm.company}` : `${contact.title} · ${contact.company}`}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              {canDelete && !editing && !confirmDelete && (
                <button onClick={() => setConfirmDelete(true)} title="Delete contact"
                  style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#DC2626', background:'#FEE2E2' }}>
                  <Icon name="trash" size={15} />
                </button>
              )}
              {confirmDelete && (
                <>
                  <span style={{ fontSize:12.5, color:'#DC2626', fontWeight:600, alignSelf:'center' }}>Delete?</span>
                  <button onClick={handleDelete}
                    style={{ height:32, padding:'0 12px', borderRadius:8, fontSize:13, fontWeight:700, background:'#DC2626', color:'#fff', border:'none', cursor:'pointer' }}>
                    Yes
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    style={{ height:32, padding:'0 12px', borderRadius:8, fontSize:13, fontWeight:600, color:'#5A5A66', background:'#F2F2F5', border:'none', cursor:'pointer' }}>
                    No
                  </button>
                </>
              )}
              {canEdit && !editing && !confirmDelete && (
                <button onClick={() => setEditing(true)} title="Edit contact"
                  style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#5B5BD6', background:'#EEEEFF' }}>
                  <Icon name="pencil" size={15} />
                </button>
              )}
              {editing && (
                <>
                  <button onClick={cancelEdit}
                    style={{ height:32, padding:'0 12px', borderRadius:8, fontSize:13, fontWeight:600, color:'#5A5A66', background:'#F2F2F5' }}>
                    Cancel
                  </button>
                  <button onClick={saveEdit} disabled={saving}
                    style={{ height:32, padding:'0 14px', borderRadius:8, fontSize:13, fontWeight:700, background:ACCENT, color:'#fff', opacity:saving?0.7:1 }}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </>
              )}
              {!confirmDelete && (
                <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#8A8A94' }}>
                  <Icon name="x" size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Stage buttons — hidden in edit mode */}
          {!editing && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:16 }}>
              {STAGES.map(s => {
                const active = contact.stage === s.key;
                return (
                  <button key={s.key} onClick={() => canEdit && setStage(s.key)}
                    style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, border: active ? 'none' : '1.5px solid #E5E5EA', background: active ? s.color : '#fff', color: active ? '#fff' : '#6B6B76', cursor: canEdit ? 'pointer' : 'default' }}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 22px' }}>

          {/* ── EDIT FORM ── */}
          {editing && (
            <div style={{ display:'flex', flexDirection:'column', gap:13, marginBottom:22 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#9A9AA4', textTransform:'uppercase', letterSpacing:'0.03em', marginBottom:4 }}>Full name *</div>
                  <input value={editForm.name} onChange={e => setField('name', e.target.value)} style={inpStyle} />
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#9A9AA4', textTransform:'uppercase', letterSpacing:'0.03em', marginBottom:4 }}>Job title</div>
                  <input value={editForm.title} onChange={e => setField('title', e.target.value)} style={inpStyle} />
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#9A9AA4', textTransform:'uppercase', letterSpacing:'0.03em', marginBottom:4 }}>Company</div>
                  <input value={editForm.company} onChange={e => setField('company', e.target.value)} style={inpStyle} />
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#9A9AA4', textTransform:'uppercase', letterSpacing:'0.03em', marginBottom:4 }}>Source</div>
                  <select value={editForm.source} onChange={e => setField('source', e.target.value)}
                    style={{ ...inpStyle, cursor:'pointer' }}>
                    {['Inbound','Referral','LinkedIn','Cold email','Webinar','Conference'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#9A9AA4', textTransform:'uppercase', letterSpacing:'0.03em', marginBottom:4 }}>Email</div>
                  <input type="email" value={editForm.email} onChange={e => setField('email', e.target.value)} style={inpStyle} />
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#9A9AA4', textTransform:'uppercase', letterSpacing:'0.03em', marginBottom:4 }}>Phone</div>
                  <input value={editForm.phone} onChange={e => setField('phone', e.target.value)} style={inpStyle} />
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#9A9AA4', textTransform:'uppercase', letterSpacing:'0.03em', marginBottom:4 }}>Deal value</div>
                  <CurrencyInput homeValue={editForm.value} onHomeChange={v => setField('value', v)} inpStyle={inpStyle}/>
                </div>
                {isAdmin && users?.length > 0 && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:'#9A9AA4', textTransform:'uppercase', letterSpacing:'0.03em', marginBottom:4 }}>Owner</div>
                    <select value={editForm.owner_id} onChange={e => setField('owner_id', e.target.value)}
                      style={{ ...inpStyle, cursor:'pointer' }}>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#9A9AA4', textTransform:'uppercase', letterSpacing:'0.03em', marginBottom:4 }}>Notes</div>
                <textarea value={editForm.notes} onChange={e => setField('notes', e.target.value)}
                  placeholder="Context, next steps…"
                  style={{ ...inpStyle, height:90, paddingTop:9, resize:'vertical' }} />
              </div>
              {/* Custom fields in edit mode */}
              {customFieldDefs?.length > 0 && (
                <>
                  <div style={{ gridColumn:'span 2', fontSize:12, fontWeight:700, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginTop:4 }}>Custom fields</div>
                  {customFieldDefs.map(def => (
                    <div key={def.id}>
                      <div style={{ fontSize:11, fontWeight:600, color:'#9A9AA4', textTransform:'uppercase', letterSpacing:'0.03em', marginBottom:4 }}>{def.label}</div>
                      {def.field_type === 'select' ? (
                        <select value={editForm.custom_fields?.[def.name] || ''} onChange={e => setField('custom_fields', { ...editForm.custom_fields, [def.name]: e.target.value })}
                          style={{ ...inpStyle, cursor:'pointer' }}>
                          <option value="">—</option>
                          {(def.options||[]).map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={def.field_type === 'number' ? 'number' : def.field_type === 'date' ? 'date' : 'text'}
                          value={editForm.custom_fields?.[def.name] || ''}
                          onChange={e => setField('custom_fields', { ...editForm.custom_fields, [def.name]: e.target.value })}
                          style={inpStyle} />
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── VIEW MODE ── */}
          {!editing && (
            <>
              {/* Fields grid — min-width fix prevents overflow */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 18px', marginBottom:22 }}>
                {[
                  { label:'Email',        value: contact.email    || '—', icon:'mail',     copy: contact.email    },
                  { label:'Phone',        value: contact.phone    || '—', icon:'phone',    copy: contact.phone    },
                  { label:'Company',      value: contact.company  || '—', icon:'settings'  },
                  { label:'Source',       value: contact.source   || '—', icon:'search'    },
                  { label:'Value',        value: fmtMoney(contact.value), icon:'award'     },
                  { label:'Last contact', value: fmtDate(contact.last_contacted), icon:'check' },
                ].map(f => (
                  <div key={f.label} style={{ display:'flex', alignItems:'flex-start', gap:8, minWidth:0 }}>
                    <span style={{ color:'#B0B0BA', marginTop:2, flexShrink:0 }}><Icon name={f.icon} size={15} /></span>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <div style={{ fontSize:11, color:'#9A9AA4', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.03em' }}>{f.label}</div>
                        {f.copy && (
                          <button onClick={() => copyToClipboard(f.label, f.copy)} title={`Copy ${f.label}`}
                            style={{ padding:'1px 5px', borderRadius:5, fontSize:11, fontWeight:600, border:'none', background: copied===f.label ? '#ECFDF3' : '#F2F2F5', color: copied===f.label ? '#16A34A' : '#9A9AA4', cursor:'pointer', lineHeight:1.4, transition:'background .2s,color .2s' }}>
                            {copied === f.label ? '✓' : 'copy'}
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize:13, fontWeight:500, marginTop:2, overflowWrap:'break-word', wordBreak:'break-all' }}>{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              {canEdit && (
                <div style={{ display:'flex', gap:8, marginBottom:22 }}>
                  {contact.next_followup && (
                    <button onClick={completeFollowup}
                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, height:38, background:'#ECFDF3', color:'#16A34A', borderRadius:9, fontSize:13, fontWeight:600, border:'1px solid #C7EBD5' }}>
                      <Icon name="check" size={15} />Done
                    </button>
                  )}
                  <button onClick={() => logAction('phone')}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, height:38, background:'#F5F5F8', color:'#3A3A44', borderRadius:9, fontSize:13, fontWeight:600 }}>
                    <Icon name="phone" size={15} />Log call
                  </button>
                  <button onClick={() => logAction('mail')}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, height:38, background:'#F5F5F8', color:'#3A3A44', borderRadius:9, fontSize:13, fontWeight:600 }}>
                    <Icon name="mail" size={15} />Log email
                  </button>
                </div>
              )}

              {/* Follow-up reminder */}
              {canEdit && (
                <div style={{ border:'1px solid #EEEEF1', borderRadius:12, padding:'13px 14px', marginBottom:22 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:700 }}>
                      <span style={{ color:'#C2410C' }}><Icon name="bell" size={15} /></span>
                      Follow-up reminder
                    </div>
                    {contact.next_followup && <DuePill iso={contact.next_followup} />}
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
                    <input type="date" value={followupDate}
                      onChange={e => { setFollowupDate(e.target.value); saveFollowup(e.target.value); }}
                      style={{ ...inpStyle, flex:1 }} />
                    {contact.next_followup && (
                      <button onClick={() => { setFollowupDate(''); saveFollowup(''); }}
                        style={{ height:38, padding:'0 14px', borderRadius:9, fontSize:12.5, fontWeight:600, color:'#8A8A94', background:'#F2F2F5' }}>
                        Clear
                      </button>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                    {[['Today',0],['Tomorrow',1],['3 days',3],['1 week',7]].map(([label, days]) => {
                      const d = new Date(); d.setDate(d.getDate() + days);
                      const iso = d.toISOString().slice(0,10);
                      return (
                        <button key={label} onClick={() => { setFollowupDate(iso); saveFollowup(iso); }}
                          style={{ padding:'4px 10px', borderRadius:7, fontSize:12, fontWeight:600, border:'1.5px solid #E5E5EA', background:'#fff', color:'#5A5A66' }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:12, borderTop:'1px solid #F0F0F3' }}>
                    <span style={{ fontSize:12.5, fontWeight:600, color:'#6B6B76', whiteSpace:'nowrap' }}>Repeat</span>
                    <select value={recurrence} onChange={e => saveRecurrence(e.target.value)}
                      style={{ flex:1, height:36, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13, background:'#FAFAFB', outline:'none', cursor:'pointer' }}>
                      {[['none','None'],['daily','Daily'],['weekly','Weekly'],['biweekly','Every 2 weeks'],['monthly','Monthly']].map(([k,l]) =>
                        <option key={k} value={k}>{l}</option>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* Custom fields (view) */}
              {customFieldDefs?.length > 0 && cf && Object.keys(cf).some(k => cf[k]) && (
                <div style={{ marginBottom:22 }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Custom fields</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 18px' }}>
                    {customFieldDefs.map(def => {
                      const val = cf[def.name];
                      if (!val) return null;
                      return (
                        <div key={def.id} style={{ minWidth:0 }}>
                          <div style={{ fontSize:11, color:'#9A9AA4', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.03em' }}>{def.label}</div>
                          <div style={{ fontSize:13, fontWeight:500, marginTop:2, wordBreak:'break-word' }}>{val}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes (view) */}
              <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>Notes</div>
              <div style={{ fontSize:13, color:'#5A5A66', lineHeight:1.5, background:'#FAFAFB', border:'1px solid #EEEEF1', borderRadius:10, padding:'11px 13px', marginBottom:22, wordBreak:'break-word' }}>
                {contact.notes || 'No notes.'}
              </div>
            </>
          )}

          {/* ── Deals ── */}
          <div style={{ marginBottom:22 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700 }}>Deals <span style={{ color:'#9A9AA4', fontWeight:500 }}>({deals.length})</span></div>
              {canEdit && (
                <button onClick={() => setShowDealForm(v => !v)}
                  style={{ height:26, padding:'0 10px', borderRadius:7, fontSize:12, fontWeight:700, background: showDealForm?'#F2F2F5':ACCENT, color: showDealForm?'#5A5A66':'#fff' }}>
                  {showDealForm ? 'Cancel' : '+ Add deal'}
                </button>
              )}
            </div>
            {showDealForm && (
              <div style={{ background:'#FAFAFB', border:'1px solid #EEEEF1', borderRadius:10, padding:'12px 13px', marginBottom:10 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div style={{ gridColumn:'span 2' }}>
                    <input value={dealForm.title} onChange={e => setDealForm(f=>({...f,title:e.target.value}))} placeholder="Deal title" style={{ width:'100%', height:36, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#fff', outline:'none' }} />
                  </div>
                  <CurrencyInput homeValue={dealForm.value} onHomeChange={v => setDealForm(f=>({...f,value:v}))} placeholder="Value" inpStyle={{ height:36, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#fff', outline:'none' }}/>
                  <select value={dealForm.stage} onChange={e => setDealForm(f=>({...f,stage:e.target.value}))}
                    style={{ height:36, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#fff', outline:'none', cursor:'pointer' }}>
                    {DEAL_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                  <input type="date" value={dealForm.expected_close} onChange={e => setDealForm(f=>({...f,expected_close:e.target.value}))} placeholder="Close date" style={{ height:36, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#fff', outline:'none' }} />
                </div>
                <button onClick={addDeal} style={{ height:32, padding:'0 14px', borderRadius:8, fontSize:13, fontWeight:700, background:ACCENT, color:'#fff' }}>Save deal</button>
              </div>
            )}
            {deals.length === 0 ? (
              <div style={{ fontSize:13, color:'#B0B0BA', fontStyle:'italic' }}>No deals yet.</div>
            ) : deals.map(d => {
              const ds = DEAL_STAGES.find(s=>s.key===d.stage)||DEAL_STAGES[0];
              return (
                <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 11px', background:'#FAFAFB', border:'1px solid #EEEEF1', borderRadius:10, marginBottom:6 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{d.title}</div>
                    {d.expected_close && <div style={{ fontSize:11.5, color:'#9A9AA4', marginTop:1 }}>Close: {fmtDate(d.expected_close)}</div>}
                  </div>
                  <span style={{ fontSize:12, fontFamily:"'IBM Plex Mono',monospace" }}>{fmtMoney(d.value)}</span>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:6, color:ds.color, background:ds.bg }}>{ds.label}</span>
                  {canEdit && <button onClick={() => deleteDeal(d.id)} style={{ color:'#C4C4CC', background:'none', border:'none', cursor:'pointer', padding:0 }}><Icon name="x" size={14}/></button>}
                </div>
              );
            })}
          </div>

          {/* ── Tasks ── */}
          <div style={{ marginBottom:22 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700 }}>Tasks <span style={{ color:'#9A9AA4', fontWeight:500 }}>({tasks.filter(t=>!t.completed).length} open)</span></div>
              {canEdit && (
                <button onClick={() => setShowTaskForm(v => !v)}
                  style={{ height:26, padding:'0 10px', borderRadius:7, fontSize:12, fontWeight:700, background: showTaskForm?'#F2F2F5':ACCENT, color: showTaskForm?'#5A5A66':'#fff' }}>
                  {showTaskForm ? 'Cancel' : '+ Add task'}
                </button>
              )}
            </div>
            {showTaskForm && (
              <div style={{ background:'#FAFAFB', border:'1px solid #EEEEF1', borderRadius:10, padding:'12px 13px', marginBottom:10 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div style={{ gridColumn:'span 2' }}>
                    <input value={taskForm.title} onChange={e => setTaskForm(f=>({...f,title:e.target.value}))} placeholder="Task title" style={{ width:'100%', height:36, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#fff', outline:'none' }} />
                  </div>
                  <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(f=>({...f,due_date:e.target.value}))} style={{ height:36, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#fff', outline:'none' }} />
                  {users?.length > 0 && (
                    <select value={taskForm.assigned_to} onChange={e => setTaskForm(f=>({...f,assigned_to:e.target.value}))}
                      style={{ height:36, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#fff', outline:'none', cursor:'pointer' }}>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  )}
                </div>
                <button onClick={addTask} style={{ height:32, padding:'0 14px', borderRadius:8, fontSize:13, fontWeight:700, background:ACCENT, color:'#fff' }}>Save task</button>
              </div>
            )}
            {tasks.length === 0 ? (
              <div style={{ fontSize:13, color:'#B0B0BA', fontStyle:'italic' }}>No tasks yet.</div>
            ) : tasks.map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 11px', background: t.completed?'#F8F8FB':'#FAFAFB', border:'1px solid #EEEEF1', borderRadius:10, marginBottom:6, opacity: t.completed?0.6:1 }}>
                <button onClick={() => toggleTask(t)}
                  style={{ width:20, height:20, borderRadius:5, border:'2px solid', borderColor: t.completed?'#16A34A':'#D1D1D8', background: t.completed?'#16A34A':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}>
                  {t.completed && <Icon name="check" size={11} color="#fff" />}
                </button>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, textDecoration: t.completed?'line-through':'none' }}>{t.title}</div>
                  {(t.due_date || t.assigned_name) && (
                    <div style={{ fontSize:11.5, color:'#9A9AA4', marginTop:1 }}>
                      {t.due_date && <DuePill iso={t.due_date} />}
                      {t.assigned_name && <span style={{ marginLeft:6 }}>{t.assigned_name}</span>}
                    </div>
                  )}
                </div>
                {canEdit && <button onClick={() => deleteTask(t.id)} style={{ color:'#C4C4CC', background:'none', border:'none', cursor:'pointer', padding:0 }}><Icon name="x" size={14}/></button>}
              </div>
            ))}
          </div>

          {/* ── Linked Projects ── */}
          {linkedProjects && linkedProjects.length > 0 && (
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>
                Projects <span style={{ color:'#9A9AA4', fontWeight:500 }}>({linkedProjects.length})</span>
              </div>
              {linkedProjects.map(p => (
                <button key={p.id} onClick={() => onOpenProject && onOpenProject(p.id)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 11px',
                    background:'#FAFAFB', border:'1px solid #EEEEF1', borderRadius:10, marginBottom:6,
                    cursor:'pointer', textAlign:'left' }}>
                  <div style={{ width:10, height:10, borderRadius:3, background: p.color || ACCENT, flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                    {p.description && (
                      <div style={{ fontSize:11.5, color:'#9A9AA4', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.description}</div>
                    )}
                  </div>
                  {Number(p.overdue_count) > 0 && (
                    <span style={{ fontSize:10.5, fontWeight:700, padding:'1px 6px', borderRadius:6, background:'#FEF2F2', color:'#DC2626', whiteSpace:'nowrap' }}>
                      {p.overdue_count} overdue
                    </span>
                  )}
                  <span style={{ fontSize:11.5, padding:'2px 8px', borderRadius:6,
                    background: p.status==='active'?'#ECFDF3':p.status==='completed'?'#EFF4FF':'#F1F5F9',
                    color: p.status==='active'?'#16A34A':p.status==='completed'?'#2563EB':'#64748B',
                    fontWeight:600, whiteSpace:'nowrap' }}>
                    {p.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Activity — always visible */}
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Activity</div>
          {canEdit && (
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              <input value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Add a note…"
                style={{ ...inpStyle, flex:1 }} />
              <button onClick={addNote}
                style={{ height:38, padding:'0 16px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13, fontWeight:600 }}>
                Add
              </button>
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column' }}>
            {activity.map((ac, i) => (
              <div key={ac.id} style={{ display:'flex', gap:12 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                  <span style={{ width:9, height:9, borderRadius:'50%', background: ac.type==='check'?'#16A34A': ac.type==='bell'?'#C2410C':'#5B5BD6', marginTop:4 }} />
                  {i < activity.length - 1 && <span style={{ width:1, flex:1, background:'#EEEEF1', margin:'4px 0' }} />}
                </div>
                <div style={{ paddingBottom:16, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, wordBreak:'break-word' }}>{ac.text}</div>
                  <div style={{ fontSize:11.5, color:'#A0A0AA', marginTop:1 }}>{ac.user_name} · {fmtDate(ac.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Contact Modal ────────────────────────────────────────────────────────
function AddContactModal({ onClose, onSaved, users, currentUserId, customFieldDefs }) {
  const [form, setForm] = useState({ name:'', company:'', title:'', email:'', phone:'', source:'Inbound', owner_id:currentUserId, stage:'new', value:'', next_followup:'', recurrence:'none', notes:'', custom_fields:{} });
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState(null);
  const [dealMode, setDealMode] = useState(null); // 'single' | 'manual' | null

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setCF = (name, v) => setForm(f => ({ ...f, custom_fields: { ...f.custom_fields, [name]: v } }));
  const setVal = (v) => { set('value', v); if (!v || parseInt(v) <= 0) setDealMode(null); };

  const save = async (force = false) => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const r = await api.post('/contacts', { ...form, value: parseInt(form.value) || 0, next_followup: form.next_followup || null, force });
      setDuplicates(null);
      if (dealMode === 'single' && parseInt(form.value) > 0) {
        await api.post('/deals', {
          contact_id: r.data.id,
          title: form.name.trim() + (form.company ? ` — ${form.company}` : ' — Deal'),
          value: parseInt(form.value),
          stage: 'prospect',
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.duplicates) {
        setDuplicates(err.response.data.duplicates);
      } else console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = { display:'block', fontSize:12, fontWeight:600, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 };
  const inpStyle = { width:'100%', height:38, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13, background:'#FAFAFB', outline:'none' };
  const selStyle = { ...inpStyle, cursor:'pointer', appearance:'none', WebkitAppearance:'none' };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.34)', animation:'fadeIn .15s' }} />
      <div style={{ position:'relative', width:580, maxHeight:'90vh', overflowY:'auto', background:'#fff', borderRadius:18, boxShadow:'0 24px 60px rgba(20,20,30,0.24)', animation:'popIn .2s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ fontSize:17, fontWeight:700 }}>New contact</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#8A8A94' }}><Icon name="x" size={18} /></button>
        </div>

        {/* Duplicate warning */}
        {duplicates && (
          <div style={{ margin:'16px 24px 0', padding:'14px 16px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10 }}>
            <div style={{ fontSize:13.5, fontWeight:700, color:'#92400E', marginBottom:8 }}>Possible duplicate{duplicates.length > 1 ? 's' : ''} found</div>
            {duplicates.map(d => (
              <div key={d.id} style={{ fontSize:13, color:'#78350F', marginBottom:4 }}>
                <strong>{d.name}</strong>{d.company ? ` · ${d.company}` : ''}{d.email ? ` · ${d.email}` : ''}
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:10 }}>
              <button onClick={() => save(true)} style={{ height:34, padding:'0 14px', borderRadius:8, fontSize:13, fontWeight:700, background:'#D97706', color:'#fff' }}>Add anyway</button>
              <button onClick={() => setDuplicates(null)} style={{ height:34, padding:'0 14px', borderRadius:8, fontSize:13, fontWeight:600, background:'#F5F5F8', color:'#5A5A66' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ padding:'22px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px 16px' }}>
          <div style={{ gridColumn:'span 2' }}>
            <label style={labelStyle}>Full name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Cooper" style={inpStyle} />
          </div>
          <div><label style={labelStyle}>Company</label><input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Inc." style={inpStyle} /></div>
          <div><label style={labelStyle}>Job title</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="VP Sales" style={inpStyle} /></div>
          <div><label style={labelStyle}>Email</label><input value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@acme.com" style={inpStyle} /></div>
          <div><label style={labelStyle}>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (555) 010-0000" style={inpStyle} /></div>
          <div>
            <label style={labelStyle}>Owner</label>
            <select value={form.owner_id} onChange={e => set('owner_id', e.target.value)} style={selStyle}>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Source</label>
            <select value={form.source} onChange={e => set('source', e.target.value)} style={selStyle}>
              {['Inbound','Referral','LinkedIn','Cold email','Webinar','Conference'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Stage</label>
            <select value={form.stage} onChange={e => set('stage', e.target.value)} style={selStyle}>
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Deal value</label><CurrencyInput homeValue={form.value} onHomeChange={v => setVal(v)} placeholder="250000" inpStyle={inpStyle}/></div>
          <div><label style={labelStyle}>Next follow-up</label><input type="date" value={form.next_followup} onChange={e => set('next_followup', e.target.value)} style={inpStyle} /></div>
          {parseInt(form.value) > 0 && (
            <div style={{ gridColumn:'span 2', background:'#F6F6FA', borderRadius:10, padding:'12px 14px', display:'flex', flexDirection:'column', gap:9 }}>
              <div style={{ fontSize:12.5, fontWeight:600, color:'#5A5A66' }}>How should this value be tracked as a deal?</div>
              <div style={{ display:'flex', gap:8 }}>
                <button type="button" onClick={() => setDealMode('single')}
                  style={{ flex:1, height:36, borderRadius:8, fontSize:12.5, fontWeight:600, border:'1.5px solid', cursor:'pointer',
                    borderColor: dealMode === 'single' ? ACCENT : '#DDDDE3',
                    background: dealMode === 'single' ? '#EEEEFF' : '#fff',
                    color: dealMode === 'single' ? ACCENT : '#5A5A66' }}>
                  Single deal — create it now
                </button>
                <button type="button" onClick={() => setDealMode('manual')}
                  style={{ flex:1, height:36, borderRadius:8, fontSize:12.5, fontWeight:600, border:'1.5px solid', cursor:'pointer',
                    borderColor: dealMode === 'manual' ? '#6B7280' : '#DDDDE3',
                    background: dealMode === 'manual' ? '#F3F4F6' : '#fff',
                    color: dealMode === 'manual' ? '#374151' : '#5A5A66' }}>
                  Multiple — I'll add deals myself
                </button>
              </div>
              {dealMode === 'single' && (
                <div style={{ fontSize:12, color:'#7C3AED' }}>
                  A deal titled "<strong>{form.name || 'Contact'}{form.company ? ` — ${form.company}` : ' — Deal'}</strong>" will be created at {fmtMoney(form.value)}.
                </div>
              )}
              {dealMode === 'manual' && (
                <div style={{ fontSize:12, color:'#6B7280' }}>
                  The value is saved as a fallback estimate. Go to the Deals view to add individual deals for this contact.
                </div>
              )}
            </div>
          )}
          <div style={{ gridColumn:'span 2' }}>
            <label style={labelStyle}>Repeat reminder</label>
            <select value={form.recurrence} onChange={e => set('recurrence', e.target.value)} style={selStyle}>
              {[['none','None'],['daily','Daily'],['weekly','Weekly'],['biweekly','Every 2 weeks'],['monthly','Monthly']].map(([k,l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'span 2' }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Context, next steps…"
              style={{ ...inpStyle, height:74, paddingTop:9, resize:'none' }} />
          </div>
          {customFieldDefs?.length > 0 && (
            <>
              <div style={{ gridColumn:'span 2', fontSize:12, fontWeight:700, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', paddingTop:4, borderTop:'1px solid #F0F0F3' }}>Custom fields</div>
              {customFieldDefs.map(def => (
                <div key={def.id}>
                  <label style={labelStyle}>{def.label}{def.required && ' *'}</label>
                  {def.field_type === 'select' ? (
                    <select value={form.custom_fields[def.name] || ''} onChange={e => setCF(def.name, e.target.value)} style={selStyle}>
                      <option value="">—</option>
                      {(def.options||[]).map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={def.field_type === 'number' ? 'number' : def.field_type === 'date' ? 'date' : 'text'}
                      value={form.custom_fields[def.name] || ''}
                      onChange={e => setCF(def.name, e.target.value)}
                      style={inpStyle} />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'16px 24px', borderTop:'1px solid #EEEEF1' }}>
          <button onClick={onClose} style={{ height:40, padding:'0 18px', borderRadius:9, fontSize:13.5, fontWeight:600, color:'#5A5A66', background:'#F2F2F5' }}>Cancel</button>
          <button onClick={() => save(false)} disabled={saving}
            style={{ height:40, padding:'0 20px', borderRadius:9, fontSize:13.5, fontWeight:700, background:ACCENT, color:'#fff', opacity:saving?0.7:1 }}>
            {saving ? 'Saving…' : 'Add contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Currency Settings Section ─────────────────────────────────────────────────
function CurrencySettingsCard({ card, inpStyle }) {
  const [cfg, setCfg] = useState(() => getCurrencyConfig());
  const [saved, setSaved] = useState(false);

  const setRate = (c, val) => setCfg(prev => ({ ...prev, rates: { ...prev.rates, [c]: parseFloat(val) || prev.rates[c] } }));

  const save = () => {
    saveCurrencyConfig(cfg);
    setSaved(true);
    setTimeout(() => { setSaved(false); window.location.reload(); }, 800);
  };

  const OTHER_CURRENCIES = Object.keys(CURRENCIES).filter(c => c !== 'INR');

  return (
    <div style={{ marginTop:28 }}>
      <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', marginBottom:20 }}>Currency & Display</h2>

      <div style={card}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Display currency</div>
        <div style={{ fontSize:13, color:'#7E7E88', marginBottom:14 }}>
          All values are stored in INR. Choose which currency to show amounts in across the app.
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {Object.entries(CURRENCIES).map(([code, meta]) => (
            <button key={code} onClick={() => setCfg(prev => ({ ...prev, display: code }))}
              style={{ height:38, padding:'0 16px', borderRadius:9, fontSize:13.5, fontWeight:700, cursor:'pointer', border:'1.5px solid',
                borderColor: cfg.display === code ? ACCENT : '#E5E5EA',
                background:  cfg.display === code ? `${ACCENT}18` : '#fff',
                color:       cfg.display === code ? ACCENT : '#5A5A66' }}>
              {meta.symbol} {code}
            </button>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Exchange rates</div>
        <div style={{ fontSize:13, color:'#7E7E88', marginBottom:16 }}>
          Set how many INR equals 1 unit of each foreign currency. Used for display conversion and when entering values in other currencies.
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {OTHER_CURRENCIES.map(c => (
            <div key={c} style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12, alignItems:'center' }}>
              <div style={{ fontSize:13.5, fontWeight:600 }}>
                {CURRENCIES[c].symbol} {c} <span style={{ fontWeight:400, color:'#9A9AA4' }}>— {CURRENCIES[c].name}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12.5, color:'#9A9AA4', whiteSpace:'nowrap' }}>1 {c} =</span>
                <input type="number" value={cfg.rates[c] ?? CURRENCIES[c].rate} min="0" step="0.01"
                  onChange={e => setRate(c, e.target.value)}
                  style={{ ...inpStyle, width:110 }}/>
                <span style={{ fontSize:12.5, color:'#9A9AA4' }}>INR</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={save}
        style={{ height:42, padding:'0 28px', borderRadius:10, background: saved ? '#16A34A' : ACCENT, color:'#fff', fontSize:14, fontWeight:700 }}>
        {saved ? 'Saved — reloading…' : 'Save currency settings'}
      </button>
    </div>
  );
}

// ── Settings Page ────────────────────────────────────────────────────────────
const PROFILE_COLORS = ['#5B5BD6','#2563EB','#16A34A','#D97706','#DC2626','#7C3AED','#0891B2','#DB2777','#65A30D','#EA580C'];

function SettingsPage({ user, onUpdate, isAdmin, customFieldDefs, reloadCustomFields }) {
  const [profileForm, setProfileForm] = useState({ name: user.name, email: user.email || '', newPassword: '', confirmPassword: '', color: user.color });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  const setP = (k, v) => setProfileForm(f => ({ ...f, [k]: v }));

  const saveProfile = async () => {
    if (!profileForm.name.trim()) { setProfileError('Name is required'); return; }
    if (profileForm.newPassword && profileForm.newPassword.length < 8) { setProfileError('Password must be at least 8 characters'); return; }
    if (profileForm.newPassword !== profileForm.confirmPassword) { setProfileError('Passwords do not match'); return; }
    setProfileSaving(true); setProfileError(''); setProfileSuccess(false);
    try {
      const body = { name: profileForm.name.trim(), email: profileForm.email.trim(), color: profileForm.color };
      if (profileForm.newPassword) body.password = profileForm.newPassword;
      await api.put(`/users/${user.id}`, body);
      await onUpdate();
      setProfileForm(f => ({ ...f, newPassword: '', confirmPassword: '' }));
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to save');
    } finally {
      setProfileSaving(false);
    }
  };

  const [teamsUrl, setTeamsUrl] = useState(user.teams_webhook_url || '');
  const [emailDigest, setEmailDigest] = useState(user.email_digest !== false);
  const [saving, setSaving] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [newField, setNewField] = useState({ label:'', field_type:'text', options:'' });
  const [addingField, setAddingField] = useState(false);

  const saveField = async () => {
    if (!newField.label.trim()) return;
    const name = newField.label.toLowerCase().replace(/[^a-z0-9]+/g,'_');
    const options = newField.field_type === 'select' ? newField.options.split(',').map(s=>s.trim()).filter(Boolean) : [];
    await api.post('/custom-fields', { name, label: newField.label, field_type: newField.field_type, options });
    setNewField({ label:'', field_type:'text', options:'' });
    setAddingField(false);
    reloadCustomFields?.();
  };

  const deleteField = async (id) => {
    await api.delete(`/custom-fields/${id}`);
    reloadCustomFields?.();
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/users/${user.id}`, { teams_webhook_url: teamsUrl, email_digest: emailDigest });
      await onUpdate();
    } finally {
      setSaving(false);
    }
  };

  const testTeams = async () => {
    if (!teamsUrl) return;
    try {
      await api.post('/notifications/test-teams', { webhookUrl: teamsUrl });
      setTestMsg('Test message sent!');
    } catch { setTestMsg('Failed to send test message.'); }
    setTimeout(() => setTestMsg(''), 3000);
  };

  const card = { background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:'20px 22px', marginBottom:16, boxShadow:'0 1px 2px rgba(16,16,30,0.04)' };
  const inpStyle = { width:'100%', height:40, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13.5, background:'#FAFAFB', outline:'none' };

  return (
    <div style={{ maxWidth:560 }}>
      <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', marginBottom:20 }}>Profile</h2>

      <div style={card}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 }}>Full name</label>
            <input value={profileForm.name} onChange={e => setP('name', e.target.value)} placeholder="Your name" style={inpStyle} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 }}>Email</label>
            <input type="email" value={profileForm.email} onChange={e => setP('email', e.target.value)} placeholder="you@company.com" style={inpStyle} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 }}>New password</label>
            <input type="password" value={profileForm.newPassword} onChange={e => setP('newPassword', e.target.value)} placeholder="Leave blank to keep current" style={inpStyle} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 }}>Confirm password</label>
            <input type="password" value={profileForm.confirmPassword} onChange={e => setP('confirmPassword', e.target.value)} placeholder="Repeat new password" style={inpStyle} />
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>Avatar colour</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            {PROFILE_COLORS.map(c => (
              <button key={c} onClick={() => setP('color', c)}
                style={{ width:28, height:28, borderRadius:'50%', background:c, border: profileForm.color === c ? '3px solid #19191F' : '3px solid transparent', cursor:'pointer', transition:'border .1s' }} />
            ))}
            <div style={{ position:'relative', width:28, height:28, borderRadius:'50%', background:profileForm.color, border:'2px solid #E5E5EA', overflow:'hidden' }}>
              <input type="color" value={profileForm.color} onChange={e => setP('color', e.target.value)}
                style={{ position:'absolute', inset:-4, width:'calc(100% + 8px)', height:'calc(100% + 8px)', cursor:'pointer', border:'none', padding:0, opacity:0 }} />
            </div>
          </div>
        </div>

        {profileError && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'9px 14px', color:'#DC2626', fontSize:13, marginBottom:12 }}>{profileError}</div>
        )}
        {profileSuccess && (
          <div style={{ background:'#ECFDF3', border:'1px solid #86EFAC', borderRadius:8, padding:'9px 14px', color:'#16A34A', fontSize:13, marginBottom:12 }}>Profile updated successfully.</div>
        )}

        <button onClick={saveProfile} disabled={profileSaving}
          style={{ height:40, padding:'0 24px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:700, opacity:profileSaving?0.7:1 }}>
          {profileSaving ? 'Saving…' : 'Save profile'}
        </button>
      </div>

      <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', marginBottom:20, marginTop:32 }}>Notification Settings</h2>

      <div style={card}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Email digest</div>
        <div style={{ fontSize:13, color:'#7E7E88', marginBottom:14 }}>Receive a morning email with today's follow-ups (weekdays at 8am).</div>
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
          <div onClick={() => setEmailDigest(v => !v)}
            style={{ width:42, height:24, borderRadius:12, background: emailDigest ? ACCENT : '#D1D1D8', position:'relative', transition:'background .2s', cursor:'pointer' }}>
            <div style={{ position:'absolute', top:3, left: emailDigest ? 21 : 3, width:18, height:18, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'left .2s' }} />
          </div>
          <span style={{ fontSize:14, fontWeight:500 }}>{emailDigest ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>

      <div style={card}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Microsoft Teams</div>
        <div style={{ fontSize:13, color:'#7E7E88', marginBottom:14 }}>
          Reminders are sent via a Teams Workflow to a <strong>channel</strong> or <strong>group chat</strong>. Note: individual (1:1) chats are not supported by Microsoft's webhook workflows.
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={teamsUrl} onChange={e => setTeamsUrl(e.target.value)}
            placeholder="https://prod-xx.westus.logic.azure.com/workflows/..."
            style={{ ...inpStyle, flex:1 }} />
          {teamsUrl && (
            <button onClick={testTeams}
              style={{ height:40, padding:'0 14px', borderRadius:9, fontSize:13, fontWeight:600, background:'#F2F2F5', color:'#3A3A44', whiteSpace:'nowrap' }}>
              Test
            </button>
          )}
        </div>
        {testMsg && (
          <div style={{ marginTop:8, fontSize:13, color: testMsg.includes('!') ? '#16A34A' : '#DC2626', lineHeight:1.4 }}>
            {testMsg}
          </div>
        )}

        {/* Step-by-step instructions */}
        <div style={{ marginTop:14, background:'#F8F8FB', borderRadius:10, padding:'13px 14px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#5A5A66', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.04em' }}>How to set up (takes ~2 minutes)</div>

          <div style={{ fontSize:12, fontWeight:600, color:'#7C3AED', marginBottom:4 }}>Option A — Send to a channel</div>
          <ol style={{ margin:'0 0 12px', paddingLeft:18, display:'flex', flexDirection:'column', gap:5 }}>
            {[
              'Open Teams and navigate to the channel you want notifications in.',
              <>Click <strong>…</strong> next to the channel name → <strong>Workflows</strong>.</>,
              <>Search for <strong>"Send webhook alerts to channel"</strong> → select it.</>,
              <>Name it (e.g. <em>Flux</em>), confirm the channel → click <strong>Add workflow</strong>.</>,
              'Copy the webhook URL from the confirmation screen and paste it above.',
            ].map((step, i) => (
              <li key={i} style={{ fontSize:12.5, color:'#5A5A66', lineHeight:1.5 }}>{step}</li>
            ))}
          </ol>

          <div style={{ fontSize:12, fontWeight:600, color:'#2563EB', marginBottom:4 }}>Option B — Send to a chat</div>
          <ol style={{ margin:0, paddingLeft:18, display:'flex', flexDirection:'column', gap:5 }}>
            {[
              'Open Teams and open the chat you want notifications in.',
              <>Click the <strong>+</strong> (Add apps) icon at the top of the chat → <strong>Workflows</strong>.</>,
              <>Search for <strong>"Send webhook alerts to chat"</strong> → select it.</>,
              <>Name it, confirm the chat → click <strong>Add workflow</strong>.</>,
              'Copy the webhook URL from the confirmation screen and paste it above.',
            ].map((step, i) => (
              <li key={i} style={{ fontSize:12.5, color:'#5A5A66', lineHeight:1.5 }}>{step}</li>
            ))}
          </ol>

          <div style={{ marginTop:10, fontSize:12, color:'#9A9AA4', borderTop:'1px solid #EEEEF1', paddingTop:8 }}>
            Both options work identically with Flux — the webhook sends a structured card with your follow-ups.
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        style={{ height:42, padding:'0 28px', borderRadius:10, background:ACCENT, color:'#fff', fontSize:14, fontWeight:700, opacity:saving?0.7:1 }}>
        {saving ? 'Saving…' : 'Save settings'}
      </button>

      <CurrencySettingsCard card={card} inpStyle={inpStyle}/>

      {/* Custom Fields — admin only */}
      {isAdmin && (
        <div style={{ marginTop:28 }}>
          <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', marginBottom:20 }}>Custom Contact Fields</h2>
          <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:'20px 22px', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
            <div style={{ fontSize:13, color:'#7E7E88', marginBottom:16 }}>
              Add extra fields that appear on every contact. Useful for industry, tier, contract type, etc.
            </div>
            {customFieldDefs?.length > 0 && (
              <div style={{ marginBottom:16 }}>
                {customFieldDefs.map(def => (
                  <div key={def.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'#FAFAFB', border:'1px solid #EEEEF1', borderRadius:9, marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{def.label}</span>
                    <span style={{ fontSize:11.5, color:'#9A9AA4', padding:'2px 8px', borderRadius:6, background:'#F0F0F3' }}>{def.field_type}</span>
                    {def.field_type === 'select' && <span style={{ fontSize:11.5, color:'#9A9AA4' }}>{(def.options||[]).join(', ')}</span>}
                    <button onClick={() => deleteField(def.id)} style={{ color:'#DC2626', background:'none', border:'none', cursor:'pointer', padding:'4px' }}><Icon name="trash" size={14}/></button>
                  </div>
                ))}
              </div>
            )}
            {addingField ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'14px', background:'#F8F8FB', borderRadius:10, border:'1px dashed #D1D1D8' }}>
                <input value={newField.label} onChange={e => setNewField(f=>({...f,label:e.target.value}))} placeholder="Field label (e.g. Industry)" style={{ height:38, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13, background:'#fff', outline:'none' }} />
                <div style={{ display:'flex', gap:8 }}>
                  <select value={newField.field_type} onChange={e => setNewField(f=>({...f,field_type:e.target.value}))}
                    style={{ flex:1, height:38, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13, background:'#fff', outline:'none', cursor:'pointer' }}>
                    {[['text','Text'],['number','Number'],['date','Date'],['select','Dropdown'],['url','URL']].map(([k,l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  {newField.field_type === 'select' && (
                    <input value={newField.options} onChange={e => setNewField(f=>({...f,options:e.target.value}))} placeholder="Options, comma-separated" style={{ flex:2, height:38, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13, background:'#fff', outline:'none' }} />
                  )}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={saveField} style={{ height:36, padding:'0 16px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13, fontWeight:700 }}>Add field</button>
                  <button onClick={() => setAddingField(false)} style={{ height:36, padding:'0 14px', borderRadius:9, background:'#F2F2F5', color:'#5A5A66', fontSize:13, fontWeight:600 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingField(true)}
                style={{ display:'flex', alignItems:'center', gap:7, height:38, padding:'0 16px', borderRadius:9, border:'1.5px dashed #D1D1D8', background:'transparent', color:'#5A5A66', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                <Icon name="plus" size={15} />New field
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── AddItemModal ─────────────────────────────────────────────────────────────
function AddItemModal({ projectId, milestones, users, contacts, defaults = {}, editItem, onClose, onSaved, hasCrmContact }) {
  const isEdit = !!editItem;
  const [form, setForm] = useState({
    section_type:        defaults.section_type        || editItem?.section_type        || 'task',
    title:               editItem?.title               || defaults.title               || '',
    body:                editItem?.body                || '',
    importance:          editItem?.importance          ?? defaults.importance          ?? null,
    urgency:             editItem?.urgency             ?? defaults.urgency             ?? null,
    status:              editItem?.status              || null,
    assignee_id:         editItem?.assignee_id         || '',
    due_date:            editItem?.due_date?.slice(0,10) || '',
    milestone_id:        editItem?.milestone_id        || '',
    doc_type:            editItem?.doc_type            || '',
    sync_to_crm:         editItem?.sync_to_crm         || false,
    followup_contact_id: editItem?.followup_contact_id || '',
    recurrence:          editItem?.recurrence          || 'none',
    effort_size:         editItem?.effort_size         || '',
    effort_hours:        editItem?.effort_hours        != null ? String(+editItem.effort_hours) : '',
    waiting_on:          editItem?.waiting_on          || '',
    waiting_contact_id:  editItem?.waiting_contact_id  || '',
    context_tag:         editItem?.context_tag         || '',
    checklist:           editItem?.checklist           || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      const body = {
        section_type:        form.section_type,
        title:               form.title.trim(),
        body:                form.body || null,
        importance:          form.importance,
        urgency:             form.urgency,
        assignee_id:         form.assignee_id         || null,
        due_date:            form.due_date             || null,
        milestone_id:        form.milestone_id         || null,
        doc_type:            form.doc_type             || null,
        sync_to_crm:         form.sync_to_crm,
        followup_contact_id: form.section_type === 'followup' ? (form.followup_contact_id || null) : null,
        recurrence:          form.section_type === 'followup' ? form.recurrence : 'none',
        effort_size:         form.effort_size          || null,
        effort_hours:        form.effort_hours !== '' ? +form.effort_hours : null,
        waiting_on:          form.waiting_on.trim()    || null,
        waiting_contact_id:  form.waiting_on.trim() ? (form.waiting_contact_id || null) : null,
        context_tag:         form.context_tag          || null,
        checklist:           form.section_type === 'deliverable' && form.checklist.length
                               ? form.checklist.filter(c => c.text.trim()) : null,
      };
      if (form.status) body.status = form.status;
      if (isEdit) {
        await api.put(`/projects/${projectId}/items/${editItem.id}`, body);
      } else {
        await api.post(`/projects/${projectId}/items`, body);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = { display:'block', fontSize:11.5, fontWeight:700, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 };
  const inpStyle   = { width:'100%', height:38, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13.5, background:'#FAFAFB', outline:'none', boxSizing:'border-box' };
  const cycleIU = v => v === null ? 1 : v === 1 ? 0 : null;
  const iuBtn = (val, label, active, onClick) => (
    <button onClick={() => onClick(val)}
      style={{ height:30, padding:'0 11px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer',
        border: active ? `2px solid ${ACCENT}` : '1.5px solid #E5E5EA',
        background: active ? `${ACCENT}18` : '#FAFAFB', color: active ? ACCENT : '#7A7A88' }}>
      {label}
    </button>
  );

  const delivStatuses = DELIVERABLE_STATUSES;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.34)' }} />
      <div style={{ position:'relative', width:520, maxHeight:'90vh', overflowY:'auto', background:'#fff', borderRadius:18, boxShadow:'0 24px 60px rgba(20,20,30,0.24)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ fontSize:16, fontWeight:700 }}>{isEdit ? 'Edit item' : 'Add item'}</div>
          <button onClick={onClose} style={{ color:'#8A8A94', background:'none', border:'none', cursor:'pointer' }}><Icon name="x" size={18}/></button>
        </div>
        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Type selector — context is not a selectable type (it's the notes scratchpad) */}
          {!isEdit && (
            <div>
              <label style={labelStyle}>Type</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {Object.entries(SECTION_TYPE_META).filter(([k]) => k !== 'context').map(([key, m]) => (
                  <button key={key} onClick={() => set('section_type', key)}
                    style={{ height:32, padding:'0 13px', borderRadius:8, fontSize:12.5, fontWeight:600, cursor:'pointer',
                      border: form.section_type === key ? `2px solid ${m.color}` : '1.5px solid #E5E5EA',
                      background: form.section_type === key ? m.bg : '#FAFAFB',
                      color: form.section_type === key ? m.color : '#7A7A88' }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Enter a title…" style={inpStyle} autoFocus />
          </div>

          <div>
            <label style={labelStyle}>{form.section_type === 'context' ? 'Content' : 'Details'}</label>
            <textarea value={form.body} onChange={e => set('body', e.target.value)}
              placeholder={form.section_type === 'context' ? 'Write notes, context, or discussion points…' : 'Optional details…'}
              rows={form.section_type === 'context' ? 5 : 3}
              style={{ ...inpStyle, height:'auto', padding:'9px 11px', resize:'vertical' }} />
          </div>

          {/* doc_type for deliverables */}
          {form.section_type === 'deliverable' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={labelStyle}>Document type</label>
                <select value={form.doc_type} onChange={e => set('doc_type', e.target.value)}
                  style={{ ...inpStyle, cursor:'pointer' }}>
                  <option value="">— Select type —</option>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status || 'draft'} onChange={e => set('status', e.target.value)}
                  style={{ ...inpStyle, cursor:'pointer' }}>
                  {delivStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Follow-up: who + recurrence */}
          {form.section_type === 'followup' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={labelStyle}>With whom (CRM contact)</label>
                <select value={form.followup_contact_id} onChange={e => set('followup_contact_id', e.target.value)}
                  style={{ ...inpStyle, cursor:'pointer' }}>
                  <option value="">— Not linked —</option>
                  {(contacts||[]).map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Repeat reminder</label>
                <select value={form.recurrence} onChange={e => set('recurrence', e.target.value)}
                  style={{ ...inpStyle, cursor:'pointer' }}>
                  {[['none','None'],['daily','Daily'],['weekly','Weekly'],['biweekly','Every 2 weeks'],['monthly','Monthly']].map(([k,l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Importance / Urgency */}
          {form.section_type !== 'context' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={labelStyle}>Importance</label>
                <div style={{ display:'flex', gap:5 }}>
                  {iuBtn(null,  '—',    form.importance === null, v => set('importance', v))}
                  {iuBtn(0,    'Low',  form.importance === 0,    v => set('importance', v))}
                  {iuBtn(1,    'High', form.importance === 1,    v => set('importance', v))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Urgency</label>
                <div style={{ display:'flex', gap:5 }}>
                  {iuBtn(null,  '—',    form.urgency === null, v => set('urgency', v))}
                  {iuBtn(0,    'Low',  form.urgency === 0,    v => set('urgency', v))}
                  {iuBtn(1,    'High', form.urgency === 1,    v => set('urgency', v))}
                </div>
              </div>
            </div>
          )}

          {/* Effort + context tag */}
          {form.section_type !== 'context' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={labelStyle}>Effort</label>
                <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                  {['S','M','L'].map(sz => iuBtn(sz, sz, form.effort_size === sz, () => {
                    if (form.effort_size === sz) { set('effort_size', ''); return; }
                    const prevDefault = String(EFFORT_DEFAULT_HOURS[form.effort_size] || '');
                    const keepOverride = form.effort_hours !== '' && form.effort_hours !== prevDefault;
                    setForm(f => ({ ...f, effort_size: sz, effort_hours: keepOverride ? f.effort_hours : String(EFFORT_DEFAULT_HOURS[sz]) }));
                  }))}
                  <input type="number" min="0" step="0.5" value={form.effort_hours}
                    onChange={e => set('effort_hours', e.target.value)}
                    placeholder="hrs" title="Estimated hours"
                    style={{ ...inpStyle, width:64, height:30, padding:'0 8px', fontSize:12.5 }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Context</label>
                <select value={form.context_tag} onChange={e => set('context_tag', e.target.value)}
                  style={{ ...inpStyle, cursor:'pointer' }}>
                  <option value="">— None —</option>
                  <option value="deep">Deep work</option>
                  <option value="calls">Calls</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Assignee</label>
              <select value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}
                style={{ ...inpStyle, cursor:'pointer' }}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Due date</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                style={inpStyle} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Milestone</label>
              <select value={form.milestone_id} onChange={e => set('milestone_id', e.target.value)}
                style={{ ...inpStyle, cursor:'pointer' }}>
                <option value="">Unscheduled</option>
                {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            {/* CRM sync for follow-ups when a contact is linked */}
            {form.section_type === 'followup' && (form.followup_contact_id || hasCrmContact) && (
              <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end', paddingBottom:2 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                  <input type="checkbox" checked={form.sync_to_crm} onChange={e => set('sync_to_crm', e.target.checked)}
                    style={{ width:15, height:15, cursor:'pointer' }} />
                  <span style={{ fontWeight:600 }}>Sync to CRM contact</span>
                </label>
                <div style={{ fontSize:11, color:'#9A9AA4', marginTop:3 }}>Marks contact followed-up when done</div>
              </div>
            )}
          </div>

          {/* Waiting on */}
          {form.section_type !== 'context' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={labelStyle}>Waiting on</label>
                <input value={form.waiting_on} onChange={e => set('waiting_on', e.target.value)}
                  placeholder="e.g. client approval, vendor…" style={inpStyle} />
              </div>
              <div>
                <label style={labelStyle}>Waiting on contact (optional)</label>
                <select value={form.waiting_contact_id} onChange={e => set('waiting_contact_id', e.target.value)}
                  disabled={!form.waiting_on.trim()}
                  style={{ ...inpStyle, cursor:'pointer', opacity: form.waiting_on.trim() ? 1 : 0.5 }}>
                  <option value="">— Not linked —</option>
                  {(contacts||[]).map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Definition-of-done checklist for deliverables */}
          {form.section_type === 'deliverable' && (
            <div>
              <label style={labelStyle}>Definition of done</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {form.checklist.map((c, idx) => (
                  <div key={idx} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={!!c.done}
                      onChange={e => set('checklist', form.checklist.map((x,i) => i===idx ? { ...x, done:e.target.checked } : x))}
                      style={{ width:15, height:15, cursor:'pointer', flexShrink:0 }} />
                    <input value={c.text}
                      onChange={e => set('checklist', form.checklist.map((x,i) => i===idx ? { ...x, text:e.target.value } : x))}
                      placeholder="Checklist step…"
                      style={{ ...inpStyle, height:32, fontSize:13, textDecoration: c.done ? 'line-through' : 'none', color: c.done ? '#9A9AA4' : undefined }} />
                    <button onClick={() => set('checklist', form.checklist.filter((_,i) => i!==idx))}
                      style={{ color:'#B0B0BA', background:'none', border:'none', cursor:'pointer', padding:3, flexShrink:0 }}>
                      <Icon name="x" size={14}/>
                    </button>
                  </div>
                ))}
                <button onClick={() => set('checklist', [...form.checklist, { text:'', done:false }])}
                  style={{ alignSelf:'flex-start', height:28, padding:'0 10px', borderRadius:7, fontSize:12, fontWeight:600,
                    border:'1.5px dashed #D1D1D8', background:'none', color:'#7A7A88', cursor:'pointer' }}>
                  + Add step
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'9px 13px', color:'#DC2626', fontSize:13 }}>
              {error}
            </div>
          )}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:9, padding:'14px 22px', borderTop:'1px solid #EEEEF1' }}>
          <button onClick={onClose} style={{ height:38, padding:'0 16px', borderRadius:9, fontSize:13.5, fontWeight:600, color:'#5A5A66', background:'#F2F2F5', border:'none', cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ height:38, padding:'0 20px', borderRadius:9, fontSize:13.5, fontWeight:700, background:ACCENT, color:'#fff', opacity:saving?0.7:1, border:'none', cursor:'pointer' }}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AddMilestoneModal ─────────────────────────────────────────────────────────
function AddMilestoneModal({ projectId, existingCount, editMilestone, onClose, onSaved }) {
  const isEdit = !!editMilestone;
  const [form, setForm] = useState({
    title:    editMilestone?.title    || '',
    due_date: editMilestone?.due_date?.slice(0,10) || '',
    position: editMilestone?.position ?? existingCount,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const save = async () => {
    if (!form.title.trim()) { setError('Title required'); return; }
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await api.put(`/projects/${projectId}/milestones/${editMilestone.id}`, form);
      } else {
        await api.post(`/projects/${projectId}/milestones`, form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inpStyle = { width:'100%', height:38, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13.5, background:'#FAFAFB', outline:'none', boxSizing:'border-box' };
  const labelStyle = { display:'block', fontSize:11.5, fontWeight:700, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.34)' }} />
      <div style={{ position:'relative', width:420, background:'#fff', borderRadius:18, boxShadow:'0 24px 60px rgba(20,20,30,0.22)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'17px 21px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ fontSize:16, fontWeight:700 }}>{isEdit ? 'Edit milestone' : 'Add milestone'}</div>
          <button onClick={onClose} style={{ color:'#8A8A94', background:'none', border:'none', cursor:'pointer' }}><Icon name="x" size={18}/></button>
        </div>
        <div style={{ padding:'18px 21px', display:'flex', flexDirection:'column', gap:13 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
              placeholder="e.g. Kickoff complete" style={inpStyle} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Due date</label>
            <input type="date" value={form.due_date} onChange={e => setForm(f=>({...f,due_date:e.target.value}))} style={inpStyle} />
          </div>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'9px 13px', color:'#DC2626', fontSize:13 }}>{error}</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:9, padding:'13px 21px', borderTop:'1px solid #EEEEF1' }}>
          <button onClick={onClose} style={{ height:38, padding:'0 16px', borderRadius:9, fontSize:13.5, fontWeight:600, color:'#5A5A66', background:'#F2F2F5', border:'none', cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ height:38, padding:'0 20px', borderRadius:9, fontSize:13.5, fontWeight:700, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Add milestone'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TimelineTab ───────────────────────────────────────────────────────────────
function TimelineTab({ projectId, milestones, items, loadMilestones, loadItems, users }) {
  const [showAddMs, setShowAddMs]   = useState(false);
  const [editMs, setEditMs]         = useState(null);
  const [delMsId, setDelMsId]       = useState(null);

  const sorted = [...milestones].sort((a,b) => {
    if (a.position !== b.position) return a.position - b.position;
    if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
    return 0;
  });

  const columns = [
    ...sorted.map(m => ({
      id: m.id, milestone: m,
      items: items.filter(it => it.milestone_id === m.id),
    })),
    { id: '__unscheduled', milestone: null, items: items.filter(it => !it.milestone_id) },
  ];

  const deleteMilestone = async id => {
    await api.delete(`/projects/${projectId}/milestones/${id}`);
    setDelMsId(null);
    await Promise.all([loadMilestones(), loadItems()]);
  };

  const toggleMsComplete = async (m) => {
    await api.put(`/projects/${projectId}/milestones/${m.id}`, { completed: !m.completed });
    loadMilestones();
  };

  const colCard = { minWidth:240, flexShrink:0, background:'#F8F8FB', borderRadius:12, overflow:'hidden', border:'1px solid #ECECEF' };
  const colHead = { padding:'11px 13px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid #EEEEF1', background:'#fff' };

  return (
    <div>
      {/* Visual milestone strip */}
      {sorted.length > 0 && (
        <div style={{ position:'relative', height:62, marginBottom:20, padding:'0 20px' }}>
          <div style={{ position:'absolute', top:'50%', left:20, right:20, height:2, background:'#E5E5EA', transform:'translateY(-50%)' }} />
          {sorted.map((m, i) => {
            const pct = sorted.length > 1 ? (i / (sorted.length - 1)) * 100 : 50;
            const isOverdue = m.due_date && !m.completed && diffDays(m.due_date) < 0;
            const dotColor = m.completed ? '#16A34A' : isOverdue ? '#DC2626' : ACCENT;
            const doneCount = items.filter(it => it.milestone_id === m.id && (it.status === 'done' || it.status === 'delivered' || it.status === 'approved')).length;
            const totalCount = items.filter(it => it.milestone_id === m.id).length;
            return (
              <div key={m.id} style={{ position:'absolute', left:`${pct}%`, top:'50%', transform:'translate(-50%,-50%)', display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div style={{ fontSize:9.5, fontWeight:600, color:'#6B6B76', whiteSpace:'nowrap', marginBottom:5, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', textAlign:'center' }}>{m.title}</div>
                <div style={{ width:14, height:14, borderRadius:'50%', background:dotColor, border:'2px solid #fff', boxShadow:`0 0 0 2px ${dotColor}` }} />
                <div style={{ fontSize:9, color:'#9A9AA4', marginTop:4, whiteSpace:'nowrap' }}>
                  {m.due_date ? fmtDate(m.due_date) : '—'}{totalCount > 0 ? ` · ${doneCount}/${totalCount}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Milestone columns */}
      <div style={{ display:'flex', gap:14, overflowX:'auto', paddingBottom:16, alignItems:'flex-start' }}>
        {columns.map(col => (
          <div key={col.id} style={colCard}>
            <div style={colHead}>
              {col.milestone ? (
                <>
                  <button onClick={() => toggleMsComplete(col.milestone)}
                    style={{ width:18, height:18, borderRadius:5, border:'2px solid', flexShrink:0,
                      borderColor: col.milestone.completed ? '#16A34A' : '#D1D1D8',
                      background: col.milestone.completed ? '#16A34A' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    {col.milestone.completed && <Icon name="check" size={10} color="#fff"/>}
                  </button>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      textDecoration: col.milestone.completed ? 'line-through' : 'none', color: col.milestone.completed ? '#9A9AA4' : '#19191F' }}>
                      {col.milestone.title}
                    </div>
                    {col.milestone.due_date && (
                      <div style={{ fontSize:11, color:'#9A9AA4' }}>{fmtDate(col.milestone.due_date)}</div>
                    )}
                  </div>
                  <button onClick={() => setEditMs(col.milestone)}
                    style={{ color:'#B0B0BA', background:'none', border:'none', cursor:'pointer', padding:'2px' }}>
                    <Icon name="pencil" size={13}/>
                  </button>
                  {delMsId === col.milestone.id ? (
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => deleteMilestone(col.milestone.id)}
                        style={{ height:24, padding:'0 8px', borderRadius:6, fontSize:11, fontWeight:700, background:'#DC2626', color:'#fff', border:'none', cursor:'pointer' }}>Del</button>
                      <button onClick={() => setDelMsId(null)}
                        style={{ height:24, padding:'0 8px', borderRadius:6, fontSize:11, background:'#F2F2F5', color:'#5A5A66', border:'none', cursor:'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setDelMsId(col.milestone.id)}
                      style={{ color:'#C4C4CC', background:'none', border:'none', cursor:'pointer', padding:'2px' }}>
                      <Icon name="trash" size={13}/>
                    </button>
                  )}
                </>
              ) : (
                <div style={{ fontSize:13, fontWeight:700, color:'#9A9AA4', flex:1 }}>Unscheduled</div>
              )}
            </div>
            <div style={{ padding:'8px 10px', minHeight:80, display:'flex', flexDirection:'column', gap:6 }}>
              {col.items.length === 0 && (
                <div style={{ fontSize:12, color:'#C4C4CC', textAlign:'center', padding:'16px 0', fontStyle:'italic' }}>No items</div>
              )}
              {col.items.map(it => {
                const isDone       = ['done','delivered','approved'].includes(it.status);
                const isOverdueItem = !isDone && it.due_date && diffDays(it.due_date) < 0;
                return (
                  <div key={it.id} style={{ background: isDone ? '#FAFAFA' : '#fff', borderRadius:8, padding:'8px 10px',
                    border:`1px solid ${isOverdueItem ? '#FECACA' : '#EEEEF1'}`,
                    borderLeft: isOverdueItem ? '3px solid #DC2626' : '1px solid #EEEEF1',
                    opacity: isDone ? 0.6 : 1 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:6 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <SectionTypeBadge type={it.section_type} />
                        <div style={{ fontSize:12.5, fontWeight:600, marginTop:4, wordBreak:'break-word',
                          textDecoration: isDone ? 'line-through' : 'none',
                          color: isDone ? '#9A9AA4' : '#19191F' }}>{it.title}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                      {it.assignee_name && <Avatar name={it.assignee_name} color={it.assignee_color} size={18}/>}
                      {it.due_date && !isDone && <DuePill iso={it.due_date}/>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Add milestone button */}
        <div onClick={() => setShowAddMs(true)}
          style={{ minWidth:160, flexShrink:0, height:80, borderRadius:12, border:'2px dashed #D1D1D8',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:6, cursor:'pointer', color:'#9A9AA4', marginTop:0 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#D1D1D8'}>
          <Icon name="plus" size={18}/>
          <span style={{ fontSize:12.5, fontWeight:600 }}>Add milestone</span>
        </div>
      </div>

      {showAddMs && <AddMilestoneModal projectId={projectId} existingCount={milestones.length} onClose={() => setShowAddMs(false)} onSaved={loadMilestones} />}
      {editMs    && <AddMilestoneModal projectId={projectId} existingCount={milestones.length} editMilestone={editMs} onClose={() => setEditMs(null)} onSaved={loadMilestones} />}
    </div>
  );
}

// ── QuadrantTab ───────────────────────────────────────────────────────────────
function QuadrantTab({ projectId, items, updateItem, deleteItem, openAddItem, openEditItem }) {
  const [showDropConfirm, setShowDropConfirm] = useState(false);

  const quadrantable = items.filter(it => ['task','deliverable','followup'].includes(it.section_type)
    && !['done','delivered','approved'].includes(it.status));
  const classified   = quadrantable.filter(it => it.importance !== null && it.urgency !== null);
  const triage       = quadrantable.filter(it => it.importance === null || it.urgency === null);
  const dropItems    = classified.filter(it => it.importance === 0 && it.urgency === 0);

  const getQuadrant = (imp, urg) => classified.filter(it => it.importance === imp && it.urgency === urg);

  const bulkDropDelete = async () => {
    await Promise.all(dropItems.map(it => deleteItem(it.id)));
    setShowDropConfirm(false);
  };

  if (quadrantable.length === 0) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center' }}>
        <Icon name="target" size={40} color="#D1D1D8"/>
        <div style={{ fontSize:15, fontWeight:600, color:'#5A5A66', marginTop:16, marginBottom:6 }}>No items to prioritize yet</div>
        <div style={{ fontSize:13, color:'#9A9AA4', maxWidth:340 }}>
          Add tasks, follow-ups, or deliverables from other tabs, then set their importance and urgency to see them here.
        </div>
        <button onClick={() => openAddItem({ section_type:'task', importance:1, urgency:1 })}
          style={{ marginTop:20, height:38, padding:'0 18px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:700, border:'none', cursor:'pointer' }}>
          + Add first task
        </button>
      </div>
    );
  }

  const QCell = ({ imp, urg, meta }) => {
    const cellItems = getQuadrant(imp, urg);
    const isDrop = imp === 0 && urg === 0;
    return (
      <div style={{ background: meta.lightBg, borderRadius:12, padding:14, border:`1px solid ${meta.bg}`, minHeight:160, display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:13.5, fontWeight:800, color: meta.color }}>{meta.label}</div>
            <div style={{ fontSize:11, color:'#9A9AA4', marginTop:1 }}>{meta.sub}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {isDrop && dropItems.length > 0 && (
              <button onClick={() => setShowDropConfirm(true)}
                style={{ fontSize:10.5, fontWeight:700, padding:'3px 8px', borderRadius:6, background:'#FEF2F2', color:'#DC2626', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
                Clear {dropItems.length}
              </button>
            )}
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:10, background: meta.bg, color: meta.color }}>{cellItems.length}</span>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1 }}>
          {cellItems.map(it => {
            const itDone = ['done','delivered','approved'].includes(it.status);
            return (
            <div key={it.id} onClick={() => openEditItem(it)}
              style={{ background:'#fff', borderRadius:8, padding:'8px 10px', border:'1px solid #EEEEF1',
                opacity: isDrop ? 0.55 : 1, cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='#CCCCD8'}
              onMouseLeave={e => e.currentTarget.style.borderColor='#EEEEF1'}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <SectionTypeBadge type={it.section_type}/>
                {it.due_date && !itDone && <DuePill iso={it.due_date}/>}
                <div style={{ flex:1 }}/>
                <button onClick={e => { e.stopPropagation(); deleteItem(it.id); }} style={{ color:'#D4D4DA', background:'none', border:'none', cursor:'pointer', padding:'2px', flexShrink:0 }}>
                  <Icon name="trash" size={12}/>
                </button>
              </div>
              <div style={{ fontSize:12.5, fontWeight:600,
                color: itDone ? '#9A9AA4' : '#19191F',
                textDecoration: itDone ? 'line-through' : 'none' }}>{it.title}</div>
              {it.assignee_name && (
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5 }}>
                  <Avatar name={it.assignee_name} color={it.assignee_color} size={16}/>
                  <span style={{ fontSize:11, color:'#9A9AA4' }}>{it.assignee_name}</span>
                </div>
              )}
            </div>
          ); })}
          {cellItems.length === 0 && (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, color:'#C4C4CC', fontStyle:'italic' }}>Empty</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize:12, color:'#9A9AA4', fontStyle:'italic', marginBottom:14 }}>
        Weekly review — classify what matters and decide what to drop.
      </div>

      {/* 2×2 grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        <QCell imp={1} urg={0} meta={QUADRANT_META[1]}/>
        <QCell imp={1} urg={1} meta={QUADRANT_META[0]}/>
        <QCell imp={0} urg={0} meta={QUADRANT_META[3]}/>
        <QCell imp={0} urg={1} meta={QUADRANT_META[2]}/>
      </div>
      {/* Column headers */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:-8, marginBottom:20 }}>
        <div style={{ textAlign:'center', fontSize:10.5, fontWeight:700, color:'#9A9AA4', letterSpacing:'0.04em', textTransform:'uppercase' }}>Low Urgency</div>
        <div style={{ textAlign:'center', fontSize:10.5, fontWeight:700, color:'#9A9AA4', letterSpacing:'0.04em', textTransform:'uppercase' }}>High Urgency</div>
      </div>

      {/* Triage strip */}
      {triage.length > 0 && (
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#9A9AA4', marginBottom:8 }}>
            Triage · {triage.length} unclassified — set importance and urgency to place in a quadrant
          </div>
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8 }}>
            {triage.map(it => (
              <div key={it.id} onClick={() => openEditItem(it)}
                style={{ minWidth:200, background:'#fff', borderRadius:10, padding:'10px 12px',
                  border:'1px solid #EEEEF1', flexShrink:0, cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='#CCCCD8'}
                onMouseLeave={e => e.currentTarget.style.borderColor='#EEEEF1'}>
                <SectionTypeBadge type={it.section_type}/>
                <div style={{ fontSize:12.5, fontWeight:600, marginTop:5, marginBottom:8,
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.title}</div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }} onClick={e => e.stopPropagation()}>
                  <IUBadge
                    importance={it.importance} urgency={it.urgency}
                    onChangeI={v => updateItem(it.id, { importance: v })}
                    onChangeU={v => updateItem(it.id, { urgency: v })}
                  />
                  {it.due_date && <DuePill iso={it.due_date}/>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop confirm */}
      {showDropConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:70, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div onClick={() => setShowDropConfirm(false)} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.34)' }}/>
          <div style={{ position:'relative', width:360, background:'#fff', borderRadius:16, padding:'24px', boxShadow:'0 16px 48px rgba(20,20,30,0.22)', textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:10 }}>Clear dropped items?</div>
            <div style={{ fontSize:13.5, color:'#7E7E88', marginBottom:20 }}>
              This will permanently delete all {dropItems.length} item{dropItems.length !== 1 ? 's' : ''} in the Drop quadrant.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => setShowDropConfirm(false)} style={{ height:38, padding:'0 18px', borderRadius:9, background:'#F2F2F5', color:'#5A5A66', fontSize:14, fontWeight:600, border:'none', cursor:'pointer' }}>Cancel</button>
              <button onClick={bulkDropDelete} style={{ height:38, padding:'0 18px', borderRadius:9, background:'#DC2626', color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer' }}>Delete all</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Project OverviewTab ───────────────────────────────────────────────────────
function OverviewTab({ items, milestones, openEditItem }) {
  const actionable = items.filter(it => ['task','deliverable','followup'].includes(it.section_type));
  const openTasks      = items.filter(it => it.section_type === 'task'        && it.status === 'open');
  const openFollowups  = items.filter(it => it.section_type === 'followup'    && it.status === 'open');
  const pendingDelivs  = items.filter(it => it.section_type === 'deliverable' && ['draft','review'].includes(it.status));
  const overdueItems   = actionable.filter(it =>
    !['done','delivered','approved'].includes(it.status) && it.due_date && diffDays(it.due_date) < 0
  );
  const dueThisWeek = actionable.filter(it => {
    if (['done','delivered','approved'].includes(it.status) || it.section_type === 'followup') return false;
    const d = diffDays(it.due_date);
    return d != null && d >= 0 && d <= 7;
  }).sort((a, b) => (a.due_date || '') < (b.due_date || '') ? -1 : 1);

  const totalA = actionable.length;
  const doneA  = actionable.filter(it => ['done','delivered','approved'].includes(it.status)).length;
  const pct    = totalA > 0 ? Math.round(doneA / totalA * 100) : 0;

  const openEffortHours = actionable
    .filter(it => !['done','delivered','approved'].includes(it.status))
    .reduce((sum, it) => sum + (+it.effort_hours || 0), 0);

  const kpis = [
    { label:'Open Tasks',   value: openTasks.length,     color: openTasks.length     ? '#2563EB' : '#16A34A', bg: openTasks.length     ? '#EFF4FF' : '#ECFDF3' },
    { label:'Overdue',      value: overdueItems.length,  color: overdueItems.length  ? '#DC2626' : '#16A34A', bg: overdueItems.length  ? '#FEF2F2' : '#ECFDF3' },
    { label:'Deliverables', value: pendingDelivs.length, color: pendingDelivs.length ? '#D97706' : '#16A34A', bg: pendingDelivs.length ? '#FEF6E7' : '#ECFDF3' },
    { label:'Follow-ups',   value: openFollowups.length, color: openFollowups.length ? '#7C3AED' : '#16A34A', bg: openFollowups.length ? '#F5F0FF' : '#ECFDF3' },
    { label:'Open effort',  value: openEffortHours ? `${+openEffortHours.toFixed(1)}h` : '—', color:'#0891B2', bg:'#ECFEFF' },
  ];

  const delivStatusLabel = { draft:'Draft', review:'Review', approved:'Approved', delivered:'Delivered' };
  const delivStatusColor = { draft:'#64748B', review:'#D97706', approved:'#2563EB', delivered:'#16A34A' };
  const delivStatusBg    = { draft:'#F1F5F9', review:'#FEF6E7', approved:'#EFF4FF', delivered:'#ECFDF3' };

  const ItemRow = ({ item }) => (
    <div onClick={() => openEditItem?.(item)}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid #F2F2F5',
        cursor: openEditItem ? 'pointer' : 'default' }}
      onMouseEnter={e => e.currentTarget.style.background='#FAFAFB'}
      onMouseLeave={e => e.currentTarget.style.background=''}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.title}</div>
        {item.assignee_name && <div style={{ fontSize:11.5, color:'#9A9AA4', marginTop:1 }}>→ {item.assignee_name}</div>}
      </div>
      {item.section_type === 'deliverable' && (
        <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:6,
          color: delivStatusColor[item.status] || '#64748B',
          background: delivStatusBg[item.status] || '#F1F5F9', whiteSpace:'nowrap' }}>
          {delivStatusLabel[item.status] || item.status}
        </span>
      )}
      {item.section_type === 'task' && (
        <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:6, color:'#2563EB', background:'#EFF4FF' }}>Task</span>
      )}
      {item.due_date && <DuePill iso={item.due_date}/>}
    </div>
  );

  const Section = ({ title, dotColor, rows }) => {
    if (!rows.length) return null;
    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:dotColor, flexShrink:0 }}/>
          <span style={{ fontSize:13, fontWeight:700 }}>{title}</span>
          <span style={{ fontSize:12, color:'#9A9AA4' }}>{rows.length}</span>
        </div>
        <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
          {rows.map(it => <ItemRow key={it.id} item={it}/>)}
        </div>
      </div>
    );
  };

  const allClear = overdueItems.length === 0 && dueThisWeek.length === 0 && openFollowups.length === 0 && pendingDelivs.length === 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

      {/* Progress bar */}
      {totalA > 0 && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6B6B76', marginBottom:5 }}>
            <span>Overall completion</span>
            <span style={{ fontWeight:700, color: pct === 100 ? '#16A34A' : '#5A5A66' }}>{pct}% · {doneA}/{totalA}</span>
          </div>
          <div style={{ height:7, background:'#EEEEF1', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background: pct === 100 ? '#16A34A' : ACCENT, borderRadius:4 }}/>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${kpis.length}, 1fr)`, gap:10 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
            <div style={{ fontSize:24, fontWeight:800, color:k.color }}>{k.value}</div>
            <div style={{ fontSize:12, color:'#8A8A94', marginTop:3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Overdue — show first, most urgent */}
      <Section title="Overdue" dotColor="#DC2626" rows={overdueItems}/>

      {/* Due this week */}
      <Section title="Due this week" dotColor="#2563EB" rows={dueThisWeek}/>

      {/* Follow-ups */}
      {openFollowups.length > 0 && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#7C3AED', flexShrink:0 }}/>
            <span style={{ fontSize:13, fontWeight:700 }}>Follow-ups lined up</span>
            <span style={{ fontSize:12, color:'#9A9AA4' }}>{openFollowups.length}</span>
          </div>
          <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
            {[...openFollowups].sort((a,b) => (a.due_date||'z') < (b.due_date||'z') ? -1 : 1).map(it => (
              <div key={it.id} onClick={() => openEditItem?.(it)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid #F2F2F5',
                  cursor: openEditItem ? 'pointer' : 'default' }}
                onMouseEnter={e => e.currentTarget.style.background='#FAFAFB'}
                onMouseLeave={e => e.currentTarget.style.background=''}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.title}</div>
                  {(it.followup_contact_name || it.assignee_name) && (
                    <div style={{ fontSize:11.5, color:'#7C3AED', marginTop:1 }}>
                      {it.followup_contact_name ? `with ${it.followup_contact_name}` : `→ ${it.assignee_name}`}
                    </div>
                  )}
                </div>
                {it.recurrence && it.recurrence !== 'none' && (
                  <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 7px', borderRadius:6, color:'#7C3AED', background:'#F5F0FF' }}>↻ {it.recurrence}</span>
                )}
                <DuePill iso={it.due_date}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending deliverables */}
      <Section title="Pending deliverables" dotColor="#D97706" rows={pendingDelivs}/>

      {/* All clear state */}
      {allClear && (
        <div style={{ background:'#ECFDF3', border:'1px solid #BBF7D0', borderRadius:12, padding:'22px', textAlign:'center' }}>
          <div style={{ fontSize:13.5, fontWeight:700, color:'#16A34A' }}>All clear — no overdue or upcoming items this week</div>
        </div>
      )}
    </div>
  );
}

// ── TasksTab (unified: tasks + deliverables + follow-ups) ─────────────────────
const RECURRENCE_LABELS = { none:'', daily:'Daily', weekly:'Weekly', biweekly:'Every 2 wks', monthly:'Monthly' };

function TasksTab({ items, updateItem, deleteItem, openAddItem, openEditItem }) {
  const actionable = items.filter(it => ['task','deliverable','followup'].includes(it.section_type));
  const [showDone, setShowDone] = useState(false);

  const isDone = it => it.section_type === 'deliverable' ? it.status === 'delivered' : it.status === 'done';

  const open = actionable.filter(it => !isDone(it));
  const done = actionable.filter(it =>  isDone(it));

  const Row = ({ it }) => {
    const finished = isDone(it);
    const [showChecklist, setShowChecklist] = useState(false);
    const checklist = Array.isArray(it.checklist) ? it.checklist : [];
    const checklistDone = checklist.filter(c => c.done).length;
    const delivSm  = it.section_type === 'deliverable'
      ? (DELIVERABLE_STATUSES.find(s => s.key === it.status) || DELIVERABLE_STATUSES[0])
      : null;
    const cycleDeliv = () => {
      const seq = ['draft','review','approved','delivered'];
      updateItem(it.id, { status: seq[(seq.indexOf(it.status) + 1) % seq.length] });
    };

    // Completion timestamp + early/late marker
    const CompletedMeta = () => {
      if (!finished || !it.completed_at) return null;
      const completedDate = new Date(it.completed_at);
      const label = completedDate.toLocaleString([], {
        month:'short', day:'numeric',
        hour:'2-digit', minute:'2-digit'
      });
      let marker = null;
      if (it.due_date) {
        const due = new Date(String(it.due_date).slice(0, 10) + 'T23:59:59');
        const diffDays = Math.round((completedDate - due) / 86400000);
        if (diffDays <= 0) {
          marker = <span style={{ fontSize:10.5, fontWeight:700, padding:'1px 6px', borderRadius:6, background:'#ECFDF3', color:'#16A34A', whiteSpace:'nowrap' }}>
            {diffDays < -1 ? `${Math.abs(diffDays)}d early` : 'On time'}
          </span>;
        } else {
          marker = <span style={{ fontSize:10.5, fontWeight:700, padding:'1px 6px', borderRadius:6, background:'#FEF2F2', color:'#DC2626', whiteSpace:'nowrap' }}>
            {diffDays === 1 ? '1d late' : `${diffDays}d late`}
          </span>;
        }
      }
      return (
        <div style={{ fontSize:11, color:'#B0B0BA', marginTop:3, display:'flex', alignItems:'center', gap:5 }}>
          <span>Done {label}</span>
          {marker}
        </div>
      );
    };

    return (
      <div style={{ borderBottom:'1px solid #F2F2F5' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 15px', opacity:finished?0.55:1 }}>
        {/* Left control */}
        {it.section_type === 'deliverable' ? (
          <button onClick={cycleDeliv}
            style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, color:delivSm.color, background:delivSm.bg, border:`1px solid ${delivSm.color}33`, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
            {delivSm.label}
          </button>
        ) : (
          <button onClick={() => updateItem(it.id, { status: it.status==='done'?'open':'done' })}
            style={{ width:22, height:22, borderRadius:6, border:'2px solid', flexShrink:0, cursor:'pointer',
              borderColor:finished?'#16A34A':'#D1D1D8', background:finished?'#16A34A':'transparent',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            {finished && <Icon name="check" size={12} color="#fff"/>}
          </button>
        )}

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
            {it.section_type !== 'task' && <SectionTypeBadge type={it.section_type}/>}
            <span style={{ fontSize:13.5, fontWeight:500, textDecoration:finished?'line-through':'none',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.title}</span>
            {it.sync_to_crm && <Icon name="link" size={12} color={ACCENT} title="Syncs to CRM when done"/>}
            {it.recurrence && it.recurrence !== 'none' && (
              <span style={{ fontSize:10.5, fontWeight:700, padding:'1px 6px', borderRadius:6, background:'#EFF4FF', color:'#2563EB', whiteSpace:'nowrap' }}>
                ↻ {RECURRENCE_LABELS[it.recurrence] || it.recurrence}
              </span>
            )}
          </div>
          {(it.followup_contact_name || it.assignee_name) && (
            <div style={{ fontSize:11.5, color:'#9A9AA4', marginTop:2, display:'flex', gap:8 }}>
              {it.followup_contact_name && <span><Icon name="users" size={11}/> {it.followup_contact_name}{it.followup_contact_company ? ` · ${it.followup_contact_company}` : ''}</span>}
              {it.assignee_name && <span>→ {it.assignee_name}</span>}
            </div>
          )}
          <CompletedMeta/>
        </div>

        {it.doc_type && <DocTypeBadge type={it.doc_type}/>}
        {checklist.length > 0 && (
          <button onClick={() => setShowChecklist(v => !v)}
            title="Definition of done"
            style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, whiteSpace:'nowrap', cursor:'pointer',
              color: checklistDone === checklist.length ? '#16A34A' : '#6B6B76',
              background: checklistDone === checklist.length ? '#ECFDF3' : '#F2F2F5', border:'none', flexShrink:0 }}>
            ☑ {checklistDone}/{checklist.length}
          </button>
        )}
        <ContextChip tag={it.context_tag}/>
        <EffortBadge size={it.effort_size} hours={it.effort_hours}/>
        <IUBadge importance={it.importance} urgency={it.urgency}
          onChangeI={v => updateItem(it.id, { importance: v })}
          onChangeU={v => updateItem(it.id, { urgency: v })} />
        {it.assignee_name && <Avatar name={it.assignee_name} color={it.assignee_color} size={24}/>}
        {!finished && <WaitingPill waitingOn={it.waiting_on} contactName={it.waiting_contact_name} since={it.waiting_since}/>}
        {!finished && it.due_date && <DuePill iso={it.due_date}/>}
        <button onClick={() => openEditItem(it)} style={{ color:'#B0B0BA', background:'none', border:'none', cursor:'pointer', padding:'3px' }} title="Edit">
          <Icon name="pencil" size={13}/>
        </button>
        <button onClick={() => deleteItem(it.id)} style={{ color:'#C4C4CC', background:'none', border:'none', cursor:'pointer', padding:'3px' }}>
          <Icon name="trash" size={14}/>
        </button>
      </div>
      {showChecklist && checklist.length > 0 && (
        <div style={{ padding:'2px 15px 11px 47px', display:'flex', flexDirection:'column', gap:5 }}>
          {checklist.map((c, idx) => (
            <label key={idx} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5, cursor:'pointer',
              color: c.done ? '#9A9AA4' : '#3A3A44', textDecoration: c.done ? 'line-through' : 'none' }}>
              <input type="checkbox" checked={!!c.done}
                onChange={e => updateItem(it.id, { checklist: checklist.map((x,i) => i===idx ? { ...x, done:e.target.checked } : x) })}
                style={{ width:14, height:14, cursor:'pointer' }} />
              {c.text}
            </label>
          ))}
        </div>
      )}
      </div>
    );
  };

  if (actionable.length === 0) return (
    <div style={{ textAlign:'center', padding:'48px 20px', color:'#9A9AA4' }}>
      <Icon name="task" size={36} color="#D1D1D8"/>
      <div style={{ marginTop:14, fontSize:14, fontWeight:600, color:'#5A5A66' }}>No items yet</div>
      <div style={{ fontSize:13, color:'#9A9AA4', marginTop:6, marginBottom:14 }}>Add tasks, deliverables, or follow-ups — all in one place.</div>
      <button onClick={() => openAddItem({ section_type:'task' })}
        style={{ height:36, padding:'0 16px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }}>+ Add item</button>
    </div>
  );

  return (
    <div>
      {open.length > 0 && (
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:'#6B6B76', marginBottom:7 }}>Open · {open.length}</div>
          <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
            {open.map(it => <Row key={it.id} it={it}/>)}
          </div>
        </div>
      )}
      {done.length > 0 && (
        <div style={{ marginBottom:18 }}>
          <button onClick={() => setShowDone(v => !v)}
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, fontWeight:700, color:'#6B6B76', marginBottom:7, background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <span style={{ display:'flex', transform: showDone ? 'rotate(0deg)' : 'rotate(-90deg)', transition:'transform .15s' }}><Icon name="chevron" size={13} color="#9A9AA4"/></span>
            Completed · {done.length}
          </button>
          {showDone && (
            <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
              {done.map(it => <Row key={it.id} it={it}/>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ProjectNotesSection ────────────────────────────────────────────────────────
// Persistent scratchpad at the bottom of every project tab — free-form text notes
function ProjectNotesSection({ projectId, items, loadItems }) {
  const [open,    setOpen]    = useState(true);
  const [draft,   setDraft]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [editing, setEditing] = useState(null); // { id, body }

  const notes = items.filter(it => it.section_type === 'context')
    .slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  const addNote = async () => {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    try {
      const title = text.split('\n')[0].slice(0, 120) || 'Note';
      await api.post(`/projects/${projectId}/items`, { section_type:'context', title, body: text });
      setDraft('');
      loadItems();
    } finally { setSaving(false); }
  };

  const saveEdit = async (id, body) => {
    const text = body.trim();
    if (!text) return;
    const title = text.split('\n')[0].slice(0, 120) || 'Note';
    await api.put(`/projects/${projectId}/items/${id}`, { title, body: text });
    setEditing(null);
    loadItems();
  };

  const deleteNote = async (id) => {
    await api.delete(`/projects/${projectId}/items/${id}`);
    loadItems();
  };

  const taStyle = { width:'100%', minHeight:80, padding:'10px 12px', border:'1px solid #E5E5EA', borderRadius:10,
    fontSize:13.5, lineHeight:1.6, resize:'vertical', background:'#FAFAFB', outline:'none', boxSizing:'border-box',
    fontFamily:'inherit' };

  return (
    <div style={{ marginTop:32, borderTop:'2px solid #EEEEF1', paddingTop:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: open ? 16 : 0, cursor:'pointer' }}
        onClick={() => setOpen(o => !o)}>
        <Icon name="doc" size={15} color="#9A9AA4"/>
        <span style={{ fontSize:13.5, fontWeight:700, color:'#5A5A66' }}>Project Notes</span>
        {notes.length > 0 && (
          <span style={{ fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:8, background:'#EEEEF1', color:'#7A7A85' }}>
            {notes.length}
          </span>
        )}
        <span style={{ marginLeft:'auto', color:'#B0B0BA', fontSize:12 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div>
          {/* Add note input */}
          <div style={{ marginBottom:16 }}>
            <textarea
              placeholder="Meeting notes, random thoughts, context for the team…"
              value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addNote(); }}
              style={taStyle}/>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:6, gap:8, alignItems:'center' }}>
              <span style={{ fontSize:11, color:'#B0B0BA' }}>Ctrl+Enter to save</span>
              <button onClick={addNote} disabled={saving || !draft.trim()}
                style={{ height:32, padding:'0 14px', borderRadius:8, background:ACCENT, color:'#fff',
                  fontSize:13, fontWeight:700, border:'none', cursor:'pointer',
                  opacity: (!draft.trim() || saving) ? 0.5 : 1 }}>
                {saving ? 'Saving…' : 'Add Note'}
              </button>
            </div>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <div style={{ fontSize:13, color:'#B0B0BA', fontStyle:'italic', padding:'8px 0' }}>
              No notes yet. Jot down meeting recaps, ideas, or anything the team needs to know.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {notes.map(n => (
                <div key={n.id} style={{ background:'#FAFAFB', border:'1px solid #EEEEF1', borderRadius:10, padding:'12px 14px' }}>
                  {editing?.id === n.id ? (
                    <div>
                      <textarea value={editing.body} onChange={e => setEditing(ed => ({ ...ed, body: e.target.value }))}
                        style={{ ...taStyle, minHeight:60, marginBottom:8 }}/>
                      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <button onClick={() => setEditing(null)}
                          style={{ height:30, padding:'0 12px', borderRadius:7, background:'#F2F2F5', color:'#5A5A66', fontSize:12.5, fontWeight:600, border:'none', cursor:'pointer' }}>Cancel</button>
                        <button onClick={() => saveEdit(n.id, editing.body)}
                          style={{ height:30, padding:'0 12px', borderRadius:7, background:ACCENT, color:'#fff', fontSize:12.5, fontWeight:700, border:'none', cursor:'pointer' }}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize:13, color:'#2A2A35', lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                        {n.body || n.title}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, paddingTop:8, borderTop:'1px solid #F2F2F5' }}>
                        {n.created_by_name && <Avatar name={n.created_by_name} color={n.created_by_color} size={16}/>}
                        <span style={{ fontSize:11, color:'#9A9AA4', flex:1 }}>{fmtDate(n.created_at)}</span>
                        <button onClick={() => setEditing({ id: n.id, body: n.body || n.title })}
                          style={{ color:'#B0B0BA', background:'none', border:'none', cursor:'pointer', padding:'2px 4px' }}>
                          <Icon name="pencil" size={12}/>
                        </button>
                        <button onClick={() => deleteNote(n.id)}
                          style={{ color:'#C4C4CC', background:'none', border:'none', cursor:'pointer', padding:'2px 4px' }}>
                          <Icon name="trash" size={13}/>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ── ProjectDetail ─────────────────────────────────────────────────────────────
function ProjectDetail({ projectId, onBack, currentUserId, isAdmin, users, contacts, deals, onProjectDeleted, onProjectUpdated }) {
  const [project,    setProject]    = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [items,      setItems]      = useState([]);
  const [activeTab,  setActiveTab]  = useState('overview');
  const [loading,    setLoading]    = useState(true);
  const [showAddItem,      setShowAddItem]      = useState(false);
  const [addItemDefaults,  setAddItemDefaults]  = useState({});
  const [editingItem,      setEditingItem]      = useState(null);
  const [showEditProject,  setShowEditProject]  = useState(false);
  const [showRetro,        setShowRetro]        = useState(false);
  const [showDeleteConfirm,setShowDeleteConfirm]= useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadProject    = useCallback(() => api.get(`/projects/${projectId}`).then(r => setProject(r.data)), [projectId]);
  const loadMilestones = useCallback(() => api.get(`/projects/${projectId}/milestones`).then(r => setMilestones(r.data)), [projectId]);
  const loadItems      = useCallback(() => api.get(`/projects/${projectId}/items`).then(r => setItems(r.data)), [projectId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadProject(), loadMilestones(), loadItems()]).finally(() => setLoading(false));
  }, [projectId]);

  const updateItem = useCallback(async (id, patch) => {
    await api.put(`/projects/${projectId}/items/${id}`, patch);
    loadItems();
    onProjectUpdated?.();
  }, [projectId, onProjectUpdated]);

  const deleteItem = useCallback(async (id) => {
    await api.delete(`/projects/${projectId}/items/${id}`);
    loadItems();
    onProjectUpdated?.();
  }, [projectId, onProjectUpdated]);

  const openAddItem = (defaults = {}) => {
    setAddItemDefaults(defaults);
    setEditingItem(null);
    setShowAddItem(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setAddItemDefaults({});
    setShowAddItem(true);
  };

  const doDeleteProject = async () => {
    setDeleting(true);
    try {
      await api.delete(`/projects/${projectId}`);
      onProjectDeleted();
    } finally { setDeleting(false); }
  };

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#9A9AA4', fontSize:14 }}>Loading…</div>;
  if (!project) return <div style={{ padding:40, textAlign:'center', color:'#DC2626' }}>Project not found.</div>;

  const openCount    = items.filter(it => ['task','deliverable','followup'].includes(it.section_type) &&
    (it.section_type === 'deliverable' ? it.status !== 'delivered' : it.status !== 'done')).length;
  const overdueCount = items.filter(it => ['task','deliverable','followup'].includes(it.section_type) &&
    !['done','delivered'].includes(it.status) && it.due_date && diffDays(it.due_date) < 0).length;
  const triageCount  = items.filter(it => ['task','deliverable','followup'].includes(it.section_type) &&
    !['done','delivered','approved'].includes(it.status) &&
    (it.importance === null || it.urgency === null)).length;

  const TABS = [
    { key:'overview', label:'Overview', badge: overdueCount || null, badgeColor:'#DC2626' },
    { key:'quadrant', label:'Quadrant', badge: triageCount  || null, badgeColor:'#EA580C' },
    { key:'tasks',    label:'Tasks',    badge: openCount    || null },
  ];

  const SECTION_FOR_TAB = { tasks:'task' };

  const headerRowStyle = { display:'flex', alignItems:'center', gap:10, marginBottom:18, flexWrap:'wrap' };
  const chipStyle = (color, bg) => ({ display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:600,
    padding:'3px 9px', borderRadius:7, color, background: bg, border:'none', whiteSpace:'nowrap' });

  return (
    <div>
      {/* Header */}
      <div style={headerRowStyle}>
        <button onClick={onBack}
          style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'#6B6B76', background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:7 }}>
          ← Projects
        </button>
        <div style={{ width:14, height:14, borderRadius:4, background:project.color, flexShrink:0 }}/>
        <div style={{ fontSize:19, fontWeight:800, letterSpacing:'-0.02em', flex:1 }}>{project.title}</div>
        {project.contact_name && (
          <span style={chipStyle('#5A5A66','#F2F2F5')}>
            <Icon name="users" size={12}/>{project.contact_name}
          </span>
        )}
        {project.deal_title && (
          <span style={chipStyle('#2563EB','#EFF4FF')}>
            <Icon name="briefcase" size={12}/>{project.deal_title}
          </span>
        )}
        {['completed','archived'].includes(project.status) && (
          <button onClick={() => setShowRetro(true)}
            style={{ display:'flex', alignItems:'center', gap:5, height:32, padding:'0 12px', borderRadius:8,
              border:'1px solid #FDDCB8', background:'#FFF1E9', color:'#EA580C', fontSize:12.5, fontWeight:700, cursor:'pointer' }}>
            <Icon name="rotate" size={13}/>{project.retro ? 'Retro' : 'Add retro'}
          </button>
        )}
        <button onClick={() => setShowEditProject(true)}
          style={{ width:32, height:32, borderRadius:8, border:'1px solid #E5E5EA', display:'flex', alignItems:'center', justifyContent:'center', color:'#6B6B76', background:'#FAFAFB', cursor:'pointer' }}>
          <Icon name="pencil" size={15}/>
        </button>
        <button onClick={() => setShowDeleteConfirm(true)}
          style={{ width:32, height:32, borderRadius:8, border:'1px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center', color:'#DC2626', background:'#FEF2F2', cursor:'pointer' }}>
          <Icon name="trash" size={15}/>
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:2, borderBottom:'2px solid #EEEEF1', marginBottom:22, overflowX:'auto' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', fontSize:13.5, fontWeight:active?700:500,
                color: active ? ACCENT : '#6B6B76', background:'none', border:'none', cursor:'pointer',
                borderBottom: active ? `2px solid ${ACCENT}` : '2px solid transparent', whiteSpace:'nowrap',
                marginBottom:-2 }}>
              {tab.label}
              {tab.badge ? (
                <span style={{ fontSize:10.5, fontWeight:700, padding:'1px 6px', borderRadius:10,
                  background: active ? ACCENT : (tab.badgeColor || '#E9E9EE'),
                  color: active ? '#fff' : (tab.badgeColor ? '#fff' : '#7A7A85') }}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
        <div style={{ flex:1 }}/>
        {activeTab === 'overview' && (
          <button onClick={() => openAddItem({ section_type:'task' })}
            style={{ display:'flex', alignItems:'center', gap:6, height:34, padding:'0 13px', borderRadius:8,
              background:ACCENT, color:'#fff', fontSize:13, fontWeight:700, border:'none', cursor:'pointer', alignSelf:'center', marginBottom:4 }}>
            <Icon name="plus" size={14}/>Add task
          </button>
        )}
        {!['overview','quadrant'].includes(activeTab) && (
          <button onClick={() => openAddItem({ section_type: SECTION_FOR_TAB[activeTab] || 'task' })}
            style={{ display:'flex', alignItems:'center', gap:6, height:34, padding:'0 13px', borderRadius:8,
              background:ACCENT, color:'#fff', fontSize:13, fontWeight:700, border:'none', cursor:'pointer', alignSelf:'center', marginBottom:4 }}>
            <Icon name="plus" size={14}/>Add
          </button>
        )}
        {activeTab === 'quadrant' && (
          <button onClick={() => openAddItem({ section_type:'task', importance:1, urgency:1 })}
            style={{ display:'flex', alignItems:'center', gap:6, height:34, padding:'0 13px', borderRadius:8,
              background:ACCENT, color:'#fff', fontSize:13, fontWeight:700, border:'none', cursor:'pointer', alignSelf:'center', marginBottom:4 }}>
            <Icon name="plus" size={14}/>Add to Do First
          </button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div>
          <TimelineTab projectId={projectId} milestones={milestones} items={items}
            loadMilestones={loadMilestones} loadItems={loadItems} users={users}/>
          <div style={{ marginTop:26 }}>
            <OverviewTab items={items} milestones={milestones} openEditItem={openEditItem}/>
          </div>
        </div>
      )}
      {activeTab === 'quadrant' && (
        <QuadrantTab projectId={projectId} items={items} updateItem={updateItem} deleteItem={deleteItem} openAddItem={openAddItem} openEditItem={openEditItem}/>
      )}
      {activeTab === 'tasks' && (
        <TasksTab items={items} updateItem={updateItem} deleteItem={deleteItem} openAddItem={openAddItem} openEditItem={openEditItem}/>
      )}

      {/* Project Notes scratchpad — always visible below tab content */}
      <ProjectNotesSection projectId={projectId} items={items} loadItems={loadItems}/>

      {/* Modals */}
      {showAddItem && (
        <AddItemModal projectId={projectId} milestones={milestones} users={users} contacts={contacts}
          defaults={addItemDefaults}
          editItem={editingItem}
          hasCrmContact={!!project.contact_id}
          onClose={() => { setShowAddItem(false); setEditingItem(null); }}
          onSaved={() => { loadItems(); setEditingItem(null); onProjectUpdated?.(); }}/>
      )}

      {showEditProject && (
        <EditProjectModal project={project} contacts={contacts} deals={deals}
          onClose={() => setShowEditProject(false)}
          onSaved={async () => {
            const wasActive = project.status === 'active';
            await loadProject();
            onProjectUpdated();
            if (wasActive) {
              const fresh = await api.get(`/projects/${projectId}`).then(r => r.data);
              if (['completed','archived'].includes(fresh.status) && !fresh.retro) {
                setShowRetro(true);
              }
            }
          }}/>
      )}
      {showRetro && project && (
        <RetroModal project={project} onClose={() => setShowRetro(false)} onSaved={() => { loadProject(); setShowRetro(false); }}/>
      )}

      {showDeleteConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:70, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div onClick={() => setShowDeleteConfirm(false)} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.34)' }}/>
          <div style={{ position:'relative', width:360, background:'#fff', borderRadius:16, padding:'26px', boxShadow:'0 16px 48px rgba(20,20,30,0.22)', textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:10 }}>Delete project?</div>
            <div style={{ fontSize:13.5, color:'#7E7E88', marginBottom:22 }}>
              "<strong>{project.title}</strong>" and all its items will be permanently deleted.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ height:38, padding:'0 18px', borderRadius:9, background:'#F2F2F5', color:'#5A5A66', fontSize:14, fontWeight:600, border:'none', cursor:'pointer' }}>Cancel</button>
              <button onClick={doDeleteProject} disabled={deleting}
                style={{ height:38, padding:'0 18px', borderRadius:9, background:'#DC2626', color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer', opacity:deleting?0.7:1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EditProjectModal ──────────────────────────────────────────────────────────
function EditProjectModal({ project, contacts, deals, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:       project.title,
    description: project.description || '',
    contact_id:  project.contact_id  || '',
    deal_id:     project.deal_id     || '',
    color:       project.color       || '#5B5BD6',
    status:      project.status      || 'active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.title.trim()) { setError('Title required'); return; }
    setSaving(true); setError('');
    try {
      await api.put(`/projects/${project.id}`, form);
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const inpStyle = { width:'100%', height:38, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13.5, background:'#FAFAFB', outline:'none', boxSizing:'border-box' };
  const labelStyle = { display:'block', fontSize:11.5, fontWeight:700, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.34)' }}/>
      <div style={{ position:'relative', width:500, background:'#fff', borderRadius:18, boxShadow:'0 24px 60px rgba(20,20,30,0.24)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ fontSize:16, fontWeight:700 }}>Edit project</div>
          <button onClick={onClose} style={{ color:'#8A8A94', background:'none', border:'none', cursor:'pointer' }}><Icon name="x" size={18}/></button>
        </div>
        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          <div><label style={labelStyle}>Title *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} style={inpStyle}/>
          </div>
          <div><label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={3}
              style={{ ...inpStyle, height:'auto', padding:'9px 11px', resize:'vertical' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={labelStyle}>Link contact</label>
              <select value={form.contact_id} onChange={e=>set('contact_id',e.target.value)} style={{ ...inpStyle, cursor:'pointer' }}>
                <option value="">None</option>
                {contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Link deal</label>
              <select value={form.deal_id} onChange={e=>set('deal_id',e.target.value)} style={{ ...inpStyle, cursor:'pointer' }}>
                <option value="">None</option>
                {deals.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e=>set('status',e.target.value)} style={{ ...inpStyle, cursor:'pointer' }}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div><label style={labelStyle}>Accent color</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
                {USER_COLORS.map(c=>(
                  <button key={c} onClick={()=>set('color',c)}
                    style={{ width:26, height:26, borderRadius:'50%', background:c, cursor:'pointer',
                      border: form.color===c ? '3px solid #19191F' : '3px solid transparent' }}/>
                ))}
              </div>
            </div>
          </div>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'9px 13px', color:'#DC2626', fontSize:13 }}>{error}</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:9, padding:'14px 22px', borderTop:'1px solid #EEEEF1' }}>
          <button onClick={onClose} style={{ height:38, padding:'0 16px', borderRadius:9, fontSize:13.5, fontWeight:600, color:'#5A5A66', background:'#F2F2F5', border:'none', cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ height:38, padding:'0 20px', borderRadius:9, fontSize:13.5, fontWeight:700, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', opacity:saving?0.7:1 }}>
            {saving?'Saving…':'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NewProjectModal ───────────────────────────────────────────────────────────
function NewProjectModal({ contacts, deals, onClose, onSaved }) {
  const [form, setForm] = useState({ title:'', description:'', contact_id:'', deal_id:'', color:'#5B5BD6' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.title.trim()) { setError('Title required'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/projects', form);
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const inpStyle = { width:'100%', height:38, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13.5, background:'#FAFAFB', outline:'none', boxSizing:'border-box' };
  const labelStyle = { display:'block', fontSize:11.5, fontWeight:700, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.34)' }}/>
      <div style={{ position:'relative', width:500, background:'#fff', borderRadius:18, boxShadow:'0 24px 60px rgba(20,20,30,0.24)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ fontSize:16, fontWeight:700 }}>New project</div>
          <button onClick={onClose} style={{ color:'#8A8A94', background:'none', border:'none', cursor:'pointer' }}><Icon name="x" size={18}/></button>
        </div>
        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          <div><label style={labelStyle}>Title *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Project name…" style={inpStyle} autoFocus/>
          </div>
          <div><label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2}
              placeholder="What is this project about?" style={{ ...inpStyle, height:'auto', padding:'9px 11px', resize:'vertical' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={labelStyle}>Link contact</label>
              <select value={form.contact_id} onChange={e=>set('contact_id',e.target.value)} style={{ ...inpStyle, cursor:'pointer' }}>
                <option value="">None</option>
                {contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Link deal</label>
              <select value={form.deal_id} onChange={e=>set('deal_id',e.target.value)} style={{ ...inpStyle, cursor:'pointer' }}>
                <option value="">None</option>
                {deals.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
          </div>
          <div><label style={labelStyle}>Accent color</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:2 }}>
              {USER_COLORS.map(c=>(
                <button key={c} onClick={()=>set('color',c)}
                  style={{ width:26, height:26, borderRadius:'50%', background:c, cursor:'pointer',
                    border: form.color===c ? '3px solid #19191F' : '3px solid transparent' }}/>
              ))}
            </div>
          </div>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'9px 13px', color:'#DC2626', fontSize:13 }}>{error}</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:9, padding:'14px 22px', borderTop:'1px solid #EEEEF1' }}>
          <button onClick={onClose} style={{ height:38, padding:'0 16px', borderRadius:9, fontSize:13.5, fontWeight:600, color:'#5A5A66', background:'#F2F2F5', border:'none', cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ height:38, padding:'0 20px', borderRadius:9, fontSize:13.5, fontWeight:700, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', opacity:saving?0.7:1 }}>
            {saving?'Creating…':'Create project'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── WeeklyReviewModal ─────────────────────────────────────────────────────────
function WeeklyReviewModal({ onClose, onOpenProject }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects/weekly-review')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sections = data ? [
    { key:'triage',          label:'Needs Triage',        color:'#EA580C', desc:'No importance × urgency set',   items: data.triage },
    { key:'overdueFollowups',label:'Overdue Follow-ups',  color:'#DC2626', desc:'Past due date, still open',     items: data.overdueFollowups },
    { key:'stalled',         label:'Stalled Deliverables',color:'#D97706', desc:'No updates for 14+ days',       items: data.stalled },
    { key:'milestones',      label:'Milestones This Week', color:'#2563EB', desc:'Due in the next 7 days',        items: data.milestones },
  ].filter(s => s.items.length > 0) : [];

  const total = sections.reduce((a, s) => a + s.items.length, 0);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:80, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.44)' }}/>
      <div style={{ position:'relative', width:620, maxHeight:'85vh', display:'flex', flexDirection:'column', background:'#fff', borderRadius:20, boxShadow:'0 32px 80px rgba(20,20,30,0.28)' }}>
        {/* Header */}
        <div style={{ padding:'20px 24px 14px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Icon name="rotate" size={18} color={ACCENT}/>
            <span style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.02em' }}>Weekly Review</span>
            {!loading && total > 0 && (
              <span style={{ fontSize:12, fontWeight:700, padding:'2px 9px', borderRadius:9, background:'#FFF1E9', color:'#EA580C' }}>
                {total} to review
              </span>
            )}
            <button onClick={onClose} style={{ marginLeft:'auto', color:'#9A9AA4', background:'none', border:'none', cursor:'pointer' }}><Icon name="x" size={18}/></button>
          </div>
          <div style={{ fontSize:13, color:'#7E7E88', marginTop:5 }}>
            Close loops before the new week starts. Click any item to jump to its project.
          </div>
        </div>
        {/* Body */}
        <div style={{ overflowY:'auto', padding:'18px 24px', flex:1 }}>
          {loading && <div style={{ textAlign:'center', padding:48, color:'#9A9AA4' }}>Loading…</div>}
          {!loading && sections.length === 0 && (
            <div style={{ textAlign:'center', padding:'48px 20px' }}>
              <div style={{ fontSize:40 }}>✓</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#16A34A', marginTop:12 }}>All clear!</div>
              <div style={{ fontSize:13.5, color:'#7E7E88', marginTop:6 }}>Nothing needs attention this week. Nice work.</div>
            </div>
          )}
          {sections.map(s => (
            <div key={s.key} style={{ marginBottom:22 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}>
                <span style={{ width:10, height:10, borderRadius:3, background:s.color, display:'inline-block', flexShrink:0 }}/>
                <span style={{ fontSize:14, fontWeight:700 }}>{s.label}</span>
                <span style={{ fontSize:11.5, fontWeight:700, padding:'1px 7px', borderRadius:6, background:`${s.color}18`, color:s.color }}>{s.items.length}</span>
                <span style={{ fontSize:12, color:'#9A9AA4' }}>— {s.desc}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {s.items.map(it => (
                  <button key={it.id}
                    onClick={() => { onOpenProject(it.project_id); onClose(); }}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'#FAFAFB',
                      border:'1px solid #EEEEF1', borderLeft:`3px solid ${it.project_color || ACCENT}`,
                      borderRadius:9, textAlign:'left', cursor:'pointer', width:'100%' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.title}</div>
                      <div style={{ fontSize:11.5, color:'#9A9AA4', marginTop:1 }}>{it.project_title}{it.contact_name ? ` · ${it.contact_name}` : ''}</div>
                    </div>
                    {it.due_date && <DuePill iso={it.due_date}/>}
                    {s.key === 'stalled' && (
                      <span style={{ fontSize:11, color:'#D97706', fontWeight:700, whiteSpace:'nowrap' }}>
                        {Math.round((Date.now() - new Date(it.updated_at)) / 86400000)}d idle
                      </span>
                    )}
                    {it.doc_type && <DocTypeBadge type={it.doc_type}/>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:'14px 24px', borderTop:'1px solid #EEEEF1', textAlign:'right' }}>
          <button onClick={onClose} style={{ height:36, padding:'0 20px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:700, border:'none', cursor:'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ── RetroModal ────────────────────────────────────────────────────────────────
function RetroModal({ project, onClose, onSaved }) {
  const existing = project.retro || {};
  const [form, setForm] = useState({
    worked:      existing.worked      || '',
    didnt_work:  existing.didnt_work  || '',
    change_next: existing.change_next || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/projects/${project.id}`, { retro: form });
      onSaved();
      onClose();
    } finally { setSaving(false); }
  };

  const taStyle = { width:'100%', minHeight:80, padding:'10px 12px', border:'1px solid #E5E5EA', borderRadius:10,
    fontSize:13.5, lineHeight:1.6, resize:'vertical', background:'#FAFAFB', outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
  const labelStyle = { display:'block', fontSize:11.5, fontWeight:700, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:6 };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:80, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.44)' }}/>
      <div style={{ position:'relative', width:540, background:'#fff', borderRadius:20, boxShadow:'0 32px 80px rgba(20,20,30,0.28)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ padding:'22px 24px 14px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.02em' }}>Project Retrospective</div>
          <div style={{ fontSize:13, color:'#7E7E88', marginTop:4 }}>"{project.title}" — quick close-out reflection (2 min).</div>
        </div>
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={labelStyle}>✓ What worked well?</label>
            <textarea value={form.worked} onChange={e=>set('worked',e.target.value)} style={taStyle}
              placeholder="Processes, decisions, team dynamics that helped…"/>
          </div>
          <div>
            <label style={labelStyle}>✗ What didn't work?</label>
            <textarea value={form.didnt_work} onChange={e=>set('didnt_work',e.target.value)} style={taStyle}
              placeholder="Bottlenecks, scope creep, missed estimates, communication gaps…"/>
          </div>
          <div>
            <label style={labelStyle}>→ One thing to change next time</label>
            <textarea value={form.change_next} onChange={e=>set('change_next',e.target.value)}
              style={{ ...taStyle, minHeight:60 }} placeholder="The single highest-leverage change for the next project…"/>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', gap:9, padding:'14px 24px', borderTop:'1px solid #EEEEF1' }}>
          <button onClick={onClose} style={{ height:38, padding:'0 16px', borderRadius:9, fontSize:13.5, color:'#7E7E88', background:'#F2F2F5', fontWeight:600, border:'none', cursor:'pointer' }}>
            Skip for now
          </button>
          <button onClick={save} disabled={saving}
            style={{ height:38, padding:'0 20px', borderRadius:9, fontSize:13.5, fontWeight:700, background:ACCENT, color:'#fff', border:'none', cursor:'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Saving…' : 'Save retrospective'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProjectsDashboard ─────────────────────────────────────────────────────────
function ProjectsDashboard({ projects, onSelect }) {
  const [data,    setData]    = useState(null);
  const [ppc,     setPpc]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/projects/weekly-review'),
      api.get('/projects/ppc'),
    ]).then(([wr, pp]) => {
      setData(wr.data);
      setPpc(pp.data);
    }).finally(() => setLoading(false));
  }, []);

  const activeProjects = projects.filter(p => p.status === 'active');
  const totalOpen      = activeProjects.reduce((a, p) => a + Number(p.item_count   || 0), 0);
  const totalOverdue   = activeProjects.reduce((a, p) => a + Number(p.overdue_count || 0), 0);
  const totalEffort    = activeProjects.reduce((a, p) => a + Number(p.open_effort_hours || 0), 0);
  const lastFullWeek   = ppc.find(w => !w.is_current);
  const lastPpc        = lastFullWeek?.ppc ?? null;

  if (loading) return (
    <div style={{ textAlign:'center', padding:'48px 0', color:'#9A9AA4', fontSize:14 }}>Loading dashboard…</div>
  );

  const KPI = ({ label, value, sub, accent }) => (
    <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:12, padding:'16px 20px', flex:1, minWidth:130 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'#9A9AA4', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:800, color: accent || '#19191F', lineHeight:1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize:11.5, color:'#9A9AA4', marginTop:4 }}>{sub}</div>}
    </div>
  );

  const SectionHeader = ({ title, color }) => (
    <div style={{ fontSize:12, fontWeight:700, color: color || '#5A5A66', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10, marginTop:24 }}>{title}</div>
  );

  const ItemRow = ({ it, showProject = true }) => (
    <div key={it.id} onClick={() => onSelect(it.project_id || it.id)}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#fff',
        border:'1px solid #ECECEF', borderRadius:9, cursor:'pointer', marginBottom:5,
        borderLeft: showProject && it.project_color ? `4px solid ${it.project_color}` : undefined }}
      onMouseEnter={e => e.currentTarget.style.background='#FAFAFB'}
      onMouseLeave={e => e.currentTarget.style.background='#fff'}>
      {showProject && it.project_color && !it.project_title ? null : null}
      <div style={{ flex:1, minWidth:0 }}>
        {showProject && it.project_title && (
          <div style={{ fontSize:10.5, fontWeight:700, color:'#9A9AA4', marginBottom:2 }}>{it.project_title}</div>
        )}
        <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.title}</div>
        {it.contact_name && <div style={{ fontSize:11.5, color:'#6B6B76', marginTop:1 }}>{it.contact_name}</div>}
      </div>
      {it.section_type && <SectionTypeBadge type={it.section_type}/>}
      {it.due_date && <DuePill iso={it.due_date}/>}
    </div>
  );

  const overdueItems = data?.overdueFollowups || [];
  const milestones   = data?.milestones || [];
  const stalled      = data?.stalled || [];
  const triage       = data?.triage || [];
  const waiting      = data?.waiting || [];

  const allEmpty = overdueItems.length === 0 && milestones.length === 0 && stalled.length === 0 && triage.length === 0 && waiting.length === 0;

  return (
    <div>
      {/* KPI strip */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:4 }}>
        <KPI label="Active projects"   value={activeProjects.length}/>
        <KPI label="Open items"        value={totalOpen}/>
        <KPI label="Overdue"           value={totalOverdue} accent={totalOverdue > 0 ? '#DC2626' : undefined}/>
        <KPI label="Open effort"       value={totalEffort ? `${+totalEffort.toFixed(1)}h` : '—'} sub="Estimated hours"/>
        <KPI label="Reliability (last week)" value={lastPpc !== null ? `${lastPpc}%` : '—'} sub="Done by due date"
          accent={lastPpc !== null ? (lastPpc >= 80 ? '#16A34A' : lastPpc >= 60 ? '#D97706' : '#DC2626') : undefined}/>
      </div>

      {/* Overdue follow-ups */}
      {overdueItems.length > 0 && (
        <div>
          <SectionHeader title={`Overdue follow-ups · ${overdueItems.length}`} color="#DC2626"/>
          {overdueItems.map(it => <ItemRow key={it.id} it={it}/>)}
        </div>
      )}

      {/* Milestones this week */}
      {milestones.length > 0 && (
        <div>
          <SectionHeader title={`Milestones due this week · ${milestones.length}`} color="#2563EB"/>
          {milestones.map(it => (
            <div key={it.id} onClick={() => onSelect(it.project_id)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#fff',
                border:'1px solid #ECECEF', borderRadius:9, cursor:'pointer', marginBottom:5,
                borderLeft:`4px solid ${it.project_color || ACCENT}` }}
              onMouseEnter={e => e.currentTarget.style.background='#FAFAFB'}
              onMouseLeave={e => e.currentTarget.style.background='#fff'}>
              <Icon name="flag" size={13} color="#2563EB"/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#9A9AA4', marginBottom:1 }}>{it.project_title}</div>
                <div style={{ fontSize:13, fontWeight:600 }}>{it.title}</div>
              </div>
              <DuePill iso={it.due_date}/>
            </div>
          ))}
        </div>
      )}

      {/* Stalled deliverables */}
      {stalled.length > 0 && (
        <div>
          <SectionHeader title={`Stalled deliverables · ${stalled.length}`} color="#EA580C"/>
          <div style={{ fontSize:12, color:'#9A9AA4', marginBottom:8 }}>Deliverables in draft/review with no update in 14+ days</div>
          {stalled.map(it => <ItemRow key={it.id} it={{ ...it, section_type:'deliverable' }}/>)}
        </div>
      )}

      {/* Needs triage */}
      {triage.length > 0 && (
        <div>
          <SectionHeader title={`Needs triage · ${triage.length}`} color="#7C3AED"/>
          <div style={{ fontSize:12, color:'#9A9AA4', marginBottom:8 }}>Items missing importance/urgency classification</div>
          {triage.slice(0, 8).map(it => <ItemRow key={it.id} it={it}/>)}
          {triage.length > 8 && (
            <div style={{ fontSize:12.5, color:'#9A9AA4', padding:'6px 12px' }}>+ {triage.length - 8} more — run Weekly Review to triage all</div>
          )}
        </div>
      )}

      {/* Waiting on others — chase list */}
      {waiting.length > 0 && (
        <div>
          <SectionHeader title={`Waiting on others · ${waiting.length}`} color="#D97706"/>
          <div style={{ fontSize:12, color:'#9A9AA4', marginBottom:8 }}>Items blocked on someone else — oldest first. Chase them.</div>
          {waiting.map(it => (
            <div key={it.id} onClick={() => onSelect(it.project_id)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#fff',
                border:'1px solid #ECECEF', borderRadius:9, cursor:'pointer', marginBottom:5,
                borderLeft:`4px solid ${it.project_color || ACCENT}` }}
              onMouseEnter={e => e.currentTarget.style.background='#FAFAFB'}
              onMouseLeave={e => e.currentTarget.style.background='#fff'}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#9A9AA4', marginBottom:2 }}>{it.project_title}</div>
                <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.title}</div>
              </div>
              <WaitingPill waitingOn={it.waiting_on} contactName={it.waiting_contact_name} since={it.waiting_since}/>
              {it.due_date && <DuePill iso={it.due_date}/>}
            </div>
          ))}
        </div>
      )}

      {/* Project health table */}
      {activeProjects.length > 0 && (
        <div style={{ marginTop:24 }}>
          <SectionHeader title="Project health"/>
          <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:12, overflow:'hidden' }}>
            {activeProjects.map((p, i) => {
              return (
                <div key={p.id} onClick={() => onSelect(p.id)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px',
                    borderBottom: i < activeProjects.length-1 ? '1px solid #F2F2F5' : 'none',
                    cursor:'pointer', borderLeft:`4px solid ${p.color}` }}
                  onMouseEnter={e => e.currentTarget.style.background='#FAFAFB'}
                  onMouseLeave={e => e.currentTarget.style.background=''}>
                  <div style={{ flex:1, fontSize:13.5, fontWeight:600 }}>{p.title}</div>
                  {p.contact_name && (
                    <div style={{ fontSize:12, color:'#9A9AA4', whiteSpace:'nowrap' }}>{p.contact_name}</div>
                  )}
                  <div style={{ fontSize:12, color:'#9A9AA4', whiteSpace:'nowrap' }}>{p.item_count} open</div>
                  {p.overdue_count > 0 && (
                    <div style={{ fontSize:11.5, color:'#DC2626', fontWeight:700, whiteSpace:'nowrap' }}>{p.overdue_count} overdue</div>
                  )}
                  <HealthBadge project={p}/>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allEmpty && activeProjects.length === 0 && (
        <div style={{ textAlign:'center', padding:'48px 0', color:'#9A9AA4', fontSize:14 }}>
          No active projects to report on.
        </div>
      )}

      {allEmpty && activeProjects.length > 0 && (
        <div style={{ textAlign:'center', padding:'32px 0', color:'#9A9AA4', fontSize:14 }}>
          <Icon name="check" size={28} color="#16A34A"/>
          <div style={{ marginTop:10, fontSize:15, fontWeight:600, color:'#16A34A' }}>All clear!</div>
          <div style={{ fontSize:13, marginTop:4 }}>No overdue items, no stalled deliverables, no triage needed.</div>
        </div>
      )}
    </div>
  );
}

// ── FocusQueue — computed "what matters today" list from /projects/focus ──────
function FocusQueue({ onOpenProject }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects/focus')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data || !data.items.length) return null;

  const groups = [
    { key:'overdue', label:'Overdue',   color:'#DC2626' },
    { key:'today',   label:'Today',     color:'#C2410C' },
    { key:'week',    label:'This week', color:'#2563EB' },
  ].map(g => ({ ...g, items: data.items.filter(it => it.due_bucket === g.key) }))
   .filter(g => g.items.length > 0);

  return (
    <div style={{ marginTop:16, background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:'16px 18px', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <Icon name="task" size={15} color={ACCENT}/>
        <span style={{ fontSize:14.5, fontWeight:700 }}>Today's focus</span>
        <span style={{ fontSize:12, color:'#9A9AA4' }}>
          {data.counts.overdue > 0 && <span style={{ color:'#DC2626', fontWeight:700 }}>{data.counts.overdue} overdue · </span>}
          {data.counts.today} due today · {data.counts.week} this week
        </span>
      </div>
      {groups.map(g => (
        <div key={g.key} style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:g.color, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>
            {g.label} · {g.items.length}
          </div>
          {g.items.map(it => (
            <div key={it.id} onClick={() => onOpenProject(it.project_id)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:9,
                border:'1px solid #F0F0F3', marginBottom:4, cursor:'pointer',
                borderLeft:`4px solid ${it.project_color || ACCENT}` }}
              onMouseEnter={e => e.currentTarget.style.background='#FAFAFB'}
              onMouseLeave={e => e.currentTarget.style.background=''}>
              <div style={{ flex:1, minWidth:0 }}>
                <span style={{ fontSize:10.5, fontWeight:700, color:'#9A9AA4', marginRight:8 }}>{it.project_title}</span>
                <span style={{ fontSize:13, fontWeight:600 }}>{it.title}</span>
              </div>
              <ContextChip tag={it.context_tag}/>
              <EffortBadge size={it.effort_size} hours={it.effort_hours}/>
              <WaitingPill waitingOn={it.waiting_on} contactName={it.waiting_contact_name} since={it.waiting_since}/>
              <DuePill iso={it.due_date}/>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── QuickAddTaskModal (from all-projects view) ────────────────────────────────
function QuickAddTaskModal({ projects, users, onClose, onSaved }) {
  const activeProjects = projects.filter(p => p.status === 'active');
  const [form, setForm] = useState({
    project_id:  activeProjects[0]?.id || '',
    title:       '',
    due_date:    '',
    assignee_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.project_id) { setError('Select a project'); return; }
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      await api.post(`/projects/${form.project_id}/items`, {
        section_type: 'task',
        title: form.title.trim(),
        due_date: form.due_date || null,
        assignee_id: form.assignee_id || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const labelStyle = { display:'block', fontSize:11.5, fontWeight:700, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 };
  const inpStyle   = { width:'100%', height:38, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13.5, background:'#FAFAFB', outline:'none', boxSizing:'border-box' };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.34)' }}/>
      <div style={{ position:'relative', width:440, background:'#fff', borderRadius:18, boxShadow:'0 24px 60px rgba(20,20,30,0.24)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ fontSize:16, fontWeight:700 }}>Add task</div>
          <button onClick={onClose} style={{ color:'#8A8A94', background:'none', border:'none', cursor:'pointer' }}><Icon name="x" size={18}/></button>
        </div>
        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={labelStyle}>Project</label>
            <select value={form.project_id} onChange={e => set('project_id', e.target.value)} style={inpStyle}>
              <option value="">— select project —</option>
              {activeProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Task title" style={inpStyle} autoFocus
              onKeyDown={e => e.key === 'Enter' && save()}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Due date</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} style={inpStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Assignee</label>
              <select value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)} style={inpStyle}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          {error && <div style={{ fontSize:12.5, color:'#DC2626' }}>{error}</div>}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:4 }}>
            <button onClick={onClose} style={{ height:38, padding:'0 18px', borderRadius:9, background:'#F2F2F5', color:'#5A5A66', fontSize:13.5, fontWeight:600, border:'none', cursor:'pointer' }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ height:38, padding:'0 18px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:700, border:'none', cursor:'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Add task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── GlobalQuadrantView ────────────────────────────────────────────────────────
function GlobalQuadrantView({ currentUserId, onViewModeChange, onOpenProject }) {
  const [items,          setItems]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [myOnly,         setMyOnly]         = useState(false);
  const [showDropConfirm,setShowDropConfirm]= useState(false);

  const load = () => {
    setLoading(true);
    api.get('/projects/all-items').then(r => { setItems(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const displayed   = myOnly ? items.filter(it => it.assignee_id === currentUserId) : items;
  const classified  = displayed.filter(it => it.importance !== null && it.urgency !== null);
  const triage      = displayed.filter(it => it.importance === null || it.urgency === null);
  const dropItems   = classified.filter(it => it.importance === 0 && it.urgency === 0);
  const getQuadrant = (imp, urg) => classified.filter(it => it.importance === imp && it.urgency === urg);

  const updateItem = async (projectId, itemId, patch) => {
    await api.put(`/projects/${projectId}/items/${itemId}`, patch);
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, ...patch } : it));
  };

  const bulkDropDelete = async () => {
    await Promise.all(dropItems.map(it => api.delete(`/projects/${it.project_id}/items/${it.id}`)));
    setItems(prev => prev.filter(it => !(it.importance === 0 && it.urgency === 0)));
    setShowDropConfirm(false);
  };

  const viewBtns = [
    { m:'grid',     icon:'grid',    title:'Grid view' },
    { m:'split',    icon:'sidebar', title:'Split view' },
    { m:'quadrant', icon:'target',  title:'Quadrant view' },
  ];

  const QCell = ({ imp, urg, meta }) => {
    const cellItems = getQuadrant(imp, urg);
    const isDrop = imp === 0 && urg === 0;
    return (
      <div style={{ background: meta.lightBg, borderRadius:12, padding:'8px 10px 10px', border:`1px solid ${meta.bg}`,
        minHeight:100, display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color: meta.color }}>{meta.label}</div>
            <div style={{ fontSize:10, color:'#9A9AA4' }}>{meta.sub}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            {isDrop && dropItems.length > 0 && (
              <button onClick={() => setShowDropConfirm(true)}
                style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:6,
                  background:'#FEF2F2', color:'#DC2626', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
                Clear {dropItems.length}
              </button>
            )}
            <span style={{ fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:10,
              background: meta.bg, color: meta.color }}>{cellItems.length}</span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3, flex:1 }}>
          {cellItems.map(it => (
            <div key={it.id} onClick={() => onOpenProject?.(it.project_id)}
              title={`Open ${it.project_title}`}
              style={{ background:'#fff', borderRadius:6, padding:'4px 7px',
                border:'1px solid #EEEEF1', opacity: isDrop ? 0.55 : 1,
                cursor: onOpenProject ? 'pointer' : 'default' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='#CCCCD8'}
              onMouseLeave={e => e.currentTarget.style.borderColor='#EEEEF1'}>
              <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:2 }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background: it.project_color || ACCENT, flexShrink:0 }}/>
                <span style={{ fontSize:9.5, color:'#8A8A94',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                  {it.project_title}
                </span>
                {it.due_date && <DuePill iso={it.due_date}/>}
              </div>
              <div style={{ fontSize:11.5, fontWeight:600, color:'#19191F', lineHeight:1.25,
                overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box',
                WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{it.title}</div>
              {it.assignee_name && (
                <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:2 }}>
                  <Avatar name={it.assignee_name} color={it.assignee_color} size={12}/>
                  <span style={{ fontSize:9, color:'#9A9AA4', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.assignee_name}</span>
                </div>
              )}
            </div>
          ))}
          {cellItems.length === 0 && (
            <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11.5, color:'#C4C4CC', fontStyle:'italic', minHeight:36 }}>Empty</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:22, flexWrap:'wrap' }}>
        <div style={{ fontSize:17, fontWeight:800, color:'#19191F', flex:1 }}>All Projects · Quadrant</div>
        <button onClick={() => setMyOnly(m => !m)}
          style={{ display:'flex', alignItems:'center', gap:5, height:34, padding:'0 12px', borderRadius:8,
            border: myOnly ? 'none' : '1.5px solid #E5E5EA',
            background: myOnly ? `${ACCENT}18` : '#FAFAFB',
            color: myOnly ? ACCENT : '#6B6B76', fontSize:12.5, fontWeight:600, cursor:'pointer' }}>
          <Icon name="users" size={13}/>
          {myOnly ? 'My tasks only' : 'All tasks'}
        </button>
        <button onClick={load} title="Refresh"
          style={{ width:34, height:34, borderRadius:8, border:'1.5px solid #E5E5EA', background:'#FAFAFB',
            color:'#6B6B76', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <Icon name="rotate" size={14}/>
        </button>
        <div style={{ display:'flex', gap:4 }}>
          {viewBtns.map(({ m, icon, title }) => (
            <button key={m} onClick={() => onViewModeChange(m)} title={title}
              style={{ width:34, height:34, borderRadius:8,
                border:`1.5px solid ${m === 'quadrant' ? ACCENT : '#E5E5EA'}`,
                background: m === 'quadrant' ? `${ACCENT}18` : '#FAFAFB',
                color: m === 'quadrant' ? ACCENT : '#6B6B76',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <Icon name={icon} size={15}/>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#9A9AA4', fontSize:13 }}>Loading…</div>
      ) : displayed.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:'60px 20px', textAlign:'center' }}>
          <Icon name="target" size={40} color="#D1D1D8"/>
          <div style={{ fontSize:15, fontWeight:600, color:'#5A5A66', marginTop:16, marginBottom:6 }}>
            {myOnly && items.length > 0 ? 'No tasks assigned to you' : 'No open items across active projects'}
          </div>
          {myOnly && items.length > 0 && (
            <button onClick={() => setMyOnly(false)}
              style={{ marginTop:12, height:34, padding:'0 16px', borderRadius:8, background:ACCENT, color:'#fff',
                fontSize:13, fontWeight:600, border:'none', cursor:'pointer' }}>
              Show all tasks
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:10 }}>
            <QCell imp={1} urg={0} meta={QUADRANT_META[1]}/>
            <QCell imp={1} urg={1} meta={QUADRANT_META[0]}/>
            <QCell imp={0} urg={0} meta={QUADRANT_META[3]}/>
            <QCell imp={0} urg={1} meta={QUADRANT_META[2]}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:-4, marginBottom:22 }}>
            <div style={{ textAlign:'center', fontSize:10.5, fontWeight:700, color:'#9A9AA4', letterSpacing:'0.04em', textTransform:'uppercase' }}>Low Urgency</div>
            <div style={{ textAlign:'center', fontSize:10.5, fontWeight:700, color:'#9A9AA4', letterSpacing:'0.04em', textTransform:'uppercase' }}>High Urgency</div>
          </div>

          {triage.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#9A9AA4', marginBottom:8 }}>
                Triage · {triage.length} unclassified — set importance and urgency to place in a quadrant
              </div>
              <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8 }}>
                {triage.map(it => (
                  <div key={it.id} onClick={() => onOpenProject?.(it.project_id)}
                    title={`Open ${it.project_title}`}
                    style={{ minWidth:220, background:'#fff', borderRadius:10,
                      padding:'10px 12px', border:'1px solid #EEEEF1', flexShrink:0,
                      cursor: onOpenProject ? 'pointer' : 'default' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='#CCCCD8'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='#EEEEF1'}>
                    <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background: it.project_color || ACCENT, flexShrink:0 }}/>
                      <span style={{ fontSize:10.5, fontWeight:600, color:'#6B6B76',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{it.project_title}</span>
                    </div>
                    <SectionTypeBadge type={it.section_type}/>
                    <div style={{ fontSize:12.5, fontWeight:600, marginTop:5, marginBottom:8,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.title}</div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }} onClick={e => e.stopPropagation()}>
                      <IUBadge
                        importance={it.importance} urgency={it.urgency}
                        onChangeI={v => updateItem(it.project_id, it.id, { importance: v })}
                        onChangeU={v => updateItem(it.project_id, it.id, { urgency: v })}
                      />
                      {it.due_date && <DuePill iso={it.due_date}/>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showDropConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:70, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div onClick={() => setShowDropConfirm(false)} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.34)' }}/>
          <div style={{ position:'relative', width:360, background:'#fff', borderRadius:16, padding:'24px',
            boxShadow:'0 16px 48px rgba(20,20,30,0.22)', textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:10 }}>Clear dropped items?</div>
            <div style={{ fontSize:13.5, color:'#7E7E88', marginBottom:20 }}>
              This will permanently delete all {dropItems.length} item{dropItems.length !== 1 ? 's' : ''} in the Drop quadrant.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => setShowDropConfirm(false)}
                style={{ height:38, padding:'0 18px', borderRadius:9, background:'#F2F2F5', color:'#5A5A66', fontSize:14, fontWeight:600, border:'none', cursor:'pointer' }}>Cancel</button>
              <button onClick={bulkDropDelete}
                style={{ height:38, padding:'0 18px', borderRadius:9, background:'#DC2626', color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer' }}>Delete all</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ProjectsView ──────────────────────────────────────────────────────────────
function ProjectsView({ projects, onSelect, onProjectsChange, currentUserId, isAdmin, contacts, deals, users,
  viewMode = 'grid', onViewModeChange, selectedProjectId, onCollapseList }) {
  const [showNew,        setShowNew]        = useState(false);
  const [showReview,     setShowReview]     = useState(false);
  const [showAddTask,    setShowAddTask]    = useState(false);
  const [filterStatus,   setFilterStatus]   = useState('active');
  const [todayItems,     setTodayItems]     = useState([]);
  const [todayLoaded, setTodayLoaded] = useState(false);
  const STATUS_ORDER = { active: 0, completed: 1, archived: 2 };
  const filtered = projects
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .sort((a, b) => {
      const sd = (STATUS_ORDER[a.status] ?? 1) - (STATUS_ORDER[b.status] ?? 1);
      if (sd !== 0) return sd;
      const od = Number(b.overdue_count) - Number(a.overdue_count);
      if (od !== 0) return od;
      const id = Number(b.item_count) - Number(a.item_count);
      if (id !== 0) return id;
      if (a.earliest_due_date && b.earliest_due_date)
        return new Date(a.earliest_due_date) - new Date(b.earliest_due_date);
      if (a.earliest_due_date) return -1;
      if (b.earliest_due_date) return 1;
      return a.title.localeCompare(b.title);
    });

  // Load today's focus queue on mount — one call for overdue/today items across projects
  useEffect(() => {
    api.get('/projects/focus').then(r => {
      setTodayItems((r.data.items || []).filter(it => it.due_bucket !== 'week'));
    }).finally(() => setTodayLoaded(true));
  }, [projects]);

  const STATUS_META = {
    active:    { label:'Active',    color:'#16A34A', bg:'#ECFDF3' },
    completed: { label:'Completed', color:'#2563EB', bg:'#EFF4FF' },
    archived:  { label:'Archived',  color:'#64748B', bg:'#F1F5F9' },
  };

  // ── Split (sidebar) mode ───────────────────────────────────────────────────
  if (viewMode === 'split') {
    const smBtn = (onClick, icon, title, accent) => (
      <button onClick={onClick} title={title}
        style={{ width:28, height:28, borderRadius:7, flexShrink:0, cursor:'pointer',
          border:`1.5px solid ${accent ? ACCENT : '#E5E5EA'}`,
          background: accent ? `${ACCENT}18` : '#fff',
          color: accent ? ACCENT : '#6B6B76',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon name={icon} size={14}/>
      </button>
    );
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
        {/* Header */}
        <div style={{ padding:'14px 12px 10px', borderBottom:'1px solid #EEEEF1', background:'#fff', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
            <div style={{ fontSize:13.5, fontWeight:700, color:'#19191F', flex:1 }}>Projects</div>
            {smBtn(() => onViewModeChange('grid'),     'grid',    'Grid view',     false)}
            {smBtn(() => onViewModeChange('split'),    'sidebar', 'Split view',    true)}
            {smBtn(() => onViewModeChange('quadrant'), 'target',  'Quadrant view', false)}
            {smBtn(() => setShowNew(true),          'plus',    'New project', false)}
            {onCollapseList && (
              <button onClick={onCollapseList} title="Collapse list"
                style={{ width:28, height:28, borderRadius:7, border:'1.5px solid #E5E5EA', background:'#fff',
                  color:'#6B6B76', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                <span style={{ transform:'rotate(90deg)', display:'flex' }}><Icon name="chevron" size={14}/></span>
              </button>
            )}
          </div>
          {/* Status filter pills */}
          <div style={{ display:'flex', gap:4, overflowX:'auto' }}>
            {['active','completed','archived','all'].map(f => {
              const count = f === 'all' ? projects.length : projects.filter(p => p.status === f).length;
              const isActive = filterStatus === f;
              return (
                <button key={f} onClick={() => setFilterStatus(f)}
                  style={{ padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:600, flexShrink:0, whiteSpace:'nowrap',
                    border: isActive ? 'none' : '1.5px solid #E5E5EA',
                    background: isActive ? ACCENT : '#F6F6F9', color: isActive ? '#fff' : '#5A5A66' }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}{' '}
                  <span style={{ opacity:0.55 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Project cards list */}
        <div style={{ flex:1, overflowY:'auto', padding:'10px 10px 16px' }}>
          {filtered.length === 0 && (
            <div style={{ padding:'32px 0', textAlign:'center', fontSize:12.5, color:'#9A9AA4' }}>No projects</div>
          )}
          {filtered.map(p => {
            const isSelected = selectedProjectId === p.id;
            const sm = STATUS_META[p.status] || STATUS_META.active;
            return (
              <div key={p.id} onClick={() => onSelect(p.id)}
                style={{ marginBottom:8, borderRadius:11, border: isSelected ? `1.5px solid ${ACCENT}` : '1.5px solid #E8E8EF',
                  background: isSelected ? `${ACCENT}08` : '#fff', cursor:'pointer', overflow:'hidden',
                  boxShadow: isSelected ? `0 0 0 3px ${ACCENT}22` : '0 1px 3px rgba(16,16,30,0.05)',
                  transition:'box-shadow .15s, border-color .15s' }}
                onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 3px 10px rgba(16,16,30,0.10)'; e.currentTarget.style.borderColor = '#CCCCD8'; } }}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 1px 3px rgba(16,16,30,0.05)'; e.currentTarget.style.borderColor = '#E8E8EF'; } }}>
                {/* Color bar */}
                <div style={{ height:3, background:p.color }}/>
                <div style={{ padding:'10px 13px 12px' }}>
                  <div style={{ fontSize:13, fontWeight: isSelected ? 700 : 600,
                    color: isSelected ? ACCENT : '#19191F',
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:6 }}>{p.title}</div>
                  {p.description && (
                    <div style={{ fontSize:11.5, color:'#8A8A94', marginBottom:7, lineHeight:1.4,
                      display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {p.description}
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                    <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 6px', borderRadius:5,
                      color:sm.color, background:sm.bg }}>{sm.label}</span>
                    <HealthBadge project={p}/>
                    <span style={{ fontSize:10.5, color:'#9A9AA4' }}>{p.item_count} open</span>
                    {p.overdue_count > 0 && (
                      <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 6px', borderRadius:5,
                        color:'#DC2626', background:'#FEF2F2' }}>{p.overdue_count} overdue</span>
                    )}
                    {p.owner_name && <Avatar name={p.owner_name} color={p.owner_color} size={18} style={{ marginLeft:'auto' }}/>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add task shortcut */}
        <div style={{ padding:'8px 10px', borderTop:'1px solid #EEEEF1', background:'#fff', flexShrink:0 }}>
          <button onClick={() => setShowAddTask(true)}
            style={{ width:'100%', height:34, borderRadius:8, border:'1.5px solid #BFDBFE', background:'#EFF4FF',
              color:'#2563EB', fontSize:12.5, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <Icon name="plus" size={13}/>Add task
          </button>
        </div>

        {showAddTask && (
          <QuickAddTaskModal projects={projects} users={users}
            onClose={() => setShowAddTask(false)} onSaved={onProjectsChange}/>
        )}
        {showNew && (
          <NewProjectModal contacts={contacts} deals={deals}
            onClose={() => setShowNew(false)} onSaved={onProjectsChange}/>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Today strip */}
      {todayLoaded && todayItems.length > 0 && (
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:'#DC2626', marginBottom:9, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#DC2626', display:'inline-block' }}/>
            Due today or overdue · {todayItems.length}
          </div>
          <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:6 }}>
            {todayItems.map(it => (
              <div key={it.id} onClick={() => onSelect(it.project_id)}
                style={{ minWidth:220, background:'#fff', borderRadius:10, padding:'10px 12px',
                  border:'1px solid #FECACA', flexShrink:0, cursor:'pointer',
                  borderLeft:`4px solid ${it.project_color}` }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 3px 12px rgba(16,16,30,0.10)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#9A9AA4', marginBottom:4 }}>{it.project_title}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
                  <SectionTypeBadge type={it.section_type}/>
                </div>
                <div style={{ fontSize:12.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.title}</div>
                <div style={{ marginTop:5, display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                  <DuePill iso={it.due_date}/>
                  <EffortBadge size={it.effort_size} hours={it.effort_hours}/>
                  <WaitingPill waitingOn={it.waiting_on} contactName={it.waiting_contact_name} since={it.waiting_since}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter / view toggle + action buttons */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { key:'active',    label:'Active'    },
          { key:'completed', label:'Completed' },
          { key:'archived',  label:'Archived'  },
          { key:'all',       label:'All'       },
        ].map(f => {
          const count = f.key === 'all' ? projects.length : projects.filter(p => p.status === f.key).length;
          const active = filterStatus === f.key;
          return (
            <button key={f.key} onClick={() => setFilterStatus(f.key)}
              style={{ padding:'5px 13px', borderRadius:20, fontSize:13, fontWeight:600,
                border: active ? 'none' : '1.5px solid #E5E5EA',
                background: active ? ACCENT : '#fff', color: active ? '#fff' : '#5A5A66' }}>
              {f.label} <span style={{ opacity:0.55 }}>{count}</span>
            </button>
          );
        })}
        <div style={{ flex:1 }}/>
        {/* View mode toggles */}
        <div style={{ display:'flex', gap:4 }}>
          {[{ m:'grid', icon:'grid', title:'Grid view' }, { m:'split', icon:'sidebar', title:'Split view' }, { m:'quadrant', icon:'target', title:'Quadrant view' }].map(({ m, icon, title }) => (
            <button key={m} onClick={() => onViewModeChange(m)} title={title}
              style={{ width:34, height:34, borderRadius:8, border:`1.5px solid ${viewMode === m ? ACCENT : '#E5E5EA'}`,
                background: viewMode === m ? `${ACCENT}18` : '#FAFAFB', color: viewMode === m ? ACCENT : '#6B6B76',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <Icon name={icon} size={15}/>
            </button>
          ))}
        </div>
        <button onClick={() => setShowReview(true)}
          style={{ display:'flex', alignItems:'center', gap:6, height:38, padding:'0 14px', borderRadius:9,
            background:'#FFF1E9', color:'#EA580C', fontSize:13, fontWeight:700, border:'1px solid #FDDCB8', cursor:'pointer' }}>
          <Icon name="rotate" size={14}/>Weekly Review
        </button>
        <button onClick={() => setShowAddTask(true)}
          style={{ display:'flex', alignItems:'center', gap:6, height:38, padding:'0 14px', borderRadius:9,
            background:'#EFF4FF', color:'#2563EB', fontSize:13, fontWeight:700, border:'1px solid #BFDBFE', cursor:'pointer' }}>
          <Icon name="plus" size={14}/>Add task
        </button>
        <button onClick={() => setShowNew(true)}
          style={{ display:'flex', alignItems:'center', gap:7, height:38, padding:'0 16px', borderRadius:9,
            background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:700, border:'none', cursor:'pointer' }}>
          <Icon name="plus" size={16}/>New project
        </button>
      </div>

      {/* Project grid */}
      {filtered.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:'48px 24px', textAlign:'center', color:'#9A9AA4' }}>
          <Icon name="layers" size={36} color="#D1D1D8"/>
          <div style={{ marginTop:14, fontSize:15, fontWeight:600, color:'#5A5A66' }}>No projects yet</div>
          <div style={{ fontSize:13, marginTop:6, marginBottom:16 }}>Create your first project to get started.</div>
          <button onClick={() => setShowNew(true)}
            style={{ height:38, padding:'0 18px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:700, border:'none', cursor:'pointer' }}>
            + New project
          </button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:16 }}>
          {filtered.map(p => {
            const sm = STATUS_META[p.status] || STATUS_META.active;
            return (
              <div key={p.id} onClick={() => onSelect(p.id)}
                style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, overflow:'hidden',
                  boxShadow:'0 1px 3px rgba(16,16,30,0.05)', cursor:'pointer',
                  borderLeft:`4px solid ${p.color}`, transition:'box-shadow .15s' }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(16,16,30,0.10)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 3px rgba(16,16,30,0.05)'}>
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div style={{ fontSize:15, fontWeight:700, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:6, color:sm.color, background:sm.bg, whiteSpace:'nowrap' }}>{sm.label}</span>
                    <HealthBadge project={p}/>
                    {p.overdue_count > 0 && (
                      <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 7px', borderRadius:6, color:'#DC2626', background:'#FEF2F2', whiteSpace:'nowrap' }}>
                        {p.overdue_count} overdue
                      </span>
                    )}
                  </div>
                  {p.description ? (
                    <div style={{ fontSize:12.5, color:'#6B6B76', lineHeight:1.5, display:'-webkit-box',
                      WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', marginBottom:10 }}>
                      {p.description}
                    </div>
                  ) : (
                    <div style={{ fontSize:12.5, color:'#C4C4CC', fontStyle:'italic', marginBottom:10 }}>No description</div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    {p.contact_name && (
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11.5, fontWeight:600, padding:'3px 8px', borderRadius:6, background:'#F2F2F5', color:'#5A5A66' }}>
                        <Icon name="users" size={11}/>{p.contact_name}
                      </span>
                    )}
                    {p.deal_title && (
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11.5, fontWeight:600, padding:'3px 8px', borderRadius:6, background:'#EFF4FF', color:'#2563EB' }}>
                        <Icon name="briefcase" size={11}/>{p.deal_title}
                      </span>
                    )}
                    <div style={{ flex:1 }}/>
                    <span style={{ fontSize:11.5, color:'#9A9AA4' }}>{p.item_count} open item{p.item_count!==1?'s':''}</span>
                    {p.owner_name && <Avatar name={p.owner_name} color={p.owner_color} size={22}/>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddTask && (
        <QuickAddTaskModal projects={projects} users={users}
          onClose={() => setShowAddTask(false)} onSaved={onProjectsChange}/>
      )}
      {showNew && (
        <NewProjectModal contacts={contacts} deals={deals}
          onClose={() => setShowNew(false)} onSaved={onProjectsChange}/>
      )}
      {showReview && (
        <WeeklyReviewModal
          onClose={() => setShowReview(false)}
          onOpenProject={(id) => { setShowReview(false); onSelect(id); }}/>
      )}
    </div>
  );
}

// ── User Modal (admin) ───────────────────────────────────────────────────────
const USER_COLORS = ['#5B5BD6','#2563EB','#16A34A','#D97706','#DC2626','#7C3AED','#0891B2','#DB2777','#65A30D','#EA580C'];

const DEFAULT_MODULE_ACCESS = { crm: true, projects: true, hr: true };
const MODULE_LABELS = { crm: 'CRM', projects: 'Projects', hr: 'HR' };

function UserModal({ editUser, onClose, onSaved }) {
  const isEdit = !!editUser;
  const [form, setForm] = useState({
    name:    editUser?.name    || '',
    email:   editUser?.email   || '',
    password: '',
    role:    editUser?.role    || 'rep',
    hr_role: editUser ? (editUser.hr_role || '') : 'employee',
    color:   editUser?.color   || '#5B5BD6',
  });
  const [moduleAccess, setModuleAccess] = useState(
    editUser?.module_access ?? { crm: false, projects: false, hr: true }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleModule = m => setModuleAccess(prev => ({ ...prev, [m]: !prev[m] }));

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required'); return; }
    if (!isEdit && !form.password) { setError('Password is required for new users'); return; }
    setSaving(true); setError('');
    try {
      const body = {
        name: form.name.trim(), email: form.email.trim(),
        role: form.role, color: form.color,
        hr_role: form.role === 'admin' ? null : (form.hr_role || null),
        module_access: moduleAccess,
      };
      if (form.password) body.password = form.password;
      if (isEdit) await api.put(`/users/${editUser.id}`, body);
      else        await api.post('/users', body);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const isAdminRole = form.role === 'admin';

  const labelStyle = { display:'block', fontSize:12, fontWeight:600, color:'#6B6B76', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 };
  const inpStyle   = { width:'100%', height:40, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13.5, background:'#FAFAFB', outline:'none' };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,0.34)', animation:'fadeIn .15s' }} />
      <div style={{ position:'relative', width:480, background:'#fff', borderRadius:18, boxShadow:'0 24px 60px rgba(20,20,30,0.24)', animation:'popIn .2s cubic-bezier(.2,.8,.2,1)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ fontSize:17, fontWeight:700 }}>{isEdit ? 'Edit user' : 'Add team member'}</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#8A8A94' }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ padding:'22px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={labelStyle}>Full name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Cooper" style={inpStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@company.com" style={inpStyle} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={labelStyle}>{isEdit ? 'New password' : 'Password *'}</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Min 8 characters'}
                style={inpStyle} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                style={{ ...inpStyle, cursor:'pointer', appearance:'none', WebkitAppearance:'none' }}>
                <option value="rep">Rep</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {!isAdminRole && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={labelStyle}>HR Role</label>
                <select value={form.hr_role} onChange={e => set('hr_role', e.target.value)}
                  style={{ ...inpStyle, cursor:'pointer', appearance:'none', WebkitAppearance:'none' }}>
                  <option value="">None</option>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr_admin">HR Admin</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Avatar colour</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
              {USER_COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)}
                  style={{ width:30, height:30, borderRadius:'50%', background:c, border: form.color === c ? '3px solid #19191F' : '3px solid transparent', cursor:'pointer', transition:'border .1s' }} />
              ))}
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:form.color, border:'2px solid #E5E5EA', overflow:'hidden', position:'relative' }}>
                  <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                    style={{ position:'absolute', inset:-4, width:'calc(100% + 8px)', height:'calc(100% + 8px)', cursor:'pointer', border:'none', padding:0, opacity:0 }} />
                </div>
                <span style={{ fontSize:12, color:'#8A8A94' }}>Custom</span>
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Module Access</label>
            {isAdminRole ? (
              <div style={{ fontSize:12, color:'#8A8A94', marginTop:4, padding:'10px 12px', background:'#F6F6F9', borderRadius:8 }}>
                Admin users have access to all modules regardless of this setting.
              </div>
            ) : (
              <div style={{ display:'flex', gap:10, marginTop:6 }}>
                {Object.keys(DEFAULT_MODULE_ACCESS).map(m => (
                  <button key={m} onClick={() => toggleModule(m)}
                    style={{
                      display:'flex', alignItems:'center', gap:7, height:36, padding:'0 14px',
                      borderRadius:9, border:'1.5px solid',
                      borderColor: moduleAccess[m] ? ACCENT : '#D1D1D8',
                      background: moduleAccess[m] ? `${ACCENT}12` : '#F6F6F9',
                      color: moduleAccess[m] ? ACCENT : '#8A8A94',
                      fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s',
                    }}>
                    <span style={{
                      width:16, height:16, borderRadius:4, border:'1.5px solid',
                      borderColor: moduleAccess[m] ? ACCENT : '#C0C0CC',
                      background: moduleAccess[m] ? ACCENT : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    }}>
                      {moduleAccess[m] && <Icon name="check" size={10} color="#fff" />}
                    </span>
                    {MODULE_LABELS[m]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', color:'#DC2626', fontSize:13 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'16px 24px', borderTop:'1px solid #EEEEF1' }}>
          <button onClick={onClose} style={{ height:40, padding:'0 18px', borderRadius:9, fontSize:13.5, fontWeight:600, color:'#5A5A66', background:'#F2F2F5' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ height:40, padding:'0 20px', borderRadius:9, fontSize:13.5, fontWeight:700, background:ACCENT, color:'#fff', opacity:saving?0.7:1 }}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add user'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main CRM ─────────────────────────────────────────────────────────────────
export default function CRM() {
  const { user, logout, isAdmin, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const VALID_VIEWS = ['dashboard','contacts','deals','reminders','tasks','projects','project-dashboard','team','users','settings',
    'hr-employees','hr-leaves','hr-attendance','hr-documents','hr-payroll'];
  const viewFromPath = () => {
    const p = location.pathname.replace('/', '') || 'dashboard';
    return VALID_VIEWS.includes(p) ? p : 'dashboard';
  };
  const [view, setView] = useState(viewFromPath);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [projects,        setProjects]        = useState([]);
  const [ppcData,           setPpcData]           = useState([]);
  const [projectFollowups,  setProjectFollowups]  = useState([]);
  const [focusData,         setFocusData]         = useState(null);
  const [activeProjectId,    setActiveProjectId]    = useState(null);
  const [projectViewMode,    setProjectViewMode]    = useState(() => localStorage.getItem('crm_project_view') || 'grid');
  const setProjectView = (m) => { setProjectViewMode(m); localStorage.setItem('crm_project_view', m); };
  const [sidebarCollapsed,   setSidebarCollapsed]   = useState(() => localStorage.getItem('crm_sidebar') === '1');
  const toggleSidebar = () => setSidebarCollapsed(c => { const n = !c; localStorage.setItem('crm_sidebar', n ? '1' : '0'); return n; });
  const [projListCollapsed,  setProjListCollapsed]  = useState(false);
  const [showSplitAddTask,   setShowSplitAddTask]   = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [repFilter, setRepFilter] = useState('all');
  const [dealDragId, setDealDragId] = useState(null);
  const [detailContact, setDetailContact] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  const loadContacts = useCallback(async () => {
    const r = await api.get('/contacts');
    setContacts(r.data);
  }, []);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    const r = await api.get('/users');
    setUsers(r.data);
  }, [isAdmin]);

  const loadDeals = useCallback(async () => {
    const r = await api.get('/deals');
    setDeals(r.data);
  }, []);

  const loadTasks = useCallback(async () => {
    const r = await api.get('/tasks');
    setTasks(r.data);
  }, []);

  const loadCustomFieldDefs = useCallback(async () => {
    const r = await api.get('/custom-fields');
    setCustomFieldDefs(r.data);
  }, []);

  const loadProjects = useCallback(async () => {
    const r = await api.get('/projects');
    setProjects(r.data);
  }, []);

  const loadPpc = useCallback(async () => {
    api.get('/projects/ppc').then(r => setPpcData(r.data)).catch(() => {});
  }, []);

  const loadProjectFollowups = useCallback(async () => {
    api.get('/projects/followups-due').then(r => setProjectFollowups(r.data)).catch(() => {});
  }, []);

  const loadFocus = useCallback(async () => {
    api.get('/projects/focus').then(r => setFocusData(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadContacts();
    loadDeals();
    loadTasks();
    loadCustomFieldDefs();
    loadProjects();
    loadPpc();
    loadProjectFollowups();
    loadFocus();
    if (isAdmin) loadUsers();
    else setUsers([{ id: user.id, name: user.name, color: user.color }]);
  }, [isAdmin, user.id, loadContacts, loadUsers]);

  useEffect(() => {
    if (view !== 'projects') setActiveProjectId(null);
    if (view === 'reminders') loadProjectFollowups();
  }, [view, loadProjectFollowups]);

  useEffect(() => {
    const path = view === 'dashboard' ? '/' : `/${view}`;
    navigate(path, { replace: true });
  }, [view, navigate]);

  // Redirect to first accessible view if the current view is in a disabled module
  useEffect(() => {
    if (isAdmin) return;
    const userMA = user.module_access || DEFAULT_MODULE_ACCESS;
    const crmViews = ['dashboard','contacts','deals','reminders','tasks'];
    const projectViews = ['projects','project-dashboard'];
    const hrViews = ['hr-employees','hr-leaves','hr-attendance','hr-documents','hr-payroll'];
    const inCRM = crmViews.includes(view);
    const inProjects = projectViews.includes(view);
    const inHR = hrViews.includes(view);
    const blocked =
      (inCRM && userMA.crm === false) ||
      (inProjects && userMA.projects === false) ||
      (inHR && userMA.hr === false);
    if (blocked) {
      if (userMA.crm !== false) setView('dashboard');
      else if (userMA.projects !== false) setView('project-dashboard');
      else if (userMA.hr !== false) setView('hr-leaves');
      else setView('settings');
    }
  }, [view, isAdmin, user.module_access]);

  const overdueCount = contacts.filter(c => c.owner_id === user.id && c.next_followup && diffDays(c.next_followup) <= 0).length
    + projectFollowups.filter(pf => pf.due_date && diffDays(pf.due_date) <= 0).length;
  const openTaskCount = tasks.filter(t => !t.completed && (t.assigned_to === user.id || t.created_by === user.id)).length;
  const focusDueCount = (focusData?.counts?.overdue || 0) + (focusData?.counts?.today || 0);
  const focusDueItems = (focusData?.items || []).filter(it => it.due_bucket !== 'week');

  const isHRAdminUser   = user.role === 'admin' || user.hr_role === 'hr_admin';
  const isHRManagerUser = isHRAdminUser || user.hr_role === 'manager';

  // Admins always have full access; for others respect module_access (default all true if unset)
  const ma = user.module_access || DEFAULT_MODULE_ACCESS;
  const hasModule = m => isAdmin || (ma[m] !== false);

  const navGroups = [
    ...(hasModule('crm') ? [{
      group: 'CRM',
      items: [
        { key:'dashboard', label:'Dashboard', icon:'grid' },
        { key:'contacts',  label:'Contacts',  icon:'users' },
        { key:'deals',     label:'Pipeline',  icon:'kanban' },
        { key:'reminders', label:'Reminders', icon:'bell', badge: overdueCount || null },
        { key:'tasks',     label:'Tasks',     icon:'task', badge: openTaskCount || null },
      ],
    }] : []),
    ...(hasModule('projects') ? [{
      group: 'Projects',
      items: [
        { key:'project-dashboard', label:'Overview', icon:'grid' },
        { key:'projects',          label:'All Projects', icon:'layers' },
      ],
    }] : []),
    ...(isAdmin ? [{
      group: 'Admin',
      items: [
        { key:'team',  label:'Team',  icon:'award' },
        { key:'users', label:'Users', icon:'userplus' },
      ],
    }] : []),
    ...(hasModule('hr') ? [{
      group: 'HR',
      items: [
        ...(isHRManagerUser ? [{ key:'hr-employees', label:'Employees', icon:'users' }] : []),
        { key:'hr-leaves',     label:'Leaves',     icon:'bell'     },
        { key:'hr-attendance', label:'Attendance',  icon:'check'    },
        { key:'hr-documents',  label:'Documents',   icon:'doc'      },
        { key:'hr-payroll',    label:'Payroll',     icon:'briefcase'},
      ],
    }] : []),
  ];

  const SOURCES = [...new Set(contacts.map(c => c.source).filter(Boolean))].sort();

  // Filtered contacts for contacts view
  const filtered = contacts.filter(c => {
    const matchSearch = !search || [c.name, c.company, c.email, c.phone].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStage = stageFilter === 'all' || c.stage === stageFilter;
    const matchSource = sourceFilter === 'all' || c.source === sourceFilter;
    const matchRep = repFilter === 'all' || c.owner_id === repFilter;
    return matchSearch && matchStage && matchSource && matchRep;
  });

  // Pipeline contacts — own for reps, all for admin
  const pipelineContacts = contacts.filter(c => isAdmin || c.owner_id === user.id);

  // Reminder contacts
  const reminderContacts = contacts.filter(c => (isAdmin ? true : c.owner_id === user.id) && c.next_followup);

  // Merged list for Reminders view: CRM contacts + project follow-ups, normalized to _type + due_date
  const reminderItems = [
    ...reminderContacts.map(c => ({ ...c, _type: 'crm', due_date: c.next_followup })),
    ...projectFollowups.map(pf => ({ ...pf, _type: 'project' })),
  ].sort((a, b) => {
    const da = a.due_date || '', db = b.due_date || '';
    return da < db ? -1 : da > db ? 1 : 0;
  });

  // Dashboard KPIs scoped to own contacts for reps
  const ownContacts = contacts.filter(c => c.owner_id === user.id);
  const kpiScope = isAdmin ? contacts : ownContacts;
  const activeContacts = kpiScope.filter(c => !['won','lost'].includes(c.stage));
  const pipelineValue = activeContacts.reduce((a,c) => a + (c.effective_value ?? c.value ?? 0), 0);
  const wonContacts = kpiScope.filter(c => c.stage === 'won');
  const kpiOverdue = kpiScope.filter(c => c.next_followup && diffDays(c.next_followup) < 0).length;
  const todayCount = kpiScope.filter(c => c.next_followup && diffDays(c.next_followup) === 0).length;

  const openDetail = async (c) => {
    const full = await api.get(`/contacts`).then(r => r.data.find(x => x.id === c.id));
    setDetailContact(full || c);
  };

  const handleDrop = async (stage, e) => {
    e.preventDefault();
    if (!dragId) return;
    await api.put(`/contacts/${dragId}`, { stage });
    setDragId(null);
    await loadContacts();
  };

  const groupReminders = (list) => {
    const gd = (item) => item.due_date || item.next_followup;
    const overdue = list.filter(c => diffDays(gd(c)) < 0);
    const today   = list.filter(c => diffDays(gd(c)) === 0);
    const soon    = list.filter(c => { const n = diffDays(gd(c)); return n > 0 && n <= 7; });
    const later   = list.filter(c => diffDays(gd(c)) > 7);
    return [
      { label:'Overdue', color:'#DC2626', items:overdue },
      { label:'Today',   color:'#C2410C', items:today },
      { label:'This week',color:'#2563EB', items:soon },
      { label:'Later',   color:'#6B6B76', items:later },
    ].filter(g => g.items.length);
  };

  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: sidebarCollapsed ? 62 : 236, flexShrink:0, background:'#fff', borderRight:'1px solid #ECECEF',
        display:'flex', flexDirection:'column', padding: sidebarCollapsed ? '18px 10px' : '18px 14px',
        transition:'width 0.2s ease', overflow:'hidden' }}>

        {/* Logo + collapse toggle */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 4px 2px', minHeight:34 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, overflow:'hidden' }}>
            <div style={{ width:30, height:30, borderRadius:9, background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6L4 12l4 6"/>
                <path d="M16 6l4 6-4 6"/>
                <circle cx="12" cy="8" r="1.8" fill="#fff" stroke="none"/>
                <circle cx="12" cy="16" r="1.8" fill="#fff" stroke="none"/>
                <path d="M12 9.8v4.4" strokeWidth="1.6"/>
              </svg>
            </div>
            {!sidebarCollapsed && <div style={{ fontWeight:800, fontSize:16.5, letterSpacing:'-0.03em', whiteSpace:'nowrap' }}>Flux</div>}
          </div>
          <button onClick={toggleSidebar} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ color:'#C0C0CC', background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:6, flexShrink:0,
              transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>
            <Icon name="sidebar" size={15}/>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ display:'flex', flexDirection:'column', marginTop:22, gap: sidebarCollapsed ? 2 : 0 }}>
          {navGroups.map((group, gi) => {
            const grpCollapsed = collapsedGroups.has(group.group);
            const toggleCollapse = () => setCollapsedGroups(prev => {
              const next = new Set(prev);
              next.has(group.group) ? next.delete(group.group) : next.add(group.group);
              return next;
            });
            return (
              <div key={group.group} style={{ marginTop: sidebarCollapsed ? 0 : gi === 0 ? 0 : 18 }}>
                {!sidebarCollapsed && (
                  <button onClick={toggleCollapse}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'0 11px 6px', background:'none', border:'none', cursor:'pointer' }}>
                    <span style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'#B0B0BC' }}>{group.group}</span>
                    <span style={{ color:'#C8C8D4', transition:'transform .2s', display:'flex', transform: grpCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                      <Icon name="chevron" size={13} color="#C8C8D4" />
                    </span>
                  </button>
                )}
                {(sidebarCollapsed || !grpCollapsed) && (
                  <div style={{ display:'flex', flexDirection:'column', gap:2, alignItems: sidebarCollapsed ? 'center' : 'stretch' }}>
                    {group.items.map(item => {
                      const active = view === item.key;
                      return (
                        <button key={item.key} data-navitem="true"
                          onClick={() => { setView(item.key); if (item.key === 'projects') setActiveProjectId(null); }}
                          title={sidebarCollapsed ? item.label : undefined}
                          style={{ display:'flex', alignItems:'center',
                            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                            width: sidebarCollapsed ? 40 : '100%',
                            height: sidebarCollapsed ? 40 : 'auto',
                            padding: sidebarCollapsed ? 0 : '9px 11px',
                            borderRadius:9, fontSize:13.5, fontWeight: active?700:500,
                            color: active?ACCENT:'#5A5A66', background: active?`${ACCENT}14`:'transparent',
                            border:'none', cursor:'pointer', position:'relative', flexShrink:0 }}>
                          <span style={{ display:'flex', alignItems:'center', gap: sidebarCollapsed ? 0 : 11 }}>
                            <Icon name={item.icon} size={18}/>
                            {!sidebarCollapsed && item.label}
                          </span>
                          {!sidebarCollapsed && item.badge ? (
                            <span style={{ fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:20, background: active?ACCENT:'#E9E9EE', color: active?'#fff':'#7A7A85' }}>{item.badge}</span>
                          ) : null}
                          {sidebarCollapsed && item.badge ? (
                            <span style={{ position:'absolute', top:6, right:6, width:7, height:7, borderRadius:'50%', background:'#DC2626' }}/>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ flex:1 }}/>

        {/* User area */}
        {sidebarCollapsed ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, paddingBottom:4 }}>
            <Avatar name={user.name} color={user.color} size={32}/>
            <button onClick={logout} title="Sign out" style={{ color:'#B8B8C0', background:'none', border:'none', cursor:'pointer', padding:4 }}>
              <Icon name="logout" size={15}/>
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px', borderRadius:11, background:'#F6F6F9' }}>
            <Avatar name={user.name} color={user.color} size={34}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize:11.5, color:'#8A8A94' }}>{user.role === 'admin' ? 'Admin' : 'Rep'}</div>
            </div>
            <button onClick={logout} title="Sign out" style={{ color:'#B8B8C0', background:'none', border:'none', cursor:'pointer' }}>
              <Icon name="logout" size={16}/>
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* Header */}
        <header style={{ height:62, flexShrink:0, borderBottom:'1px solid #ECECEF', background:'#fff', display:'flex', alignItems:'center', gap:14, padding:'0 24px' }}>
          <div style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em' }}>
            {{
              dashboard: 'Dashboard',
              contacts: 'Contacts',
              deals: 'Pipeline',
              reminders: 'Reminders',
              tasks: 'Tasks',
              projects: activeProjectId ? (projects.find(p => p.id === activeProjectId)?.title || 'Project') : 'All Projects',
              'project-dashboard': 'Project Dashboard',
              team: 'Team Performance',
              users: 'User Management',
              settings: 'Settings',
              'hr-employees':  'Employees',
              'hr-leaves':     'Leaves',
              'hr-attendance': 'Attendance',
              'hr-documents':  'Documents',
              'hr-payroll':    'Payroll',
            }[view] || ''}
          </div>
          <div style={{ flex:1 }} />

          {/* Bell notification button */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowNotifs(v => !v)}
              style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:9, background: showNotifs ? '#F0F0F7' : 'transparent', color:'#5A5A66' }}>
              <Icon name="bell" size={19} />
              {(overdueCount + openTaskCount + focusDueCount) > 0 && (
                <span style={{ position:'absolute', top:5, right:5, minWidth:16, height:16, borderRadius:8, background:'#DC2626', color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px', lineHeight:1 }}>
                  {overdueCount + openTaskCount + focusDueCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <>
                <div onClick={() => setShowNotifs(false)} style={{ position:'fixed', inset:0, zIndex:49 }} />
                <div style={{ position:'absolute', top:46, right:0, width:320, background:'#fff', borderRadius:14, boxShadow:'0 8px 32px rgba(16,16,30,0.14)', border:'1px solid #ECECEF', zIndex:50, overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px 11px', borderBottom:'1px solid #ECECEF' }}>
                    <div style={{ fontSize:13.5, fontWeight:700 }}>Notifications</div>
                    <button onClick={() => setShowNotifs(false)} style={{ color:'#B0B0BA' }}><Icon name="x" size={15} /></button>
                  </div>

                  <div style={{ maxHeight:340, overflowY:'auto' }}>
                    {overdueCount === 0 && openTaskCount === 0 && focusDueCount === 0 && (
                      <div style={{ padding:'28px 16px', textAlign:'center', color:'#9A9AA4', fontSize:13 }}>All caught up!</div>
                    )}

                    {overdueCount > 0 && (
                      <>
                        <div style={{ padding:'10px 16px 4px', fontSize:10.5, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', color:'#DC2626' }}>
                          Follow-ups due · {overdueCount}
                        </div>
                        {contacts
                          .filter(c => c.owner_id === user.id && c.next_followup && diffDays(c.next_followup) <= 0 && !['won','lost'].includes(c.stage))
                          .slice(0, 6)
                          .map(c => (
                            <div key={c.id}
                              onClick={() => { openDetail(c); setShowNotifs(false); }}
                              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', cursor:'pointer' }}
                              onMouseEnter={e => e.currentTarget.style.background='#F6F6F9'}
                              onMouseLeave={e => e.currentTarget.style.background='transparent'}
                            >
                              <Avatar name={c.name} color={c.owner_color} size={28} />
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                                <div style={{ fontSize:11.5, fontWeight:500, color: diffDays(c.next_followup) < 0 ? '#DC2626' : '#C2410C' }}>
                                  {diffDays(c.next_followup) < 0 ? `${Math.abs(diffDays(c.next_followup))}d overdue` : 'Due today'} · {c.company || '—'}
                                </div>
                              </div>
                            </div>
                          ))}
                      </>
                    )}

                    {openTaskCount > 0 && (
                      <>
                        <div style={{ padding:'10px 16px 4px', fontSize:10.5, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', color:ACCENT }}>
                          Open tasks · {openTaskCount}
                        </div>
                        {tasks
                          .filter(t => !t.completed && (t.assigned_to === user.id || t.created_by === user.id))
                          .slice(0, 4)
                          .map(t => (
                            <div key={t.id}
                              onClick={() => { setView('tasks'); setShowNotifs(false); }}
                              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', cursor:'pointer' }}
                              onMouseEnter={e => e.currentTarget.style.background='#F6F6F9'}
                              onMouseLeave={e => e.currentTarget.style.background='transparent'}
                            >
                              <div style={{ width:28, height:28, borderRadius:8, background:'#EEF0FF', display:'flex', alignItems:'center', justifyContent:'center', color:ACCENT, flexShrink:0 }}>
                                <Icon name="task" size={14} />
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.title}</div>
                                <div style={{ fontSize:11.5, color:'#9A9AA4' }}>
                                  {t.due_date
                                    ? new Date(t.due_date) < new Date()
                                      ? 'Overdue'
                                      : 'Due ' + new Date(t.due_date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })
                                    : 'No due date'}
                                </div>
                              </div>
                            </div>
                          ))}
                      </>
                    )}

                    {focusDueCount > 0 && (
                      <>
                        <div style={{ padding:'10px 16px 4px', fontSize:10.5, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', color:'#EA580C' }}>
                          Project items due · {focusDueCount}
                        </div>
                        {focusDueItems.slice(0, 5).map(it => (
                          <div key={it.id}
                            onClick={() => { setView('projects'); setActiveProjectId(it.project_id); setShowNotifs(false); }}
                            style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', cursor:'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background='#F6F6F9'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}
                          >
                            <div style={{ width:28, height:28, borderRadius:8, background:'#FFF1E9', display:'flex', alignItems:'center', justifyContent:'center', color:'#EA580C', flexShrink:0, borderLeft:`3px solid ${it.project_color || ACCENT}` }}>
                              <Icon name="layers" size={14} />
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.title}</div>
                              <div style={{ fontSize:11.5, color: it.due_bucket === 'overdue' ? '#DC2626' : '#C2410C', fontWeight:500 }}>
                                {it.due_bucket === 'overdue' ? `${Math.abs(diffDays(it.due_date))}d overdue` : 'Due today'} · {it.project_title}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <div style={{ padding:'10px 16px', borderTop:'1px solid #ECECEF', display:'flex', gap:8 }}>
                    <button onClick={() => { setView('reminders'); setShowNotifs(false); }}
                      style={{ flex:1, height:32, borderRadius:8, background:'#F0F0F7', color:ACCENT, fontSize:12.5, fontWeight:600 }}>
                      View reminders
                    </button>
                    <button onClick={() => { setView('tasks'); setShowNotifs(false); }}
                      style={{ flex:1, height:32, borderRadius:8, background:'#F0F0F7', color:ACCENT, fontSize:12.5, fontWeight:600 }}>
                      View tasks
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {['contacts','deals'].includes(view) && (
            <>
              <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                <span style={{ position:'absolute', left:11, color:'#A0A0AA' }}><Icon name="search" size={16} /></span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search contacts…"
                  style={{ width:220, height:36, padding:'0 12px 0 34px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13.5, background:'#FAFAFB', outline:'none' }} />
              </div>
              {SOURCES.length > 0 && (
                <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                  style={{ height:36, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13, background:'#FAFAFB', outline:'none', cursor:'pointer' }}>
                  <option value="all">All sources</option>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              )}
              {isAdmin && (
                <select value={repFilter} onChange={e => setRepFilter(e.target.value)}
                  style={{ height:36, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:9, fontSize:13, background:'#FAFAFB', outline:'none', cursor:'pointer' }}>
                  <option value="all">All reps</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              )}
            </>
          )}

          {/* Settings shortcut + user chip */}
          <button data-navitem="true" onClick={() => setView('settings')} title="Settings"
            style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:9,
              background: view === 'settings' ? `${ACCENT}14` : '#F6F6F9', color: view === 'settings' ? ACCENT : '#6B6B76', border:'none', cursor:'pointer', flexShrink:0 }}>
            <Icon name="settings" size={16} />
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 11px 4px 5px', borderRadius:9, background:'#F6F6F9', flexShrink:0 }}>
            <Avatar name={user.name} color={user.color} size={27} />
            <span style={{ fontSize:12.5, fontWeight:600, maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#3A3A44' }}>{user.name}</span>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1, overflow:'auto', padding:'24px 26px' }}>

          {/* Dashboard */}
          {view === 'dashboard' && (
            <div>
              <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.03em', marginBottom:4 }}>
                Good morning, {user.name.split(' ')[0]}
              </div>
              <div style={{ fontSize:13.5, color:'#7E7E88', marginBottom:24 }}>
                {isAdmin ? `Team pipeline: ${fmtMoneyK(pipelineValue)} open` : `Your pipeline: ${fmtMoneyK(pipelineValue)} open`}
              </div>
              {/* KPIs */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
                {[
                  { label: isAdmin?'Total contacts':'My contacts', value: kpiScope.length, delta: `${activeContacts.length} active` },
                  { label:'Open pipeline', value: fmtMoneyK(pipelineValue), delta: `${deals.filter(d=>!['won','lost'].includes(d.stage)).length} open deals` },
                  { label:'Won this month', value: wonContacts.length, delta: fmtMoneyK(wonContacts.reduce((a,c)=>a+(c.effective_value||c.value||0),0)) },
                  { label:'Due today', value: todayCount + kpiOverdue, delta: kpiOverdue > 0 ? `${kpiOverdue} overdue` : 'All on time', deltaColor: kpiOverdue > 0 ? '#DC2626' : '#16A34A' },
                ].map((kpi, i) => (
                  <div key={i} style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:'16px 17px', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
                    <div style={{ fontSize:12.5, color:'#7E7E88', fontWeight:500 }}>{kpi.label}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:26, fontWeight:600, marginTop:13, letterSpacing:'-0.02em' }}>{kpi.value}</div>
                    <div style={{ fontSize:11.5, color: kpi.deltaColor || '#16A34A', marginTop:6, fontWeight:600 }}>{kpi.delta}</div>
                  </div>
                ))}
              </div>
              {/* Follow-up inbox + Pipeline bars */}
              <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16 }}>
                <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:'6px 6px 10px', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 14px 9px' }}>
                    <div style={{ fontSize:14.5, fontWeight:700 }}>Follow-ups</div>
                    <button onClick={() => setView('reminders')} style={{ fontSize:12.5, color:ACCENT, fontWeight:600 }}>View all</button>
                  </div>
                  {groupReminders(reminderContacts).length === 0 ? (
                    <div style={{ padding:'30px 14px', textAlign:'center', color:'#9A9AA4', fontSize:13 }}>Inbox zero 🎉</div>
                  ) : groupReminders(reminderContacts).map(g => (
                    <div key={g.label}>
                      <div style={{ padding:'7px 14px 3px', fontSize:11, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', color:g.color }}>{g.label} · {g.items.length}</div>
                      {g.items.slice(0,4).map(c => (
                        <div key={c.id} onClick={() => openDetail(c)}
                          style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 12px', borderRadius:10, cursor:'pointer' }}>
                          <Avatar name={c.owner_name} color={c.owner_color} size={26} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                            <div style={{ fontSize:12, color:'#8A8A94' }}>{c.company} · <span style={{ color:stageByKey(c.stage).color, fontWeight:600 }}>{stageByKey(c.stage).label}</span></div>
                          </div>
                          <DuePill iso={c.next_followup} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:'16px 18px', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
                  <div style={{ fontSize:14.5, fontWeight:700, marginBottom:14 }}>Pipeline by stage</div>
                  {DEAL_STAGES.filter(s => !['won','lost'].includes(s.key)).map(s => {
                    const stageDeals = deals.filter(d => d.stage === s.key);
                    const cnt = stageDeals.length;
                    const val = stageDeals.reduce((a,d) => a+(d.value||0), 0);
                    const totalOpen = deals.filter(d => !['won','lost'].includes(d.stage)).length;
                    const pct = totalOpen ? Math.round(cnt / totalOpen * 100) : 0;
                    return (
                      <div key={s.key} style={{ display:'flex', alignItems:'center', gap:14, marginBottom:11 }}>
                        <div style={{ width:120, display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600 }}>
                          <span style={{ width:9, height:9, borderRadius:3, background:s.color }} />
                          {s.label}
                        </div>
                        <div style={{ flex:1, height:9, background:'#F0F0F3', borderRadius:5, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:s.color, borderRadius:5 }} />
                        </div>
                        <div style={{ width:72, textAlign:'right', fontFamily:"'IBM Plex Mono',monospace", fontSize:13 }}>{fmtMoneyK(val)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Reliability (due date = commitment) */}
              {ppcData.length > 0 && (() => {
                const lastFull = ppcData.find(w => !w.is_current);
                const ppcColor = (p) => p >= 70 ? '#16A34A' : p >= 40 ? '#D97706' : '#DC2626';
                return (
                  <div style={{ marginTop:16, background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:'16px 18px', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                      <Icon name="target" size={15} color={ACCENT}/>
                      <span style={{ fontSize:14.5, fontWeight:700 }}>Delivery Reliability</span>
                      {lastFull?.ppc != null && (
                        <span style={{ fontSize:22, fontWeight:800, fontFamily:"'IBM Plex Mono',monospace", color:ppcColor(lastFull.ppc), marginLeft:'auto' }}>
                          {lastFull.ppc}%
                        </span>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:50 }}>
                      {[...ppcData].reverse().map((w, i) => {
                        const h = w.ppc != null ? Math.max(4, Math.round(w.ppc * 50 / 100)) : 4;
                        const weekLabel = new Date(w.week_start).toLocaleDateString('en', { month:'short', day:'numeric' });
                        return (
                          <div key={w.week_start} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                            <div title={`${weekLabel}: ${w.ppc != null ? w.ppc+'%' : 'no data'} (${w.completed}/${w.total_committed})${w.is_current ? ' — in progress' : ''}`}
                              style={{ width:'100%', height:h, borderRadius:3, background: w.ppc != null ? ppcColor(w.ppc) : '#E5E5EA',
                                opacity: w.is_current ? 0.45 : 0.6 + (i / ppcData.length) * 0.4,
                                border: w.is_current ? '1px dashed #9A9AA4' : 'none', boxSizing:'border-box' }}/>
                            <div style={{ fontSize:9, color:'#9A9AA4', whiteSpace:'nowrap' }}>{weekLabel}{w.is_current ? '*' : ''}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize:11.5, color:'#9A9AA4', marginTop:8 }}>
                      % of items due each week completed on or before their due date. A due date is a commitment. * = week in progress.
                    </div>
                  </div>
                );
              })()}

              {/* Today's focus queue */}
              <FocusQueue onOpenProject={(id) => { setView('projects'); setActiveProjectId(id); }}/>

              {/* Projects at Risk + Active Projects strip */}
              {projects.filter(p => p.status === 'active').length > 0 && (() => {
                const activeProjs = projects.filter(p => p.status === 'active');
                const atRisk = activeProjs.filter(p => Number(p.overdue_count) > 0)
                  .sort((a,b) => Number(b.overdue_count) - Number(a.overdue_count));
                const healthy = activeProjs.filter(p => Number(p.overdue_count) === 0);
                return (
                  <div style={{ marginTop:16, background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:'16px 18px', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <div style={{ fontSize:14.5, fontWeight:700 }}>
                        Projects
                        {atRisk.length > 0 && (
                          <span style={{ marginLeft:8, fontSize:11.5, fontWeight:700, padding:'2px 8px', borderRadius:7, background:'#FEF2F2', color:'#DC2626' }}>
                            {atRisk.length} at risk
                          </span>
                        )}
                      </div>
                      <button onClick={() => setView('projects')} style={{ fontSize:12.5, color:ACCENT, fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>View all</button>
                    </div>
                    <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
                      {[...atRisk, ...healthy].slice(0, 8).map(p => (
                        <button key={p.id} onClick={() => { setView('projects'); setActiveProjectId(p.id); }}
                          style={{ flexShrink:0, width:200, background: Number(p.overdue_count) > 0 ? '#FFF5F5' : '#FAFAFB',
                            border: `1px solid ${Number(p.overdue_count) > 0 ? '#FECACA' : '#EEEEF1'}`,
                            borderLeft: `4px solid ${p.color || ACCENT}`, borderRadius:10, padding:'10px 12px',
                            textAlign:'left', cursor:'pointer' }}>
                          <div style={{ fontSize:13, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                          {p.contact_name && <div style={{ fontSize:11.5, color:'#8A8A94', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.contact_name}</div>}
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:7 }}>
                            {Number(p.overdue_count) > 0 ? (
                              <span style={{ fontSize:10.5, fontWeight:700, color:'#DC2626' }}>⚠ {p.overdue_count} overdue</span>
                            ) : Number(p.item_count) > 0 ? (
                              <span style={{ fontSize:10.5, color:'#6B6B76' }}>{p.item_count} open</span>
                            ) : (
                              <span style={{ fontSize:10.5, color:'#16A34A', fontWeight:600 }}>All clear</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Contacts */}
          {view === 'contacts' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                {[{ key:'all', label:'All' }, ...STAGES].map(s => {
                  const count = s.key === 'all' ? filtered.length : filtered.filter(c => c.stage === s.key).length;
                  const active = stageFilter === s.key;
                  return (
                    <button key={s.key} onClick={() => setStageFilter(s.key)}
                      style={{ padding:'5px 13px', borderRadius:20, fontSize:13, fontWeight:600, border: active ? 'none' : '1.5px solid #E5E5EA', background: active ? ACCENT : '#fff', color: active ? '#fff' : '#5A5A66' }}>
                      {s.label} <span style={{ opacity:0.55 }}>{count}</span>
                    </button>
                  );
                })}
                <div style={{ flex:1 }} />
                <div style={{ fontSize:13, color:'#8A8A94' }}>{filtered.length} contacts</div>
                <button onClick={() => setShowAdd(true)}
                  style={{ display:'flex', alignItems:'center', gap:6, height:36, padding:'0 16px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }}>
                  <Icon name="plus" size={15} />New contact
                </button>
              </div>
              <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1.2fr 160px 140px 110px 130px', gap:8, padding:'12px 18px', borderBottom:'1px solid #EEEEF1', fontSize:11, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', color:'#9A9AA4' }}>
                  <div>Name</div><div>Company</div><div>Owner</div><div>Stage</div><div style={{ textAlign:'right' }}>Value</div><div>Next follow-up</div>
                </div>
                {filtered.map(c => (
                  <div key={c.id} onClick={() => openDetail(c)}
                    style={{ display:'grid', gridTemplateColumns:'1.5fr 1.2fr 160px 140px 110px 130px', gap:8, padding:'13px 18px', borderBottom:'1px solid #F2F2F5', cursor:'pointer', alignItems:'center' }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize:11.5, color:'#9A9AA4', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.title}</div>
                    </div>
                    <div style={{ fontSize:13, color:'#4A4A54', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.company}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Avatar name={c.owner_name} color={c.owner_color} size={25} />
                      <span style={{ fontSize:12.5, color:'#4A4A54', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.owner_name?.split(' ')[0]}</span>
                    </div>
                    <div><StagePill stage={c.stage} /></div>
                    <div style={{ textAlign:'right', fontFamily:"'IBM Plex Mono',monospace", fontSize:13 }}>{fmtMoney(c.effective_value ?? c.value)}</div>
                    <div><DuePill iso={c.next_followup} /></div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding:'40px', textAlign:'center', color:'#9A9AA4', fontSize:14 }}>No contacts found.</div>
                )}
              </div>
            </div>
          )}

          {/* Pipeline (Deal kanban) */}
          {view === 'deals' && (
            <div>
              <div style={{ fontSize:13, color:'#7E7E88', marginBottom:14 }}>
                {deals.filter(d => !['won','lost'].includes(d.stage)).length} open · {fmtMoneyK(deals.filter(d=>!['won','lost'].includes(d.stage)).reduce((a,d)=>a+(d.value||0),0))} active · {deals.filter(d=>d.stage==='won').length} won
              </div>
              <div style={{ display:'flex', gap:14, alignItems:'flex-start', overflowX:'auto', paddingBottom:8 }}>
                {DEAL_STAGES.map(col => {
                  const cards = deals.filter(d => d.stage === col.key);
                  const colValue = cards.reduce((a,d) => a+(d.value||0), 0);
                  return (
                    <div key={col.key}
                      onDragOver={e => e.preventDefault()}
                      onDrop={async e => {
                        e.preventDefault();
                        if (dealDragId) { await api.put(`/deals/${dealDragId}`, { stage: col.key }); setDealDragId(null); loadDeals(); }
                      }}
                      style={{ width:255, flexShrink:0, background:'#F0F0F3', borderRadius:13, padding:10, display:'flex', flexDirection:'column', gap:9, minHeight:120 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'3px 5px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:700 }}>
                          <span style={{ width:9, height:9, borderRadius:3, background:col.color }} />
                          {col.label} <span style={{ color:'#9A9AA4', fontWeight:600 }}>{cards.length}</span>
                        </div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11.5, color:'#8A8A94' }}>{fmtMoneyK(colValue)}</div>
                      </div>
                      {cards.map(d => (
                        <div key={d.id} draggable onDragStart={() => setDealDragId(d.id)}
                          style={{ background:'#fff', border:'1px solid #E9E9EE', borderRadius:11, padding:'12px 13px', boxShadow:'0 1px 2px rgba(16,16,30,0.05)', cursor:'grab' }}>
                          <div style={{ fontSize:13.5, fontWeight:600 }}>{d.title}</div>
                          {d.contact_name && (
                            <div style={{ fontSize:12, color:'#8A8A94', marginTop:1 }}>
                              {d.contact_name}{d.contact_company ? ` · ${d.contact_company}` : ''}
                            </div>
                          )}
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10 }}>
                            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:600 }}>{fmtMoney(d.value)}</span>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              {Number(d.project_count) > 0 && (
                                <span style={{ fontSize:10.5, fontWeight:700, padding:'1px 6px', borderRadius:6, background:'#EFF4FF', color:'#2563EB' }}>
                                  <Icon name="layers" size={10}/> {d.project_count}
                                </span>
                              )}
                              {d.expected_close && <span style={{ fontSize:12, color:'#6B6B76' }}>Close {fmtDate(d.expected_close)}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tasks */}
          {view === 'tasks' && (
            <div style={{ maxWidth:720 }}>
              <div style={{ fontSize:13, color:'#7E7E88', marginBottom:14 }}>
                {tasks.filter(t=>!t.completed).length} open · {tasks.filter(t=>t.completed).length} completed
              </div>
              {tasks.length === 0 ? (
                <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:48, textAlign:'center', color:'#9A9AA4', fontSize:14 }}>No tasks yet.</div>
              ) : [
                { label:'Open', items: tasks.filter(t=>!t.completed) },
                { label:'Completed', items: tasks.filter(t=>t.completed) },
              ].filter(g=>g.items.length>0).map(g => (
                <div key={g.label} style={{ marginBottom:18 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#5A5A66', marginBottom:8 }}>{g.label} · {g.items.length}</div>
                  <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
                    {g.items.map(t => (
                      <div key={t.id} style={{ display:'flex', alignItems:'center', gap:13, padding:'13px 16px', borderBottom:'1px solid #F2F2F5', opacity:t.completed?0.6:1 }}>
                        <button onClick={async () => { await api.put(`/tasks/${t.id}`, { completed: !t.completed }); loadTasks(); }}
                          style={{ width:22, height:22, borderRadius:6, border:'2px solid', borderColor: t.completed?'#16A34A':'#D1D1D8', background: t.completed?'#16A34A':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}>
                          {t.completed && <Icon name="check" size={12} color="#fff" />}
                        </button>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13.5, fontWeight:500, textDecoration: t.completed?'line-through':'none' }}>{t.title}</div>
                          <div style={{ fontSize:12, color:'#8A8A94', marginTop:2 }}>
                            {t.contact_name && <span style={{ marginRight:8 }}>re: {t.contact_name}</span>}
                            {t.assigned_name && <span>Assigned to {t.assigned_name}</span>}
                          </div>
                        </div>
                        {t.due_date && <DuePill iso={t.due_date} />}
                        <button onClick={async () => { await api.delete(`/tasks/${t.id}`); loadTasks(); }}
                          style={{ color:'#C4C4CC', background:'none', border:'none', cursor:'pointer', padding:'4px' }}>
                          <Icon name="trash" size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Project Dashboard */}
          {view === 'project-dashboard' && (
            <ProjectsDashboard
              projects={projects}
              onSelect={(id) => { setView('projects'); setActiveProjectId(id); }}
            />
          )}

          {/* Projects */}
          {view === 'projects' && (
            projectViewMode === 'quadrant' && !activeProjectId ? (
              <GlobalQuadrantView
                currentUserId={user.id}
                onViewModeChange={setProjectView}
                onOpenProject={setActiveProjectId}
              />
            ) : projectViewMode === 'split' ? (
              <div style={{ display:'flex', gap:0, margin:'-24px -26px', height:'calc(100vh - 62px)', overflow:'hidden' }}>
                {/* Left: project list (collapsible) */}
                <div style={{ width: projListCollapsed ? 40 : 300, flexShrink:0, borderRight:'1px solid #EEEEF1',
                  height:'100%', overflowY: projListCollapsed ? 'hidden' : 'auto',
                  transition:'width 0.2s ease', background:'#FAFAFB' }}>
                  {projListCollapsed ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:12, gap:8 }}>
                      <button onClick={() => setProjListCollapsed(false)} title="Expand project list"
                        style={{ width:28, height:28, borderRadius:7, border:'1.5px solid #E5E5EA', background:'#fff',
                          color:'#6B6B76', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                        <span style={{ transform:'rotate(-90deg)', display:'flex' }}><Icon name="chevron" size={14}/></span>
                      </button>
                      <div style={{ writingMode:'vertical-rl', fontSize:11, fontWeight:700, color:'#B0B0BC',
                        letterSpacing:'0.06em', textTransform:'uppercase', marginTop:8 }}>Projects</div>
                    </div>
                  ) : (
                    <ProjectsView
                      projects={projects}
                      onSelect={setActiveProjectId}
                      onProjectsChange={loadProjects}
                      currentUserId={user.id}
                      isAdmin={isAdmin}
                      contacts={contacts}
                      deals={deals}
                      users={users}
                      viewMode="split"
                      onViewModeChange={setProjectView}
                      selectedProjectId={activeProjectId}
                      onCollapseList={() => setProjListCollapsed(true)}
                    />
                  )}
                </div>
                {/* Right: project detail or placeholder */}
                <div style={{ flex:1, minWidth:0, height:'100%', overflowY:'auto', padding:'24px 28px' }}>
                  {activeProjectId ? (
                    <ProjectDetail
                      key={activeProjectId}
                      projectId={activeProjectId}
                      onBack={() => setActiveProjectId(null)}
                      currentUserId={user.id}
                      isAdmin={isAdmin}
                      users={users}
                      contacts={contacts}
                      deals={deals}
                      onProjectDeleted={() => { setActiveProjectId(null); loadProjects(); }}
                      onProjectUpdated={loadProjects}
                    />
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                      height:'60vh', gap:12, color:'#9A9AA4' }}>
                      <Icon name="layers" size={44} color="#D1D1D8"/>
                      <div style={{ fontSize:15, fontWeight:600, color:'#5A5A66' }}>Select a project</div>
                      <div style={{ fontSize:13 }}>Click a project on the left to view its details here</div>
                      <button onClick={() => setShowSplitAddTask(true)}
                        style={{ marginTop:8, height:36, padding:'0 18px', borderRadius:8, border:'1.5px solid #BFDBFE',
                          background:'#EFF4FF', color:'#2563EB', fontSize:13, fontWeight:700, cursor:'pointer',
                          display:'flex', alignItems:'center', gap:6 }}>
                        <Icon name="plus" size={13}/>Add task
                      </button>
                      {showSplitAddTask && (
                        <QuickAddTaskModal projects={projects} users={users}
                          onClose={() => setShowSplitAddTask(false)} onSaved={loadProjects}/>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              activeProjectId
                ? <ProjectDetail
                    key={activeProjectId}
                    projectId={activeProjectId}
                    onBack={() => setActiveProjectId(null)}
                    currentUserId={user.id}
                    isAdmin={isAdmin}
                    users={users}
                    contacts={contacts}
                    deals={deals}
                    onProjectDeleted={() => { setActiveProjectId(null); loadProjects(); }}
                    onProjectUpdated={loadProjects}
                  />
                : <ProjectsView
                    projects={projects}
                    onSelect={setActiveProjectId}
                    onProjectsChange={loadProjects}
                    currentUserId={user.id}
                    isAdmin={isAdmin}
                    contacts={contacts}
                    deals={deals}
                    users={users}
                    viewMode="grid"
                    onViewModeChange={setProjectView}
                    selectedProjectId={activeProjectId}
                  />
            )
          )}

          {/* Reminders */}
          {view === 'reminders' && (
            <div style={{ maxWidth:760 }}>
              <div style={{ fontSize:13, color:'#7E7E88', marginBottom:14 }}>
                {reminderItems.filter(c => diffDays(c.due_date) <= 0).length} due today or overdue
                {projectFollowups.length > 0 && (
                  <span style={{ marginLeft:8, fontSize:12, color:'#5B5BD6', fontWeight:600 }}>
                    · incl. {projectFollowups.length} from projects
                  </span>
                )}
              </div>
              {groupReminders(reminderItems).length === 0 ? (
                <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:48, textAlign:'center', color:'#9A9AA4', fontSize:14 }}>
                  Inbox zero — no follow-ups due 🎉
                </div>
              ) : groupReminders(reminderItems).map(g => (
                <div key={g.label} style={{ marginBottom:18 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}>
                    <span style={{ width:9, height:9, borderRadius:'50%', background:g.color }} />
                    <span style={{ fontSize:13, fontWeight:700 }}>{g.label}</span>
                    <span style={{ fontSize:12.5, color:'#9A9AA4' }}>{g.items.length}</span>
                  </div>
                  <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
                    {g.items.map(item => item._type === 'project' ? (
                      <div key={`pf-${item.id}`}
                        onClick={() => { setView('projects'); setActiveProjectId(item.project_id); }}
                        style={{ display:'flex', alignItems:'center', gap:13, padding:'14px 16px', borderBottom:'1px solid #F2F2F5', cursor:'pointer', borderLeft:`3px solid ${item.project_color || '#5B5BD6'}` }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background: item.project_color || '#5B5BD6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#fff' }}>
                          <Icon name="layers" size={13} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:600 }}>{item.title}</div>
                          <div style={{ fontSize:12.5, color:'#8A8A94' }}>
                            {item.contact_name
                              ? `with ${item.contact_name}${item.contact_company ? ` · ${item.contact_company}` : ''}`
                              : 'No contact linked'}
                          </div>
                        </div>
                        <span style={{ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:7, color:'#2563EB', background:'#EFF4FF', whiteSpace:'nowrap', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis' }}>
                          {item.project_title}
                        </span>
                        {item.recurrence && item.recurrence !== 'none' && (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, padding:'4px 8px', borderRadius:7, color:'#7C3AED', background:'#F5F0FF' }}>
                            ↻ {item.recurrence}
                          </span>
                        )}
                        <DuePill iso={item.due_date} />
                      </div>
                    ) : (
                      <div key={item.id} onClick={() => openDetail(item)}
                        style={{ display:'flex', alignItems:'center', gap:13, padding:'14px 16px', borderBottom:'1px solid #F2F2F5', cursor:'pointer' }}>
                        <Avatar name={item.owner_name} color={item.owner_color} size={30} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:600 }}>{item.name}</div>
                          <div style={{ fontSize:12.5, color:'#8A8A94' }}>{item.title} · {item.company}</div>
                        </div>
                        {item.recurrence && item.recurrence !== 'none' && (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, padding:'4px 8px', borderRadius:7, color:'#7C3AED', background:'#F5F0FF' }}>
                            ↻ {item.recurrence}
                          </span>
                        )}
                        <StagePill stage={item.stage} />
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, color:'#5A5A66', width:72, textAlign:'right' }}>{fmtMoney(item.effective_value ?? item.value)}</span>
                        <Avatar name={item.owner_name} color={item.owner_color} size={30} />
                        <DuePill iso={item.next_followup} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Team (admin only) */}
          {view === 'team' && isAdmin && (
            <div>
              <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'32px 1.4fr 90px 1fr 120px 120px', gap:10, padding:'12px 18px', borderBottom:'1px solid #EEEEF1', fontSize:11, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', color:'#9A9AA4' }}>
                  <div>#</div><div>Rep</div><div style={{ textAlign:'right' }}>Contacts</div><div>Open pipeline</div><div style={{ textAlign:'right' }}>Won</div><div style={{ textAlign:'right' }}>Overdue</div>
                </div>
                {users.map((u, i) => {
                  const uContacts = contacts.filter(c => c.owner_id === u.id);
                  const uActive = uContacts.filter(c => !['won','lost'].includes(c.stage));
                  const uWon = uContacts.filter(c => c.stage === 'won');
                  const uOverdue = uContacts.filter(c => c.next_followup && diffDays(c.next_followup) < 0);
                  const openVal = uActive.reduce((a,c) => a+(c.effective_value ?? c.value ?? 0), 0);
                  const wonVal = uWon.reduce((a,c) => a+(c.effective_value ?? c.value ?? 0), 0);
                  const maxOpen = Math.max(...users.map(uu => contacts.filter(c => c.owner_id===uu.id && !['won','lost'].includes(c.stage)).reduce((a,c)=>a+(c.effective_value ?? c.value ?? 0),0)), 1);
                  const pct = Math.round(openVal / maxOpen * 100);
                  return (
                    <div key={u.id} style={{ display:'grid', gridTemplateColumns:'32px 1.4fr 90px 1fr 120px 120px', gap:10, padding:'13px 18px', borderBottom:'1px solid #F2F2F5', alignItems:'center' }}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, color: i===0?'#D97706':i===1?'#9A9AA4':'#C4A882', fontWeight:600 }}>{i+1}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar name={u.name} color={u.color} size={30} />
                        <div>
                          <div style={{ fontSize:13.5, fontWeight:600 }}>{u.name}</div>
                          <div style={{ fontSize:11.5, color:'#9A9AA4' }}>{u.role}</div>
                        </div>
                      </div>
                      <div style={{ textAlign:'right', fontFamily:"'IBM Plex Mono',monospace", fontSize:13 }}>{uContacts.length}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ flex:1, height:8, background:'#F0F0F3', borderRadius:5, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:u.color, borderRadius:5 }} />
                        </div>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#5A5A66', width:64, textAlign:'right' }}>{fmtMoneyK(openVal)}</span>
                      </div>
                      <div style={{ textAlign:'right', fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:600, color:'#16A34A' }}>{fmtMoneyK(wonVal)}</div>
                      <div style={{ textAlign:'right' }}>
                        {uOverdue.length > 0
                          ? <span style={{ fontSize:12, fontWeight:700, padding:'3px 8px', borderRadius:7, color:'#DC2626', background:'#FEF2F2' }}>{uOverdue.length} overdue</span>
                          : <span style={{ fontSize:12, color:'#9A9AA4' }}>—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HR Module */}
          {view.startsWith('hr-') && (
            <HRModule view={view} user={user} />
          )}

          {/* Settings */}
          {view === 'settings' && (
            <SettingsPage user={user} onUpdate={refreshUser} isAdmin={isAdmin} customFieldDefs={customFieldDefs} reloadCustomFields={loadCustomFieldDefs} />
          )}

          {/* User management (admin only) */}
          {view === 'users' && isAdmin && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <div style={{ fontSize:13.5, color:'#7E7E88' }}>{users.length} team member{users.length !== 1 ? 's' : ''}</div>
                <button
                  onClick={() => { setEditingUser(null); setShowUserModal(true); }}
                  style={{ display:'flex', alignItems:'center', gap:7, height:38, padding:'0 16px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:700 }}>
                  <Icon name="plus" size={16} />Add user
                </button>
              </div>

              <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 2px rgba(16,16,30,0.04)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 90px 140px 110px 100px', gap:10, padding:'12px 20px', borderBottom:'1px solid #EEEEF1', fontSize:11, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', color:'#9A9AA4' }}>
                  <div>Name</div><div>Email</div><div>Role</div><div>Modules</div><div>Contacts</div><div style={{ textAlign:'right' }}>Actions</div>
                </div>
                {users.map(u => {
                  const uContacts = contacts.filter(c => c.owner_id === u.id);
                  const isSelf = u.id === user.id;
                  const uMA = u.module_access || DEFAULT_MODULE_ACCESS;
                  return (
                    <div key={u.id} style={{ display:'grid', gridTemplateColumns:'2fr 2fr 90px 140px 110px 100px', gap:10, padding:'14px 20px', borderBottom:'1px solid #F2F2F5', alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar name={u.name} color={u.color} size={32} />
                        <div>
                          <div style={{ fontSize:14, fontWeight:600 }}>{u.name}{isSelf && <span style={{ marginLeft:7, fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:6, background:'#EFF4FF', color:'#2563EB' }}>You</span>}</div>
                        </div>
                      </div>
                      <div style={{ fontSize:13, color:'#5A5A66', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        <span style={{ fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:7,
                          background: u.role === 'admin' ? '#F5F0FF' : '#F1F5F9',
                          color:      u.role === 'admin' ? '#7C3AED'  : '#475569' }}>
                          {u.role === 'admin' ? 'Admin' : 'Rep'}
                        </span>
                        {u.hr_role && (
                          <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6,
                            background: u.hr_role === 'hr_admin' ? '#FEF6E7' : u.hr_role === 'manager' ? '#EFF4FF' : '#F1F5F9',
                            color:      u.hr_role === 'hr_admin' ? '#D97706'  : u.hr_role === 'manager' ? '#2563EB'  : '#64748B' }}>
                            {{ hr_admin:'HR Admin', manager:'Manager', employee:'Employee' }[u.hr_role]}
                          </span>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {u.role === 'admin' ? (
                          <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6, background:'#F5F0FF', color:'#7C3AED' }}>All</span>
                        ) : Object.entries(MODULE_LABELS).map(([key, label]) => (
                          <span key={key} style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6,
                            background: uMA[key] !== false ? '#ECFDF3' : '#F4F4F6',
                            color:      uMA[key] !== false ? '#16A34A' : '#9A9AA4' }}>
                            {label}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize:13, color:'#6B6B76' }}>{uContacts.length} contact{uContacts.length !== 1 ? 's' : ''}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
                        <button
                          onClick={() => { setEditingUser(u); setShowUserModal(true); }}
                          title="Edit"
                          style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#6B6B76', background:'#F5F5F8' }}>
                          <Icon name="pencil" size={15} />
                        </button>
                        {!isSelf && (
                          deleteConfirmId === u.id ? (
                            <div style={{ display:'flex', gap:4 }}>
                              <button
                                onClick={async () => {
                                  await api.delete(`/users/${u.id}`);
                                  setDeleteConfirmId(null);
                                  loadUsers();
                                }}
                                style={{ height:32, padding:'0 10px', borderRadius:8, fontSize:12, fontWeight:700, background:'#DC2626', color:'#fff' }}>
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                style={{ height:32, padding:'0 10px', borderRadius:8, fontSize:12, fontWeight:600, background:'#F2F2F5', color:'#5A5A66' }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(u.id)}
                              title="Delete"
                              style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#DC2626', background:'#FEF2F2' }}>
                              <Icon name="trash" size={15} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {showUserModal && (
                <UserModal
                  editUser={editingUser}
                  onClose={() => { setShowUserModal(false); setEditingUser(null); }}
                  onSaved={loadUsers}
                />
              )}
            </div>
          )}

        </main>
      </div>

      {/* Detail panel */}
      {detailContact && (
        <DetailPanel
          contact={detailContact}
          onClose={() => setDetailContact(null)}
          onUpdate={async () => {
            await loadContacts();
            const updated = await api.get('/contacts').then(r => r.data.find(c => c.id === detailContact.id));
            if (updated) setDetailContact(updated);
          }}
          onDelete={(id) => { setDetailContact(null); loadContacts(); loadDeals(); }}
          currentUserId={user.id}
          isAdmin={isAdmin}
          users={users}
          customFieldDefs={customFieldDefs}
          onDealsChange={loadDeals}
          linkedProjects={projects.filter(p => p.contact_id === detailContact.id)}
          onOpenProject={(id) => { setDetailContact(null); setView('projects'); setActiveProjectId(id); }}
        />
      )}

      {/* Add contact modal */}
      {showAdd && (
        <AddContactModal
          onClose={() => setShowAdd(false)}
          onSaved={loadContacts}
          users={users}
          currentUserId={user.id}
          customFieldDefs={customFieldDefs}
        />
      )}
    </div>
  );
}
