import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, radius, shadow } from '../theme';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
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
      <div style={styles.glow} />
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoMark}>◈</div>
        </div>
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
    background: colors.bg,
    position: 'relative',
    overflow: 'hidden',
    padding: 20,
  },
  glow: {
    position: 'absolute',
    top: '-20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 600,
    height: 600,
    background: 'radial-gradient(circle, rgba(124,108,246,0.16) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: '36px 28px',
    background: colors.surface1,
    borderRadius: radius.xl,
    border: `1px solid ${colors.border}`,
    boxShadow: shadow.lg,
    position: 'relative',
    animation: 'fadeIn 0.4s ease',
  },
  logo: { display: 'flex', justifyContent: 'center', marginBottom: 18 },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    background: `linear-gradient(135deg, ${colors.accent}, #5b4bd6)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: '#fff',
    boxShadow: shadow.glow,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: 600,
    margin: '0 0 4px',
    textAlign: 'center',
    color: colors.text,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    margin: '0 0 24px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  input: {
    height: 44,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.surface2,
    color: colors.text,
    padding: '0 14px',
    fontSize: 14,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  button: {
    height: 44,
    borderRadius: radius.sm,
    border: 'none',
    background: colors.accent,
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: 600,
    marginTop: 6,
    transition: 'background 0.15s',
  },
  error: { color: colors.danger, fontSize: 13, margin: 0 },
  switch: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  link: { color: colors.accent, cursor: 'pointer', fontWeight: 500 },
};
