import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ClientPicker } from "@/components/ClientPicker";
import { PetPicker } from "@/components/PetPicker";
import { colors, spacing, fontSize, glassStyle } from "@/theme";

type Service = {
  id: string;
  name: string;
  icon: string;
};

const SERVICES: Service[] = [
  { id: "banho", name: "Banho", icon: "water" },
  { id: "tosa", name: "Tosa", icon: "cut" },
  { id: "banho_tosa", name: "Banho + Tosa", icon: "sparkles" },
  { id: "higienica", name: "Higiência", icon: "medkit" },
  { id: "corte_unha", name: "Corte Unha", icon: "scissors" },
  { id: "escovacao", name: "Escovação", icon: "brush" },
  { id: "vacina", name: "Vacina", icon: "medical" },
  { id: "consulta", name: "Consulta", icon: "clipboard" },
];

const maskPrice = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length === 0) return "";
  const cents = numbers.slice(-2);
  const reais = numbers.slice(0, -2);
  return reais
    ? `${parseInt(reais).toLocaleString("pt-BR")},${cents}`
    : `,${cents}`;
};

export default function NewAppointmentScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tempDate, setTempDate] = useState(new Date());
  const [tempHour, setTempHour] = useState(9);
  const [tempMinute, setTempMinute] = useState(0);

  // Client and Pet selection
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null);
  const [selectedPet, setSelectedPet] = useState<{ id: string; name: string } | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showPetPicker, setShowPetPicker] = useState(false);

  const [form, setForm] = useState({
    price: "",
    date: "",
    time: "",
    notes: "",
  });

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId],
    );
  };

  const updateField = (field: string, value: string) => {
    let maskedValue = value;
    if (field === "price") maskedValue = maskPrice(value);
    setForm((prev) => ({ ...prev, [field]: maskedValue }));
  };

  const openDatePicker = () => {
    const current = form.date
      ? new Date(form.date.split("/").reverse().join("-"))
      : new Date();
    setTempDate(current);
    setShowDateModal(true);
  };

  const openTimePicker = () => {
    const current = form.time ? form.time.split(":").map(Number) : [9, 0];
    setTempHour(current[0]);
    setTempMinute(current[1]);
    setShowTimeModal(true);
  };

  const confirmDate = () => {
    const day = String(tempDate.getDate()).padStart(2, "0");
    const month = String(tempDate.getMonth() + 1).padStart(2, "0");
    const year = tempDate.getFullYear();
    setForm((prev) => ({ ...prev, date: `${day}/${month}/${year}` }));
    setShowDateModal(false);
  };

  const confirmTime = () => {
    const time = `${String(tempHour).padStart(2, "0")}:${String(tempMinute).padStart(2, "0")}`;
    setForm((prev) => ({ ...prev, time }));
    setShowTimeModal(false);
  };

  const handleSave = async () => {
    if (!selectedClient) {
      setErrorMessage('Selecione um cliente');
      setShowErrorModal(true);
      return;
    }

    if (!selectedPet) {
      setErrorMessage('Selecione um pet');
      setShowErrorModal(true);
      return;
    }

    if (
      !form.date.trim() ||
      !form.time.trim() ||
      !form.price.trim()
    ) {
      setErrorMessage('Preencha todos os campos obrigatórios');
      setShowErrorModal(true);
      return;
    }

    if (selectedServices.length === 0) {
      setErrorMessage('Selecione pelo menos um serviço');
      setShowErrorModal(true);
      return;
    }

    const priceValue = form.price.replace(/\./g, "").replace(",", ".");
    const price = parseFloat(priceValue);
    if (isNaN(price) || price <= 0) {
      setErrorMessage('Valor inválido');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      const { data: userData } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!userData?.company_id) {
        throw new Error("Empresa não encontrada");
      }

      const dateParts = form.date.split("/");
      const dateObj = new Date(
        `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${form.time}:00`,
      );

      const { error } = await supabase.from("appointments").insert({
        company_id: userData.company_id,
        client_id: selectedClient.id,
        pet_id: selectedPet.id,
        service: selectedServices.join(","),
        price,
        date: dateObj.toISOString(),
        status: "scheduled",
        notes: form.notes.trim() || null,
      });

      if (error) throw error;

      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar agendamento');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGradient}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.label}>Serviços *</Text>
          <View style={styles.servicesGrid}>
            {SERVICES.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceBtn,
                    isSelected && styles.serviceBtnSelected,
                  ]}
                  onPress={() => toggleService(service.id)}
                >
                  <Ionicons
                    name={service.icon as any}
                    size={20}
                    color={isSelected ? "#fff" : colors.primary}
                  />
                  <Text
                    style={[
                      styles.serviceBtnText,
                      isSelected && styles.serviceBtnTextSelected,
                    ]}
                  >
                    {service.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Client Picker */}
          <Text style={styles.label}>Cliente *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowClientPicker(true)}
          >
            <Ionicons name="person" size={20} color={colors.primary} />
            <Text style={[styles.pickerText, !selectedClient && styles.pickerPlaceholder]}>
              {selectedClient?.name || 'Selecionar cliente'}
            </Text>
          </TouchableOpacity>

          {/* Pet Picker */}
          {selectedClient && (
            <>
              <Text style={styles.label}>Pet *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPetPicker(true)}
              >
                <Ionicons name="paw" size={20} color={colors.primary} />
                <Text style={[styles.pickerText, !selectedPet && styles.pickerPlaceholder]}>
                  {selectedPet?.name || 'Selecionar pet'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Data *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={openDatePicker}
              >
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.pickerText}>
                  {form.date || "dd/mm/aaaa"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Hora *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={openTimePicker}
              >
                <Ionicons name="time" size={20} color={colors.primary} />
                <Text style={styles.pickerText}>{form.time || "--:--"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Input
            label="Valor *"
            value={form.price}
            onChangeText={(v) => updateField("price", v)}
            placeholder="0,00"
            keyboardType="decimal-pad"
          />

          <Input
            label="Observações"
            value={form.notes}
            onChangeText={(v) => updateField("notes", v)}
            placeholder="Observações adicionais..."
            multiline
            numberOfLines={3}
          />

          <Button
            title="Salvar Agendamento"
            onPress={handleSave}
            loading={loading}
          />
        </View>
      </ScrollView>

      {/* Client Picker Modal */}
      <ClientPicker
        visible={showClientPicker}
        onClose={() => setShowClientPicker(false)}
        onSelect={(client) => {
          setSelectedClient(client);
          setSelectedPet(null);
        }}
      />

      {/* Pet Picker Modal */}
      <PetPicker
        visible={showPetPicker}
        clientId={selectedClient?.id || null}
        onClose={() => setShowPetPicker(false)}
        onSelect={(pet) => setSelectedPet(pet)}
        onAddNew={() => router.push(`/screens/client/${selectedClient?.id}`)}
      />

      {/* Date Picker Modal */}
      <Modal visible={showDateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDateModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="calendar" size={24} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Selecionar Data</Text>
            </View>
            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Dia</Text>
                <ScrollView style={styles.pickerScroll}>
                  {days.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.pickerItem,
                        tempDate.getDate() === d && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        const newDate = new Date(tempDate);
                        newDate.setDate(d);
                        setTempDate(newDate);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempDate.getDate() === d && styles.pickerItemTextSelected,
                        ]}
                      >
                        {String(d).padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Mês</Text>
                <ScrollView style={styles.pickerScroll}>
                  {months.map((m, i) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.pickerItem,
                        tempDate.getMonth() === i && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        const newDate = new Date(tempDate);
                        newDate.setMonth(i);
                        setTempDate(newDate);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempDate.getMonth() === i && styles.pickerItemTextSelected,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmDate}
              >
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={showTimeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowTimeModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="time" size={24} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Selecionar Horário</Text>
            </View>
            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hora</Text>
                <ScrollView style={styles.pickerScroll}>
                  {hours.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.pickerItem,
                        tempHour === h && styles.pickerItemSelected,
                      ]}
                      onPress={() => setTempHour(h)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempHour === h && styles.pickerItemTextSelected,
                        ]}
                      >
                        {String(h).padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minuto</Text>
                <ScrollView style={styles.pickerScroll}>
                  {minutes.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.pickerItem,
                        tempMinute === m && styles.pickerItemSelected,
                      ]}
                      onPress={() => setTempMinute(m)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempMinute === m && styles.pickerItemTextSelected,
                        ]}
                      >
                        {String(m).padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowTimeModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmTime}
              >
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.feedbackModalOverlay}>
          <View style={styles.feedbackModalContent}>
            <View style={styles.feedbackIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={colors.accent} />
            </View>
            <Text style={styles.feedbackTitle}>Sucesso!</Text>
            <Text style={styles.feedbackMessage}>Agendamento criado com sucesso</Text>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.push('/(app)');
              }}
            >
              <Text style={styles.feedbackButtonText}>Voltar para Agenda</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={styles.feedbackModalOverlay}>
          <View style={styles.feedbackModalContent}>
            <View style={[styles.feedbackIconContainer, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="alert-circle" size={64} color={colors.error} />
            </View>
            <Text style={styles.feedbackTitle}>Ops!</Text>
            <Text style={styles.feedbackMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.feedbackButton, { backgroundColor: colors.error }]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.feedbackButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backgroundGradient: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  orb1: { position: "absolute", width: 280, height: 280, borderRadius: 140, backgroundColor: colors.primary, opacity: 0.15, top: -80, right: -60 },
  orb2: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: colors.secondary, opacity: 0.1, bottom: 150, left: -40 },
  orb3: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: colors.accent, opacity: 0.1, bottom: -50, right: 50 },
  keyboardView: { flex: 1 },
  content: { padding: spacing.lg },
  card: { ...glassStyle, padding: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: "600", marginBottom: spacing.sm, marginTop: spacing.md, color: colors.textSecondary },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  serviceBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: colors.primary, backgroundColor: "transparent", gap: spacing.xs },
  serviceBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  serviceBtnText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "500" },
  serviceBtnTextSelected: { color: "#fff" },
  row: { flexDirection: "row", gap: spacing.md },
  halfInput: { flex: 1 },
  pickerButton: { flexDirection: "row", alignItems: "center", backgroundColor: colors.glass, borderRadius: 12, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.md, gap: spacing.sm },
  pickerText: { fontSize: fontSize.md, color: colors.text },
  pickerPlaceholder: { color: colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: colors.backgroundLight, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: "60%" },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.glassBorder, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  modalHeader: { alignItems: "center", marginBottom: spacing.lg },
  modalIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  modalTitle: { fontSize: fontSize.xl, fontWeight: "bold", color: colors.text, textAlign: "center" },
  pickerRow: { flexDirection: "row", gap: spacing.md },
  pickerColumn: { flex: 1 },
  pickerLabel: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.sm },
  pickerScroll: { height: 200 },
  pickerItem: { padding: spacing.md, borderRadius: 8, alignItems: "center", marginBottom: spacing.xs },
  pickerItemSelected: { backgroundColor: colors.primary },
  pickerItemText: { fontSize: fontSize.md, color: colors.text },
  pickerItemTextSelected: { color: "#fff", fontWeight: "bold" },
  modalButtons: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  modalCancelBtn: { flex: 1, alignItems: "center", padding: spacing.md, backgroundColor: colors.glass, borderRadius: 12, borderWidth: 1, borderColor: colors.glassBorder },
  modalCancelText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '500' },
  modalConfirmBtn: { flex: 1, alignItems: "center", padding: spacing.md, backgroundColor: colors.primary, borderRadius: 12 },
  modalConfirmText: { fontSize: fontSize.md, color: "#fff", fontWeight: '600' },
  feedbackModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  feedbackModalContent: { ...glassStyle, padding: spacing.xl, alignItems: 'center', width: '100%', maxWidth: 320 },
  feedbackIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.accent + '20', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  feedbackTitle: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  feedbackMessage: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  feedbackButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: 12, width: '100%' },
  feedbackButtonText: { color: '#fff', fontSize: fontSize.md, fontWeight: '600', textAlign: 'center' },
});
