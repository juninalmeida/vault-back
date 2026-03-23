<div align="center">

# 🏦 Vault Back

**Sistema de gestão de reembolsos corporativos com autenticação JWT, controle de acesso por cargos e upload seguro de comprovantes.**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

[Funcionalidades](#-funcionalidades) · [Arquitetura](#-arquitetura) · [Endpoints](#-endpoints-da-api) · [Instalação](#-instalação) · [Contato](#-contato)

</div>

---

## 📋 Sobre o Projeto

O **Vault Back** é uma API REST para gerenciamento de reembolsos corporativos. Funcionários enviam solicitações de reembolso com comprovantes em imagem, e gerentes revisam e acompanham todos os pedidos com paginação e filtros.

O projeto aplica padrões reais de mercado: autenticação stateless com JWT, autorização por cargo (RBAC), validação de entrada com Zod, upload de arquivos com armazenamento em duas fases e tratamento global de erros.

---

## ✨ Funcionalidades

- **Autenticação JWT** — Login com geração de token e expiração configurável
- **Senhas com Bcrypt** — Hash com salt rounds, nunca armazenadas em texto puro
- **RBAC (Role-Based Access Control)** — Permissões distintas para `employee` e `manager`
- **Upload de arquivos** — Recebimento via Multer com validação de tipo (JPEG/PNG) e tamanho (3MB)
- **Two-Phase Storage** — Arquivo temporário → validação → armazenamento definitivo, com limpeza automática em caso de falha
- **Servir arquivos estáticos** — Comprovantes acessíveis via URL pública
- **Paginação e filtros** — Listagem com `page`, `perPage` e busca por nome do funcionário
- **Validação com Zod** — Schemas tipados em todas as entradas (body, params, query)
- **Tratamento global de erros** — Respostas padronizadas para erros de negócio, validação e servidor

---

## 🏗 Arquitetura

```
src/
├── server.ts                  # Entry point — inicializa o servidor
├── app.ts                     # Configuração do Express (middlewares, rotas, static)
│
├── configs/
│   ├── auth.ts                # JWT secret e expiração
│   └── upload.ts              # Multer: storage, limites, tipos aceitos
│
├── controllers/
│   ├── users-controller.ts    # Cadastro com hash de senha
│   ├── sessions-controller.ts # Login com geração de JWT
│   ├── refunds-controller.ts  # CRUD de reembolsos com paginação
│   └── uploads-controller.ts  # Upload com validação e cleanup
│
├── middlewares/
│   ├── ensure-authenticated.ts      # Verificação de token JWT
│   ├── verify-user-authorization.ts # RBAC — controle por cargo
│   └── error-handling.ts            # Handler global de erros
│
├── routes/
│   ├── index.ts               # Router central (público vs privado)
│   ├── users-routes.ts
│   ├── sessions-routes.ts
│   ├── refunds-routes.ts
│   └── uploads-routes.ts
│
├── database/
│   └── prisma.ts              # Instância singleton do PrismaClient
│
├── providers/
│   └── disk-storage.ts        # Operações de filesystem (save/delete)
│
├── types/
│   └── express.d.ts           # Type augmentation — request.user
│
└── utils/
    └── app-error.ts           # Classe de erro com statusCode
```

### Fluxo de uma requisição autenticada

```
Request → CORS → JSON Parser → Router
                                  ├─ /users (público)
                                  ├─ /sessions (público)
                                  │
                                  └─ ensureAuthenticated (JWT)
                                       ├─ /refunds → verifyUserAuthorization → Controller
                                       └─ /uploads → verifyUserAuthorization → Multer → Controller
                                                                                          │
                                                                               Error Handler ← (catch)
```

### Fluxo de upload de arquivo

```
POST /uploads (multipart/form-data)
  │
  ├─ 1. ensureAuthenticated    → Verifica JWT
  ├─ 2. verifyUserAuthorization → Confirma role = employee
  ├─ 3. Multer (diskStorage)   → Salva em tmp/ com nome hash único
  ├─ 4. Zod validation         → Valida mimetype e size
  │     ├─ ✅ OK  → DiskStorage.saveFile()  → Move para tmp/uploads/
  │     └─ ❌ Fail → DiskStorage.deleteFile() → Remove do tmp/ (cleanup)
  │
  └─ Response: { filename: "a1b2c3d4e5-comprovante.jpg" }
```

---

## 📡 Endpoints da API

### Rotas Públicas

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/users` | Cadastrar novo usuário |
| `POST` | `/sessions` | Login — retorna JWT |

### Rotas Privadas (requerem `Authorization: Bearer <token>`)

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `POST` | `/uploads` | `employee` | Upload de comprovante (imagem) |
| `POST` | `/refunds` | `employee` | Criar solicitação de reembolso |
| `GET` | `/refunds` | `manager` | Listar reembolsos (paginado) |
| `GET` | `/refunds/:id` | `employee` `manager` | Detalhes de um reembolso |
| `GET` | `/uploads/:filename` | público | Acessar arquivo de comprovante |

### Exemplos de Requisição

<details>
<summary><strong>POST /users</strong> — Cadastro</summary>

```json
{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "password": "123456",
  "role": "employee"
}
```
**Response:** `201 Created`
</details>

<details>
<summary><strong>POST /sessions</strong> — Login</summary>

```json
{
  "email": "joao@empresa.com",
  "password": "123456"
}
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "email": "joao@empresa.com",
    "role": "employee"
  }
}
```
</details>

<details>
<summary><strong>POST /uploads</strong> — Upload de comprovante</summary>

**Content-Type:** `multipart/form-data`
**Campo:** `file` (JPEG ou PNG, máx 3MB)

**Response:**
```json
{
  "filename": "a1b2c3d4e5f6g7h8i9j0-comprovante.jpg"
}
```
</details>

<details>
<summary><strong>POST /refunds</strong> — Criar reembolso</summary>

```json
{
  "name": "Almoço com cliente",
  "category": "food",
  "amount": 89.90,
  "filename": "a1b2c3d4e5f6g7h8i9j0-comprovante.jpg"
}
```
**Categorias:** `food` · `transport` · `services` · `accommodation` · `others`

**Response:** `201 Created`
</details>

<details>
<summary><strong>GET /refunds</strong> — Listar com paginação</summary>

**Query params:** `?name=João&page=1&perPage=10`

**Response:**
```json
{
  "refunds": [...],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "totalRecords": 23,
    "totalPages": 3
  }
}
```
</details>

---

## 🛠 Tech Stack

| Tecnologia | Função |
|---|---|
| **Node.js** | Runtime JavaScript server-side |
| **TypeScript** | Tipagem estática e segurança em tempo de desenvolvimento |
| **Express** | Framework HTTP com sistema de middlewares |
| **Prisma** | ORM com schema declarativo, migrations e type safety |
| **SQLite** | Banco relacional leve, ideal para desenvolvimento |
| **JWT** | Autenticação stateless com tokens assinados |
| **Bcrypt** | Hash de senhas com salt rounds |
| **Multer** | Upload de arquivos via multipart/form-data |
| **Zod** | Validação e parsing de schemas com inferência de tipos |
| **TSX** | Execução direta de TypeScript com hot reload |

---

## 🚀 Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- npm ou yarn

### Setup

```bash
# Clone o repositório
git clone https://github.com/juninalmeida/vault-back.git
cd vault-back

# Instale as dependências
npm install

# Gere o client do Prisma e execute as migrations
npx prisma migrate dev

# Inicie o servidor em modo de desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:3333`.

---

## 📁 Estrutura do Banco de Dados

```
┌──────────────┐       1:N       ┌──────────────┐
│    users     │────────────────▶│   refunds    │
├──────────────┤                 ├──────────────┤
│ id (UUID)    │                 │ id (UUID)    │
│ name         │                 │ name         │
│ email (UQ)   │                 │ amount       │
│ password     │                 │ category     │
│ role (enum)  │                 │ filename     │
│ created_at   │                 │ user_id (FK) │
│ updated_at   │                 │ created_at   │
└──────────────┘                 │ updated_at   │
                                 └──────────────┘

Roles: employee | manager
Categories: food | transport | services | accommodation | others
```

---

## 🔐 Segurança

- Senhas nunca armazenadas em texto puro — hash com Bcrypt (8 salt rounds)
- Autenticação via token JWT com expiração de 24h
- Mensagens de erro genéricas no login para evitar enumeração de emails
- Validação de entrada em todas as rotas com Zod
- Upload restrito a tipos de imagem (JPEG/PNG) com limite de 3MB
- Limpeza automática de arquivos temporários em caso de falha na validação
- Controle de acesso por cargo (RBAC) em todas as rotas privadas

---

## 📬 Contato

**Horacio Junior** — Desenvolvedor FullStack

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/j%C3%BAnior-almeida-3563a934b/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/juninalmeida)
[![Gmail](https://img.shields.io/badge/Gmail-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:junioralmeidati2023@gmail.com)

---

<div align="center">

Feito com 💊 Venvanse e TypeScript

</div>
