import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/hooks/useAuth';
import { usePets } from '../../src/hooks/usePets';
import { useReminders } from '../../src/hooks/useReminders';
import { useTheme } from '../../src/hooks/useTheme';
import EmergencyQRModal from '../../src/components/pets/EmergencyQRModal';
import MedicalPDFModal from '../../src/components/pets/MedicalPDFModal';
import {
  ESPECIES_DISPONIBLES,
  emojiSoloEspecie,
  coloresPortadaEspecie,
  tieneFotoPersonalizada,
  simboloSexo,
  nombreEspecie,
} from '../../src/constants/pets';
import { calcularFechaDesdeEdad, obtenerTextoEdad } from '../../src/utils/dates';
import { avisar } from '../../src/utils/dialogs';

export default function PetsScreen() {
  const { usuario } = useAuth();
  const { mascotas, cargando, cargarMascotas, agregarMascota, editarMascota } = usePets(usuario?.id);
  const { crearRecordatorio } = useReminders(usuario?.id);
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { openModal } = useLocalSearchParams();

  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estados del modal de QR y Ficha PDF
  const [modalQrVisible, setModalQrVisible] = useState(false);
  const [modalPdfVisible, setModalPdfVisible] = useState(false);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);

  // Formulario nueva mascota
  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('perro');
  const [sexo, setSexo] = useState('macho');
  const [edadValor, setEdadValor] = useState('');
  const [edadUnidad, setEdadUnidad] = useState('anos'); // 'anos' | 'meses'
  const [raza, setRaza] = useState('');
  const [peso, setPeso] = useState('');
  const [tamano, setTamano] = useState('Mediano');
  const [colorPelaje, setColorPelaje] = useState('');
  const [caracteristicas, setCaracteristicas] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [fotoPersonalizada, setFotoPersonalizada] = useState(null);

  useEffect(() => {
    if (openModal === 'new') {
      setModalVisible(true);
    }
  }, [openModal]);

  useFocusEffect(
    useCallback(() => {
      cargarMascotas();
    }, [cargarMascotas])
  );

  const seleccionarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso necesario', 'Se necesita acceso a tus fotos para elegir una imagen.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        setFotoPersonalizada(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('Error al seleccionar foto:', e);
    }
  };

  const cambiarFotoDirecta = async (mascota) => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso necesario', 'Se necesita acceso a tus fotos para cambiar la imagen.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        await editarMascota({
          ...mascota,
          foto: res.assets[0].uri,
        });
      }
    } catch (e) {
      console.warn('Error al cambiar foto:', e);
    }
  };

  const limpiarFormulario = () => {
    setNombre('');
    setEspecie('perro');
    setSexo('macho');
    setEdadValor('');
    setEdadUnidad('anos');
    setRaza('');
    setPeso('');
    setTamano('Mediano');
    setColorPelaje('');
    setCaracteristicas('');
    setMicrochip('');
    setFotoPersonalizada(null);
  };

  const handleGuardarMascota = async () => {
    if (!nombre.trim()) {
      avisar('Nombre requerido', 'Por favor ingresa el nombre de tu mascota.');
      return;
    }
    setGuardando(true);
    try {
      const edadNum = edadValor.trim() ? parseInt(edadValor.trim(), 10) : 1;
      const maxEdad = edadUnidad === 'meses' ? 480 : 40;
      if (edadValor.trim() && (isNaN(edadNum) || edadNum < 0 || !(edadNum <= 40 || (edadUnidad === 'meses' && edadNum <= maxEdad)))) {
        avisar(
          'Edad inválida',
          `Ingresa una edad válida (máximo ${maxEdad} ${edadUnidad === 'meses' ? 'meses' : 'años'}).`
        );
        setGuardando(false);
        return;
      }
      const edadValida = !isNaN(edadNum) && edadNum >= 0 ? edadNum : 1;
      const fechaNac = calcularFechaDesdeEdad(edadValida, edadUnidad);
      const pesoNum = peso.trim() ? parseFloat(peso.replace(',', '.')) : null;
      if (peso.trim() && (isNaN(pesoNum) || !(pesoNum > 0 && pesoNum <= 300))) {
        avisar('Peso inválido', 'Ingresa un peso numérico válido entre 0.1 y 300 kg.');
        setGuardando(false);
        return;
      }

      await agregarMascota({
        nombre: nombre.trim(),
        especie,
        sexo,
        edadValor: edadValida,
        edadUnidad,
        fechaNacimiento: fechaNac,
        raza: raza.trim() || 'Mestizo',
        pesoActual: pesoNum && !isNaN(pesoNum) ? pesoNum : null,
        tamano: tamano || 'Mediano',
        color: colorPelaje.trim(),
        caracteristicas: caracteristicas.trim(),
        microchip: microchip.trim(),
        // Al inicio va con emoji (foto: null) a menos que el usuario haya elegido una foto
        foto: fotoPersonalizada || null,
      });

      limpiarFormulario();
      setModalVisible(false);
    } catch {
      avisar('Error', 'No se pudo guardar la mascota. Intenta nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={[estilos.contenedor, { backgroundColor: colors.bg }]}>
      {/* Top Header (.head + .fab) */}
      <View style={estilos.head}>
        <View>
          <Text style={[estilos.h2, { color: colors.text }]}>Mis mascotas</Text>
          <Text style={[estilos.sub, { color: colors.muted }]}>
            {mascotas.length} {mascotas.length === 1 ? 'mascota registrada' : 'mascotas registradas'}
          </Text>
        </View>

        <TouchableOpacity
          style={[estilos.fab, { backgroundColor: colors.brand }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={[estilos.fabText, { color: colors.brandInk }]}>+ Añadir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cargando && mascotas.length === 0 ? (
          <View style={estilos.centrado}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={[estilos.textoCargando, { color: colors.muted }]}>
              Cargando tus mascotas...
            </Text>
          </View>
        ) : mascotas.length === 0 ? (
          <View
            style={[
              estilos.cardVacia,
              {
                backgroundColor: colors.surface,
                borderColor: colors.line,
              },
            ]}
          >
            <Text style={{ fontSize: 48, marginBottom: 10 }}>🐾</Text>
            <Text style={[estilos.tituloVacio, { color: colors.text }]}>
              Aún no tienes mascotas registradas
            </Text>
            <Text style={[estilos.subtituloVacio, { color: colors.muted }]}>
              Registra a tu mascota con su emoji inicial (y cámbialo por su foto real cuando quieras) para llevar sus vacunas, citas y peso.
            </Text>
            <TouchableOpacity
              style={[estilos.fab, { backgroundColor: colors.brand, marginTop: 6 }]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={[estilos.fabText, { color: colors.brandInk }]}>
                + Registrar mi primera mascota
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          mascotas.map((m) => {
            const usaFotoReal = tieneFotoPersonalizada(m);
            const coverColors = coloresPortadaEspecie(m.especie);
            const emoji = emojiSoloEspecie(m.especie);
            const sexoSimb = simboloSexo(m.sexo);
            const especieTexto = m.raza || nombreEspecie(m.especie, m.sexo);
            const edadTexto = obtenerTextoEdad(m);
            const pesoTexto = m.pesoActual ? `${m.pesoActual} kg` : 'Sin peso';

            return (
              <View
                key={m.id}
                style={[
                  estilos.pcard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.line,
                  },
                ]}
              >
                {/* Portada (.cover): Fondo de color con Emoji o Foto Real si el usuario la subió */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push(`/pet/${m.id}`)}
                >
                  <LinearGradient
                    colors={coverColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={estilos.cover}
                  >
                    {usaFotoReal ? (
                      <Image
                        source={{ uri: m.foto }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={estilos.coverEmoji}>{emoji}</Text>
                    )}

                    {/* Botón para subir/cambiar foto real */}
                    <TouchableOpacity
                      style={estilos.btnCamaraCover}
                      onPress={() => cambiarFotoDirecta(m)}
                      activeOpacity={0.85}
                    >
                      <Text style={{ fontSize: 12 }}>📷</Text>
                      <Text style={estilos.btnCamaraTexto}>
                        {usaFotoReal ? 'Cambiar foto' : 'Poner foto'}
                      </Text>
                    </TouchableOpacity>

                    {/* Badge 🏠 En casa */}
                    <View style={estilos.badge}>
                      <Text style={estilos.badgeText}>🏠 En casa</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Cuerpo de la tarjeta (.pbody) */}
                <View style={estilos.pbody}>
                  <Text style={[estilos.h4, { color: colors.text }]}>
                    {m.nombre} {sexoSimb}
                  </Text>
                  <Text style={[estilos.pMeta, { color: colors.muted }]}>
                    {especieTexto} · {edadTexto} · {pesoTexto}
                    {m.tamano ? ` · ${m.tamano}` : ''}
                  </Text>
                  {(m.color || m.microchip) ? (
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1, fontWeight: '600' }}>
                      {[
                        m.color ? `🎨 ${m.color}` : null,
                        m.microchip ? `🆔 Chip: ${m.microchip}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  ) : null}
                  <Text style={[estilos.ok, { color: colors.brand }]}>♥ Saludable</Text>

                  {/* Fila de 3 botones (.actions) */}
                  <View style={estilos.actions}>
                    <TouchableOpacity
                      style={[estilos.btn, { backgroundColor: colors.surface2 }]}
                      onPress={() => {
                        setMascotaSeleccionada(m);
                        setModalQrVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[estilos.btnText, { color: colors.brand }]}>▦ QR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[estilos.btn, { backgroundColor: colors.surface2 }]}
                      onPress={() => {
                        setMascotaSeleccionada(m);
                        setModalPdfVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[estilos.btnText, { color: colors.brand }]}>📄 Ficha</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[estilos.btn, { backgroundColor: colors.brand }]}
                      onPress={() => router.push(`/pet/${m.id}`)}
                      activeOpacity={0.85}
                    >
                      <Text style={[estilos.btnText, { color: colors.brandInk }]}>
                        Ver perfil
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal para Registrar Mascota */}
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
                Nueva Mascota
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[estilos.modalCerrar, { color: colors.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {/* Vista previa con Emoji por defecto o Foto Real */}
              <View
                style={[
                  estilos.fotoSelectorRow,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
              >
                <LinearGradient
                  colors={coloresPortadaEspecie(especie)}
                  style={[estilos.fotoPreviewContenedor, { borderColor: colors.brand }]}
                >
                  {fotoPersonalizada ? (
                    <Image source={{ uri: fotoPersonalizada }} style={estilos.fotoPreview} />
                  ) : (
                    <Text style={{ fontSize: 30 }}>{emojiSoloEspecie(especie)}</Text>
                  )}
                </LinearGradient>

                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={seleccionarFoto} activeOpacity={0.8}>
                    <Text style={[estilos.btnCambiarFotoTexto, { color: colors.brand }]}>
                      {fotoPersonalizada
                        ? '✓ Foto real seleccionada (Cambiar)'
                        : '📷 Subir foto real (Opcional)'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[estilos.subtextoFotoModal, { color: colors.muted }]}>
                    Si no eliges foto ahora, iniciará con el emoji {emojiSoloEspecie(especie)} y podrás cambiarla después.
                  </Text>
                  {fotoPersonalizada && (
                    <TouchableOpacity onPress={() => setFotoPersonalizada(null)}>
                      <Text style={{ fontSize: 11, color: colors.warn, fontWeight: '700', marginTop: 3 }}>
                        Usar emoji por defecto
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Selector de Especie */}
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Especie de tu mascota
              </Text>
              <View style={estilos.especieGrid}>
                {ESPECIES_DISPONIBLES.map((esp) => {
                  const activo = especie === esp.id;
                  return (
                    <TouchableOpacity
                      key={esp.id}
                      style={[
                        estilos.especieGridBtn,
                        {
                          backgroundColor: activo ? colors.okBg : colors.surface2,
                          borderColor: activo ? colors.brand : colors.line,
                        },
                      ]}
                      onPress={() => setEspecie(esp.id)}
                    >
                      <Text style={{ fontSize: 22 }}>{esp.emoji}</Text>
                      <Text
                        style={[
                          estilos.especieBtnTexto,
                          {
                            color: activo ? colors.brand : colors.text,
                            fontWeight: activo ? '800' : '600',
                          },
                        ]}
                      >
                        {esp.etiqueta}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Nombre y Sexo */}
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Nombre de la mascota *
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
                placeholder="Ej. Missy, Bobby..."
                placeholderTextColor={colors.muted}
                value={nombre}
                onChangeText={setNombre}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>Sexo</Text>
              <View style={estilos.filaDos}>
                {[
                  { id: 'macho', label: '♂ Macho' },
                  { id: 'hembra', label: '♀ Hembra' },
                ].map((s) => {
                  const activo = sexo === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        estilos.chipOpcion,
                        {
                          backgroundColor: activo ? colors.okBg : colors.surface2,
                          borderColor: activo ? colors.brand : colors.line,
                        },
                      ]}
                      onPress={() => setSexo(s.id)}
                    >
                      <Text
                        style={{
                          color: activo ? colors.brand : colors.text,
                          fontWeight: '800',
                          fontSize: 13,
                        }}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Edad (Años o Meses) */}
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Edad de la mascota
              </Text>
              <View style={estilos.filaDos}>
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
                  placeholder="Ej. 2"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  value={edadValor}
                  onChangeText={setEdadValor}
                />
                <View style={estilos.unidadToggle}>
                  {[
                    { id: 'anos', label: 'Años' },
                    { id: 'meses', label: 'Meses' },
                  ].map((u) => {
                    const activo = edadUnidad === u.id;
                    return (
                      <TouchableOpacity
                        key={u.id}
                        style={[
                          estilos.unidadBtn,
                          {
                            backgroundColor: activo ? colors.brand : colors.surface2,
                            borderColor: activo ? colors.brand : colors.line,
                          },
                        ]}
                        onPress={() => setEdadUnidad(u.id)}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '800',
                            color: activo ? colors.brandInk : colors.muted,
                          }}
                        >
                          {u.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Raza y Peso */}
              <View style={estilos.filaDos}>
                <View style={{ flex: 1 }}>
                  <Text style={[estilos.campoLabel, { color: colors.muted }]}>Raza</Text>
                  <TextInput
                    style={[
                      estilos.input,
                      {
                        backgroundColor: colors.surface2,
                        borderColor: colors.line,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Ej. Golden, Mestiza"
                    placeholderTextColor={colors.muted}
                    value={raza}
                    onChangeText={setRaza}
                  />
                </View>

                <View style={{ width: '42%' }}>
                  <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                    Peso actual (kg)
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
                    placeholder="Ej. 10"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    value={peso}
                    onChangeText={setPeso}
                  />
                </View>
              </View>

              {/* Tamaño de la mascota */}
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>Tamaño</Text>
              <View style={estilos.filaDos}>
                {['Pequeño', 'Mediano', 'Grande'].map((tam) => {
                  const act = tamano === tam;
                  return (
                    <TouchableOpacity
                      key={tam}
                      style={[
                        estilos.chipOpcion,
                        {
                          backgroundColor: act ? colors.okBg : colors.surface2,
                          borderColor: act ? colors.brand : colors.line,
                        },
                      ]}
                      onPress={() => setTamano(tam)}
                    >
                      <Text
                        style={{
                          color: act ? colors.brand : colors.text,
                          fontWeight: '800',
                          fontSize: 12.5,
                        }}
                      >
                        {tam}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Color y Número de Identificación / Microchip */}
              <View style={estilos.filaDos}>
                <View style={{ flex: 1 }}>
                  <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                    Color / Pelaje
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
                    placeholder="Ej. Dorado, Blanco con manchas"
                    placeholderTextColor={colors.muted}
                    value={colorPelaje}
                    onChangeText={setColorPelaje}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                    N° Microchip / ID
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
                    placeholder="Ej. 981020000123"
                    placeholderTextColor={colors.muted}
                    value={microchip}
                    onChangeText={setMicrochip}
                  />
                </View>
              </View>

              {/* Características físicas / señas particulares */}
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Características físicas / Señas particulares (opcional)
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
                placeholder="Ej. Mancha blanca en el pecho, collar verde, ojos miel..."
                placeholderTextColor={colors.muted}
                value={caracteristicas}
                onChangeText={setCaracteristicas}
              />

              <TouchableOpacity
                style={[estilos.btnGuardarModal, { backgroundColor: colors.brand }]}
                onPress={handleGuardarMascota}
                disabled={guardando}
                activeOpacity={0.85}
              >
                {guardando ? (
                  <ActivityIndicator color={colors.brandInk} size="small" />
                ) : (
                  <Text style={[estilos.btnGuardarModalTexto, { color: colors.brandInk }]}>
                    Guardar Mascota
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modales de Utilidad */}
      {mascotaSeleccionada && (
        <>
          <EmergencyQRModal
            visible={modalQrVisible}
            onClose={() => setModalQrVisible(false)}
            mascota={mascotaSeleccionada}
            usuario={usuario}
          />
          <MedicalPDFModal
            visible={modalPdfVisible}
            onClose={() => setModalPdfVisible(false)}
            mascota={mascotaSeleccionada}
            usuario={usuario}
          />
        </>
      )}
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
    paddingBottom: 14,
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  centrado: {
    paddingTop: 80,
    alignItems: 'center',
  },
  textoCargando: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '600',
  },
  cardVacia: {
    padding: 26,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 30,
  },
  tituloVacio: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtituloVacio: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  pcard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#14302F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cover: {
    height: 114,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  coverEmoji: {
    fontSize: 60,
  },
  btnCamaraCover: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 48, 47, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  btnCamaraTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeText: {
    color: '#14302F',
    fontSize: 12,
    fontWeight: '800',
  },
  pbody: {
    padding: 14,
  },
  h4: {
    fontSize: 19,
    fontWeight: '800',
  },
  pMeta: {
    fontSize: 14,
    marginVertical: 2,
    fontWeight: '600',
  },
  ok: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '800',
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
    marginBottom: 12,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCerrar: {
    fontSize: 18,
    fontWeight: '700',
  },
  fotoSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  fotoPreviewContenedor: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotoPreview: {
    width: '100%',
    height: '100%',
  },
  btnCambiarFotoTexto: {
    fontSize: 13,
    fontWeight: '800',
  },
  subtextoFotoModal: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  campoLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 10,
  },
  especieGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  especieGridBtn: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  especieBtnTexto: {
    fontSize: 11.5,
  },
  input: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13.5,
    fontWeight: '600',
  },
  filaDos: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  chipOpcion: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unidadToggle: {
    flexDirection: 'row',
    gap: 6,
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
});
