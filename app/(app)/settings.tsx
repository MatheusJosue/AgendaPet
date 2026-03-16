import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';
import { colors, spacing, fontSize, glassStyle } from '@/theme';

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
      <View style={styles.backgroundGradient}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>Administrador</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>

        <Button title="Sair" onPress={handleSignOut} variant="secondary" style={styles.button} />
      </View>
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  profileCard: {
    ...glassStyle,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 32, color: colors.text, fontWeight: 'bold' },
  email: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  role: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  infoCard: {
    ...glassStyle,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs },
  infoValue: { fontSize: fontSize.md, color: colors.text },
  button: { marginTop: 'auto' },
});
