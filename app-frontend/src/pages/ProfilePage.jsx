import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { colors, fonts, radius, avatarGradient } from '../theme';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [editing, setEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [avatarDraft, setAvatarDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  function loadProfile() {
    setLoading(true);
    userService
      .getProfile(username)
      .then((data) => {
        setProfile(data);
        setBioDraft(data.bio || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

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

  function handlePickAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Imagem muito grande (maximo 3MB)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarDraft(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await userService.updateMe({
        bio: bioDraft,
        avatarUrl: avatarDraft || undefined,
      });
      showToast('Perfil atualizado', 'success');
      setEditing(false);
      setAvatarDraft(null);
      loadProfile();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao salvar perfil', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={styles.page}><p style={styles.hint}>Carregando...</p></div>;
  if (!profile) return <div style={styles.page}><p style={styles.hint}>Perfil nao encontrado.</p></div>;

  const isOwnProfile = currentUser?.username === username;
  const displayAvatar = avatarDraft || profile.avatar_url;

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
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" style={styles.avatarImg} />
              ) : (
                <div style={{ ...styles.avatar, background: avatarGradient(profile.username) }}>
                  {profile.username.slice(0, 2).toUpperCase()}
                </div>
              )}
              {profile.verified && (
                <div style={styles.badgeIcon} title="Verificado">✓</div>
              )}
              {editing && (
                <button
                  style={styles.avatarEditButton}
                  onClick={() => fileInputRef.current?.click()}
                  title="Trocar foto"
                >
                  📷
                </button>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handlePickAvatar}
              />
            </div>

            <div style={styles.nameRow}>
              <p style={styles.name}>{profile.username}</p>
              {profile.verified && <span style={styles.verifiedTag}>Verificado</span>}
              {profile.plan === 'plus_subscription' && <span style={styles.plusTag}>Plus</span>}
            </div>

            {!editing && profile.bio && <p style={styles.bio}>{profile.bio}</p>}
            {!editing && !profile.bio && isOwnProfile && (
              <p style={styles.bioPlaceholder}>Voce ainda nao tem uma bio.</p>
            )}

            {editing && (
              <textarea
                style={styles.bioInput}
                placeholder="Conte um pouco sobre voce..."
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                rows={3}
                maxLength={160}
              />
            )}

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

            {isOwnProfile && (
              <div style={styles.ownActions}>
                {editing ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={styles.saveButton} onClick={handleSaveProfile} disabled={saving}>
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      style={styles.cancelButton}
                      onClick={() => {
                        setEditing(false);
                        setAvatarDraft(null);
                        setBioDraft(profile.bio || '');
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button style={styles.editButton} onClick={() => setEditing(true)}>
                    Editar perfil
                  </button>
                )}
              </div>
            )}

            {isOwnProfile && !profile.verified && !editing && (
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

            {isOwnProfile && !editing && (
              <button style={styles.logoutButton} onClick={logout}>
                Sair da conta
              </button>
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
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    border: `4px solid ${colors.surface1}`,
    objectFit: 'cover',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: colors.accent,
    border: `2px solid ${colors.surface1}`,
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  bioPlaceholder: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', margin: '12px 0' },
  bioInput: {
    width: '100%',
    marginTop: 12,
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
  stats: { display: 'flex', gap: 24, marginTop: 14, marginBottom: 4 },
  statNumber: { fontSize: 14, fontWeight: 600, margin: 0, color: colors.text, fontFamily: fonts.mono },
  statLabel: { fontSize: 11, color: colors.textMuted, margin: 0 },
  hint: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', padding: 40 },
  ownActions: { marginTop: 16 },
  editButton: {
    width: '100%',
    height: 38,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.surface2,
    color: colors.text,
    fontSize: 13,
    fontWeight: 500,
  },
  saveButton: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm,
    border: 'none',
    background: colors.accent,
    color: colors.onAccent,
    fontSize: 13,
    fontWeight: 600,
  },
  cancelButton: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.textSecondary,
    fontSize: 13,
  },
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
  logoutButton: {
    marginTop: 16,
    width: '100%',
    height: 38,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.textMuted,
    fontSize: 12,
  },
};
