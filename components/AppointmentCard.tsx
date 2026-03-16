import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Appointment } from '@/lib/supabase';
import { colors, spacing, fontSize, glassStyle } from '@/theme';

interface Props {
  appointment: Appointment;
  onPress?: () => void;
  onToggleStatus?: () => void;
}

export function AppointmentCard({ appointment, onPress, onToggleStatus }: Props) {
  const statusColors = {
    scheduled: colors.primary,
    completed: colors.success,
    cancelled: colors.error,
  };

  const statusTexts = {
    scheduled: 'Agendado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };

  const statusIcons = {
    scheduled: 'ellipse-outline',
    completed: 'checkmark-circle',
    close: 'close-circle',
  };

  const serviceIcons = {
    banho: 'water',
    tosa: 'cut',
    ambos: 'sparkles',
  };

  const serviceIcon = serviceIcons[appointment.service as keyof typeof serviceIcons] || 'paw';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onToggleStatus}
      activeOpacity={0.8}
    >
      <View style={styles.timeContainer}>
        <Text style={styles.time}>
          {new Date(appointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.petInfo}>
            <Ionicons name="paw" size={16} color={colors.textSecondary} />
            <Text style={styles.petName}>{appointment.pet_name}</Text>
          </View>
          <View style={styles.serviceContainer}>
            <Ionicons name={serviceIcon as any} size={14} color={colors.textSecondary} />
            <Text style={styles.service}>{appointment.service}</Text>
          </View>
        </View>

        <View style={styles.tutorRow}>
          <Ionicons name="person" size={14} color={colors.textMuted} />
          <Text style={styles.tutor}>{appointment.tutor_name}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>R$ {appointment.price.toFixed(2)}</Text>
          <View style={[styles.status, { backgroundColor: statusColors[appointment.status as keyof typeof statusColors] }]}>
            <Ionicons
              name={(statusIcons[appointment.status as keyof typeof statusIcons] as any) || 'ellipse-outline'}
              size={12}
              color={colors.text}
            />
            <Text style={styles.statusText}>{statusTexts[appointment.status as keyof typeof statusTexts]}</Text>
          </View>
        </View>
      </View>

      {appointment.status === 'scheduled' && onToggleStatus && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={onToggleStatus}
        >
          <Ionicons name="checkmark" size={20} color={colors.text} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    ...glassStyle,
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  timeContainer: {
    width: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.glassBorder,
    marginRight: spacing.md,
  },
  time: { fontSize: fontSize.md, fontWeight: 'bold', color: colors.text },
  content: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  petInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  petName: { fontSize: fontSize.md, fontWeight: 'bold', color: colors.text },
  serviceContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  service: { fontSize: fontSize.sm, color: colors.textSecondary, textTransform: 'capitalize' },
  tutorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  tutor: { fontSize: fontSize.sm, color: colors.textMuted },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: fontSize.md, fontWeight: '600', color: colors.accent },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    gap: spacing.xs,
  },
  statusText: { fontSize: fontSize.xs, color: colors.text, fontWeight: '500' },
  completeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});
