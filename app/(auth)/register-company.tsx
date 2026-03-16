import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { Background } from '@/components/Background';
import { colors, fontSize, glassStyle } from '@/theme';

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
    <Background>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.emoji}>🏪</Text>
            <Text style={styles.title}>Cadastre sua empresa</Text>
            <Text style={styles.subtitle}>Informe os dados do petshop</Text>
          </View>

          <View style={styles.glassCard}>
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
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 50,
    marginBottom: 16,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  glassCard: {
    ...glassStyle,
    padding: 24,
  },
});