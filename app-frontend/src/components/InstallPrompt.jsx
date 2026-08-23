import { useEffect, useState } from 'react';
import { colors, fonts, radius, shadow } from '../theme';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('installPromptDismissed') === '1'
  );

  useEffect(() => {
    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, [dismissed]);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  function handleDismiss() {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('installPromptDismissed', '1');
  }

  if (!visible) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.iconMark}>◈</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={styles.title}>Instalar o Conecta</p>
        <p style={styles.subtitle}>Acesso rapido, direto da sua tela inicial</p>
      </div>
      <button style={styles.installButton} onClick={handleInstall}>
        Instalar
      </button>
      <button style={styles.dismissButton} onClick={handleDismiss}>
        ✕
      </button>
    </div>
  );
}

const styles = {
  banner: {
    position: 'fixed',
    bottom: 16,
    left: 16,
    right: 16,
    maxWidth: 420,
    margin: '0 auto',
    background: colors.surface2,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: '12px 12px 12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: shadow.lg,
    zIndex: 80,
    animation: 'fadeIn 0.25s ease',
  },
  iconMark: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    background: `linear-gradient(135deg, ${colors.accent}, #5b4bd6)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: '#fff',
    flexShrink: 0,
  },
  title: { fontFamily: fonts.display, fontSize: 13, fontWeight: 600, margin: 0, color: colors.text },
  subtitle: { fontSize: 11, color: colors.textMuted, margin: 0 },
  installButton: {
    height: 32,
    padding: '0 14px',
    borderRadius: radius.sm,
    border: 'none',
    background: colors.accent,
    color: colors.onAccent,
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    color: colors.textMuted,
    fontSize: 13,
    flexShrink: 0,
    padding: 4,
  },
};
