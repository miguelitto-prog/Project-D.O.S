import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' ou 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password || (mode === 'register' && !form.username)) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const data =
        mode === 'login'
          ? await authService.login({ email: form.email, password: form.password })
          : await authService.register(form);

      login(data.user, data.token);
      navigate('/servers');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>{mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}</h1>
        <p style={styles.subtitle}>
          {mode === 'login'
            ? 'Entre para acessar seus grupos e conversas'
            : 'Cadastre-se para comecar'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'register' && (
            <input
              style={styles.input}
              placeholder="Nome de usuario"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          )}
          <input
            style={styles.input}
            type="email"
            placeholder="usuario@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <p style={styles.switch}>
          {mode === 'login' ? 'Nao tem conta?' : 'Ja tem conta?'}{' '}
          <span
            style={styles.link}
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
          </span>
        </p>
      </div>
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
  card: {
    width: '100%',
    maxWidth: 340,
    padding: '32px 24px',
    background: '#fff',
    borderRadius: 20,
    border: '0.5px solid #e5e3da',
  },
  title: { fontSize: 20, fontWeight: 500, margin: '0 0 4px', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#73726c', textAlign: 'center', margin: '0 0 20px' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    height: 40,
    borderRadius: 8,
    border: '0.5px solid #d3d1c7',
    padding: '0 12px',
    fontSize: 14,
  },
  button: {
    height: 42,
    borderRadius: 8,
    border: 'none',
    background: '#2c2c2a',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 4,
  },
  error: { color: '#a32d2d', fontSize: 13, margin: 0 },
  switch: { fontSize: 12, color: '#888780', textAlign: 'center', marginTop: 16 },
  link: { color: '#185fa5', cursor: 'pointer' },
};
