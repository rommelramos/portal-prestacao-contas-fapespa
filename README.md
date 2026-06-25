# Portal de Prestação de Contas — FAPESPA / ISACI

Portal web com **chatbot de IA (Claude)** para consulta das regras, normas e
manuais de prestação de contas de múltiplos financiadores de projetos de
pesquisa e inovação.

> As respostas do chatbot são baseadas **exclusivamente** no manual do
> financiador e versão selecionados pelo usuário, garantindo isolamento
> contextual entre financiadores distintos.

## Stack

| Camada        | Tecnologia                                  |
| ------------- | ------------------------------------------- |
| Frontend/SSR  | Next.js 16 (App Router) + React 19          |
| Estilo        | Tailwind CSS 4                              |
| Autenticação  | Auth.js (NextAuth v5) — JWT + RBAC          |
| ORM / Banco   | Prisma 6 + MySQL (HostGator)                |
| IA            | Anthropic Claude                            |
| Hospedagem    | Vercel (deploy automático a cada push)      |

## Perfis de acesso

- **Administrador** (`/admin`): financiadores, manuais (com versionamento),
  documentos, usuários, indexação da base de conhecimento e painel de uso.
- **Usuário** (`/app`): chatbot de consulta, seleção de financiador/versão,
  emissão de parecer e histórico de consultas.

## Desenvolvimento local

```bash
npm install
cp .env.example .env   # preencha as variáveis
npx prisma db push     # cria as tabelas no MySQL
npm run db:seed        # cria o administrador inicial
npm run dev            # http://localhost:3000
```

## Variáveis de ambiente

Veja [`.env.example`](.env.example). **Nenhum segredo é versionado** — todas as
credenciais ficam em variáveis de ambiente (no Vercel, marcadas como sensíveis):

- `DATABASE_URL` — conexão MySQL
- `AUTH_SECRET` — segredo de assinatura dos tokens
- `AUTH_URL` — URL pública da aplicação
- `ANTHROPIC_API_KEY` — chave da API Claude

## Deploy

O projeto está conectado ao Vercel e ao GitHub: **cada `git push` na branch
`main` dispara automaticamente um novo deploy em produção.**

## Scripts

| Script              | Descrição                          |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento        |
| `npm run build`     | Build de produção                  |
| `npm run db:push`   | Sincroniza o schema com o banco    |
| `npm run db:seed`   | Cria/garante o administrador       |
| `npm run db:studio` | Prisma Studio (inspeção do banco)  |

## Status

🚧 **Fundação** concluída (auth, RBAC, shells, deploy/CI). Módulos de negócio
(financiadores, manuais, chatbot RAG, histórico) em desenvolvimento incremental.

---

© ISACI — uso interno. Documento de escopo: v1 (25/06/2026).
