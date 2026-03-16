import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase, Appointment } from '@/lib/supabase';
import { AppointmentCard } from '@/components/AppointmentCard';
import { Loading } from '@/components/Loading';
import { Background } from '@/components/Background';
import { colors, fontSize, glassStyle } from '@/theme';

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
    <Background>
      <View style={styles.container}>
        {/* Stats Header */}
        <View style={styles.glassCard}>
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
        </View>

        {/* Appointments List */}
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AppointmentCard appointment={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>Nenhum agendamento para hoje</Text>
            </View>
          }
        />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  glassCard: {
    ...glassStyle,
    padding: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  list: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
  },
});