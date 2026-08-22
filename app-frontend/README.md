# Front-end do app

React + Vite. Conecta ao backend via REST (login, servidores, mensagens) e via Socket.io (chat em tempo real, chamadas de voz/vídeo/tela com WebRTC).

## Como rodar

1. Copie `.env.example` para `.env` e ajuste a URL do backend se necessário.
2. Instale as dependências:
   ```
   npm install
   ```
3. Inicie:
   ```
   npm run dev
   ```
4. Acesse `http://localhost:5173`. O backend precisa estar rodando em paralelo (`app-backend`).

## Estrutura

- `src/pages/LoginPage.jsx` — login e cadastro
- `src/pages/ServersPage.jsx` — lista de grupos/servidores
- `src/pages/ChatPage.jsx` — chat em tempo real de um canal
- `src/pages/CallPage.jsx` — chamada de voz/vídeo com WebRTC (áudio, câmera, compartilhamento de tela em alta qualidade)
- `src/services/api.js` — chamadas REST ao backend
- `src/services/socket.js` — conexão Socket.io
- `src/context/AuthContext.jsx` — sessão do usuário logado

## Sobre a chamada de vídeo (LiveKit)

A chamada agora usa **LiveKit** (SFU), então **qualquer número de pessoas** pode entrar na mesma sala — não é mais limitado a 1-para-1. Cada participante manda seu áudio/vídeo/tela uma vez para o servidor, que distribui para os demais.

Requer que o servidor LiveKit esteja rodando (veja o README do `app-backend` para subir localmente via Docker) e as credenciais configuradas no `.env` do backend — o front-end só precisa da URL da API, que já está configurada.

## Próximos passos sugeridos

- Estilizar com um design system (ex: Tailwind) em vez de estilos inline
- Migrar para React Native quando quiser lançar mobile de verdade
- Adicionar tela da loja e assinatura (integrar com Stripe/Mercado Pago)
- Melhorar tratamento de erros e estados de carregamento 
