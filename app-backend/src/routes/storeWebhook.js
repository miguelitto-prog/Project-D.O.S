const express = require('express');
const stripe = require('../config/stripe');
const pool = require('../config/db');
const CATALOG = require('../config/storeCatalog');

const router = express.Router();

// Esta rota precisa do corpo "raw" (sem express.json()) para validar a
// assinatura do Stripe. Por isso e montada separadamente no server.js,
// ANTES do middleware express.json() global. Sem autenticacao JWT aqui:
// quem chama e o Stripe, e a seguranca vem da validacao da assinatura.
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Assinatura de webhook invalida', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, itemKey } = session.metadata;
    const item = CATALOG[itemKey];

    try {
      if (item.type === 'subscription') {
        await pool.query(
          `INSERT INTO subscriptions (user_id, plan, stripe_customer_id, stripe_subscription_id, status)
           VALUES ($1, $2, $3, $4, 'active')
           ON CONFLICT (user_id) DO UPDATE
           SET plan = $2, stripe_customer_id = $3, stripe_subscription_id = $4, status = 'active'`,
          [userId, itemKey, session.customer, session.subscription]
        );
      } else {
        await pool.query(
          `INSERT INTO purchases (user_id, item_key, stripe_payment_intent_id, amount_cents)
           VALUES ($1, $2, $3, $4)`,
          [userId, itemKey, session.payment_intent, session.amount_total]
        );
      }
    } catch (err) {
      console.error('Erro ao processar webhook', err);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    try {
      await pool.query(
        `UPDATE subscriptions SET status = 'canceled' WHERE stripe_subscription_id = $1`,
        [subscription.id]
      );
    } catch (err) {
      console.error('Erro ao cancelar assinatura', err);
    }
  }

  res.json({ received: true });
});

module.exports = router;
