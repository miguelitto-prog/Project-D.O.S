import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storeService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { colors, fonts, radius, shadow } from '../theme';
import ServerRail from '../components/ServerRail';

export default function StorePage() {
  const [catalog, setCatalog] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    Promise.all([storeService.catalog(), storeService.subscription()])
      .then(([catalogData, subData]) => {
        setCatalog(catalogData);
        setSubscription(subData);
      })
      .catch(() => showToast('Erro ao carregar a loja', 'error'))
      .finally(() => setLoading(false));

    const status = searchParams.get('status');
    if (status === 'success') {
      showToast('Pagamento confirmado! Pode levar alguns instantes para ativar.', 'success');
    } else if (status === 'cancel') {
      showToast('Pagamento cancelado', 'info');
    }
  }, []);

  async function handleCheckout(itemKey) {
    setCheckingOut(itemKey);
    try {
      const { url } = await storeService.checkout(itemKey);
      window.location.href = url;
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao iniciar pagamento', 'error');
      setCheckingOut(null);
    }
  }

  const isActive = subscription?.status === 'active';

  return (
    <div style={styles.page}>
      <ServerRail activeServerId={null} />

      <div style={styles.content}>
        <button style={styles.backButton} onClick={() => navigate('/servers')}>
          ← Voltar
        </button>

        <div style={styles.header}>
          <p style={styles.title}>Loja</p>
          <p style={styles.subtitle}>Recursos extras para sua conta e seus grupos</p>
        </div>

        {isActive && (
          <div style={styles.currentPlanBanner}>
            <span style={styles.currentPlanDot} />
            Voce ja tem o <strong>{subscription.plan === 'plus_subscription' ? 'Plano Plus' : subscription.plan}</strong> ativo
          </div>
        )}

        {loading && <p style={styles.hint}>Carregando...</p>}

        <div style={styles.grid}>
          {catalog.map((item) => (
            <div
              key={item.key}
              style={{
                ...styles.card,
                ...(item.featured ? styles.cardFeatured : {}),
              }}
            >
              {item.featured && <span style={styles.featuredTag}>Mais popular</span>}
              <p style={styles.cardName}>{item.name}</p>
              <p style={styles.cardDescription}>{item.description}</p>

              {item.benefits && (
                <ul style={styles.benefitsList}>
                  {item.benefits.map((b) => (
                    <li key={b} style={styles.benefitItem}>
                      <span style={styles.checkIcon}>✓</span> {b}
                    </li>
                  ))}
                </ul>
              )}

              <p style={styles.cardPrice}>{item.priceLabel}</p>

              <button
                style={{
                  ...styles.buyButton,
                  ...(item.featured ? styles.buyButtonFeatured : {}),
                }}
                onClick={() => handleCheckout(item.key)}
                disabled={checkingOut === item.key}
              >
                {checkingOut === item.key
                  ? 'Abrindo pagamento...'
                  : item.type === 'subscription'
                  ? 'Assinar'
                  : 'Comprar'}
              </button>
            </div>
          ))}
        </div>

        <p style={styles.footerNote}>
          Pagamentos processados com seguranca pelo Stripe. Voce pode cancelar assinaturas quando quiser.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { height: '100vh', background: colors.bg, display: 'flex' },
  content: {
    flex: 1,
    overflowY: 'auto',
    maxWidth: 720,
    margin: '0 auto',
    width: '100%',
    padding: '20px 20px 40px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: colors.textSecondary,
    fontSize: 13,
    padding: '4px 0',
    marginBottom: 16,
  },
  header: { marginBottom: 18 },
  title: { fontFamily: fonts.display, fontSize: 22, fontWeight: 600, margin: 0, color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, margin: '4px 0 0' },
  currentPlanBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: colors.successMuted,
    color: colors.success,
    fontSize: 13,
    padding: '10px 14px',
    borderRadius: radius.md,
    marginBottom: 18,
  },
  currentPlanDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: colors.success,
    flexShrink: 0,
  },
  hint: { fontSize: 13, color: colors.textSecondary },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
  },
  card: {
    background: colors.surface1,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  cardFeatured: {
    border: `1.5px solid ${colors.accent}`,
    boxShadow: shadow.glow,
  },
  featuredTag: {
    position: 'absolute',
    top: -10,
    left: 16,
    background: colors.accent,
    color: colors.onAccent,
    fontSize: 10,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: radius.full,
  },
  cardName: {
    fontFamily: fonts.display,
    fontSize: 15,
    fontWeight: 600,
    margin: '4px 0 4px',
    color: colors.text,
  },
  cardDescription: { fontSize: 12.5, color: colors.textSecondary, margin: '0 0 12px', lineHeight: 1.4 },
  benefitsList: { listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 6 },
  benefitItem: { fontSize: 12, color: colors.textSecondary, display: 'flex', gap: 6, alignItems: 'flex-start' },
  checkIcon: { color: colors.success, fontSize: 11, marginTop: 1 },
  cardPrice: {
    fontFamily: fonts.mono,
    fontSize: 16,
    fontWeight: 600,
    color: colors.text,
    margin: '0 0 12px',
    marginTop: 'auto',
  },
  buyButton: {
    height: 40,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.surface2,
    color: colors.text,
    fontSize: 13,
    fontWeight: 600,
  },
  buyButtonFeatured: {
    border: 'none',
    background: colors.accent,
    color: colors.onAccent,
  },
  footerNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
};
