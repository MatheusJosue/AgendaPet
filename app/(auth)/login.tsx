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
