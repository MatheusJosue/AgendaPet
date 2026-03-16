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
