import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import GroupedByEmployee from '../components/GroupedByEmployee';

const ACCENT = '#5B5BD6';
const HR_PATHS = {
  users:    [{ t:'circle', cx:9, cy:7, r:3.4 },'M2.5 20v-.8a6 6 0 0 1 12 0v.8','M17 4a3.4 3.4 0 0 1 0 6.6','M22 20v-.8a5 5 0 0 0-3.6-4.7'],
  calendar: ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
  check:    ['M5 12l4.5 4.5L19 7'],
  x:        ['M6 6l12 12','M18 6L6 18'],
  plus:     ['M12 5v14','M5 12h14'],
  pencil:   ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  trash:    ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2'],
  doc:      ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  briefcase:['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z','M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'],
  eye:      [{ t:'circle', cx:12, cy:12, r:3 },'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z'],
  'eye-off':['M17.9 17.9A10 10 0 0 1 2 12s1.4-3 4-5M6.5 6.5A10 10 0 0 1 22 12s-3.6 7-10 7a9.9 9.9 0 0 1-5.5-1.7','M1 1l22 22'],
  alert:    [{ t:'circle', cx:12, cy:12, r:9 },'M12 8v4','M12 16h.01'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  building: ['M3 21h18','M5 21V7l8-4v18','M19 21V11l-6-4','M9 9v.01','M9 12v.01','M9 15v.01','M9 18v.01'],
  chevron:  ['M6 9l6 6 6-6'],
  search:   [{ t:'circle', cx:11, cy:11, r:7 },'M21 21l-4.3-4.3'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
};

function HRIcon({ name, size = 16, color }) {
  const items = HR_PATHS[name] || [];
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

const isHRAdmin   = (u) => u.role === 'admin' || u.hr_role === 'hr_admin';
const isHRManager = (u) => isHRAdmin(u) || u.hr_role === 'manager';

function Avatar({ name, color, size = 32 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background: color || ACCENT,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontSize: size * 0.38, fontWeight:700, flexShrink:0 }}>
      {initials}
    </div>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:6, color, background:bg, whiteSpace:'nowrap' }}>
      {label}
    </span>
  );
}

const HR_ROLE_META = {
  hr_admin: { label:'HR Admin', color:'#7C3AED', bg:'#F3F0FF' },
  manager:  { label:'Manager',  color:'#2563EB', bg:'#EFF4FF' },
  employee: { label:'Employee', color:'#16A34A', bg:'#ECFDF3' },
};

const LEAVE_TYPE_COLORS = ['#7C3AED','#2563EB','#D97706','#DB2777','#059669','#DC2626','#0891B2'];
const HOLIDAY_COLOR = { color:'#B45309', bg:'#FEF3C7' };

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

const todayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const fmtMonth = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return new Date(y, parseInt(m) - 1, 1).toLocaleDateString('en-IN', { month:'long', year:'numeric' });
};

const fmtINR = (v) =>
  '₹' + Number(v || 0).toLocaleString('en-IN');

// ── Employee Directory ────────────────────────────────────────────────────────
function EmployeeDirectory({ user }) {
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selected, setSelected]     = useState(null);
  const [editing, setEditing]       = useState(false);
  const [showPCR, setShowPCR]       = useState(false); // profile change request

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/hr/employees');
      setEmployees(r.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const depts = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
  const visible = employees.filter(e => {
    const matchS = !search || [e.name, e.email, e.employee_id, e.department, e.designation]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchD = deptFilter === 'all' || e.department === deptFilter;
    return matchS && matchD;
  });

  const card = { background:'#fff', border:'1px solid #ECECEF', borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 3px rgba(16,16,30,0.05)' };
  const inp  = { width:'100%', height:38, padding:'0 11px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#FAFAFB', outline:'none' };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', flex:1 }}>Employees</h2>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <HRIcon name="search" size={14} color="#9A9AA4" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, department…"
            style={{ ...inp, paddingLeft:30 }} />
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
          </span>
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#FAFAFB', outline:'none' }}>
          <option value="all">All Departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', color:'#9A9AA4', padding:48 }}>Loading…</div>
      ) : visible.length === 0 ? (
        <div style={{ ...card, textAlign:'center', padding:48, color:'#9A9AA4' }}>
          <HRIcon name="users" size={36} color="#D1D1D8" />
          <div style={{ marginTop:12, fontWeight:600 }}>No employees found</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {visible.map(e => (
            <div key={e.id} onClick={() => { setSelected(e); setEditing(false); }}
              style={{ ...card, cursor:'pointer', transition:'box-shadow .15s' }}
              onMouseEnter={ev => ev.currentTarget.style.boxShadow='0 4px 14px rgba(16,16,30,.10)'}
              onMouseLeave={ev => ev.currentTarget.style.boxShadow='0 1px 3px rgba(16,16,30,.05)'}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <Avatar name={e.name} color={e.color} size={36} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.name}</div>
                  <div style={{ fontSize:12, color:'#7E7E88', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.designation || e.email}</div>
                </div>
                {e.hr_role && <Badge {...HR_ROLE_META[e.hr_role]} />}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {e.department && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6B6B76' }}>
                    <HRIcon name="building" size={12} />{e.department}
                  </div>
                )}
                {e.manager_name && (
                  <div style={{ fontSize:12, color:'#9A9AA4' }}>Manager: {e.manager_name}</div>
                )}
                {e.joining_date && (
                  <div style={{ fontSize:12, color:'#9A9AA4' }}>Joined: {fmtDate(e.joining_date)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile panel */}
      {selected && (
        <EmployeeProfilePanel
          employee={selected}
          currentUser={user}
          onClose={() => { setSelected(null); setEditing(false); }}
          onSaved={() => { load(); setEditing(false); }}
          editing={editing}
          setEditing={setEditing}
          showPCR={showPCR}
          setShowPCR={setShowPCR}
        />
      )}
    </div>
  );
}

function EmployeeProfilePanel({ employee, currentUser, onClose, onSaved, editing, setEditing, showPCR, setShowPCR }) {
  const isSelf     = currentUser.id === employee.id;
  const isAdmin    = isHRAdmin(currentUser);
  const [form, setForm] = useState({
    phone: employee.phone || '', address: employee.address || '',
    emergency_contact_name: employee.emergency_contact_name || '',
    emergency_contact_phone: employee.emergency_contact_phone || '',
    employee_id: employee.employee_id || '', department: employee.department || '',
    designation: employee.designation || '', joining_date: employee.joining_date?.slice(0,10) || '',
    date_of_birth: employee.date_of_birth?.slice(0,10) || '',
    pan_number: employee.pan_number || '', bank_account_number: employee.bank_account_number || '',
    bank_ifsc: employee.bank_ifsc || '', hr_role: employee.hr_role || '',
    manager_id: employee.manager_id || '',
  });
  const [pcrForm, setPcrForm] = useState({ field_name: 'pan_number', new_value: '' });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [showSensitive, setShowSensitive] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (isAdmin && editing) {
      api.get('/users').then(r => setAllUsers(r.data)).catch(() => {});
    }
  }, [isAdmin, editing]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true); setError('');
    try {
      await api.put(`/hr/employees/${employee.id}/profile`, form);
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const submitPCR = async () => {
    if (!pcrForm.new_value) return;
    setSaving(true); setError('');
    try {
      await api.post(`/hr/employees/${employee.id}/profile-requests`, pcrForm);
      setShowPCR(false);
      setPcrForm({ field_name: 'pan_number', new_value: '' });
    } catch (err) { setError(err.response?.data?.error || 'Failed to submit'); }
    finally { setSaving(false); }
  };

  const inp = { width:'100%', height:36, padding:'0 10px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#FAFAFB', outline:'none' };
  const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#9A9AA4', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 };
  const field = (label, key, type='text', adminOnly=false) => {
    if (adminOnly && !isAdmin) return null;
    return (
      <div>
        <label style={lbl}>{label}</label>
        {editing
          ? <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} style={inp} />
          : <div style={{ fontSize:13.5, color: form[key] ? '#1A1A24' : '#C4C4CC', fontStyle: form[key] ? 'normal' : 'italic' }}>{form[key] || '—'}</div>}
      </div>
    );
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,.34)' }} />
      <div style={{ position:'absolute', right:0, top:0, bottom:0, width:480, background:'#fff',
        boxShadow:'-4px 0 24px rgba(16,16,30,.12)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 20px', borderBottom:'1px solid #EEEEF1' }}>
          <Avatar name={employee.name} color={employee.color} size={40} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:700 }}>{employee.name}</div>
            <div style={{ fontSize:12.5, color:'#7E7E88' }}>{employee.email}</div>
          </div>
          {(isSelf || isAdmin) && !editing && (
            <button onClick={() => setEditing(true)}
              style={{ display:'flex', alignItems:'center', gap:5, height:32, padding:'0 12px', borderRadius:7, background:'#F2F2F5', fontSize:12.5, fontWeight:600, color:'#3A3A44' }}>
              <HRIcon name="pencil" size={13} />Edit
            </button>
          )}
          <button onClick={onClose} style={{ color:'#8A8A94', background:'none', border:'none', cursor:'pointer', padding:4 }}>
            <HRIcon name="x" size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'9px 12px', color:'#DC2626', fontSize:13, marginBottom:14 }}>{error}</div>
          )}

          {/* Basic info */}
          <div style={{ fontSize:13, fontWeight:700, color:'#5A5A66', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:12 }}>Basic Info</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
            {field('Employee ID', 'employee_id', 'text', true)}
            {field('Department', 'department', 'text', true)}
            {field('Designation', 'designation', 'text', true)}
            {field('Joining Date', 'joining_date', 'date', true)}
            {field('Date of Birth', 'date_of_birth', 'date', true)}
            {isAdmin && editing && (
              <div>
                <label style={lbl}>HR Role</label>
                <select value={form.hr_role} onChange={e => set('hr_role', e.target.value)}
                  style={{ ...inp, cursor:'pointer' }}>
                  <option value="">— None —</option>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr_admin">HR Admin</option>
                </select>
              </div>
            )}
            {isAdmin && editing && (
              <div>
                <label style={lbl}>Reports To</label>
                <select value={form.manager_id} onChange={e => set('manager_id', e.target.value)}
                  style={{ ...inp, cursor:'pointer' }}>
                  <option value="">— No manager —</option>
                  {allUsers.filter(u => u.id !== employee.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
            {!editing && employee.manager_name && (
              <div>
                <label style={lbl}>Reports To</label>
                <div style={{ fontSize:13.5 }}>{employee.manager_name}</div>
              </div>
            )}
          </div>

          {/* Contact */}
          <div style={{ fontSize:13, fontWeight:700, color:'#5A5A66', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:12 }}>Contact</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
            {field('Phone', 'phone')}
            {field('Emergency Contact', 'emergency_contact_name')}
            {field('Emergency Phone', 'emergency_contact_phone')}
          </div>
          {editing
            ? <div style={{ marginBottom:20 }}><label style={lbl}>Address</label>
                <textarea value={form.address} onChange={e => set('address', e.target.value)}
                  style={{ ...inp, height:70, padding:'8px 10px', resize:'vertical' }} /></div>
            : employee.address && <div style={{ marginBottom:20 }}>
                <label style={lbl}>Address</label>
                <div style={{ fontSize:13.5 }}>{employee.address}</div>
              </div>
          }

          {/* Sensitive */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#5A5A66', textTransform:'uppercase', letterSpacing:'.05em' }}>Sensitive Details</div>
            {(isSelf || isAdmin) && (
              <button onClick={() => setShowSensitive(v => !v)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#7E7E88', padding:2 }}>
                <HRIcon name={showSensitive ? 'eye-off' : 'eye'} size={14} />
              </button>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
            {(['pan_number','bank_account_number','bank_ifsc']).map(k => (
              <div key={k}>
                <label style={lbl}>{k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</label>
                {isAdmin && editing
                  ? <input value={form[k]} onChange={e => set(k, e.target.value)} style={inp} />
                  : <div style={{ fontSize:13.5, color:'#1A1A24', fontFamily:'monospace' }}>
                      {(isSelf || isAdmin) && showSensitive
                        ? (form[k] || '—')
                        : (form[k] ? '●●●●●●●●' : '—')}
                    </div>}
              </div>
            ))}
          </div>
          {isSelf && !isAdmin && !editing && (
            <button onClick={() => setShowPCR(true)}
              style={{ display:'flex', alignItems:'center', gap:6, height:34, padding:'0 14px', borderRadius:8, background:'#F3F0FF', color:'#7C3AED', fontSize:12.5, fontWeight:600, border:'1px solid #DDD6FE', cursor:'pointer', marginBottom:20 }}>
              <HRIcon name="pencil" size={13} />Request PAN / Bank Change
            </button>
          )}

          {/* Leave Balances (HR Admin only — pro-rata override for new joinees) */}
          {isAdmin && <LeaveBalanceEditor employeeId={employee.id} />}

          {/* Change Request Form */}
          {showPCR && (
            <div style={{ background:'#FAFAFB', border:'1px solid #EEEEF1', borderRadius:10, padding:'14px', marginBottom:20 }}>
              <div style={{ fontSize:13.5, fontWeight:700, marginBottom:12 }}>Request Sensitive Field Change</div>
              <label style={lbl}>Field</label>
              <select value={pcrForm.field_name} onChange={e => setPcrForm(f => ({...f, field_name: e.target.value}))}
                style={{ ...inp, marginBottom:10, cursor:'pointer' }}>
                <option value="pan_number">PAN Number</option>
                <option value="bank_account_number">Bank Account Number</option>
                <option value="bank_ifsc">Bank IFSC</option>
              </select>
              <label style={lbl}>New Value</label>
              <input value={pcrForm.new_value} onChange={e => setPcrForm(f => ({...f, new_value: e.target.value}))}
                style={{ ...inp, marginBottom:12 }} />
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={submitPCR} disabled={saving}
                  style={{ height:34, padding:'0 16px', borderRadius:8, background:ACCENT, color:'#fff', fontSize:13, fontWeight:700, opacity:saving?.7:1 }}>
                  Submit Request
                </button>
                <button onClick={() => setShowPCR(false)}
                  style={{ height:34, padding:'0 14px', borderRadius:8, background:'#F2F2F5', color:'#5A5A66', fontSize:13, fontWeight:600 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {editing && (
          <div style={{ display:'flex', gap:10, padding:'14px 20px', borderTop:'1px solid #EEEEF1' }}>
            <button onClick={save} disabled={saving}
              style={{ height:38, padding:'0 22px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:700, opacity:saving?.7:1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)}
              style={{ height:38, padding:'0 18px', borderRadius:9, background:'#F2F2F5', color:'#5A5A66', fontSize:13.5, fontWeight:600 }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaveBalanceEditor({ employeeId }) {
  const [balances, setBalances] = useState([]);
  const [edits, setEdits]       = useState({});
  const [saving, setSaving]     = useState(null);
  const year = new Date().getFullYear();

  const load = useCallback(() => {
    api.get(`/hr/leaves/balances?userId=${employeeId}&year=${year}`).then(r => setBalances(r.data)).catch(() => {});
  }, [employeeId, year]);

  useEffect(() => { load(); }, [load]);

  const saveOne = async (leaveTypeId) => {
    const val = edits[leaveTypeId];
    if (val == null || val === '') return;
    setSaving(leaveTypeId);
    try {
      await api.put(`/hr/leaves/balances/${employeeId}/${leaveTypeId}?year=${year}`, { allocated_days: Number(val) });
      setEdits(e => ({ ...e, [leaveTypeId]: undefined }));
      load();
    } finally { setSaving(null); }
  };

  const inp = { width:70, height:32, padding:'0 8px', border:'1px solid #E5E5EA', borderRadius:7, fontSize:13, background:'#FAFAFB', outline:'none' };

  if (balances.length === 0) return null;

  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:13, fontWeight:700, color:'#5A5A66', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:12 }}>
        Leave Balances ({year})
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {balances.map(b => (
          <div key={b.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#FAFAFB', border:'1px solid #EEEEF1', borderRadius:9 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{b.name}</div>
              <div style={{ fontSize:11.5, color:'#9A9AA4' }}>
                {b.allocated_days} allocated
                {b.carried_forward_days > 0 ? ` (incl. ${b.carried_forward_days} carried forward)` : ''}
                {' · '}{b.used_days} used
              </div>
            </div>
            <input type="number" min="0" step="0.5"
              placeholder={String(b.allocated_days)}
              value={edits[b.id] ?? ''}
              onChange={e => setEdits(ed => ({ ...ed, [b.id]: e.target.value }))}
              style={inp} />
            <button onClick={() => saveOne(b.id)} disabled={saving === b.id}
              style={{ height:32, padding:'0 12px', borderRadius:7, background:ACCENT, color:'#fff', fontSize:12, fontWeight:700, border:'none', cursor:'pointer', opacity: saving === b.id ? .7 : 1 }}>
              {saving === b.id ? '…' : 'Set'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Leave Management ─────────────────────────────────────────────────────────
const LEAVE_STATUS_META = {
  pending:  { label:'Pending',  color:'#D97706', bg:'#FFFBEB' },
  approved: { label:'Approved', color:'#16A34A', bg:'#ECFDF3' },
  rejected: { label:'Rejected', color:'#DC2626', bg:'#FEF2F2' },
  cancelled:{ label:'Cancelled',color:'#6B7280', bg:'#F3F4F6' },
};
const LEAVE_CARD = { background:'#fff', border:'1px solid #ECECEF', borderRadius:12, padding:'14px 16px', marginBottom:10 };

// ── My Leaves (self-only — everyone, including managers/HR Admin, only ever sees their own here) ──
function MyLeavesView({ user }) {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [types, setTypes]       = useState([]);
  const [showApply, setShowApply] = useState(false);
  const [loading, setLoading]   = useState(true);
  const year = new Date().getFullYear();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [b, r, t] = await Promise.all([
        api.get(`/hr/leaves/balances?year=${year}`),
        api.get('/hr/leaves/requests'),
        api.get('/hr/leaves/types'),
      ]);
      setBalances(b.data);
      setRequests(r.data.filter(req => req.user_id === user.id));
      setTypes(t.data);
    } finally { setLoading(false); }
  }, [user.id, year]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const revokeRequest = async (id) => {
    if (!window.confirm('Revoke this leave? The days will be credited back to your balance.')) return;
    await api.put(`/hr/leaves/requests/${id}`, { status: 'cancelled' });
    loadAll();
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', flex:1 }}>My Leaves</h2>
        <button onClick={() => setShowApply(true)}
          style={{ display:'flex', alignItems:'center', gap:6, height:36, padding:'0 16px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }}>
          <HRIcon name="plus" size={15} />Apply Leave
        </button>
      </div>

      {balances.length > 0 && (
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          {balances.map(b => {
            const remaining = b.allocated_days - b.used_days;
            return (
              <div key={b.id} style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:10, padding:'10px 16px', minWidth:120 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#9A9AA4', marginBottom:4 }}>{b.name}</div>
                <div style={{ fontSize:22, fontWeight:800, color: remaining < 3 ? '#DC2626' : '#1A1A24' }}>{remaining}</div>
                <div style={{ fontSize:11, color:'#B0B0BC' }}>of {b.allocated_days} remaining</div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? <div style={{ color:'#9A9AA4', padding:24 }}>Loading…</div> : (
        requests.length === 0
          ? <div style={{ textAlign:'center', padding:48, color:'#9A9AA4' }}>No leave requests yet.</div>
          : requests.map(r => {
            const sm = LEAVE_STATUS_META[r.status] || LEAVE_STATUS_META.pending;
            return (
              <div key={r.id} style={LEAVE_CARD}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <div style={{ flex:1, fontWeight:700, fontSize:14 }}>{r.leave_type_name}</div>
                  <Badge label={sm.label} color={sm.color} bg={sm.bg} />
                  {['pending','approved'].includes(r.status) && String(r.start_date).slice(0,10) >= todayDateStr() && (
                    <button onClick={() => revokeRequest(r.id)}
                      style={{ fontSize:12, color:'#DC2626', background:'none', border:'none', cursor:'pointer' }}>Revoke</button>
                  )}
                </div>
                <div style={{ fontSize:13, color:'#6B6B76' }}>{fmtDate(r.start_date)} — {fmtDate(r.end_date)} · {r.days} day{r.days !== 1 ? 's' : ''}</div>
                {r.reason && <div style={{ fontSize:12.5, color:'#9A9AA4', marginTop:4 }}>{r.reason}</div>}
                {r.rejection_reason && <div style={{ fontSize:12.5, color:'#DC2626', marginTop:4 }}>Reason: {r.rejection_reason}</div>}
              </div>
            );
          })
      )}

      {showApply && (
        <ApplyLeaveModal types={types} onClose={() => setShowApply(false)} onSaved={loadAll} />
      )}
    </div>
  );
}

// ── Approvals (manager+ — everyone else's leave, never the viewer's own) ──
function LeaveApprovalsView({ user }) {
  const [tab, setTab]         = useState('approvals');
  const [requests, setRequests] = useState([]);
  const [pending, setPending]   = useState([]);
  const [types, setTypes]       = useState([]);
  const [showNewType, setShowNewType] = useState(false);
  const [loading, setLoading]   = useState(true);
  const hrAdmin = isHRAdmin(user);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t, p] = await Promise.all([
        api.get('/hr/leaves/requests'),
        api.get('/hr/leaves/types'),
        api.get('/hr/leaves/requests?status=pending'),
      ]);
      setRequests(r.data.filter(req => req.user_id !== user.id));
      setTypes(t.data);
      setPending(p.data.filter(req => req.user_id !== user.id));
    } finally { setLoading(false); }
  }, [user.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const reviewRequest = async (id, status, reason) => {
    await api.put(`/hr/leaves/requests/${id}`, { status, rejection_reason: reason });
    loadAll();
  };

  const historyRequests = requests.filter(r => ['approved','rejected','cancelled'].includes(r.status));

  const TABS = [
    { key:'approvals', label:`Pending (${pending.length})` },
    { key:'history', label:`History (${historyRequests.length})` },
    ...(hrAdmin ? [{ key:'types', label:'Leave Types' }] : []),
  ];

  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', marginBottom:20 }}>Leave Approvals</h2>

      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid #EEEEF1', paddingBottom:2 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'7px 14px', borderRadius:'8px 8px 0 0', fontSize:13, fontWeight:600, border:'none', cursor:'pointer',
              background: tab === t.key ? '#fff' : 'transparent',
              color: tab === t.key ? ACCENT : '#6B6B76',
              borderBottom: tab === t.key ? `2px solid ${ACCENT}` : '2px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ color:'#9A9AA4', padding:24 }}>Loading…</div> : (
        <>
          {tab === 'approvals' && (
            pending.length === 0
              ? <div style={{ textAlign:'center', padding:48, color:'#9A9AA4' }}>No pending approvals.</div>
              : pending.map(r => (
                <LeaveApprovalCard key={r.id} request={r} onReview={reviewRequest} />
              ))
          )}

          {tab === 'history' && (
            <GroupedByEmployee
              items={historyRequests}
              getEmployeeId={r => r.user_id}
              getEmployeeName={r => r.user_name}
              getEmployeeColor={r => r.user_color}
              Avatar={Avatar}
              emptyMessage="No reviewed requests yet."
              renderItem={r => {
                const sm = LEAVE_STATUS_META[r.status] || LEAVE_STATUS_META.pending;
                return (
                  <div key={r.id} style={LEAVE_CARD}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, color:'#7E7E88' }}>{r.leave_type_name} · {r.days} day{r.days !== 1 ? 's' : ''}</div>
                      </div>
                      <Badge label={sm.label} color={sm.color} bg={sm.bg} />
                    </div>
                    <div style={{ fontSize:13, color:'#6B6B76' }}>{fmtDate(r.start_date)} — {fmtDate(r.end_date)}</div>
                    {r.reason && <div style={{ fontSize:12.5, color:'#9A9AA4', marginTop:4 }}>{r.reason}</div>}
                    {r.rejection_reason && <div style={{ fontSize:12.5, color:'#DC2626', marginTop:4 }}>Rejection reason: {r.rejection_reason}</div>}
                    <div style={{ fontSize:11.5, color:'#B0B0BC', marginTop:6 }}>
                      Reviewed by {r.reviewed_by_name || '—'}{r.reviewed_at ? ` on ${fmtDate(r.reviewed_at)}` : ''}
                    </div>
                  </div>
                );
              }}
            />
          )}

          {tab === 'types' && hrAdmin && (
            <LeaveTypesAdmin types={types} onSaved={loadAll} showNew={showNewType} setShowNew={setShowNewType} />
          )}
        </>
      )}
    </div>
  );
}

function LeaveApprovalCard({ request: r, onReview }) {
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting]       = useState(false);

  return (
    <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:12, padding:'14px 16px', marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
        <Avatar name={r.user_name} color={r.user_color} size={28} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:13.5 }}>{r.user_name}</div>
          <div style={{ fontSize:12, color:'#7E7E88' }}>{r.leave_type_name} · {r.days} day{r.days !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ fontSize:12, color:'#9A9AA4' }}>{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</div>
      </div>
      {r.reason && <div style={{ fontSize:12.5, color:'#6B6B76', marginBottom:8 }}>{r.reason}</div>}
      {rejecting ? (
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            style={{ flex:1, height:34, padding:'0 10px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, outline:'none' }} />
          <button onClick={() => { onReview(r.id, 'rejected', rejectReason); setRejecting(false); }}
            style={{ height:34, padding:'0 14px', borderRadius:8, background:'#DC2626', color:'#fff', fontSize:13, fontWeight:600, border:'none', cursor:'pointer' }}>
            Confirm Reject
          </button>
          <button onClick={() => setRejecting(false)}
            style={{ height:34, padding:'0 12px', borderRadius:8, background:'#F2F2F5', color:'#5A5A66', fontSize:13, fontWeight:600, border:'none', cursor:'pointer' }}>
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <button onClick={() => onReview(r.id, 'approved')}
            style={{ height:32, padding:'0 16px', borderRadius:8, background:'#ECFDF3', color:'#16A34A', fontSize:13, fontWeight:700, border:'1px solid #86EFAC', cursor:'pointer' }}>
            Approve
          </button>
          <button onClick={() => setRejecting(true)}
            style={{ height:32, padding:'0 14px', borderRadius:8, background:'#FEF2F2', color:'#DC2626', fontSize:13, fontWeight:700, border:'1px solid #FECACA', cursor:'pointer' }}>
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function ApplyLeaveModal({ types, onClose, onSaved }) {
  const [form, setForm] = useState({ leave_type_id: types[0]?.id || '', start_date:'', end_date:'', days:'', reason:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.start_date && form.end_date) {
      const diff = Math.round((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1;
      if (diff > 0) set('days', diff);
    }
  }, [form.start_date, form.end_date]);

  const save = async () => {
    if (!form.leave_type_id || !form.start_date || !form.end_date || !form.days) {
      setError('All fields except reason are required'); return;
    }
    if (form.start_date < todayDateStr()) { setError('Start date cannot be in the past'); return; }
    if (form.end_date < form.start_date) { setError('End date cannot be before start date'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/hr/leaves/requests', form);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const inp = { width:'100%', height:38, padding:'0 10px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#FAFAFB', outline:'none' };
  const lbl = { display:'block', fontSize:11.5, fontWeight:700, color:'#6B6B76', marginBottom:5 };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,.34)' }} />
      <div style={{ position:'relative', width:420, background:'#fff', borderRadius:16, boxShadow:'0 24px 60px rgba(20,20,30,.24)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ fontSize:16, fontWeight:700 }}>Apply for Leave</div>
          <button onClick={onClose} style={{ color:'#8A8A94', background:'none', border:'none', cursor:'pointer' }}><HRIcon name="x" size={18} /></button>
        </div>
        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          <div><label style={lbl}>Leave Type</label>
            <select value={form.leave_type_id} onChange={e => set('leave_type_id', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:10 }}>
            <div><label style={lbl}>From</label><input type="date" value={form.start_date} min={todayDateStr()} onChange={e => set('start_date', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>To</label><input type="date" value={form.end_date} min={form.start_date || todayDateStr()} onChange={e => set('end_date', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Days</label><input type="number" value={form.days} onChange={e => set('days', e.target.value)} min="0.5" step="0.5" style={inp} /></div>
          </div>
          <div><label style={lbl}>Reason (optional)</label>
            <textarea value={form.reason} onChange={e => set('reason', e.target.value)}
              style={{ ...inp, height:70, padding:'8px 10px', resize:'vertical' }} />
          </div>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'8px 12px', color:'#DC2626', fontSize:13 }}>{error}</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'14px 22px', borderTop:'1px solid #EEEEF1' }}>
          <button onClick={onClose} style={{ height:38, padding:'0 16px', borderRadius:9, background:'#F2F2F5', color:'#5A5A66', fontSize:13.5, fontWeight:600 }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ height:38, padding:'0 20px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:700, opacity:saving?.7:1 }}>
            {saving ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaveTypesAdmin({ types, onSaved, showNew, setShowNew }) {
  const [newType, setNewType] = useState({ name:'', days_per_year:12, carry_forward:false, max_carry_forward_days:0 });
  const [saving, setSaving]   = useState(false);
  const [cfEdits, setCfEdits] = useState({});

  const save = async () => {
    if (!newType.name) return;
    setSaving(true);
    try {
      await api.post('/hr/leaves/types', newType);
      setNewType({ name:'', days_per_year:12, carry_forward:false, max_carry_forward_days:0 });
      setShowNew(false);
      onSaved();
    } finally { setSaving(false); }
  };

  const toggle = async (t) => {
    await api.put(`/hr/leaves/types/${t.id}`, { is_active: !t.is_active });
    onSaved();
  };

  const saveCarryForwardCap = async (t) => {
    const val = cfEdits[t.id];
    if (val == null || val === '') return;
    await api.put(`/hr/leaves/types/${t.id}`, { max_carry_forward_days: Number(val) });
    setCfEdits(e => ({ ...e, [t.id]: undefined }));
    onSaved();
  };

  const inp = { height:36, padding:'0 10px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#FAFAFB', outline:'none' };

  return (
    <div>
      {types.map(t => (
        <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'#fff', border:'1px solid #ECECEF', borderRadius:10, marginBottom:8, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:160 }}>
            <div style={{ fontWeight:600, fontSize:13.5 }}>{t.name}</div>
            <div style={{ fontSize:12, color:'#7E7E88' }}>{t.days_per_year} days/year{t.carry_forward ? ` · Carries forward up to ${t.max_carry_forward_days} days` : ''}</div>
          </div>
          {t.carry_forward && (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <label style={{ fontSize:11.5, color:'#9A9AA4', fontWeight:600 }}>Max carry-forward</label>
              <input type="number" min="0" step="0.5"
                value={cfEdits[t.id] ?? t.max_carry_forward_days}
                onChange={e => setCfEdits(edits => ({ ...edits, [t.id]: e.target.value }))}
                style={{ ...inp, width:70, height:30 }} />
              <button onClick={() => saveCarryForwardCap(t)}
                style={{ fontSize:12, color:'#fff', background:ACCENT, border:'none', borderRadius:7, padding:'4px 10px', cursor:'pointer', fontWeight:600 }}>
                Save
              </button>
            </div>
          )}
          <Badge label={t.is_active ? 'Active' : 'Inactive'} color={t.is_active ? '#16A34A' : '#6B7280'} bg={t.is_active ? '#ECFDF3' : '#F3F4F6'} />
          <button onClick={() => toggle(t)} style={{ fontSize:12, color:'#5A5A66', background:'#F2F2F5', border:'none', borderRadius:7, padding:'4px 10px', cursor:'pointer', fontWeight:600 }}>
            {t.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ))}
      {showNew ? (
        <div style={{ background:'#FAFAFB', border:'1px dashed #D1D1D8', borderRadius:10, padding:'14px', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <input value={newType.name} onChange={e => setNewType(f=>({...f,name:e.target.value}))} placeholder="Leave type name" style={{ ...inp, flex:1 }} />
            <input type="number" value={newType.days_per_year} onChange={e => setNewType(f=>({...f,days_per_year:parseInt(e.target.value)}))} style={{ ...inp, width:90 }} />
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:500 }}>
              <input type="checkbox" checked={newType.carry_forward} onChange={e => setNewType(f=>({...f,carry_forward:e.target.checked}))} />
              Carry forward
            </label>
            {newType.carry_forward && (
              <input type="number" min="0" step="0.5" value={newType.max_carry_forward_days}
                onChange={e => setNewType(f=>({...f,max_carry_forward_days:e.target.value}))}
                placeholder="Max days" style={{ ...inp, width:90 }} />
            )}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={save} disabled={saving} style={{ height:34, padding:'0 16px', borderRadius:8, background:ACCENT, color:'#fff', fontSize:13, fontWeight:700 }}>Add</button>
            <button onClick={() => setShowNew(false)} style={{ height:34, padding:'0 14px', borderRadius:8, background:'#F2F2F5', color:'#5A5A66', fontSize:13, fontWeight:600 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowNew(true)}
          style={{ display:'flex', alignItems:'center', gap:6, height:36, padding:'0 16px', borderRadius:9, border:'1.5px dashed #D1D1D8', background:'transparent', color:'#5A5A66', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          <HRIcon name="plus" size={14} />New leave type
        </button>
      )}
    </div>
  );
}

// ── Leave Calendar ───────────────────────────────────────────────────────────
function HolidayPanel({ holidays, admin, onAdded, onDeleted }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date:'', name:'' });
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!form.date || !form.name) return;
    setSaving(true);
    try {
      await api.post('/hr/holidays', form);
      setForm({ date:'', name:'' });
      setShowAdd(false);
      onAdded();
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    await api.delete(`/hr/holidays/${id}`);
    onDeleted();
  };

  const inp = { height:34, padding:'0 10px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#FAFAFB', outline:'none' };

  return (
    <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:12, padding:'12px 16px', marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: holidays.length || admin ? 10 : 0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#5A5A66', flex:1 }}>Company Holidays</div>
        {admin && !showAdd && (
          <button onClick={() => setShowAdd(true)}
            style={{ display:'flex', alignItems:'center', gap:5, height:30, padding:'0 12px', borderRadius:7, background:'#F2F2F5', color:'#5A5A66', fontSize:12, fontWeight:600, border:'none', cursor:'pointer' }}>
            <HRIcon name="plus" size={13} />Add Holiday
          </button>
        )}
      </div>
      {holidays.length > 0 && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {holidays.map(h => (
            <div key={h.id} style={{ display:'flex', alignItems:'center', gap:6, background:HOLIDAY_COLOR.bg, color:HOLIDAY_COLOR.color, borderRadius:7, padding:'5px 10px', fontSize:12, fontWeight:600 }}>
              {fmtDate(h.date)} · {h.name}
              {admin && (
                <button onClick={() => del(h.id)} style={{ background:'none', border:'none', cursor:'pointer', color:HOLIDAY_COLOR.color, display:'flex' }}>
                  <HRIcon name="x" size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {showAdd && (
        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:10, flexWrap:'wrap' }}>
          <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date:e.target.value}))} style={inp} />
          <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} placeholder="Holiday name" style={{ ...inp, flex:1, minWidth:140 }} />
          <button onClick={add} disabled={saving} style={{ height:34, padding:'0 14px', borderRadius:8, background:ACCENT, color:'#fff', fontSize:12.5, fontWeight:700, border:'none', cursor:'pointer' }}>Add</button>
          <button onClick={() => setShowAdd(false)} style={{ height:34, padding:'0 12px', borderRadius:8, background:'#F2F2F5', color:'#5A5A66', fontSize:12.5, fontWeight:600, border:'none', cursor:'pointer' }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function AdhocLeaveModal({ types, users, onClose, onSaved }) {
  const [form, setForm] = useState({ user_id:'', leave_type_id: types[0]?.id || '', start_date:'', end_date:'', days:'', reason:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.start_date && form.end_date) {
      const diff = Math.round((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1;
      if (diff > 0) set('days', diff);
    }
  }, [form.start_date, form.end_date]);

  const save = async () => {
    if (!form.user_id || !form.leave_type_id || !form.start_date || !form.end_date || !form.days) {
      setError('Employee and all date fields are required'); return;
    }
    if (form.end_date < form.start_date) { setError('End date cannot be before start date'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/hr/leaves/requests', form);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const inp = { width:'100%', height:38, padding:'0 10px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#FAFAFB', outline:'none' };
  const lbl = { display:'block', fontSize:11.5, fontWeight:700, color:'#6B6B76', marginBottom:5 };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,.34)' }} />
      <div style={{ position:'relative', width:420, background:'#fff', borderRadius:16, boxShadow:'0 24px 60px rgba(20,20,30,.24)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ fontSize:16, fontWeight:700 }}>Mark Leave (Adhoc)</div>
          <button onClick={onClose} style={{ color:'#8A8A94', background:'none', border:'none', cursor:'pointer' }}><HRIcon name="x" size={18} /></button>
        </div>
        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          <div><label style={lbl}>Employee</label>
            <select value={form.user_id} onChange={e => set('user_id', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              <option value="">— Select employee —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Leave Type</label>
            <select value={form.leave_type_id} onChange={e => set('leave_type_id', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:10 }}>
            <div><label style={lbl}>From</label><input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>To</label><input type="date" value={form.end_date} min={form.start_date || ''} onChange={e => set('end_date', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Days</label><input type="number" value={form.days} onChange={e => set('days', e.target.value)} min="0.5" step="0.5" style={inp} /></div>
          </div>
          <div><label style={lbl}>Reason (optional)</label>
            <textarea value={form.reason} onChange={e => set('reason', e.target.value)}
              style={{ ...inp, height:70, padding:'8px 10px', resize:'vertical' }} />
          </div>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'8px 12px', color:'#DC2626', fontSize:13 }}>{error}</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'14px 22px', borderTop:'1px solid #EEEEF1' }}>
          <button onClick={onClose} style={{ height:38, padding:'0 16px', borderRadius:9, background:'#F2F2F5', color:'#5A5A66', fontSize:13.5, fontWeight:600 }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ height:38, padding:'0 20px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:700, opacity:saving?.7:1 }}>
            {saving ? 'Saving…' : 'Mark Approved'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaveCalendarView({ user }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [requests, setRequests] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [types, setTypes]       = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdhoc, setShowAdhoc] = useState(false);
  const admin = isHRAdmin(user);

  const ym = `${year}-${String(month + 1).padStart(2,'0')}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqR, holR, typR, empR] = await Promise.all([
        api.get(`/hr/leaves/calendar?month=${ym}`),
        api.get(`/hr/holidays?year=${year}`),
        api.get('/hr/leaves/types'),
        api.get('/hr/leaves/roster'),
      ]);
      setRequests(reqR.data);
      setHolidays(holR.data);
      setTypes(typR.data);
      setTeamUsers(empR.data);
    } finally { setLoading(false); }
  }, [ym, year]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); };

  const pad2 = n => String(n).padStart(2, '0');
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const adjustedFirst = (firstDay + 6) % 7; // Mon=0
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${year}-${pad2(month + 1)}-${pad2(dayNum)}`;
    const isWeekend = new Date(year, month, dayNum).getDay() === 0 || new Date(year, month, dayNum).getDay() === 6;
    return { num: dayNum, dateStr, isWeekend, isToday: dateStr === todayStr };
  });

  // Expand each approved request's date range into per-day entries, clipped to the visible month.
  // Requests' start_date/end_date are plain calendar dates serialized at UTC midnight — do all
  // arithmetic in UTC to avoid local-timezone round-trips shifting the date by a day.
  const leaveByUserDay = {};
  const monthStartUTC = Date.UTC(year, month, 1);
  const monthEndUTC   = Date.UTC(year, month, daysInMonth);
  requests.forEach(r => {
    const reqStart = new Date(r.start_date).getTime();
    const reqEnd   = new Date(r.end_date).getTime();
    const clampedStart = Math.max(reqStart, monthStartUTC);
    const clampedEnd   = Math.min(reqEnd, monthEndUTC);
    for (let t = clampedStart; t <= clampedEnd; t += 86400000) {
      const key = new Date(t).toISOString().slice(0,10);
      (leaveByUserDay[r.user_id] ??= {})[key] = { leave_type_id: r.leave_type_id, leave_type_name: r.leave_type_name };
    }
  });

  const holidayByDay = {};
  holidays.forEach(h => { holidayByDay[h.date.slice(0,10)] = h.name; });

  const colorForType = (id) => LEAVE_TYPE_COLORS[Math.max(0, types.findIndex(t => t.id === id)) % LEAVE_TYPE_COLORS.length];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', flex:1 }}>Leave Calendar</h2>
        {admin && (
          <button onClick={() => setShowAdhoc(true)}
            style={{ display:'flex', alignItems:'center', gap:6, height:36, padding:'0 16px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }}>
            <HRIcon name="plus" size={15} />Add Adhoc Leave
          </button>
        )}
      </div>

      <HolidayPanel holidays={holidays} admin={admin} onAdded={load} onDeleted={load} />

      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={prevMonth} style={{ background:'#F2F2F5', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transform:'rotate(90deg)' }}>
          <HRIcon name="chevron" size={16} color="#5A5A66" />
        </button>
        <div style={{ fontSize:15, fontWeight:700, minWidth:160, textAlign:'center' }}>
          {new Date(year, month).toLocaleDateString('en-IN',{ month:'long', year:'numeric' })}
        </div>
        <button onClick={nextMonth} style={{ background:'#F2F2F5', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transform:'rotate(-90deg)' }}>
          <HRIcon name="chevron" size={16} color="#5A5A66" />
        </button>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        {types.map(t => (
          <div key={t.id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6B6B76' }}>
            <span style={{ width:12, height:12, borderRadius:4, background:colorForType(t.id) }} />
            {t.name}
          </div>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6B6B76' }}>
          <span style={{ width:12, height:12, borderRadius:4, background:HOLIDAY_COLOR.bg, border:`1px solid ${HOLIDAY_COLOR.color}55` }} />
          Holiday
        </div>
      </div>

      {loading ? <div style={{ color:'#9A9AA4', padding:24 }}>Loading…</div> : (
        teamUsers.length === 0 ? (
          <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:48, textAlign:'center', color:'#9A9AA4' }}>
            <HRIcon name="users" size={36} color="#D1D1D8" />
            <div style={{ marginTop:12, fontWeight:600 }}>No team members found</div>
          </div>
        ) : (
          <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, overflow:'auto' }}>
            <table style={{ borderCollapse:'collapse', minWidth:'100%', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#FAFAFB' }}>
                  <th style={{ padding:'8px 12px', textAlign:'left', fontWeight:700, color:'#5A5A66', whiteSpace:'nowrap', borderBottom:'1px solid #ECECEF', position:'sticky', left:0, background:'#FAFAFB', zIndex:1 }}>Employee</th>
                  {days.map(d => (
                    <th key={d.dateStr} title={holidayByDay[d.dateStr] || ''} style={{
                      padding:'4px 3px', textAlign:'center', fontWeight: d.isToday ? 800 : 500,
                      color: d.isToday ? ACCENT : d.isWeekend ? '#C0C0CC' : '#9A9AA4', minWidth:28, borderBottom:'1px solid #ECECEF',
                      background: holidayByDay[d.dateStr] ? HOLIDAY_COLOR.bg : d.isWeekend ? '#F6F6F9' : undefined,
                    }}>
                      {d.num}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamUsers.map((u2, ui) => (
                  <tr key={u2.id} style={{ background: ui % 2 ? '#FAFAFB' : '#fff' }}>
                    <td style={{ padding:'7px 12px', whiteSpace:'nowrap', borderBottom:'1px solid #F0F0F3', position:'sticky', left:0, background: ui % 2 ? '#FAFAFB' : '#fff', zIndex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:u2.color||ACCENT, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:700, flexShrink:0 }}>
                          {(u2.name||'?')[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize:12.5, fontWeight:600 }}>{u2.name}</span>
                      </div>
                    </td>
                    {days.map(d => {
                      const leave = leaveByUserDay[u2.id]?.[d.dateStr];
                      const isHoliday = !!holidayByDay[d.dateStr];
                      return (
                        <td key={d.dateStr} title={leave ? leave.leave_type_name : ''} style={{
                          padding:'4px 2px', textAlign:'center', borderBottom:'1px solid #F0F0F3',
                          background: isHoliday ? HOLIDAY_COLOR.bg : d.isWeekend ? '#F6F6F9' : undefined, position:'relative',
                        }}>
                          {leave ? (
                            <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:16, height:16, borderRadius:'50%', background:colorForType(leave.leave_type_id) }} />
                          ) : isHoliday ? (
                            <span style={{ color:HOLIDAY_COLOR.color, fontSize:10 }}>•</span>
                          ) : (
                            <span style={{ color:'#D1D1D8', fontSize:10 }}>·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {showAdhoc && (
        <AdhocLeaveModal types={types} users={teamUsers} onClose={() => setShowAdhoc(false)} onSaved={load} />
      )}
    </div>
  );
}

// ── Documents ────────────────────────────────────────────────────────────────
const dlFile = async (endpoint, originalName) => {
  try {
    const r = await api.get(endpoint, { responseType: 'blob' });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement('a');
    a.href = url; a.download = originalName || 'document'; a.click();
    URL.revokeObjectURL(url);
  } catch { alert('Download failed'); }
};

// mode: 'mine' (self-only — no upload/delete/ack-tracking, everyone including admins) |
//       'manage' (HR Admin only — all employees' assigned docs + full company-doc management)
function DocumentsView({ user, mode = 'mine' }) {
  const [docTab, setDocTab]   = useState('company');
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [ackDoc, setAckDoc]   = useState(null); // doc for "who has read" modal
  const [acks, setAcks]       = useState([]);
  const canManage = mode === 'manage' && isHRAdmin(user);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/hr/documents'); setDocs(r.data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const acknowledge = async (id) => { await api.post(`/hr/documents/${id}/acknowledge`); load(); };
  const del = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    await api.delete(`/hr/documents/${id}`); load();
  };
  const openAcks = async (doc) => {
    setAckDoc(doc);
    const r = await api.get(`/hr/documents/${doc.id}/acknowledgements`);
    setAcks(r.data);
  };

  const companyDocs  = docs.filter(d => d.doc_category === 'company');
  const employeeDocs = docs.filter(d => d.doc_category === 'employee' && (canManage || d.assigned_to === user.id));
  const visible = docTab === 'company' ? companyDocs : employeeDocs;

  const tabBtn = (key, label, count) => (
    <button key={key} onClick={() => setDocTab(key)} style={{
      height:34, padding:'0 16px', borderRadius:8, fontSize:13, fontWeight:600, border:'none', cursor:'pointer',
      background: docTab === key ? ACCENT : '#F2F2F5', color: docTab === key ? '#fff' : '#5A5A66',
    }}>{label} <span style={{ opacity:.65 }}>{count}</span></button>
  );

  const DocCard = ({ d }) => (
    <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:12, padding:'16px 18px', marginBottom:10, boxShadow:'0 1px 3px rgba(16,16,30,.05)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        <HRIcon name="doc" size={22} color={ACCENT} />
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
            <div style={{ fontSize:14, fontWeight:700 }}>{d.title}</div>
            <span style={{ fontSize:10.5, color:'#9A9AA4', background:'#F0F0F3', padding:'1px 7px', borderRadius:5 }}>v{d.version}</span>
            {d.is_mandatory && <Badge label="Mandatory" color="#DC2626" bg="#FEF2F2" />}
          </div>
          {d.description && <div style={{ fontSize:12.5, color:'#7E7E88', marginBottom:6 }}>{d.description}</div>}
          <div style={{ fontSize:11.5, color:'#B0B0BC', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span>Added by {d.created_by_name} · {fmtDate(d.created_at)}</span>
            {d.doc_category === 'company' && canManage && (
              <button onClick={() => openAcks(d)}
                style={{ background:'none', border:'none', cursor:'pointer', color:ACCENT, fontSize:11.5, fontWeight:600, padding:0 }}>
                {d.ack_count} acknowledged ↗
              </button>
            )}
            {d.doc_category === 'company' && !canManage && (
              <span>{d.ack_count} acknowledged</span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {d.file_name && (
            <button onClick={() => dlFile(`/hr/documents/file/${d.file_path}`, d.file_name)}
              style={{ display:'flex', alignItems:'center', gap:4, height:32, padding:'0 12px', borderRadius:8, background:'#EFF4FF', color:'#2563EB', fontSize:12, fontWeight:600, border:'1px solid #BFDBFE', cursor:'pointer' }}>
              <HRIcon name="download" size={13} />Download
            </button>
          )}
          {d.doc_category === 'company' && (
            d.acknowledged ? (
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#16A34A', fontWeight:600 }}>
                <HRIcon name="check" size={14} color="#16A34A" />Read
              </span>
            ) : (
              <button onClick={() => acknowledge(d.id)}
                style={{ height:32, padding:'0 12px', borderRadius:8, background:'#ECFDF3', color:'#16A34A', fontSize:12.5, fontWeight:700, border:'1px solid #86EFAC', cursor:'pointer' }}>
                Acknowledge
              </button>
            )
          )}
          {canManage && (
            <button onClick={() => del(d.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', padding:4 }}>
              <HRIcon name="trash" size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', flex:1 }}>{canManage ? 'Manage Documents' : 'My Documents'}</h2>
        {canManage && (
          <button onClick={() => setShowNew(true)}
            style={{ display:'flex', alignItems:'center', gap:6, height:36, padding:'0 16px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }}>
            <HRIcon name="plus" size={15} />Upload Document
          </button>
        )}
      </div>

      {/* Section tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {tabBtn('company', 'Company Docs', companyDocs.length)}
        {tabBtn('employee', canManage ? 'Employee Docs' : 'My Documents', employeeDocs.length)}
      </div>

      {docTab === 'company' && (
        <div style={{ fontSize:12.5, color:'#9A9AA4', marginBottom:14 }}>
          Policies, memos, announcements — visible to all employees. Click "Acknowledge" after reading.
        </div>
      )}
      {docTab === 'employee' && (
        <div style={{ fontSize:12.5, color:'#9A9AA4', marginBottom:14 }}>
          {canManage
            ? 'Personal documents (appraisal letters, joining letters, etc.) assigned to specific employees.'
            : 'Personal documents (appraisal letters, joining letters, etc.) assigned to you.'}
        </div>
      )}

      {loading ? <div style={{ color:'#9A9AA4', padding:24 }}>Loading…</div>
       : visible.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:48, textAlign:'center', color:'#9A9AA4' }}>
          <HRIcon name="doc" size={36} color="#D1D1D8" />
          <div style={{ marginTop:12, fontWeight:600 }}>No {docTab === 'company' ? 'company' : 'employee'} documents yet</div>
          {canManage && <div style={{ marginTop:6, fontSize:13 }}>Use "Upload Document" to add one.</div>}
        </div>
      ) : (docTab === 'employee' && canManage) ? (
        <GroupedByEmployee
          items={visible}
          getEmployeeId={d => d.assigned_to}
          getEmployeeName={d => d.assigned_to_name}
          getEmployeeColor={d => d.assigned_to_color}
          Avatar={Avatar}
          renderItem={d => <DocCard key={d.id} d={d} />}
        />
      ) : visible.map(d => <DocCard key={d.id} d={d} />)}

      {showNew && <UploadDocModal onClose={() => setShowNew(false)} onSaved={load} />}

      {/* Who Has Read modal */}
      {ackDoc && (
        <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div onClick={() => setAckDoc(null)} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,.34)' }} />
          <div style={{ position:'relative', width:480, maxHeight:'80vh', background:'#fff', borderRadius:16, boxShadow:'0 24px 60px rgba(20,20,30,.24)', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #EEEEF1' }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700 }}>Who Has Read</div>
                <div style={{ fontSize:12.5, color:'#7E7E88' }}>{ackDoc.title}</div>
              </div>
              <button onClick={() => setAckDoc(null)} style={{ color:'#8A8A94', background:'none', border:'none', cursor:'pointer' }}><HRIcon name="x" size={18} /></button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'12px 22px' }}>
              {acks.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid #F6F6F9' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:a.color||ACCENT, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700, flexShrink:0 }}>
                    {(a.name||'?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{a.name}</div>
                    {a.acknowledged_at && <div style={{ fontSize:11.5, color:'#9A9AA4' }}>{fmtDate(a.acknowledged_at)}</div>}
                  </div>
                  {a.acknowledged_at ? (
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#16A34A', fontWeight:600 }}>
                      <HRIcon name="check" size={13} color="#16A34A" />Read
                    </span>
                  ) : (
                    <span style={{ fontSize:12, color:'#9A9AA4' }}>Not read</span>
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding:'12px 22px', borderTop:'1px solid #EEEEF1', fontSize:12, color:'#9A9AA4' }}>
              {acks.filter(a => a.acknowledged_at).length} of {acks.length} employees have read this document.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadDocModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ title:'', description:'', version:'1.0', is_mandatory:false, doc_category:'company', assigned_to:'' });
  const [file, setFile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get('/hr/employees').then(r => setEmployees(r.data)).catch(() => {});
  }, []);

  const save = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!file) { setError('Please select a file to upload'); return; }
    if (form.doc_category === 'employee' && !form.assigned_to) { setError('Please select an employee for this document'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('version', form.version);
      fd.append('is_mandatory', form.is_mandatory);
      fd.append('doc_category', form.doc_category);
      if (form.doc_category === 'employee' && form.assigned_to) fd.append('assigned_to', form.assigned_to);
      fd.append('file', file);
      await api.post('/hr/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Upload failed'); }
    finally { setSaving(false); }
  };

  const inp = { width:'100%', height:38, padding:'0 10px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#FAFAFB', outline:'none', boxSizing:'border-box' };
  const lbl = { display:'block', fontSize:11.5, fontWeight:700, color:'#6B6B76', marginBottom:5 };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,.34)' }} />
      <div style={{ position:'relative', width:540, background:'#fff', borderRadius:16, boxShadow:'0 24px 60px rgba(20,20,30,.24)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ fontSize:16, fontWeight:700 }}>Upload Document</div>
          <button onClick={onClose} style={{ color:'#8A8A94', background:'none', border:'none', cursor:'pointer' }}><HRIcon name="x" size={18} /></button>
        </div>
        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Section selector */}
          <div>
            <label style={lbl}>Section *</label>
            <div style={{ display:'flex', gap:8 }}>
              {[['company','Company Doc'],['employee','Employee Doc']].map(([v,l]) => (
                <button key={v} onClick={() => set('doc_category', v)}
                  style={{ flex:1, height:38, borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
                    background: form.doc_category === v ? ACCENT : '#F2F2F5',
                    color: form.doc_category === v ? '#fff' : '#5A5A66', border:'none' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {form.doc_category === 'employee' && (
            <div>
              <label style={lbl}>Assign To *</label>
              <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                <option value="">— Select Employee —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          )}

          <div><label style={lbl}>Title *</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Leave Policy 2025" style={inp} /></div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 90px', gap:10 }}>
            <div><label style={lbl}>Description</label><input value={form.description} onChange={e => set('description', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Version</label><input value={form.version} onChange={e => set('version', e.target.value)} style={inp} /></div>
          </div>

          {form.doc_category === 'company' && (
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:500 }}>
              <input type="checkbox" checked={form.is_mandatory} onChange={e => set('is_mandatory', e.target.checked)} />
              Mark as mandatory — employees must acknowledge
            </label>
          )}

          <div>
            <label style={lbl}>File * (.pdf, .doc, .docx)</label>
            <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0] || null)}
              style={{ ...inp, height:'auto', padding:'7px 10px', cursor:'pointer' }} />
            {file && <div style={{ fontSize:12, color:'#16A34A', marginTop:4 }}>✓ {file.name} ({(file.size/1024).toFixed(0)} KB)</div>}
          </div>

          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'8px 12px', color:'#DC2626', fontSize:13 }}>{error}</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'14px 22px', borderTop:'1px solid #EEEEF1' }}>
          <button onClick={onClose} style={{ height:38, padding:'0 16px', borderRadius:9, background:'#F2F2F5', color:'#5A5A66', fontSize:13.5, fontWeight:600, border:'none', cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ height:38, padding:'0 20px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:700, border:'none', cursor:'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payroll ───────────────────────────────────────────────────────────────────
// mode: 'mine' (self-only — everyone, no selector/upload) | 'admin' (HR Admin only — pick any employee, upload)
function PayrollView({ user, mode = 'mine' }) {
  const canManage = mode === 'admin' && isHRAdmin(user);
  const [employees, setEmployees] = useState([]);
  const [targetUser, setTargetUser] = useState(canManage ? '' : user.id);
  const [year, setYear]   = useState(new Date().getFullYear());
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (canManage) {
      api.get('/hr/employees').then(r => {
        setEmployees(r.data);
        // Default to another employee, not the admin's own record — this page is explicitly "someone else's payroll".
        setTargetUser(prev => prev || r.data.find(e => e.id !== user.id)?.id || r.data[0]?.id || '');
      }).catch(() => {});
    }
  }, [canManage, user.id]);

  const load = useCallback(async () => {
    if (!targetUser) return;
    setLoading(true);
    try {
      const r = await api.get(`/hr/payroll/slips?userId=${targetUser}&year=${year}`);
      setSlips(r.data);
    } finally { setLoading(false); }
  }, [targetUser, year]);

  useEffect(() => { load(); }, [load]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const targetName = canManage ? (employees.find(e => e.id === targetUser)?.name || 'Employee') : user.name;

  const delSlip = async (id) => {
    if (!window.confirm('Delete this salary slip?')) return;
    await api.delete(`/hr/payroll/slips/${id}`);
    load();
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', flex:1 }}>{canManage ? 'Payroll (Admin)' : 'My Payroll'}</h2>
        {canManage && (
          <button onClick={() => setShowUpload(true)}
            style={{ display:'flex', alignItems:'center', gap:6, height:36, padding:'0 16px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }}>
            <HRIcon name="plus" size={15} />Upload Slip
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {canManage && (
          <select value={targetUser} onChange={e => setTargetUser(e.target.value)}
            style={{ height:36, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#FAFAFB', outline:'none', minWidth:160 }}>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <select value={year} onChange={e => setYear(parseInt(e.target.value))}
          style={{ height:36, padding:'0 12px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#FAFAFB', outline:'none' }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? <div style={{ color:'#9A9AA4', padding:24 }}>Loading…</div>
       : slips.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:48, textAlign:'center', color:'#9A9AA4' }}>
          <HRIcon name="briefcase" size={36} color="#D1D1D8" />
          <div style={{ marginTop:12, fontWeight:600 }}>No salary slips for {year}</div>
          {canManage && <div style={{ marginTop:6, fontSize:13 }}>Use "Upload Slip" to add a PDF salary slip for {targetName}.</div>}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {slips.map(s => (
            <div key={s.id}
              style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 3px rgba(16,16,30,.05)' }}>
              <HRIcon name="doc" size={20} color={ACCENT} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{fmtMonth(s.month)}</div>
                <div style={{ fontSize:12, color:'#7E7E88' }}>
                  Uploaded {fmtDate(s.generated_at)} by {s.generated_by_name}
                  {canManage && s.employee_name && ` · ${s.employee_name}`}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {s.file_path ? (
                  <button onClick={() => dlFile(`/hr/payroll/file/${s.file_path}`, s.file_name)}
                    style={{ display:'flex', alignItems:'center', gap:4, height:32, padding:'0 14px', borderRadius:8, background:'#EFF4FF', color:'#2563EB', fontSize:12.5, fontWeight:700, border:'1px solid #BFDBFE', cursor:'pointer' }}>
                    <HRIcon name="download" size={13} />Download PDF
                  </button>
                ) : (
                  <span style={{ fontSize:12, color:'#9A9AA4' }}>No file</span>
                )}
                {canManage && (
                  <button onClick={() => delSlip(s.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', padding:4 }}>
                    <HRIcon name="trash" size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && <UploadSlipModal employees={employees} onClose={() => setShowUpload(false)} onSaved={load} />}
    </div>
  );
}

function UploadSlipModal({ employees, onClose, onSaved }) {
  const [form, setForm] = useState({ user_id:'', month: new Date().toISOString().slice(0,7) });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.user_id) { setError('Please select an employee'); return; }
    if (!form.month)   { setError('Please select a month'); return; }
    if (!file)         { setError('Please select a PDF file'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('user_id', form.user_id);
      fd.append('month', form.month);
      fd.append('file', file);
      await api.post('/hr/payroll/slips', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || 'Upload failed'); }
    finally { setSaving(false); }
  };

  const inp = { width:'100%', height:38, padding:'0 10px', border:'1px solid #E5E5EA', borderRadius:8, fontSize:13, background:'#FAFAFB', outline:'none', boxSizing:'border-box' };
  const lbl = { display:'block', fontSize:11.5, fontWeight:700, color:'#6B6B76', marginBottom:5 };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,20,30,.34)' }} />
      <div style={{ position:'relative', width:460, background:'#fff', borderRadius:16, boxShadow:'0 24px 60px rgba(20,20,30,.24)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #EEEEF1' }}>
          <div style={{ fontSize:16, fontWeight:700 }}>Upload Salary Slip</div>
          <button onClick={onClose} style={{ color:'#8A8A94', background:'none', border:'none', cursor:'pointer' }}><HRIcon name="x" size={18} /></button>
        </div>
        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={lbl}>Employee *</label>
            <select value={form.user_id} onChange={e => set('user_id', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              <option value="">— Select Employee —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Month *</label>
            <input type="month" value={form.month} onChange={e => set('month', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Salary Slip PDF *</label>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0] || null)}
              style={{ ...inp, height:'auto', padding:'7px 10px', cursor:'pointer' }} />
            {file && <div style={{ fontSize:12, color:'#16A34A', marginTop:4 }}>✓ {file.name} ({(file.size/1024).toFixed(0)} KB)</div>}
          </div>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'8px 12px', color:'#DC2626', fontSize:13 }}>{error}</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'14px 22px', borderTop:'1px solid #EEEEF1' }}>
          <button onClick={onClose} style={{ height:38, padding:'0 16px', borderRadius:9, background:'#F2F2F5', color:'#5A5A66', fontSize:13.5, fontWeight:600, border:'none', cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ height:38, padding:'0 20px', borderRadius:9, background:ACCENT, color:'#fff', fontSize:13.5, fontWeight:700, border:'none', cursor:'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Uploading…' : 'Upload Slip'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main HRModule export ─────────────────────────────────────────────────────
export default function HRModule({ view, user }) {
  const views = {
    'hr-employees':  <EmployeeDirectory user={user} />,
    'hr-leaves':     <MyLeavesView user={user} />,
    'hr-approvals':  <LeaveApprovalsView user={user} />,
    'hr-leave-calendar':    <LeaveCalendarView user={user} />,
    'hr-documents':         <DocumentsView user={user} mode="mine" />,
    'hr-manage-documents':  <DocumentsView user={user} mode="manage" />,
    'hr-payroll':           <PayrollView user={user} mode="mine" />,
    'hr-payroll-admin':     <PayrollView user={user} mode="admin" />,
  };
  return views[view] || null;
}
