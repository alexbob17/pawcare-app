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
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../src/hooks/useTheme';
import {
  obtenerSubcoleccionFirestore,
  guardarRegistroSaludFirestore,
  eliminarRegistroSaludFirestore,
  obtenerMascotaPorIdFirestore,
  guardarMascotaFirestore,
} from '../../../src/services/firestore.service';
import { generarId, formatearFecha } from '../../../src/utils/dates';
import { avisar, confirmar } from '../../../src/utils/dialogs';

export default function WeightScreen() {
  const { id: mascotaId } = useLocalSearchParams();
  const { colors } = useTheme();

  const [pesos, setPesos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [form, setForm] = useState({ peso: '', fecha: new Date().toISOString(), notas: '' });

  const cargar = useCallback(async () => {
    const datos = await obtenerSubcoleccionFirestore('pesos', mascotaId);
    setPesos((datos || []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
  }, [mascotaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const resetForm = () => {
    setForm({ peso: '', fecha: new Date().toISOString(), notas: '' });
  };

  const guardar = async () => {
    const num = parseFloat(form.peso.replace(',', '.'));
    if (!form.peso || isNaN(num) || num <= 0 || num > 300) {
      avisar('Peso inválido', 'Ingresa un valor numérico válido en kg (ej. 10.5).');
      return;
    }
    setGuardando(true);
    try {
      const registro = {
        id: generarId(),
        mascotaId,
        peso: num,
        fecha: new Date(form.fecha).toISOString(),
        notas: form.notas.trim(),
        creadaEn: new Date().toISOString(),
      };
      await guardarRegistroSaludFirestore('pesos', registro);

      // Obtener todos los pesos y actualizar pesoActual con el más reciente por fecha (no por orden de inserción)
      const todosPesos = await obtenerSubcoleccionFirestore('pesos', mascotaId);
      const pesosOrdenados = (todosPesos || []).sort(
        (a, b) => new Date(b.fecha || b.creadaEn || 0) - new Date(a.fecha || a.creadaEn || 0)
      );
      const pesoMasReciente = pesosOrdenados.length > 0 ? pesosOrdenados[0].peso : num;

      const mascota = await obtenerMascotaPorIdFirestore(mascotaId);
      if (mascota) {
        await guardarMascotaFirestore({ ...mascota, pesoActual: pesoMasReciente });
      }

      await cargar();
      setModalVisible(false);
      resetForm();
    } catch {
      avisar('Error', 'No se pudo registrar el peso.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (item) => {
    confirmar(
      '¿Eliminar registro?',
      `¿Deseas eliminar el peso de ${item.peso} kg del ${formatearFecha(item.fecha)}?`,
      async () => {
        await eliminarRegistroSaludFirestore('pesos', item.id);
        const restantes = await obtenerSubcoleccionFirestore('pesos', mascotaId);
        const ordenados = (restantes || []).sort(
          (a, b) => new Date(b.fecha || b.creadaEn || 0) - new Date(a.fecha || a.creadaEn || 0)
        );
        const pesoMasReciente = ordenados.length > 0 ? ordenados[0].peso : null;
        const mascota = await obtenerMascotaPorIdFirestore(mascotaId);
        if (mascota) {
          await guardarMascotaFirestore({ ...mascota, pesoActual: pesoMasReciente });
        }
        await cargar();
      }
    );
  };

  const variacion = (index) => {
    if (index >= pesos.length - 1) return null;
    const diff = pesos[index].peso - pesos[index + 1].peso;
    return diff;
  };

  const pesoActual = pesos.length > 0 ? pesos[0].peso : null;

  return (
    <View style={[estilos.contenedor, { backgroundColor: colors.bg }]}>
      <FlatList
        data={pesos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <View>
            {pesoActual !== null && (
              <View
                style={[
                  estilos.pesoActualCard,
                  {
                    backgroundColor: colors.brand,
                  },
                ]}
              >
                <Text style={[estilos.pesoActualEtiqueta, { color: colors.brandInk }]}>
                  Peso actual registrado
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginVertical: 4 }}>
                  <Text style={[estilos.pesoActualValor, { color: colors.brandInk }]}>
                    {pesoActual}
                  </Text>
                  <Text style={[estilos.pesoActualUnidad, { color: colors.brandInk }]}>
                    kg
                  </Text>
                </View>
                <Text style={[estilos.pesoActualFecha, { color: colors.brandInk }]}>
                  Último registro: {formatearFecha(pesos[0].fecha)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[estilos.btnAgregar, { backgroundColor: colors.brand }]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={[estilos.btnAgregarTexto, { color: colors.brandInk }]}>
                + Registrar nuevo peso
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <View style={[estilos.vacioIconoContenedor, { backgroundColor: colors.okBg }]}>
              <Text style={{ fontSize: 28 }}>⚖️</Text>
            </View>
            <Text style={[estilos.vacioTitulo, { color: colors.text }]}>
              Sin registros de peso
            </Text>
            <Text style={[estilos.vacioSub, { color: colors.muted }]}>
              Controla la evolución de peso para visualizar su gráfica en el perfil de salud.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const delta = variacion(index);
          return (
            <View
              style={[
                estilos.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.line,
                },
              ]}
            >
              <View style={estilos.cardRow}>
                <View
                  style={[
                    estilos.pesoCirculo,
                    {
                      backgroundColor: colors.okBg,
                      borderColor: colors.brand,
                    },
                  ]}
                >
                  <Text style={[estilos.pesoNum, { color: colors.brand }]}>{item.peso}</Text>
                  <Text style={[estilos.pesoSub, { color: colors.brand }]}>kg</Text>
                </View>
                <View style={estilos.cardInfo}>
                  <Text style={[estilos.cardFecha, { color: colors.text }]}>
                    {formatearFecha(item.fecha)}
                  </Text>
                  {delta !== null && (
                    <Text
                      style={[
                        estilos.variacion,
                        {
                          color: delta !== 0 ? colors.brand : colors.muted,
                        },
                      ]}
                    >
                      {delta > 0
                        ? `↗ +${delta.toFixed(1)} kg`
                        : delta < 0
                        ? `↘ ${delta.toFixed(1)} kg`
                        : '— Estable'}
                    </Text>
                  )}
                  {item.notas ? (
                    <Text style={[estilos.cardSub, { color: colors.muted }]}>
                      {item.notas}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => eliminar(item)} style={estilos.btnDel}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>✕</Text>
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
                Registrar Peso ⚖️
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.muted, fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[estilos.campoLabel, { color: colors.muted }]}>Peso (kg) *</Text>
            <TextInput
              style={[
                estilos.input,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.line,
                  color: colors.text,
                },
              ]}
              placeholder="Ej. 10.2"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={form.peso}
              onChangeText={(t) => setForm((f) => ({ ...f, peso: t }))}
            />

            <Text style={[estilos.campoLabel, { color: colors.muted }]}>Fecha del pesaje</Text>
            <TouchableOpacity
              style={[
                estilos.fechaBtn,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.line,
                },
              ]}
              onPress={() => setMostrarFecha(true)}
            >
              <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '700' }}>
                📅 {form.fecha ? formatearFecha(form.fecha) : 'Seleccionar'}
              </Text>
            </TouchableOpacity>
            {mostrarFecha && Platform.OS !== 'web' && (
              <DateTimePicker
                value={form.fecha ? new Date(form.fecha) : new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(e, d) => {
                  setMostrarFecha(false);
                  if (d) setForm((f) => ({ ...f, fecha: d.toISOString() }));
                }}
              />
            )}

            <Text style={[estilos.campoLabel, { color: colors.muted }]}>Notas (opcional)</Text>
            <TextInput
              style={[
                estilos.input,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.line,
                  color: colors.text,
                },
              ]}
              placeholder="Ej. Control mensual"
              placeholderTextColor={colors.muted}
              value={form.notas}
              onChangeText={(t) => setForm((f) => ({ ...f, notas: t }))}
            />

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
                  Guardar Peso
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  lista: { padding: 18, paddingBottom: 32 },
  pesoActualCard: {
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  pesoActualEtiqueta: { fontSize: 11.5, fontWeight: '800', textTransform: 'uppercase' },
  pesoActualValor: { fontSize: 38, fontWeight: '800' },
  pesoActualUnidad: { fontSize: 18, fontWeight: '700' },
  pesoActualFecha: { fontSize: 11.5, opacity: 0.9, marginTop: 2, fontWeight: '600' },
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
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  pesoCirculo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pesoNum: { fontSize: 15, fontWeight: '800' },
  pesoSub: { fontSize: 9.5, fontWeight: '800', marginTop: -2 },
  cardInfo: { flex: 1 },
  cardFecha: { fontSize: 14, fontWeight: '800' },
  variacion: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  cardSub: { fontSize: 11.5, marginTop: 2 },
  btnDel: { padding: 4 },
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
