import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, type AdminUser, type AdminGroup } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Admin() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

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
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">Create users, assign groups, manage access.</p>
        </div>
        <div className="title-meta">
          <span className="tag"><span className="tag-dot" /> IAM Model</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, padding: '0 20px 20px' }}>
        <UsersPanel />
        <GroupsPanel />
      </div>
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
    mutationFn: ({ userId, groupIds }: { userId: string; groupIds: string[] }) =>
      api.setUserGroups(userId, groupIds),
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
            onSetGroups={(groupIds) => groupMutation.mutate({ userId: u.id, groupIds })}
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
  onSetGroups: (ids: string[]) => void;
  onToggleActive: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  function openAssign() {
    const currentIds = groups.filter(g => user.groups.includes(g.name)).map(g => g.id);
    setSelected(currentIds);
    onAssignToggle();
  }

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
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
          <div style={{ fontSize: 12, fontWeight: 700, color: '#697a82', marginBottom: 8 }}>Assign groups:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {groups.map(g => (
              <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12 }}>
                <input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggle(g.id)} />
                {g.name}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="sn-btn" style={{ fontSize: 11 }} onClick={onAssignToggle}>Cancel</button>
            <button className="sn-btn sn-btn-primary" style={{ fontSize: 11 }} onClick={() => onSetGroups(selected)}>Save</button>
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
