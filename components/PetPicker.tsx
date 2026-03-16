import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '@/theme';
import { supabase } from '@/lib/supabase';

type Species = 'cachorro' | 'gato' | 'outro';

interface Pet {
  id: string;
  name: string;
  species: Species;
  breed?: string;
}

interface PetPickerProps {
  visible: boolean;
  clientId: string | null;
  onClose: () => void;
  onSelect: (pet: Pet) => void;
  onAddNew?: () => void;
}

const speciesIcons: Record<Species, string> = {
  cachorro: 'dog',
  gato: 'cat',
  outro: 'ellipse',
};

export const PetPicker: React.FC<PetPickerProps> = ({
  visible,
  clientId,
  onClose,
  onSelect,
  onAddNew,
}) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && clientId) {
      loadPets();
    }
  }, [visible, clientId]);

  const loadPets = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species, breed')
        .eq('client_id', clientId)
        .order('name');

      if (!error && data) {
        setPets(data);
      }
    } catch (e) {
      console.error('Error loading pets:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Pet }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <View style={styles.itemIcon}>
        <Ionicons
          name={speciesIcons[item.species] as any}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.breed && (
          <Text style={styles.itemBreed}>{item.breed}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Selecionar Pet</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={pets}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.empty}>
                  {loading ? 'Carregando...' : 'Nenhum pet encontrado'}
                </Text>
                {onAddNew && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      onClose();
                      onAddNew();
                    }}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Cadastrar novo pet</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.glassBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  itemBreed: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    gap: spacing.sm,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
