import React, { useMemo, useState } from 'react';

// Generic "club items by employee" list: buckets `items` by an employee id,
// renders a collapsible section per employee (avatar + name + count), and
// defers item rendering to the caller via `renderItem` so it can be reused
// across differently-shaped lists (leave history, docs, tasks, ...).
export default function GroupedByEmployee({
  items,
  getEmployeeId,
  getEmployeeName,
  getEmployeeColor,
  renderItem,
  renderGroupBody,
  renderGroupHeaderExtra,
  Avatar,
  collapseThreshold = 5,
  emptyMessage = 'Nothing to show.',
}) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const id = getEmployeeId(item) || '__unassigned';
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: getEmployeeName(item) || 'Unassigned',
          color: getEmployeeColor ? getEmployeeColor(item) : undefined,
          items: [],
        });
      }
      map.get(id).items.push(item);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [items, getEmployeeId, getEmployeeName, getEmployeeColor]);

  const defaultCollapsed = groups.length > collapseThreshold;
  const [openOverride, setOpenOverride] = useState({});
  const toggle = (id) => setOpenOverride(o => ({ ...o, [id]: !(id in o ? o[id] : !defaultCollapsed) }));

  if (items.length === 0) {
    return (
      <div style={{ background:'#fff', border:'1px solid #ECECEF', borderRadius:14, padding:48, textAlign:'center', color:'#9A9AA4', fontSize:14 }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div>
      {groups.map(g => {
        const isOpen = g.id in openOverride ? openOverride[g.id] : !defaultCollapsed;
        return (
          <div key={g.id} style={{ marginBottom:14 }}>
            <button onClick={() => toggle(g.id)} style={{
              display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 4px',
              background:'none', border:'none', cursor:'pointer', textAlign:'left',
            }}>
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:16, height:16, color:'#9A9AA4', flexShrink:0, transform: isOpen ? 'rotate(90deg)' : 'none', transition:'transform .12s' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              {Avatar && <Avatar name={g.name} color={g.color} size={24} />}
              <span style={{ fontSize:13.5, fontWeight:700, color:'#2A2A32' }}>{g.name}</span>
              <span style={{ fontSize:12, fontWeight:600, color:'#9A9AA4' }}>{g.items.length}</span>
              {renderGroupHeaderExtra && <span style={{ marginLeft:'auto' }}>{renderGroupHeaderExtra(g.items)}</span>}
            </button>
            {isOpen && <div style={{ marginLeft:2 }}>{renderGroupBody ? renderGroupBody(g.items) : g.items.map(renderItem)}</div>}
          </div>
        );
      })}
    </div>
  );
}
