import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serverService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function JoinPage() {
  const { serverId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      // Guarda o convite pra usar depois do login/cadastro
      sessionStorage.setItem('pendingInvite', serverId);
      navigate('/login');
      return;
    }

    serverService
      .join(serverId)
      .then((data) => {
        if (data.channelId) {
          navigate(`/servers/${data.channelId}`);
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
      {status === 'loading' && <p style={styles.text}>Entrando no grupo...</p>}
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
    background: '#f5f4ee',
  },
  text: { fontSize: 14, color: '#73726c' },
  error: { fontSize: 14, color: '#a32d2d', marginBottom: 12 },
  button: {
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
