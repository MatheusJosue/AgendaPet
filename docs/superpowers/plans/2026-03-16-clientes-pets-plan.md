# Clientes e Pets Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar sistema completo de clientes e pets com CRUD, integração com agendamentos e migração de dados existentes.

**Architecture:** duas tabelas (clients, pets) no Supabase com RLS, telas React Native com componentes reutilizáveis, integração com tela de agendamento existente.

**Tech Stack:** React Native (Expo), Supabase (PostgreSQL + RLS), TypeScript

---

## Chunk 1: Banco de Dados

### Task 1: Criar tabelas e políticas

**Files:**
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Adicionar SQL das novas tabelas ao schema**

Adicionar após a seção de appointments (após linha 80):

```sql
-- Tabela clients
CREATE TABLE IF NOT EXISTS clients (
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

-- Tabela pets
CREATE TABLE IF NOT EXISTS pets (
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

- [ ] **Step 2: Adicionar colunas FK em appointments**

```sql
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS pet_id UUID REFERENCES pets(id);

CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_pet_id ON appointments(pet_id);
```

- [ ] **Step 3: Adicionar RLS para clients e pets**

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view company clients" ON clients;
CREATE POLICY "Users can view company clients" ON clients
  FOR ALL USING (company_id = (auth.jwt()->>'company_id')::uuid);

DROP POLICY IF EXISTS "Users can view client pets" ON pets;
CREATE POLICY "Users can view client pets" ON pets
  FOR ALL USING (client_id IN (
    SELECT id FROM clients WHERE company_id = (auth.jwt()->>'company_id')::uuid
  ));
```

- [ ] **Step 4: Adicionar índices para busca em clients**

```sql
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_id, name);
CREATE INDEX IF NOT EXISTS idx_clients_company_phone ON clients(company_id, phone);
CREATE INDEX IF NOT EXISTS idx_clients_company_email ON clients(company_id, email);
CREATE INDEX IF NOT EXISTS idx_pets_client_id ON pets(client_id);
```

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add clients and pets tables with RLS"
```

---

### Task 2: Script de migração de dados

**Files:**
- Create: `supabase/migrate-clients-pets.sql`

- [ ] **Step 1: Criar script de migração**

```sql
-- Migrar dados de appointments para clients e pets
-- Este script deve ser executado uma vez após as tabelas existirem

-- 1. Criar clientes únicos por telefone
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

- [ ] **Step 2: Commit**

```bash
git add supabase/migrate-clients-pets.sql
git commit -m "feat: add data migration script for clients and pets"
```

---

## Chunk 2: Utilitários

### Task 3: Validações e máscaras

**Files:**
- Create: `lib/validation.ts`

- [ ] **Step 1: Criar arquivo de validações**

```typescript
// lib/validation.ts

// Validação de CPF
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

// Mask para telefone
export const maskPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

// Mask para CPF
export const maskCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

// Mask para CEP
export const maskCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
};

// Validar email
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/validation.ts
git commit -m "feat: add validation utilities (CPF, phone, email)"
```

---

## Chunk 3: Componentes Reutilizáveis

### Task 4: ClientCard

**Files:**
- Create: `components/ClientCard.tsx`

- [ ] **Step 1: Criar componente ClientCard**

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, glassStyle } from '@/theme';

interface ClientCardProps {
  name: string;
  phone: string;
  petsCount: number;
  onPress: () => void;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const ClientCard: React.FC<ClientCardProps> = ({
  name,
  phone,
  petsCount,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{getInitials(name)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.phone}>{phone}</Text>
      </View>
      {petsCount > 0 && (
        <View style={styles.badge}>
          <Ionicons name="paw" size={12} color={colors.primary} />
          <Text style={styles.badgeText}>{petsCount}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    ...glassStyle,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: fontSize.md,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  phone: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginRight: spacing.sm,
    gap: 4,
  },
  badgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/ClientCard.tsx
git commit -m "feat: add ClientCard component"
```

---

### Task 5: PetCard

**Files:**
- Create: `components/PetCard.tsx`

- [ ] **Step 1: Criar componente PetCard**

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, glassStyle } from '@/theme';

type Species = 'cachorro' | 'gato' | 'outro';

interface PetCardProps {
  name: string;
  species: Species;
  breed?: string;
  weight?: number;
  onPress: () => void;
}

const speciesIcons: Record<Species, string> = {
  cachorro: 'dog',
  gato: 'cat',
  outro: 'ellipse',
};

const speciesLabels: Record<Species, string> = {
  cachorro: 'Cachorro',
  gato: 'Gato',
  outro: 'Outro',
};

export const PetCard: React.FC<PetCardProps> = ({
  name,
  species,
  breed,
  weight,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={speciesIcons[species] as any}
          size={24}
          color={colors.primary}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.details}>
          {speciesLabels[species]}{breed ? ` • ${breed}` : ''}
        </Text>
        {weight && (
          <Text style={styles.weight}>{weight} kg</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    ...glassStyle,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  details: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  weight: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/PetCard.tsx
git commit -m "feat: add PetCard component"
```

---

### Task 6: ClientPicker e PetPicker

**Files:**
- Create: `components/ClientPicker.tsx`
- Create: `components/PetPicker.tsx`

- [ ] **Step 1: Criar ClientPicker**

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, glassStyle } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface ClientPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
}

export const ClientPicker: React.FC<ClientPickerProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadClients();
    }
  }, [visible, user]);

  useEffect(() => {
    if (search.trim()) {
      const term = search.toLowerCase();
      setFilteredClients(
        clients.filter(
          c =>
            c.name.toLowerCase().includes(term) ||
            c.phone.includes(term)
        )
      );
    } else {
      setFilteredClients(clients);
    }
  }, [search, clients]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!userData?.company_id) return;

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, phone')
        .eq('company_id', userData.company_id)
        .order('name');

      if (!error && data) {
        setClients(data);
        setFilteredClients(data);
      }
    } catch (e) {
      console.error('Error loading clients:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        onSelect(item);
        onClose();
        setSearch('');
      }}
    >
      <View style={styles.itemAvatar}>
        <Text style={styles.itemInitials}>
          {item.name.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPhone}>{item.phone}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Selecionar Cliente</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar cliente..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <FlatList
            data={filteredClients}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {loading ? 'Carregando...' : 'Nenhum cliente encontrado'}
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.glassBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  searchInput: {
    flex: 1,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInitials: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: fontSize.sm,
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  itemPhone: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: spacing.xl,
  },
});
```

- [ ] **Step 2: Criar PetPicker**

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '@/theme';
import { supabase } from '@/lib/supabase';

type Species = 'cachorro' | 'gato' | 'outro';

interface Pet {
  id: string;
  name: string;
  species: Species;
  breed?: string;
}

interface PetPickerProps {
  visible: boolean;
  clientId: string | null;
  onClose: () => void;
  onSelect: (pet: Pet) => void;
  onAddNew?: () => void;
}

const speciesIcons: Record<Species, string> = {
  cachorro: 'dog',
  gato: 'cat',
  outro: 'ellipse',
};

export const PetPicker: React.FC<PetPickerProps> = ({
  visible,
  clientId,
  onClose,
  onSelect,
  onAddNew,
}) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && clientId) {
      loadPets();
    }
  }, [visible, clientId]);

  const loadPets = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species, breed')
        .eq('client_id', clientId)
        .order('name');

      if (!error && data) {
        setPets(data);
      }
    } catch (e) {
      console.error('Error loading pets:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Pet }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <View style={styles.itemIcon}>
        <Ionicons
          name={speciesIcons[item.species] as any}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.breed && (
          <Text style={styles.itemBreed}>{item.breed}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Selecionar Pet</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={pets}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.empty}>
                  {loading ? 'Carregando...' : 'Nenhum pet encontrado'}
                </Text>
                {onAddNew && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      onClose();
                      onAddNew();
                    }}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Cadastrar novo pet</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.glassBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  itemBreed: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    gap: spacing.sm,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add components/ClientPicker.tsx components/PetPicker.tsx
git commit -m "feat: add ClientPicker and PetPicker components"
```

---

## Chunk 4: Telas de Clientes

### Task 7: Lista de Clientes

**Files:**
- Modify: `app/(app)/clients.tsx`

- [ ] **Step 1: Substituir tela de clientes pela lista completa**

Substituir todo o conteúdo do arquivo por:

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, glassStyle } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ClientCard } from '@/components/ClientCard';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export default function ClientsScreen() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!userData?.company_id) return;

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, phone, email')
        .eq('company_id', userData.company_id)
        .order('name');

      if (!error && data) {
        setClients(data);
        setFilteredClients(data);
      }
    } catch (e) {
      console.error('Error loading clients:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (search.trim()) {
      const term = search.toLowerCase();
      setFilteredClients(
        clients.filter(
          c =>
            c.name.toLowerCase().includes(term) ||
            c.phone.includes(term) ||
            (c.email && c.email.toLowerCase().includes(term))
        )
      );
    } else {
      setFilteredClients(clients);
    }
  }, [search, clients]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const renderItem = ({ item }: { item: Client }) => (
    <ClientCard
      name={item.name}
      phone={item.phone}
      petsCount={0}
      onPress={() => router.push(`/(app)/client/${item.id}`)}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGradient}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {loading ? 'Carregando...' : 'Nenhum cliente encontrado'}
            </Text>
            {!loading && (
              <Text style={styles.emptySubtext}>
                Toque no botão + para adicionar
              </Text>
            )}
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/new-client')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primary,
    opacity: 0.15,
    top: -80,
    right: -60,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.secondary,
    opacity: 0.1,
    bottom: 150,
    left: -40,
  },
  orb3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.accent,
    opacity: 0.1,
    bottom: -50,
    right: 50,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  searchInput: {
    flex: 1,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/clients.tsx
git commit -m "feat: implement clients list screen with search"
```

---

### Task 8: Cadastro de Cliente

**Files:**
- Create: `app/(app)/new-client.tsx`

- [ ] **Step 1: Criar tela de novo cliente**

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { maskPhone, maskCPF, validateCPF, validateEmail } from '@/lib/validation';
import { colors, spacing, fontSize, glassStyle } from '@/theme';

export default function NewClientScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    cpf: '',
    address: '',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    let maskedValue = value;
    if (field === 'phone') maskedValue = maskPhone(value);
    if (field === 'cpf') maskedValue = maskCPF(value);
    setForm(prev => ({ ...prev, [field]: maskedValue }));
  };

  const validate = (): boolean => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      setErrorMessage('Nome deve ter pelo menos 2 caracteres');
      setShowError(true);
      return false;
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Telefone inválido');
      setShowError(true);
      return false;
    }
    if (form.email && !validateEmail(form.email)) {
      setErrorMessage('Email inválido');
      setShowError(true);
      return false;
    }
    if (form.cpf && form.cpf.replace(/\D/g, '').length === 11 && !validateCPF(form.cpf)) {
      setErrorMessage('CPF inválido');
      setShowError(true);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!userData?.company_id) {
        throw new Error('Empresa não encontrada');
      }

      const { error } = await supabase.from('clients').insert({
        company_id: userData.company_id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        cpf: form.cpf.replace(/\D/g, '') || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      });

      if (error) throw error;

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar cliente');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGradient}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Novo Cliente</Text>
          </View>

          <View style={styles.card}>
            <Input
              label="Nome *"
              value={form.name}
              onChangeText={v => updateField('name', v)}
              placeholder="João Silva"
            />

            <Input
              label="Telefone *"
              value={form.phone}
              onChangeText={v => updateField('phone', v)}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              maxLength={15}
            />

            <Input
              label="Email"
              value={form.email}
              onChangeText={v => updateField('email', v)}
              placeholder="joao@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="CPF"
              value={form.cpf}
              onChangeText={v => updateField('cpf', v)}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              maxLength={14}
            />

            <Input
              label="Endereço"
              value={form.address}
              onChangeText={v => updateField('address', v)}
              placeholder="Rua, número, bairro"
            />

            <Input
              label="Observações"
              value={form.notes}
              onChangeText={v => updateField('notes', v)}
              placeholder="Observações..."
              multiline
              numberOfLines={3}
            />

            <Button
              title="Salvar Cliente"
              onPress={handleSave}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.feedbackIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={colors.accent} />
            </View>
            <Text style={styles.feedbackTitle}>Sucesso!</Text>
            <Text style={styles.feedbackMessage}>Cliente criado com sucesso</Text>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => {
                setShowSuccess(false);
                router.back();
              }}
            >
              <Text style={styles.feedbackButtonText}>Voltar para Clientes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showError} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.feedbackIconContainer, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="alert-circle" size={64} color={colors.error} />
            </View>
            <Text style={styles.feedbackTitle}>Ops!</Text>
            <Text style={styles.feedbackMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.feedbackButton, { backgroundColor: colors.error }]}
              onPress={() => setShowError(false)}
            >
              <Text style={styles.feedbackButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primary,
    opacity: 0.15,
    top: -80,
    right: -60,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.secondary,
    opacity: 0.1,
    bottom: 150,
    left: -40,
  },
  orb3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.accent,
    opacity: 0.1,
    bottom: -50,
    right: 50,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  card: {
    ...glassStyle,
    padding: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    ...glassStyle,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  feedbackIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  feedbackTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  feedbackMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  feedbackButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    width: '100%',
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/new-client.tsx
git commit -m "feat: add new client screen"
```

---

### Task 9: Detalhes e Edição de Cliente

**Files:**
- Create: `app/(app)/client/[id].tsx`

- [ ] **Step 1: Criar diretório e tela de detalhes do cliente**

Criar diretório `app/(app)/client/` e arquivo `[id].tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { PetCard } from '@/components/PetCard';
import { maskPhone, maskCPF, validateCPF, validateEmail } from '@/lib/validation';
import { colors, spacing, fontSize, glassStyle } from '@/theme';

type Species = 'cachorro' | 'gato' | 'outro';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  address?: string;
  notes?: string;
}

interface Pet {
  id: string;
  name: string;
  species: Species;
  breed?: string;
  weight?: number;
}

const SPECIES_OPTIONS: { value: Species; label: string }[] = [
  { value: 'cachorro', label: 'Cachorro' },
  { value: 'gato', label: 'Gato' },
  { value: 'outro', label: 'Outro' },
];

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Client>({} as Client);
  const [saving, setSaving] = useState(false);

  // Pet modal
  const [showPetModal, setShowPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'cachorro' as Species,
    breed: '',
    weight: '',
    notes: '',
  });
  const [savingPet, setSavingPet] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (clientData) {
        setClient(clientData);
        setEditForm(clientData);
      }

      const { data: petsData } = await supabase
        .from('pets')
        .select('*')
        .eq('client_id', id)
        .order('name');

      if (petsData) setPets(petsData);
    } catch (e) {
      console.error('Error loading client:', e);
      Alert.alert('Erro', 'Cliente não encontrado');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async () => {
    if (!editForm.name.trim() || editForm.name.trim().length < 2) {
      Alert.alert('Erro', 'Nome deve ter pelo menos 2 caracteres');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email?.trim() || null,
          cpf: editForm.cpf?.replace(/\D/g, '') || null,
          address: editForm.address?.trim() || null,
          notes: editForm.notes?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      setClient(editForm);
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = () => {
    Alert.alert(
      'Excluir Cliente',
      'Tem certeza que deseja excluir este cliente? Isso também excluirá todos os pets vinculados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('clients').delete().eq('id', id);
              router.back();
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível excluir');
            }
          },
        },
      ]
    );
  };

  const handleSavePet = async () => {
    if (!petForm.name.trim()) {
      Alert.alert('Erro', 'Nome do pet é obrigatório');
      return;
    }

    setSavingPet(true);
    try {
      const petData = {
        client_id: id,
        name: petForm.name.trim(),
        species: petForm.species,
        breed: petForm.breed.trim() || null,
        weight: petForm.weight ? parseFloat(petForm.weight) : null,
        notes: petForm.notes.trim() || null,
      };

      if (editingPet) {
        await supabase
          .from('pets')
          .update({ ...petData, updated_at: new Date().toISOString() })
          .eq('id', editingPet.id);
      } else {
        await supabase.from('pets').insert(petData);
      }

      setShowPetModal(false);
      setEditingPet(null);
      setPetForm({ name: '', species: 'cachorro', breed: '', weight: '', notes: '' });
      loadData();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSavingPet(false);
    }
  };

  const handleDeletePet = (petId: string) => {
    Alert.alert('Excluir Pet', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('pets').delete().eq('id', petId);
          loadData();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGradient}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{editing ? 'Editar Cliente' : client?.name}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            if (editing) {
              setEditForm(client!);
            }
            setEditing(!editing);
          }}
        >
          <Ionicons
            name={editing ? 'close' : 'create'}
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {editing ? (
          <View style={styles.card}>
            <Input
              label="Nome *"
              value={editForm.name}
              onChangeText={v => setEditForm(p => ({ ...p, name: v }))}
            />
            <Input
              label="Telefone *"
              value={editForm.phone}
              onChangeText={v => setEditForm(p => ({ ...p, phone: maskPhone(v) }))}
              keyboardType="phone-pad"
              maxLength={15}
            />
            <Input
              label="Email"
              value={editForm.email || ''}
              onChangeText={v => setEditForm(p => ({ ...p, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="CPF"
              value={editForm.cpf || ''}
              onChangeText={v => setEditForm(p => ({ ...p, cpf: maskCPF(v) }))}
              keyboardType="numeric"
              maxLength={14}
            />
            <Input
              label="Endereço"
              value={editForm.address || ''}
              onChangeText={v => setEditForm(p => ({ ...p, address: v }))}
            />
            <Input
              label="Observações"
              value={editForm.notes || ''}
              onChangeText={v => setEditForm(p => ({ ...p, notes: v }))}
              multiline
              numberOfLines={3}
            />
            <Button title="Salvar" onPress={handleSaveClient} loading={saving} />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={colors.primary} />
              <Text style={styles.infoText}>{client?.phone}</Text>
            </View>
            {client?.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color={colors.primary} />
                <Text style={styles.infoText}>{client.email}</Text>
              </View>
            )}
            {client?.cpf && (
              <View style={styles.infoRow}>
                <Ionicons name="card" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  {maskCPF(client.cpf)}
                </Text>
              </View>
            )}
            {client?.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={styles.infoText}>{client.address}</Text>
              </View>
            )}
            {client?.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Observações</Text>
                <Text style={styles.notesText}>{client.notes}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteClient}>
              <Ionicons name="trash" size={20} color={colors.error} />
              <Text style={styles.deleteText}>Excluir Cliente</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pets ({pets.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingPet(null);
                setPetForm({ name: '', species: 'cachorro', breed: '', weight: '', notes: '' });
                setShowPetModal(true);
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Novo Pet</Text>
            </TouchableOpacity>
          </View>

          {pets.map(pet => (
            <PetCard
              key={pet.id}
              name={pet.name}
              species={pet.species}
              breed={pet.breed}
              weight={pet.weight}
              onPress={() => {
                setEditingPet(pet);
                setPetForm({
                  name: pet.name,
                  species: pet.species,
                  breed: pet.breed || '',
                  weight: pet.weight?.toString() || '',
                  notes: pet.notes || '',
                });
                setShowPetModal(true);
              }}
            />
          ))}

          {pets.length === 0 && (
            <View style={styles.emptyPets}>
              <Text style={styles.emptyPetsText}>Nenhum pet cadastrado</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pet Modal */}
      <Modal visible={showPetModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowPetModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPet ? 'Editar Pet' : 'Novo Pet'}
              </Text>
              {editingPet && (
                <TouchableOpacity onPress={() => handleDeletePet(editingPet.id)}>
                  <Ionicons name="trash" size={24} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>

            <Input
              label="Nome *"
              value={petForm.name}
              onChangeText={v => setPetForm(p => ({ ...p, name: v }))}
              placeholder="Nome do pet"
            />

            <Text style={styles.inputLabel}>Espécie *</Text>
            <View style={styles.speciesOptions}>
              {SPECIES_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.speciesOption,
                    petForm.species === opt.value && styles.speciesOptionSelected,
                  ]}
                  onPress={() => setPetForm(p => ({ ...p, species: opt.value }))}
                >
                  <Text
                    style={[
                      styles.speciesOptionText,
                      petForm.species === opt.value && styles.speciesOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Raça"
              value={petForm.breed}
              onChangeText={v => setPetForm(p => ({ ...p, breed: v }))}
              placeholder="Raça"
            />

            <Input
              label="Peso (kg)"
              value={petForm.weight}
              onChangeText={v => setPetForm(p => ({ ...p, weight: v.replace(/[^0-9.]/g, '') }))}
              placeholder="0.0"
              keyboardType="decimal-pad"
            />

            <Input
              label="Observações"
              value={petForm.notes}
              onChangeText={v => setPetForm(p => ({ ...p, notes: v }))}
              placeholder="Alergias, cuidados..."
              multiline
              numberOfLines={2}
            />

            <Button
              title={editingPet ? 'Salvar' : 'Adicionar Pet'}
              onPress={handleSavePet}
              loading={savingPet}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primary,
    opacity: 0.15,
    top: -80,
    right: -60,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.secondary,
    opacity: 0.1,
    bottom: 150,
    left: -40,
  },
  orb3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.accent,
    opacity: 0.1,
    bottom: -50,
    right: 50,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  editButton: {
    padding: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  card: {
    ...glassStyle,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  infoText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  notesContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.glass,
    borderRadius: 12,
  },
  notesLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    gap: spacing.sm,
  },
  deleteText: {
    color: colors.error,
    fontSize: fontSize.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    gap: spacing.xs,
  },
  addButtonText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyPets: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyPetsText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.glassBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  speciesOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  speciesOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  speciesOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  speciesOptionText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  speciesOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/client/\[id\].tsx
git commit -m "feat: add client detail screen with edit and pets management"
```

---

## Chunk 5: Integração com Agendamento

### Task 10: Atualizar tela de novo agendamento

**Files:**
- Modify: `app/(app)/new-appointment.tsx`

- [ ] **Step 1: Substituir campos de cliente por pickers**

Encontrar e substituir a seção de campos do cliente (após linha 228):

```tsx
          {/* Seleção de Cliente */}
          <Text style={styles.label}>Cliente *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowClientPicker(true)}
          >
            <Ionicons name="person" size={20} color={colors.primary} />
            <Text style={[styles.pickerText, !selectedClient && styles.pickerPlaceholder]}>
              {selectedClient?.name || 'Selecionar cliente'}
            </Text>
          </TouchableOpacity>

          {/* Seleção de Pet */}
          {selectedClient && (
            <>
              <Text style={styles.label}>Pet *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPetPicker(true)}
              >
                <Ionicons name="paw" size={20} color={colors.primary} />
                <Text style={[styles.pickerText, !selectedPet && styles.pickerPlaceholder]}>
                  {selectedPet?.name || 'Selecionar pet'}
                </Text>
              </TouchableOpacity>
            </>
          )}
```

Adicionar imports e estados necessários (no início do componente):

```tsx
import { ClientPicker } from '@/components/ClientPicker';
import { PetPicker } from '@/components/PetPicker';

// Depois dos estados existentes, adicionar:
const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null);
const [selectedPet, setSelectedPet] = useState<{ id: string; name: string } | null>(null);
const [showClientPicker, setShowClientPicker] = useState(false);
const [showPetPicker, setShowPetPicker] = useState(false);
```

Adicionar componentes ClientPicker e PetPicker antes dos outros modais:

```tsx
      <ClientPicker
        visible={showClientPicker}
        onClose={() => setShowClientPicker(false)}
        onSelect={(client) => {
          setSelectedClient(client);
          setSelectedPet(null);
        }}
      />

      <PetPicker
        visible={showPetPicker}
        clientId={selectedClient?.id || null}
        onClose={() => setShowPetPicker(false)}
        onSelect={(pet) => setSelectedPet(pet)}
        onAddNew={() => router.push(`/client/${selectedClient?.id}`)}
      />
```

Adicionar estilos:

```tsx
  pickerPlaceholder: {
    color: colors.textMuted,
  },
```

- [ ] **Step 2: Modificar handleSave para usar client_id e pet_id**

No handleSave, substituir a validação e inserção de tutor_name/phone/pet_name:

```tsx
  const handleSave = async () => {
    // Validar cliente e pet
    if (!selectedClient) {
      setErrorMessage('Selecione um cliente');
      setShowErrorModal(true);
      return;
    }

    if (!selectedPet) {
      setErrorMessage('Selecione um pet');
      setShowErrorModal(true);
      return;
    }

    // ... resto da validação existente ...

    // No insert, substituir:
    const { error } = await supabase.from("appointments").insert({
      company_id: userData.company_id,
      client_id: selectedClient.id,
      pet_id: selectedPet.id,
      service: selectedServices.join(","),
      price,
      date: dateObj.toISOString(),
      status: "scheduled",
      notes: form.notes.trim() || null,
    });
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/new-appointment.tsx
git commit -m "feat: integrate client and pet pickers in appointment form"
```

---

## Chunk 6: Router

### Task 11: Configurar rotas

**Files:**
- Modify: `app/(app)/_layout.tsx` ou equivalente

- [ ] **Step 1: Verificar configuração de rotas existente**

Verificar como as rotas estão configuradas no projeto.

- [ ] **Step 2: Garantir que novas telas sejam acessívels**

A estrutura de rotas do Expo Router deve automaticamente detectar os novos arquivos:
- `app/(app)/clients.tsx` - lista de clientes
- `app/(app)/new-client.tsx` - novo cliente
- `app/(app)/client/[id].tsx` - detalhes do cliente

Se necessário, adicionar manualmente.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/_layout.tsx
git commit -m "chore: ensure new client routes are accessible"
```

---

## Chunk 7: Migração (Opcional)

### Task 12: Executar migração de dados

**Files:**
- Executar: `supabase/migrate-clients-pets.sql`

- [ ] **Step 1: Executar script de migração**

Executar o script via SQL Editor do Supabase Dashboard ou via CLI:

```bash
npx supabase db execute --file supabase/migrate-clients-pets.sql
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: execute data migration for clients and pets"
```

---

## Resumo de Arquivos

**Criar:**
- `lib/validation.ts`
- `components/ClientCard.tsx`
- `components/PetCard.tsx`
- `components/ClientPicker.tsx`
- `components/PetPicker.tsx`
- `app/(app)/new-client.tsx`
- `app/(app)/client/[id].tsx`
- `supabase/migrate-clients-pets.sql`

**Modificar:**
- `supabase/schema.sql`
- `app/(app)/clients.tsx`
- `app/(app)/new-appointment.tsx`
- `app/(app)/edit-appointment.tsx`

---

## Chunk 7: Edit Appointment

### Task 13: Atualizar tela de edição de agendamento

**Files:**
- Modify: `app/(app)/edit-appointment.tsx`

- [ ] **Step 1: Ler o arquivo existente**

Verificar como o edit-appointment está implementado atualmente.

- [ ] **Step 2: Adicionar ClientPicker e PetPicker**

Similar ao new-appointment.tsx:
- Adicionar estados para selectedClient e selectedPet
- Adicionar ClientPicker e PetPicker
- Carregar dados do cliente/pet na inicialização

- [ ] **Step 3: Modificar para usar client_id e pet_id**

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/edit-appointment.tsx
git commit -m "feat: integrate client and pet in edit appointment"
```

---

## Testing Strategy

### Unit Tests

**lib/validation.ts**
- [ ] Testar validateCPF com CPFs válidos
- [ ] Testar validateCPF com CPFs inválidos
- [ ] Testar maskPhone com diferentes formatos
- [ ] Testar maskCPF
- [ ] Testar validateEmail

**components/**
- [ ] Testar ClientCard renderização
- [ ] Testar PetCard renderização

### Integration Tests

- [ ] Fluxo: criar cliente → criar pet → criar agendamento
- [ ] Fluxo: editar cliente e verificar atualização
- [ ] Fluxo: editar pet e verificar atualização
- [ ] Verificar integridade após migração de dados

### E2E Tests

- [ ] Criar novo cliente com todos os campos
- [ ] Editar dados de cliente
- [ ] Excluir cliente (com pets)
- [ ] Criar pet vinculado a cliente
- [ ] Criar agendamento selecionando cliente e pet
- [ ] Editar agendamento

---

## Riscos e Mitigações

### Risco: Migração de dados falha

**Mitigação:**
1. Criar backup antes da migração
2. Executar migração em transação
3. Criar script de rollback

### Risco: Dados legados não migrarem corretamente

**Mitigação:**
1. Manter colunas antigas (tutor_name, phone, pet_name, pet_breed) temporariamente
2. Novos agendamentos usam client_id/pet_id
3. Agendamentos antigos mantêm dados nas colunas legadas
4. Migração gradual conforme agendamentos são editados

---

## Success Criteria

- [ ] Usuário pode criar/editar/excluir clientes
- [ ] Usuário pode criar/editar/excluir pets vinculados a clientes
- [ ] Agendamento vincula cliente e pet corretamente
- [ ] Dados existentes migrados com sucesso
- [ ] Cobertura de testes >= 80%
- [ ] Tela de editar agendamento também funciona com clientes/pets
