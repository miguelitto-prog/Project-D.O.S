const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

// Gera um token para o usuario entrar numa sala de chamada (canal).
// A sala e identificada pelo channelId - qualquer numero de pessoas pode entrar.
router.post('/:channelId/token', async (req, res) => {
  const { channelId } = req.params;

  try {
    const userResult = await pool.query(
      'SELECT username FROM users WHERE id = $1',
      [req.userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }
    const { username } = userResult.rows[0];

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: req.userId,
      name: username,
    });

    at.addGrant({
      room: `channel-${channelId}`,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    res.json({
      token,
      url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
      room: `channel-${channelId}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar token de chamada' });
  }
});

module.exports = router;
