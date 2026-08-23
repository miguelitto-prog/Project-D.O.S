const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

function setupSockets(io) {
  // Autenticacao do socket via token JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token nao fornecido'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Token invalido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.userId}`);

    // Entrar na "sala" de um canal de texto
    socket.on('channel:join', (channelId) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('channel:leave', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    // Envio de mensagem em tempo real
    socket.on('message:send', async ({ channelId, content, imageUrl }) => {
      const hasText = content && content.trim().length > 0;
      if (!hasText && !imageUrl) return;

      try {
        const result = await pool.query(
          `INSERT INTO messages (channel_id, user_id, content, image_url)
           VALUES ($1, $2, $3, $4)
           RETURNING id, content, image_url, created_at`,
          [channelId, socket.userId, hasText ? content.trim() : null, imageUrl || null]
        );

        const userResult = await pool.query(
          'SELECT username, avatar_url FROM users WHERE id = $1',
          [socket.userId]
        );

        const message = {
          ...result.rows[0],
          user_id: socket.userId,
          username: userResult.rows[0].username,
          avatar_url: userResult.rows[0].avatar_url,
        };

        io.to(`channel:${channelId}`).emit('message:new', message);
      } catch (err) {
        console.error(err);
        socket.emit('error', { error: 'Erro ao enviar mensagem' });
      }
    });

    // A sinalizacao de audio/video/tela agora e feita pelo LiveKit
    // (servidor SFU separado) - veja src/routes/calls.js. O socket.io
    // cuida apenas do chat de texto em tempo real.

    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${socket.userId}`);
    });
  });
}

module.exports = setupSockets;
