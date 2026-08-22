# Guia de deploy

Passo a passo pra colocar o app no ar. Ordem recomendada: banco → backend → LiveKit → Stripe (produção) → front-end.

## 1. Banco de dados (Railway)

1. Crie uma conta em [railway.app](https://railway.app)
2. "New Project" → "Provision PostgreSQL"
3. Na aba "Variables" do banco, copie o valor de `DATABASE_URL`
4. Conecte no banco (pelo botão "Connect" do Railway, ou qualquer cliente Postgres) e rode o conteúdo de `src/config/schema.sql` pra criar as tabelas

## 2. Backend (Railway)

1. No mesmo projeto do Railway, clique em "New" → "GitHub Repo" (você vai precisar subir a pasta `app-backend` pro GitHub primeiro — pode ser um repositório novo e privado)
2. O Railway detecta que é Node.js automaticamente (o `railway.json` já está configurado)
3. Em "Variables", adicione todas as variáveis do `.env.example`:
   - `DATABASE_URL` — cole a mesma do banco criado no passo 1
   - `JWT_SECRET` — gere uma string aleatória forte (ex: `openssl rand -hex 32`)
   - `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` — do passo 3
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PLUS`, `STRIPE_PRICE_BOOST` — do passo 4
   - `FRONTEND_URL` — a URL que o Vercel vai te dar no passo 5 (pode deixar em branco e voltar aqui depois)
   - `PORT` — o Railway define isso sozinho, não precisa setar
4. Deploy automático acontece a cada push. Anote a URL pública que o Railway gera (ex: `https://seu-app.up.railway.app`)

## 3. LiveKit (chamadas em grupo)

1. Crie uma conta em [cloud.livekit.io](https://cloud.livekit.io) (tem plano gratuito)
2. Crie um projeto — ele te dá a `API Key`, `API Secret` e a `URL` do servidor (algo como `wss://seu-projeto.livekit.cloud`)
3. Coloque essas três informações nas variáveis do backend (passo 2)

## 4. Stripe (pagamentos em produção)

1. No [dashboard do Stripe](https://dashboard.stripe.com), troque do modo "Test" pro modo "Live" (canto superior direito)
2. Recrie os produtos/preços (Plano Plus, Impulsionar grupo) no modo Live — os IDs mudam do teste pra produção
3. Copie a chave secreta de produção (`sk_live_...`)
4. Em "Developers → Webhooks", adicione um endpoint apontando para `https://sua-url-do-backend/api/store/webhook` e copie o `whsec_...` gerado
5. Atualize essas variáveis no backend (passo 2)

## 5. Front-end (Vercel)

1. Suba a pasta `app-frontend` pro GitHub também
2. Em [vercel.com](https://vercel.com), "Add New Project" → importe o repositório
3. Em "Environment Variables", adicione:
   - `VITE_API_URL` → `https://sua-url-do-backend/api`
   - `VITE_SOCKET_URL` → `https://sua-url-do-backend`
4. Deploy. A Vercel te dá uma URL tipo `https://seu-app.vercel.app`
5. Volte no Railway (backend) e atualize a variável `FRONTEND_URL` com essa URL — isso ajusta o CORS e os redirects do Stripe

## 6. Testando

- Acesse a URL do front-end, crie uma conta, crie um grupo, mande mensagem — deve funcionar em tempo real
- Teste uma chamada com duas abas/dispositivos diferentes logados em contas diferentes
- Teste um checkout da loja em modo teste antes de ativar o modo Live de verdade

## Custos aproximados pra começar

- Railway: plano gratuito cobre bem no início; depois é por uso (poucos dólares/mês pra um app pequeno)
- LiveKit Cloud: plano gratuito com limite de minutos, suficiente pra testar e os primeiros usuários
- Vercel: gratuito pra projetos pessoais/pequenos
- Stripe: sem custo fixo, cobra só uma taxa por transação

## Antes de divulgar publicamente

- Revisar limites de taxa (rate limiting) nas rotas, especialmente `/auth`
- Validar todos os inputs do usuário mais rigorosamente (ex: com a biblioteca `zod`)
- Configurar HTTPS (Railway e Vercel já fazem isso automaticamente)
- Revisar os Termos de Uso e Política de Privacidade — obrigatório antes de coletar dados de usuários reais
