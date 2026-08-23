const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
// Mensagens com imagem em base64 podem ser maiores que o limite padrao do JSON
router.use(express.json({ limit: '8mb' }));
router.use(authMiddleware);

// Buscar historico de mensagens de um canal (paginado)
router.get('/:channelId', async (req, res) => {
  const { channelId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const before = req.query.before;

  try {
    const params = [channelId, limit];
    let query = `
      SELECT m.id, m.content, m.image_url, m.created_at, u.id as user_id, u.username, u.avatar_url
      FROM messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.channel_id = $1
    `;

    if (before) {
      query += ' AND m.created_at < $3';
      params.push(before);
    }

    query += ' ORDER BY m.created_at DESC LIMIT $2';

    const result = await pool.query(query, params);
    res.json(result.rows.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem (uso via HTTP; tempo real fica a cargo do socket.io)
router.post('/:channelId', async (req, res) => {
  const { channelId } = req.params;
  const { content, imageUrl } = req.body;

  const hasText = content && content.trim().length > 0;
  if (!hasText && !imageUrl) {
    return res.status(400).json({ error: 'Mensagem vazia' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO messages (channel_id, user_id, content, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, image_url, created_at`,
      [channelId, req.userId, hasText ? content.trim() : null, imageUrl || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

module.exports = router;
