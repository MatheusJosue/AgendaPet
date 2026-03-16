import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { maskPhone, maskCPF, validateCPF, validateEmail } from '@/lib/validation';
import { colors, spacing, fontSize, glassStyle } from '@/theme';

export default function NewClientScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    cpf: '',
    address: '',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    let maskedValue = value;
    if (field === 'phone') maskedValue = maskPhone(value);
    if (field === 'cpf') maskedValue = maskCPF(value);
    setForm(prev => ({ ...prev, [field]: maskedValue }));
  };

  const validate = (): boolean => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      setErrorMessage('Nome deve ter pelo menos 2 caracteres');
      setShowError(true);
      return false;
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Telefone inválido');
      setShowError(true);
      return false;
    }
    if (form.email && !validateEmail(form.email)) {
      setErrorMessage('Email inválido');
      setShowError(true);
      return false;
    }
    if (form.cpf && form.cpf.replace(/\D/g, '').length === 11 && !validateCPF(form.cpf)) {
      setErrorMessage('CPF inválido');
      setShowError(true);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!userData?.company_id) {
        throw new Error('Empresa não encontrada');
      }

      const { error } = await supabase.from('clients').insert({
        company_id: userData.company_id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        cpf: form.cpf.replace(/\D/g, '') || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      });

      if (error) throw error;

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar cliente');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGradient}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Novo Cliente</Text>
          </View>

          <View style={styles.card}>
            <Input
              label="Nome *"
              value={form.name}
              onChangeText={v => updateField('name', v)}
              placeholder="João Silva"
            />

            <Input
              label="Telefone *"
              value={form.phone}
              onChangeText={v => updateField('phone', v)}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              maxLength={15}
            />

            <Input
              label="Email"
              value={form.email}
              onChangeText={v => updateField('email', v)}
              placeholder="joao@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="CPF"
              value={form.cpf}
              onChangeText={v => updateField('cpf', v)}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              maxLength={14}
            />

            <Input
              label="Endereço"
              value={form.address}
              onChangeText={v => updateField('address', v)}
              placeholder="Rua, número, bairro"
            />

            <Input
              label="Observações"
              value={form.notes}
              onChangeText={v => updateField('notes', v)}
              placeholder="Observações..."
              multiline
              numberOfLines={3}
            />

            <Button
              title="Salvar Cliente"
              onPress={handleSave}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.feedbackIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={colors.accent} />
            </View>
            <Text style={styles.feedbackTitle}>Sucesso!</Text>
            <Text style={styles.feedbackMessage}>Cliente criado com sucesso</Text>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => {
                setShowSuccess(false);
                router.back();
              }}
            >
              <Text style={styles.feedbackButtonText}>Voltar para Clientes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showError} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.feedbackIconContainer, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="alert-circle" size={64} color={colors.error} />
            </View>
            <Text style={styles.feedbackTitle}>Ops!</Text>
            <Text style={styles.feedbackMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.feedbackButton, { backgroundColor: colors.error }]}
              onPress={() => setShowError(false)}
            >
              <Text style={styles.feedbackButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  card: {
    ...glassStyle,
    padding: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    ...glassStyle,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  feedbackIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  feedbackTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  feedbackMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  feedbackButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    width: '100%',
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});
