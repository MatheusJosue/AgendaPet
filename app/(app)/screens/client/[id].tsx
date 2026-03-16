import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { PetCard } from '@/components/PetCard';
import { maskCPF } from '@/lib/validation';
import { colors, spacing, fontSize, glassStyle } from '@/theme';

type Species = 'cachorro' | 'gato' | 'outro';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  address?: string;
  notes?: string;
}

interface Pet {
  id: string;
  name: string;
  species: Species;
  breed?: string;
  weight?: number;
}

const SPECIES_OPTIONS: { value: Species; label: string }[] = [
  { value: 'cachorro', label: 'Cachorro' },
  { value: 'gato', label: 'Gato' },
  { value: 'outro', label: 'Outro' },
];

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Client>({} as Client);
  const [saving, setSaving] = useState(false);

  // Pet modal
  const [showPetModal, setShowPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'cachorro' as Species,
    breed: '',
    weight: '',
    notes: '',
  });
  const [savingPet, setSavingPet] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (clientData) {
        setClient(clientData);
        setEditForm(clientData);
      }

      const { data: petsData } = await supabase
        .from('pets')
        .select('*')
        .eq('client_id', id)
        .order('name');

      if (petsData) setPets(petsData);
    } catch (e) {
      console.error('Error loading client:', e);
      Alert.alert('Erro', 'Cliente não encontrado');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async () => {
    if (!editForm.name.trim() || editForm.name.trim().length < 2) {
      Alert.alert('Erro', 'Nome deve ter pelo menos 2 caracteres');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email?.trim() || null,
          cpf: editForm.cpf?.replace(/\D/g, '') || null,
          address: editForm.address?.trim() || null,
          notes: editForm.notes?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      setClient(editForm);
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = () => {
    Alert.alert(
      'Excluir Cliente',
      'Tem certeza que deseja excluir este cliente? Isso também excluirá todos os pets vinculados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('clients').delete().eq('id', id);
              router.back();
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível excluir');
            }
          },
        },
      ]
    );
  };

  const handleSavePet = async () => {
    if (!petForm.name.trim()) {
      Alert.alert('Erro', 'Nome do pet é obrigatório');
      return;
    }

    setSavingPet(true);
    try {
      const petData = {
        client_id: id,
        name: petForm.name.trim(),
        species: petForm.species,
        breed: petForm.breed.trim() || null,
        weight: petForm.weight ? parseFloat(petForm.weight) : null,
        notes: petForm.notes.trim() || null,
      };

      if (editingPet) {
        await supabase
          .from('pets')
          .update({ ...petData, updated_at: new Date().toISOString() })
          .eq('id', editingPet.id);
      } else {
        await supabase.from('pets').insert(petData);
      }

      setShowPetModal(false);
      setEditingPet(null);
      setPetForm({ name: '', species: 'cachorro', breed: '', weight: '', notes: '' });
      loadData();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSavingPet(false);
    }
  };

  const handleDeletePet = (petId: string) => {
    Alert.alert('Excluir Pet', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('pets').delete().eq('id', petId);
          loadData();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGradient}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{editing ? 'Editar Cliente' : client?.name}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            if (editing) {
              setEditForm(client!);
            }
            setEditing(!editing);
          }}
        >
          <Ionicons
            name={editing ? 'close' : 'create'}
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {editing ? (
          <View style={styles.card}>
            <Input
              label="Nome *"
              value={editForm.name}
              onChangeText={v => setEditForm(p => ({ ...p, name: v }))}
            />
            <Input
              label="Telefone *"
              value={editForm.phone}
              onChangeText={v => setEditForm(p => ({ ...p, phone: v }))}
              keyboardType="phone-pad"
              maxLength={15}
            />
            <Input
              label="Email"
              value={editForm.email || ''}
              onChangeText={v => setEditForm(p => ({ ...p, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="CPF"
              value={editForm.cpf || ''}
              onChangeText={v => setEditForm(p => ({ ...p, cpf: v }))}
              keyboardType="numeric"
              maxLength={14}
            />
            <Input
              label="Endereço"
              value={editForm.address || ''}
              onChangeText={v => setEditForm(p => ({ ...p, address: v }))}
            />
            <Input
              label="Observações"
              value={editForm.notes || ''}
              onChangeText={v => setEditForm(p => ({ ...p, notes: v }))}
              multiline
              numberOfLines={3}
            />
            <Button title="Salvar" onPress={handleSaveClient} loading={saving} />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={colors.primary} />
              <Text style={styles.infoText}>{client?.phone}</Text>
            </View>
            {client?.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color={colors.primary} />
                <Text style={styles.infoText}>{client.email}</Text>
              </View>
            )}
            {client?.cpf && (
              <View style={styles.infoRow}>
                <Ionicons name="card" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  {maskCPF(client.cpf)}
                </Text>
              </View>
            )}
            {client?.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={styles.infoText}>{client.address}</Text>
              </View>
            )}
            {client?.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Observações</Text>
                <Text style={styles.notesText}>{client.notes}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteClient}>
              <Ionicons name="trash" size={20} color={colors.error} />
              <Text style={styles.deleteText}>Excluir Cliente</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pets ({pets.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingPet(null);
                setPetForm({ name: '', species: 'cachorro', breed: '', weight: '', notes: '' });
                setShowPetModal(true);
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Novo Pet</Text>
            </TouchableOpacity>
          </View>

          {pets.map(pet => (
            <PetCard
              key={pet.id}
              name={pet.name}
              species={pet.species}
              breed={pet.breed}
              weight={pet.weight}
              onPress={() => {
                setEditingPet(pet);
                setPetForm({
                  name: pet.name,
                  species: pet.species,
                  breed: pet.breed || '',
                  weight: pet.weight?.toString() || '',
                  notes: pet.notes || '',
                });
                setShowPetModal(true);
              }}
            />
          ))}

          {pets.length === 0 && (
            <View style={styles.emptyPets}>
              <Text style={styles.emptyPetsText}>Nenhum pet cadastrado</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pet Modal */}
      <Modal visible={showPetModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowPetModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPet ? 'Editar Pet' : 'Novo Pet'}
              </Text>
              {editingPet && (
                <TouchableOpacity onPress={() => handleDeletePet(editingPet.id)}>
                  <Ionicons name="trash" size={24} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>

            <Input
              label="Nome *"
              value={petForm.name}
              onChangeText={v => setPetForm(p => ({ ...p, name: v }))}
              placeholder="Nome do pet"
            />

            <Text style={styles.inputLabel}>Espécie *</Text>
            <View style={styles.speciesOptions}>
              {SPECIES_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.speciesOption,
                    petForm.species === opt.value && styles.speciesOptionSelected,
                  ]}
                  onPress={() => setPetForm(p => ({ ...p, species: opt.value }))}
                >
                  <Text
                    style={[
                      styles.speciesOptionText,
                      petForm.species === opt.value && styles.speciesOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Raça"
              value={petForm.breed}
              onChangeText={v => setPetForm(p => ({ ...p, breed: v }))}
              placeholder="Raça"
            />

            <Input
              label="Peso (kg)"
              value={petForm.weight}
              onChangeText={v => setPetForm(p => ({ ...p, weight: v.replace(/[^0-9.]/g, '') }))}
              placeholder="0.0"
              keyboardType="decimal-pad"
            />

            <Input
              label="Observações"
              value={petForm.notes}
              onChangeText={v => setPetForm(p => ({ ...p, notes: v }))}
              placeholder="Alergias, cuidados..."
              multiline
              numberOfLines={2}
            />

            <Button
              title={editingPet ? 'Salvar' : 'Adicionar Pet'}
              onPress={handleSavePet}
              loading={savingPet}
            />
          </View>
        </View>
      </Modal>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  editButton: {
    padding: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  card: {
    ...glassStyle,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  infoText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  notesContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.glass,
    borderRadius: 12,
  },
  notesLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    gap: spacing.sm,
  },
  deleteText: {
    color: colors.error,
    fontSize: fontSize.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    gap: spacing.xs,
  },
  addButtonText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyPets: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyPetsText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.glassBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  speciesOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  speciesOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  speciesOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  speciesOptionText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  speciesOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
