import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api, type TeamMember } from '../lib/api';
import { useAuth } from '../lib/auth';

const ROLE_COLOR = { manager: '#1f6f35', member: '#1a56a4' };
const ROLE_BG    = { manager: '#f0faf3', member: '#eff6ff' };

export default function TeamManagement() {
  const { isManagerInGroup, myGroups } = useAuth();
  const qc = useQueryClient();

  const isMgr = myGroups.some(g => isManagerInGroup(g));
  if (!isMgr) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#697a82' }}>
      Access denied — group managers only.
    </div>;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: api.getTeam,
  });

  const managedGroups = data?.managedGroups ?? [];
  const members       = data?.members ?? [];

  const [activeGroup, setActiveGroup] = useState<string>('');
  const currentGroup = activeGroup || (managedGroups[0] ?? '');
  const groupMembers = members.filter(m => m.groupName === currentGroup);

  return (
    <>
      <div className="crumb-row">
        <div className="breadcrumb"><span>MI OS</span><span>/</span><strong>My Team</strong></div>
      </div>
      <div className="page-titlebar">
        <div>
          <div className="title-kicker">Manager</div>
          <h1 className="page-title">Team Management</h1>
          <p className="page-sub">Manage members of groups you lead. Add users, change roles, remove access.</p>
        </div>
        <div className="title-meta">
          {managedGroups.map(g => (
            <span key={g} className="tag"><span className="tag-dot" style={{ background: '#1f6f35' }} />{g}</span>
          ))}
        </div>
      </div>

      {/* Group tabs if managing multiple groups */}
      {managedGroups.length > 1 && (
        <div style={{ padding: '0 20px', marginBottom: 16, display: 'flex', gap: 0, borderBottom: '2px solid #e8edf0' }}>
          {managedGroups.map(g => (
            <button key={g} onClick={() => setActiveGroup(g)} style={{
              background: 'none', border: 'none', padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              color: currentGroup === g ? 'var(--sn-accent)' : '#697a82',
              borderBottom: currentGroup === g ? '2px solid var(--sn-accent)' : '2px solid transparent',
              marginBottom: -2,
            }}>{g}</button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#697a82', fontSize: 13 }}>Loading...</div>
      ) : (
        <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          <MemberTable
            groupName={currentGroup}
            members={groupMembers}
            onRefresh={() => qc.invalidateQueries({ queryKey: ['team'] })}
          />
          <AddMemberPanel
            groupName={currentGroup}
            onRefresh={() => qc.invalidateQueries({ queryKey: ['team'] })}
          />
        </div>
      )}
    </>
  );
}

function MemberTable({ groupName, members, onRefresh }: {
  groupName: string;
  members: TeamMember[];
  onRefresh: () => void;
}) {
  const { user } = useAuth();

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'member' | 'manager' }) =>
      api.setTeamRole(groupName, userId, role),
    onSuccess: onRefresh,
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.removeTeamMember(groupName, userId),
    onSuccess: onRefresh,
  });

  return (
    <div className="sn-card" style={{ padding: 0 }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8edf0', fontWeight: 800, fontSize: 14, color: '#1a2f38' }}>
        {groupName} <span style={{ fontWeight: 400, color: '#697a82', fontSize: 12 }}>· {members.length} member{members.length !== 1 ? 's' : ''}</span>
      </div>
      {members.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#697a82', fontSize: 13 }}>No members yet.</div>
      ) : members.map(m => (
        <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid #f0f3f5' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: m.isActive ? ROLE_BG[m.groupRole] : '#f0f3f5',
            color: m.isActive ? ROLE_COLOR[m.groupRole] : '#9badb5',
            fontSize: 12, fontWeight: 800,
          }}>
            {m.username.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1a2f38' }}>{m.username}</div>
            {m.email && <div style={{ fontSize: 11, color: '#9badb5' }}>{m.email}</div>}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            background: ROLE_BG[m.groupRole], color: ROLE_COLOR[m.groupRole],
          }}>{m.groupRole}</span>
          {m.userId !== user?.userId && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="sn-btn" style={{ fontSize: 11, padding: '3px 10px' }}
                disabled={roleMutation.isPending}
                onClick={() => roleMutation.mutate({ userId: m.userId, role: m.groupRole === 'manager' ? 'member' : 'manager' })}>
                {m.groupRole === 'manager' ? 'Demote' : 'Promote'}
              </button>
              <button className="sn-btn" style={{ fontSize: 11, padding: '3px 10px', color: '#b42318', borderColor: '#b42318' }}
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(m.userId)}>
                Remove
              </button>
            </div>
          )}
          {m.userId === user?.userId && (
            <span style={{ fontSize: 11, color: '#9badb5' }}>you</span>
          )}
        </div>
      ))}
    </div>
  );
}

function AddMemberPanel({ groupName, onRefresh }: { groupName: string; onRefresh: () => void }) {
  const [selectedId, setSelectedId]   = useState('');
  const [role, setRole]               = useState<'member' | 'manager'>('member');

  const { data } = useQuery({
    queryKey: ['team-candidates', groupName],
    queryFn: () => api.getTeamCandidates(groupName),
    enabled: !!groupName,
  });

  const candidates = data?.candidates ?? [];

  const addMutation = useMutation({
    mutationFn: () => api.addTeamMember(groupName, selectedId, role),
    onSuccess: () => { onRefresh(); setSelectedId(''); setRole('member'); },
  });

  return (
    <div className="sn-card" style={{ padding: 0, alignSelf: 'start' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8edf0', fontWeight: 800, fontSize: 14, color: '#1a2f38' }}>
        Add Member
      </div>
      <div style={{ padding: '14px 18px' }}>
        <div style={{ fontSize: 12, color: '#697a82', marginBottom: 10 }}>
          Add any existing platform user to <strong>{groupName}</strong>.
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#697a82', display: 'block', marginBottom: 4 }}>User</label>
          <select className="sn-input" style={{ width: '100%' }}
            value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">— select user —</option>
            {candidates.map(c => (
              <option key={c.id} value={c.id}>{c.username}{c.email ? ` (${c.email})` : ''}</option>
            ))}
          </select>
          {candidates.length === 0 && (
            <div style={{ fontSize: 11, color: '#9badb5', marginTop: 4 }}>All platform users are already in this group.</div>
          )}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#697a82', display: 'block', marginBottom: 4 }}>Role</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['member', 'manager'] as const).map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                <input type="radio" checked={role === r} onChange={() => setRole(r)} />
                <span style={{ color: ROLE_COLOR[r], fontWeight: 700 }}>{r}</span>
              </label>
            ))}
          </div>
        </div>
        <button className="sn-btn sn-btn-primary" style={{ width: '100%', fontSize: 13 }}
          disabled={!selectedId || addMutation.isPending}
          onClick={() => addMutation.mutate()}>
          {addMutation.isPending ? 'Adding...' : `Add to ${groupName}`}
        </button>
        {addMutation.isError && (
          <div style={{ color: '#b42318', fontSize: 12, marginTop: 8 }}>
            {(addMutation.error as Error)?.message}
          </div>
        )}
      </div>
    </div>
  );
}
