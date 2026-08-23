const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Listar servidores do usuario logado
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.boosted, m.role,
              (SELECT c.id FROM channels c WHERE c.server_id = s.id ORDER BY c.created_at ASC LIMIT 1) as channel_id
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

// Listar membros de um servidor
router.get('/:id/members', async (req, res) => {
  const { id } = req.params;

  try {
    const membership = await pool.query(
      'SELECT id FROM memberships WHERE user_id = $1 AND server_id = $2',
      [req.userId, id]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Voce nao e membro deste grupo' });
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url, u.verified, m.role, m.joined_at
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.server_id = $1
       ORDER BY (m.role = 'owner') DESC, m.joined_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar membros' });
  }
});

// Sair de um servidor (dono nao pode sair, precisa deletar o grupo)
router.post('/:id/leave', async (req, res) => {
  const { id } = req.params;

  try {
    const membership = await pool.query(
      'SELECT role FROM memberships WHERE user_id = $1 AND server_id = $2',
      [req.userId, id]
    );
    if (membership.rows.length === 0) {
      return res.status(404).json({ error: 'Voce nao e membro deste grupo' });
    }
    if (membership.rows[0].role === 'owner') {
      return res.status(400).json({ error: 'O dono nao pode sair do grupo, apenas exclui-lo' });
    }

    await pool.query('DELETE FROM memberships WHERE user_id = $1 AND server_id = $2', [
      req.userId,
      id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao sair do grupo' });
  }
});

// Renomear servidor (apenas dono)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Nome invalido' });
  }

  try {
    const membership = await pool.query(
      'SELECT role FROM memberships WHERE user_id = $1 AND server_id = $2',
      [req.userId, id]
    );
    if (membership.rows[0]?.role !== 'owner') {
      return res.status(403).json({ error: 'Apenas o dono pode renomear o grupo' });
    }

    const result = await pool.query(
      'UPDATE servers SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao renomear grupo' });
  }
});

// Excluir servidor (apenas dono)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const membership = await pool.query(
      'SELECT role FROM memberships WHERE user_id = $1 AND server_id = $2',
      [req.userId, id]
    );
    if (membership.rows[0]?.role !== 'owner') {
      return res.status(403).json({ error: 'Apenas o dono pode excluir o grupo' });
    }

    await pool.query('DELETE FROM servers WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir grupo' });
  }
});

module.exports = router;
