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
