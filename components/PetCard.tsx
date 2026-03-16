import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, glassStyle } from '@/theme';

type Species = 'cachorro' | 'gato' | 'outro';

interface PetCardProps {
  name: string;
  species: Species;
  breed?: string;
  weight?: number;
  onPress: () => void;
}

const speciesIcons: Record<Species, string> = {
  cachorro: 'dog',
  gato: 'cat',
  outro: 'ellipse',
};

const speciesLabels: Record<Species, string> = {
  cachorro: 'Cachorro',
  gato: 'Gato',
  outro: 'Outro',
};

export const PetCard: React.FC<PetCardProps> = ({
  name,
  species,
  breed,
  weight,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={speciesIcons[species] as any}
          size={24}
          color={colors.primary}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.details}>
          {speciesLabels[species]}{breed ? ` • ${breed}` : ''}
        </Text>
        {weight && (
          <Text style={styles.weight}>{weight} kg</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    ...glassStyle,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  details: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  weight: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
