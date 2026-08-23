// Catalogo simples da loja. Em um projeto maior isso viraria uma tabela no banco,
// mas para o MVP um objeto fixo já resolve.
const CATALOG = {
  plus_subscription: {
    type: 'subscription',
    name: 'Plano Plus',
    priceId: process.env.STRIPE_PRICE_PLUS, // criado no dashboard do Stripe
  },
  theme_pack: {
    type: 'one_time',
    name: 'Pacote de temas',
    amountCents: 490,
  },
  boost_server: {
    type: 'subscription',
    name: 'Impulsionar grupo',
    priceId: process.env.STRIPE_PRICE_BOOST,
  },
};

module.exports = CATALOG;
