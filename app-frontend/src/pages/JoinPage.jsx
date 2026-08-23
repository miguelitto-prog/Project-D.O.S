import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serverService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, radius } from '../theme';

export default function JoinPage() {
  const { serverId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      sessionStorage.setItem('pendingInvite', serverId);
      navigate('/login');
      return;
    }

    serverService
      .join(serverId)
      .then((data) => {
        if (data.channelId) {
          navigate(`/servers/${serverId}/${data.channelId}`);
        } else {
          navigate('/servers');
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Nao foi possivel entrar no grupo');
      });
  }, [serverId, user]);

  return (
    <div style={styles.wrapper}>
      {status === 'loading' && (
        <div style={{ textAlign: 'center' }}>
          <div style={styles.spinner} />
          <p style={styles.text}>Entrando no grupo...</p>
        </div>
      )}
      {status === 'error' && (
        <div style={{ textAlign: 'center' }}>
          <p style={styles.error}>{message}</p>
          <button style={styles.button} onClick={() => navigate('/servers')}>
            Voltar para meus grupos
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.bg,
  },
  spinner: {
    width: 28,
    height: 28,
    margin: '0 auto 14px',
    borderRadius: '50%',
    border: `3px solid ${colors.border}`,
    borderTopColor: colors.accent,
    animation: 'spin 0.8s linear infinite',
  },
  text: { fontSize: 14, color: colors.textSecondary, fontFamily: fonts.body },
  error: { fontSize: 14, color: colors.danger, marginBottom: 14 },
  button: {
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
