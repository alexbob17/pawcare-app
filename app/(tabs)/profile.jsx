import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { avisar } from '../../src/utils/dialogs';
import {
  solicitarPermisosNotificaciones,
  dispararNotificacionInmediata,
  cancelarTodosLosRecordatorios,
} from '../../src/services/notifications';

export default function ProfileScreen() {
  const { usuario, actualizarPerfil, cerrarSesion } = useAuth();
  const { colors, isDark, toggleTema } = useTheme();
  const router = useRouter();

  const [modalEditar, setModalEditar] = useState(false);
  const [modalLogoutVisible, setModalLogoutVisible] = useState(false);

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [telefono, setTelefono] = useState(usuario?.telefono || '');
  const [direccion, setDireccion] = useState(usuario?.direccion || '');
  const [veterinarioNombre, setVeterinarioNombre] = useState(usuario?.veterinarioNombre || '');
  const [veterinarioClinica, setVeterinarioClinica] = useState(usuario?.veterinarioClinica || '');
  const [notificacionesOn, setNotificacionesOn] = useState(
    usuario?.notificacionesActivas ?? true
  );
  const [guardando, setGuardando] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const abrirModalEdicion = () => {
    setNombre(usuario?.nombre || '');
    setTelefono(usuario?.telefono || '');
    setDireccion(usuario?.direccion || '');
    setVeterinarioNombre(usuario?.veterinarioNombre || '');
    setVeterinarioClinica(usuario?.veterinarioClinica || '');
    setModalEditar(true);
  };

  const handleGuardarPerfil = async () => {
    setGuardando(true);
    try {
      await actualizarPerfil({
        nombre: nombre.trim() || 'Usuario',
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        veterinarioNombre: veterinarioNombre.trim(),
        veterinarioClinica: veterinarioClinica.trim(),
      });
      setModalEditar(false);
      avisar('Perfil actualizado', 'Tus datos para el QR y tu veterinario se guardaron correctamente.');
    } catch {
      avisar('Error', 'No se pudo actualizar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleNotificaciones = async () => {
    const nuevoEstado = !notificacionesOn;
    setNotificacionesOn(nuevoEstado);
    await actualizarPerfil({ notificacionesActivas: nuevoEstado });
    if (nuevoEstado) {
      const ok = await solicitarPermisosNotificaciones();
      if (ok) {
        await dispararNotificacionInmediata(
          'Notificaciones activadas',
          'Recibirás alertas de vacunas, medicinas y citas veterinarias.'
        );
      }
    } else {
      await cancelarTodosLosRecordatorios();
    }
  };

  const confirmarCerrarSesion = async () => {
    setCerrando(true);
    try {
      await cerrarSesion();
    } catch (err) {
      console.warn('Error al cerrar sesión:', err);
    } finally {
      setCerrando(false);
      setModalLogoutVisible(false);
      router.replace('/(auth)/login');
    }
  };

  const inicialNombre = (usuario?.nombre || 'A').trim()[0]?.toUpperCase() || 'A';

  return (
    <View style={[estilos.contenedor, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[estilos.h2, { color: colors.text }]}>Mi perfil</Text>
        <Text style={[estilos.sub, { color: colors.muted }]}>
          Configuración y cuenta de PawCare
        </Text>

        {/* Tarjeta de Usuario (.card.setting) */}
        <View
          style={[
            estilos.userCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.line,
            },
          ]}
        >
          <View
            style={[
              estilos.av,
              {
                backgroundColor: colors.surface2,
                borderColor: colors.brand,
              },
            ]}
          >
            {usuario?.foto ? (
              <Image source={{ uri: usuario.foto }} style={estilos.avImg} />
            ) : (
              <Text style={[estilos.avLetra, { color: colors.brand }]}>{inicialNombre}</Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[estilos.settingBold, { color: colors.text }]}>
              {usuario?.nombre || 'Tutor PawCare'}
            </Text>
            <Text style={[estilos.settingSmall, { color: colors.brand, fontWeight: '700' }]}>
              Sincronización activa ●
            </Text>
          </View>

          <TouchableOpacity
            style={[estilos.btn, { backgroundColor: colors.surface2 }]}
            onPress={abrirModalEdicion}
            activeOpacity={0.8}
          >
            <Text style={[estilos.btnText, { color: colors.brand }]}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Preferencias */}
        <Text style={[estilos.h3, { color: colors.text }]}>Preferencias</Text>

        <View
          style={[
            estilos.prefsCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.line,
            },
          ]}
        >
          {/* 1. Modo Oscuro */}
          <View style={estilos.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[estilos.settingBold, { color: colors.text }]}>Modo oscuro</Text>
              <Text style={[estilos.settingSmall, { color: colors.muted }]}>
                {isDark ? 'Tema oscuro activado' : 'Tema claro activado'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                estilos.sw,
                { backgroundColor: isDark ? colors.brand : colors.line },
              ]}
              onPress={toggleTema}
              activeOpacity={0.85}
              accessibilityRole="switch"
              accessibilityState={{ checked: isDark }}
            >
              <View
                style={[
                  estilos.swKnob,
                  isDark && { transform: [{ translateX: 20 }] },
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* 2. Notificaciones */}
          <View
            style={[
              estilos.settingRow,
              { borderTopWidth: 1, borderTopColor: colors.line },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[estilos.settingBold, { color: colors.text }]}>Notificaciones</Text>
              <Text style={[estilos.settingSmall, { color: colors.muted }]}>
                Vacunas, citas y medicinas
              </Text>
            </View>
            <TouchableOpacity
              style={[
                estilos.sw,
                { backgroundColor: notificacionesOn ? colors.brand : colors.line },
              ]}
              onPress={handleToggleNotificaciones}
              activeOpacity={0.85}
              accessibilityRole="switch"
              accessibilityState={{ checked: notificacionesOn }}
            >
              <View
                style={[
                  estilos.swKnob,
                  notificacionesOn && { transform: [{ translateX: 20 }] },
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* 3. Teléfono para QR del collar */}
          <TouchableOpacity
            style={[
              estilos.settingRow,
              { borderTopWidth: 1, borderTopColor: colors.line },
            ]}
            onPress={abrirModalEdicion}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={[estilos.settingBold, { color: colors.text }]}>
                Teléfono para QR del collar
              </Text>
              <Text style={[estilos.settingSmall, { color: colors.muted }]}>
                {usuario?.telefono || 'Toca para añadir tu WhatsApp de contacto'}
              </Text>
            </View>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.brand }}>
              {usuario?.telefono ? 'Cambiar' : '+ Añadir'}
            </Text>
          </TouchableOpacity>

          {/* 4. Dirección para QR del collar */}
          <TouchableOpacity
            style={[
              estilos.settingRow,
              { borderTopWidth: 1, borderTopColor: colors.line },
            ]}
            onPress={abrirModalEdicion}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={[estilos.settingBold, { color: colors.text }]}>
                Dirección para QR de rescate
              </Text>
              <Text style={[estilos.settingSmall, { color: colors.muted }]}>
                {usuario?.direccion || 'Toca para añadir tu dirección o colonia'}
              </Text>
            </View>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.brand }}>
              {usuario?.direccion ? 'Editar' : '+ Añadir'}
            </Text>
          </TouchableOpacity>

          {/* 5. Mi veterinario y clínica habitual */}
          <TouchableOpacity
            style={[
              estilos.settingRow,
              { borderTopWidth: 1, borderTopColor: colors.line },
            ]}
            onPress={abrirModalEdicion}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={[estilos.settingBold, { color: colors.text }]}>Mi veterinario</Text>
              <Text style={[estilos.settingSmall, { color: colors.muted }]}>
                {usuario?.veterinarioNombre || usuario?.veterinarioClinica
                  ? [usuario.veterinarioNombre, usuario.veterinarioClinica]
                      .filter(Boolean)
                      .join(' · ')
                  : 'Agregar contacto y clínica de visita'}
              </Text>
            </View>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.brand }}>
              {usuario?.veterinarioNombre || usuario?.veterinarioClinica ? 'Editar' : '+ Agregar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón Cerrar Sesión (.logout) */}
        <TouchableOpacity
          style={[
            estilos.logout,
            {
              backgroundColor: colors.warnBg,
              borderColor: colors.warn,
            },
          ]}
          onPress={() => setModalLogoutVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={[estilos.logoutText, { color: colors.warn }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Confirmación de Cerrar Sesión (con texto y botones claros) */}
      <Modal
        visible={modalLogoutVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalLogoutVisible(false)}
      >
        <View style={estilos.logoutModalOverlay}>
          <View
            style={[
              estilos.logoutModalCard,
              { backgroundColor: colors.surface, borderColor: colors.line },
            ]}
          >
            <Text style={{ fontSize: 34, marginBottom: 8 }}>🐾</Text>
            <Text style={[estilos.logoutModalTitle, { color: colors.text }]}>
              ¿Cerrar sesión en PawCare?
            </Text>
            <Text style={[estilos.logoutModalSub, { color: colors.muted }]}>
              Tus mascotas, vacunas y recordatorios están guardados de forma segura y volverán a aparecer al iniciar sesión.
            </Text>

            <View style={estilos.logoutModalActions}>
              <TouchableOpacity
                style={[
                  estilos.logoutCancelBtn,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
                onPress={() => setModalLogoutVisible(false)}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.logoutConfirmBtn, { backgroundColor: colors.warn }]}
                onPress={confirmarCerrarSesion}
                disabled={cerrando}
              >
                {cerrando ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
                    Sí, salir
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Datos del Dueño, Dirección QR y Veterinario */}
      <Modal
        visible={modalEditar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalEditar(false)}
      >
        <View style={estilos.modalOverlay}>
          <TouchableOpacity
            style={estilos.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalEditar(false)}
          />
          <View style={[estilos.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[estilos.sheetHandle, { backgroundColor: colors.line }]} />

            <View style={estilos.modalHeader}>
              <Text style={[estilos.modalTitulo, { color: colors.text }]}>
                Editar Datos del Dueño
              </Text>
              <TouchableOpacity onPress={() => setModalEditar(false)}>
                <Text style={[estilos.modalCerrar, { color: colors.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Nombre Completo
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
                placeholder="Tu nombre"
                placeholderTextColor={colors.muted}
                value={nombre}
                onChangeText={setNombre}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                Teléfono WhatsApp (Para el QR del collar)
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
                placeholder="+505 8888 7777"
                placeholderTextColor={colors.muted}
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                📍 Dirección / Colonia (Aparecerá en el QR de emergencia)
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
                placeholder="Ej. Villa Fontana, Managua / Zona 10..."
                placeholderTextColor={colors.muted}
                value={direccion}
                onChangeText={setDireccion}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                🩺 Nombre de tu Veterinario de confianza
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
                value={veterinarioNombre}
                onChangeText={setVeterinarioNombre}
              />

              <Text style={[estilos.campoLabel, { color: colors.muted }]}>
                🏥 Clínica / Lugar habitual de visita veterinaria
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
                value={veterinarioClinica}
                onChangeText={setVeterinarioClinica}
              />

              <TouchableOpacity
                style={[estilos.btnGuardarModal, { backgroundColor: colors.brand }]}
                onPress={handleGuardarPerfil}
                disabled={guardando}
                activeOpacity={0.85}
              >
                {guardando ? (
                  <ActivityIndicator color={colors.brandInk} size="small" />
                ) : (
                  <Text style={[estilos.btnGuardarModalTexto, { color: colors.brandInk }]}>
                    Guardar Cambios
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
  contenedor: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 40,
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    shadowColor: '#14302F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  av: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avImg: {
    width: '100%',
    height: '100%',
  },
  avLetra: {
    fontSize: 20,
    fontWeight: '800',
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  h3: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 10,
  },
  prefsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#14302F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  settingBold: {
    fontSize: 15,
    fontWeight: '800',
  },
  settingSmall: {
    fontSize: 13,
    marginTop: 1,
    fontWeight: '600',
  },
  sw: {
    width: 46,
    height: 26,
    borderRadius: 99,
    padding: 3,
    justifyContent: 'center',
  },
  swKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  logout: {
    width: '100%',
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 21, 20, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  logoutModalSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    fontWeight: '600',
  },
  logoutModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  logoutCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
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
    marginBottom: 10,
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
