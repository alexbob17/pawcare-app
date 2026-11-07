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
import { generarId, formatearFecha, formatearHora, diasHasta } from '../../../src/utils/dates';
import { avisar, confirmar } from '../../../src/utils/dialogs';

export default function AppointmentsScreen() {
  const { id: mascotaId } = useLocalSearchParams();
  const { usuario } = useAuth();
  const { crearRecordatorio } = useReminders(usuario?.id);
  const { colors } = useTheme();

  const [citas, setCitas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [mostrarHora, setMostrarHora] = useState(false);

  // Modal de Diagnóstico y Seguimiento Post-Consulta (Veterinario)
  const [modalSeguimientoVisible, setModalSeguimientoVisible] = useState(false);
  const [citaEnSeguimiento, setCitaEnSeguimiento] = useState(null);
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamientoIndicado, setTratamientoIndicado] = useState('');
  const [seguimientoPostConsulta, setSeguimientoPostConsulta] = useState('');
  const [proximaRevision, setProximaRevision] = useState('');

  const [form, setForm] = useState({
    fecha: new Date().toISOString(),
    hora: null,
    lugar: usuario?.veterinarioClinica || '',
    veterinario: usuario?.veterinarioNombre || '',
    motivo: '',
    notas: '',
  });

  const cargar = useCallback(async () => {
    const datos = await obtenerSubcoleccionFirestore('citas', mascotaId);
    setCitas((datos || []).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
  }, [mascotaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const resetForm = () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(10, 0, 0, 0);
    setForm({
      fecha: manana.toISOString(),
      hora: manana.toISOString(),
      lugar: usuario?.veterinarioClinica || '',
      veterinario: usuario?.veterinarioNombre || '',
      motivo: '',
      notas: '',
    });
  };

  const getFechaCompleta = () => {
    if (!form.fecha) return new Date();
    const d = new Date(form.fecha);
    if (form.hora) {
      const h = new Date(form.hora);
      d.setHours(h.getHours(), h.getMinutes(), 0, 0);
    } else {
      d.setHours(10, 0, 0, 0);
    }
    return d;
  };

  const guardar = async () => {
    if (!form.motivo.trim()) {
      avisar('Motivo requerido', 'Por favor ingresa el motivo de la visita veterinaria.');
      return;
    }
    setGuardando(true);
    try {
      const fechaCompleta = getFechaCompleta();
      const cita = {
        id: generarId(),
        mascotaId,
        fecha: fechaCompleta.toISOString(),
        lugar: form.lugar.trim(),
        veterinario: form.veterinario.trim(),
        motivo: form.motivo.trim(),
        notas: form.notas.trim(),
        creadaEn: new Date().toISOString(),
      };
      await guardarRegistroSaludFirestore('citas', cita);

      await crearRecordatorio({
        titulo: form.motivo.trim(),
        cuerpo: form.notas.trim() || 'Visita veterinaria programada',
        lugar: form.lugar.trim(),
        veterinario: form.veterinario.trim(),
        fecha: fechaCompleta,
        mascotaId,
        tipo: 'cita',
        referenciaId: cita.id,
      });

      await cargar();
      setModalVisible(false);
      resetForm();
    } catch {
      avisar('Error', 'No se pudo guardar la cita médica.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (cita) => {
    setCitas((prev) => prev.filter((c) => String(c.id) !== String(cita.id)));
    await eliminarRegistroSaludFirestore('citas', cita.id);
    await eliminarRecordatorioFirestore(cita.id);
  };

  const abrirModalSeguimiento = (cita) => {
    setCitaEnSeguimiento(cita);
    setDiagnostico(cita.diagnostico || '');
    setTratamientoIndicado(cita.tratamientoIndicado || '');
    setSeguimientoPostConsulta(cita.seguimientoPostConsulta || '');
    setProximaRevision(cita.proximaRevision || '');
    setModalSeguimientoVisible(true);
  };

  const guardarSeguimientoVet = async () => {
    if (!citaEnSeguimiento) return;
    if (!diagnostico.trim() && !seguimientoPostConsulta.trim()) {
      avisar(
        'Información requerida',
        'Por favor ingresa el diagnóstico o las notas de seguimiento post-consulta.'
      );
      return;
    }
    setGuardando(true);
    try {
      const citaActualizada = {
        ...citaEnSeguimiento,
        diagnostico: diagnostico.trim(),
        tratamientoIndicado: tratamientoIndicado.trim(),
        seguimientoPostConsulta: seguimientoPostConsulta.trim(),
        proximaRevision: proximaRevision.trim(),
        fechaSeguimiento: new Date().toISOString(),
      };
      await guardarRegistroSaludFirestore('citas', citaActualizada);
      setCitas((prev) =>
        prev.map((c) => (String(c.id) === String(citaActualizada.id) ? citaActualizada : c))
      );
      setModalSeguimientoVisible(false);
      setCitaEnSeguimiento(null);
    } catch {
      avisar('Error', 'No se pudo guardar el seguimiento post-consulta.');
    } finally {
      setGuardando(false);
    }
  };

  const badgeDias = (fecha) => {
    const d = diasHasta(fecha);
    if (d < 0) return { texto: 'Vencida', color: colors.warn, bg: colors.warnBg };
    if (d === 0) return { texto: 'Hoy', color: colors.brand, bg: colors.okBg };
    if (d === 1) return { texto: 'Mañana', color: colors.brand, bg: colors.okBg };
    return { texto: `En ${d} días`, color: colors.brand, bg: colors.okBg };
  };

  return (
    <View style={[estilos.contenedor, { backgroundColor: colors.bg }]}>
      <FlatList
        data={citas}
        keyExtractor={(item) => item.id}
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
              + Agendar cita veterinaria
            </Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <View style={[estilos.vacioIconoContenedor, { backgroundColor: colors.okBg }]}>
              <Text style={{ fontSize: 28 }}>🩺</Text>
            </View>
            <Text style={[estilos.vacioTitulo, { color: colors.text }]}>
              Sin citas médicas programadas
            </Text>
            <Text style={[estilos.vacioSub, { color: colors.muted }]}>
              Agenda chequeos, consultas o baños e indica el lugar de la veterinaria donde será la visita.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const badge = badgeDias(item.fecha);
          const esPasada = diasHasta(item.fecha) < 0;
          return (
            <View
              style={[
                estilos.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: esPasada ? colors.warn : colors.line,
                },
              ]}
            >
              <View style={estilos.cardHeader}>
                <View style={[estilos.cardIcono, { backgroundColor: colors.surface2 }]}>
                  <Text style={{ fontSize: 20 }}>🩺</Text>
                </View>
                <View style={estilos.cardInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={[estilos.cardNombre, { color: colors.text, flex: 1 }]}>
                      {item.motivo}
                    </Text>
                    <View style={[estilos.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[estilos.badgeTexto, { color: badge.color }]}>
                        {badge.texto}
                      </Text>
                    </View>
                  </View>
                  <Text style={[estilos.cardFecha, { color: esPasada ? colors.warn : colors.muted }]}>
                    📅 {formatearFecha(item.fecha)} · {formatearHora(item.fecha)}
                  </Text>
                  {item.lugar ? (
                    <Text style={[estilos.cardSub, { color: colors.brand, fontWeight: '700' }]}>
                      📍 Lugar de visita: {item.lugar}
                    </Text>
                  ) : null}
                  {item.veterinario ? (
                    <Text style={[estilos.cardSub, { color: colors.muted }]}>
                      🩺 Dr(a). {item.veterinario}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => eliminar(item)} style={estilos.btnDel}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>✕</Text>
                </TouchableOpacity>
              </View>
              {item.notas ? (
                <Text
                  style={[
                    estilos.notas,
                    { borderTopColor: colors.line, color: colors.muted },
                  ]}
                >
                  📝 {item.notas}
                </Text>
              ) : null}

              {/* Caja de Diagnóstico y Seguimiento Post-Consulta (si ya fue registrado) */}
              {(item.diagnostico || item.seguimientoPostConsulta || item.tratamientoIndicado) ? (
                <View
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: colors.okBg,
                    borderWidth: 1,
                    borderColor: colors.brand,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.brand }}>
                    📋 DIAGNÓSTICO Y SEGUIMIENTO POST-CONSULTA
                  </Text>
                  {item.diagnostico ? (
                    <Text style={{ fontSize: 12.5, color: colors.text, marginTop: 4, fontWeight: '700' }}>
                      • Diagnóstico: {item.diagnostico}
                    </Text>
                  ) : null}
                  {item.tratamientoIndicado ? (
                    <Text style={{ fontSize: 12, color: colors.text, marginTop: 2 }}>
                      • Tratamiento / Receta: {item.tratamientoIndicado}
                    </Text>
                  ) : null}
                  {item.seguimientoPostConsulta ? (
                    <Text style={{ fontSize: 12, color: colors.text, marginTop: 2 }}>
                      • Evolución / Cuidados: {item.seguimientoPostConsulta}
                    </Text>
                  ) : null}
                  {item.proximaRevision ? (
                    <Text style={{ fontSize: 11.5, color: colors.brand, marginTop: 4, fontWeight: '800' }}>
                      📅 Próximo control sugerido: {item.proximaRevision}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {/* Botón para agregar/editar seguimiento post-consulta del veterinario */}
              <TouchableOpacity
                style={{
                  marginTop: 10,
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surface2,
                  borderWidth: 1,
                  borderColor: colors.line,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
                onPress={() => abrirModalSeguimiento(item)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13 }}>📋</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.brand }}>
                  {item.diagnostico || item.seguimientoPostConsulta
                    ? 'Editar diagnóstico / seguimiento post-consulta'
                    : '+ Agregar diagnóstico y seguimiento post-consulta (Vet)'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Modal de Diagnóstico y Seguimiento Post-Consulta (Veterinario) */}
      <Modal
        visible={modalSeguimientoVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalSeguimientoVisible(false)}
      >
        <View style={estilos.modalOverlay}>
          <TouchableOpacity
            style={estilos.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalSeguimientoVisible(false)}
          />
          <View style={[estilos.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[estilos.sheetHandle, { backgroundColor: colors.line }]} />
            <View style={estilos.modalHeaderRow}>
              <Text style={[estilos.modalTitulo, { color: colors.text }]}>
                Seguimiento Post-Consulta 📋
              </Text>
              <TouchableOpacity onPress={() => setModalSeguimientoVisible(false)}>
                <Text style={{ color: colors.muted, fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              <Text style={{ fontSize: 12.5, color: colors.muted, marginBottom: 8 }}>
                Espacio para que el médico veterinario o tutor registre el diagnóstico clínico, receta y evolución posterior a la cita “{citaEnSeguimiento?.motivo}”.
              </Text>

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Diagnóstico del veterinario *
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
                placeholder="Ej. Otitis leve controlada, Gastroenteritis, Chequeo sano..."
                placeholderTextColor={colors.muted}
                value={diagnostico}
                onChangeText={setDiagnostico}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Tratamiento o receta indicada
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
                placeholder="Ej. Limpieza ótica cada 12h por 7 días + antiinflamatorio..."
                placeholderTextColor={colors.muted}
                value={tratamientoIndicado}
                onChangeText={setTratamientoIndicado}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Seguimiento post-consulta y evolución *
              </Text>
              <TextInput
                style={[
                  estilos.input,
                  {
                    height: 76,
                    paddingTop: 10,
                    textAlignVertical: 'top',
                    backgroundColor: colors.surface2,
                    borderColor: colors.line,
                    color: colors.text,
                  },
                ]}
                multiline
                placeholder="Ej. Vigilar apetito las próximas 48h, mantener collar isabelino, evolucionando favorablemente..."
                placeholderTextColor={colors.muted}
                value={seguimientoPostConsulta}
                onChangeText={setSeguimientoPostConsulta}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Próxima revisión o control sugerido (opcional)
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
                placeholder="Ej. Revisión de puntos en 10 días / Control en 1 mes"
                placeholderTextColor={colors.muted}
                value={proximaRevision}
                onChangeText={setProximaRevision}
              />

              <TouchableOpacity
                style={[estilos.btnGuardar, { backgroundColor: colors.brand }]}
                onPress={guardarSeguimientoVet}
                disabled={guardando}
                activeOpacity={0.85}
              >
                {guardando ? (
                  <ActivityIndicator color={colors.brandInk} size="small" />
                ) : (
                  <Text style={[estilos.btnGuardarTexto, { color: colors.brandInk }]}>
                    Guardar Seguimiento Post-Consulta
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Agendar Cita */}
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
                Agendar Cita Veterinaria 🩺
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.muted, fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Motivo de la visita *
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
                placeholder="Ej. Chequeo general, vacuna, control..."
                placeholderTextColor={colors.muted}
                value={form.motivo}
                onChangeText={(t) => setForm((f) => ({ ...f, motivo: t }))}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                📍 Lugar / Clínica Veterinaria donde será la visita *
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
                placeholder="Ej. Clínica Veterinaria San Francisco, Sucursal Centro"
                placeholderTextColor={colors.muted}
                value={form.lugar}
                onChangeText={(t) => setForm((f) => ({ ...f, lugar: t }))}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Médico Veterinario (opcional)
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
                placeholder="Ej. Dra. Sofía Martínez"
                placeholderTextColor={colors.muted}
                value={form.veterinario}
                onChangeText={(t) => setForm((f) => ({ ...f, veterinario: t }))}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Fecha y Hora de la cita
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[
                    estilos.fechaBtn,
                    { flex: 1, backgroundColor: colors.surface2, borderColor: colors.brand },
                  ]}
                  onPress={() => setMostrarFecha(true)}
                >
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                    📅 {form.fecha ? formatearFecha(form.fecha) : 'Seleccionar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    estilos.fechaBtn,
                    { width: '42%', backgroundColor: colors.surface2, borderColor: colors.brand },
                  ]}
                  onPress={() => setMostrarHora(true)}
                >
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                    🕐 {form.hora ? formatearHora(form.hora) : '10:00'}
                  </Text>
                </TouchableOpacity>
              </View>

              {mostrarFecha && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={form.fecha ? new Date(form.fecha) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setMostrarFecha(false);
                    if (d) setForm((f) => ({ ...f, fecha: d.toISOString() }));
                  }}
                />
              )}

              {mostrarHora && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={form.hora ? new Date(form.hora) : new Date()}
                  mode="time"
                  display="default"
                  onChange={(e, d) => {
                    setMostrarHora(false);
                    if (d) setForm((f) => ({ ...f, hora: d.toISOString() }));
                  }}
                />
              )}

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Notas adicionales (opcional)
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
                placeholder="Ej. Llevar muestra o carnet..."
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
                    Guardar Cita
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
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  badgeTexto: { fontSize: 10.5, fontWeight: '800' },
  btnDel: { padding: 4, marginLeft: 6 },
  notas: { fontSize: 11.5, marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
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
