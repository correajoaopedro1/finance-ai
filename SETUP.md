# FinanceAI — Setup Guide

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Chave da API da OpenAI

## 1. Instalar dependências

```bash
cd finance-ai
npm install
```

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
DATABASE_URL="postgresql://SEU_USER:SUA_SENHA@localhost:5432/finance_ai"
JWT_ACCESS_SECRET="gere-com-openssl-rand-base64-64"
JWT_REFRESH_SECRET="gere-com-openssl-rand-base64-64"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Gerar secrets JWT
```bash
openssl rand -base64 64
```

## 3. Criar banco de dados

```bash
# Criar o banco PostgreSQL
createdb finance_ai

# Aplicar schema
npm run db:push

# Seed com categorias do sistema
npm run db:seed
```

## 4. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 5. Build para produção

```bash
npm run build
npm run start
```

---

## Deploy — Vercel + Supabase (recomendado)

### Banco de dados — Supabase
1. Crie um projeto em supabase.com
2. Copie a `DATABASE_URL` (Connection String > URI)
3. Rode `npx prisma migrate deploy`

### Frontend — Vercel
1. Push para GitHub
2. Importe o repositório no Vercel
3. Configure as variáveis de ambiente
4. Deploy automático

---

## Arquitetura

```
finance-ai/
├── prisma/             # Schema do banco e seed
├── src/
│   ├── app/
│   │   ├── (auth)/     # Páginas de autenticação
│   │   ├── (dashboard)/# Páginas protegidas
│   │   └── api/        # API Routes (REST)
│   ├── components/     # Componentes React
│   ├── hooks/          # Custom hooks (SWR)
│   ├── lib/            # Utilitários (auth, AI, DB)
│   ├── types/          # Tipos TypeScript
│   └── middleware.ts   # Auth middleware
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Renovar token |
| GET | `/api/auth/me` | Perfil do usuário |
| GET/POST | `/api/transactions` | Listar/criar transações |
| PATCH/DELETE | `/api/transactions/:id` | Editar/excluir |
| GET/POST | `/api/categories` | Listar/criar categorias |
| GET/POST | `/api/budgets` | Listar/criar orçamentos |
| GET/POST | `/api/goals` | Listar/criar metas |
| POST | `/api/ai/chat` | Chat com IA (SSE streaming) |
| GET/POST | `/api/ai/conversations` | Conversas |
| GET | `/api/dashboard/summary` | Resumo do dashboard |
| GET | `/api/reports/export` | Exportar CSV |
