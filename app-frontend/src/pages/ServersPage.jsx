import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serverService } from '../services/api';

export default function ServersPage() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
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
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <p style={styles.title}>Meus grupos</p>
        <button style={styles.addButton} onClick={handleCreate} disabled={creating}>
          +
        </button>
      </div>

      {loading && <p style={styles.hint}>Carregando...</p>}
      {!loading && servers.length === 0 && (
        <p style={styles.hint}>Voce ainda nao esta em nenhum grupo. Crie o primeiro!</p>
      )}

      <div style={styles.list}>
        {servers.map((server) => (
          <div
            key={server.id}
            style={styles.item}
            onClick={() => navigate(`/servers/${server.id}`)}
          >
            <div style={styles.avatar}>{server.name.slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <p style={styles.itemTitle}>{server.name}</p>
              <p style={styles.itemSubtitle}>{server.role}</p>
            </div>
            <button
              style={styles.inviteButton}
              onClick={(e) => handleCopyInvite(e, server.id)}
              title="Copiar link de convite"
            >
              {copiedId === server.id ? 'Copiado!' : 'Convidar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { maxWidth: 380, margin: '0 auto', padding: '16px 12px' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 4px 14px',
    borderBottom: '0.5px solid #e5e3da',
  },
  title: { fontSize: 15, fontWeight: 500, margin: 0 },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '0.5px solid #d3d1c7',
    background: '#fff',
    fontSize: 16,
    cursor: 'pointer',
  },
  hint: { fontSize: 13, color: '#888780', padding: '16px 4px' },
  list: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 8px',
    borderRadius: 8,
    cursor: 'pointer',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: '#e6f1fb',
    color: '#0c447c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 500,
    flexShrink: 0,
  },
  itemTitle: { fontSize: 14, fontWeight: 500, margin: 0 },
  itemSubtitle: { fontSize: 12, color: '#73726c', margin: 0 },
  inviteButton: {
    fontSize: 11,
    border: '0.5px solid #d3d1c7',
    borderRadius: 8,
    background: '#fff',
    padding: '6px 10px',
    cursor: 'pointer',
    flexShrink: 0,
  },
};
