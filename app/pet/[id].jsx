import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { usePets } from '../../src/hooks/usePets';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { Icon } from '../../src/components/common/Icons';

import ProfileHero from '../../src/components/pet-profile/ProfileHero';
import WeightChart from '../../src/components/pet-profile/WeightChart';
import EmergencyQRModal from '../../src/components/pets/EmergencyQRModal';
import MedicalPDFModal from '../../src/components/pets/MedicalPDFModal';
import SpecialDatesModal from '../../src/components/pets/SpecialDatesModal';
import {
  obtenerResumenClinicoMascota,
  obtenerMascotaPorIdFirestore,
} from '../../src/services/firestore.service';
import {
  formatearFechaCorta,
  formatearFecha,
  diasHasta,
  calcularFechaDesdeEdad,
} from '../../src/utils/dates';
import { confirmar, avisar } from '../../src/utils/dialogs';
import { ESPECIES_DISPONIBLES } from '../../src/constants/pets';

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'vacunas', label: 'Vacunas' },
  { id: 'medicinas', label: 'Medicinas' },
  { id: 'historial', label: 'Historial' },
];

export default function PetProfileScreen() {
  const { id, openModal } = useLocalSearchParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const { mascotas, cargarMascotas, editarMascota, borrarMascota } = usePets(usuario?.id);
  const { colors } = useTheme();

  const [tabActivo, setTabActivo] = useState('resumen');
  const [modalQrVisible, setModalQrVisible] = useState(openModal === 'qr');
  const [modalPdfVisible, setModalPdfVisible] = useState(openModal === 'pdf');
  const [modalCumpleVisible, setModalCumpleVisible] = useState(false);
  const [modalOpcionesVisible, setModalOpcionesVisible] = useState(false);

  // Estado para editar datos de la mascota
  const [editNombre, setEditNombre] = useState('');
  const [editEspecie, setEditEspecie] = useState('perro');
  const [editRaza, setEditRaza] = useState('');
  const [editPeso, setEditPeso] = useState('');
  const [editEdadValor, setEditEdadValor] = useState('');
  const [editEdadUnidad, setEditEdadUnidad] = useState('anos');
  const [editSexo, setEditSexo] = useState('macho');
  const [editTamano, setEditTamano] = useState('Mediano');
  const [editColor, setEditColor] = useState('');
  const [editCaracteristicas, setEditCaracteristicas] = useState('');
  const [editMicrochip, setEditMicrochip] = useState('');

  const [mascotaDirecta, setMascotaDirecta] = useState(null);
  const [resumen, setResumen] = useState({
    vacunas: [],
    medicamentos: [],
    citas: [],
    pesos: [],
    salud: [],
  });

  const mascota =
    mascotas.find((m) => m.id === id) ||
    mascotaDirecta ||
    (mascotas.length > 0 ? mascotas[0] : null);

  const cargarTodo = useCallback(async () => {
    cargarMascotas();
    if (id) {
      const m = await obtenerMascotaPorIdFirestore(id);
      if (m) setMascotaDirecta(m);
      const datos = await obtenerResumenClinicoMascota(id);
      setResumen(datos);
    }
  }, [id, cargarMascotas]);

  useEffect(() => {
    if (openModal === 'qr') setModalQrVisible(true);
    if (openModal === 'pdf') setModalPdfVisible(true);
  }, [openModal]);

  useFocusEffect(
    useCallback(() => {
      cargarTodo();
    }, [cargarTodo])
  );

  const abrirModalEditar = () => {
    if (!mascota) return;
    const esp = mascota.especie || 'perro';
    setEditNombre(mascota.nombre || '');
    setEditEspecie(esp);
    const rz = (mascota.raza || '').trim();
    if (rz.toLowerCase() === esp.toLowerCase() || rz.toLowerCase() === 'mestizo') {
      setEditRaza('');
    } else {
      setEditRaza(rz);
    }
    setEditPeso(mascota.pesoActual ? String(mascota.pesoActual) : '');
    setEditEdadValor(mascota.edadValor !== undefined ? String(mascota.edadValor) : '1');
    setEditEdadUnidad(mascota.edadUnidad || 'anos');
    setEditSexo(mascota.sexo || 'macho');
    setEditTamano(mascota.tamano || 'Mediano');
    setEditColor(mascota.color || '');
    setEditCaracteristicas(mascota.caracteristicas || '');
    setEditMicrochip(mascota.microchip || '');
    setModalOpcionesVisible(true);
  };

  const guardarEdicionMascota = async () => {
    if (!editNombre.trim()) {
      avisar('Nombre requerido', 'Ingresa el nombre de tu mascota.');
      return;
    }
    const edadNum = parseInt(editEdadValor, 10);
    const maxEdad = editEdadUnidad === 'meses' ? 480 : 40;
    if (editEdadValor.trim() && (isNaN(edadNum) || edadNum < 0 || edadNum > maxEdad)) {
      avisar(
        'Edad inválida',
        `Ingresa una edad válida (entre 0 y ${maxEdad} ${editEdadUnidad === 'meses' ? 'meses' : 'años'}).`
      );
      return;
    }
    const edadValida = !isNaN(edadNum) && edadNum >= 0 ? edadNum : 1;
    const pesoNum = editPeso.trim() ? parseFloat(editPeso.replace(',', '.')) : mascota.pesoActual;
    if (editPeso.trim() && (isNaN(pesoNum) || !(pesoNum > 0 && pesoNum <= 300))) {
      avisar('Peso inválido', 'Ingresa un peso válido entre 0.1 y 300 kg.');
      return;
    }

    let razaFinal = editRaza.trim();
    if (!razaFinal || razaFinal.toLowerCase() === editEspecie.toLowerCase()) {
      razaFinal = 'Mestizo';
    }

    const actualizada = {
      ...mascota,
      nombre: editNombre.trim(),
      especie: editEspecie,
      raza: razaFinal,
      pesoActual: pesoNum && !isNaN(pesoNum) ? pesoNum : null,
      edadValor: edadValida,
      edadUnidad: editEdadUnidad,
      sexo: editSexo,
      tamano: editTamano || 'Mediano',
      color: editColor.trim(),
      caracteristicas: editCaracteristicas.trim(),
      microchip: editMicrochip.trim(),
      fechaNacimiento: calcularFechaDesdeEdad(edadValida, editEdadUnidad),
    };
    await editarMascota(actualizada);
    setMascotaDirecta(actualizada);
    setModalOpcionesVisible(false);
  };

  const handleCambiarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          'Permiso necesario',
          'Se necesita acceso a tus fotos para cambiar la imagen de perfil.'
        );
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        const actualizada = {
          ...mascota,
          foto: res.assets[0].uri,
        };
        await editarMascota(actualizada);
        setMascotaDirecta(actualizada);
      }
    } catch (e) {
      console.warn('Error al cambiar foto:', e);
    }
  };

  const confirmarEliminar = () => {
    setModalOpcionesVisible(false);
    confirmar(
      '¿Eliminar mascota?',
      `Se eliminarán los datos de ${mascota?.nombre} permanentemente.`,
      async () => {
        await borrarMascota(mascota.id);
        router.replace('/(tabs)/pets');
      }
    );
  };

  if (!mascota) {
    return (
      <View style={[estilos.centrado, { backgroundColor: colors.bg }]}>
        <Text style={[estilos.textoCarga, { color: colors.text }]}>
          Mascota no encontrada
        </Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/pets')}>
          <Text style={[estilos.linkVolver, { color: colors.brand }]}>
            Volver a Mascotas
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { vacunas, medicamentos, citas, pesos, salud } = resumen;

  // Datos reales para los resúmenes (NUNCA hardcodeados)
  const vacunasPendientes = vacunas.filter(
    (v) => v.aplicada === false || v.estado === 'pendiente'
  );
  const vacunasVencidas = vacunasPendientes.filter((v) => {
    const f = new Date(v.fechaProgramada || v.proximaDosis || v.fechaAplicacion);
    return f < new Date();
  });
  const vacunasFuturas = vacunasPendientes
    .filter((v) => {
      const f = new Date(v.fechaProgramada || v.proximaDosis || v.fechaAplicacion);
      return f >= new Date();
    })
    .sort(
      (a, b) =>
        new Date(a.fechaProgramada || a.proximaDosis || a.fechaAplicacion) -
        new Date(b.fechaProgramada || b.proximaDosis || b.fechaAplicacion)
    );

  let detalleVacunasBox = 'Sin datos';
  let vacunasAlerta = false;

  if (vacunas.length > 0) {
    if (vacunasVencidas.length > 0) {
      detalleVacunasBox = `${vacunasVencidas.length} ${
        vacunasVencidas.length === 1 ? 'pendiente' : 'pendientes'
      }`;
      vacunasAlerta = true;
    } else if (vacunasFuturas.length > 0) {
      const fechaProx =
        vacunasFuturas[0].fechaProgramada ||
        vacunasFuturas[0].proximaDosis ||
        vacunasFuturas[0].fechaAplicacion;
      detalleVacunasBox = `Próx: ${formatearFechaCorta(fechaProx)}`;
    } else {
      detalleVacunasBox = 'Al día';
    }
  }

  const citasVencidas = citas.filter((c) => {
    const d = diasHasta(c.fecha);
    return d !== null && d < 0;
  });
  const citasFuturas = citas
    .filter((c) => {
      const d = diasHasta(c.fecha);
      return d !== null && d >= 0;
    })
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const detalleMedicinasBox =
    medicamentos.length > 0
      ? `${medicamentos.length} ${medicamentos.length === 1 ? 'activo' : 'activos'}`
      : 'Sin datos';

  const detalleCitasBox =
    citas.length === 0
      ? 'Sin datos'
      : citasVencidas.length > 0
      ? `${citasVencidas.length} ${citasVencidas.length === 1 ? 'vencida' : 'vencidas'}`
      : citasFuturas.length > 0
      ? `Próx. ${formatearFechaCorta(citasFuturas[0].fecha)}`
      : `${citas.length} reg.`;

  const ultimoPeso =
    pesos.length > 0 ? pesos[0].peso : mascota.pesoActual ? mascota.pesoActual : null;
  const detallePesoBox = ultimoPeso ? `${ultimoPeso} kg` : 'Sin datos';

  const detalleSaludBox =
    salud.length > 0
      ? `${salud.length} ${salud.length === 1 ? 'registro' : 'registros'}`
      : 'Sin datos';

  const registrosClinicos = [
    {
      id: 'vaccines',
      emoji: '💉',
      titulo: 'Vacunas y Desparasitación',
      detalle: detalleVacunasBox,
      alerta: vacunasAlerta,
    },
    {
      id: 'medications',
      emoji: '💊',
      titulo: 'Medicamentos y Dosis',
      detalle: detalleMedicinasBox,
      alerta: false,
    },
    {
      id: 'appointments',
      emoji: '🩺',
      titulo: 'Citas y Seguimiento Vet',
      detalle: detalleCitasBox,
      alerta: citasVencidas.length > 0,
    },
    {
      id: 'weight',
      emoji: '⚖️',
      titulo: 'Control de Peso',
      detalle: detallePesoBox,
      alerta: false,
    },
    {
      id: 'health',
      emoji: '❤️',
      titulo: 'Alergias, Cirugías y Síntomas',
      detalle: detalleSaludBox,
      alerta: false,
    },
  ];

  return (
    <View style={[estilos.contenedor, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.scrollContent}>
        {/* 1. Hero Horizontal + Tarjeta Flotante de 3 Estadísticas */}
        <ProfileHero
          mascota={mascota}
          pesos={pesos}
          onVolver={() => router.back()}
          onOptions={abrirModalEditar}
          onEditarFoto={handleCambiarFoto}
        />

        <View style={estilos.contenidoInferior}>
          {/* 2. Pestañas (.tabs): Resumen | Vacunas | Medicinas | Historial */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.tabs}
          >
            {TABS.map((t) => {
              const activo = tabActivo === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    estilos.tabBtn,
                    {
                      backgroundColor: activo ? colors.brand : colors.surface,
                      borderColor: activo ? colors.brand : colors.line,
                    },
                  ]}
                  onPress={() => setTabActivo(t.id)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      estilos.tabBtnText,
                      { color: activo ? colors.brandInk : colors.muted },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* PANEL 1: RESUMEN */}
          {tabActivo === 'resumen' && (
            <View>
              {/* Gráfico interactivo de evolución de peso */}
              <WeightChart
                pesoActual={ultimoPeso}
                historial={pesos}
                onPressAgregarPeso={() => router.push(`/pet/${mascota.id}/weight`)}
              />

              {/* Tarjeta de Identificación, Tamaño, Color y Características Físicas */}
              <TouchableOpacity
                style={[
                  estilos.fichaFisicaCard,
                  { backgroundColor: colors.surface, borderColor: colors.line },
                ]}
                onPress={abrirModalEditar}
                activeOpacity={0.85}
              >
                <View style={estilos.alertTopRow}>
                  <Text style={[estilos.alertTitle, { color: colors.text, flex: 1, marginRight: 8 }]}>
                    🆔 Identificación y características
                  </Text>
                  <View style={[estilos.tagPill, { backgroundColor: colors.surface2, paddingHorizontal: 9, paddingVertical: 5 }]}>
                    <Text style={{ fontSize: 13 }}>✏️</Text>
                  </View>
                </View>

                <View style={estilos.fichaGrid}>
                  <View style={[estilos.fichaChip, { backgroundColor: colors.surface2 }]}>
                    <Text style={[estilos.fichaChipLabel, { color: colors.muted }]}>TAMAÑO</Text>
                    <Text style={[estilos.fichaChipVal, { color: colors.text }]}>
                      {mascota.tamano || 'Mediano'}
                    </Text>
                  </View>
                  <View style={[estilos.fichaChip, { backgroundColor: colors.surface2 }]}>
                    <Text style={[estilos.fichaChipLabel, { color: colors.muted }]}>COLOR / PELAJE</Text>
                    <Text style={[estilos.fichaChipVal, { color: colors.text }]}>
                      {mascota.color || 'Sin especificar'}
                    </Text>
                  </View>
                  <View style={[estilos.fichaChip, { backgroundColor: colors.surface2 }]}>
                    <Text style={[estilos.fichaChipLabel, { color: colors.muted }]}>N° MICROCHIP / ID</Text>
                    <Text style={[estilos.fichaChipVal, { color: colors.text }]}>
                      {mascota.microchip || 'No registrado'}
                    </Text>
                  </View>
                  <View style={[estilos.fichaChip, { backgroundColor: colors.surface2 }]}>
                    <Text style={[estilos.fichaChipLabel, { color: colors.muted }]}>NACIMIENTO</Text>
                    <Text style={[estilos.fichaChipVal, { color: colors.text }]}>
                      {mascota.fechaNacimiento
                        ? formatearFechaCorta(mascota.fechaNacimiento)
                        : 'Estimado'}
                    </Text>
                  </View>
                </View>

                {mascota.caracteristicas ? (
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8, fontWeight: '600' }}>
                    ✨ Señas particulares: {mascota.caracteristicas}
                  </Text>
                ) : null}
              </TouchableOpacity>

              {/* Dos tarjetas resumen (.two) */}
              <View style={estilos.two}>
                <TouchableOpacity
                  style={[
                    estilos.twoCard,
                    { backgroundColor: colors.surface, borderColor: colors.line },
                  ]}
                  onPress={() => router.push(`/pet/${mascota.id}/vaccines`)}
                  activeOpacity={0.85}
                >
                  <Text style={[estilos.twoBold, { color: colors.text }]}>Vacunas</Text>
                  <Text
                    style={[
                      estilos.twoStatus,
                      {
                        color: vacunasAlerta
                          ? colors.warn
                          : vacunas.length > 0
                          ? colors.brand
                          : colors.muted,
                      },
                    ]}
                  >
                    {vacunasAlerta
                      ? `⚠️ ${detalleVacunasBox}`
                      : vacunas.length > 0
                      ? `✓ ${detalleVacunasBox}`
                      : 'Sin datos'}
                  </Text>
                  <Text style={[estilos.twoSmall, { color: colors.muted }]}>
                    {vacunas.length > 0
                      ? `${vacunas[0].nombre}\n${
                          vacunas[0].proximaDosis
                            ? `Próx: ${formatearFechaCorta(vacunas[0].proximaDosis)}`
                            : `Apl: ${formatearFechaCorta(vacunas[0].fechaAplicacion)}`
                        }${vacunas[0].lugar ? `\n📍 ${vacunas[0].lugar}` : ''}`
                      : 'Toca aquí para registrar su primera vacuna'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    estilos.twoCard,
                    { backgroundColor: colors.surface, borderColor: colors.line },
                  ]}
                  onPress={() => router.push(`/pet/${mascota.id}/medications`)}
                  activeOpacity={0.85}
                >
                  <Text style={[estilos.twoBold, { color: colors.text }]}>Medicinas</Text>
                  <Text
                    style={[
                      estilos.twoStatus,
                      { color: medicamentos.length > 0 ? colors.brand : colors.muted },
                    ]}
                  >
                    {medicamentos.length > 0
                      ? `${medicamentos.length} ${medicamentos.length === 1 ? 'activo' : 'activos'}`
                      : 'Sin datos'}
                  </Text>
                  <Text style={[estilos.twoSmall, { color: colors.muted }]}>
                    {medicamentos.length > 0
                      ? medicamentos
                          .slice(0, 2)
                          .map((m) => `${m.nombre} · ${m.frecuencia || m.dosis || 'Diario'}`)
                          .join('\n')
                      : 'Toca aquí para añadir un tratamiento o dosis'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bloque de Alergias y Restricciones (.alert) */}
              <TouchableOpacity
                style={[estilos.alertBox, { backgroundColor: colors.warnBg }]}
                onPress={() => router.push(`/pet/${mascota.id}/health`)}
                activeOpacity={0.85}
              >
                <View style={[estilos.alertIcon, { backgroundColor: colors.warn }]}>
                  <Text style={[estilos.alertIconText, { color: colors.surface }]}>!</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={estilos.alertTopRow}>
                    <Text style={[estilos.alertTitle, { color: colors.text }]}>
                      Alergias y restricciones
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.brand }}>
                      Editar →
                    </Text>
                  </View>

                  {salud.length > 0 ? (
                    <View style={estilos.tagsWrap}>
                      {salud.map((s) => (
                        <View
                          key={s.id}
                          style={[
                            estilos.tagPill,
                            {
                              backgroundColor:
                                s.tipo === 'alergia' ? colors.surface : colors.okBg,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 12.5,
                              fontWeight: '700',
                              color: s.tipo === 'alergia' ? colors.warn : colors.brand,
                            }}
                          >
                            {s.nombre}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 12.5, color: colors.muted, marginTop: 4 }}>
                      Sin datos registrados · Toca para añadir alergias o dieta
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Botones Rápidos QR y Ficha */}
              <View style={estilos.accionesFila}>
                <TouchableOpacity
                  style={[
                    estilos.btnAccionPet,
                    { backgroundColor: colors.surface, borderColor: colors.line },
                  ]}
                  onPress={() => setModalQrVisible(true)}
                  activeOpacity={0.85}
                >
                  <View style={[estilos.iconoAccionPet, { backgroundColor: colors.okBg }]}>
                    <Text style={{ fontSize: 17, color: colors.brand }}>▦</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[estilos.tituloAccionPet, { color: colors.text }]}>
                      QR Collar
                    </Text>
                    <Text style={[estilos.subAccionPet, { color: colors.muted }]}>
                      Emergencias
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    estilos.btnAccionPet,
                    { backgroundColor: colors.surface, borderColor: colors.line },
                  ]}
                  onPress={() => setModalPdfVisible(true)}
                  activeOpacity={0.85}
                >
                  <View style={[estilos.iconoAccionPet, { backgroundColor: colors.okBg }]}>
                    <Text style={{ fontSize: 17 }}>📄</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[estilos.tituloAccionPet, { color: colors.text }]}>
                      Ficha PDF
                    </Text>
                    <Text style={[estilos.subAccionPet, { color: colors.muted }]}>
                      Exportar historial
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Botón Aislado de Cumpleaños y Fechas Especiales */}
              <TouchableOpacity
                style={[
                  estilos.btnAccionPet,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.line,
                    marginTop: 10,
                  },
                ]}
                onPress={() => setModalCumpleVisible(true)}
                activeOpacity={0.85}
              >
                <View style={[estilos.iconoAccionPet, { backgroundColor: colors.okBg }]}>
                  <Text style={{ fontSize: 18 }}>🎂</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[estilos.tituloAccionPet, { color: colors.text }]}>
                    Cumpleaños y fechas especiales
                  </Text>
                  <Text style={[estilos.subAccionPet, { color: colors.muted }]}>
                    Cuenta regresiva, fecha exacta de nacimiento y recuerdos de {mascota.nombre}
                  </Text>
                </View>
                <Icon name="arrow" size={15} color={colors.muted} />
              </TouchableOpacity>

              {/* Lista de Registros Clínicos con datos 100% reales */}
              <Text style={[estilos.tituloSeccion, { color: colors.text }]}>
                Registros clínicos
              </Text>
              <View style={estilos.listaOpciones}>
                {registrosClinicos.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      estilos.opcionFila,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.line,
                      },
                    ]}
                    onPress={() => router.push(`/pet/${mascota.id}/${item.id}`)}
                    activeOpacity={0.82}
                  >
                    <View style={[estilos.opcionIcono, { backgroundColor: colors.surface2 }]}>
                      <Text style={{ fontSize: 19 }}>{item.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[estilos.opcionTitulo, { color: colors.text }]}>
                        {item.titulo}
                      </Text>
                      <Text
                        style={[
                          estilos.opcionDetalle,
                          {
                            color: item.alerta ? colors.warn : colors.muted,
                            fontWeight: item.alerta ? '800' : '600',
                          },
                        ]}
                      >
                        {item.detalle}
                      </Text>
                    </View>
                    <Icon name="arrow" size={15} color={colors.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* PANEL 2: VACUNAS */}
          {tabActivo === 'vacunas' && (
            <View style={estilos.list}>
              <TouchableOpacity
                style={[estilos.btnAddPanel, { backgroundColor: colors.brand }]}
                onPress={() => router.push(`/pet/${mascota.id}/vaccines`)}
              >
                <Text style={[estilos.btnAddPanelText, { color: colors.brandInk }]}>
                  + Agregar o gestionar vacunas
                </Text>
              </TouchableOpacity>

              {vacunas.length === 0 ? (
                <View
                  style={[
                    estilos.emptyCard,
                    { backgroundColor: colors.surface, borderColor: colors.line },
                  ]}
                >
                  <Text style={{ fontSize: 32 }}>💉</Text>
                  <Text style={[estilos.emptyTitle, { color: colors.text }]}>
                    Sin vacunas registradas
                  </Text>
                  <Text style={[estilos.emptySub, { color: colors.muted }]}>
                    Añade las vacunas aplicadas y el lugar de la clínica veterinaria.
                  </Text>
                </View>
              ) : (
                vacunas.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      estilos.itemCard,
                      { backgroundColor: colors.surface, borderColor: colors.line },
                    ]}
                    onPress={() => router.push(`/pet/${mascota.id}/vaccines`)}
                  >
                    <View style={[estilos.itemIc, { backgroundColor: colors.surface2 }]}>
                      <Text style={{ fontSize: 20 }}>💉</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[estilos.itemBold, { color: colors.text }]}>
                        {v.nombre}
                      </Text>
                      <Text style={[estilos.itemSmall, { color: colors.muted }]}>
                        {v.proximaDosis
                          ? `Próxima dosis · ${formatearFecha(v.proximaDosis)}`
                          : `Aplicada el ${formatearFecha(v.fechaAplicacion)}`}
                      </Text>
                      {v.lugar || v.veterinario ? (
                        <Text style={[estilos.itemSmall, { color: colors.brand, fontWeight: '700' }]}>
                          📍 {[v.lugar, v.veterinario].filter(Boolean).join(' · ')}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[estilos.itemWhen, { color: colors.brand }]}>
                      {v.proximaDosis ? formatearFechaCorta(v.proximaDosis) : '✓'}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* PANEL 3: MEDICINAS */}
          {tabActivo === 'medicinas' && (
            <View style={estilos.list}>
              <TouchableOpacity
                style={[estilos.btnAddPanel, { backgroundColor: colors.brand }]}
                onPress={() => router.push(`/pet/${mascota.id}/medications`)}
              >
                <Text style={[estilos.btnAddPanelText, { color: colors.brandInk }]}>
                  + Agregar o gestionar medicinas
                </Text>
              </TouchableOpacity>

              {medicamentos.length === 0 ? (
                <View
                  style={[
                    estilos.emptyCard,
                    { backgroundColor: colors.surface, borderColor: colors.line },
                  ]}
                >
                  <Text style={{ fontSize: 32 }}>💊</Text>
                  <Text style={[estilos.emptyTitle, { color: colors.text }]}>
                    Sin medicinas activas
                  </Text>
                  <Text style={[estilos.emptySub, { color: colors.muted }]}>
                    Registra antibióticos, vitaminas o desparasitantes de {mascota.nombre}.
                  </Text>
                </View>
              ) : (
                medicamentos.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      estilos.itemCard,
                      { backgroundColor: colors.surface, borderColor: colors.line },
                    ]}
                    onPress={() => router.push(`/pet/${mascota.id}/medications`)}
                  >
                    <View style={[estilos.itemIc, { backgroundColor: colors.surface2 }]}>
                      <Text style={{ fontSize: 20 }}>💊</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[estilos.itemBold, { color: colors.text }]}>
                        {m.nombre}
                      </Text>
                      <Text style={[estilos.itemSmall, { color: colors.muted }]}>
                        {[m.dosis, m.frecuencia].filter(Boolean).join(' · ') || 'Tratamiento activo'}
                      </Text>
                      {m.lugar ? (
                        <Text style={[estilos.itemSmall, { color: colors.brand, fontWeight: '700' }]}>
                          📍 {m.lugar}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[estilos.itemWhen, { color: colors.brand }]}>
                      {m.frecuencia || 'Activo'}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* PANEL 4: HISTORIAL (Citas + Pesos) */}
          {tabActivo === 'historial' && (
            <View style={estilos.list}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[estilos.btnAddPanel, { flex: 1, backgroundColor: colors.brand }]}
                  onPress={() => router.push(`/pet/${mascota.id}/appointments`)}
                >
                  <Text style={[estilos.btnAddPanelText, { color: colors.brandInk }]}>
                    + Agendar cita
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    estilos.btnAddPanel,
                    { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.brand },
                  ]}
                  onPress={() => router.push(`/pet/${mascota.id}/weight`)}
                >
                  <Text style={[estilos.btnAddPanelText, { color: colors.brand }]}>
                    + Control de peso
                  </Text>
                </TouchableOpacity>
              </View>

              {citas.length === 0 && pesos.length === 0 ? (
                <View
                  style={[
                    estilos.emptyCard,
                    { backgroundColor: colors.surface, borderColor: colors.line },
                  ]}
                >
                  <Text style={{ fontSize: 32 }}>🩺</Text>
                  <Text style={[estilos.emptyTitle, { color: colors.text }]}>
                    Sin historial de citas ni pesajes
                  </Text>
                  <Text style={[estilos.emptySub, { color: colors.muted }]}>
                    Agenda su próxima visita veterinaria indicando el lugar o registra su peso.
                  </Text>
                </View>
              ) : (
                <>
                  {citas.map((c) => {
                    const dias = diasHasta(c.fecha);
                    const vencida = dias !== null && dias < 0;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          estilos.itemCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: vencida ? colors.warn : colors.line,
                          },
                        ]}
                        onPress={() => router.push(`/pet/${mascota.id}/appointments`)}
                      >
                        <View style={[estilos.itemIc, { backgroundColor: colors.surface2 }]}>
                          <Text style={{ fontSize: 20 }}>🩺</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[estilos.itemBold, { color: colors.text }]}>
                            {c.motivo}
                          </Text>
                          <Text
                            style={[
                              estilos.itemSmall,
                              { color: vencida ? colors.warn : colors.muted },
                            ]}
                          >
                            {vencida
                              ? `Vencida · ${formatearFechaCorta(c.fecha)}`
                              : `Fecha · ${formatearFecha(c.fecha)}`}
                          </Text>
                          {c.lugar || c.veterinario ? (
                            <Text style={[estilos.itemSmall, { color: colors.brand, fontWeight: '700' }]}>
                              📍 {[c.lugar, c.veterinario].filter(Boolean).join(' · ')}
                            </Text>
                          ) : null}
                          {c.diagnostico || c.seguimientoPostConsulta ? (
                            <View
                              style={{
                                marginTop: 6,
                                padding: 8,
                                borderRadius: 10,
                                backgroundColor: colors.okBg,
                              }}
                            >
                              {c.diagnostico ? (
                                <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.brand }}>
                                  📋 Diagnóstico Vet: {c.diagnostico}
                                </Text>
                              ) : null}
                              {c.seguimientoPostConsulta ? (
                                <Text style={{ fontSize: 11.5, color: colors.text, marginTop: 2 }}>
                                  🩺 Seguimiento: {c.seguimientoPostConsulta}
                                </Text>
                              ) : null}
                            </View>
                          ) : null}
                        </View>
                        <Text
                          style={[
                            estilos.itemWhen,
                            { color: vencida ? colors.warn : colors.brand },
                          ]}
                        >
                          {vencida ? 'Reagendar' : formatearFechaCorta(c.fecha)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {pesos.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        estilos.itemCard,
                        { backgroundColor: colors.surface, borderColor: colors.line },
                      ]}
                      onPress={() => router.push(`/pet/${mascota.id}/weight`)}
                    >
                      <View style={[estilos.itemIc, { backgroundColor: colors.surface2 }]}>
                        <Text style={{ fontSize: 20 }}>⚖️</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[estilos.itemBold, { color: colors.text }]}>
                          Control de peso
                        </Text>
                        <Text style={[estilos.itemSmall, { color: colors.muted }]}>
                          {p.peso} kg {p.notas ? `· ${p.notas}` : ''}
                        </Text>
                      </View>
                      <Text style={[estilos.itemWhen, { color: colors.brand }]}>
                        {formatearFechaCorta(p.fecha)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Opciones / Editar Mascota (botón ⋯) */}
      <Modal
        visible={modalOpcionesVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalOpcionesVisible(false)}
      >
        <View style={estilos.modalOverlay}>
          <TouchableOpacity
            style={estilos.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalOpcionesVisible(false)}
          />
          <View style={[estilos.modalSheet, { backgroundColor: colors.surface, maxHeight: '88%' }]}>
            <View style={[estilos.sheetHandle, { backgroundColor: colors.line }]} />
            <View style={estilos.modalHeaderRow}>
              <Text style={[estilos.modalTitulo, { color: colors.text }]}>
                Editar a {mascota.nombre}
              </Text>
              <TouchableOpacity
                onPress={() => setModalOpcionesVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 18, color: colors.muted, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>Nombre</Text>
            <TextInput
              style={[
                estilos.input,
                { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.text },
              ]}
              value={editNombre}
              onChangeText={setEditNombre}
            />

            <Text style={[estilos.campoLabel, { color: colors.muted }]}>Especie</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {ESPECIES_DISPONIBLES.map((esp) => {
                const act = editEspecie === esp.id;
                return (
                  <TouchableOpacity
                    key={esp.id}
                    style={[
                      estilos.unidadBtn,
                      {
                        paddingHorizontal: 12,
                        backgroundColor: act ? colors.brand : colors.surface2,
                        borderColor: act ? colors.brand : colors.line,
                      },
                    ]}
                    onPress={() => setEditEspecie(esp.id)}
                  >
                    <Text
                      style={{
                        color: act ? colors.brandInk : colors.muted,
                        fontWeight: '800',
                        fontSize: 12,
                      }}
                    >
                      {esp.emoji} {esp.etiqueta}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ marginBottom: 4 }}>
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>Sexo</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { id: 'macho', label: '♂ Macho' },
                  { id: 'hembra', label: '♀ Hembra' },
                ].map((s) => {
                  const act = editSexo === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        estilos.unidadBtn,
                        {
                          flex: 1,
                          backgroundColor: act ? colors.brand : colors.surface2,
                          borderColor: act ? colors.brand : colors.line,
                        },
                      ]}
                      onPress={() => setEditSexo(s.id)}
                    >
                      <Text
                        style={{
                          color: act ? colors.brandInk : colors.muted,
                          fontWeight: '800',
                          fontSize: 12,
                        }}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={[estilos.campoLabel, { color: colors.muted }]}>Edad</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[
                  estilos.input,
                  {
                    flex: 1,
                    backgroundColor: colors.surface2,
                    borderColor: colors.line,
                    color: colors.text,
                  },
                ]}
                keyboardType="number-pad"
                value={editEdadValor}
                onChangeText={setEditEdadValor}
              />
              {[
                { id: 'anos', label: 'Años' },
                { id: 'meses', label: 'Meses' },
              ].map((u) => {
                const act = editEdadUnidad === u.id;
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={[
                      estilos.unidadBtn,
                      {
                        backgroundColor: act ? colors.brand : colors.surface2,
                        borderColor: act ? colors.brand : colors.line,
                      },
                    ]}
                    onPress={() => setEditEdadUnidad(u.id)}
                  >
                    <Text
                      style={{
                        color: act ? colors.brandInk : colors.muted,
                        fontWeight: '800',
                        fontSize: 12,
                      }}
                    >
                      {u.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[estilos.campoLabel, { color: colors.muted }]}>Raza</Text>
                <TextInput
                  style={[
                    estilos.input,
                    { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.text },
                  ]}
                  value={editRaza}
                  onChangeText={setEditRaza}
                />
              </View>
              <View style={{ width: '40%' }}>
                <Text style={[estilos.campoLabel, { color: colors.muted }]}>Peso (kg)</Text>
                <TextInput
                  style={[
                    estilos.input,
                    { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.text },
                  ]}
                  keyboardType="decimal-pad"
                  value={editPeso}
                  onChangeText={setEditPeso}
                />
              </View>
            </View>

            <Text style={[estilos.campoLabel, { color: colors.muted }]}>Tamaño</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['Pequeño', 'Mediano', 'Grande'].map((tam) => {
                const act = editTamano === tam;
                return (
                  <TouchableOpacity
                    key={tam}
                    style={[
                      estilos.unidadBtn,
                      {
                        flex: 1,
                        backgroundColor: act ? colors.brand : colors.surface2,
                        borderColor: act ? colors.brand : colors.line,
                      },
                    ]}
                    onPress={() => setEditTamano(tam)}
                  >
                    <Text
                      style={{
                        color: act ? colors.brandInk : colors.muted,
                        fontWeight: '800',
                        fontSize: 12,
                      }}
                    >
                      {tam}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[estilos.campoLabel, { color: colors.muted }]}>Color / Pelaje</Text>
                <TextInput
                  style={[
                    estilos.input,
                    { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.text },
                  ]}
                  placeholder="Ej. Dorado, Negro..."
                  placeholderTextColor={colors.muted}
                  value={editColor}
                  onChangeText={setEditColor}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[estilos.campoLabel, { color: colors.muted }]}>N° Microchip / ID</Text>
                <TextInput
                  style={[
                    estilos.input,
                    { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.text },
                  ]}
                  placeholder="Ej. 98102000123"
                  placeholderTextColor={colors.muted}
                  value={editMicrochip}
                  onChangeText={setEditMicrochip}
                />
              </View>
            </View>

            <Text style={[estilos.campoLabel, { color: colors.muted }]}>
              Características físicas / Señas particulares
            </Text>
            <TextInput
              style={[
                estilos.input,
                { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.text },
              ]}
              placeholder="Ej. Mancha blanca en el pecho, ojos miel..."
              placeholderTextColor={colors.muted}
              value={editCaracteristicas}
              onChangeText={setEditCaracteristicas}
            />

            <TouchableOpacity
              style={[estilos.btnGuardarModal, { backgroundColor: colors.brand }]}
              onPress={guardarEdicionMascota}
            >
              <Text style={{ color: colors.brandInk, fontWeight: '800', fontSize: 14 }}>
                Guardar cambios
              </Text>
            </TouchableOpacity>

              <TouchableOpacity
                style={[
                  estilos.btnEliminarModal,
                  { backgroundColor: colors.warnBg, borderColor: colors.warn },
                ]}
                onPress={confirmarEliminar}
              >
                <Text style={{ color: colors.warn, fontWeight: '800', fontSize: 13.5 }}>
                  Eliminar mascota
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modales Flotantes */}
      <EmergencyQRModal
        visible={modalQrVisible}
        onClose={() => setModalQrVisible(false)}
        mascota={mascota}
        usuario={usuario}
      />
      <MedicalPDFModal
        visible={modalPdfVisible}
        onClose={() => setModalPdfVisible(false)}
        mascota={mascota}
        usuario={usuario}
      />
      <SpecialDatesModal
        visible={modalCumpleVisible}
        onClose={() => setModalCumpleVisible(false)}
        mascota={mascota}
        onActualizarFechaNacimiento={async (nuevaFechaIso) => {
          const actualizada = {
            ...mascota,
            fechaNacimiento: nuevaFechaIso,
          };
          await editarMascota(actualizada);
          setMascotaDirecta(actualizada);
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contenidoInferior: {
    paddingHorizontal: 18,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  textoCarga: {
    fontSize: 15,
    fontWeight: '800',
  },
  linkVolver: {
    marginTop: 10,
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
  },
  tabBtn: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 99,
    borderWidth: 1,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  two: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  fichaFisicaCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  fichaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  fichaChip: {
    width: '48%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  fichaChipLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  fichaChipVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  twoCard: {
    flex: 1,
    padding: 14,
    minHeight: 126,
    borderRadius: 20,
    borderWidth: 1,
  },
  twoBold: {
    fontSize: 15,
    fontWeight: '800',
  },
  twoStatus: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  twoSmall: {
    fontSize: 12.5,
    marginTop: 4,
    lineHeight: 17,
    fontWeight: '600',
  },
  alertBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconText: {
    fontSize: 16,
    fontWeight: '800',
  },
  alertTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  accionesFila: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  btnAccionPet: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  iconoAccionPet: {
    width: 38,
    height: 38,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloAccionPet: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  subAccionPet: {
    fontSize: 11,
    marginTop: 1,
    fontWeight: '600',
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 10,
  },
  listaOpciones: {
    gap: 8,
  },
  opcionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  opcionIcono: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  opcionTitulo: {
    fontSize: 14,
    fontWeight: '800',
  },
  opcionDetalle: {
    fontSize: 12,
    marginTop: 1,
  },
  list: {
    gap: 8,
  },
  btnAddPanel: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  btnAddPanelText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
  },
  itemIc: {
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
  itemWhen: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
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
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
  },
  campoLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13.5,
    fontWeight: '600',
  },
  unidadBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGuardarModal: {
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  btnEliminarModal: {
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});
