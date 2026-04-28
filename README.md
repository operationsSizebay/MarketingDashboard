# Sizebay Marketing Dashboard

Dashboard de marketing com painéis separados para Brasil e Internacional.

## Pré-requisitos

- Node.js 18+
- Acesso às bases MySQL BR e INT

## Instalação

```bash
# Instalar dependências de todos os pacotes
npm run install:all

# Configurar variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env com as credenciais reais
```

## Desenvolvimento

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:3001

## Build para produção

```bash
npm run build
# Os arquivos estáticos ficam em frontend/dist/
```

Em produção, sirva `frontend/dist/` com Nginx/Apache e configure `VITE_API_URL` antes do build apontando para o backend.

## Variáveis de ambiente do backend

| Variável | Descrição |
|---|---|
| DB_BR_HOST | Host do banco Brasil |
| DB_BR_PORT | Porta (padrão 3306) |
| DB_BR_USER | Usuário |
| DB_BR_PASS | Senha |
| DB_BR_NAME | Nome do banco |
| DB_INT_HOST | Host do banco Internacional |
| DB_INT_PORT | Porta |
| DB_INT_USER | Usuário |
| DB_INT_PASS | Senha |
| DB_INT_NAME | Nome do banco |
| PORT | Porta do servidor (padrão 3001) |

## Estrutura

```
sizebay-dashboard/
├── backend/          # Node.js + Express
│   ├── routes/
│   │   ├── br.js     # /api/br  — view_leadsBrCloude
│   │   └── int.js    # /api/int — view_leadsIntCloude
│   ├── db.js
│   └── index.js
└── frontend/         # React + Vite
    └── src/
        ├── components/
        │   ├── DashboardBr.jsx
        │   ├── DashboardInt.jsx
        │   └── ...
        ├── App.jsx
        └── api.js
```
