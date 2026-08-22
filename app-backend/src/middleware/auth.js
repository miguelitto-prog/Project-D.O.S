const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'troque-este-segredo-em-producao';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token nao fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido ou expirado' });
  }
}

// Deve ser usado APOS authMiddleware. Verifica se o usuario logado e admin
// antes de liberar o acesso (ex: aprovar solicitacoes de selo verificado).
async function adminMiddleware(req, res, next) {
  const pool = require('../config/db');
  try {
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.userId]);
    if (!result.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao verificar permissao' });
  }
}

module.exports = { authMiddleware, adminMiddleware, JWT_SECRET };
