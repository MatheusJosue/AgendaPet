# SPEC: Sistema de Clientes e Pets

**Data:** 2026-03-16
**Projeto:** AgendaPet - Módulo de Clientes

---

## 1. Visão Geral

Este documento especifica a implementação do sistema de clientes e pets para o AgendaPet, permitindo cadastro, edição e exclusão de clientes, com gerenciamento de pets vinculados. O objetivo é possibilitar a seleção de cliente e pet no momento do agendamento.

---

## 2. Banco de Dados

### 2.1 Tabela: `clients`

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  cpf TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 Tabela: `pets`

```sql
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('cachorro', 'gato', 'outro')),
  breed TEXT,
  weight DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.3 Alterações na tabela `appointments`

```sql
-- Adicionar colunas (nullable inicialmente para migração)
ALTER TABLE appointments ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE appointments ADD COLUMN pet_id UUID REFERENCES pets(id);

-- Após migração: remover colunas antigas
ALTER TABLE appointments DROP COLUMN IF EXISTS tutor_name;
ALTER TABLE appointments DROP COLUMN IF EXISTS phone;
ALTER TABLE appointments DROP COLUMN IF EXISTS pet_name;
ALTER TABLE appointments DROP COLUMN IF EXISTS pet_breed;

-- Índices para performance
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_pet_id ON appointments(pet_id);
```

### 2.4 RLS (Row Level Security)

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Clients: usuários só veem clientes da mesma empresa
CREATE POLICY "Users can view company clients" ON clients
  FOR ALL USING (company_id = (auth.jwt()->>'company_id')::uuid);

-- Pets: herdado do client
CREATE POLICY "Users can view client pets" ON pets
  FOR ALL USING (client_id IN (
    SELECT id FROM clients WHERE company_id = (auth.jwt()->>'company_id')::uuid
  ));

-- Appointments: permite ver via company_id ou via client_id
-- (política existente verifica company_id)

-- Índices para busca rápida
CREATE INDEX idx_clients_company_name ON clients(company_id, name);
CREATE INDEX idx_clients_company_phone ON clients(company_id, phone);
CREATE INDEX idx_clients_company_email ON clients(company_id, email);
CREATE INDEX idx_pets_client_id ON pets(client_id);
```

---

## 3. UI/UX

### 3.1 Tela: Lista de Clientes (`/clients`)

**Componentes:**
- Header com título "Clientes" e botão de busca
- Campo de busca (filtra por nome, telefone, email)
- Lista de clientes em cards
  - Avatar com iniciais do nome
  - Nome do cliente
  - Telefone
  - Quantidade de pets (badge)
- FAB (Floating Action Button) para adicionar novo cliente

**Interações:**
- Toque no card → abre detalhes do cliente
- Toque no FAB → abre tela de cadastro
- Pull-to-refresh para recarregar lista
- Busca em tempo real (debounce 300ms)

### 3.2 Tela: Detalhes do Cliente

**Seção: Informações do Cliente**
- Nome, telefone, email, CPF, endereço
- Botão editar (abre tela de edição)
- Botão excluir (confirmação com modal)

**Seção: Pets**
- Lista de pets com nome, espécie, raça
- Botão "Adicionar Pet" (+)
- Toque no pet → abre edição do pet

**Seção: Agendamentos**
- Lista de agendamentos recentes deste cliente
-Data, serviço, status

### 3.3 Tela: Cadastro/Edição de Cliente

**Campos do formulário:**
| Campo | Tipo | Máscara | Obrigatório |
|-------|------|---------|-------------|
| Nome | text | - | Sim |
| Telefone | text | (00) 00000-0000 | Sim |
| Email | email | - | Não |
| CPF | text | 000.000.000-00 | Não |
| Endereço | text | - | Não |
| Observações | textarea | - | Não |

**Validações:**
- Nome: mínimo 2 caracteres
- Telefone: formato válido
- Email: formato válido (se preenchido)
- CPF: formato válido (se preenchido)

### 3.4 Tela/Modal: Cadastro/Edição de Pet

**Campos do formulário:**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome | text | Sim |
| Espécie | dropdown | Sim |
| Raça | text | Não |
| Peso | decimal | Não |
| Observações | textarea | Não |

**Opções de Espécie (valores minúsculos no banco):**
- cachorro
- gato
- outro

*Na UI, exibir com inicial maiúscula: "Cachorro", "Gato", "Outro"*

### 3.5 Tela: Novo Agendamento (atualizada)

**Alterações:**
- Substituir campos "Nome do tutor", "Telefone", "Nome do pet", "Raça"
- Adicionar dois dropdowns:
  1. **Cliente**: lista com busca (dropdown com search)
  2. **Pet**: lista filtrada pelos pets do cliente selecionado
- Se cliente não tiver pets, mostrar opção de cadastrar pet rapidamente

---

## 4. APIs

### 4.1 Clientes

```typescript
// Listar clientes da empresa
GET /rest/v1/clients?company_id=eq.{companyId}&order=name.asc

// Buscar clientes por termo (nome, telefone, email)
GET /rest/v1/clients?company_id=eq.{companyId}&or=(name.ilike.{term}*,phone.ilike.{term}*,email.ilike.{term}*)&order=name.asc

// Buscar cliente por ID
GET /rest/v1/clients?id=eq.{id}

// Criar cliente
POST /rest/v1/clients
{ company_id, name, phone, email?, cpf?, address?, notes? }

// Atualizar cliente
PATCH /rest/v1/clients?id=eq.{id}
{ name?, phone?, email?, cpf?, address?, notes?, updated_at: now() }

// Deletar cliente
DELETE /rest/v1/clients?id=eq.{id}
```

### 4.2 Pets

```typescript
// Listar pets de um cliente
GET /rest/v1/pets?client_id=eq.{clientId}&order=name.asc

// Buscar pet por ID
GET /rest/v1/pets?id=eq.{id}

// Criar pet
POST /rest/v1/pets
{ client_id, name, species, breed?, weight?, notes? }

// Atualizar pet
PATCH /rest/v1/pets?id=eq.{id}
{ name?, species?, breed?, weight?, notes?, updated_at: now() }

// Deletar pet
DELETE /rest/v1/pets?id=eq.{id}
```

### 4.3 Agendamentos (busca por cliente)

```typescript
// Listar agendamentos de um cliente
GET /rest/v1/appointments?client_id=eq.{clientId}&order=date.desc
```

---

## 5. Componentes Reutilizáveis

### 5.1 ClientCard
- Avatar com iniciais
- Nome, telefone
- Badge com quantidade de pets

### 5.2 PetCard
- Ícone de espécie
- Nome, raça
- Peso (se informado)

### 5.3 ClientPicker
- Dropdown com busca
- Mostra nome + telefone
- Filtro em tempo real

### 5.4 PetPicker
- Dropdown filtrado por cliente
- Mostra nome + espécie

---

## 6. Migração de Dados

Script SQL para migrar dados existentes de `appointments` para as novas tabelas:

```sql
-- 1. Criar clientes únicos por telefone (ignora duplicados)
INSERT INTO clients (company_id, name, phone)
SELECT DISTINCT company_id,
       COALESCE(tutor_name, 'Sem nome'),
       phone
FROM appointments
WHERE tutor_name IS NOT NULL
  AND phone IS NOT NULL
  AND phone != ''
ON CONFLICT DO NOTHING;

-- 2. Criar pets a partir de appointments (espécie padrão: cachorro)
INSERT INTO pets (client_id, name, species, breed)
SELECT c.id, a.pet_name, 'cachorro', a.pet_breed
FROM appointments a
JOIN clients c ON a.phone = c.phone AND a.company_id = c.company_id
WHERE a.pet_name IS NOT NULL AND a.pet_name != ''
ON CONFLICT DO NOTHING;

-- 3. Vincular appointments aos clientes (via phone)
UPDATE appointments a
SET client_id = c.id
FROM clients c
WHERE a.phone = c.phone
  AND a.company_id = c.company_id
  AND a.client_id IS NULL;

-- 4. Vincular appointments aos pets (via pet_name + client)
UPDATE appointments a
SET pet_id = p.id
FROM pets p
JOIN clients c ON p.client_id = c.id
WHERE a.client_id = c.id
  AND a.pet_name = p.name
  AND a.pet_id IS NULL;
```

**Nota:** Se preferir manter compatibilidade temporária, mantenha as colunas antigas e preencha as novas conforme agendamentos são editados.

---

## 7. Validações

### 7.1 CPF

```typescript
// Validar CPF (função para uso em formulários)
export const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10) digit1 = 0;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10) digit2 = 0;

  return digit1 === parseInt(cleaned[9]) && digit2 === parseInt(cleaned[10]);
};
```

---

## 8. Testes

### 8.1 Unitários
- Validação de CPF (usar função em utils/validation.ts)
- Validação de telefone
- Máscaras de formatação

### 8.2 Integração
- CRUD de clientes
- CRUD de pets
- Vinculação cliente-pet em agendamentos

### 8.3 E2E
- Fluxo completo: criar cliente → criar pet → criar agendamento
- Fluxo de edição e exclusão

---

## 9. Critérios de Aceite

- [ ] Tabelas clients e pets criadas no banco
- [ ] RLS configurado corretamente
- [ ] Tela de lista de clientes com busca funcionando
- [ ] Cadastro de cliente com validações
- [ ] Edição de cliente
- [ ] Exclusão de cliente (com confirmação)
- [ ] Cadastro de pets vinculados a cliente
- [ ] Edição de pets
- [ ] Exclusão de pets
- [ ] Tela de novo agendamento com dropdowns de cliente e pet
- [ ] Migrar dados existentes (ou manter compatibilidade)
- [ ] UI seguindo o design system existente (glass effect, cores) - ver [theme.ts](../../theme.ts)
