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
import { useTheme } from '../../../src/hooks/useTheme';
import {
  obtenerSubcoleccionFirestore,
  guardarRegistroSaludFirestore,
  eliminarRegistroSaludFirestore,
} from '../../../src/services/firestore.service';
import { generarId, formatearFecha } from '../../../src/utils/dates';
import { avisar, confirmar } from '../../../src/utils/dialogs';

const TIPOS = [
  { valor: 'alergia', etiqueta: 'Alergia', emoji: '🤧' },
  { valor: 'enfermedad', etiqueta: 'Dieta / Condición', emoji: '🥗' },
  { valor: 'cirugia', etiqueta: 'Cirugía / Procedimiento', emoji: '🏥' },
  { valor: 'sintoma', etiqueta: 'Síntoma / Comportamiento', emoji: '🔍' },
];

export default function HealthScreen() {
  const { id: mascotaId } = useLocalSearchParams();
  const { colors } = useTheme();

  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFecha, setMostrarFecha] = useState(false);

  const [form, setForm] = useState({
    tipo: 'alergia',
    nombre: '',
    fechaDiagnostico: null,
    notas: '',
  });

  const cargar = useCallback(async () => {
    const datos = await obtenerSubcoleccionFirestore('salud', mascotaId);
    setItems((datos || []).sort((a, b) => new Date(b.creadaEn || 0) - new Date(a.creadaEn || 0)));
  }, [mascotaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const resetForm = () => {
    setForm({ tipo: 'alergia', nombre: '', fechaDiagnostico: null, notas: '' });
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      avisar('Nombre requerido', 'Ingresa la alergia, dieta o condición.');
      return;
    }
    setGuardando(true);
    try {
      const registro = {
        id: generarId(),
        mascotaId,
        tipo: form.tipo,
        nombre: form.nombre.trim(),
        fechaDiagnostico: form.fechaDiagnostico,
        notas: form.notas.trim(),
        creadaEn: new Date().toISOString(),
      };
      await guardarRegistroSaludFirestore('salud', registro);
      await cargar();
      setModalVisible(false);
      resetForm();
    } catch {
      avisar('Error', 'No se pudo guardar el registro.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (item) => {
    setItems((prev) => prev.filter((it) => String(it.id) !== String(item.id)));
    await eliminarRegistroSaludFirestore('salud', item.id);
  };

  const alergias = items.filter((i) => i.tipo === 'alergia');
  const condiciones = items.filter((i) => i.tipo === 'enfermedad');
  const cirugias = items.filter((i) => i.tipo === 'cirugia');
  const sintomas = items.filter((i) => i.tipo === 'sintoma');

  const renderSeccion = (titulo, emoji, lista, colorBorde) => (
    <View style={estilos.seccion}>
      <Text style={[estilos.seccionTitulo, { color: colors.text }]}>
        {emoji} {titulo} ({lista.length})
      </Text>
      {lista.length === 0 ? (
        <View
          style={[
            estilos.sinItemsCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.line,
            },
          ]}
        >
          <Text style={[estilos.sinItems, { color: colors.muted }]}>
            Sin registros en esta sección.
          </Text>
        </View>
      ) : (
        lista.map((item) => (
          <View
            key={item.id}
            style={[
              estilos.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.line,
                borderLeftColor: colorBorde,
                borderLeftWidth: 4,
              },
            ]}
          >
            <View style={estilos.cardRow}>
              <View style={estilos.cardInfo}>
                <Text style={[estilos.cardNombre, { color: colors.text }]}>{item.nombre}</Text>
                {item.fechaDiagnostico && (
                  <Text style={[estilos.cardFecha, { color: colors.muted }]}>
                    Fecha: {formatearFecha(item.fechaDiagnostico)}
                  </Text>
                )}
                {item.notas ? (
                  <Text style={[estilos.cardNotas, { color: colors.muted }]}>{item.notas}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => eliminar(item)} style={estilos.btnDel}>
                <Text style={{ fontSize: 13, color: colors.muted }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={[estilos.contenedor, { backgroundColor: colors.bg }]}>
      <FlatList
        data={[]}
        keyExtractor={() => 'health'}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <View>
            <TouchableOpacity
              style={[estilos.btnAgregar, { backgroundColor: colors.brand }]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={[estilos.btnAgregarTexto, { color: colors.brandInk }]}>
                + Añadir alergia, cirugía o síntoma
              </Text>
            </TouchableOpacity>
            {renderSeccion('Alergias Identificadas', '🤧', alergias, colors.warn)}
            {renderSeccion('Enfermedades, Dietas y Condiciones', '🥗', condiciones, colors.brand)}
            {renderSeccion('Cirugías y Procedimientos', '🏥', cirugias, colors.brand)}
            {renderSeccion('Síntomas y Cambios de Comportamiento', '🔍', sintomas, colors.warn)}
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={estilos.modalOverlay}>
          <TouchableOpacity
            style={estilos.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setModalVisible(false);
              resetForm();
            }}
          />
          <View style={[estilos.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[estilos.sheetHandle, { backgroundColor: colors.line }]} />
            <View style={estilos.modalHeaderRow}>
              <Text style={[estilos.modalTitulo, { color: colors.text }]}>
                Registro Clínico de Salud
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>Tipo de registro</Text>
              <View style={[estilos.tipoRow, { flexWrap: 'wrap' }]}>
                {TIPOS.map((t) => {
                  const activo = form.tipo === t.valor;
                  const esAlerta = t.valor === 'alergia' || t.valor === 'sintoma';
                  const c = esAlerta ? colors.warn : colors.brand;
                  const bg = esAlerta ? colors.warnBg : colors.okBg;
                  return (
                    <TouchableOpacity
                      key={t.valor}
                      style={[
                        estilos.tipoBtn,
                        {
                          minWidth: '46%',
                          backgroundColor: activo ? bg : colors.surface2,
                          borderColor: activo ? c : colors.line,
                        },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, tipo: t.valor }))}
                    >
                      <Text style={{ fontSize: 17 }}>{t.emoji}</Text>
                      <Text
                        style={{
                          fontSize: 11.5,
                          color: activo ? c : colors.muted,
                          fontWeight: '800',
                        }}
                      >
                        {t.etiqueta}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                {form.tipo === 'alergia'
                  ? 'Nombre de la alergia *'
                  : form.tipo === 'cirugia'
                  ? 'Cirugía o procedimiento realizado *'
                  : form.tipo === 'sintoma'
                  ? 'Síntoma o cambio de comportamiento *'
                  : 'Enfermedad, dieta o condición *'}
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
                placeholder={
                  form.tipo === 'alergia'
                    ? 'Ej. Polen, Pollo procesado, Pulgas...'
                    : form.tipo === 'cirugia'
                    ? 'Ej. Esterilización, Limpieza dental, Extracción...'
                    : form.tipo === 'sintoma'
                    ? 'Ej. Decaimiento, Pérdida de apetito, Ansiedad...'
                    : 'Ej. Dieta hipoalergénica, Dermatitis crónica...'
                }
                placeholderTextColor={colors.muted}
                value={form.nombre}
                onChangeText={(t) => setForm((f) => ({ ...f, nombre: t }))}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Fecha de detección (opcional)
              </Text>
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
                  {form.fechaDiagnostico
                    ? `📅 ${formatearFecha(form.fechaDiagnostico)}`
                    : 'Sin fecha específica'}
                </Text>
              </TouchableOpacity>
              {mostrarFecha && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={form.fechaDiagnostico ? new Date(form.fechaDiagnostico) : new Date()}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(e, d) => {
                    setMostrarFecha(false);
                    if (d) setForm((f) => ({ ...f, fechaDiagnostico: d.toISOString() }));
                  }}
                />
              )}

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Observaciones o cuidados (opcional)
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
                placeholder="Instrucciones o precauciones..."
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
                    Guardar Registro
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
    marginBottom: 18,
  },
  btnAgregarTexto: { fontSize: 14, fontWeight: '800' },
  seccion: { marginBottom: 18 },
  seccionTitulo: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  sinItemsCard: { borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center' },
  sinItems: { fontSize: 12.5, fontStyle: 'italic' },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: 15, fontWeight: '800' },
  cardFecha: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  cardNotas: { fontSize: 12, marginTop: 4 },
  btnDel: { padding: 4, marginLeft: 8 },
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
  tipoRow: { flexDirection: 'row', gap: 8 },
  tipoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
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
