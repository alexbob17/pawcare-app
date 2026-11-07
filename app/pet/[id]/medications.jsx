import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../../src/hooks/useAuth';
import { useReminders } from '../../../src/hooks/useReminders';
import { useTheme } from '../../../src/hooks/useTheme';
import {
  obtenerSubcoleccionFirestore,
  guardarRegistroSaludFirestore,
  eliminarRegistroSaludFirestore,
  eliminarRecordatorioFirestore,
} from '../../../src/services/firestore.service';
import { generarId, formatearFecha } from '../../../src/utils/dates';
import { avisar } from '../../../src/utils/dialogs';

const FRECUENCIAS = ['1 al día', 'Cada 8 h', 'Cada 12 h', 'Semanal', 'Mensual', 'Continuo'];
const DURACIONES = ['5 días', '7 días', '10 días', '14 días', '30 días', 'Continuo'];

export default function MedicationsScreen() {
  const { id: mascotaId } = useLocalSearchParams();
  const { usuario } = useAuth();
  const { crearRecordatorio } = useReminders(usuario?.id);
  const { colors } = useTheme();

  const [medicamentos, setMedicamentos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFechaInicio, setMostrarFechaInicio] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    dosis: '',
    frecuencia: 'Cada 12 h',
    duracion: '7 días',
    motivo: '',
    fechaInicio: new Date().toISOString(),
    notas: '',
  });

  const cargar = useCallback(async () => {
    const datos = await obtenerSubcoleccionFirestore('medicamentos', mascotaId);
    setMedicamentos(
      (datos || []).sort(
        (a, b) =>
          new Date(b.creadaEn || b.fechaInicio || 0) -
          new Date(a.creadaEn || a.fechaInicio || 0)
      )
    );
  }, [mascotaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const resetForm = () => {
    setForm({
      nombre: '',
      dosis: '',
      frecuencia: 'Cada 12 h',
      duracion: '7 días',
      motivo: '',
      fechaInicio: new Date().toISOString(),
      notas: '',
    });
  };

  const fueTomadaHoy = (med) => {
    if (!med?.ultimaToma) return false;
    const hoy = new Date().toISOString().slice(0, 10);
    return String(med.ultimaToma).slice(0, 10) === hoy;
  };

  const alternarTomaHoy = async (med) => {
    const yaTomada = fueTomadaHoy(med);
    const actualizado = {
      ...med,
      ultimaToma: yaTomada ? null : new Date().toISOString(),
      dosisTomadas: yaTomada
        ? Math.max(0, (med.dosisTomadas || 1) - 1)
        : (med.dosisTomadas || 0) + 1,
    };
    setMedicamentos((prev) =>
      prev.map((m) => (String(m.id) === String(med.id) ? actualizado : m))
    );
    await guardarRegistroSaludFirestore('medicamentos', actualizado);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      avisar('Nombre requerido', 'Por favor ingresa el nombre de la medicina.');
      return;
    }
    setGuardando(true);
    try {
      const med = {
        id: generarId(),
        mascotaId,
        nombre: form.nombre.trim(),
        dosis: form.dosis.trim(),
        frecuencia: form.frecuencia,
        duracion: form.duracion || '7 días',
        motivo: form.motivo.trim(),
        fechaInicio: form.fechaInicio,
        notas: form.notas.trim(),
        ultimaToma: null,
        dosisTomadas: 0,
        creadaEn: new Date().toISOString(),
      };
      await guardarRegistroSaludFirestore('medicamentos', med);
      setMedicamentos((prev) => [med, ...prev]);

      if (form.fechaInicio) {
        const fechaNotif = new Date(form.fechaInicio);
        fechaNotif.setHours(9, 0, 0, 0);
        await crearRecordatorio({
          titulo: `Medicina: ${form.nombre.trim()}`,
          cuerpo: [form.dosis, form.frecuencia].filter(Boolean).join(' · '),
          fecha: fechaNotif,
          mascotaId,
          tipo: 'medicamento',
          referenciaId: med.id,
        });
      }

      setModalVisible(false);
      resetForm();
      await cargar();
    } catch {
      avisar('Error', 'No se pudo guardar el medicamento.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (med) => {
    setMedicamentos((prev) => prev.filter((m) => String(m.id) !== String(med.id)));
    await eliminarRegistroSaludFirestore('medicamentos', med.id);
    await eliminarRecordatorioFirestore(med.id);
  };

  return (
    <View style={[estilos.contenedor, { backgroundColor: colors.bg }]}>
      <FlatList
        data={medicamentos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <TouchableOpacity
            style={[estilos.btnAgregar, { backgroundColor: colors.brand }]}
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={[estilos.btnAgregarTexto, { color: colors.brandInk }]}>
              + Agregar medicina
            </Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <View style={[estilos.vacioIconoContenedor, { backgroundColor: colors.okBg }]}>
              <Text style={{ fontSize: 28 }}>💊</Text>
            </View>
            <Text style={[estilos.vacioTitulo, { color: colors.text }]}>
              Sin medicinas registradas
            </Text>
            <Text style={[estilos.vacioSub, { color: colors.muted }]}>
              Añade tratamientos, antibióticos o vitaminas para llevar el control diario de si ya tomó su dosis.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const tomada = fueTomadaHoy(item);
          return (
            <View
              style={[
                estilos.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: tomada ? colors.brand : colors.line,
                },
              ]}
            >
              <View style={estilos.cardHeader}>
                <View style={[estilos.cardIcono, { backgroundColor: colors.surface2 }]}>
                  <Text style={{ fontSize: 20 }}>💊</Text>
                </View>
                <View style={estilos.cardInfo}>
                  <Text style={[estilos.cardNombre, { color: colors.text }]}>{item.nombre}</Text>
                  <Text style={[estilos.cardSub, { color: colors.brand, fontWeight: '700' }]}>
                    {[
                      item.dosis,
                      item.frecuencia,
                      item.duracion ? `Duración: ${item.duracion}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Tratamiento activo'}
                  </Text>
                  {item.fechaInicio ? (
                    <Text style={[estilos.cardFecha, { color: colors.muted }]}>
                      📅 Inicio: {formatearFecha(item.fechaInicio)}
                    </Text>
                  ) : null}
                  {item.motivo ? (
                    <Text style={[estilos.cardSub, { color: colors.muted }]}>
                      Indicaciones: {item.motivo}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => eliminar(item)}
                  style={[estilos.btnDel, { backgroundColor: colors.surface2 }]}
                >
                  <Text style={{ fontSize: 13, color: colors.warn, fontWeight: '900' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Control rápido de toma diaria */}
              <View style={[estilos.controlTomaRow, { borderTopColor: colors.line }]}>
                <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '700' }}>
                  {tomada
                    ? `✓ Dosis de hoy registrada (${item.dosisTomadas || 1} en total)`
                    : 'Pendiente de tomar hoy'}
                </Text>

                <TouchableOpacity
                  style={[
                    estilos.btnToma,
                    {
                      backgroundColor: tomada ? colors.okBg : colors.brand,
                      borderColor: colors.brand,
                    },
                  ]}
                  onPress={() => alternarTomaHoy(item)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: tomada ? colors.brand : colors.brandInk,
                    }}
                  >
                    {tomada ? '✓ Ya la tomó hoy' : 'Marcar como tomada'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={estilos.modalOverlay}>
          <TouchableOpacity
            style={estilos.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={[estilos.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[estilos.sheetHandle, { backgroundColor: colors.line }]} />
            <View style={estilos.modalHeaderRow}>
              <Text style={[estilos.modalTitulo, { color: colors.text }]}>
                Nueva Medicina 💊
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.muted, fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Nombre del medicamento *
              </Text>
              <TextInput
                style={[
                  estilos.input,
                  {
                    backgroundColor: colors.surface2,
                    borderColor: colors.line,
                    color: colors.text,
                  },
                ]}
                placeholder="Ej. Antibiótico, Vitaminas, Nexgard..."
                placeholderTextColor={colors.muted}
                value={form.nombre}
                onChangeText={(t) => setForm((f) => ({ ...f, nombre: t }))}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>Dosis</Text>
              <TextInput
                style={[
                  estilos.input,
                  {
                    backgroundColor: colors.surface2,
                    borderColor: colors.line,
                    color: colors.text,
                  },
                ]}
                placeholder="Ej. 1 tableta, 5 ml..."
                placeholderTextColor={colors.muted}
                value={form.dosis}
                onChangeText={(t) => setForm((f) => ({ ...f, dosis: t }))}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Frecuencia de toma
              </Text>
              <View style={estilos.frecuenciaGrid}>
                {FRECUENCIAS.map((fr) => {
                  const activo = form.frecuencia === fr;
                  return (
                    <TouchableOpacity
                      key={fr}
                      style={[
                        estilos.frecuenciaChip,
                        {
                          backgroundColor: activo ? colors.brand : colors.surface2,
                          borderColor: activo ? colors.brand : colors.line,
                        },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, frecuencia: fr }))}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: activo ? colors.brandInk : colors.text,
                          fontWeight: activo ? '800' : '600',
                        }}
                      >
                        {fr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Duración del tratamiento
              </Text>
              <View style={estilos.frecuenciaGrid}>
                {DURACIONES.map((dur) => {
                  const activo = form.duracion === dur;
                  return (
                    <TouchableOpacity
                      key={dur}
                      style={[
                        estilos.frecuenciaChip,
                        {
                          backgroundColor: activo ? colors.okBg : colors.surface2,
                          borderColor: activo ? colors.brand : colors.line,
                        },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, duracion: dur }))}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: activo ? colors.brand : colors.text,
                          fontWeight: activo ? '800' : '600',
                        }}
                      >
                        {dur}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Indicaciones / Para qué es (opcional)
              </Text>
              <TextInput
                style={[
                  estilos.input,
                  {
                    backgroundColor: colors.surface2,
                    borderColor: colors.line,
                    color: colors.text,
                  },
                ]}
                placeholder="Ej. Dar junto con la comida..."
                placeholderTextColor={colors.muted}
                value={form.motivo}
                onChangeText={(t) => setForm((f) => ({ ...f, motivo: t }))}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Fecha de inicio del tratamiento
              </Text>
              <TouchableOpacity
                style={[
                  estilos.fechaBtn,
                  {
                    backgroundColor: colors.surface2,
                    borderColor: colors.brand,
                  },
                ]}
                onPress={() => setMostrarFechaInicio(true)}
              >
                <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '700' }}>
                  📅 {form.fechaInicio ? formatearFecha(form.fechaInicio) : 'Seleccionar'}
                </Text>
                <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '800' }}>
                  Cambiar
                </Text>
              </TouchableOpacity>
              {mostrarFechaInicio && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={form.fechaInicio ? new Date(form.fechaInicio) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setMostrarFechaInicio(false);
                    if (d) setForm((f) => ({ ...f, fechaInicio: d.toISOString() }));
                  }}
                />
              )}

              <TouchableOpacity
                style={[estilos.btnGuardar, { backgroundColor: colors.brand }]}
                onPress={guardar}
                disabled={guardando}
                activeOpacity={0.85}
              >
                {guardando ? (
                  <ActivityIndicator color={colors.brandInk} size="small" />
                ) : (
                  <Text style={[estilos.btnGuardarTexto, { color: colors.brandInk }]}>
                    Guardar Medicina
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  lista: { padding: 18, paddingBottom: 32 },
  btnAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    marginBottom: 16,
  },
  btnAgregarTexto: { fontSize: 14, fontWeight: '800' },
  vacio: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 20 },
  vacioIconoContenedor: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  vacioTitulo: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  vacioSub: { fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIcono: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: 15, fontWeight: '800' },
  cardFecha: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  cardSub: { fontSize: 12, marginTop: 2 },
  btnDel: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlTomaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  btnToma: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(11, 21, 20, 0.55)' },
  modalBackdrop: { flex: 1 },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 30,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitulo: { fontSize: 18, fontWeight: '800' },
  campoLabel: { fontSize: 12, fontWeight: '800', marginBottom: 6, marginTop: 10 },
  input: { height: 44, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 13.5, fontWeight: '600' },
  frecuenciaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  frecuenciaChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1 },
  fechaBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  btnGuardar: {
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  btnGuardarTexto: { fontSize: 14, fontWeight: '800' },
});
