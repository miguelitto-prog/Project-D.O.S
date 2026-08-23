const { Pool } = require('pg');

// Em producao, a maioria dos provedores (Railway, Supabase, Neon) fornece
// uma unica DATABASE_URL e exige SSL. Localmente, usamos as variaveis separadas.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'app_db',
    });

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do banco de dados', err);
});

module.exports = pool;
