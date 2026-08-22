const express = require('express');
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Usuario solicita o selo verificado, explicando o motivo
router.post('/verification/request', async (req, res) => {
  const { reason } = req.body;

  if (!reason || reason.trim().length < 10) {
    return res.status(400).json({ error: 'Descreva o motivo com mais detalhes' });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM verification_requests WHERE user_id = $1 AND status = 'pending'`,
      [req.userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Voce ja tem uma solicitacao pendente' });
    }

    const result = await pool.query(
      `INSERT INTO verification_requests (user_id, reason) VALUES ($1, $2) RETURNING *`,
      [req.userId, reason.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar solicitacao' });
  }
});

// --- Rotas administrativas ---
// (precisam vir antes de "/:username", ou "verification" seria lido como um username)

// Lista solicitacoes pendentes (apenas admins)
router.get('/verification/pending', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vr.id, vr.reason, vr.created_at, u.id as user_id, u.username, u.email
       FROM verification_requests vr
       JOIN users u ON u.id = vr.user_id
       WHERE vr.status = 'pending'
       ORDER BY vr.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar solicitacoes' });
  }
});

// Aprova ou rejeita uma solicitacao (apenas admins)
router.post('/verification/:requestId/review', adminMiddleware, async (req, res) => {
  const { requestId } = req.params;
  const { approve } = req.body; // true ou false

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reqResult = await client.query(
      `UPDATE verification_requests
       SET status = $1, reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING user_id`,
      [approve ? 'approved' : 'rejected', req.userId, requestId]
    );

    if (reqResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Solicitacao nao encontrada ou ja revisada' });
    }

    if (approve) {
      await client.query('UPDATE users SET verified = TRUE WHERE id = $1', [
        reqResult.rows[0].user_id,
      ]);
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erro ao revisar solicitacao' });
  } finally {
    client.release();
  }
});

// Perfil publico de um usuario (usado na tela de perfil com selo verificado)
// Fica por ultimo: qualquer coisa que nao bateu nas rotas acima cai aqui como "username"
router.get('/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const userResult = await pool.query(
      `SELECT id, username, bio, avatar_url, verified, created_at
       FROM users WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }
    const profile = userResult.rows[0];

    const subResult = await pool.query(
      `SELECT plan FROM subscriptions WHERE user_id = $1 AND status = 'active'`,
      [profile.id]
    );
    profile.plan = subResult.rows[0]?.plan || 'free';

    const countsResult = await pool.query(
      `SELECT COUNT(*) as server_count FROM memberships WHERE user_id = $1`,
      [profile.id]
    );
    profile.server_count = parseInt(countsResult.rows[0].server_count, 10);

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

module.exports = router;
