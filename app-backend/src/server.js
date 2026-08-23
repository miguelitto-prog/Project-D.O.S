require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const messageRoutes = require('./routes/messages');
const callRoutes = require('./routes/calls');
const storeRoutes = require('./routes/store');
const storeWebhookRoutes = require('./routes/storeWebhook');
const userRoutes = require('./routes/users');
const setupSockets = require('./sockets/index');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
  },
  maxHttpBufferSize: 8 * 1024 * 1024, // 8MB, para permitir envio de imagens
});

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

// O webhook do Stripe precisa vir ANTES do express.json() global,
// pois exige o corpo "raw" da requisicao para validar a assinatura.
app.use('/api/store/webhook', storeWebhookRoutes);

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/users', userRoutes);

setupSockets(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
