import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    userService
      .getProfile(username)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  async function handleRequestVerification(e) {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setFeedback('Descreva o motivo com um pouco mais de detalhe.');
      return;
    }

    setSending(true);
    setFeedback('');
    try {
      await userService.requestVerification(reason.trim());
      setFeedback('Solicitacao enviada! Vamos analisar em breve.');
      setReason('');
    } catch (err) {
      setFeedback(err.response?.data?.error || 'Erro ao enviar solicitacao');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <p style={styles.hint}>Carregando...</p>;
  if (!profile) return <p style={styles.hint}>Perfil nao encontrado.</p>;

  const isOwnProfile = currentUser?.username === username;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.banner} />

        <div style={styles.body}>
          <div style={styles.avatarWrapper}>
            <div style={styles.avatar}>{profile.username.slice(0, 2).toUpperCase()}</div>
            {profile.verified && (
              <div style={styles.badgeIcon} title="Verificado">
                ✓
              </div>
            )}
          </div>

          <div style={styles.nameRow}>
            <p style={styles.name}>{profile.username}</p>
            {profile.verified && <span style={styles.verifiedTag}>Verificado</span>}
            {profile.plan === 'plus_subscription' && <span style={styles.plusTag}>Plus</span>}
          </div>

          {profile.bio && <p style={styles.bio}>{profile.bio}</p>}

          <div style={styles.stats}>
            <div>
              <p style={styles.statNumber}>{profile.server_count}</p>
              <p style={styles.statLabel}>grupos</p>
            </div>
            <div>
              <p style={styles.statNumber}>
                {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                  month: '2-digit',
                  year: 'numeric',
                })}
              </p>
              <p style={styles.statLabel}>entrou em</p>
            </div>
          </div>

          {isOwnProfile && !profile.verified && (
            <form onSubmit={handleRequestVerification} style={styles.form}>
              <p style={styles.formTitle}>Solicitar selo verificado</p>
              <textarea
                style={styles.textarea}
                placeholder="Por que sua conta deveria ser verificada?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              {feedback && <p style={styles.feedback}>{feedback}</p>}
              <button style={styles.button} type="submit" disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar solicitacao'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { maxWidth: 380, margin: '0 auto', padding: '16px 12px' },
  card: { background: '#fff', borderRadius: 20, border: '0.5px solid #e5e3da', overflow: 'hidden' },
  banner: { height: 70, background: 'linear-gradient(90deg, #f4e9c8, #e8d9a0)' },
  body: { padding: '0 18px 20px', marginTop: -32 },
  avatarWrapper: { position: 'relative', width: 68, height: 68 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: '50%',
    background: '#e6f1fb',
    border: '3px solid #fff',
    color: '#0c447c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 500,
  },
  badgeIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#185fa5',
    color: '#fff',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #fff',
  },
  nameRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: 500, margin: 0 },
  verifiedTag: {
    background: '#e6f1fb',
    color: '#185fa5',
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 6,
  },
  plusTag: {
    background: '#f4e9c8',
    color: '#7a5c12',
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 6,
  },
  bio: { fontSize: 13, color: '#73726c', margin: '10px 0' },
  stats: { display: 'flex', gap: 20, marginTop: 8, marginBottom: 4 },
  statNumber: { fontSize: 13, fontWeight: 500, margin: 0 },
  statLabel: { fontSize: 11, color: '#888780', margin: 0 },
  hint: { fontSize: 13, color: '#888780', textAlign: 'center', padding: 24 },
  form: { marginTop: 18, borderTop: '0.5px solid #e5e3da', paddingTop: 14 },
  formTitle: { fontSize: 13, fontWeight: 500, margin: '0 0 8px' },
  textarea: {
    width: '100%',
    borderRadius: 8,
    border: '0.5px solid #d3d1c7',
    padding: 10,
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  feedback: { fontSize: 12, color: '#185fa5', margin: '8px 0 0' },
  button: {
    marginTop: 10,
    height: 38,
    padding: '0 16px',
    borderRadius: 8,
    border: 'none',
    background: '#2c2c2a',
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
  },
};
