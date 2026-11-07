import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../src/hooks/useAuth';
import { usePets } from '../../src/hooks/usePets';
import { useReminders } from '../../src/hooks/useReminders';
import { useTheme } from '../../src/hooks/useTheme';
import {
  obtenerRecordatoriosEnMemoria,
  guardarRegistroSaludFirestore,
} from '../../src/services/firestore.service';
import { emojiSoloEspecie } from '../../src/constants/pets';
import {
  formatearFecha,
  formatearFechaCorta,
  formatearHora,
  diasHasta,
} from '../../src/utils/dates';
import { avisar } from '../../src/utils/dialogs';

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'vacuna', label: 'Vacunas' },
  { id: 'medicamento', label: 'Medicinas' },
  { id: 'cita', label: 'Citas' },
];

export default function RemindersScreen() {
  const { usuario } = useAuth();
  const { mascotas, cargarMascotas } = usePets(usuario?.id);
  const {
    obtenerMisRecordatorios,
    crearRecordatorio,
    actualizarRecordatorio,
    borrarRecordatorio,
  } = useReminders(usuario?.id);
  const { colors } = useTheme();

  // Inicializar con caché en memoria para 0ms de demora al cambiar de pestañas
  const [recordatorios, setRecordatorios] = useState(() =>
    obtenerRecordatoriosEnMemoria(usuario?.id)
  );
  const [refrescando, setRefrescando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [eventoABorrar, setEventoABorrar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState('todos');

  // Estado del formulario (Crear o Reagendar)
  const [editandoRec, setEditandoRec] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [lugar, setLugar] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [tipo, setTipo] = useState('vacuna');
  const [mascotaId, setMascotaId] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(10, 0, 0, 0);
    return manana;
  });
  const [mostrarPickerFecha, setMostrarPickerFecha] = useState(false);
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);

  const cargar = useCallback(async () => {
    try {
      await cargarMascotas();
      const todos = await obtenerMisRecordatorios();
      setRecordatorios(todos || []);
    } catch (e) {
      console.warn('Error cargando agenda:', e);
    }
  }, [cargarMascotas, obtenerMisRecordatorios]);

  // Seleccionar primera mascota por defecto sin provocar bucles en useFocusEffect
  useEffect(() => {
    if (mascotas.length > 0 && !mascotaId) {
      setMascotaId(mascotas[0].id);
    }
  }, [mascotas.length, mascotaId]);

  // Recargar datos al enfocar la pestaña (sin incluir mascotas en dependencias para evitar bucle infinito)
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const alRefrescar = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  const abrirModalNuevo = () => {
    setEditandoRec(null);
    setTitulo('');
    setLugar(usuario?.veterinarioClinica || '');
    setCuerpo('');
    setTipo('vacuna');
    setMascotaId(mascotas[0]?.id || '');
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    setFechaSeleccionada(d);
    setModalVisible(true);
  };

  const abrirModalReagendar = (rec) => {
    setEditandoRec(rec);
    setTitulo(rec.titulo || '');
    setLugar(rec.lugar || usuario?.veterinarioClinica || '');
    setCuerpo(rec.cuerpo || '');
    setTipo(rec.tipo || 'cita');
    setMascotaId(rec.mascotaId || mascotas[0]?.id || '');
    const d = rec.fecha ? new Date(rec.fecha) : new Date();
    if (d < new Date()) {
      const nueva = new Date();
      nueva.setDate(nueva.getDate() + 1);
      nueva.setHours(10, 0, 0, 0);
      setFechaSeleccionada(nueva);
    } else {
      setFechaSeleccionada(d);
    }
    setModalVisible(true);
  };

  const ajustarDiasRapido = (diasSumar) => {
    const nueva = new Date();
    nueva.setDate(nueva.getDate() + diasSumar);
    nueva.setHours(fechaSeleccionada.getHours(), fechaSeleccionada.getMinutes(), 0, 0);
    setFechaSeleccionada(nueva);
  };

  const ajustarHoraRapida = (hora, min = 0) => {
    const nueva = new Date(fechaSeleccionada);
    nueva.setHours(hora, min, 0, 0);
    setFechaSeleccionada(nueva);
  };

  const handleGuardar = async () => {
    if (!titulo.trim()) {
      avisar('Título requerido', 'Por favor ingresa el nombre de la vacuna, medicina o cita.');
      return;
    }
    const idMascotaElegida = mascotaId || mascotas[0]?.id || null;
    const lugarFinal =
      tipo === 'medicamento' || tipo === 'cumpleanos' ? '' : lugar.trim();
    setGuardando(true);
    try {
      if (editandoRec) {
        const actualizado = await actualizarRecordatorio({
          ...editandoRec,
          titulo: titulo.trim(),
          lugar: lugarFinal,
          cuerpo: cuerpo.trim(),
          tipo,
          mascotaId: idMascotaElegida,
          fecha: fechaSeleccionada.toISOString(),
        });
        setRecordatorios((prev) =>
          prev.map((it) => (String(it.id) === String(actualizado.id) ? actualizado : it))
        );

        // Sincronizar fecha reagendada en el registro clínico de la mascota
        if (idMascotaElegida && tipo === 'vacuna') {
          const refId = editandoRec.referenciaId || editandoRec.id;
          await guardarRegistroSaludFirestore('vacunas', {
            id: refId,
            mascotaId: idMascotaElegida,
            nombre: titulo.trim(),
            aplicada: false,
            estado: 'pendiente',
            fechaProgramada: fechaSeleccionada.toISOString(),
            lugar: lugarFinal,
            notas: cuerpo.trim(),
          });
        }
      } else {
        const nuevo = await crearRecordatorio({
          titulo: titulo.trim(),
          lugar: lugarFinal,
          cuerpo: cuerpo.trim(),
          fecha: fechaSeleccionada.toISOString(),
          tipo,
          mascotaId: idMascotaElegida,
        });

        setRecordatorios((prev) => [nuevo, ...prev]);

        // Sincronizar también en la subcolección clínica de la mascota seleccionada
        if (idMascotaElegida) {
          if (tipo === 'vacuna') {
            await guardarRegistroSaludFirestore('vacunas', {
              id: nuevo.id,
              mascotaId: idMascotaElegida,
              nombre: titulo.trim(),
              aplicada: false,
              estado: 'pendiente',
              fechaProgramada: fechaSeleccionada.toISOString(),
              fechaAplicacion: null,
              proximaDosis: null,
              lugar: lugarFinal,
              notas: cuerpo.trim(),
              creadaEn: new Date().toISOString(),
            });
          } else if (tipo === 'medicamento') {
            await guardarRegistroSaludFirestore('medicamentos', {
              id: nuevo.id,
              mascotaId: idMascotaElegida,
              nombre: titulo.trim(),
              dosis: cuerpo.trim() || '1 dosis',
              frecuencia: 'Programado',
              fechaInicio: fechaSeleccionada.toISOString(),
              creadaEn: new Date().toISOString(),
            });
          } else if (tipo === 'cita') {
            await guardarRegistroSaludFirestore('citas', {
              id: nuevo.id,
              mascotaId: idMascotaElegida,
              motivo: titulo.trim(),
              fecha: fechaSeleccionada.toISOString(),
              lugar: lugarFinal,
              veterinario: lugarFinal,
              notas: cuerpo.trim(),
              creadaEn: new Date().toISOString(),
            });
          }
        }
      }

      setModalVisible(false);
      await cargar();
    } catch {
      avisar('Error', 'No se pudo guardar el evento.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacionEvento = async (rec) => {
    if (!rec) return;
    // Actualización optimista inmediata (0ms)
    setRecordatorios((prev) => prev.filter((item) => String(item.id) !== String(rec.id)));
    setEventoABorrar(null);
    setModalVisible(false);
    try {
      await borrarRecordatorio(rec);
    } catch (e) {
      console.warn('Error al eliminar evento:', e);
    }
  };

  const recordatoriosClinicos = recordatorios.filter((r) => r.tipo !== 'cumpleanos');

  const recordatoriosFiltrados = recordatoriosClinicos.filter((r) => {
    if (filtroActivo === 'todos') return true;
    return r.tipo === filtroActivo;
  });

  const totalVencidos = recordatoriosClinicos.filter((r) => {
    const d = diasHasta(r.fecha);
    return d !== null && d < 0;
  }).length;

  return (
    <View style={[estilos.contenedor, { backgroundColor: colors.bg }]}>
      {/* Header (.head + .fab) */}
      <View style={estilos.head}>
        <View>
          <Text style={[estilos.h2, { color: colors.text }]}>Agenda y citas</Text>
          <Text style={[estilos.sub, { color: colors.muted }]}>
            {recordatoriosClinicos.length}{' '}
            {recordatoriosClinicos.length === 1 ? 'evento' : 'eventos'}
            {totalVencidos > 0
              ? ` · ${totalVencidos} ${totalVencidos === 1 ? 'vencido' : 'vencidos'}`
              : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={[estilos.fab, { backgroundColor: colors.brand }]}
          onPress={abrirModalNuevo}
          activeOpacity={0.85}
        >
          <Text style={[estilos.fabText, { color: colors.brandInk }]}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros (.filters) */}
      <View style={estilos.filtersWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.filters}
        >
          {FILTROS.map((f) => {
            const activo = filtroActivo === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  estilos.filterBtn,
                  {
                    backgroundColor: activo ? colors.okBg : colors.surface,
                    borderColor: activo ? colors.brand : colors.line,
                  },
                ]}
                onPress={() => setFiltroActivo(f.id)}
                activeOpacity={0.82}
              >
                <Text
                  style={[
                    estilos.filterText,
                    { color: activo ? colors.brand : colors.muted },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de Eventos (.list) */}
      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={alRefrescar}
            colors={[colors.brand]}
            tintColor={colors.brand}
          />
        }
      >
        {recordatoriosFiltrados.length === 0 ? (
          <View style={estilos.empty}>
            <Text style={estilos.emptyEmoji}>🐾</Text>
            <Text style={[estilos.emptyText, { color: colors.muted }]}>
              No hay eventos aquí.{'\n'}Toca “+ Nuevo” para programar uno.
            </Text>
          </View>
        ) : (
          recordatoriosFiltrados.map((r) => {
            const pet = mascotas.find((m) => m.id === r.mascotaId);
            const emoji =
              r.tipo === 'vacuna'
                ? '💉'
                : r.tipo === 'medicamento'
                ? '💊'
                : r.tipo === 'cumpleanos'
                ? '🎂'
                : '🩺';
            const dias = diasHasta(r.fecha);
            const vencido = dias !== null && dias < 0;

            let etiquetaDerecha = '';
            if (dias !== null) {
              if (dias < 0) etiquetaDerecha = 'Reagendar';
              else if (dias === 0) etiquetaDerecha = 'Hoy';
              else if (dias === 1) etiquetaDerecha = 'Mañana';
              else etiquetaDerecha = `En ${dias} días`;
            }

            const fechaHoraStr = `${formatearFechaCorta(r.fecha)}, ${formatearHora(r.fecha)}`;

            return (
              <View
                key={r.id}
                style={[
                  estilos.item,
                  {
                    backgroundColor: colors.surface,
                    borderColor: vencido ? colors.warn : colors.line,
                  },
                ]}
              >
                {/* Área principal tocable para editar/reagendar */}
                <TouchableOpacity
                  style={estilos.itemMainTouch}
                  onPress={() => abrirModalReagendar(r)}
                  activeOpacity={0.8}
                >
                  <View style={[estilos.ic, { backgroundColor: colors.surface2 }]}>
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[estilos.itemBold, { color: colors.text }]}>
                      {r.titulo}
                      {pet ? ` · ${pet.nombre}` : ''}
                    </Text>
                    <Text
                      style={[
                        estilos.itemSmall,
                        { color: vencido ? colors.warn : colors.muted },
                      ]}
                    >
                      {vencido ? `Vencida · ${fechaHoraStr}` : fechaHoraStr}
                    </Text>
                    {r.lugar && r.tipo !== 'medicamento' ? (
                      <Text
                        style={[
                          estilos.itemLugar,
                          { color: colors.brand },
                        ]}
                      >
                        📍 {r.lugar}
                      </Text>
                    ) : null}
                  </View>

                  <Text
                    style={[
                      estilos.when,
                      { color: vencido ? colors.warn : colors.brand },
                    ]}
                  >
                    {etiquetaDerecha}
                  </Text>
                </TouchableOpacity>

                {/* Botón independiente para Eliminar Evento (no anidado dentro de otro TouchableOpacity) */}
                <TouchableOpacity
                  onPress={() => setEventoABorrar(r)}
                  style={[estilos.btnBorrarItem, { backgroundColor: colors.surface2 }]}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[estilos.btnBorrarTexto, { color: colors.warn }]}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal Confirmación para Eliminar Evento */}
      <Modal
        visible={Boolean(eventoABorrar)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEventoABorrar(null)}
      >
        <View style={estilos.confirmOverlay}>
          <View
            style={[
              estilos.confirmCard,
              { backgroundColor: colors.surface, borderColor: colors.line },
            ]}
          >
            <Text style={{ fontSize: 30, marginBottom: 8 }}>🗑️</Text>
            <Text style={[estilos.confirmTitle, { color: colors.text }]}>
              ¿Eliminar este evento?
            </Text>
            <Text style={[estilos.confirmSub, { color: colors.muted }]}>
              Se eliminará “{eventoABorrar?.titulo}” de tu agenda y recordatorios.
            </Text>
            <View style={estilos.confirmActions}>
              <TouchableOpacity
                style={[
                  estilos.confirmBtnCancel,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
                onPress={() => setEventoABorrar(null)}
              >
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.text }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.confirmBtnDelete, { backgroundColor: colors.warn }]}
                onPress={() => confirmarEliminacionEvento(eventoABorrar)}
              >
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' }}>
                  Sí, eliminar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Crear / Reagendar Recordatorio */}
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

            <View style={estilos.modalHeader}>
              <Text style={[estilos.modalTitulo, { color: colors.text }]}>
                {editandoRec ? 'Editar / Reagendar Evento' : 'Nuevo Recordatorio'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[estilos.modalCerrar, { color: colors.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {/* 1. Selector de Mascota Registrada */}
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Mascota (registrada) *
              </Text>
              {mascotas.length === 0 ? (
                <Text style={{ fontSize: 12.5, color: colors.warn, marginBottom: 6 }}>
                  Aún no has registrado mascotas en la pestaña Mascotas.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={estilos.mascotasSelectorRow}
                >
                  {mascotas.map((m) => {
                    const seleccionada =
                      mascotaId === m.id || (!mascotaId && mascotas[0]?.id === m.id);
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          estilos.mascotaChip,
                          {
                            backgroundColor: seleccionada ? colors.okBg : colors.surface2,
                            borderColor: seleccionada ? colors.brand : colors.line,
                          },
                        ]}
                        onPress={() => setMascotaId(m.id)}
                      >
                        <Text style={{ fontSize: 16 }}>{emojiSoloEspecie(m.especie)}</Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '800',
                            color: seleccionada ? colors.brand : colors.text,
                          }}
                        >
                          {m.nombre}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* 2. Tipo de Cuidado */}
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Tipo de Cuidado
              </Text>
              <View style={estilos.tipoSelector}>
                {[
                  { id: 'vacuna', label: '💉 Vacuna' },
                  { id: 'medicamento', label: '💊 Medicina' },
                  { id: 'cita', label: '🩺 Cita Vet' },
                ].map((t) => {
                  const act = tipo === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        estilos.tipoBtn,
                        {
                          backgroundColor: act ? colors.okBg : colors.surface2,
                          borderColor: act ? colors.brand : colors.line,
                        },
                      ]}
                      onPress={() => setTipo(t.id)}
                    >
                      <Text
                        style={{
                          fontSize: 12.5,
                          fontWeight: '800',
                          color: act ? colors.brand : colors.muted,
                        }}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3. Título del Evento */}
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Título del Evento *
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
                  tipo === 'vacuna'
                    ? 'Ej. Vacuna triple felina / Antirrábica'
                    : tipo === 'medicamento'
                    ? 'Ej. Antibiótico / Desparasitante'
                    : 'Ej. Chequeo general / Limpieza dental'
                }
                placeholderTextColor={colors.muted}
                value={titulo}
                onChangeText={setTitulo}
              />

              {/* 4. Fecha y Hora del Evento */}
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Fecha y Hora programada *
              </Text>
              <View style={estilos.filaFechaHora}>
                <TouchableOpacity
                  style={[
                    estilos.fechaBtn,
                    {
                      flex: 1,
                      backgroundColor: colors.surface2,
                      borderColor: colors.brand,
                    },
                  ]}
                  onPress={() => setMostrarPickerFecha(true)}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                    📅 {formatearFecha(fechaSeleccionada)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    estilos.fechaBtn,
                    {
                      width: '42%',
                      backgroundColor: colors.surface2,
                      borderColor: colors.brand,
                    },
                  ]}
                  onPress={() => setMostrarPickerHora(true)}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                    🕐 {formatearHora(fechaSeleccionada)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Atajos rápidos de fecha y hora */}
              <View style={estilos.atajosFechaRow}>
                {[
                  { label: 'Hoy', dias: 0 },
                  { label: 'Mañana', dias: 1 },
                  { label: 'En 3 días', dias: 3 },
                  { label: 'En 7 días', dias: 7 },
                  { label: 'En 1 mes', dias: 30 },
                ].map((at) => (
                  <TouchableOpacity
                    key={at.label}
                    style={[
                      estilos.atajoChip,
                      { backgroundColor: colors.surface2, borderColor: colors.line },
                    ]}
                    onPress={() => ajustarDiasRapido(at.dias)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.brand }}>
                      {at.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[estilos.atajosFechaRow, { marginTop: 4 }]}>
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
                    onPress={() => ajustarHoraRapida(hr.h, hr.m)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted }}>
                      {hr.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {mostrarPickerFecha && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={fechaSeleccionada}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setMostrarPickerFecha(false);
                    if (d) {
                      const nueva = new Date(d);
                      nueva.setHours(
                        fechaSeleccionada.getHours(),
                        fechaSeleccionada.getMinutes(),
                        0,
                        0
                      );
                      setFechaSeleccionada(nueva);
                    }
                  }}
                />
              )}

              {mostrarPickerHora && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={fechaSeleccionada}
                  mode="time"
                  display="default"
                  onChange={(e, d) => {
                    setMostrarPickerHora(false);
                    if (d) {
                      const nueva = new Date(fechaSeleccionada);
                      nueva.setHours(d.getHours(), d.getMinutes(), 0, 0);
                      setFechaSeleccionada(nueva);
                    }
                  }}
                />
              )}

              {/* 5. Lugar de la visita / Clínica Veterinaria (Solo para Vacunas y Citas Vet) */}
              {tipo !== 'medicamento' && tipo !== 'cumpleanos' && (
                <>
                  <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                    📍 Lugar o Clínica Veterinaria (donde será la visita)
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
                    value={lugar}
                    onChangeText={setLugar}
                  />
                </>
              )}

              {/* 6. Notas adicionales / Dosis */}
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                {tipo === 'medicamento'
                  ? 'Dosis e indicaciones (ej. 1 tableta con comida)'
                  : 'Notas adicionales (opcional)'}
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
                  tipo === 'medicamento'
                    ? 'Ej. 1 tableta cada 12 horas'
                    : 'Ej. Llevar cartilla física, en ayunas...'
                }
                placeholderTextColor={colors.muted}
                value={cuerpo}
                onChangeText={setCuerpo}
              />

              <TouchableOpacity
                style={[estilos.btnGuardarModal, { backgroundColor: colors.brand }]}
                onPress={handleGuardar}
                disabled={guardando}
                activeOpacity={0.85}
              >
                {guardando ? (
                  <ActivityIndicator color={colors.brandInk} size="small" />
                ) : (
                  <Text style={[estilos.btnGuardarModalTexto, { color: colors.brandInk }]}>
                    {editandoRec ? 'Guardar Cambios' : 'Guardar Recordatorio'}
                  </Text>
                )}
              </TouchableOpacity>

              {editandoRec && (
                <TouchableOpacity
                  style={[
                    estilos.btnEliminarEnModal,
                    { backgroundColor: colors.warnBg, borderColor: colors.warn },
                  ]}
                  onPress={() => confirmarEliminacionEvento(editandoRec)}
                >
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.warn }}>
                    🗑️ Eliminar este evento
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 6,
  },
  h2: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  sub: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '600',
  },
  fab: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 99,
    shadowColor: '#14302F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '800',
  },
  filtersWrap: {
    paddingVertical: 10,
  },
  filters: {
    paddingHorizontal: 18,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 99,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 8,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#14302F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  itemMainTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  ic: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBold: {
    fontSize: 15,
    fontWeight: '800',
  },
  itemSmall: {
    fontSize: 12.5,
    marginTop: 1,
    fontWeight: '600',
  },
  itemLugar: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
  },
  when: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  btnBorrarItem: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  btnBorrarTexto: {
    fontSize: 14,
    fontWeight: '900',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 21, 20, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    fontWeight: '600',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  confirmBtnCancel: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDelete: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11, 21, 20, 0.55)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCerrar: {
    fontSize: 18,
    fontWeight: '700',
  },
  campoLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 10,
  },
  mascotasSelectorRow: {
    gap: 8,
    paddingVertical: 2,
  },
  mascotaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
  },
  tipoSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  tipoBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  input: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13.5,
    fontWeight: '600',
  },
  filaFechaHora: {
    flexDirection: 'row',
    gap: 10,
  },
  fechaBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  atajosFechaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  atajoChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  btnGuardarModal: {
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  btnGuardarModalTexto: {
    fontSize: 14,
    fontWeight: '800',
  },
  btnEliminarEnModal: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
});
