import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serverService } from '../services/api';
import { colors, fonts, radius, avatarGradient } from '../theme';

export default function MembersDrawer({ serverId, currentUserId, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    serverService
      .members(serverId)
      .then(setMembers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [serverId]);

  const myRole = members.find((m) => m.id === currentUserId)?.role;

  async function handleLeave() {
    if (!window.confirm('Tem certeza que quer sair deste grupo?')) return;
    setLeaving(true);
    try {
      await serverService.leave(serverId);
      navigate('/servers');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao sair do grupo');
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <p style={styles.title}>Participantes {!loading && `(${members.length})`}</p>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.list}>
          {loading && <p style={styles.hint}>Carregando...</p>}
          {members.map((m) => (
            <div
              key={m.id}
              style={styles.item}
              onClick={() => navigate(`/profile/${m.username}`)}
            >
              <div style={{ ...styles.avatar, background: avatarGradient(m.username) }}>
                {m.username.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.nameRow}>
                  <p style={styles.name}>{m.username}</p>
                  {m.verified && <span style={styles.verifiedDot} title="Verificado">✓</span>}
                </div>
                <p style={styles.role}>{m.role === 'owner' ? 'dono' : 'membro'}</p>
              </div>
            </div>
          ))}
        </div>

        {myRole && myRole !== 'owner' && (
          <button style={styles.leaveButton} onClick={handleLeave} disabled={leaving}>
            {leaving ? 'Saindo...' : 'Sair do grupo'}
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 50,
    animation: 'fadeIn 0.15s ease',
  },
  panel: {
    width: 280,
    maxWidth: '85vw',
    height: '100%',
    background: colors.surface1,
    borderLeft: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  title: { fontFamily: fonts.display, fontSize: 14, fontWeight: 600, margin: 0, color: colors.text },
  closeButton: { background: 'none', border: 'none', color: colors.textMuted, fontSize: 14 },
  list: { flex: 1, overflowY: 'auto', padding: 8 },
  hint: { fontSize: 12, color: colors.textMuted, padding: '10px 8px' },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 8px',
    borderRadius: radius.sm,
    cursor: 'pointer',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    flexShrink: 0,
  },
  nameRow: { display: 'flex', alignItems: 'center', gap: 5 },
  name: {
    fontSize: 13,
    fontWeight: 500,
    margin: 0,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  verifiedDot: { fontSize: 10, color: colors.accent },
  role: { fontSize: 11, color: colors.textMuted, margin: 0 },
  leaveButton: {
    margin: 12,
    height: 38,
    borderRadius: radius.sm,
    border: `1px solid ${colors.dangerMuted}`,
    background: colors.dangerMuted,
    color: colors.danger,
    fontSize: 12,
    fontWeight: 500,
  },
};
