import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api, type AdminUser, type AdminGroup, type AuditLog } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Admin() {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState<'users' | 'audit'>('users');

  if (!hasPermission('admin:users') && !hasPermission('*')) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#697a82' }}>
        Access denied — admin permissions required.
      </div>
    );
  }

  return (
    <div>
      <div className="crumb-row">
        <div className="breadcrumb"><span>MI OS</span><span>/</span><strong>Admin</strong></div>
      </div>
      <div className="page-titlebar">
        <div>
          <div className="title-kicker">System</div>
          <h1 className="page-title">Administration</h1>
          <p className="page-sub">Manage users, groups, and audit activity.</p>
        </div>
        <div className="title-meta">
          <span className="tag"><span className="tag-dot" /> IAM Model</span>
        </div>
      </div>
      <div style={{ padding: '0 20px', marginBottom: 16, display: 'flex', gap: 0, borderBottom: '2px solid #e8edf0' }}>
        {(['users', 'audit'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            color: tab === t ? 'var(--sn-accent)' : '#697a82',
            borderBottom: tab === t ? '2px solid var(--sn-accent)' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t === 'users' ? 'Users & Groups' : 'Audit Log'}
          </button>
        ))}
      </div>
      {tab === 'users' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, padding: '0 20px 20px' }}>
          <UsersPanel />
          <GroupsPanel />
        </div>
      ) : (
        <div style={{ padding: '0 20px 20px' }}>
          <AuditPanel />
        </div>
      )}
    </div>
  );
}

// ─── Users panel ─────────────────────────────────────────────────────────────
function UsersPanel() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [createError, setCreateError] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: api.listUsers,
  });

  const { data: groupsData } = useQuery({
    queryKey: ['admin-groups'],
    queryFn: api.listGroups,
  });

  const users   = usersData?.users ?? [];
  const groups  = groupsData?.groups ?? [];

  const createMutation = useMutation({
    mutationFn: () => api.createUser({ username: newUsername, password: newPassword, email: newEmail || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setCreating(false);
      setNewUsername(''); setNewPassword(''); setNewEmail(''); setCreateError('');
    },
    onError: (err: Error) => setCreateError(err.message),
  });

  const activeMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      api.setUserActive(userId, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const groupMutation = useMutation({
    mutationFn: ({ userId, groupIds, groupRoles }: { userId: string; groupIds: string[]; groupRoles?: Record<string, 'member' | 'manager'> }) =>
      api.setUserGroups(userId, groupIds, groupRoles),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setAssigningId(null);
    },
  });

  return (
    <div className="sn-card" style={{ padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #e8edf0' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#1a2f38' }}>Users ({users.length})</div>
        <button className="sn-btn sn-btn-primary" style={{ padding: '5px 12px', fontSize: 12 }}
          onClick={() => setCreating(c => !c)}>
          {creating ? 'Cancel' : '+ New user'}
        </button>
      </div>

      {creating && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8edf0', background: '#f9fbfc' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2f38', marginBottom: 10 }}>Create user</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input className="sn-input" placeholder="Username *" value={newUsername}
              onChange={e => setNewUsername(e.target.value)} />
            <input className="sn-input" type="password" placeholder="Password *" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} />
          </div>
          <input className="sn-input" placeholder="Email (optional)" value={newEmail} style={{ width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
            onChange={e => setNewEmail(e.target.value)} />
          {createError && <div style={{ color: '#b42318', fontSize: 12, marginBottom: 6 }}>{createError}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="sn-btn" onClick={() => { setCreating(false); setCreateError(''); }}>Cancel</button>
            <button className="sn-btn sn-btn-primary"
              disabled={!newUsername || !newPassword || createMutation.isPending}
              onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div>
        {usersLoading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#697a82', fontSize: 13 }}>Loading...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#697a82', fontSize: 13 }}>No users yet</div>
        ) : users.map(u => (
          <UserRow
            key={u.id}
            user={u}
            groups={groups}
            isAssigning={assigningId === u.id}
            onAssignToggle={() => setAssigningId(id => id === u.id ? null : u.id)}
            onSetGroups={(groupIds, groupRoles) => groupMutation.mutate({ userId: u.id, groupIds, groupRoles })}
            onToggleActive={() => activeMutation.mutate({ userId: u.id, isActive: !u.isActive })}
          />
        ))}
      </div>
    </div>
  );
}

function UserRow({
  user,
  groups,
  isAssigning,
  onAssignToggle,
  onSetGroups,
  onToggleActive,
}: {
  user: AdminUser;
  groups: AdminGroup[];
  isAssigning: boolean;
  onAssignToggle: () => void;
  onSetGroups: (ids: string[], roles: Record<string, 'member' | 'manager'>) => void;
  onToggleActive: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [roles, setRoles]       = useState<Record<string, 'member' | 'manager'>>({});

  function openAssign() {
    const currentIds = groups.filter(g => user.groups.includes(g.name)).map(g => g.id);
    const currentRoles: Record<string, 'member' | 'manager'> = {};
    groups.forEach(g => {
      if (currentIds.includes(g.id)) {
        const membership = (user as any).groupMemberships?.find((m: any) => m.group === g.name);
        currentRoles[g.id] = membership?.role ?? 'member';
      }
    });
    setSelected(currentIds);
    setRoles(currentRoles);
    onAssignToggle();
  }

  function toggle(id: string) {
    setSelected(s => {
      if (s.includes(id)) { return s.filter(x => x !== id); }
      setRoles(r => ({ ...r, [id]: r[id] ?? 'member' }));
      return [...s, id];
    });
  }

  function setRole(id: string, role: 'member' | 'manager') {
    setRoles(r => ({ ...r, [id]: role }));
  }

  return (
    <div style={{ borderBottom: '1px solid #f0f3f5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: user.isActive ? '#e8f4ea' : '#f0f3f5',
          color: user.isActive ? '#1f6f35' : '#9badb5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, flexShrink: 0,
        }}>
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: user.isActive ? '#1a2f38' : '#9badb5' }}>
            {user.username}
            {!user.isActive && <span style={{ marginLeft: 6, fontSize: 10, color: '#9badb5', fontWeight: 600 }}>INACTIVE</span>}
          </div>
          <div style={{ fontSize: 11, color: '#697a82', marginTop: 1 }}>
            {user.groups.length ? user.groups.join(', ') : <em>No groups</em>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="sn-btn" style={{ padding: '3px 10px', fontSize: 11 }} onClick={openAssign}>
            Groups
          </button>
          <button className="sn-btn" style={{ padding: '3px 10px', fontSize: 11, color: user.isActive ? '#b42318' : '#1f6f35' }}
            onClick={onToggleActive}>
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
      {isAssigning && (
        <div style={{ padding: '8px 18px 14px 60px', background: '#f9fbfc', borderTop: '1px solid #e8edf0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#697a82', marginBottom: 10 }}>Assign groups + role:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {groups.map(g => {
              const checked = selected.includes(g.id);
              const role    = roles[g.id] ?? 'member';
              return (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, minWidth: 160 }}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(g.id)} />
                    <span style={{ fontWeight: checked ? 700 : 400, color: checked ? '#1a2f38' : '#697a82' }}>{g.name}</span>
                  </label>
                  {checked && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      {(['member', 'manager'] as const).map(r => (
                        <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11 }}>
                          <input type="radio" name={`role-${g.id}`} checked={role === r} onChange={() => setRole(g.id, r)} />
                          <span style={{ color: r === 'manager' ? '#1f6f35' : '#1a56a4', fontWeight: 700 }}>{r}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="sn-btn" style={{ fontSize: 11 }} onClick={onAssignToggle}>Cancel</button>
            <button className="sn-btn sn-btn-primary" style={{ fontSize: 11 }} onClick={() => onSetGroups(selected, roles)}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Groups panel ─────────────────────────────────────────────────────────────
function GroupsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-groups'],
    queryFn: api.listGroups,
  });

  const groups = data?.groups ?? [];

  return (
    <div className="sn-card" style={{ padding: 0, alignSelf: 'start' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8edf0' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#1a2f38' }}>Groups & Permissions</div>
        <div style={{ fontSize: 11, color: '#697a82', marginTop: 2 }}>Assign users to groups on the left</div>
      </div>
      {isLoading ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#697a82', fontSize: 13 }}>Loading...</div>
      ) : groups.map(g => (
        <div key={g.id} style={{ padding: '12px 18px', borderBottom: '1px solid #f0f3f5' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1a2f38', marginBottom: 4 }}>{g.name}</div>
          {g.description && (
            <div style={{ fontSize: 11, color: '#697a82', marginBottom: 6 }}>{g.description}</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {g.permissions.map(p => (
              <span key={p.name} style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                background: p.name === '*' ? '#fff0e0' : '#f0f4ff',
                color: p.name === '*' ? '#7a3800' : '#1a4fa0',
                fontFamily: 'monospace',
              }}>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Audit Log panel ──────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

function AuditPanel() {
  const [offset, setOffset] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [inputAction, setInputAction] = useState('');
  const [inputUser, setInputUser] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit', offset, filterAction, filterUser],
    queryFn: () => api.getAuditLogs({
      limit: PAGE_SIZE, offset,
      action: filterAction || undefined,
      username: filterUser || undefined,
    }),
  });

  const logs = data?.logs ?? [];

  function applyFilters() {
    setFilterAction(inputAction);
    setFilterUser(inputUser);
    setOffset(0);
  }
  function clearFilters() {
    setInputAction(''); setInputUser('');
    setFilterAction(''); setFilterUser('');
    setOffset(0);
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString();
  }
  function fmtMeta(raw: string | null) {
    if (!raw) return '—';
    try { return JSON.stringify(JSON.parse(raw), null, 0); } catch { return raw; }
  }

  return (
    <div className="sn-card" style={{ padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: '1px solid #e8edf0', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#1a2f38', marginRight: 'auto' }}>Audit Log</div>
        <input className="sn-input" placeholder="Filter action..." value={inputAction}
          style={{ width: 160 }} onChange={e => setInputAction(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyFilters()} />
        <input className="sn-input" placeholder="Filter user..." value={inputUser}
          style={{ width: 130 }} onChange={e => setInputUser(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyFilters()} />
        <button className="sn-btn sn-btn-primary" style={{ fontSize: 12 }} onClick={applyFilters}>Filter</button>
        {(filterAction || filterUser) && (
          <button className="sn-btn" style={{ fontSize: 12 }} onClick={clearFilters}>Clear</button>
        )}
      </div>

      {isLoading ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#697a82', fontSize: 13 }}>Loading...</div>
      ) : logs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#697a82', fontSize: 13 }}>No audit entries found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e8edf0', background: '#f5f7f8' }}>
                {['Time', 'User', 'Action', 'Entity', 'Details'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#697a82', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log: AuditLog) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f0f3f5' }}>
                  <td style={{ padding: '8px 14px', color: '#697a82', whiteSpace: 'nowrap' }}>{fmtDate(log.createdAt)}</td>
                  <td style={{ padding: '8px 14px', fontWeight: 700, color: '#1a2f38' }}>{log.username}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#f0f4ff', color: '#1a4fa0', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '8px 14px', color: '#697a82', fontSize: 11 }}>
                    {log.entityType ? `${log.entityType}${log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ''}` : '—'}
                  </td>
                  <td style={{ padding: '8px 14px', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#697a82', fontSize: 11, fontFamily: 'monospace' }}
                    title={fmtMeta(log.metadata)}>
                    {fmtMeta(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, padding: '10px 18px', borderTop: '1px solid #e8edf0', justifyContent: 'flex-end' }}>
        <button className="sn-btn" style={{ fontSize: 12 }} disabled={offset === 0}
          onClick={() => setOffset(o => Math.max(0, o - PAGE_SIZE))}>
          ← Prev
        </button>
        <span style={{ fontSize: 12, color: '#697a82', alignSelf: 'center' }}>
          {offset + 1}–{offset + logs.length}
        </span>
        <button className="sn-btn" style={{ fontSize: 12 }} disabled={logs.length < PAGE_SIZE}
          onClick={() => setOffset(o => o + PAGE_SIZE)}>
          Next →
        </button>
      </div>
    </div>
  );
}
