const express = require('express');
const stripe = require('../config/stripe');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const CATALOG = require('../config/storeCatalog');

const router = express.Router();

router.use(authMiddleware);

// Lista o status atual da assinatura do usuario
router.get('/subscription', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT plan, status, expires_at FROM subscriptions WHERE user_id = $1',
      [req.userId]
    );
    res.json(result.rows[0] || { plan: 'free', status: 'inactive' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar assinatura' });
  }
});

// Cria uma sessao de checkout do Stripe para o item escolhido
router.post('/checkout', async (req, res) => {
  const { itemKey } = req.body;
  const item = CATALOG[itemKey];

  if (!item) {
    return res.status(400).json({ error: 'Item invalido' });
  }

  try {
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.userId]);
    const { email } = userResult.rows[0];

    const session = await stripe.checkout.sessions.create({
      mode: item.type === 'subscription' ? 'subscription' : 'payment',
      customer_email: email,
      line_items: [
        item.type === 'subscription'
          ? { price: item.priceId, quantity: 1 }
          : {
              price_data: {
                currency: 'brl',
                product_data: { name: item.name },
                unit_amount: item.amountCents,
              },
              quantity: 1,
            },
      ],
      success_url: `${process.env.FRONTEND_URL}/store?status=success`,
      cancel_url: `${process.env.FRONTEND_URL}/store?status=cancel`,
      metadata: { userId: req.userId, itemKey },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar checkout' });
  }
});

module.exports = router;
