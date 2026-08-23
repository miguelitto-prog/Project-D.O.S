// Catalogo simples da loja. Em um projeto maior isso viraria uma tabela no banco,
// mas para o MVP um objeto fixo já resolve.
const CATALOG = {
  plus_subscription: {
    type: 'subscription',
    name: 'Plano Plus',
    priceId: process.env.STRIPE_PRICE_PLUS, // criado no dashboard do Stripe
    priceLabel: 'R$ 14,90/mes',
    description: 'Video em HD, tela em ate 4K, upload maior, emojis exclusivos',
    featured: true,
    benefits: [
      'Chamadas de video em alta definicao',
      'Upload de arquivos maiores no chat',
      'Selo exclusivo no perfil',
      'Emojis e figurinhas exclusivas',
    ],
  },
  theme_pack: {
    type: 'one_time',
    name: 'Pacote de temas',
    amountCents: 490,
    priceLabel: 'R$ 4,90',
    description: 'Pacotes avulsos de personalizacao do app',
    benefits: ['Temas de cor exclusivos', 'Aplicacao imediata apos a compra'],
  },
  boost_server: {
    type: 'subscription',
    name: 'Impulsionar grupo',
    priceId: process.env.STRIPE_PRICE_BOOST,
    priceLabel: 'R$ 9,90/mes',
    description: 'Destaque seu servidor e ganhe beneficios visuais',
    benefits: ['Selo de grupo impulsionado', 'Prioridade em buscas futuras'],
  },
};

module.exports = CATALOG;
