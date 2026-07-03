import { useRef, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api, type Notification } from '../lib/api';
import { timeAgo } from '../lib/format';

const TYPE_ICON: Record<string, string> = {
  job_done:    '✓',
  job_error:   '✕',
  job_started: '▶',
  system:      'i',
};

const TYPE_COLOR: Record<string, string> = {
  job_done:    '#1f6f35',
  job_error:   '#b42318',
  job_started: '#1a56a4',
  system:      '#60727b',
};

const TYPE_BG: Record<string, string> = {
  job_done:    '#f0faf3',
  job_error:   '#fff0f0',
  job_started: '#eff6ff',
  system:      '#f5f7f8',
};

export default function NotificationPanel() {
  const navigate    = useNavigate();
  const qc          = useQueryClient();
  const ref         = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn:  api.getNotifications,
    refetchInterval: 15_000,
  });

  const notifications = data?.notifications ?? [];
  const unread = notifications.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  async function markRead(n: Notification, e: React.MouseEvent) {
    e.stopPropagation();
    if (!n.read) {
      await api.markRead(n.id);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
    if (n.jobId) {
      setOpen(false);
      navigate(`/jobs/${n.jobId}`);
    }
  }

  async function markAllRead() {
    await api.markAllRead();
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function dismiss(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await api.deleteNotification(id);
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function clearRead() {
    await api.clearReadNotifications();
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        className="icon-btn"
        title="Notifications"
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative' }}>
        <Bell size={18} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            minWidth: 15, height: 15, borderRadius: 8,
            background: '#d32f2f', color: '#fff',
            fontSize: 9, fontWeight: 800, padding: '0 3px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, boxSizing: 'border-box',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 42,
          width: 360, maxHeight: 480,
          background: '#fff', border: '1px solid #d5dadd',
          borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,.16)',
          zIndex: 200, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 14px', borderBottom: '1px solid #e8edf0',
            background: '#f5f7f8',
          }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#1a2f38' }}>
              Notifications
              {unread > 0 && (
                <span style={{
                  marginLeft: 7, background: '#d32f2f', color: '#fff',
                  fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 8,
                }}>
                  {unread}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--sn-link)',
                    border: 0, background: 'transparent', cursor: 'pointer', padding: 0,
                  }}>
                  Mark all read
                </button>
              )}
              {notifications.some(n => n.read) && (
                <button
                  onClick={clearRead}
                  style={{
                    fontSize: 11, fontWeight: 700, color: '#697a82',
                    border: 0, background: 'transparent', cursor: 'pointer', padding: 0,
                  }}>
                  Clear read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '32px 16px', textAlign: 'center',
                color: '#697a82', fontSize: 13,
              }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={e => markRead(n, e)}
                  style={{
                    display: 'flex', gap: 10, padding: '10px 14px',
                    borderBottom: '1px solid #f0f3f5',
                    background: n.read ? '#fff' : '#fafcff',
                    cursor: n.jobId ? 'pointer' : 'default',
                    transition: 'background .1s',
                  }}
                  onMouseOver={e => { if (n.jobId) (e.currentTarget as HTMLElement).style.background = '#f0f4ff'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = n.read ? '#fff' : '#fafcff'; }}
                >
                  {/* Type icon */}
                  <div style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                    background: TYPE_BG[n.type] ?? '#f5f7f8',
                    color: TYPE_COLOR[n.type] ?? '#60727b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 900, marginTop: 1,
                  }}>
                    {TYPE_ICON[n.type] ?? 'i'}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: n.read ? 500 : 700,
                      color: '#1a2f38', lineHeight: 1.3,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {!n.read && (
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: '#2563eb', flexShrink: 0, display: 'inline-block',
                        }} />
                      )}
                      {n.title}
                    </div>
                    {n.message && (
                      <div style={{
                        fontSize: 12, color: '#697a82', marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {n.message}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#9badb5', marginTop: 3 }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>

                  {/* Dismiss × */}
                  <button
                    onClick={e => dismiss(n.id, e)}
                    title="Dismiss"
                    style={{
                      flexShrink: 0, border: 0, background: 'transparent',
                      color: '#9badb5', cursor: 'pointer', fontSize: 16,
                      lineHeight: 1, padding: '0 2px', alignSelf: 'flex-start',
                    }}
                    onMouseOver={e => (e.currentTarget.style.color = '#b42318')}
                    onMouseOut={e => (e.currentTarget.style.color = '#9badb5')}>
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '8px 14px', borderTop: '1px solid #e8edf0',
              background: '#f5f7f8', textAlign: 'center',
            }}>
              <button
                onClick={() => { setOpen(false); navigate('/errors'); }}
                style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--sn-link)',
                  border: 0, background: 'transparent', cursor: 'pointer',
                }}>
                Open error log →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
