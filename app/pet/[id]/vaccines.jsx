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
import { generarId, formatearFecha, formatearHora } from '../../../src/utils/dates';
import { cancelarRecordatorio } from '../../../src/services/notifications';
import { avisar, confirmar } from '../../../src/utils/dialogs';

const CATEGORIAS_CONTROL = [
  { id: 'vacuna', label: '💉 Vacuna', emoji: '💉' },
  { id: 'desparasitacion_interna', label: '🪱 Desp. Interna', emoji: '🪱' },
  { id: 'desparasitacion_externa', label: '💧 Desp. Externa (Pipeta)', emoji: '💧' },
];

const FILTROS_VAC = [
  { id: 'todos', label: 'Todos' },
  { id: 'vacuna', label: '💉 Vacunas' },
  { id: 'desparasitacion_interna', label: '🪱 Desp. Interna' },
  { id: 'desparasitacion_externa', label: '💧 Desp. Externa' },
];

export default function VaccinesScreen() {
  const { id: mascotaId } = useLocalSearchParams();
  const { usuario } = useAuth();
  const { crearRecordatorio, obtenerMisRecordatorios } = useReminders(usuario?.id);
  const { colors } = useTheme();

  const [vacunas, setVacunas] = useState([]);
  const [filtroCat, setFiltroCat] = useState('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFechaApp, setMostrarFechaApp] = useState(false);
  const [mostrarHoraProg, setMostrarHoraProg] = useState(false);
  const [mostrarFechaProx, setMostrarFechaProx] = useState(false);

  const [form, setForm] = useState({
    categoria: 'vacuna',
    nombre: '',
    estadoControl: 'aplicada', // 'aplicada' | 'pendiente'
    fechaAplicacion: new Date().toISOString(),
    fechaProgramada: new Date().toISOString(),
    proximaDosis: null,
    lugar: usuario?.veterinarioClinica || '',
    veterinario: usuario?.veterinarioNombre || '',
    notas: '',
  });

  const cargar = useCallback(async () => {
    const datos = await obtenerSubcoleccionFirestore('vacunas', mascotaId);
    setVacunas(
      (datos || []).sort((a, b) => {
        const fechaB = new Date(b.fechaProgramada || b.fechaAplicacion || 0);
        const fechaA = new Date(a.fechaProgramada || a.fechaAplicacion || 0);
        return fechaB - fechaA;
      })
    );
  }, [mascotaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const abrirNuevo = () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(10, 0, 0, 0);

    setForm({
      categoria: filtroCat === 'todos' ? 'vacuna' : filtroCat,
      nombre: '',
      estadoControl: 'aplicada',
      fechaAplicacion: new Date().toISOString(),
      fechaProgramada: manana.toISOString(),
      proximaDosis: null,
      lugar: usuario?.veterinarioClinica || '',
      veterinario: usuario?.veterinarioNombre || '',
      notas: '',
    });
    setModalVisible(true);
  };

  const asignarProxDosisDias = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    d.setHours(9, 0, 0, 0);
    setForm((f) => ({ ...f, proximaDosis: d.toISOString() }));
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      avisar('Nombre requerido', 'Ingresa el nombre de la vacuna o antiparasitario.');
      return;
    }
    setGuardando(true);
    try {
      const cat = form.categoria || 'vacuna';
      const esPendiente = form.estadoControl === 'pendiente';
      const vacuna = {
        id: generarId(),
        mascotaId,
        categoria: cat,
        nombre: form.nombre.trim(),
        aplicada: !esPendiente,
        estado: esPendiente ? 'pendiente' : 'aplicada',
        fechaAplicacion: esPendiente ? null : form.fechaAplicacion,
        fechaProgramada: esPendiente ? form.fechaProgramada : null,
        proximaDosis: form.proximaDosis,
        lugar: form.lugar.trim(),
        veterinario: form.veterinario.trim(),
        notas: form.notas.trim(),
        creadaEn: new Date().toISOString(),
      };
      await guardarRegistroSaludFirestore('vacunas', vacuna);

      // Si es pendiente o tiene próxima dosis, crear recordatorio en Agenda
      const fechaNotif = esPendiente ? new Date(form.fechaProgramada) : form.proximaDosis ? new Date(form.proximaDosis) : null;
      if (fechaNotif) {
        const prefijo =
          cat === 'desparasitacion_interna'
            ? 'Desparasitación Interna'
            : cat === 'desparasitacion_externa'
            ? 'Desparasitación Externa'
            : 'Vacuna';
        await crearRecordatorio({
          titulo: `${prefijo}: ${form.nombre.trim()}`,
          cuerpo: esPendiente ? 'Cita programada de aplicación.' : 'Próxima dosis o refuerzo programado.',
          lugar: form.lugar.trim(),
          veterinario: form.veterinario.trim(),
          fecha: fechaNotif,
          mascotaId,
          tipo: 'vacuna',
          referenciaId: vacuna.id,
        });
      }

      await cargar();
      setModalVisible(false);
    } catch {
      avisar('Error', 'No se pudo guardar el registro.');
    } finally {
      setGuardando(false);
    }
  };

  /** Elimina de la Agenda los recordatorios ligados a esta vacuna (por id o referenciaId) y cancela su notificación. */
  const limpiarRecordatoriosVinculados = async (vacunaId) => {
    try {
      const todos = (await obtenerMisRecordatorios()) || [];
      const vinculados = todos.filter(
        (r) =>
          String(r.id) === String(vacunaId) || String(r.referenciaId) === String(vacunaId)
      );
      for (const r of vinculados) {
        if (r.notifId) {
          await cancelarRecordatorio(r.notifId).catch(() => {});
        }
        await eliminarRecordatorioFirestore(r.id);
      }
      if (vinculados.length === 0) {
        await eliminarRecordatorioFirestore(vacunaId);
      }
    } catch {}
  };

  const marcarComoAplicada = async (vacuna) => {
    const ahora = new Date().toISOString();
    const actualizada = {
      ...vacuna,
      aplicada: true,
      estado: 'aplicada',
      fechaAplicacion: ahora,
    };
    setVacunas((prev) =>
      prev.map((v) => (String(v.id) === String(vacuna.id) ? actualizada : v))
    );
    await guardarRegistroSaludFirestore('vacunas', actualizada);
    // Quitar el recordatorio pendiente de la Agenda (y su notificación) porque ya se aplicó
    await limpiarRecordatoriosVinculados(vacuna.id);
    avisar('¡Vacuna aplicada!', `Se registró la aplicación de ${vacuna.nombre}.`);
  };

  const eliminar = async (vacuna) => {
    setVacunas((prev) => prev.filter((v) => String(v.id) !== String(vacuna.id)));
    await eliminarRegistroSaludFirestore('vacunas', vacuna.id);
    await limpiarRecordatoriosVinculados(vacuna.id);
  };

  const vacunasFiltradas = vacunas.filter((v) => {
    const cat = v.categoria || 'vacuna';
    if (filtroCat === 'todos') return true;
    return cat === filtroCat;
  });

  const emojiPorCat = (cat) =>
    cat === 'desparasitacion_interna'
      ? '🪱'
      : cat === 'desparasitacion_externa'
      ? '💧'
      : '💉';

  const etiquetaPorCat = (cat) =>
    cat === 'desparasitacion_interna'
      ? 'Desparasitación Interna'
      : cat === 'desparasitacion_externa'
      ? 'Desparasitación Externa'
      : 'Vacuna';

  return (
    <View style={[estilos.contenedor, { backgroundColor: colors.bg }]}>
      <FlatList
        data={vacunasFiltradas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <View>
            <TouchableOpacity
              style={[estilos.btnAgregar, { backgroundColor: colors.brand }]}
              onPress={abrirNuevo}
              activeOpacity={0.85}
            >
              <Text style={[estilos.btnAgregarTexto, { color: colors.brandInk }]}>
                + Agregar vacuna o desparasitación
              </Text>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
            >
              {FILTROS_VAC.map((f) => {
                const act = filtroCat === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      estilos.atajoChip,
                      {
                        backgroundColor: act ? colors.okBg : colors.surface,
                        borderColor: act ? colors.brand : colors.line,
                        paddingHorizontal: 13,
                        paddingVertical: 7,
                      },
                    ]}
                    onPress={() => setFiltroCat(f.id)}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: act ? colors.brand : colors.muted,
                      }}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <View style={[estilos.vacioIconoContenedor, { backgroundColor: colors.okBg }]}>
              <Text style={{ fontSize: 28 }}>💉</Text>
            </View>
            <Text style={[estilos.vacioTitulo, { color: colors.text }]}>
              Sin vacunas ni desparasitaciones
            </Text>
            <Text style={[estilos.vacioSub, { color: colors.muted }]}>
              Registra vacunas, desparasitación interna y externa (pipetas/tabletas), fecha de próxima dosis y clínica veterinaria.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const esPendiente = item.aplicada === false || item.estado === 'pendiente';
          const fechaObjetivo = item.fechaProgramada || item.proximaDosis || item.fechaAplicacion;
          const fechaObjDate = fechaObjetivo ? new Date(fechaObjetivo) : null;
          const esVencida = esPendiente && fechaObjDate && fechaObjDate < new Date();

          return (
            <View
              style={[
                estilos.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: esVencida ? colors.warn : esPendiente ? colors.brand : colors.line,
                },
              ]}
            >
              <View style={estilos.cardHeader}>
                <View
                  style={[
                    estilos.cardIcono,
                    { backgroundColor: esVencida ? '#FEE2E2' : colors.surface2 },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>
                    {esVencida ? '⚠️' : esPendiente ? '⏳' : emojiPorCat(item.categoria)}
                  </Text>
                </View>
                <View style={estilos.cardInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[estilos.cardNombre, { color: colors.text }]}>{item.nombre}</Text>
                    <View
                      style={{
                        backgroundColor: esVencida
                          ? '#FEE2E2'
                          : esPendiente
                          ? colors.okBg
                          : colors.okBg,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 99,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: esVencida ? colors.warn : colors.brand,
                        }}
                      >
                        {esVencida
                          ? '⚠️ Pendiente (Vencida)'
                          : esPendiente
                          ? '⏳ Agendada'
                          : '✅ Aplicada'}
                      </Text>
                    </View>
                  </View>

                  {esPendiente ? (
                    <Text
                      style={[
                        estilos.cardFecha,
                        { color: esVencida ? colors.warn : colors.brand, fontWeight: '700' },
                      ]}
                    >
                      📅 Programada: {fechaObjetivo ? `${formatearFecha(fechaObjetivo)}, ${formatearHora(fechaObjetivo)}` : 'Por definir'}
                    </Text>
                  ) : (
                    <Text style={[estilos.cardFecha, { color: colors.muted }]}>
                      Aplicada: {formatearFecha(item.fechaAplicacion)}
                    </Text>
                  )}

                  {!esPendiente && item.proximaDosis && (
                    <Text style={[estilos.proximaDosis, { color: colors.brand }]}>
                      📅 Próximo refuerzo: {formatearFecha(item.proximaDosis)}
                    </Text>
                  )}

                  {item.lugar ? (
                    <Text style={[estilos.lugarTexto, { color: colors.text }]}>
                      📍 Lugar: {item.lugar}
                    </Text>
                  ) : null}
                  {item.veterinario ? (
                    <Text style={[estilos.veterinario, { color: colors.muted }]}>
                      🩺 Dr(a). {item.veterinario}
                    </Text>
                  ) : null}

                  {esPendiente && (
                    <TouchableOpacity
                      style={[estilos.btnMarcarAplicada, { backgroundColor: colors.okBg, borderColor: colors.brand }]}
                      onPress={() => marcarComoAplicada(item)}
                      activeOpacity={0.82}
                    >
                      <Text style={[estilos.btnMarcarAplicadaTexto, { color: colors.brand }]}>
                        ✓ Confirmar que ya fue aplicada
                      </Text>
                    </TouchableOpacity>
                  )}
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
            </View>
          );
        }}
      />

      {/* Modal Nueva Vacuna */}
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
                Vacuna o Desparasitación 💉
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.muted, fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Estado de este registro
              </Text>
              <View style={estilos.atajosRow}>
                {[
                  { id: 'aplicada', label: '✅ Ya aplicada' },
                  { id: 'pendiente', label: '⏳ Programar / Agendar para después' },
                ].map((st) => {
                  const act = form.estadoControl === st.id;
                  return (
                    <TouchableOpacity
                      key={st.id}
                      style={[
                        estilos.atajoChip,
                        {
                          backgroundColor: act ? colors.brand : colors.surface2,
                          borderColor: act ? colors.brand : colors.line,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                        },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, estadoControl: st.id }))}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: act ? colors.brandInk : colors.text,
                        }}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Categoría de control preventivo
              </Text>
              <View style={estilos.atajosRow}>
                {CATEGORIAS_CONTROL.map((cat) => {
                  const act = form.categoria === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        estilos.atajoChip,
                        {
                          backgroundColor: act ? colors.brand : colors.surface2,
                          borderColor: act ? colors.brand : colors.line,
                          paddingVertical: 8,
                          paddingHorizontal: 11,
                        },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, categoria: cat.id }))}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontWeight: '800',
                          color: act ? colors.brandInk : colors.text,
                        }}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                {form.categoria === 'vacuna'
                  ? 'Nombre de la vacuna *'
                  : 'Nombre del desparasitante / pipeta *'}
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
                  form.categoria === 'vacuna'
                    ? 'Ej. Triple felina, Antirrábica, Séxtuple...'
                    : form.categoria === 'desparasitacion_interna'
                    ? 'Ej. Drontal, Milbemax, Panacur...'
                    : 'Ej. Bravecto, NexGard, Frontline Pipeta...'
                }
                placeholderTextColor={colors.muted}
                value={form.nombre}
                onChangeText={(t) => setForm((f) => ({ ...f, nombre: t }))}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                📍 Lugar o Clínica Veterinaria de la visita
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
                placeholder="Ej. Clínica Veterinaria San Francisco, Centro"
                placeholderTextColor={colors.muted}
                value={form.lugar}
                onChangeText={(t) => setForm((f) => ({ ...f, lugar: t }))}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Veterinario que atendió (opcional)
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
                placeholder="Nombre del médico veterinario"
                placeholderTextColor={colors.muted}
                value={form.veterinario}
                onChangeText={(t) => setForm((f) => ({ ...f, veterinario: t }))}
              />

              {form.estadoControl === 'pendiente' ? (
                <>
                  <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                    📅 Fecha y hora programada de la cita *
                  </Text>
                  <View style={estilos.filaFechaHora}>
                    <TouchableOpacity
                      style={[
                        estilos.fechaBtn,
                        { flex: 1, backgroundColor: colors.surface2, borderColor: colors.brand },
                      ]}
                      onPress={() => setMostrarFechaApp(true)}
                    >
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                        📅 {formatearFecha(form.fechaProgramada)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        estilos.fechaBtn,
                        { width: '42%', backgroundColor: colors.surface2, borderColor: colors.brand },
                      ]}
                      onPress={() => setMostrarHoraProg(true)}
                    >
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                        🕐 {formatearHora(form.fechaProgramada)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[estilos.atajosRow, { marginTop: 6 }]}>
                    {[
                      { label: '09:00 AM', h: 9, m: 0 },
                      { label: '11:00 AM', h: 11, m: 0 },
                      { label: '03:00 PM', h: 15, m: 0 },
                      { label: '05:00 PM', h: 17, m: 0 },
                    ].map((hr) => (
                      <TouchableOpacity
                        key={hr.label}
                        style={[
                          estilos.atajoChip,
                          { backgroundColor: colors.surface2, borderColor: colors.line },
                        ]}
                        onPress={() => {
                          const d = new Date(form.fechaProgramada || new Date());
                          d.setHours(hr.h, hr.m, 0, 0);
                          setForm((f) => ({ ...f, fechaProgramada: d.toISOString() }));
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted }}>
                          {hr.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {mostrarFechaApp && Platform.OS !== 'web' && (
                    <DateTimePicker
                      value={form.fechaProgramada ? new Date(form.fechaProgramada) : new Date()}
                      mode="date"
                      display="default"
                      onChange={(e, d) => {
                        setMostrarFechaApp(false);
                        if (d) {
                          const prev = new Date(form.fechaProgramada || new Date());
                          const nueva = new Date(d);
                          nueva.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                          setForm((f) => ({ ...f, fechaProgramada: nueva.toISOString() }));
                        }
                      }}
                    />
                  )}

                  {mostrarHoraProg && Platform.OS !== 'web' && (
                    <DateTimePicker
                      value={form.fechaProgramada ? new Date(form.fechaProgramada) : new Date()}
                      mode="time"
                      display="default"
                      onChange={(e, d) => {
                        setMostrarHoraProg(false);
                        if (d) {
                          const prev = new Date(form.fechaProgramada || new Date());
                          prev.setHours(d.getHours(), d.getMinutes(), 0, 0);
                          setForm((f) => ({ ...f, fechaProgramada: prev.toISOString() }));
                        }
                      }}
                    />
                  )}
                </>
              ) : (
                <>
                  <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                    Fecha de aplicación
                  </Text>
                  <TouchableOpacity
                    style={[
                      estilos.fechaBtn,
                      { backgroundColor: colors.surface2, borderColor: colors.line },
                    ]}
                    onPress={() => setMostrarFechaApp(true)}
                  >
                    <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '700' }}>
                      📅 {formatearFecha(form.fechaAplicacion)}
                    </Text>
                    <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '800' }}>
                      Cambiar
                    </Text>
                  </TouchableOpacity>
                  {mostrarFechaApp && Platform.OS !== 'web' && (
                    <DateTimePicker
                      value={form.fechaAplicacion ? new Date(form.fechaAplicacion) : new Date()}
                      mode="date"
                      display="default"
                      onChange={(e, d) => {
                        setMostrarFechaApp(false);
                        if (d) setForm((f) => ({ ...f, fechaAplicacion: d.toISOString() }));
                      }}
                    />
                  )}

                  <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                    Próxima dosis / refuerzo (creará recordatorio en Agenda)
                  </Text>
                  <TouchableOpacity
                    style={[
                      estilos.fechaBtn,
                      { backgroundColor: colors.surface2, borderColor: colors.brand },
                    ]}
                    onPress={() => setMostrarFechaProx(true)}
                  >
                    <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '700' }}>
                      {form.proximaDosis
                        ? `📅 ${formatearFecha(form.proximaDosis)}`
                        : 'Sin fecha de próxima dosis (toca para elegir)'}
                    </Text>
                  </TouchableOpacity>

                  <View style={estilos.atajosRow}>
                    {[
                      { label: '+15 días', d: 15 },
                      { label: '+1 mes', d: 30 },
                      { label: '+6 meses', d: 180 },
                      { label: '+1 año', d: 365 },
                    ].map((op) => (
                      <TouchableOpacity
                        key={op.label}
                        style={[
                          estilos.atajoChip,
                          { backgroundColor: colors.okBg, borderColor: colors.brand },
                        ]}
                        onPress={() => asignarProxDosisDias(op.d)}
                      >
                        <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.brand }}>
                          {op.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {mostrarFechaProx && Platform.OS !== 'web' && (
                    <DateTimePicker
                      value={form.proximaDosis ? new Date(form.proximaDosis) : new Date()}
                      mode="date"
                      display="default"
                      onChange={(e, d) => {
                        setMostrarFechaProx(false);
                        if (d) {
                          const nueva = new Date(d);
                          nueva.setHours(9, 0, 0, 0);
                          setForm((f) => ({ ...f, proximaDosis: nueva.toISOString() }));
                        }
                      }}
                    />
                  )}
                </>
              )}

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Notas u observaciones (opcional)
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
                placeholder="Ej. Lote de vacuna, reacción..."
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
                    Guardar Vacuna
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
  proximaDosis: { fontSize: 12, fontWeight: '800', marginTop: 3 },
  lugarTexto: { fontSize: 12, fontWeight: '700', marginTop: 3 },
  veterinario: { fontSize: 11.5, marginTop: 2 },
  btnMarcarAplicada: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnMarcarAplicadaTexto: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  btnDel: { padding: 4 },
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
  filaFechaHora: { flexDirection: 'row', gap: 8, alignItems: 'center' },
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
  atajosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  atajoChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
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
