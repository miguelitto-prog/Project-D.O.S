import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serverService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, radius, avatarGradient } from '../theme';

export default function ServersPage() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadServers();
  }, []);

  async function loadServers() {
    setLoading(true);
    try {
      const data = await serverService.list();
      setServers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    const name = window.prompt('Nome do novo grupo:');
    if (!name) return;

    setCreating(true);
    try {
      await serverService.create(name);
      await loadServers();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  function handleCopyInvite(e, serverId) {
    e.stopPropagation();
    const link = `${window.location.origin}/join/${serverId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(serverId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.topbar}>
          <div style={styles.brand}>
            <div style={styles.brandMark}>◈</div>
          </div>
          <div
            style={styles.profileLink}
            onClick={() => navigate(`/profile/${user?.username}`)}
            title="Meu perfil"
          >
            <div style={{ ...styles.miniAvatar, background: avatarGradient(user?.username) }}>
              {user?.username?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        <div style={styles.header}>
          <p style={styles.title}>Meus grupos</p>
          <button style={styles.addButton} onClick={handleCreate} disabled={creating}>
            +
          </button>
        </div>

        {loading && <p style={styles.hint}>Carregando...</p>}
        {!loading && servers.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>◇</div>
            <p style={styles.hint}>Voce ainda nao esta em nenhum grupo.</p>
            <p style={styles.hintSmall}>Crie o primeiro e comece a conversar.</p>
          </div>
        )}

        <div style={styles.list}>
          {servers.map((server) => (
            <div
              key={server.id}
              style={styles.item}
              onClick={() => navigate(`/servers/${server.id}`)}
            >
              <div style={{ ...styles.avatar, background: avatarGradient(server.name) }}>
                {server.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.itemTitle}>{server.name}</p>
                <p style={styles.itemSubtitle}>{server.role}</p>
              </div>
              <button
                style={styles.inviteButton}
                onClick={(e) => handleCopyInvite(e, server.id)}
                title="Copiar link de convite"
              >
                {copiedId === server.id ? 'Copiado ✓' : 'Convidar'}
              </button>
            </div>
          ))}
        </div>

        <button style={styles.logoutButton} onClick={logout}>
          Sair da conta
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: colors.bg },
  wrapper: { maxWidth: 420, margin: '0 auto', padding: '0 16px 32px' },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 4px',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8 },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    background: `linear-gradient(135deg, ${colors.accent}, #5b4bd6)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    color: '#fff',
  },
  profileLink: { cursor: 'pointer' },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 4px 16px',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
    color: colors.text,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: colors.accentMuted,
    color: colors.accent,
    fontSize: 17,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  },
  empty: {
    textAlign: 'center',
    padding: '48px 20px',
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.lg,
    marginTop: 8,
  },
  emptyIcon: { fontSize: 28, color: colors.textMuted, marginBottom: 8 },
  hint: { fontSize: 13, color: colors.textSecondary, margin: '0 0 2px' },
  hintSmall: { fontSize: 12, color: colors.textMuted, margin: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 10px',
    borderRadius: radius.md,
    cursor: 'pointer',
    transition: 'background 0.12s',
    border: `1px solid transparent`,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    flexShrink: 0,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 600,
    margin: 0,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemSubtitle: { fontSize: 12, color: colors.textMuted, margin: 0, textTransform: 'capitalize' },
  inviteButton: {
    fontSize: 11,
    fontWeight: 500,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    background: colors.surface2,
    color: colors.textSecondary,
    padding: '7px 12px',
    flexShrink: 0,
    transition: 'border-color 0.15s, color 0.15s',
  },
  logoutButton: {
    marginTop: 24,
    width: '100%',
    height: 38,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.textMuted,
    fontSize: 12,
  },
};
