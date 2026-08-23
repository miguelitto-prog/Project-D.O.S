import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serverService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, radius, avatarGradient } from '../theme';

// Barra lateral de icones de servidor, inspirada em apps de chat em grupo
// mas com identidade propria: quadrados arredondados + barra indicadora,
// em vez de circulos que viram quadrado no hover.
export default function ServerRail({ activeServerId, onCreated }) {
  const [servers, setServers] = useState([]);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    serverService.list().then(setServers).catch(() => {});
  }, [activeServerId]);

  async function handleCreate() {
    const name = window.prompt('Nome do novo grupo:');
    if (!name) return;
    setCreating(true);
    try {
      const server = await serverService.create(name);
      const updated = await serverService.list();
      setServers(updated);
      const created = updated.find((s) => s.id === server.id);
      if (created?.channel_id) {
        navigate(`/servers/${created.id}/${created.channel_id}`);
      }
      onCreated?.();
    } catch (err) {
      // silencioso aqui; a pagina que chama trata o toast se precisar
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={styles.rail}>
      <div
        style={styles.homeIcon}
        onClick={() => navigate('/servers')}
        title="Inicio"
      >
        ◈
      </div>

      <div style={styles.divider} />

      <div style={styles.serverList}>
        {servers.map((server) => {
          const active = server.id === activeServerId;
          return (
            <div key={server.id} style={styles.iconWrapper}>
              <div style={{ ...styles.indicator, opacity: active ? 1 : 0 }} />
              <div
                style={{
                  ...styles.serverIcon,
                  background: avatarGradient(server.name),
                  borderRadius: active ? radius.md : radius.full,
                }}
                onClick={() => navigate(`/servers/${server.id}/${server.channel_id}`)}
                title={server.name}
              >
                {server.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      <button style={styles.addButton} onClick={handleCreate} disabled={creating} title="Criar grupo">
        +
      </button>

      <div style={styles.divider} />

      <div style={styles.storeIcon} onClick={() => navigate('/store')} title="Loja">
        🛍
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={styles.profileIcon}
        onClick={() => navigate(`/profile/${user?.username}`)}
        title="Meu perfil"
      >
        <div style={{ ...styles.avatar, background: avatarGradient(user?.username) }}>
          {user?.username?.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

const styles = {
  rail: {
    width: 68,
    flexShrink: 0,
    background: colors.surface1,
    borderRight: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '14px 0',
    gap: 10,
    height: '100%',
  },
  homeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    background: `linear-gradient(135deg, ${colors.accent}, #5b4bd6)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: '#fff',
    cursor: 'pointer',
    flexShrink: 0,
  },
  divider: {
    width: 32,
    height: 1,
    background: colors.border,
    flexShrink: 0,
  },
  serverList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflowY: 'auto',
    width: '100%',
    alignItems: 'center',
    flex: '0 1 auto',
  },
  iconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    width: 4,
    height: 22,
    borderRadius: '0 4px 4px 0',
    background: colors.accent,
    transition: 'opacity 0.15s',
  },
  serverIcon: {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    transition: 'border-radius 0.15s',
    flexShrink: 0,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    border: `1px dashed ${colors.border}`,
    background: 'transparent',
    color: colors.accent,
    fontSize: 18,
    fontWeight: 600,
    flexShrink: 0,
  },
  storeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    background: colors.surface2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    cursor: 'pointer',
    flexShrink: 0,
  },
  profileIcon: { cursor: 'pointer', flexShrink: 0 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    border: `2px solid ${colors.surface1}`,
  },
};
