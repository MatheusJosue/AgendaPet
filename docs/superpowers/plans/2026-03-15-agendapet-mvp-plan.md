# AgendaPet MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native (Expo) mobile app with Supabase backend for pet shop scheduling management.

**Architecture:**
- Frontend: React Native with Expo, expo-router for navigation
- Backend: Supabase (PostgreSQL + Auth)
- Multi-tenancy via Row Level Security (RLS)

**Tech Stack:** Expo SDK 52+, expo-router, Supabase, TypeScript

---

## File Structure

```
AgendaPetBack/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Auth screens
│   │   ├── invite.tsx            # Invite code screen
│   │   ├── register-company.tsx  # Company registration
│   │   ├── register-user.tsx     # User creation
│   │   └── login.tsx             # Login screen
│   ├── (app)/                    # Protected app screens
│   │   ├── _layout.tsx           # Tab bar layout
│   │   ├── index.tsx             # Dashboard
│   │   ├── new-appointment.tsx   # New appointment form
│   │   ├── clients.tsx           # Clients list
│   │   └── settings.tsx          # Settings
│   └── _index.tsx                # Root redirect
├── components/                    # Reusable components
│   ├── AppointmentCard.tsx       # Appointment list item
│   ├── Button.tsx                # Custom button
│   ├── Input.tsx                 # Custom input
│   └── Loading.tsx               # Loading spinner
├── lib/                          # Utilities
│   └── supabase.ts               # Supabase client
├── hooks/                        # Custom hooks
│   └── useAuth.ts                # Auth state hook
├── types/                        # TypeScript types
│   └── index.ts                  # Type definitions
├── docs/
│   └── superpowers/
│       ├── specs/                # Specs (already exists)
│       └── plans/                # Plans (this file)
└── package.json
```

---

## Chunk 1: Project Setup

### Task 1: Initialize Expo Project

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `tsconfig.json`
- Create: `babel.config.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "agendapet",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "@supabase/supabase-js": "^2.47.0",
    "@supabase/ssr": "^0.5.0",
    "expo-secure-store": "~14.0.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.3.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "~18.3.12",
    "typescript": "~5.3.3"
  }
}
```

- [ ] **Step 2: Create app.json**

```json
{
  "expo": {
    "name": "AgendaPet",
    "slug": "agendapet",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "agendapet",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ]
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 4: Create babel.config.js**

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`

- [ ] **Step 6: Commit**

```bash
git init
git add package.json app.json tsconfig.json babel.config.js
git commit -m "chore: initialize Expo project"
```

---

### Task 2: Setup Supabase Client

**Files:**
- Create: `lib/supabase.ts`

- [ ] **Step 1: Create lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Company = {
  id: string;
  name: string;
  phone: string;
  invite_code: string;
  plan_status: 'active' | 'inactive';
  created_at: string;
};

export type User = {
  id: string;
  company_id: string;
  email: string;
  role: 'admin' | 'employee';
  created_at: string;
};

export type Appointment = {
  id: string;
  company_id: string;
  tutor_name: string;
  phone: string;
  pet_name: string;
  pet_breed?: string;
  service: 'banho' | 'tosa';
  price: number;
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
};
```

- [ ] **Step 2: Create .env.example**

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase.ts .env.example
git commit -m "feat: add Supabase client and types"
```

---

## Chunk 2: Authentication Screens

### Task 3: Auth Navigation Layout

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Modify: `app/_index.tsx`

- [ ] **Step 1: Create app/(auth)/_layout.tsx**

```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
```

- [ ] **Step 2: Create app/_index.tsx (redirect)**

```typescript
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(auth)/invite" />;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/_layout.tsx app/_index.tsx
git commit -m "feat: add auth navigation layout"
```

---

### Task 4: Invite Code Screen

**Files:**
- Create: `app/(auth)/invite.tsx`
- Create: `components/Input.tsx`
- Create: `components/Button.tsx`

- [ ] **Step 1: Create components/Input.tsx**

```typescript
import React from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor="#999"
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#ff4444' },
  error: { color: '#ff4444', fontSize: 12, marginTop: 4 },
});
```

- [ ] **Step 2: Create components/Button.tsx**

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export function Button({ title, onPress, loading, variant = 'primary', style }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.secondary,
        style,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: '#4CAF50',
  },
});
```

- [ ] **Step 3: Create app/(auth)/invite.tsx**

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';

export default function InviteScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!code.trim()) {
      setError('Digite o código de convite');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('id, name, plan_status')
        .eq('invite_code', code.trim())
        .single();

      if (fetchError || !data) {
        setError('Código de convite inválido');
        return;
      }

      if (data.plan_status !== 'active') {
        setError('Empresa inativa. Entre em contato.');
        return;
      }

      // Store company_id for next step
      router.push({ pathname: '/(auth)/register-company', params: { companyId: data.id } });
    } catch (err) {
      setError('Erro ao validar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo ao AgendaPet</Text>
        <Text style={styles.subtitle}>Digite o código de convite da sua empresa</Text>

        <Input
          label="Código de convite"
          value={code}
          onChangeText={setCode}
          placeholder="Ex: PET2024"
          autoCapitalize="characters"
          error={error}
        />

        <Button title="Continuar" onPress={handleContinue} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
});
```

- [ ] **Step 4: Commit**

```bash
git add components/Input.tsx components/Button.tsx app/\(auth\)/invite.tsx
git commit -m "feat: add invite code screen"
```

---

### Task 5: Company Registration Screen

**Files:**
- Create: `app/(auth)/register-company.tsx`

- [ ] **Step 1: Create app/(auth)/register-company.tsx**

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';

export default function RegisterCompanyScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('Nome da empresa é obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('companies')
        .update({ name: name.trim(), phone: phone.trim() })
        .eq('id', companyId);

      if (updateError) throw updateError;

      router.push({ pathname: '/(auth)/register-user', params: { companyId } });
    } catch (err) {
      setError('Erro ao cadastrar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Cadastre sua empresa</Text>
        <Text style={styles.subtitle}>Informe os dados do petshop</Text>

        <Input
          label="Nome do petshop"
          value={name}
          onChangeText={setName}
          placeholder="Ex: Pet Shop Tudo de Bom"
          error={error}
        />

        <Input
          label="Telefone"
          value={phone}
          onChangeText={setPhone}
          placeholder="(11) 99999-9999"
          keyboardType="phone-pad"
        />

        <Button title="Continuar" onPress={handleRegister} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(auth\)/register-company.tsx
git commit -m "feat: add company registration screen"
```

---

### Task 6: User Registration Screen

**Files:**
- Create: `app/(auth)/register-user.tsx`

- [ ] **Step 1: Create app/(auth)/register-user.tsx**

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';

export default function RegisterUserScreen() {
  const { companyId } = router.params as { companyId: string };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      setError('Preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // Create user profile in users table
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        company_id: companyId,
        email: email.trim(),
        role: 'admin',
      });

      if (profileError) throw profileError;

      // Redirect to login (user needs to verify email or auto-login)
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>Você será o administrador</Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
        />

        <Input
          label="Confirmar senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Digite a senha novamente"
          secureTextEntry
          error={error}
        />

        <Button title="Criar conta" onPress={handleRegister} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(auth\)/register-user.tsx
git commit -m "feat: add user registration screen"
```

---

### Task 7: Login Screen

**Files:**
- Create: `app/(auth)/login.tsx`

- [ ] **Step 1: Create app/(auth)/login.tsx**

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Preencha email e senha');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      if (!data.user) {
        throw new Error('Erro ao fazer login');
      }

      // Check if user has company
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', data.user.id)
        .single();

      if (!userData?.company_id) {
        await supabase.auth.signOut();
        throw new Error('Usuário sem empresa associada');
      }

      router.replace('/(app)');
    } catch (err: any) {
      setError(err.message || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>AgendaPet</Text>
        <Text style={styles.subtitle}>Faça login para continuar</Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Sua senha"
          secureTextEntry
          error={error}
        />

        <Button title="Entrar" onPress={handleLogin} loading={loading} />

        <TouchableOpacity
          style={styles.link}
          onPress={() => router.push('/(auth)/invite')}
        >
          <Text style={styles.linkText}>Não tem conta? Solicite um convite</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#4CAF50', fontSize: 14 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(auth\)/login.tsx
git commit -m "feat: add login screen"
```

---

## Chunk 3: App Screens with Tab Navigation

### Task 8: App Tab Layout

**Files:**
- Create: `app/(app)/_layout.tsx`
- Modify: `app/_index.tsx` (to redirect based on auth state)

- [ ] **Step 1: Create useAuth hook**

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
}
```

- [ ] **Step 2: Create app/(app)/_layout.tsx**

```typescript
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        headerStyle: { backgroundColor: '#4CAF50' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Agenda',
          tabBarLabel: 'Agenda',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="new-appointment"
        options={{
          title: 'Novo',
          tabBarLabel: 'Novo',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>➕</Text>,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientes',
          tabBarLabel: 'Clientes',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👥</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config',
          tabBarLabel: 'Config',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 3: Update app/_index.tsx**

```typescript
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(app)" />;
}
```

- [ ] **Step 4: Commit**

```bash
git add hooks/useAuth.ts app/\(app\)/_layout.tsx app/_index.tsx
git commit -m "feat: add tab navigation layout"
```

---

### Task 9: Dashboard (Agenda) Screen

**Files:**
- Create: `app/(app)/index.tsx`
- Create: `components/AppointmentCard.tsx`
- Create: `components/Loading.tsx`

- [ ] **Step 1: Create components/Loading.tsx**

```typescript
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export function Loading() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
```

- [ ] **Step 2: Create components/AppointmentCard.tsx**

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Appointment } from '@/lib/supabase';

interface Props {
  appointment: Appointment;
  onPress?: () => void;
}

export function AppointmentCard({ appointment, onPress }: Props) {
  const statusColor = {
    scheduled: '#2196F3',
    completed: '#4CAF50',
    cancelled: '#F44336',
  }[appointment.status];

  const statusText = {
    scheduled: 'Agendado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  }[appointment.status];

  const serviceIcon = appointment.service === 'banho' ? '🚿' : '✂️';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.timeContainer}>
        <Text style={styles.time}>
          {new Date(appointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.petName}>{appointment.pet_name}</Text>
          <Text style={styles.service}>{serviceIcon} {appointment.service}</Text>
        </View>
        <Text style={styles.tutor}>{appointment.tutor_name}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>R$ {appointment.price.toFixed(2)}</Text>
          <View style={[styles.status, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeContainer: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    marginRight: 12,
  },
  time: { fontSize: 14, fontWeight: '600', color: '#333' },
  content: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  petName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  service: { fontSize: 14, color: '#666' },
  tutor: { fontSize: 14, color: '#666', marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  status: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 12, color: '#fff', fontWeight: '500' },
});
```

- [ ] **Step 3: Create app/(app)/index.tsx**

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase, Appointment } from '@/lib/supabase';
import { AppointmentCard } from '@/components/AppointmentCard';
import { Loading } from '@/components/Loading';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0, revenue: 0 });

  const fetchAppointments = async () => {
    try {
      // Get user's company
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!userData?.company_id) return;

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', userData.company_id)
        .gte('date', today.toISOString())
        .lt('date', tomorrow.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      setAppointments(data || []);

      // Calculate stats
      const completed = (data || []).filter(a => a.status === 'completed');
      const revenue = completed.reduce((sum, a) => sum + a.price, 0);
      setStats({
        total: data?.length || 0,
        completed: completed.length,
        revenue,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Hoje</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Concluídos</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>R$ {stats.revenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Faturado</Text>
        </View>
      </View>

      {/* Appointments List */}
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AppointmentCard appointment={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum agendamento para hoje</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  list: { paddingVertical: 8 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});
```

- [ ] **Step 4: Commit**

```bash
git add components/Loading.tsx components/AppointmentCard.tsx app/\(app\)/index.tsx
git commit -m "feat: add dashboard with today's appointments"
```

---

### Task 10: New Appointment Screen

**Files:**
- Create: `app/(app)/new-appointment.tsx`

- [ ] **Step 1: Create app/(app)/new-appointment.tsx**

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

type Service = 'banho' | 'tosa';

export default function NewAppointmentScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tutor_name: '',
    phone: '',
    pet_name: '',
    pet_breed: '',
    service: 'banho' as Service,
    price: '',
    date: '',
    time: '',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validation
    if (!form.tutor_name.trim() || !form.phone.trim() || !form.pet_name.trim() ||
        !form.date.trim() || !form.time.trim() || !form.price.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const price = parseFloat(form.price.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erro', 'Valor inválido');
      return;
    }

    setLoading(true);

    try {
      // Get user's company
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!userData?.company_id) throw new Error('Empresa não encontrada');

      // Combine date and time
      const dateTime = new Date(`${form.date}T${form.time}`);
      if (dateTime < new Date()) {
        Alert.alert('Erro', 'Data não pode ser no passado');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('appointments').insert({
        company_id: userData.company_id,
        tutor_name: form.tutor_name.trim(),
        phone: form.phone.trim(),
        pet_name: form.pet_name.trim(),
        pet_breed: form.pet_breed.trim() || null,
        service: form.service,
        price,
        date: dateTime.toISOString(),
        status: 'scheduled',
        notes: form.notes.trim() || null,
      });

      if (error) throw error;

      Alert.alert('Sucesso', 'Agendamento criado!', [
        { text: 'OK', onPress: () => router.push('/(app)') }
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Input
        label="Nome do tutor *"
        value={form.tutor_name}
        onChangeText={(v) => updateField('tutor_name', v)}
        placeholder="João Silva"
      />

      <Input
        label="Telefone *"
        value={form.phone}
        onChangeText={(v) => updateField('phone', v)}
        placeholder="(11) 99999-9999"
        keyboardType="phone-pad"
      />

      <Input
        label="Nome do pet *"
        value={form.pet_name}
        onChangeText={(v) => updateField('pet_name', v)}
        placeholder="Rex"
      />

      <Input
        label="Raça"
        value={form.pet_breed}
        onChangeText={(v) => updateField('pet_breed', v)}
        placeholder="Golden Retriever"
      />

      <Text style={styles.label}>Serviço *</Text>
      <View style={styles.serviceRow}>
        <Button
          title="🚿 Banho"
          onPress={() => updateField('service', 'banho')}
          variant={form.service === 'banho' ? 'primary' : 'secondary'}
          style={styles.serviceBtn}
        />
        <Button
          title="✂️ Tosa"
          onPress={() => updateField('service', 'tosa')}
          variant={form.service === 'tosa' ? 'primary' : 'secondary'}
          style={styles.serviceBtn}
        />
      </View>

      <Input
        label="Data *"
        value={form.date}
        onChangeText={(v) => updateField('date', v)}
        placeholder="2024-12-31"
      />

      <Input
        label="Hora *"
        value={form.time}
        onChangeText={(v) => updateField('time', v)}
        placeholder="14:30"
      />

      <Input
        label="Valor *"
        value={form.price}
        onChangeText={(v) => updateField('price', v)}
        placeholder="50,00"
        keyboardType="decimal-pad"
      />

      <Input
        label="Observações"
        value={form.notes}
        onChangeText={(v) => updateField('notes', v)}
        placeholder="Observações adicionais..."
        multiline
        numberOfLines={3}
      />

      <Button title="Salvar Agendamento" onPress={handleSave} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  serviceRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  serviceBtn: { flex: 1 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/new-appointment.tsx
git commit -m "feat: add new appointment form"
```

---

### Task 11: Clients Placeholder Screen

**Files:**
- Create: `app/(app)/clients.tsx`

- [ ] **Step 1: Create app/(app)/clients.tsx**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ClientsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clientes</Text>
      <Text style={styles.subtitle}>Funcionalidade em breve</Text>
      <Text style={styles.description}>
        Nesta versão, os clientes são cadastrados automaticamente junto com o agendamento.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 16 },
  description: { textAlign: 'center', color: '#999' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/clients.tsx
git commit -m "feat: add clients placeholder screen"
```

---

### Task 12: Settings Screen

**Files:**
- Create: `app/(app)/settings.tsx`

- [ ] **Step 1: Create app/(app)/settings.tsx**

```typescript
import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.email?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>Administrador</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoLabel}>Email</Text>
        <Text style={styles.infoValue}>{user?.email}</Text>
      </View>

      <Button title="Sair" onPress={handleSignOut} variant="secondary" style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  profile: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  email: { fontSize: 18, fontWeight: '600', color: '#333' },
  role: { fontSize: 14, color: '#666', marginTop: 4 },
  info: { marginBottom: 24 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  infoValue: { fontSize: 16, color: '#333' },
  button: { marginTop: 'auto' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/settings.tsx
git commit -m "feat: add settings screen"
```

---

## Chunk 4: Supabase Backend Setup

### Task 13: Supabase SQL Schema

**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 1: Create supabase/schema.sql**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (links to Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  tutor_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  pet_breed TEXT,
  service TEXT NOT NULL CHECK (service IN ('banho', 'tosa')),
  price DECIMAL(10,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Companies: users can only see their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Users: users can only see users from their company
CREATE POLICY "Users can view company users" ON users
  FOR SELECT USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Appointments: users can only see appointments from their company
CREATE POLICY "Users can view company appointments" ON appointments
  FOR ALL USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Index for faster queries
CREATE INDEX idx_appointments_company_date ON appointments(company_id, date);
CREATE INDEX idx_users_company ON users(company_id);

-- Function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  code := 'PET' || upper(substring(md5(random()::text) from 1 for 6));
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Example: Insert a test company
-- INSERT INTO companies (name, phone, invite_code) VALUES ('Pet Shop Teste', '(11) 99999-9999', generate_invite_code());
```

- [ ] **Step 2: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase SQL schema with RLS"
```

---

## Summary

This plan covers:

1. **Project Setup** - Expo + TypeScript + Supabase client
2. **Auth Screens** - Invite code, company registration, user registration, login
3. **App Screens** - Tab navigation with Dashboard, New Appointment, Clients (placeholder), Settings
4. **Backend** - Supabase schema with RLS for multi-tenancy

### Total Tasks: 13
### Total Commits: ~13

---

## Execution

**Next Step:** Execute this plan using superpowers:subagent-driven-development
