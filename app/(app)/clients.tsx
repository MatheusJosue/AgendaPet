import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
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
      onPress={() => router.push(`/(app)/screens/client/${item.id}`)}
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
        onPress={() => router.push('/(app)/screens/new-client')}
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
