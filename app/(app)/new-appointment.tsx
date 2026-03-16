import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

type Service = 'banho' | 'tosa';

export default function NewAppointmentScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tutor_name: '',
    phone: '',
    pet_name: '',
    pet_breed: '',
    service: 'banho' as Service,
    price: '',
    date: '',
    time: '',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validation
    if (!form.tutor_name.trim() || !form.phone.trim() || !form.pet_name.trim() ||
        !form.date.trim() || !form.time.trim() || !form.price.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const price = parseFloat(form.price.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erro', 'Valor inválido');
      return;
    }

    setLoading(true);

    try {
      // Get user's company
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!userData?.company_id) throw new Error('Empresa não encontrada');

      // Combine date and time
      const dateTime = new Date(`${form.date}T${form.time}`);
      if (dateTime < new Date()) {
        Alert.alert('Erro', 'Data não pode ser no passado');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('appointments').insert({
        company_id: userData.company_id,
        tutor_name: form.tutor_name.trim(),
        phone: form.phone.trim(),
        pet_name: form.pet_name.trim(),
        pet_breed: form.pet_breed.trim() || null,
        service: form.service,
        price,
        date: dateTime.toISOString(),
        status: 'scheduled',
        notes: form.notes.trim() || null,
      });

      if (error) throw error;

      Alert.alert('Sucesso', 'Agendamento criado!', [
        { text: 'OK', onPress: () => router.push('/(app)') }
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Input
        label="Nome do tutor *"
        value={form.tutor_name}
        onChangeText={(v) => updateField('tutor_name', v)}
        placeholder="João Silva"
      />

      <Input
        label="Telefone *"
        value={form.phone}
        onChangeText={(v) => updateField('phone', v)}
        placeholder="(11) 99999-9999"
        keyboardType="phone-pad"
      />

      <Input
        label="Nome do pet *"
        value={form.pet_name}
        onChangeText={(v) => updateField('pet_name', v)}
        placeholder="Rex"
      />

      <Input
        label="Raça"
        value={form.pet_breed}
        onChangeText={(v) => updateField('pet_breed', v)}
        placeholder="Golden Retriever"
      />

      <Text style={styles.label}>Serviço *</Text>
      <View style={styles.serviceRow}>
        <Button
          title="🚿 Banho"
          onPress={() => updateField('service', 'banho')}
          variant={form.service === 'banho' ? 'primary' : 'secondary'}
          style={styles.serviceBtn}
        />
        <Button
          title="✂️ Tosa"
          onPress={() => updateField('service', 'tosa')}
          variant={form.service === 'tosa' ? 'primary' : 'secondary'}
          style={styles.serviceBtn}
        />
      </View>

      <Input
        label="Data *"
        value={form.date}
        onChangeText={(v) => updateField('date', v)}
        placeholder="2024-12-31"
      />

      <Input
        label="Hora *"
        value={form.time}
        onChangeText={(v) => updateField('time', v)}
        placeholder="14:30"
      />

      <Input
        label="Valor *"
        value={form.price}
        onChangeText={(v) => updateField('price', v)}
        placeholder="50,00"
        keyboardType="decimal-pad"
      />

      <Input
        label="Observações"
        value={form.notes}
        onChangeText={(v) => updateField('notes', v)}
        placeholder="Observações adicionais..."
        multiline
        numberOfLines={3}
      />

      <Button title="Salvar Agendamento" onPress={handleSave} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  serviceRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  serviceBtn: { flex: 1 },
});
