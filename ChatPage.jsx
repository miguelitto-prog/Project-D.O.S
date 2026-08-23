// Sistema de design do app — inspirado em interfaces de chat/voz,
// com identidade propria (nao e uma copia do Discord).

export const colors = {
  // Fundos
  bg: '#121214',
  surface1: '#1a1a1e',
  surface2: '#202024',
  surface3: '#28282e',
  border: '#2c2c33',
  borderStrong: '#38383f',

  // Texto
  text: '#f0f0f2',
  textSecondary: '#9a9aa5',
  textMuted: '#6b6b74',

  // Acento primario — roxo-eletrico
  accent: '#7c6cf6',
  accentHover: '#8f81f8',
  accentMuted: 'rgba(124, 108, 246, 0.14)',
  onAccent: '#ffffff',

  // Estados
  success: '#3ecf8e',
  successMuted: 'rgba(62, 207, 142, 0.14)',
  warning: '#f5b942',
  warningMuted: 'rgba(245, 185, 66, 0.14)',
  danger: '#ff5c72',
  dangerMuted: 'rgba(255, 92, 114, 0.14)',
};

export const fonts = {
  display: '"Space Grotesk", sans-serif',
  body: '"Inter", sans-serif',
  mono: '"JetBrains Mono", monospace',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.3)',
  md: '0 4px 16px rgba(0,0,0,0.35)',
  lg: '0 8px 32px rgba(0,0,0,0.45)',
  glow: `0 0 0 1px rgba(124, 108, 246, 0.4), 0 4px 20px rgba(124, 108, 246, 0.25)`,
};

const avatarPalette = [
  ['#7c6cf6', '#5b4bd6'],
  ['#3ecf8e', '#2aa36e'],
  ['#f5b942', '#d99a1f'],
  ['#ff5c72', '#e0405a'],
  ['#4ba3f5', '#2e7fd6'],
  ['#f56ee0', '#d64bc2'],
];

export function avatarGradient(seed) {
  const str = String(seed || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const [from, to] = avatarPalette[Math.abs(hash) % avatarPalette.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}
