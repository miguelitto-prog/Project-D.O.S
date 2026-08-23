# Como subir os projetos pro GitHub

Você precisa de **dois repositórios separados**: um pro `app-backend`, outro pro `app-frontend`. Assim o Railway e a Vercel conseguem conectar em cada um de forma independente.

## Pré-requisitos

1. Ter o [Git](https://git-scm.com/downloads) instalado no seu computador
2. Ter uma conta no [GitHub](https://github.com)
3. Ter extraído os dois zips (`app-backend.zip` e `app-frontend.zip`) em pastas no seu computador

## Passo 1 — Criar os repositórios no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Crie um repositório chamado `app-backend` (pode ser privado)
3. **Não marque** nenhuma opção de "Initialize with README" — deixe vazio
4. Repita o processo criando outro repositório chamado `app-frontend`

## Passo 2 — Subir o backend

Abra o terminal (ou o VS Code) dentro da pasta `app-backend` que você extraiu, e rode:

```bash
cd caminho/para/app-backend
git init
git add .
git commit -m "Primeira versao do backend"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/app-backend.git
git push -u origin main
```

Troque `SEU_USUARIO` pelo seu nome de usuário do GitHub. Ele pode pedir login — use seu usuário e uma [senha de acesso pessoal](https://github.com/settings/tokens) (o GitHub não aceita mais senha normal pra isso).

## Passo 3 — Subir o front-end

Mesma coisa, mas na pasta `app-frontend`:

```bash
cd caminho/para/app-frontend
git init
git add .
git commit -m "Primeira versao do frontend"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/app-frontend.git
git push -u origin main
```

## Verificando

Depois disso, atualize a página de cada repositório no GitHub (`github.com/SEU_USUARIO/app-backend` e `.../app-frontend`) — você deve ver todos os arquivos lá, exceto `node_modules` e `.env` (o `.gitignore` já cuida de excluir isso, com razão: `.env` tem suas senhas e chaves secretas, nunca deve ir pro GitHub).

## A partir daqui

Com os dois repositórios no ar, você já pode seguir o `DEPLOY.md` (dentro da pasta do backend) — no passo do Railway e da Vercel, em vez de subir arquivo por arquivo, você só conecta o repositório do GitHub direto.

## Fazendo mudanças depois

Toda vez que você alterar algo (aqui comigo ou sozinho) e quiser atualizar o que está no ar:

```bash
git add .
git commit -m "descricao da mudanca"
git push
```

O Railway e a Vercel detectam o push automaticamente e fazem um novo deploy sozinhos.
