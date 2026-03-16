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
