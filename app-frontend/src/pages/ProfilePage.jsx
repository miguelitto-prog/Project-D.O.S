import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, radius, avatarGradient } from '../theme';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
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

  if (loading) return <div style={styles.page}><p style={styles.hint}>Carregando...</p></div>;
  if (!profile) return <div style={styles.page}><p style={styles.hint}>Perfil nao encontrado.</p></div>;

  const isOwnProfile = currentUser?.username === username;

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <button style={styles.backButton} onClick={() => navigate('/servers')}>
          ← Voltar
        </button>

        <div style={styles.card}>
          <div style={styles.banner} />

          <div style={styles.body}>
            <div style={styles.avatarWrapper}>
              <div style={{ ...styles.avatar, background: avatarGradient(profile.username) }}>
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
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
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: colors.bg },
  wrapper: { maxWidth: 420, margin: '0 auto', padding: '16px 16px 32px' },
  backButton: {
    background: 'none',
    border: 'none',
    color: colors.textSecondary,
    fontSize: 13,
    padding: '4px 0',
    marginBottom: 12,
  },
  card: {
    background: colors.surface1,
    borderRadius: radius.xl,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  banner: {
    height: 84,
    background: `linear-gradient(120deg, ${colors.accent} 0%, #5b4bd6 60%, #3a2f9e 100%)`,
  },
  body: { padding: '0 20px 22px', marginTop: -36 },
  avatarWrapper: { position: 'relative', width: 72, height: 72 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    border: `4px solid ${colors.surface1}`,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontWeight: 600,
    fontFamily: fonts.display,
  },
  badgeIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: colors.accent,
    color: '#fff',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${colors.surface1}`,
  },
  nameRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  name: { fontFamily: fonts.display, fontSize: 18, fontWeight: 600, margin: 0, color: colors.text },
  verifiedTag: {
    background: colors.accentMuted,
    color: colors.accent,
    fontSize: 11,
    fontWeight: 500,
    padding: '3px 9px',
    borderRadius: radius.sm,
  },
  plusTag: {
    background: colors.warningMuted,
    color: colors.warning,
    fontSize: 11,
    fontWeight: 500,
    padding: '3px 9px',
    borderRadius: radius.sm,
  },
  bio: { fontSize: 13, color: colors.textSecondary, margin: '12px 0', lineHeight: 1.5 },
  stats: { display: 'flex', gap: 24, marginTop: 10, marginBottom: 4 },
  statNumber: { fontSize: 14, fontWeight: 600, margin: 0, color: colors.text, fontFamily: fonts.mono },
  statLabel: { fontSize: 11, color: colors.textMuted, margin: 0 },
  hint: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', padding: 40 },
  form: { marginTop: 20, borderTop: `1px solid ${colors.border}`, paddingTop: 16 },
  formTitle: { fontFamily: fonts.display, fontSize: 13, fontWeight: 600, margin: '0 0 10px', color: colors.text },
  textarea: {
    width: '100%',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.surface2,
    color: colors.text,
    padding: 10,
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  feedback: { fontSize: 12, color: colors.accent, margin: '8px 0 0' },
  button: {
    marginTop: 12,
    height: 40,
    padding: '0 18px',
    borderRadius: radius.sm,
    border: 'none',
    background: colors.accent,
    color: colors.onAccent,
    fontSize: 13,
    fontWeight: 600,
  },
};
