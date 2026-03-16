# AgendaPet MVP - Design Document

**Data:** 2026-03-15
**Versão:** 1.0
**Status:** Em revisão

---

## 1. Visão Geral

**AgendaPet** é um SaaS para gestão de petshops (banho e tosa) que permite agendamento simplificado de serviços. O MVP foca em cadastrar empresas via código de convite e realizar agendamentos sem gestão completa de clientes.

**Público-alvo:** Donos e funcionários de petshops small-to-medium.

---

## 2. Arquitetura

### Stack Tecnológico

| Componente | Tecnologia |
|------------|------------|
| Frontend | React Native com Expo |
| Backend | Supabase (PostgreSQL + Auth) |
| Multi-tenancy | Row Level Security (RLS) |

### Estrutura de Dados

```
┌─────────────────────────────────────────────────────────┐
│  Supabase                                               │
│  ├── companies (empresas)                               │
│  ├── users (usuários com auth)                          │
│  └── appointments (agendamentos)                        │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Modelo de Dados

### companies (Empresas)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK, auto-gerado |
| name | text | Nome do petshop |
| phone | text | Telefone de contato |
| invite_code | text | Código de convite único |
| plan_status | text | active/inactive |
| created_at | timestamp | Data de criação |

### users (Usuários)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK, auth.users |
| company_id | uuid | FK → companies |
| email | text | Email de login |
| role | text | admin/employee |
| created_at | timestamp | Data de criação |

### appointments (Agendamentos)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK, auto-gerado |
| company_id | uuid | FK → companies |
| tutor_name | text | Nome do tutor |
| phone | text | Telefone de contato |
| pet_name | text | Nome do pet |
| pet_breed | text | Raça (opcional) |
| service | text | banho/tosa |
| price | decimal | Valor do serviço |
| date | timestamp | Data e hora |
| status | text | scheduled/completed/cancelled |
| notes | text | Observações |
| created_at | timestamp | Data de criação |

---

## 4. Fluxo de Usuário

### Primeiro Acesso (Cadastro)

1. Usuário abre o app → Tela de boas-vindas
2. Insere código de convite
3. Se código válido → Formulário de cadastro da empresa
4. Preenche nome do petshop e telefone
5. Cria usuário admin (email + senha)
6. Redirecionado para Dashboard

### Acesso Normal (Login)

1. Tela de login → Email + Senha
2. Se credenciais válidas → Dashboard
3. Se inválidas → Mensagem de erro

---

## 5. Navegação (Tab Bar)

```
┌─────────┬─────────┬─────────┬─────────────┐
│ Agenda  │   +    │ Clientes│ Config     │
└─────────┴─────────┴─────────┴─────────────┘
```

### 5.1 Tab Agenda

- Lista de agendamentos do dia atual
- Cada item mostra: hora, pet_name, tutor_name, serviço, status
- Ao tocar → Detalhes do agendamento
- Botão para alterar status (agendado → concluído / cancelado)

### 5.2 Tab Novo Agendamento (+)

Formulário com campos:
- Tutor (nome) - texto
- Telefone - telefone
- Pet (nome) - texto
- Raça - texto (opcional)
- Serviço - seleção (banho / tosa)
- Data - date picker
- Hora - time picker
- Valor - moeda
- Observações - texto longo (opcional)

### 5.3 Tab Clientes

- Lista de clientes (ordenado por nome)
- Busca por nome ou telefone
- Ao tocar → Detalhes com histórico de agendamentos
- **Nota:** Funcionalidade placeholder para versão futura

### 5.4 Tab Configurações

- Nome da empresa
- Informações do usuário logado
- Sair (logout)

---

## 6. Funcionalidades por Tela

### Tela: Boas-vindas / Convite

- Campo: código de convite
- Botão: "Continuar"
- Validação: código deve existir e empresa estar ativa

### Tela: Cadastro Empresa

- Campos: nome do petshop, telefone
- Botão: "Cadastrar"
- Após sucesso → Tela de criar usuário

### Tela: Criar Usuário

- Campos: email, senha, confirmar senha
- Validação: email válido, senha mínimo 6 caracteres
- Botão: "Criar conta"
- Após sucesso → Dashboard

### Tela: Login

- Campos: email, senha
- Botão: "Entrar"
- "Esqueceu a senha?" (futuro)
- Link para se cadastrar (se não tiver código)

### Tela: Dashboard

- Resumo do dia: total agendamentos, concluídos, receita
- Lista de agendamentos do dia
- Navegação para outras tabs

### Tela: Novo Agendamento

- Formulário com validações
- Botão: "Salvar"
- Após sucesso → Volta para Agenda com novo item

### Tela: Detalhes Agendamento

- Visualização completa dos dados
- Botões: editar, alterar status, excluir

---

## 7. Regras de Negócio

### Autenticação

- Código de convite obrigatório para primeiro acesso
- Um código = uma empresa
- Usuários só veem dados da sua empresa (RLS)

### Agendamentos

- Data não pode ser no passado
- Status: scheduled → completed ou cancelled
- Ao concluir, valor é somado ao faturamento

### Multi-tenancy

- Todos queries incluem `company_id` automaticamente
- Row Level Security bloqueia acesso cross-company

---

## 8. Considerações Técnicas

### Expo

- SDK mais recente (52+)
-expo-router para navegação
- expo-secure-store para tokens

### Supabase

- Auth com email/senha
- RLS ativo em todas as tabelas
- Policies baseadas em company_id

### Estrutura de Pastas Sugerida

```
app/
├── (auth)/
│   ├── invite.tsx
│   ├── register-company.tsx
│   ├── register-user.tsx
│   └── login.tsx
├── (app)/
│   ├── _layout.tsx (tab bar)
│   ├── index.tsx (dashboard)
│   ├── new-appointment.tsx
│   ├── clients.tsx
│   └── settings.tsx
├── components/
├── hooks/
├── lib/ (supabase)
└── types/
```

---

## 9. Roadmap Sugerido

### Sprint 1 (Próxima)

- [ ] Configurar projeto Expo
- [ ] Configurar Supabase + schema
- [ ] Telas de auth (convite, cadastro, login)
- [ ] Tab bar + navegação

### Sprint 2

- [ ] Dashboard com lista de agendamentos
- [ ] Formulário de novo agendamento
- [ ] Detalhes e alteração de status

### Sprint 3

- [ ] Clientes (lista básica)
- [ ] Configurações
- [ ] Ajustes e polish

---

## 10. Alternativas Consideradas

1. **NestJS + PostgreSQL** - Descartado por ser mais código para MVP
2. **SQLite local** - Descartado sem suporte multi-device
3. **Admin manual** - Descartado, código de convite dá flexibilidade

---

## 11. Aprovação

**Status:** Pendente revisão

**Data de aprovação:** _______________
