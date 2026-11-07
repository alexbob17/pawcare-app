import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../hooks/useTheme';
import {
  obtenerSubcoleccionFirestore,
  guardarRegistroSaludFirestore,
  eliminarRegistroSaludFirestore,
} from '../../services/firestore.service';
import { formatearFecha, generarId } from '../../utils/dates';
import { avisar } from '../../utils/dialogs';

const TIPOS_FECHA = [
  { id: 'adopcion', label: '🏠 Llegada a casa', emoji: '🏠' },
  { id: 'celebracion', label: '🎉 Celebración', emoji: '🎉' },
  { id: 'logro', label: '🏆 Recuerdo / Logro', emoji: '🏆' },
];

function calcularDatosCumpleanos(fechaNacStr) {
  const nac = fechaNacStr ? new Date(fechaNacStr) : new Date();
  const Valida = !isNaN(nac.getTime()) ? nac : new Date();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const proximo = new Date(
    hoy.getFullYear(),
    Valida.getMonth(),
    Valida.getDate(),
    0,
    0,
    0,
    0
  );
  if (proximo < hoy) {
    proximo.setFullYear(hoy.getFullYear() + 1);
  }

  const diffMs = proximo.getTime() - hoy.getTime();
  const diasFaltantes = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const edadQueCumple = Math.max(1, proximo.getFullYear() - Valida.getFullYear());

  return {
    fechaNacimientoDate: Valida,
    proximoCumpleDate: proximo,
    diasFaltantes,
    edadQueCumple,
  };
}

export default function SpecialDatesModal({
  visible,
  onClose,
  mascota,
  onActualizarFechaNacimiento,
}) {
  const { colors } = useTheme();
  const [fechasEspeciales, setFechasEspeciales] = useState([]);
  const [mostrarPickerCumple, setMostrarPickerCumple] = useState(false);

  // Formulario para nueva fecha especial
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipoEsp, setTipoEsp] = useState('adopcion');
  const [tituloEsp, setTituloEsp] = useState('');
  const [fechaEsp, setFechaEsp] = useState(new Date());
  const [mostrarPickerEsp, setMostrarPickerEsp] = useState(false);

  const cargarFechas = useCallback(async () => {
    if (!mascota?.id) return;
    const datos = await obtenerSubcoleccionFirestore('fechas_especiales', mascota.id);
    setFechasEspeciales(datos || []);
  }, [mascota?.id]);

  useEffect(() => {
    if (visible && mascota?.id) {
      cargarFechas();
    }
  }, [visible, mascota?.id, cargarFechas]);

  if (!mascota) return null;

  const { fechaNacimientoDate, proximoCumpleDate, diasFaltantes, edadQueCumple } =
    calcularDatosCumpleanos(mascota.fechaNacimiento);

  const handleGuardarNuevaFecha = async () => {
    if (!tituloEsp.trim()) {
      avisar('Título requerido', 'Escribe el nombre de la fecha especial (ej. Día que llegó a casa).');
      return;
    }
    const catObj = TIPOS_FECHA.find((t) => t.id === tipoEsp) || TIPOS_FECHA[0];
    const nueva = {
      id: generarId(),
      mascotaId: mascota.id,
      tipo: tipoEsp,
      emoji: catObj.emoji,
      titulo: tituloEsp.trim(),
      fecha: fechaEsp.toISOString(),
      creadaEn: new Date().toISOString(),
    };
    await guardarRegistroSaludFirestore('fechas_especiales', nueva);
    setFechasEspeciales((prev) => [nueva, ...prev]);
    setTituloEsp('');
    setMostrarForm(false);
  };

  const handleEliminarFecha = async (idBorrar) => {
    setFechasEspeciales((prev) => prev.filter((f) => String(f.id) !== String(idBorrar)));
    await eliminarRegistroSaludFirestore('fechas_especiales', idBorrar);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={estilos.modalOverlay}>
        <TouchableOpacity
          style={estilos.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[estilos.sheet, { backgroundColor: colors.surface }]}>
          <View style={[estilos.sheetHandle, { backgroundColor: colors.line }]} />

          {/* Cabecera */}
          <View style={estilos.headerRow}>
            <View style={estilos.titleRow}>
              <View style={[estilos.badgeIcon, { backgroundColor: colors.okBg }]}>
                <Text style={{ fontSize: 20 }}>🎂</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[estilos.titulo, { color: colors.text }]}>
                  Cumpleaños y fechas especiales
                </Text>
                <Text style={[estilos.subtitulo, { color: colors.muted }]}>
                  Celebraciones y recuerdos de {mascota.nombre}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[estilos.btnCerrar, { backgroundColor: colors.surface2 }]}
              onPress={onClose}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.muted }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
            {/* Tarjeta Principal de Cumpleaños */}
            <View
              style={[
                estilos.cumpleCard,
                { backgroundColor: colors.okBg, borderColor: colors.brand },
              ]}
            >
              <Text style={{ fontSize: 34, marginBottom: 4 }}>🎂</Text>
              <Text style={[estilos.cumpleHeadline, { color: colors.text }]}>
                {diasFaltantes === 0
                  ? `¡Hoy es el cumpleaños de ${mascota.nombre}! 🎉`
                  : diasFaltantes === 1
                  ? `¡Mañana cumple ${edadQueCumple} ${edadQueCumple === 1 ? 'año' : 'años'}!`
                  : `Faltan ${diasFaltantes} días para su cumpleaños`}
              </Text>
              <Text style={[estilos.cumpleSub, { color: colors.brand }]}>
                Próxima celebración: {formatearFecha(proximoCumpleDate.toISOString())} (cumplirá{' '}
                {edadQueCumple} {edadQueCumple === 1 ? 'año' : 'años'})
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>
                Fecha de nacimiento registrada: {formatearFecha(fechaNacimientoDate.toISOString())}
              </Text>

              <TouchableOpacity
                style={[
                  estilos.btnEditarCumple,
                  { backgroundColor: colors.surface, borderColor: colors.brand },
                ]}
                onPress={() => setMostrarPickerCumple(true)}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.brand }}>
                  📅 Ajustar día y mes exacto de nacimiento
                </Text>
              </TouchableOpacity>

              {mostrarPickerCumple && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={fechaNacimientoDate}
                  mode="date"
                  maximumDate={new Date()}
                  display="default"
                  onChange={(e, dateSeleccionada) => {
                    setMostrarPickerCumple(false);
                    if (dateSeleccionada && onActualizarFechaNacimiento) {
                      onActualizarFechaNacimiento(dateSeleccionada.toISOString());
                    }
                  }}
                />
              )}
            </View>

            {/* Sección de Otras Fechas Especiales (Adopción, etc.) */}
            <View style={estilos.seccionHeader}>
              <Text style={[estilos.seccionTitulo, { color: colors.text }]}>
                ✨ Fechas especiales ({fechasEspeciales.length})
              </Text>
              <TouchableOpacity
                style={[estilos.btnAddSmall, { backgroundColor: colors.brand }]}
                onPress={() => setMostrarForm((v) => !v)}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.brandInk }}>
                  {mostrarForm ? 'Cancelar' : '+ Añadir fecha'}
                </Text>
              </TouchableOpacity>
            </View>

            {mostrarForm && (
              <View
                style={[
                  estilos.formCard,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
              >
                <Text style={[estilos.label, { color: colors.muted }]}>Tipo de recuerdo</Text>
                <View style={estilos.chipsRow}>
                  {TIPOS_FECHA.map((t) => {
                    const act = tipoEsp === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[
                          estilos.chip,
                          {
                            backgroundColor: act ? colors.brand : colors.surface,
                            borderColor: act ? colors.brand : colors.line,
                          },
                        ]}
                        onPress={() => setTipoEsp(t.id)}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: act ? colors.brandInk : colors.text,
                          }}
                        >
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[estilos.label, { color: colors.muted }]}>
                  Nombre de la fecha especial *
                </Text>
                <TextInput
                  style={[
                    estilos.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.line,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Ej. Día que llegó a casa / Aniversario de adopción"
                  placeholderTextColor={colors.muted}
                  value={tituloEsp}
                  onChangeText={setTituloEsp}
                />

                <Text style={[estilos.label, { color: colors.muted }]}>Fecha</Text>
                <TouchableOpacity
                  style={[
                    estilos.fechaBtn,
                    { backgroundColor: colors.surface, borderColor: colors.line },
                  ]}
                  onPress={() => setMostrarPickerEsp(true)}
                >
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.text }}>
                    📅 {formatearFecha(fechaEsp.toISOString())}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.brand }}>
                    Cambiar
                  </Text>
                </TouchableOpacity>

                {mostrarPickerEsp && Platform.OS !== 'web' && (
                  <DateTimePicker
                    value={fechaEsp}
                    mode="date"
                    display="default"
                    onChange={(e, d) => {
                      setMostrarPickerEsp(false);
                      if (d) setFechaEsp(d);
                    }}
                  />
                )}

                <TouchableOpacity
                  style={[estilos.btnGuardarEsp, { backgroundColor: colors.brand }]}
                  onPress={handleGuardarNuevaFecha}
                >
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.brandInk }}>
                    Guardar Fecha Especial
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {fechasEspeciales.length === 0 ? (
              <View
                style={[
                  estilos.emptyBox,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
              >
                <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>
                  Guarda aquí el día que adoptaste a {mascota.nombre}, su llegada a casa o momentos especiales sin mezclarlos con las citas médicas.
                </Text>
              </View>
            ) : (
              fechasEspeciales.map((item) => (
                <View
                  key={item.id}
                  style={[
                    estilos.itemCard,
                    { backgroundColor: colors.surface2, borderColor: colors.line },
                  ]}
                >
                  <View style={[estilos.itemIcon, { backgroundColor: colors.surface }]}>
                    <Text style={{ fontSize: 18 }}>{item.emoji || '🎉'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                      {item.titulo}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      📅 {formatearFecha(item.fecha)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={estilos.btnDel}
                    onPress={() => handleEliminarFecha(item.id)}
                  >
                    <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '800' }}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 21, 20, 0.58)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  badgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 16.5,
    fontWeight: '800',
  },
  subtitulo: {
    fontSize: 12,
    marginTop: 1,
  },
  btnCerrar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cumpleCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  cumpleHeadline: {
    fontSize: 16.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  cumpleSub: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  btnEditarCumple: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  seccionTitulo: {
    fontSize: 15,
    fontWeight: '800',
  },
  btnAddSmall: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
    marginTop: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  input: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13.5,
  },
  fechaBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnGuardarEsp: {
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDel: {
    padding: 6,
  },
});

