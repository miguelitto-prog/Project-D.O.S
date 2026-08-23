# Backend do app

Estrutura inicial: autenticação, servidores/grupos, canais, mensagens e sinalização WebRTC (voz, vídeo, compartilhamento de tela).

## Como rodar

1. Instale o PostgreSQL localmente (ou use um serviço como Supabase/Railway/Neon).
2. Copie `.env.example` para `.env` e preencha com seus dados.
3. Instale as dependências:
   ```
   npm install
   ```
4. Rode o schema no seu banco:
   ```
   psql -U seu_usuario -d app_db -f src/config/schema.sql
   ```
5. Inicie o servidor:
   ```
   npm run dev
   ```

## Rotas disponíveis

- `POST /api/auth/register` — cadastro
- `POST /api/auth/login` — login
- `GET /api/servers` — listar meus servidores (autenticado)
- `POST /api/servers` — criar servidor (autenticado)
- `POST /api/servers/:id/join` — entrar em servidor (autenticado)
- `GET /api/messages/:channelId` — histórico de mensagens (autenticado)
- `POST /api/messages/:channelId` — enviar mensagem via HTTP (autenticado)

## Tempo real (Socket.io)

Conecte passando o token JWT em `auth: { token }`. Eventos principais:

- `channel:join` / `channel:leave` — entrar/sair de um canal de texto
- `message:send` → `message:new` — enviar e receber mensagens em tempo real

## Chamadas em grupo (LiveKit)

As chamadas de voz/vídeo/tela agora suportam **qualquer número de participantes**, usando o [LiveKit](https://livekit.io) como servidor SFU (Selective Forwarding Unit) — cada pessoa envia seu vídeo uma vez só, e o servidor distribui para os demais.

### Rodando o LiveKit localmente (para desenvolvimento)

A forma mais simples é via Docker:

```
docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp \
  -e LIVEKIT_KEYS="devkey: devsecret" \
  livekit/livekit-server --dev
```

Isso sobe um servidor local em `ws://localhost:7880`. Preencha no `.env`:
```
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=ws://localhost:7880
```

### Em produção

Use o [LiveKit Cloud](https://cloud.livekit.io) (tem plano gratuito para começar) ou hospede o servidor você mesmo. Basta trocar as variáveis de ambiente pelas credenciais reais — o código não muda.

- `POST /api/calls/:channelId/token` — gera um token de acesso à sala de chamada daquele canal (autenticado)
- `GET /api/store/subscription` — status da assinatura do usuário (autenticado)
- `POST /api/store/checkout` — cria uma sessão de pagamento no Stripe (autenticado). Body: `{ "itemKey": "plus_subscription" | "theme_pack" | "boost_server" }`
- `POST /api/store/webhook` — endpoint que o Stripe chama para confirmar pagamentos (não é chamado pelo front-end)
- `GET /api/users/:username` — perfil público de um usuário
- `POST /api/users/verification/request` — usuário solicita o selo verificado (autenticado)
- `GET /api/users/verification/pending` — lista solicitações pendentes (apenas admins)
- `POST /api/users/verification/:requestId/review` — aprova ou rejeita uma solicitação (apenas admins). Body: `{ "approve": true }`

## Selo verificado

O fluxo é: o usuário envia uma solicitação explicando o motivo → fica com status `pending` → um administrador aprova ou rejeita.

Não existe uma tela de admin pronta ainda (fica como próximo passo natural), mas as rotas já funcionam — dá para aprovar manualmente via Postman/Insomnia, ou direto no banco:

```sql
-- Tornar um usuário administrador
UPDATE users SET is_admin = TRUE WHERE username = 'seu_usuario';
```

## Loja e assinaturas (Stripe)

1. Crie uma conta em [stripe.com](https://stripe.com) e pegue sua chave secreta de teste (`sk_test_...`)
2. No dashboard do Stripe, crie os produtos/preços recorrentes para "Plano Plus" e "Impulsionar grupo" e copie os `price_id` de cada um
3. Preencha essas informações no `.env`
4. Para testar o webhook localmente, use a [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```
   stripe listen --forward-to localhost:3000/api/store/webhook
   ```
   Isso vai te dar um `whsec_...` temporário para colocar no `.env`

## Próximos passos sugeridos

- Implementar o front-end (React ou React Native) consumindo essas rotas
- Adicionar upload de avatar/arquivos (ex: S3 ou Cloudinary)
- Implementar tabela de assinaturas/loja com um provedor de pagamento (Stripe, Mercado Pago)
- Adicionar rate limiting e validação mais robusta (ex: biblioteca `zod`)
- Configurar HTTPS e variáveis de ambiente reais antes de produção
