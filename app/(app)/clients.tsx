import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ClientsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clientes</Text>
      <Text style={styles.subtitle}>Funcionalidade em breve</Text>
      <Text style={styles.description}>
        Nesta versao, os clientes sao cadastrados automaticamente junto com o agendamento.
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
