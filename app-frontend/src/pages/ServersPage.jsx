import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serverService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { colors, fonts, radius, avatarGradient } from '../theme';

export default function ServersPage() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState('');
  const { user, logout } = useAuth();
  const { showToast } = useToast();
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
      showToast('Erro ao carregar grupos', 'error');
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
      showToast('Grupo criado', 'success');
    } catch (err) {
      showToast('Erro ao criar grupo', 'error');
    } finally {
      setCreating(false);
    }
  }

  function handleCopyInvite(e, serverId) {
    e.stopPropagation();
    const link = `${window.location.origin}/join/${serverId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(serverId);
    showToast('Link de convite copiado', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredServers = servers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

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

        {servers.length > 0 && (
          <input
            style={styles.searchInput}
            placeholder="Buscar grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}

        {loading && <p style={styles.hint}>Carregando...</p>}
        {!loading && servers.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>◇</div>
            <p style={styles.hint}>Voce ainda nao esta em nenhum grupo.</p>
            <p style={styles.hintSmall}>Crie o primeiro e comece a conversar.</p>
          </div>
        )}
        {!loading && servers.length > 0 && filteredServers.length === 0 && (
          <p style={styles.hint}>Nenhum grupo encontrado para "{search}".</p>
        )}

        <div style={styles.list}>
          {filteredServers.map((server) => (
            <div
              key={server.id}
              style={styles.item}
              onClick={() => navigate(`/servers/${server.id}/${server.channel_id}`)}
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
  searchInput: {
    width: '100%',
    height: 38,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.surface2,
    color: colors.text,
    padding: '0 14px',
    fontSize: 13,
    marginBottom: 10,
    boxSizing: 'border-box',
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
