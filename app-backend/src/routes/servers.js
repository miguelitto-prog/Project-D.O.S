const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Listar servidores do usuario logado
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.boosted, m.role
       FROM servers s
       JOIN memberships m ON m.server_id = s.id
       WHERE m.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar servidores' });
  }
});

// Criar novo servidor (o criador vira owner e membro automaticamente)
router.post('/', async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Nome do servidor e obrigatorio' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const serverResult = await client.query(
      `INSERT INTO servers (owner_id, name) VALUES ($1, $2) RETURNING *`,
      [req.userId, name.trim()]
    );
    const server = serverResult.rows[0];

    await client.query(
      `INSERT INTO memberships (user_id, server_id, role) VALUES ($1, $2, 'owner')`,
      [req.userId, server.id]
    );

    await client.query(
      `INSERT INTO channels (server_id, name, type) VALUES ($1, 'geral', 'text')`,
      [server.id]
    );

    await client.query('COMMIT');
    res.status(201).json(server);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar servidor' });
  } finally {
    client.release();
  }
});

// Entrar em um servidor existente
router.post('/:id/join', async (req, res) => {
  const { id } = req.params;

  try {
    const serverResult = await pool.query(
      'SELECT id, name FROM servers WHERE id = $1',
      [id]
    );
    if (serverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Servidor nao encontrado' });
    }

    await pool.query(
      `INSERT INTO memberships (user_id, server_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (user_id, server_id) DO NOTHING`,
      [req.userId, id]
    );

    // Retorna o canal padrao do servidor, pra ja levar o usuario direto pro chat
    const channelResult = await pool.query(
      `SELECT id FROM channels WHERE server_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [id]
    );

    res.json({
      ok: true,
      server: serverResult.rows[0],
      channelId: channelResult.rows[0]?.id || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao entrar no servidor' });
  }
});

module.exports = router;
